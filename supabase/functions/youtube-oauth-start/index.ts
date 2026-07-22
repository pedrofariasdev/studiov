const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const AUTH_USER_PATH = "/auth/v1/user";
const BRANDS_PATH = "/rest/v1/brands";
const RPC_PATH = "/rest/v1/rpc/";
const YOUTUBE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const DEFAULT_REDIRECT_URI =
  "https://frwnelhsmcyingkblego.supabase.co/functions/v1/youtube-oauth-callback";
const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
];

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (request.method !== "POST") {
    return json({ message: "Método não permitido." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ message: "Inicie sessão para conectar o YouTube." }, 401);
  }

  const configuration = readConfiguration();
  if (!configuration) {
    return json({ message: "A integração do YouTube ainda não está configurada." }, 503);
  }

  try {
    const userId = await getAuthenticatedUser(
      configuration.supabaseUrl,
      configuration.anonKey,
      authorization,
    );

    const payload = await request.json();
    const workspaceId = readUuid(payload?.workspaceId, "workspace");
    const brandId = payload?.brandId
      ? readUuid(payload.brandId, "marca")
      : await findDefaultBrand(
          configuration.supabaseUrl,
          configuration.serviceRoleKey,
          workspaceId,
        );
    const returnUrl = readReturnUrl(payload?.returnUrl);
    const state = createState();

    await storeState({
      supabaseUrl: configuration.supabaseUrl,
      serviceRoleKey: configuration.serviceRoleKey,
      stateHash: await sha256Hex(state),
      userId,
      workspaceId,
      brandId,
      returnUrl,
      redirectUri: configuration.redirectUri,
    });

    const authorizationUrl = new URL(YOUTUBE_AUTHORIZATION_URL);
    authorizationUrl.searchParams.set("client_id", configuration.clientId);
    authorizationUrl.searchParams.set("redirect_uri", configuration.redirectUri);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", configuration.scopes.join(" "));
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("access_type", "offline");
    authorizationUrl.searchParams.set("include_granted_scopes", "true");
    authorizationUrl.searchParams.set("prompt", "consent select_account");

    return json({ authorizationUrl: authorizationUrl.toString() }, 200);
  } catch (error) {
    if (error instanceof ClientInputError) {
      return json({ message: error.message }, error.status);
    }

    return json({ message: "Não foi possível iniciar a ligação ao YouTube." }, 500);
  }
});

function readConfiguration() {
  const clientId = Deno.env.get("YOUTUBE_CLIENT_ID")?.trim();
  const redirectUri =
    Deno.env.get("YOUTUBE_REDIRECT_URI")?.trim() || DEFAULT_REDIRECT_URI;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (
    !clientId ||
    !supabaseUrl ||
    !anonKey ||
    !serviceRoleKey ||
    redirectUri !== DEFAULT_REDIRECT_URI
  ) {
    return null;
  }

  const configuredScopes =
    Deno.env.get("YOUTUBE_OAUTH_SCOPES")?.trim() || REQUIRED_SCOPES.join(" ");
  const scopes = Array.from(
    new Set(
      configuredScopes
        .split(/[\s,]+/)
        .map((scope) => scope.trim())
        .filter((scope) => scope.startsWith("https://www.googleapis.com/auth/youtube")),
    ),
  );

  if (!REQUIRED_SCOPES.every((scope) => scopes.includes(scope))) {
    return null;
  }

  return { clientId, redirectUri, supabaseUrl, anonKey, serviceRoleKey, scopes };
}

async function getAuthenticatedUser(
  supabaseUrl: string,
  anonKey: string,
  authorization: string,
) {
  const response = await fetch(supabaseUrl + AUTH_USER_PATH, {
    headers: { apikey: anonKey, Authorization: authorization },
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new ClientInputError("A sua sessão expirou. Inicie sessão novamente.", 401);
  }

  const userId = payload && typeof payload === "object"
    ? (payload as Record<string, unknown>).id
    : null;
  if (typeof userId !== "string" || !isUuid(userId)) {
    throw new ClientInputError("A sua sessão expirou. Inicie sessão novamente.", 401);
  }

  return userId;
}

async function findDefaultBrand(
  supabaseUrl: string,
  serviceRoleKey: string,
  workspaceId: string,
) {
  const url = new URL(supabaseUrl + BRANDS_PATH);
  url.searchParams.set("select", "id");
  url.searchParams.set("workspace_id", "eq." + workspaceId);
  url.searchParams.set("status", "eq.active");
  url.searchParams.set("order", "created_at.asc");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: serviceRoleHeaders(serviceRoleKey),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await readJson(response);
  const brandId = response.ok && Array.isArray(payload) && payload[0]?.id
    ? payload[0].id
    : null;

  if (typeof brandId !== "string" || !isUuid(brandId)) {
    throw new ClientInputError("Crie uma marca ativa antes de conectar o YouTube.", 400);
  }

  return brandId;
}

async function storeState(options: {
  supabaseUrl: string;
  serviceRoleKey: string;
  stateHash: string;
  userId: string;
  workspaceId: string;
  brandId: string;
  returnUrl: string;
  redirectUri: string;
}) {
  const response = await fetch(
    options.supabaseUrl + RPC_PATH + "create_youtube_oauth_state",
    {
      method: "POST",
      headers: serviceRoleHeaders(options.serviceRoleKey),
      body: JSON.stringify({
        state_hash_value: options.stateHash,
        actor_user_id_value: options.userId,
        target_workspace_id: options.workspaceId,
        target_brand_id: options.brandId,
        return_url_value: options.returnUrl,
        redirect_uri_value: options.redirectUri,
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    await response.body?.cancel();
    throw new ClientInputError(
      "Não tem permissão para conectar contas neste workspace.",
      403,
    );
  }

  await response.body?.cancel();
}

function readReturnUrl(value: unknown) {
  if (typeof value !== "string") {
    throw new ClientInputError("A página de retorno é inválida.", 400);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ClientInputError("A página de retorno é inválida.", 400);
  }

  const isProduction =
    url.protocol === "https:" &&
    ["studiov.pt", "www.studiov.pt"].includes(url.hostname) &&
    !url.port;
  const isLocal =
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);

  if (
    (!isProduction && !isLocal) ||
    url.pathname !== "/html/dashboard/settings.html" ||
    url.username ||
    url.password
  ) {
    throw new ClientInputError("A página de retorno é inválida.", 400);
  }

  return url.origin + url.pathname;
}

function readUuid(value: unknown, label: string) {
  if (typeof value !== "string" || !isUuid(value)) {
    throw new ClientInputError("Selecione um " + label + " válido.", 400);
  }
  return value;
}

function createState() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64Url(bytes);
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function serviceRoleHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: "Bearer " + serviceRoleKey,
    "Content-Type": "application/json",
  };
}

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

class ClientInputError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ClientInputError";
    this.status = status;
  }
}

import { corsHeaders } from "../_shared/cors.ts";

const AUTH_USER_PATH = "/auth/v1/user";
const BRANDS_PATH = "/rest/v1/brands";
const RPC_PATH = "/rest/v1/rpc/";
const INSTAGRAM_AUTHORIZATION_URL = "https://www.instagram.com/oauth/authorize";
const DEFAULT_SCOPES = ["instagram_business_basic"];

type StartPayload = {
  workspaceId?: unknown;
  brandId?: unknown;
  returnUrl?: unknown;
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ message: "Método não permitido." }, 405);
  }

  const authorization = request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ message: "Inicie sessão para conectar o Instagram." }, 401);
  }

  const configuration = readConfiguration();

  if (!configuration) {
    console.error("Instagram OAuth start configuration is incomplete.");
    return jsonResponse({ message: "A ligação ao Instagram ainda não está configurada." }, 503);
  }

  try {
    const userId = await getAuthenticatedUser(
      configuration.supabaseUrl,
      configuration.anonKey,
      authorization
    );
    const payload = (await request.json()) as StartPayload;
    const workspaceId = readUuid(payload?.workspaceId, "workspace");
    const brandId = payload?.brandId
      ? readUuid(payload.brandId, "marca")
      : await findDefaultBrand(
          configuration.supabaseUrl,
          configuration.serviceRoleKey,
          workspaceId
        );
    const returnUrl = readReturnUrl(payload?.returnUrl);
    const state = createState();
    const stateHash = await sha256Hex(state);

    await storeState({
      supabaseUrl: configuration.supabaseUrl,
      serviceRoleKey: configuration.serviceRoleKey,
      stateHash,
      userId,
      workspaceId,
      brandId,
      returnUrl,
    });

    const authorizationUrl = new URL(INSTAGRAM_AUTHORIZATION_URL);
    authorizationUrl.searchParams.set("enable_fb_login", "0");
    authorizationUrl.searchParams.set("force_authentication", "1");
    authorizationUrl.searchParams.set("client_id", configuration.clientId);
    authorizationUrl.searchParams.set("redirect_uri", configuration.redirectUri);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", configuration.scopes.join(","));
    authorizationUrl.searchParams.set("state", state);

    return jsonResponse({ authorizationUrl: authorizationUrl.toString() }, 200);
  } catch (error) {
    if (error instanceof ClientInputError) {
      return jsonResponse({ message: error.message }, error.status);
    }

    console.error("Instagram OAuth start failed:", safeErrorName(error));
    return jsonResponse({ message: "Não foi possível iniciar a ligação ao Instagram." }, 500);
  }
});

function readConfiguration() {
  const clientId = Deno.env.get("INSTAGRAM_APP_ID")?.trim();
  const redirectUri = Deno.env.get("INSTAGRAM_REDIRECT_URI")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!clientId || !redirectUri || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return null;
  }

  return {
    clientId,
    redirectUri,
    supabaseUrl,
    anonKey,
    serviceRoleKey,
    scopes: readScopes(),
  };
}

function readScopes() {
  const configured = Deno.env.get("INSTAGRAM_OAUTH_SCOPES")?.trim() || DEFAULT_SCOPES.join(",");
  const scopes = Array.from(
    new Set(
      configured
        .split(/[\s,]+/)
        .map((scope) => scope.trim())
        .filter(Boolean)
    )
  );

  if (
    !scopes.includes("instagram_business_basic") ||
    scopes.some((scope) => !/^instagram_business_[a-z_]+$/.test(scope))
  ) {
    throw new Error("Invalid Instagram OAuth scopes configuration.");
  }

  return scopes;
}

async function getAuthenticatedUser(supabaseUrl: string, anonKey: string, authorization: string) {
  const response = await fetch(supabaseUrl + AUTH_USER_PATH, {
    headers: {
      apikey: anonKey,
      Authorization: authorization,
    },
    signal: AbortSignal.timeout(10_000),
  });

  const payload = await readJson(response);

  if (!response.ok) {
    throw new ClientInputError("A sua sessão expirou. Inicie sessão novamente.", 401);
  }

  const userId = payload && typeof payload === "object" ? (payload as { id?: unknown }).id : null;

  if (typeof userId !== "string" || !isUuid(userId)) {
    throw new ClientInputError("A sua sessão expirou. Inicie sessão novamente.", 401);
  }

  return userId;
}

async function findDefaultBrand(supabaseUrl: string, serviceRoleKey: string, workspaceId: string) {
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

  if (!response.ok) {
    throw new Error("Unable to load an active brand.");
  }

  const brandId =
    Array.isArray(payload) && payload[0] && typeof payload[0] === "object"
      ? (payload[0] as { id?: unknown }).id
      : null;

  if (typeof brandId !== "string" || !isUuid(brandId)) {
    throw new ClientInputError("Crie uma marca ativa antes de conectar o Instagram.", 400);
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
}) {
  const response = await fetch(options.supabaseUrl + RPC_PATH + "create_instagram_oauth_state", {
    method: "POST",
    headers: serviceRoleHeaders(options.serviceRoleKey),
    body: JSON.stringify({
      state_hash_value: options.stateHash,
      actor_user_id_value: options.userId,
      target_workspace_id: options.workspaceId,
      target_brand_id: options.brandId,
      return_url_value: options.returnUrl,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new ClientInputError("Não tem permissão para conectar contas neste workspace.", 403);
  }

  await response.body?.cancel();
}

function readUuid(value: unknown, label: string) {
  if (typeof value !== "string" || !isUuid(value)) {
    throw new ClientInputError("Selecione um " + label + " válido.", 400);
  }

  return value;
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
  const isLocal = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);

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

function createState() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64Url(bytes);
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function base64Url(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function serviceRoleHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: "Bearer " + serviceRoleKey,
    "Content-Type": "application/json",
  };
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function safeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}

class ClientInputError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ClientInputError";
    this.status = status;
  }
}

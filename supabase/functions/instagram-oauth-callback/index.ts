const RPC_PATH = "/rest/v1/rpc/";
const INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const INSTAGRAM_LONG_LIVED_TOKEN_URL = "https://graph.instagram.com/access_token";
const INSTAGRAM_GRAPH_VERSION = "v24.0";
const FALLBACK_RETURN_URL = "https://studiov.pt/html/dashboard/settings.html";

type OAuthContext = {
  actor_user_id: string;
  workspace_id: string;
  brand_id: string;
  return_url: string;
};

Deno.serve(async (request: Request) => {
  if (request.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET", "Cache-Control": "no-store" },
    });
  }

  const requestUrl = new URL(request.url);
  const state = requestUrl.searchParams.get("state") || "";
  const configuration = readConfiguration();

  if (!configuration) {
    console.error("Instagram OAuth callback configuration is incomplete.");
    return redirectToSettings(FALLBACK_RETURN_URL, "error", "configuration");
  }

  if (!/^[A-Za-z0-9_-]{40,100}$/.test(state)) {
    return redirectToSettings(FALLBACK_RETURN_URL, "error", "invalid_state");
  }

  let context: OAuthContext | null = null;

  try {
    context = await consumeState(
      configuration.supabaseUrl,
      configuration.serviceRoleKey,
      await sha256Hex(state)
    );
  } catch (error) {
    console.error("Instagram OAuth state validation failed:", safeErrorName(error));
    return redirectToSettings(FALLBACK_RETURN_URL, "error", "invalid_state");
  }

  if (!context) {
    return redirectToSettings(FALLBACK_RETURN_URL, "error", "invalid_state");
  }

  const providerError = requestUrl.searchParams.get("error");

  if (providerError) {
    const status = providerError === "access_denied" ? "cancelled" : "error";
    return redirectToSettings(context.return_url, status, "provider_denied");
  }

  const code = requestUrl.searchParams.get("code") || "";

  if (!code || code.length > 4096) {
    return redirectToSettings(context.return_url, "error", "missing_code");
  }

  try {
    const shortLivedToken = await exchangeAuthorizationCode({
      clientId: configuration.clientId,
      clientSecret: configuration.clientSecret,
      redirectUri: configuration.redirectUri,
      code,
    });
    const longLivedToken = await exchangeLongLivedToken(
      configuration.clientSecret,
      shortLivedToken.accessToken
    );
    const profile = await loadInstagramProfile(longLivedToken.accessToken);
    const externalAccountId = readIdentifier(profile.id || profile.user_id);

    if (!externalAccountId) {
      throw new OAuthStepError("profile", "missing_identifier");
    }
    const username = readOptionalText(profile.username, 150);
    const accountName = readOptionalText(profile.name, 150) || username || "Conta Instagram";
    const accountType = readOptionalText(profile.account_type, 80);
    const avatarUrl = readHttpsUrl(profile.profile_picture_url);
    const profileUrl = username
      ? "https://www.instagram.com/" + encodeURIComponent(username) + "/"
      : null;
    const expiresAt = longLivedToken.expiresIn
      ? new Date(Date.now() + longLivedToken.expiresIn * 1000).toISOString()
      : null;

    await connectInstagramAccount({
      supabaseUrl: configuration.supabaseUrl,
      serviceRoleKey: configuration.serviceRoleKey,
      context,
      externalAccountId,
      accountName,
      username,
      accountType,
      avatarUrl,
      profileUrl,
      accessToken: longLivedToken.accessToken,
      expiresAt,
      scopes: configuration.scopes,
    });

    return redirectToSettings(context.return_url, "connected");
  } catch (error) {
    if (error instanceof OAuthStepError) {
      console.error("Instagram OAuth step failed:", {
        step: error.step,
        providerCode: error.providerCode,
      });
      return redirectToSettings(context.return_url, "error", error.step);
    }

    console.error("Instagram OAuth callback failed:", safeErrorName(error));
    return redirectToSettings(context.return_url, "error", "unexpected");
  }
});

function readConfiguration() {
  const clientId = Deno.env.get("INSTAGRAM_APP_ID")?.trim();
  const clientSecret = Deno.env.get("INSTAGRAM_APP_SECRET")?.trim();
  const redirectUri = Deno.env.get("INSTAGRAM_REDIRECT_URI")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!clientId || !clientSecret || !redirectUri || !supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    supabaseUrl,
    serviceRoleKey,
    scopes: readScopes(),
  };
}

function readScopes() {
  const configured = Deno.env.get("INSTAGRAM_OAUTH_SCOPES")?.trim() || "instagram_business_basic";

  return Array.from(
    new Set(
      configured
        .split(/[\s,]+/)
        .map((scope) => scope.trim())
        .filter((scope) => /^instagram_business_[a-z_]+$/.test(scope))
    )
  );
}

async function consumeState(supabaseUrl: string, serviceRoleKey: string, stateHash: string) {
  const response = await fetch(supabaseUrl + RPC_PATH + "consume_instagram_oauth_state", {
    method: "POST",
    headers: serviceRoleHeaders(serviceRoleKey),
    body: JSON.stringify({ state_hash_value: stateHash }),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error("Unable to consume OAuth state.");
  }

  const context = Array.isArray(payload) ? payload[0] : null;

  if (
    !context ||
    typeof context !== "object" ||
    !isUuid((context as OAuthContext).actor_user_id) ||
    !isUuid((context as OAuthContext).workspace_id) ||
    !isUuid((context as OAuthContext).brand_id) ||
    typeof (context as OAuthContext).return_url !== "string"
  ) {
    return null;
  }

  return context as OAuthContext;
}

async function exchangeAuthorizationCode(options: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}) {
  const response = await fetch(INSTAGRAM_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: options.clientId,
      client_secret: options.clientSecret,
      grant_type: "authorization_code",
      redirect_uri: options.redirectUri,
      code: options.code,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await readJson(response);
  const accessToken = readAccessToken(payload);
  if (!response.ok || !accessToken) {
    throw new OAuthStepError("token_exchange", readProviderErrorCode(payload));
  }

  return { accessToken };
}

async function exchangeLongLivedToken(clientSecret: string, shortLivedAccessToken: string) {
  const url = new URL(INSTAGRAM_LONG_LIVED_TOKEN_URL);
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("access_token", shortLivedAccessToken);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await readJson(response);
  const accessToken = readAccessToken(payload);
  const expiresInValue =
    payload && typeof payload === "object"
      ? (payload as { expires_in?: unknown }).expires_in
      : null;
  const expiresIn =
    typeof expiresInValue === "number" && expiresInValue > 0 ? expiresInValue : null;

  if (!response.ok || !accessToken) {
    throw new OAuthStepError("long_lived_token", readProviderErrorCode(payload));
  }

  return { accessToken, expiresIn };
}

async function loadInstagramProfile(accessToken: string) {
  const url = new URL("https://graph.instagram.com/" + INSTAGRAM_GRAPH_VERSION + "/me");
  url.searchParams.set("fields", "id,user_id,username,name,account_type,profile_picture_url");

  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + accessToken },
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await readJson(response);

  if (!response.ok || !payload || typeof payload !== "object") {
    throw new OAuthStepError("profile", readProviderErrorCode(payload));
  }

  return payload as Record<string, unknown>;
}

async function connectInstagramAccount(options: {
  supabaseUrl: string;
  serviceRoleKey: string;
  context: OAuthContext;
  externalAccountId: string;
  accountName: string;
  username: string | null;
  accountType: string | null;
  profileUrl: string | null;
  avatarUrl: string | null;
  accessToken: string;
  expiresAt: string | null;
  scopes: string[];
}) {
  const response = await fetch(options.supabaseUrl + RPC_PATH + "connect_instagram_account", {
    method: "POST",
    headers: serviceRoleHeaders(options.serviceRoleKey),
    body: JSON.stringify({
      target_workspace_id: options.context.workspace_id,
      target_brand_id: options.context.brand_id,
      actor_user_id: options.context.actor_user_id,
      external_account_id_value: options.externalAccountId,
      account_name_value: options.accountName,
      access_token_value: options.accessToken,
      username_value: options.username,
      account_type_value: options.accountType,
      profile_url_value: options.profileUrl,
      avatar_url_value: options.avatarUrl,
      scopes_value: options.scopes,
      expires_at_value: options.expiresAt,
      public_metadata_value: {
        oauth_provider: "instagram_login",
        instagram_user_id: options.externalAccountId,
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new OAuthStepError("storage", String(response.status));
  }

  await response.body?.cancel();
}

function redirectToSettings(returnUrl: string, status: string, reason?: string) {
  let url: URL;

  try {
    url = new URL(returnUrl);
  } catch {
    url = new URL(FALLBACK_RETURN_URL);
  }

  url.search = "";
  url.searchParams.set("section", "integrations");
  url.searchParams.set("instagram", status);

  if (reason) {
    url.searchParams.set("reason", reason);
  }

  url.hash = "integrations";

  return new Response(null, {
    status: 303,
    headers: {
      Location: url.toString(),
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function readAccessToken(payload: unknown) {
  const value =
    payload && typeof payload === "object"
      ? (payload as { access_token?: unknown }).access_token
      : null;

  return typeof value === "string" && value ? value : null;
}

function readProviderErrorCode(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "unknown";
  }

  const error = (payload as { error?: unknown }).error;

  if (!error || typeof error !== "object") {
    return "unknown";
  }

  const code = (error as { code?: unknown }).code;
  const subcode = (error as { error_subcode?: unknown }).error_subcode;

  return (
    [code, subcode]
      .filter((value) => typeof value === "number" || typeof value === "string")
      .join(":") || "unknown"
  );
}

function readOptionalText(value: unknown, maximumLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim().slice(0, maximumLength);
  return text || null;
}

function readIdentifier(value: unknown) {
  if (typeof value === "string") {
    const identifier = value.trim();
    return identifier && identifier.length <= 255 ? identifier : null;
  }

  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }

  return null;
}

function readHttpsUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
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

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function safeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}

class OAuthStepError extends Error {
  step: string;
  providerCode: string;

  constructor(step: string, providerCode: string) {
    super("Instagram OAuth step failed.");
    this.name = "OAuthStepError";
    this.step = step;
    this.providerCode = providerCode;
  }
}

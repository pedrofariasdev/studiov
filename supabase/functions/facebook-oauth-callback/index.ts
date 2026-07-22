const RPC_PATH = "/rest/v1/rpc/";
const GRAPH_VERSION = "v25.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const FALLBACK_RETURN_URL = "https://studiov.pt/html/dashboard/settings.html";
const FACEBOOK_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
];

type OAuthContext = {
  actor_user_id: string;
  workspace_id: string;
  brand_id: string;
  return_url: string;
  redirect_uri: string;
};

type Configuration = {
  clientId: string;
  clientSecret: string;
  supabaseUrl: string;
  serviceRoleKey: string;
};

type PageRecord = {
  id: string;
  name: string;
  accessToken: string;
  profileUrl: string | null;
  avatarUrl: string | null;
  tasks: string[];
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
      await sha256Hex(state),
    );
  } catch {
    return redirectToSettings(FALLBACK_RETURN_URL, "error", "invalid_state");
  }

  if (!context) {
    return redirectToSettings(FALLBACK_RETURN_URL, "error", "invalid_state");
  }

  const providerError = requestUrl.searchParams.get("error");
  if (providerError) {
    const outcome = providerError === "access_denied" ? "cancelled" : "error";
    const providerCode = [
      providerError,
      requestUrl.searchParams.get("error_code"),
      requestUrl.searchParams.get("error_reason"),
    ].filter(Boolean).join(":");

    await recordAttempt(
      configuration,
      context,
      outcome,
      "provider_denied",
      providerCode || null,
      null,
    );
    return redirectToSettings(context.return_url, outcome, "provider_denied");
  }

  const code = requestUrl.searchParams.get("code") || "";
  if (!code || code.length > 4096) {
    await recordAttempt(
      configuration,
      context,
      "error",
      "missing_code",
      null,
      null,
    );
    return redirectToSettings(context.return_url, "error", "missing_code");
  }

  try {
    const shortToken = await exchangeAuthorizationCode({
      clientId: configuration.clientId,
      clientSecret: configuration.clientSecret,
      redirectUri: context.redirect_uri,
      code,
    });

    const longToken = await exchangeLongLivedUserToken({
      clientId: configuration.clientId,
      clientSecret: configuration.clientSecret,
      shortToken: shortToken.accessToken,
    });

    const pages = await loadManagedPages(longToken.accessToken);
    if (pages.length === 0) {
      throw new OAuthStepError("pages", "no_managed_pages");
    }

    let storedPages = 0;
    for (const page of pages) {
      await connectFacebookPage({
        configuration,
        context,
        page,
      });
      storedPages += 1;
    }

    await recordAttempt(
      configuration,
      context,
      "success",
      "completed",
      null,
      storedPages,
    );

    return redirectToSettings(
      context.return_url,
      "connected",
      undefined,
      storedPages,
    );
  } catch (error) {
    if (error instanceof OAuthStepError) {
      await recordAttempt(
        configuration,
        context,
        "error",
        error.step,
        error.providerCode,
        null,
      );
      return redirectToSettings(context.return_url, "error", error.step);
    }

    await recordAttempt(
      configuration,
      context,
      "error",
      "unexpected",
      error instanceof Error ? error.name : "UnknownError",
      null,
    );
    return redirectToSettings(context.return_url, "error", "unexpected");
  }
});

function readConfiguration(): Configuration | null {
  const clientId = Deno.env.get("FACEBOOK_APP_ID")?.trim();
  const clientSecret = Deno.env.get("FACEBOOK_APP_SECRET")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (
    !clientId ||
    !/^\d+$/.test(clientId) ||
    !clientSecret ||
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return null;
  }

  return { clientId, clientSecret, supabaseUrl, serviceRoleKey };
}

async function consumeState(
  supabaseUrl: string,
  serviceRoleKey: string,
  stateHash: string,
): Promise<OAuthContext | null> {
  const response = await fetch(
    supabaseUrl + RPC_PATH + "consume_facebook_oauth_state",
    {
      method: "POST",
      headers: serviceRoleHeaders(serviceRoleKey),
      body: JSON.stringify({ state_hash_value: stateHash }),
      signal: AbortSignal.timeout(10_000),
    },
  );

  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error("Unable to consume Facebook OAuth state");
  }

  const context = Array.isArray(payload) ? payload[0] : null;
  if (
    !context ||
    typeof context !== "object" ||
    !isUuid((context as OAuthContext).actor_user_id) ||
    !isUuid((context as OAuthContext).workspace_id) ||
    !isUuid((context as OAuthContext).brand_id) ||
    typeof (context as OAuthContext).return_url !== "string" ||
    typeof (context as OAuthContext).redirect_uri !== "string" ||
    !isValidRedirectUri((context as OAuthContext).redirect_uri)
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
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("client_secret", options.clientSecret);
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("code", options.code);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await readJson(response);
  const accessToken = readAccessToken(payload);
  const expiresIn = readPositiveNumber(
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>).expires_in
      : null,
  );

  if (!response.ok || !accessToken) {
    throw new OAuthStepError("token_exchange", readProviderError(payload));
  }

  return { accessToken, expiresIn };
}

async function exchangeLongLivedUserToken(options: {
  clientId: string;
  clientSecret: string;
  shortToken: string;
}) {
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("client_secret", options.clientSecret);
  url.searchParams.set("fb_exchange_token", options.shortToken);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await readJson(response);
  const accessToken = readAccessToken(payload);
  const expiresIn = readPositiveNumber(
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>).expires_in
      : null,
  );

  if (!response.ok || !accessToken) {
    throw new OAuthStepError("long_lived_token", readProviderError(payload));
  }

  return { accessToken, expiresIn };
}

async function loadManagedPages(userAccessToken: string): Promise<PageRecord[]> {
  const pages: PageRecord[] = [];
  let nextUrl: string | null = buildPagesUrl(userAccessToken);
  let pageRequests = 0;

  while (nextUrl && pageRequests < 5) {
    const response = await fetch(nextUrl, {
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await readJson(response);

    if (!response.ok || !payload || typeof payload !== "object") {
      throw new OAuthStepError("pages", readProviderError(payload));
    }

    const record = payload as Record<string, unknown>;
    const data = Array.isArray(record.data) ? record.data : [];

    for (const item of data) {
      const page = parsePage(item);
      if (page) pages.push(page);
    }

    nextUrl = readNextUrl(record.paging);
    pageRequests += 1;
  }

  const unique = new Map<string, PageRecord>();
  for (const page of pages) unique.set(page.id, page);
  return Array.from(unique.values());
}

function buildPagesUrl(userAccessToken: string) {
  const url = new URL(`${GRAPH_BASE}/me/accounts`);
  url.searchParams.set(
    "fields",
    "id,name,access_token,link,tasks,picture.type(large){url}",
  );
  url.searchParams.set("limit", "100");
  url.searchParams.set("access_token", userAccessToken);
  return url.toString();
}

function parsePage(value: unknown): PageRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = readIdentifier(record.id);
  const name = readText(record.name, 150);
  const accessToken = readAccessToken(record);

  if (!id || !name || !accessToken) return null;

  const profileUrl = readOptionalUrl(record.link);
  const avatarUrl = readPictureUrl(record.picture);
  const tasks = Array.isArray(record.tasks)
    ? record.tasks
        .filter((task): task is string => typeof task === "string")
        .map((task) => task.trim())
        .filter(Boolean)
        .slice(0, 30)
    : [];

  return { id, name, accessToken, profileUrl, avatarUrl, tasks };
}

async function connectFacebookPage(options: {
  configuration: Configuration;
  context: OAuthContext;
  page: PageRecord;
}) {
  const response = await fetch(
    options.configuration.supabaseUrl + RPC_PATH + "connect_facebook_page",
    {
      method: "POST",
      headers: serviceRoleHeaders(options.configuration.serviceRoleKey),
      body: JSON.stringify({
        target_workspace_id: options.context.workspace_id,
        target_brand_id: options.context.brand_id,
        actor_user_id: options.context.actor_user_id,
        external_account_id_value: options.page.id,
        account_name_value: options.page.name,
        access_token_value: options.page.accessToken,
        profile_url_value: options.page.profileUrl,
        avatar_url_value: options.page.avatarUrl,
        scopes_value: FACEBOOK_SCOPES,
        public_metadata_value: {
          oauth_provider: "facebook_login_for_business",
          facebook_page_id: options.page.id,
          tasks: options.page.tasks,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    const payload = await readJson(response);
    throw new OAuthStepError("storage", readProviderError(payload));
  }

  await response.body?.cancel();
}

async function recordAttempt(
  configuration: Configuration,
  context: OAuthContext,
  outcome: "success" | "cancelled" | "error",
  step: string,
  providerCode: string | null,
  pageCount: number | null,
) {
  try {
    const response = await fetch(
      configuration.supabaseUrl + RPC_PATH + "record_facebook_oauth_attempt",
      {
        method: "POST",
        headers: serviceRoleHeaders(configuration.serviceRoleKey),
        body: JSON.stringify({
          actor_user_id_value: context.actor_user_id,
          target_workspace_id: context.workspace_id,
          target_brand_id: context.brand_id,
          outcome_value: outcome,
          step_value: step,
          provider_code_value: providerCode,
          page_count_value: pageCount,
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    await response.body?.cancel();
  } catch {
    // Diagnostics must never interrupt OAuth.
  }
}

function redirectToSettings(
  returnUrl: string,
  status: string,
  reason?: string,
  pageCount?: number,
) {
  let url: URL;
  try {
    url = new URL(returnUrl);
  } catch {
    url = new URL(FALLBACK_RETURN_URL);
  }

  url.search = "";
  url.searchParams.set("section", "integrations");
  url.searchParams.set("facebook", status);
  if (reason) url.searchParams.set("reason", reason);
  if (typeof pageCount === "number") {
    url.searchParams.set("pages", String(pageCount));
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

function readProviderError(payload: unknown) {
  if (!payload || typeof payload !== "object") return "unknown";
  const record = payload as Record<string, unknown>;
  const nested = record.error;

  if (nested && typeof nested === "object") {
    const error = nested as Record<string, unknown>;
    const message = typeof error.message === "string"
      ? error.message.slice(0, 150)
      : null;
    return [error.type, error.code, error.error_subcode, message]
      .filter((value) => typeof value === "string" || typeof value === "number")
      .join(":") || "unknown";
  }

  return "unknown";
}

function readAccessToken(payload: unknown) {
  const value = payload && typeof payload === "object"
    ? (payload as Record<string, unknown>).access_token
    : null;
  return typeof value === "string" && value ? value : null;
}

function readPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function readIdentifier(value: unknown) {
  if (typeof value === "string") {
    const result = value.trim();
    return result && result.length <= 255 ? result : null;
  }
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }
  return null;
}

function readText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, maxLength);
  return text || null;
}

function readOptionalUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function readPictureUrl(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const data = (value as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return null;
  return readOptionalUrl((data as Record<string, unknown>).url);
}

function readNextUrl(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const next = (value as Record<string, unknown>).next;
  if (typeof next !== "string") return null;
  try {
    const url = new URL(next);
    return url.protocol === "https:" && url.hostname === "graph.facebook.com"
      ? url.toString()
      : null;
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
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isValidRedirectUri(value: string) {
  return value === "https://frwnelhsmcyingkblego.supabase.co/functions/v1/facebook-oauth-callback";
}

class OAuthStepError extends Error {
  step: string;
  providerCode: string;

  constructor(step: string, providerCode: string) {
    super("Facebook OAuth step failed");
    this.name = "OAuthStepError";
    this.step = step;
    this.providerCode = providerCode;
  }
}

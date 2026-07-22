const RPC_PATH = "/rest/v1/rpc/";
const YOUTUBE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";
const FALLBACK_RETURN_URL = "https://studiov.pt/html/dashboard/settings.html";
const DEFAULT_REDIRECT_URI =
  "https://frwnelhsmcyingkblego.supabase.co/functions/v1/youtube-oauth-callback";
const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
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
  scopes: string[];
};

type TokenSet = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  scopes: string[];
  expiresAt: string;
};

type YouTubeChannel = {
  id: string;
  title: string;
  handle: string | null;
  profileUrl: string;
  avatarUrl: string | null;
  uploadsPlaylistId: string | null;
  subscriberCount: string | null;
  videoCount: string | null;
  viewCount: string | null;
  privacyStatus: string | null;
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
      requestUrl.searchParams.get("error_subtype"),
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
    const tokens = await exchangeAuthorizationCode({
      clientId: configuration.clientId,
      clientSecret: configuration.clientSecret,
      redirectUri: context.redirect_uri,
      code,
      requestedScopes: configuration.scopes,
    });
    const channels = await loadYouTubeChannels(tokens.accessToken);

    if (channels.length === 0) {
      throw new OAuthStepError("channels", "no_channels");
    }

    let storedChannels = 0;
    for (const channel of channels) {
      await connectYouTubeChannel({
        configuration,
        context,
        tokens,
        channel,
      });
      storedChannels += 1;
    }

    await recordAttempt(
      configuration,
      context,
      "success",
      "completed",
      null,
      storedChannels,
    );

    return redirectToSettings(
      context.return_url,
      "connected",
      undefined,
      storedChannels,
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
  const clientId = Deno.env.get("YOUTUBE_CLIENT_ID")?.trim();
  const clientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET")?.trim();
  const redirectUri =
    Deno.env.get("YOUTUBE_REDIRECT_URI")?.trim() || DEFAULT_REDIRECT_URI;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (
    !clientId ||
    !clientSecret ||
    !supabaseUrl ||
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

  return { clientId, clientSecret, supabaseUrl, serviceRoleKey, scopes };
}

async function consumeState(
  supabaseUrl: string,
  serviceRoleKey: string,
  stateHash: string,
): Promise<OAuthContext | null> {
  const response = await fetch(
    supabaseUrl + RPC_PATH + "consume_youtube_oauth_state",
    {
      method: "POST",
      headers: serviceRoleHeaders(serviceRoleKey),
      body: JSON.stringify({ state_hash_value: stateHash }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error("Unable to consume YouTube OAuth state");
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
  requestedScopes: string[];
}): Promise<TokenSet> {
  const body = new URLSearchParams({
    client_id: options.clientId,
    client_secret: options.clientSecret,
    redirect_uri: options.redirectUri,
    grant_type: "authorization_code",
    code: options.code,
  });
  const response = await fetch(YOUTUBE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await readJson(response);
  const record = payload && typeof payload === "object"
    ? payload as Record<string, unknown>
    : {};
  const accessToken = readRequiredText(record.access_token, 8192);
  const refreshToken = readRequiredText(record.refresh_token, 8192);
  const tokenType = readOptionalText(record.token_type, 40) || "Bearer";
  const expiresIn = readPositiveNumber(record.expires_in);
  const grantedScopes = readScopes(record.scope, options.requestedScopes);

  if (!response.ok || !accessToken) {
    throw new OAuthStepError("token_exchange", readProviderError(payload));
  }
  if (!refreshToken) {
    throw new OAuthStepError("refresh_token", "missing_refresh_token");
  }
  if (!expiresIn) {
    throw new OAuthStepError("token_exchange", "missing_expiry");
  }
  if (!REQUIRED_SCOPES.every((scope) => grantedScopes.includes(scope))) {
    throw new OAuthStepError("permissions", "insufficient_scope");
  }

  return {
    accessToken,
    refreshToken,
    tokenType,
    scopes: grantedScopes,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
}

async function loadYouTubeChannels(accessToken: string): Promise<YouTubeChannel[]> {
  const url = new URL(YOUTUBE_CHANNELS_URL);
  url.searchParams.set("part", "snippet,contentDetails,statistics,status");
  url.searchParams.set("mine", "true");
  url.searchParams.set("maxResults", "50");

  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + accessToken },
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await readJson(response);

  if (!response.ok || !payload || typeof payload !== "object") {
    throw new OAuthStepError("channels", readProviderError(payload));
  }

  const items = Array.isArray((payload as Record<string, unknown>).items)
    ? (payload as Record<string, unknown>).items as unknown[]
    : [];
  const unique = new Map<string, YouTubeChannel>();

  for (const item of items) {
    const channel = parseChannel(item);
    if (channel) unique.set(channel.id, channel);
  }

  return Array.from(unique.values());
}

function parseChannel(value: unknown): YouTubeChannel | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const snippet = asRecord(record.snippet);
  const contentDetails = asRecord(record.contentDetails);
  const relatedPlaylists = asRecord(contentDetails?.relatedPlaylists);
  const statistics = asRecord(record.statistics);
  const status = asRecord(record.status);
  const id = readIdentifier(record.id);
  const title = readOptionalText(snippet?.title, 150);

  if (!id || !title) return null;

  const handle = readOptionalText(snippet?.customUrl, 150);

  return {
    id,
    title,
    handle,
    profileUrl: "https://www.youtube.com/channel/" + encodeURIComponent(id),
    avatarUrl: readThumbnailUrl(snippet?.thumbnails),
    uploadsPlaylistId: readIdentifier(relatedPlaylists?.uploads),
    subscriberCount: readIdentifier(statistics?.subscriberCount),
    videoCount: readIdentifier(statistics?.videoCount),
    viewCount: readIdentifier(statistics?.viewCount),
    privacyStatus: readOptionalText(status?.privacyStatus, 40),
  };
}

async function connectYouTubeChannel(options: {
  configuration: Configuration;
  context: OAuthContext;
  tokens: TokenSet;
  channel: YouTubeChannel;
}) {
  const response = await fetch(
    options.configuration.supabaseUrl + RPC_PATH + "connect_youtube_channel",
    {
      method: "POST",
      headers: serviceRoleHeaders(options.configuration.serviceRoleKey),
      body: JSON.stringify({
        target_workspace_id: options.context.workspace_id,
        target_brand_id: options.context.brand_id,
        actor_user_id: options.context.actor_user_id,
        external_account_id_value: options.channel.id,
        account_name_value: options.channel.title,
        access_token_value: options.tokens.accessToken,
        refresh_token_value: options.tokens.refreshToken,
        username_value: options.channel.handle,
        profile_url_value: options.channel.profileUrl,
        avatar_url_value: options.channel.avatarUrl,
        token_type_value: options.tokens.tokenType,
        scopes_value: options.tokens.scopes,
        expires_at_value: options.tokens.expiresAt,
        public_metadata_value: {
          oauth_provider: "google",
          youtube_channel_id: options.channel.id,
          handle: options.channel.handle,
          uploads_playlist_id: options.channel.uploadsPlaylistId,
          subscriber_count: options.channel.subscriberCount,
          video_count: options.channel.videoCount,
          view_count: options.channel.viewCount,
          privacy_status: options.channel.privacyStatus,
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
  channelCount: number | null,
) {
  try {
    const response = await fetch(
      configuration.supabaseUrl + RPC_PATH + "record_youtube_oauth_attempt",
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
          channel_count_value: channelCount,
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
  channelCount?: number,
) {
  let url: URL;
  try {
    url = new URL(returnUrl);
  } catch {
    url = new URL(FALLBACK_RETURN_URL);
  }

  url.search = "";
  url.searchParams.set("section", "integrations");
  url.searchParams.set("youtube", status);
  if (reason) url.searchParams.set("reason", reason);
  if (typeof channelCount === "number") {
    url.searchParams.set("channels", String(channelCount));
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

function readScopes(value: unknown, fallback: string[]) {
  const scopes = typeof value === "string"
    ? value.split(/\s+/).map((scope) => scope.trim()).filter(Boolean)
    : fallback;
  return Array.from(new Set(scopes.filter((scope) => scope.startsWith(
    "https://www.googleapis.com/auth/youtube",
  ))));
}

function readThumbnailUrl(value: unknown) {
  const thumbnails = asRecord(value);
  for (const key of ["high", "medium", "default"]) {
    const candidate = asRecord(thumbnails?.[key]);
    const url = readOptionalUrl(candidate?.url);
    if (url) return url;
  }
  return null;
}

function readProviderError(payload: unknown) {
  const record = asRecord(payload);
  const nested = asRecord(record?.error);
  const message = readOptionalText(nested?.message, 150);
  const code = readOptionalText(record?.error, 80) ||
    readOptionalText(nested?.status, 80) ||
    (typeof nested?.code === "number" ? String(nested.code) : null);
  return [code, message].filter(Boolean).join(":") || "unknown";
}

function readRequiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text && text.length <= maxLength ? text : null;
}

function readOptionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, maxLength);
  return text || null;
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

function readPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : null;
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
  return value === DEFAULT_REDIRECT_URI;
}

class OAuthStepError extends Error {
  step: string;
  providerCode: string;

  constructor(step: string, providerCode: string) {
    super("YouTube OAuth step failed");
    this.name = "OAuthStepError";
    this.step = step;
    this.providerCode = providerCode;
  }
}

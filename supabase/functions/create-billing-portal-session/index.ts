import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type PortalRequest = {
  workspace_id?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  origin = "*",
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    },
  });
}

function getSafeOrigin(req: Request) {
  const configuredAppUrl = Deno.env.get("APP_URL")?.trim();
  const requestOrigin = req.headers.get("origin")?.trim();
  const candidate = configuredAppUrl || requestOrigin;

  if (!candidate) return null;

  try {
    const parsed = new URL(candidate);

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

async function createStripePortalSession(
  secretKey: string,
  customerId: string,
  returnUrl: string,
) {
  const body = new URLSearchParams();

  body.set("customer", customerId);
  body.set("return_url", returnUrl);

  const response = await fetch(
    "https://api.stripe.com/v1/billing_portal/sessions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        "Não foi possível abrir o portal de faturação.",
    );
  }

  return payload;
}

Deno.serve(async (req: Request) => {
  const requestOrigin = req.headers.get("origin") || "*";

  if (req.method === "OPTIONS") {
    return jsonResponse({ ok: true }, 200, requestOrigin);
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Método não permitido." },
      405,
      requestOrigin,
    );
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    if (!stripeSecretKey) {
      return jsonResponse(
        { error: "A chave da Stripe não está configurada." },
        500,
        requestOrigin,
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(
        { error: "Configuração interna do Supabase incompleta." },
        500,
        requestOrigin,
      );
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        { error: "Sessão inválida." },
        401,
        requestOrigin,
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        { error: "Sessão inválida ou expirada." },
        401,
        requestOrigin,
      );
    }

    let body: PortalRequest;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        { error: "Pedido inválido." },
        400,
        requestOrigin,
      );
    }

    const workspaceId = body.workspace_id?.trim();

    if (!workspaceId || !UUID_PATTERN.test(workspaceId)) {
      return jsonResponse(
        { error: "Workspace inválido." },
        400,
        requestOrigin,
      );
    }

    const { data: canViewBilling, error: permissionError } =
      await supabaseClient.rpc("can_view_billing", {
        workspace_id_value: workspaceId,
      });

    if (permissionError || canViewBilling !== true) {
      return jsonResponse(
        { error: "Não possui permissão para gerir esta subscrição." },
        403,
        requestOrigin,
      );
    }

    const { data: subscription, error: subscriptionError } =
      await supabaseClient
        .from("workspace_subscriptions")
        .select(
          "provider, provider_customer_id, provider_subscription_id, status, is_current",
        )
        .eq("workspace_id", workspaceId)
        .eq("is_current", true)
        .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (
      !subscription ||
      subscription.provider !== "stripe" ||
      !subscription.provider_customer_id
    ) {
      return jsonResponse(
        { error: "Este workspace ainda não possui uma subscrição Stripe gerível." },
        409,
        requestOrigin,
      );
    }

    const appOrigin = getSafeOrigin(req);

    if (!appOrigin) {
      return jsonResponse(
        { error: "Não foi possível determinar a URL de retorno." },
        400,
        requestOrigin,
      );
    }

    const returnUrl =
      `${appOrigin}/html/dashboard/settings.html` +
      `?section=billing&portal=return`;

    const session = await createStripePortalSession(
      stripeSecretKey,
      subscription.provider_customer_id,
      returnUrl,
    );

    if (!session?.url) {
      throw new Error("A Stripe não devolveu a URL do portal.");
    }

    return jsonResponse(
      {
        url: session.url,
      },
      200,
      requestOrigin,
    );
  } catch (error) {
    console.error("create-billing-portal-session error:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao abrir o portal de faturação.",
      },
      500,
      requestOrigin,
    );
  }
});

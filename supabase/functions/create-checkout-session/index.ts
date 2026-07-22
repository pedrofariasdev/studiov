import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type CheckoutRequest = {
  action_type?: "credit_pack" | "subscription";
  workspace_id?: string;
  code?: string;
  billing_interval?: "monthly" | "yearly";
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

async function stripeRequest(
  path: string,
  secretKey: string,
  body: URLSearchParams,
) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        "Não foi possível comunicar com a Stripe.",
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
        {
          error:
            "A variável STRIPE_SECRET_KEY não está disponível na Edge Function.",
        },
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

    let body: CheckoutRequest;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        { error: "Pedido inválido." },
        400,
        requestOrigin,
      );
    }

    const actionType = body.action_type;
    const workspaceId = body.workspace_id?.trim();
    const code = body.code?.trim();
    const billingInterval = body.billing_interval;

    if (
      (actionType !== "credit_pack" && actionType !== "subscription") ||
      !workspaceId ||
      !UUID_PATTERN.test(workspaceId) ||
      !code
    ) {
      return jsonResponse(
        { error: "Dados de faturação inválidos." },
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
        {
          error:
            "Não possui permissão para gerir a faturação deste workspace.",
        },
        403,
        requestOrigin,
      );
    }

    const appOrigin = getSafeOrigin(req);

    if (!appOrigin) {
      return jsonResponse(
        {
          error:
            "Não foi possível determinar a URL de retorno da aplicação.",
        },
        400,
        requestOrigin,
      );
    }

    let stripePriceId: string | null = null;
    let checkoutMode: "payment" | "subscription";
    let itemName = "";

    if (actionType === "credit_pack") {
      const { data: pack, error: packError } = await supabaseClient
        .from("ai_credit_packs")
        .select("code, name, stripe_price_id")
        .eq("code", code)
        .eq("is_active", true)
        .eq("is_public", true)
        .maybeSingle();

      if (packError || !pack) {
        return jsonResponse(
          { error: "Pacote de créditos não encontrado." },
          404,
          requestOrigin,
        );
      }

      stripePriceId = pack.stripe_price_id;
      checkoutMode = "payment";
      itemName = pack.name;
    } else {
      if (billingInterval !== "monthly" && billingInterval !== "yearly") {
        return jsonResponse(
          { error: "Periodicidade do plano inválida." },
          400,
          requestOrigin,
        );
      }

      const { data: plan, error: planError } = await supabaseClient
        .from("billing_plans")
        .select(
          "code, name, stripe_monthly_price_id, stripe_yearly_price_id",
        )
        .eq("code", code)
        .eq("is_active", true)
        .eq("is_public", true)
        .maybeSingle();

      if (planError || !plan) {
        return jsonResponse(
          { error: "Plano não encontrado." },
          404,
          requestOrigin,
        );
      }

      stripePriceId =
        billingInterval === "monthly"
          ? plan.stripe_monthly_price_id
          : plan.stripe_yearly_price_id;

      checkoutMode = "subscription";
      itemName = `${plan.name} (${billingInterval})`;
    }

    if (!stripePriceId) {
      return jsonResponse(
        {
          error:
            "Este item ainda não possui um preço Stripe configurado.",
        },
        409,
        requestOrigin,
      );
    }

    const { data: currentSubscription, error: subscriptionError } =
      await supabaseClient
        .from("workspace_subscriptions")
        .select(
          "provider, provider_subscription_id, provider_customer_id, status",
        )
        .eq("workspace_id", workspaceId)
        .eq("is_current", true)
        .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (
      actionType === "subscription" &&
      currentSubscription?.provider === "stripe" &&
      currentSubscription?.provider_subscription_id &&
      ["active", "trialing", "past_due"].includes(
        currentSubscription.status,
      )
    ) {
      return jsonResponse(
        {
          error:
            "Este workspace já possui uma subscrição Stripe. Utilize a gestão de pagamento para alterar o plano.",
          code: "existing_subscription",
        },
        409,
        requestOrigin,
      );
    }

    const successUrl =
      `${appOrigin}/html/dashboard/settings.html` +
      `?section=billing&payment=success` +
      `&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl =
      `${appOrigin}/html/dashboard/settings.html` +
      `?section=billing&payment=cancelled`;

    const sessionParams = new URLSearchParams();

    sessionParams.set("mode", checkoutMode);
    sessionParams.set("success_url", successUrl);
    sessionParams.set("cancel_url", cancelUrl);
    sessionParams.set("client_reference_id", workspaceId);
    sessionParams.set("line_items[0][price]", stripePriceId);
    sessionParams.set("line_items[0][quantity]", "1");
    sessionParams.set("metadata[workspace_id]", workspaceId);
    sessionParams.set("metadata[action_type]", actionType);
    sessionParams.set("metadata[code]", code);
    sessionParams.set("metadata[user_id]", user.id);
    sessionParams.set("metadata[item_name]", itemName);

    const stripeCustomerId = currentSubscription?.provider_customer_id;

    if (stripeCustomerId) {
      sessionParams.set("customer", stripeCustomerId);
    } else if (user.email) {
      sessionParams.set("customer_email", user.email);

      if (actionType === "credit_pack") {
        sessionParams.set("customer_creation", "always");
      }
    }

    if (actionType === "credit_pack") {
      sessionParams.set("invoice_creation[enabled]", "true");
      sessionParams.set(
        "payment_intent_data[metadata][workspace_id]",
        workspaceId,
      );
      sessionParams.set(
        "payment_intent_data[metadata][action_type]",
        actionType,
      );
      sessionParams.set(
        "payment_intent_data[metadata][code]",
        code,
      );
    } else {
      sessionParams.set(
        "metadata[billing_interval]",
        billingInterval!,
      );
      sessionParams.set(
        "subscription_data[metadata][workspace_id]",
        workspaceId,
      );
      sessionParams.set(
        "subscription_data[metadata][plan_code]",
        code,
      );
      sessionParams.set(
        "subscription_data[metadata][billing_interval]",
        billingInterval!,
      );
    }

    const session = await stripeRequest(
      "checkout/sessions",
      stripeSecretKey,
      sessionParams,
    );

    if (!session?.url) {
      throw new Error("A Stripe não devolveu uma URL de checkout.");
    }

    return jsonResponse(
      {
        url: session.url,
        session_id: session.id,
      },
      200,
      requestOrigin,
    );
  } catch (error) {
    console.error("create-checkout-session error:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao criar o checkout.",
      },
      500,
      requestOrigin,
    );
  }
});

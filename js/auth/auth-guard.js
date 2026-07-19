"use strict";

/* ==========================================================
   StudioV — Proteção das páginas autenticadas
========================================================== */

(function initializeStudioVAuthGuard() {
  const ROUTES = {
    login: "/html/auth/login.html",
    verifyEmail: "/html/auth/verify-email.html",
    completeAccount: "/html/auth/complete-account.html",
  };

  const STORAGE_KEYS = {
    demoMode: "studiov_demo_mode",
    demoUserId: "studiov_demo_user_id",
    tourCompleted: "studiov_demo_tour_completed",
    pendingEmail: "studiov_account_pending_email",
    pendingName: "studiov_account_pending_name",
    workspaceId: "studiov_active_workspace_id",
  };

  const PLAN_FEATURE_ROUTES = {
    "/html/dashboard/brands.html": {
      feature: "multi_brand_management",
      title: "Múltiplas marcas",
      plan: "Pro",
    },
    "/html/dashboard/clients.html": {
      feature: "client_management",
      title: "Gestão de clientes",
      plan: "Pro",
    },
    "/html/dashboard/planner.html": {
      feature: "content_planner",
      title: "Planner de produção",
      plan: "Pro",
    },
    "/html/dashboard/analytics.html": {
      feature: "analytics",
      title: "Analytics completo",
      plan: "Pro",
    },
  };

  const PLAN_NAVIGATION_RULES = [
    {
      href: "/html/dashboard/brands.html",
      feature: "multi_brand_management",
      plan: "Pro",
      hideWhenLocked: true,
    },
    {
      href: "/html/dashboard/clients.html",
      feature: "client_management",
      plan: "Pro",
    },
    {
      href: "/html/dashboard/planner.html",
      feature: "content_planner",
      plan: "Pro",
    },
    {
      href: "/html/dashboard/analytics.html",
      feature: "analytics",
      plan: "Pro",
    },
  ];

  window.studioVAuthState = null;

  const authenticationReady =
    validateAuthenticatedPage();

  window.studioVAuthReady =
    authenticationReady.then(
      validateDashboardPlanAccess
    );


  /* ========================================================
     Cliente Supabase
  ======================================================== */

  function getSupabaseClient() {
    return window.supabaseClient || null;
  }


  /* ========================================================
     Direitos do plano
  ======================================================== */

  async function validateDashboardPlanAccess(user) {
    if (!user) {
      return null;
    }

    const client = getSupabaseClient();
    const currentPath = normalizePath(
      window.location.pathname
    );
    const routeRequirement =
      PLAN_FEATURE_ROUTES[currentPath] ||
      null;

    injectPlanAccessStyles();

    try {
      const storedWorkspaceId =
        getStorageValue(
          STORAGE_KEYS.workspaceId
        );

      let entitlementResponse =
        await loadWorkspaceEntitlements(
          client,
          storedWorkspaceId
        );

      if (
        entitlementResponse.error &&
        storedWorkspaceId
      ) {
        entitlementResponse =
          await loadWorkspaceEntitlements(
            client,
            null
          );
      }

      if (entitlementResponse.error) {
        throw entitlementResponse.error;
      }

      const entitlements =
        entitlementResponse.data || null;

      if (!entitlements?.workspaceId) {
        throw new Error(
          "Direitos do workspace indisponíveis."
        );
      }

      window.studioVEntitlements =
        entitlements;

      window.studioVPlanAccessReady =
        Promise.resolve(entitlements);

      setStorageValue(
        STORAGE_KEYS.workspaceId,
        entitlements.workspaceId
      );

      applyPlanNavigation(entitlements);
      applyDashboardHomePlanAccess(
        entitlements
      );
      applySettingsPlanAccess(
        entitlements
      );

      if (
        routeRequirement &&
        !hasPlanFeature(
          entitlements,
          routeRequirement.feature
        )
      ) {
        window.studioVPageAccessDenied =
          true;

        renderPlanBlockedPage(
          routeRequirement,
          entitlements
        );

        return null;
      }

      window.studioVPageAccessDenied =
        false;

      return user;
    } catch (error) {
      console.error(
        "Não foi possível validar os recursos do plano:",
        error?.message || error
      );

      window.studioVPlanAccessReady =
        Promise.resolve(null);

      if (routeRequirement) {
        window.studioVPageAccessDenied =
          true;

        renderPlanAccessUnavailable();

        return null;
      }

      return user;
    }
  }


  async function loadWorkspaceEntitlements(
    client,
    workspaceId
  ) {
    return client.rpc(
      "get_workspace_entitlements",
      {
        workspace_id_value:
          isUuid(workspaceId)
            ? workspaceId
            : null,
      }
    );
  }


  function hasPlanFeature(
    entitlements,
    feature
  ) {
    return entitlements?.features?.[feature] ===
      true;
  }


  function applyPlanNavigation(
    entitlements
  ) {
    PLAN_NAVIGATION_RULES.forEach(
      function (rule) {
        const links =
          document.querySelectorAll(
            `a[href="${rule.href}"]`
          );

        links.forEach(function (link) {
          if (
            hasPlanFeature(
              entitlements,
              rule.feature
            )
          ) {
            return;
          }

          if (rule.hideWhenLocked) {
            const listItem =
              link.closest("li");

            hidePlanElement(
              listItem || link
            );

            return;
          }

          lockPlanControl(
            link,
            rule.feature,
            rule.plan
          );
        });
      }
    );

    setupLockedControlHandler();
    window.lucide?.createIcons();
  }


  function applyDashboardHomePlanAccess(
    entitlements
  ) {
    if (
      !hasPlanFeature(
        entitlements,
        "multi_brand_management"
      )
    ) {
      hidePlanElement(
        document
          .getElementById("brands-count")
          ?.closest("article")
      );
    }

    if (
      !hasPlanFeature(
        entitlements,
        "client_management"
      )
    ) {
      hidePlanElement(
        document
          .getElementById("clients-count")
          ?.closest("article")
      );
    }

    if (
      !hasPlanFeature(
        entitlements,
        "content_planner"
      )
    ) {
      hidePlanElement(
        document
          .querySelector(
            '.dashboard-panel a[href="/html/dashboard/planner.html"]'
          )
          ?.closest(".dashboard-panel")
      );
    }
  }


  function hidePlanElement(element) {
    if (!element) {
      return;
    }

    element.hidden = true;
    element.classList.add(
      "plan-access-hidden"
    );

    element.setAttribute(
      "aria-hidden",
      "true"
    );

    element.parentElement?.classList.add(
      "plan-access-has-hidden-items"
    );
  }


  function applySettingsPlanAccess(
    entitlements
  ) {
    if (
      hasPlanFeature(
        entitlements,
        "team_management"
      )
    ) {
      return;
    }

    const membersButton =
      document.querySelector(
        '[data-settings-section="members"]'
      );

    if (membersButton) {
      lockPlanControl(
        membersButton,
        "team_management",
        "Empresa"
      );
    }

    const inviteForm =
      document.getElementById(
        "settings-invite-member-form"
      );

    if (inviteForm) {
      inviteForm
        .querySelectorAll(
          "input, select, button"
        )
        .forEach(function (control) {
          control.disabled = true;
        });
    }
  }


  function lockPlanControl(
    control,
    feature,
    plan
  ) {
    control.dataset.planAccessLocked =
      "true";

    control.dataset.planFeature =
      feature;

    control.dataset.requiredPlan =
      plan;

    control.classList.add(
      "plan-access-locked-control"
    );

    control.setAttribute(
      "aria-disabled",
      "true"
    );

    if (
      !control.querySelector(
        ".plan-access-badge"
      )
    ) {
      const badge =
        document.createElement("span");

      badge.className =
        "plan-access-badge";

      badge.textContent = plan;
      control.appendChild(badge);
    }
  }


  function setupLockedControlHandler() {
    if (
      document.documentElement.dataset
        .planAccessHandler === "true"
    ) {
      return;
    }

    document.documentElement.dataset
      .planAccessHandler = "true";

    document.addEventListener(
      "click",
      function (event) {
        const lockedControl =
          event.target.closest(
            '[data-plan-access-locked="true"]'
          );

        if (!lockedControl) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        showPlanUpgradeDialog(
          lockedControl.dataset
            .requiredPlan || "Pro"
        );
      },
      true
    );
  }


  function renderPlanBlockedPage(
    requirement,
    entitlements
  ) {
    const main =
      document.querySelector(
        ".dashboard-content"
      ) || document.querySelector("main");

    if (!main) {
      showPlanUpgradeDialog(
        requirement.plan
      );

      return;
    }

    const section =
      createPlanMessage({
        icon: "lock-keyhole",
        eyebrow:
          `Plano ${entitlements.planName}`,
        title:
          `${requirement.title} está disponível no plano ${requirement.plan}`,
        description:
          "O seu plano atual continua com acesso à IA, criação de conteúdos, calendário, agendamento e publicações.",
        actionLabel: "Comparar planos",
      });

    main.replaceChildren(section);
    main.classList.add(
      "plan-access-page"
    );

    window.lucide?.createIcons();
  }


  function renderPlanAccessUnavailable() {
    const main =
      document.querySelector(
        ".dashboard-content"
      ) || document.querySelector("main");

    if (!main) {
      return;
    }

    const section =
      createPlanMessage({
        icon: "circle-alert",
        eyebrow: "Acesso indisponível",
        title:
          "Não foi possível confirmar o seu plano",
        description:
          "Atualize a página para tentar novamente. Nenhum recurso restrito foi carregado.",
        actionLabel: "Voltar ao dashboard",
        actionHref:
          "/html/dashboard/home.html",
      });

    main.replaceChildren(section);
    main.classList.add(
      "plan-access-page"
    );

    window.lucide?.createIcons();
  }


  function createPlanMessage(options) {
    const section =
      document.createElement("section");

    section.className =
      "plan-access-message";

    const icon =
      document.createElement("span");

    icon.className =
      "plan-access-message-icon";

    const iconElement =
      document.createElement("i");

    iconElement.setAttribute(
      "data-lucide",
      options.icon
    );

    icon.appendChild(iconElement);

    const eyebrow =
      document.createElement("span");

    eyebrow.className =
      "plan-access-message-eyebrow";

    eyebrow.textContent =
      options.eyebrow;

    const title =
      document.createElement("h1");

    title.textContent = options.title;

    const description =
      document.createElement("p");

    description.textContent =
      options.description;

    const actions =
      document.createElement("div");

    actions.className =
      "plan-access-message-actions";

    const primaryAction =
      document.createElement("a");

    primaryAction.className =
      "btn btn-primary";

    primaryAction.href =
      options.actionHref ||
      "/html/landing/pricing.html";

    primaryAction.textContent =
      options.actionLabel;

    const dashboardAction =
      document.createElement("a");

    dashboardAction.className =
      "btn btn-secondary";

    dashboardAction.href =
      "/html/dashboard/home.html";

    dashboardAction.textContent =
      "Voltar ao dashboard";

    actions.appendChild(primaryAction);

    if (
      primaryAction.href !==
      dashboardAction.href
    ) {
      actions.appendChild(
        dashboardAction
      );
    }

    section.append(
      icon,
      eyebrow,
      title,
      description,
      actions
    );

    return section;
  }


  function showPlanUpgradeDialog(plan) {
    let dialog =
      document.getElementById(
        "plan-upgrade-dialog"
      );

    if (!dialog) {
      dialog =
        document.createElement("div");

      dialog.id = "plan-upgrade-dialog";
      dialog.className =
        "plan-upgrade-dialog";

      dialog.setAttribute(
        "role",
        "dialog"
      );

      dialog.setAttribute(
        "aria-modal",
        "true"
      );

      dialog.innerHTML = `
        <div class="plan-upgrade-dialog-card">
          <button class="plan-upgrade-dialog-close" type="button" aria-label="Fechar">
            <i data-lucide="x"></i>
          </button>
          <span class="plan-access-message-icon" aria-hidden="true">
            <i data-lucide="lock-keyhole"></i>
          </span>
          <span class="plan-access-message-eyebrow">Recurso adicional</span>
          <h2></h2>
          <p>Compare os planos para escolher os recursos adequados à sua utilização.</p>
          <div class="plan-access-message-actions">
            <a class="btn btn-primary" href="/html/landing/pricing.html">Comparar planos</a>
            <button class="btn btn-secondary" type="button" data-close-plan-dialog>Continuar aqui</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      dialog.addEventListener(
        "click",
        function (event) {
          if (
            event.target === dialog ||
            event.target.closest(
              ".plan-upgrade-dialog-close, [data-close-plan-dialog]"
            )
          ) {
            dialog.classList.remove(
              "is-open"
            );
          }
        }
      );
    }

    const title =
      dialog.querySelector("h2");

    if (title) {
      title.textContent =
        `Disponível no plano ${plan}`;
    }

    dialog.classList.add("is-open");
    window.lucide?.createIcons();
  }


  function injectPlanAccessStyles() {
    if (
      document.querySelector(
        'link[data-plan-access-styles="true"]'
      )
    ) {
      return;
    }

    const stylesheet =
      document.createElement("link");

    stylesheet.rel = "stylesheet";
    stylesheet.href =
      "/css/components/plan-access.css";

    stylesheet.dataset.planAccessStyles =
      "true";

    document.head.appendChild(
      stylesheet
    );
  }


  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(value || "")
    );
  }


  /* ========================================================
     Validar página autenticada
  ======================================================== */

  async function validateAuthenticatedPage() {
    const client = getSupabaseClient();

    if (!client) {
      console.error(
        "O cliente Supabase não foi encontrado."
      );

      redirectTo(ROUTES.login);

      return null;
    }

    try {
      const {
        data,
        error,
      } = await client.auth.getUser();

      if (error) {
        console.error(
          "Erro ao validar utilizador:",
          error.message
        );

        redirectTo(ROUTES.login);

        return null;
      }

      const user = data?.user || null;

      if (!user) {
        redirectTo(ROUTES.login);

        return null;
      }

      const authState =
        resolveAuthenticationState(user);

      window.studioVAuthState =
        authState;

      console.log(
        "Estado de autenticação:",
        authState.status
      );

      /*
       * Conta demo normal.
       *
       * O utilizador ainda não iniciou
       * a conversão para conta permanente.
       */

      if (authState.status === "demo") {
        activateDemoMode(user);

        return user;
      }

      /*
       * O email foi solicitado, mas ainda
       * não foi confirmado.
       */

      if (
        authState.status ===
        "awaiting_email_confirmation"
      ) {
        activateDemoMode(user);

        redirectTo(
          ROUTES.verifyEmail
        );

        return null;
      }

      /*
       * O email já foi confirmado,
       * mas falta definir uma palavra-passe.
       */

      if (
        authState.status ===
        "awaiting_password"
      ) {
        redirectTo(
          ROUTES.completeAccount
        );

        return null;
      }

      /*
       * Conta permanente concluída.
       */

      if (
        authState.status ===
        "permanent"
      ) {
        clearDemoStorage();

        return user;
      }

      /*
       * Fallback de segurança.
       */

      console.warn(
        "Estado de autenticação desconhecido."
      );

      redirectTo(ROUTES.login);

      return null;
    } catch (error) {
      console.error(
        "Falha ao validar autenticação:",
        error
      );

      redirectTo(ROUTES.login);

      return null;
    }
  }


  /* ========================================================
     Resolver estado da conta
  ======================================================== */

  function resolveAuthenticationState(user) {
    const metadata =
      user?.user_metadata || {};

    const isAnonymous =
      user?.is_anonymous === true;

    const conversionStarted =
      metadata.account_conversion_started ===
      true;

    const conversionCompleted =
      metadata.account_conversion_completed ===
      true;

    const emailConfirmed =
      Boolean(
        user?.email_confirmed_at ||
        user?.confirmed_at
      );

    /*
     * Conta anónima ainda sem tentativa
     * de conversão.
     */

    if (
      isAnonymous &&
      !conversionStarted
    ) {
      return {
        status: "demo",
        user,
        isAnonymous,
        conversionStarted,
        conversionCompleted,
        emailConfirmed,
      };
    }

    /*
     * Conversão iniciada, mas email
     * ainda não confirmado.
     */

    if (
      conversionStarted &&
      !conversionCompleted &&
      (
        isAnonymous ||
        !emailConfirmed
      )
    ) {
      return {
        status:
          "awaiting_email_confirmation",

        user,
        isAnonymous,
        conversionStarted,
        conversionCompleted,
        emailConfirmed,
      };
    }

    /*
     * Email confirmado, mas palavra-passe
     * e conclusão da conta ainda pendentes.
     */

    if (
      conversionStarted &&
      !conversionCompleted &&
      !isAnonymous &&
      emailConfirmed
    ) {
      return {
        status: "awaiting_password",
        user,
        isAnonymous,
        conversionStarted,
        conversionCompleted,
        emailConfirmed,
      };
    }

    /*
     * Conta convertida e concluída.
     */

    if (
      !isAnonymous &&
      conversionCompleted
    ) {
      return {
        status: "permanent",
        user,
        isAnonymous,
        conversionStarted,
        conversionCompleted,
        emailConfirmed,
      };
    }

    /*
     * Conta permanente criada por login
     * tradicional, sem passar pela demo.
     */

    if (
      !isAnonymous &&
      !conversionStarted
    ) {
      return {
        status: "permanent",
        user,
        isAnonymous,
        conversionStarted,
        conversionCompleted,
        emailConfirmed,
      };
    }

    return {
      status: "unknown",
      user,
      isAnonymous,
      conversionStarted,
      conversionCompleted,
      emailConfirmed,
    };
  }


  /* ========================================================
     Ativar modo Demo
  ======================================================== */

  function activateDemoMode(user) {
    setStorageValue(
      STORAGE_KEYS.demoMode,
      "true"
    );

    if (user?.id) {
      setStorageValue(
        STORAGE_KEYS.demoUserId,
        user.id
      );
    }

    document.documentElement.classList.add(
      "demo-mode"
    );

    document.body?.classList.add(
      "demo-mode"
    );
  }


  /* ========================================================
     Limpar dados locais da Demo
  ======================================================== */

  function clearDemoStorage() {
    removeStorageValue(
      STORAGE_KEYS.demoMode
    );

    removeStorageValue(
      STORAGE_KEYS.demoUserId
    );

    removeStorageValue(
      STORAGE_KEYS.tourCompleted
    );

    removeStorageValue(
      STORAGE_KEYS.pendingEmail
    );

    removeStorageValue(
      STORAGE_KEYS.pendingName
    );

    document.documentElement.classList.remove(
      "demo-mode"
    );

    document.body?.classList.remove(
      "demo-mode"
    );
  }


  /* ========================================================
     Redirecionamento
  ======================================================== */

  function redirectTo(path) {
    const currentPath =
      normalizePath(
        window.location.pathname
      );

    const targetPath =
      normalizePath(path);

    if (currentPath === targetPath) {
      return;
    }

    window.location.replace(path);
  }


  function normalizePath(path) {
    return String(path || "")
      .replace(/\/+/g, "/")
      .replace(/\/$/, "")
      .toLowerCase();
  }


  /* ========================================================
     Local Storage
  ======================================================== */

  function getStorageValue(key) {
    try {
      return window.localStorage.getItem(
        key
      );
    } catch (error) {
      console.warn(
        `Não foi possível ler ${key}:`,
        error
      );

      return null;
    }
  }


  function setStorageValue(
    key,
    value
  ) {
    try {
      window.localStorage.setItem(
        key,
        value
      );
    } catch (error) {
      console.warn(
        `Não foi possível guardar ${key}:`,
        error
      );
    }
  }


  function removeStorageValue(key) {
    try {
      window.localStorage.removeItem(
        key
      );
    } catch (error) {
      console.warn(
        `Não foi possível remover ${key}:`,
        error
      );
    }
  }
})();

"use strict";

/* ==========================================================
   StudioV — Concluir conversão da conta Demo
========================================================== */

(function initializeCompleteAccount() {
  const ROUTES = {
    dashboard: "/html/dashboard/home.html",
    login: "/html/auth/login.html",
    verifyEmail: "/html/auth/verify-email.html",
  };

  const STORAGE_KEYS = {
    activeWorkspace:
      "studiov_active_workspace_id",

    demoMode:
      "studiov_demo_mode",

    demoUserId:
      "studiov_demo_user_id",

    tourCompleted:
      "studiov_demo_tour_completed",

    pendingEmail:
      "studiov_account_pending_email",

    pendingName:
      "studiov_account_pending_name",
  };

  const elements = {
    loading: null,
    formContent: null,
    form: null,
    email: null,
    password: null,
    passwordConfirmation: null,
    terms: null,
    submit: null,
    error: null,
    success: null,
    invalid: null,
    invalidMessage: null,
  };

  let currentUser = null;
  let authSubscription = null;
  let initializationFinished = false;


  /* ========================================================
     Supabase
  ======================================================== */

  function getClient() {
    return window.supabaseClient || null;
  }


  /* ========================================================
     Elementos
  ======================================================== */

  function getElements() {
    elements.loading =
      document.getElementById(
        "complete-account-loading"
      );

    elements.formContent =
      document.getElementById(
        "complete-account-form-content"
      );

    elements.form =
      document.getElementById(
        "complete-account-form"
      );

    elements.email =
      document.getElementById(
        "confirmed-account-email"
      );

    elements.password =
      document.getElementById(
        "account-password"
      );

    elements.passwordConfirmation =
      document.getElementById(
        "account-password-confirmation"
      );

    elements.terms =
      document.getElementById(
        "account-terms"
      );

    elements.submit =
      document.getElementById(
        "complete-account-submit"
      );

    elements.error =
      document.getElementById(
        "complete-account-error"
      );

    elements.success =
      document.getElementById(
        "complete-account-success"
      );

    elements.invalid =
      document.getElementById(
        "complete-account-invalid"
      );

    elements.invalidMessage =
      document.getElementById(
        "complete-account-invalid-message"
      );
  }


  /* ========================================================
     Ícones
  ======================================================== */

  function refreshIcons() {
    if (
      window.lucide &&
      typeof window.lucide.createIcons ===
        "function"
    ) {
      window.lucide.createIcons();
    }
  }


  /* ========================================================
     Estados visuais
  ======================================================== */

  function hideAllStates() {
    elements.loading.hidden = true;
    elements.formContent.hidden = true;
    elements.success.hidden = true;
    elements.invalid.hidden = true;
  }


  function showLoading() {
    hideAllStates();

    elements.loading.hidden = false;
  }


  function showForm(user) {
    hideAllStates();

    currentUser = user;

    elements.email.textContent =
      user?.email ||
      localStorage.getItem(
        STORAGE_KEYS.pendingEmail
      ) ||
      "Email confirmado";

    elements.formContent.hidden = false;

    refreshIcons();

    window.setTimeout(function () {
      elements.password.focus();
    }, 50);
  }


  function showSuccess() {
    hideAllStates();

    elements.success.hidden = false;

    refreshIcons();

    window.setTimeout(function () {
      window.location.replace(
        `${ROUTES.dashboard}?account=created`
      );
    }, 1800);
  }


  function showInvalid(message) {
    hideAllStates();

    elements.invalidMessage.textContent =
      message;

    elements.invalid.hidden = false;

    refreshIcons();
  }


  /* ========================================================
     Mensagem de erro
  ======================================================== */

  function showFormError(message) {
    elements.error.textContent =
      message;

    elements.error.hidden = false;
  }


  function clearFormError() {
    elements.error.textContent = "";
    elements.error.hidden = true;
  }


  /* ========================================================
     Estado do botão
  ======================================================== */

  function setSubmitting(isSubmitting) {
    elements.submit.disabled =
      isSubmitting;

    elements.submit.setAttribute(
      "aria-busy",
      String(isSubmitting)
    );

    elements.submit.innerHTML =
      isSubmitting
        ? `
            <span>A concluir...</span>
            <i data-lucide="loader-circle"></i>
          `
        : `
            <span>Concluir criação da conta</span>
            <i data-lucide="arrow-right"></i>
          `;

    refreshIcons();
  }


  /* ========================================================
     Erro recebido no callback
  ======================================================== */

  function readCallbackError() {
    const search =
      new URLSearchParams(
        window.location.search
      );

    const hash =
      new URLSearchParams(
        window.location.hash.replace(
          /^#/,
          ""
        )
      );

    return (
      search.get("error_description") ||
      hash.get("error_description") ||
      search.get("error") ||
      hash.get("error")
    );
  }


  /* ========================================================
     Procurar utilizador confirmado
  ======================================================== */

  async function findConfirmedUser() {
    const client = getClient();

    if (!client) {
      throw new Error(
        "O cliente Supabase não foi carregado."
      );
    }

    const {
      data: sessionData,
      error: sessionError,
    } = await client.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!sessionData?.session?.user) {
      return null;
    }

    const {
      data: userData,
      error: userError,
    } = await client.auth.getUser();

    if (userError) {
      throw userError;
    }

    return userData?.user || null;
  }


  /* ========================================================
     Preparar página
  ======================================================== */

  async function prepareAccountPage() {
    if (initializationFinished) {
      return;
    }

    const callbackError =
      readCallbackError();

    if (callbackError) {
      initializationFinished = true;

      showInvalid(
        decodeURIComponent(
          callbackError
        )
      );

      return;
    }

    try {
      const user =
        await findConfirmedUser();

      if (!user) {
        return;
      }

      const metadata =
        user.user_metadata || {};

      const conversionStarted =
        metadata
          .account_conversion_started ===
        true;

      const conversionCompleted =
        metadata
          .account_conversion_completed ===
        true;

      const emailConfirmed =
        Boolean(
          user.email_confirmed_at ||
          user.confirmed_at
        );

      /*
       * Conta já finalizada.
       */

      if (
        user.is_anonymous !== true &&
        conversionCompleted
      ) {
        initializationFinished = true;

        finishDemoMode();

        window.location.replace(
          ROUTES.dashboard
        );

        return;
      }

      /*
       * Email ainda não foi confirmado.
       */

      if (
        user.is_anonymous === true ||
        !emailConfirmed
      ) {
        initializationFinished = true;

        window.location.replace(
          ROUTES.verifyEmail
        );

        return;
      }

      /*
       * Conta tradicional que não veio
       * da demonstração.
       */

      if (!conversionStarted) {
        initializationFinished = true;

        window.location.replace(
          ROUTES.dashboard
        );

        return;
      }

      initializationFinished = true;

      showForm(user);
    } catch (error) {
      console.error(
        "Erro ao validar confirmação:",
        error
      );

      initializationFinished = true;

      showInvalid(
        "Não foi possível validar a confirmação do email."
      );
    }
  }


  /* ========================================================
     Validação da palavra-passe
  ======================================================== */

  function validatePassword(
    password,
    confirmation
  ) {
    if (!password) {
      return "Informe uma palavra-passe.";
    }

    if (password.length < 8) {
      return (
        "A palavra-passe deve ter pelo menos " +
        "8 caracteres."
      );
    }

    if (password !== confirmation) {
      return (
        "As palavras-passe não coincidem."
      );
    }

    if (!elements.terms.checked) {
      return (
        "Confirme a aceitação dos termos " +
        "para continuar."
      );
    }

    return null;
  }


  /* ========================================================
     Resolver workspace Demo
  ======================================================== */

  async function resolveWorkspaceId(
    client,
    user
  ) {
    const storedWorkspaceId =
      localStorage.getItem(
        STORAGE_KEYS.activeWorkspace
      );

    if (storedWorkspaceId) {
      return storedWorkspaceId;
    }

    /*
     * Procura a sessão Demo ligada ao utilizador.
     */

    const {
      data: demoSession,
      error: demoSessionError,
    } = await client
      .from("demo_sessions")
      .select(
        `
          workspace_id,
          status,
          created_at
        `
      )
      .eq("user_id", user.id)
      .in(
        "status",
        [
          "active",
          "completed",
        ]
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (demoSessionError) {
      console.warn(
        "Não foi possível localizar a sessão Demo:",
        demoSessionError.message
      );
    }

    if (demoSession?.workspace_id) {
      localStorage.setItem(
        STORAGE_KEYS.activeWorkspace,
        demoSession.workspace_id
      );

      return demoSession.workspace_id;
    }

    /*
     * Fallback: workspace ativo pertencente
     * ao próprio utilizador.
     */

    const {
      data: workspace,
      error: workspaceError,
    } = await client
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "active")
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (workspaceError) {
      console.warn(
        "Não foi possível localizar o workspace:",
        workspaceError.message
      );
    }

    if (workspace?.id) {
      localStorage.setItem(
        STORAGE_KEYS.activeWorkspace,
        workspace.id
      );

      return workspace.id;
    }

    throw new Error(
      "Não foi possível localizar o workspace da demonstração."
    );
  }


  /* ========================================================
     Limpar dados Demo no banco
  ======================================================== */

  async function finalizeDemoWorkspace(
    client,
    user
  ) {
    const workspaceId =
      await resolveWorkspaceId(
        client,
        user
      );

    const {
      data,
      error,
    } = await client.rpc(
      "finalize_demo_account",
      {
        p_workspace_id:
          workspaceId,
      }
    );

    if (error) {
      throw error;
    }

    if (!data?.success) {
      throw new Error(
        "A limpeza do workspace não foi concluída."
      );
    }

    console.log(
      "Workspace Demo convertido:",
      data
    );

    return data;
  }


  /* ========================================================
     Finalizar perfil e metadados
  ======================================================== */

  async function finalizeProfile(
    user
  ) {
    const client = getClient();

    const pendingName =
      localStorage.getItem(
        STORAGE_KEYS.pendingName
      );

    if (!client || !user?.id) {
      return;
    }

    const metadata = {
      account_conversion_started:
        true,

      account_conversion_completed:
        true,

      account_conversion_completed_at:
        new Date().toISOString(),
    };

    if (pendingName) {
      metadata.full_name =
        pendingName;
    }

    const {
      error: metadataError,
    } = await client.auth.updateUser({
      data: metadata,
    });

    if (metadataError) {
      throw metadataError;
    }

    if (pendingName) {
      const {
        error: profileError,
      } = await client
        .from("profiles")
        .update({
          full_name: pendingName,
          onboarding_completed: true,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        console.warn(
          "O perfil público não foi atualizado:",
          profileError.message
        );
      }
    }
  }


  /* ========================================================
     Limpar modo Demo local
  ======================================================== */

  function finishDemoMode() {
    /*
     * O workspace ativo não é removido.
     * Ele continua sendo o mesmo workspace,
     * agora convertido em workspace real.
     */

    localStorage.removeItem(
      STORAGE_KEYS.demoMode
    );

    localStorage.removeItem(
      STORAGE_KEYS.demoUserId
    );

    localStorage.removeItem(
      STORAGE_KEYS.tourCompleted
    );

    localStorage.removeItem(
      STORAGE_KEYS.pendingEmail
    );

    localStorage.removeItem(
      STORAGE_KEYS.pendingName
    );

    document.documentElement
      .classList
      .remove("demo-mode");

    document.body.classList.remove(
      "demo-mode"
    );
  }


  /* ========================================================
     Traduzir erros do RPC
  ======================================================== */

  function mapFinalizationError(error) {
    const message =
      String(
        error?.message || ""
      ).toUpperCase();

    if (
      message.includes(
        "EMAIL_NOT_CONFIRMED"
      )
    ) {
      return (
        "O email ainda não foi confirmado. " +
        "Confirme o endereço recebido antes " +
        "de continuar."
      );
    }

    if (
      message.includes(
        "PASSWORD_NOT_CONFIGURED"
      )
    ) {
      return (
        "A palavra-passe ainda não foi " +
        "registada. Tente novamente."
      );
    }

    if (
      message.includes(
        "WORKSPACE_NOT_OWNED"
      )
    ) {
      return (
        "Este workspace não pertence ao " +
        "utilizador autenticado."
      );
    }

    if (
      message.includes(
        "ACTIVE_DEMO_SESSION_NOT_FOUND"
      )
    ) {
      return (
        "Não foi encontrada uma sessão de " +
        "demonstração ativa para esta conta."
      );
    }

    if (
      message.includes(
        "FREE_PLAN_NOT_FOUND"
      )
    ) {
      return (
        "O plano Free não está disponível. " +
        "Contacte o suporte da StudioV."
      );
    }

    if (
      message.includes(
        "AUTH_REQUIRED"
      ) ||
      message.includes(
        "USER_NOT_FOUND"
      )
    ) {
      return (
        "A sessão terminou. Entre novamente " +
        "para concluir a conta."
      );
    }

    if (
      message.includes("WEAK PASSWORD")
    ) {
      return (
        "Escolha uma palavra-passe mais segura."
      );
    }

    return (
      error?.message ||
      "Não foi possível concluir a criação da conta."
    );
  }


  /* ========================================================
     Enviar formulário
  ======================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    clearFormError();

    const password =
      elements.password.value;

    const confirmation =
      elements
        .passwordConfirmation
        .value;

    const validationError =
      validatePassword(
        password,
        confirmation
      );

    if (validationError) {
      showFormError(
        validationError
      );

      return;
    }

    const client = getClient();

    if (!client) {
      showFormError(
        "O cliente Supabase não foi carregado."
      );

      return;
    }

    setSubmitting(true);

    try {
      /*
       * 1. Criar a palavra-passe.
       */

      const {
        data,
        error,
      } = await client.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      const user =
        data?.user ||
        currentUser;

      if (!user) {
        throw new Error(
          "O utilizador não foi encontrado."
        );
      }

      /*
       * 2. Limpar todos os dados demonstrativos
       *    e converter o workspace para Free.
       */

      await finalizeDemoWorkspace(
        client,
        user
      );

      /*
       * 3. Marcar a conversão como concluída.
       */

      await finalizeProfile(user);

      /*
       * 4. Remover apenas o estado local da Demo.
       */

      finishDemoMode();

      /*
       * 5. Mostrar sucesso e abrir Dashboard.
       */

      showSuccess();
    } catch (error) {
      console.error(
        "Erro ao finalizar conta Demo:",
        error
      );

      showFormError(
        mapFinalizationError(error)
      );
    } finally {
      setSubmitting(false);
    }
  }


  /* ========================================================
     Mostrar e ocultar palavra-passe
  ======================================================== */

  function registerPasswordToggles() {
    document
      .querySelectorAll(
        "[data-password-toggle]"
      )
      .forEach(function (button) {
        button.addEventListener(
          "click",
          function () {
            const inputId =
              button.dataset
                .passwordToggle;

            const input =
              document.getElementById(
                inputId
              );

            if (!input) {
              return;
            }

            const isPassword =
              input.type ===
              "password";

            input.type =
              isPassword
                ? "text"
                : "password";

            button.setAttribute(
              "aria-label",
              isPassword
                ? "Ocultar palavra-passe"
                : "Mostrar palavra-passe"
            );

            button.innerHTML =
              isPassword
                ? `
                    <i data-lucide="eye-off"></i>
                  `
                : `
                    <i data-lucide="eye"></i>
                  `;

            refreshIcons();
          }
        );
      });
  }


  /* ========================================================
     Eventos de autenticação
  ======================================================== */

  function subscribeToAuthChanges() {
    const client = getClient();

    if (!client) {
      return;
    }

    const {
      data,
    } = client.auth.onAuthStateChange(
      function (_event, session) {
        if (
          initializationFinished ||
          !session?.user
        ) {
          return;
        }

        const user =
          session.user;

        const metadata =
          user.user_metadata || {};

        if (
          user.is_anonymous !== true &&
          metadata
            .account_conversion_started ===
            true
        ) {
          initializationFinished = true;

          showForm(user);
        }
      }
    );

    authSubscription =
      data?.subscription || null;
  }


  /* ========================================================
     Inicialização
  ======================================================== */

  async function initialize() {
    getElements();
    refreshIcons();
    showLoading();

    elements.form.addEventListener(
      "submit",
      handleSubmit
    );

    registerPasswordToggles();
    subscribeToAuthChanges();

    await prepareAccountPage();

    window.setTimeout(
      function () {
        if (!initializationFinished) {
          prepareAccountPage();
        }
      },
      1200
    );

    window.setTimeout(
      function () {
        if (!initializationFinished) {
          initializationFinished = true;

          showInvalid(
            "A sessão de confirmação não foi encontrada. " +
            "Abra novamente o link recebido por email."
          );
        }
      },
      7000
    );
  }


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );
  } else {
    initialize();
  }


  window.addEventListener(
    "beforeunload",
    function () {
      authSubscription?.unsubscribe();
    }
  );
})();
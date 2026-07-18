"use strict";

/* ==========================================================
   StudioV — Aguardar confirmação do email
========================================================== */

(function initializeVerifyEmailPage() {
  const ROUTES = {
    login: "/html/auth/login.html",
    dashboard: "/html/dashboard/home.html",
    completeAccount:
      "/html/auth/complete-account.html",
  };

  const STORAGE_KEYS = {
    pendingEmail:
      "studiov_account_pending_email",

    pendingName:
      "studiov_account_pending_name",

    demoMode:
      "studiov_demo_mode",
  };

  const CHECK_INTERVAL = 4000;

  const elements = {
    content: null,
    confirmed: null,
    invalid: null,
    email: null,
    checkButton: null,
    logoutButton: null,
    error: null,
    success: null,
  };

  let checkIntervalId = null;
  let isChecking = false;
  let pageFinished = false;


  /* ========================================================
     Cliente Supabase
  ======================================================== */

  function getClient() {
    return window.supabaseClient || null;
  }


  /* ========================================================
     Elementos
  ======================================================== */

  function getElements() {
    elements.content =
      document.getElementById(
        "verify-email-content"
      );

    elements.confirmed =
      document.getElementById(
        "verify-email-confirmed"
      );

    elements.invalid =
      document.getElementById(
        "verify-email-invalid"
      );

    elements.email =
      document.getElementById(
        "verify-email-address"
      );

    elements.checkButton =
      document.getElementById(
        "verify-email-check"
      );

    elements.logoutButton =
      document.getElementById(
        "verify-email-logout"
      );

    elements.error =
      document.getElementById(
        "verify-email-error"
      );

    elements.success =
      document.getElementById(
        "verify-email-success"
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


  /* ========================================================
     Mensagens
  ======================================================== */

  function clearMessages() {
    elements.error.textContent = "";
    elements.error.hidden = true;

    elements.success.textContent = "";
    elements.success.hidden = true;
  }


  function showError(message) {
    elements.error.textContent = message;
    elements.error.hidden = false;

    elements.success.hidden = true;
  }


  function showSuccess(message) {
    elements.success.textContent = message;
    elements.success.hidden = false;

    elements.error.hidden = true;
  }


  /* ========================================================
     Carregamento
  ======================================================== */

  function setChecking(isLoading) {
    elements.checkButton.disabled =
      isLoading;

    elements.checkButton.innerHTML =
      isLoading
        ? `
            <span>A verificar...</span>
            <i data-lucide="loader-circle"></i>
          `
        : `
            <span>Já confirmei o email</span>
            <i data-lucide="refresh-cw"></i>
          `;

    refreshIcons();
  }


  /* ========================================================
     Estados visuais
  ======================================================== */

  function showMainContent() {
    elements.content.hidden = false;
    elements.confirmed.hidden = true;
    elements.invalid.hidden = true;
  }


  function showConfirmedState() {
    pageFinished = true;

    stopAutomaticCheck();

    elements.content.hidden = true;
    elements.invalid.hidden = true;
    elements.confirmed.hidden = false;

    refreshIcons();

    window.setTimeout(function () {
      window.location.replace(
        ROUTES.completeAccount
      );
    }, 1500);
  }


  function showInvalidState() {
    pageFinished = true;

    stopAutomaticCheck();

    elements.content.hidden = true;
    elements.confirmed.hidden = true;
    elements.invalid.hidden = false;

    refreshIcons();
  }


  /* ========================================================
     Resolver estado
  ======================================================== */

  function resolveUserState(user) {
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

    if (
      !isAnonymous &&
      conversionCompleted
    ) {
      return "permanent";
    }

    if (
      conversionStarted &&
      !conversionCompleted &&
      !isAnonymous &&
      emailConfirmed
    ) {
      return "confirmed";
    }

    if (
      conversionStarted &&
      !conversionCompleted
    ) {
      return "waiting";
    }

    if (
      isAnonymous &&
      !conversionStarted
    ) {
      return "demo";
    }

    if (
      !isAnonymous &&
      !conversionStarted
    ) {
      return "permanent";
    }

    return "unknown";
  }


  /* ========================================================
     Verificar utilizador
  ======================================================== */

  async function checkEmailConfirmation(options = {}) {
    const {
      manual = false,
    } = options;

    if (
      isChecking ||
      pageFinished
    ) {
      return;
    }

    const client = getClient();

    if (!client) {
      showError(
        "O cliente Supabase não foi carregado."
      );

      return;
    }

    isChecking = true;

    if (manual) {
      clearMessages();
      setChecking(true);
    }

    try {
      const {
        data,
        error,
      } = await client.auth.getUser();

      if (error) {
        throw error;
      }

      const user = data?.user || null;

      if (!user) {
        window.location.replace(
          ROUTES.login
        );

        return;
      }

      const state =
        resolveUserState(user);

      if (state === "confirmed") {
        showConfirmedState();
        return;
      }

      if (state === "permanent") {
        window.location.replace(
          ROUTES.dashboard
        );

        return;
      }

      if (state === "demo") {
        window.location.replace(
          ROUTES.dashboard
        );

        return;
      }

      if (state === "waiting") {
        if (manual) {
          showSuccess(
            "O email ainda não foi confirmado. " +
            "Abra a mensagem recebida e clique " +
            "no botão de confirmação."
          );
        }

        return;
      }

      showInvalidState();
    } catch (error) {
      console.error(
        "Erro ao verificar confirmação:",
        error
      );

      if (manual) {
        showError(
          "Não foi possível verificar o email. " +
          "Tente novamente dentro de alguns segundos."
        );
      }
    } finally {
      isChecking = false;

      if (manual) {
        setChecking(false);
      }
    }
  }


  /* ========================================================
     Email apresentado
  ======================================================== */

  async function loadDisplayedEmail() {
    const pendingEmail =
      getStorageValue(
        STORAGE_KEYS.pendingEmail
      );

    if (pendingEmail) {
      elements.email.textContent =
        pendingEmail;

      return;
    }

    const client = getClient();

    if (!client) {
      elements.email.textContent =
        "Email não encontrado";

      return;
    }

    const {
      data,
    } = await client.auth.getUser();

    const userEmail =
      data?.user?.email || null;

    elements.email.textContent =
      userEmail ||
      "Email de confirmação enviado";
  }


  /* ========================================================
     Verificação automática
  ======================================================== */

  function startAutomaticCheck() {
    stopAutomaticCheck();

    checkIntervalId =
      window.setInterval(
        function () {
          checkEmailConfirmation({
            manual: false,
          });
        },
        CHECK_INTERVAL
      );
  }


  function stopAutomaticCheck() {
    if (!checkIntervalId) {
      return;
    }

    window.clearInterval(
      checkIntervalId
    );

    checkIntervalId = null;
  }


  /* ========================================================
     Sair
  ======================================================== */

  async function handleLogout() {
    const client = getClient();

    elements.logoutButton.disabled = true;

    try {
      if (client) {
        await client.auth.signOut();
      }
    } catch (error) {
      console.error(
        "Erro ao terminar sessão:",
        error
      );
    } finally {
      window.localStorage.removeItem(
        STORAGE_KEYS.demoMode
      );

      window.location.replace(
        ROUTES.login
      );
    }
  }


  /* ========================================================
     Eventos de autenticação
  ======================================================== */

  function subscribeToAuthChanges() {
    const client = getClient();

    if (!client) {
      return;
    }

    client.auth.onAuthStateChange(
      function (_event, session) {
        if (
          pageFinished ||
          !session?.user
        ) {
          return;
        }

        const state =
          resolveUserState(
            session.user
          );

        if (state === "confirmed") {
          showConfirmedState();
        }
      }
    );
  }


  /* ========================================================
     Inicialização
  ======================================================== */

  async function initialize() {
    getElements();
    refreshIcons();
    showMainContent();

    elements.checkButton.addEventListener(
      "click",
      function () {
        checkEmailConfirmation({
          manual: true,
        });
      }
    );

    elements.logoutButton.addEventListener(
      "click",
      handleLogout
    );

    await loadDisplayedEmail();

    await checkEmailConfirmation({
      manual: false,
    });

    if (!pageFinished) {
      subscribeToAuthChanges();
      startAutomaticCheck();
    }
  }


  if (
    document.readyState === "loading"
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
    stopAutomaticCheck
  );
})();
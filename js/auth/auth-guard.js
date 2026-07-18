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
  };

  window.studioVAuthState = null;

  window.studioVAuthReady =
    validateAuthenticatedPage();


  /* ========================================================
     Cliente Supabase
  ======================================================== */

  function getSupabaseClient() {
    return window.supabaseClient || null;
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
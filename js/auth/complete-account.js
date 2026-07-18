"use strict";

/* ==========================================================
   StudioV — Concluir conta Demo
========================================================== */

(function initializeCompleteAccount() {
  const ROUTES = {
    dashboard: "/html/dashboard/home.html",
  };

  const STORAGE_KEYS = {
    demoMode: "studiov_demo_mode",
    demoUserId: "studiov_demo_user_id",
    tourCompleted: "studiov_demo_tour_completed",
    pendingEmail: "studiov_account_pending_email",
    pendingName: "studiov_account_pending_name",
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
      user?.email || "Email confirmado";

    elements.formContent.hidden = false;

    window.setTimeout(function () {
      elements.password.focus();
    }, 50);
  }

  function showSuccess() {
    hideAllStates();
    elements.success.hidden = false;

    refreshIcons();

    window.setTimeout(function () {
      window.location.href =
        `${ROUTES.dashboard}?account=created`;
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
     Erros do formulário
  ======================================================== */

  function showFormError(message) {
    elements.error.textContent = message;
    elements.error.hidden = false;
  }

  function clearFormError() {
    elements.error.textContent = "";
    elements.error.hidden = true;
  }


  /* ========================================================
     Carregamento
  ======================================================== */

  function setSubmitting(isSubmitting) {
    elements.submit.disabled =
      isSubmitting;

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
     Callback do Supabase
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

    if (sessionData?.session?.user) {
      const {
        data: userData,
        error: userError,
      } = await client.auth.getUser();

      if (userError) {
        throw userError;
      }

      return userData?.user || null;
    }

    return null;
  }

  async function prepareAccountPage() {
    if (initializationFinished) {
      return;
    }

    const callbackError =
      readCallbackError();

    if (callbackError) {
      initializationFinished = true;

      showInvalid(
        decodeURIComponent(callbackError)
      );

      return;
    }

    try {
      const user =
        await findConfirmedUser();

      if (!user) {
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
     Validação
  ======================================================== */

  function validatePassword(
    password,
    confirmation
  ) {
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
     Perfil
  ======================================================== */

  async function finalizeProfile(user) {
    const client = getClient();

    const pendingName =
      localStorage.getItem(
        STORAGE_KEYS.pendingName
      );

    if (!client || !user?.id) {
      return;
    }

    const metadata = {
      account_conversion_completed: true,
      account_conversion_completed_at:
        new Date().toISOString(),
    };

    if (pendingName) {
      metadata.full_name = pendingName;
    }

    const {
      error: metadataError,
    } = await client.auth.updateUser({
      data: metadata,
    });

    if (metadataError) {
      console.warn(
        "Metadados não atualizados:",
        metadataError.message
      );
    }

    if (pendingName) {
      const {
        error: profileError,
      } = await client
        .from("profiles")
        .update({
          full_name: pendingName,
        })
        .eq("id", user.id);

      if (profileError) {
        console.warn(
          "Perfil não atualizado:",
          profileError.message
        );
      }
    }
  }


  /* ========================================================
     Limpar modo Demo
  ======================================================== */

  function finishDemoMode() {
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

    document.body.classList.remove(
      "demo-mode"
    );
  }


  /* ========================================================
     Enviar palavra-passe
  ======================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    clearFormError();

    const password =
      elements.password.value;

    const confirmation =
      elements.passwordConfirmation.value;

    const validationError =
      validatePassword(
        password,
        confirmation
      );

    if (validationError) {
      showFormError(validationError);
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
        data?.user || currentUser;

      await finalizeProfile(user);

      finishDemoMode();

      showSuccess();
    } catch (error) {
      console.error(
        "Erro ao definir palavra-passe:",
        error
      );

      const message =
        String(error?.message || "")
          .toLowerCase();

      if (
        message.includes("weak password") ||
        message.includes("password")
      ) {
        showFormError(
          "Escolha uma palavra-passe mais segura."
        );
      } else {
        showFormError(
          error?.message ||
          "Não foi possível concluir a conta."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }


  /* ========================================================
     Mostrar palavra-passe
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
              button.dataset.passwordToggle;

            const input =
              document.getElementById(inputId);

            if (!input) {
              return;
            }

            const isPassword =
              input.type === "password";

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
                ? '<i data-lucide="eye-off"></i>'
                : '<i data-lucide="eye"></i>';

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

        initializationFinished = true;

        showForm(session.user);
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

    window.setTimeout(function () {
      if (!initializationFinished) {
        prepareAccountPage();
      }
    }, 1200);

    window.setTimeout(function () {
      if (!initializationFinished) {
        initializationFinished = true;

        showInvalid(
          "A sessão de confirmação não foi encontrada. " +
          "Abra novamente o link recebido por email."
        );
      }
    }, 7000);
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
    function () {
      authSubscription?.unsubscribe();
    }
  );
})();
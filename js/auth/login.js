"use strict";

/* ==========================================================
   StudioV — Login
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("login-form");

  const emailInput = document.getElementById("login-email");
  const emailError = document.getElementById("login-email-error");

  const passwordInput = document.getElementById("login-password");
  const passwordError = document.getElementById("login-password-error");

  const passwordToggle = document.getElementById("login-password-toggle");

  const submitButton = document.getElementById("login-submit-button");

  const submitText = document.getElementById("login-submit-text");

  const buttonLoader = document.getElementById("login-button-loader");

  const generalError = document.getElementById("login-general-error");

  const googleLoginButton = document.getElementById("google-login-button");

  const supabaseClient = window.supabaseClient;

  /* ======================================================
       Verificar cliente Supabase
    ====================================================== */

  if (!supabaseClient) {
    showGeneralError("Não foi possível iniciar a ligação com o servidor.");

    console.error("window.supabaseClient não foi encontrado.");

    return;
  }

  /* ======================================================
       Redirecionar utilizador já autenticado
    ====================================================== */

  try {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Erro ao verificar sessão:", error.message);
    }

    if (session?.user) {
      window.location.replace("/html/dashboard/brands.html");

      return;
    }
  } catch (error) {
    console.error("Falha ao verificar sessão:", error);
  }

  /* ======================================================
       Mostrar ou ocultar palavra-passe
    ====================================================== */

  passwordToggle?.addEventListener("click", () => {
    const passwordIsVisible = passwordInput.type === "text";

    passwordInput.type = passwordIsVisible ? "password" : "text";

    passwordToggle.setAttribute("aria-pressed", String(!passwordIsVisible));

    passwordToggle.setAttribute(
      "aria-label",
      passwordIsVisible ? "Mostrar palavra-passe" : "Ocultar palavra-passe"
    );

    passwordToggle.innerHTML = `
            <i
                data-lucide="${passwordIsVisible ? "eye" : "eye-off"}"
            ></i>
        `;

    window.lucide?.createIcons();
  });

  /* ======================================================
       Validação
    ====================================================== */

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function clearFieldError(input, errorElement) {
    input?.classList.remove("is-invalid");

    if (errorElement) {
      errorElement.textContent = "";
    }
  }

  function setFieldError(input, errorElement, message) {
    input?.classList.add("is-invalid");

    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  function clearGeneralError() {
    if (!generalError) {
      return;
    }

    generalError.textContent = "";
    generalError.classList.add("hidden");
  }

  function showGeneralError(message) {
    if (!generalError) {
      return;
    }

    generalError.textContent = message;
    generalError.classList.remove("hidden");
  }

  function clearErrors() {
    clearFieldError(emailInput, emailError);
    clearFieldError(passwordInput, passwordError);
    clearGeneralError();
  }

  function validateLoginForm() {
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let isValid = true;

    if (!email) {
      setFieldError(emailInput, emailError, "Introduza o seu email.");

      isValid = false;
    } else if (!isValidEmail(email)) {
      setFieldError(emailInput, emailError, "Introduza um email válido.");

      isValid = false;
    }

    if (!password) {
      setFieldError(passwordInput, passwordError, "Introduza a sua palavra-passe.");

      isValid = false;
    } else if (password.length < 6) {
      setFieldError(
        passwordInput,
        passwordError,
        "A palavra-passe deve ter pelo menos 6 caracteres."
      );

      isValid = false;
    }

    return isValid;
  }

  emailInput?.addEventListener("input", () => {
    clearFieldError(emailInput, emailError);
    clearGeneralError();
  });

  passwordInput?.addEventListener("input", () => {
    clearFieldError(passwordInput, passwordError);

    clearGeneralError();
  });

  /* ======================================================
       Estado de carregamento
    ====================================================== */

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    emailInput.disabled = isLoading;
    passwordInput.disabled = isLoading;

    if (submitText) {
      submitText.textContent = isLoading ? "A entrar..." : "Entrar";
    }

    buttonLoader?.classList.toggle("hidden", !isLoading);
  }

  /* ======================================================
       Traduzir erros de autenticação
    ====================================================== */

  function getLoginErrorMessage(error) {
    const errorCode = error?.code || "";

    if (errorCode === "email_not_confirmed") {
      return "Confirme o seu email antes de entrar.";
    }

    if (errorCode === "invalid_credentials" || errorCode === "user_not_found") {
      return "Email ou palavra-passe incorretos.";
    }

    if (errorCode === "over_request_rate_limit" || errorCode === "over_email_send_rate_limit") {
      return "Foram feitas muitas tentativas. Aguarde alguns minutos.";
    }

    return "Não foi possível iniciar sessão. Tente novamente.";
  }

  /* ======================================================
       Login com email e palavra-passe
    ====================================================== */

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateLoginForm()) {
      return;
    }

    setLoading(true);
    clearGeneralError();

    const email = emailInput.value.trim().toLowerCase();

    const password = passwordInput.value;

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data?.session || !data?.user) {
        throw new Error("A sessão não foi criada.");
      }

      window.location.replace("/html/dashboard/brands.html");
    } catch (error) {
      console.error("Erro ao iniciar sessão:", error);

      showGeneralError(getLoginErrorMessage(error));

      setLoading(false);
    }
  });

  /* ======================================================
       Google — será configurado posteriormente
    ====================================================== */

  googleLoginButton?.addEventListener("click", () => {
    showGeneralError("O login com Google ainda não está configurado.");
  });

  window.lucide?.createIcons();
});

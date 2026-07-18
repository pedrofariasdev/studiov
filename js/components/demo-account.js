"use strict";

/* ==========================================================
   StudioV — Conversão da conta Demo
========================================================== */

(function initializeStudioVDemoAccount() {
  const STORAGE_KEYS = {
    demoMode: "studiov_demo_mode",
    pendingEmail: "studiov_account_pending_email",
    pendingName: "studiov_account_pending_name",
  };

  const COMPLETE_ACCOUNT_PATH =
    "/html/auth/complete-account.html";

  const PRODUCTION_ORIGIN =
  "https://studiov.pt";

  let modal = null;
  let form = null;
  let formContent = null;
  let successContent = null;

  let nameInput = null;
  let emailInput = null;

  let errorElement = null;
  let submitButton = null;
  let successEmailElement = null;

  let previousFocus = null;
  let previousBodyOverflow = "";


  /* ========================================================
     Supabase
  ======================================================== */

  function getSupabaseClient() {
    return window.supabaseClient || null;
  }


  /* ========================================================
     Local Storage
  ======================================================== */

  function getStorageValue(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn(
        `Não foi possível ler ${key}:`,
        error
      );

      return null;
    }
  }


  function setStorageValue(key, value) {
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


  /* ========================================================
     Modo Demo
  ======================================================== */

  function isDemoMode() {
    const demoFromStorage =
      getStorageValue(
        STORAGE_KEYS.demoMode
      ) === "true";

    const demoFromBody =
      document.body.classList.contains(
        "demo-mode"
      );

    return (
      demoFromStorage ||
      demoFromBody
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
     Criar modal
  ======================================================== */

  function createModal() {
    if (modal) {
      return;
    }

    modal =
      document.createElement("div");

    modal.className =
      "demo-account-modal";

    modal.id =
      "demo-account-modal";

    modal.hidden = true;

    modal.innerHTML = `
      <section
        class="demo-account-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-account-title"
        aria-describedby="demo-account-description"
      >
        <header class="demo-account-header">

          <div class="demo-account-header-content">

            <span class="demo-account-icon">
              <i data-lucide="user-round-plus"></i>
            </span>

            <div>

              <h2 id="demo-account-title">
                Criar sua conta StudioV
              </h2>

              <p id="demo-account-description">
                Guarde o seu progresso e continue
                utilizando a plataforma.
              </p>

            </div>

          </div>


          <button
            class="demo-account-close"
            id="demo-account-close"
            type="button"
            aria-label="Fechar"
          >
            <i data-lucide="x"></i>
          </button>

        </header>


        <div class="demo-account-body">

          <div id="demo-account-form-content">

            <div class="demo-account-note">

              <i data-lucide="shield-check"></i>

              <span>
                Enviaremos uma mensagem para confirmar
                o seu email. Depois da confirmação,
                você poderá definir a palavra-passe.
              </span>

            </div>


            <form
              class="demo-account-form"
              id="demo-account-form"
              novalidate
            >

              <div class="demo-account-field">

                <label for="demo-account-name">
                  Nome completo
                </label>

                <input
                  id="demo-account-name"
                  name="fullName"
                  type="text"
                  autocomplete="name"
                  minlength="2"
                  maxlength="100"
                  placeholder="Ex.: Pedro Farias"
                  required
                >

              </div>


              <div class="demo-account-field">

                <label for="demo-account-email">
                  Email
                </label>

                <input
                  id="demo-account-email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  maxlength="160"
                  placeholder="nome@email.com"
                  required
                >

                <small>
                  Este email será usado para entrar
                  na StudioV.
                </small>

              </div>


              <p
                class="demo-account-error"
                id="demo-account-error"
                role="alert"
              ></p>


              <div class="demo-account-actions">

                <button
                  class="
                    demo-account-button
                    demo-account-button--secondary
                  "
                  id="demo-account-cancel"
                  type="button"
                >
                  Cancelar
                </button>


                <button
                  class="
                    demo-account-button
                    demo-account-button--primary
                  "
                  id="demo-account-submit"
                  type="submit"
                >
                  <span>Continuar</span>

                  <i data-lucide="arrow-right"></i>
                </button>

              </div>

            </form>

          </div>


          <div
            class="demo-account-success"
            id="demo-account-success"
            hidden
          >

            <span class="demo-account-success-icon">
              <i data-lucide="mail-check"></i>
            </span>

            <h3>
              Confirme o seu email
            </h3>

            <p>
              Enviamos uma mensagem para:
            </p>

            <p>
              <strong
                id="demo-account-success-email"
              ></strong>
            </p>

            <p>
              Abra o email e clique no link de
              confirmação para concluir a criação
              da conta.
            </p>

            <button
              class="
                demo-account-button
                demo-account-button--primary
              "
              id="demo-account-success-close"
              type="button"
            >
              Entendido
            </button>

          </div>

        </div>

      </section>
    `;

    document.body.appendChild(modal);

    form =
      modal.querySelector(
        "#demo-account-form"
      );

    formContent =
      modal.querySelector(
        "#demo-account-form-content"
      );

    successContent =
      modal.querySelector(
        "#demo-account-success"
      );

    nameInput =
      modal.querySelector(
        "#demo-account-name"
      );

    emailInput =
      modal.querySelector(
        "#demo-account-email"
      );

    errorElement =
      modal.querySelector(
        "#demo-account-error"
      );

    submitButton =
      modal.querySelector(
        "#demo-account-submit"
      );

    successEmailElement =
      modal.querySelector(
        "#demo-account-success-email"
      );


    modal
      .querySelector(
        "#demo-account-close"
      )
      ?.addEventListener(
        "click",
        closeModal
      );


    modal
      .querySelector(
        "#demo-account-cancel"
      )
      ?.addEventListener(
        "click",
        closeModal
      );


    modal
      .querySelector(
        "#demo-account-success-close"
      )
      ?.addEventListener(
        "click",
        closeModal
      );


    modal.addEventListener(
      "click",
      function handleModalOverlayClick(event) {
        if (event.target === modal) {
          closeModal();
        }
      }
    );


    form.addEventListener(
      "submit",
      handleSubmit
    );

    refreshIcons();
  }


  /* ========================================================
     Erros
  ======================================================== */

  function showError(message) {
    if (!errorElement) {
      return;
    }

    errorElement.textContent =
      message;

    errorElement.classList.add(
      "is-visible"
    );
  }


  function clearError() {
    if (!errorElement) {
      return;
    }

    errorElement.textContent = "";

    errorElement.classList.remove(
      "is-visible"
    );
  }


  function mapAuthenticationError(error) {
    const message =
      String(
        error?.message || ""
      ).toLowerCase();

    const code =
      String(
        error?.code || ""
      ).toLowerCase();


    if (
      code.includes(
        "identity_already_exists"
      ) ||
      code.includes(
        "email_exists"
      ) ||
      code.includes(
        "user_already_exists"
      ) ||
      message.includes(
        "already registered"
      ) ||
      message.includes(
        "already exists"
      )
    ) {
      return (
        "Este email já pertence a uma conta. " +
        "Entre nessa conta ou utilize outro email."
      );
    }


    if (
      code.includes(
        "over_email_send_rate_limit"
      ) ||
      message.includes(
        "rate limit"
      )
    ) {
      return (
        "Foram feitas muitas tentativas. " +
        "Aguarde alguns minutos e tente novamente."
      );
    }


    if (
      message.includes(
        "manual linking"
      ) ||
      message.includes(
        "linking is disabled"
      )
    ) {
      return (
        "A ligação manual de contas ainda não está " +
        "ativada no Supabase."
      );
    }


    if (
      message.includes(
        "invalid email"
      )
    ) {
      return "Informe um email válido.";
    }


    return (
      error?.message ||
      "Não foi possível iniciar a criação da conta."
    );
  }


  /* ========================================================
     Carregamento
  ======================================================== */

  function setLoading(isLoading) {
    if (!submitButton) {
      return;
    }

    submitButton.disabled =
      isLoading;

    submitButton.setAttribute(
      "aria-busy",
      String(isLoading)
    );

    submitButton.innerHTML =
      isLoading
        ? `
            <span>A enviar...</span>
            <i data-lucide="loader-circle"></i>
          `
        : `
            <span>Continuar</span>
            <i data-lucide="arrow-right"></i>
          `;

    refreshIcons();
  }


  /* ========================================================
     Validação
  ======================================================== */

  function validateForm(
    fullName,
    email
  ) {
    if (fullName.length < 2) {
      return "Informe um nome válido.";
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(email)
    ) {
      return "Informe um email válido.";
    }

    return null;
  }


  /* ========================================================
     Atualizar perfil público
  ======================================================== */

  async function updateProfile(
    fullName,
    userId
  ) {
    const client =
      getSupabaseClient();

    if (
      !client ||
      !userId
    ) {
      return;
    }

    const {
      error,
    } = await client
      .from("profiles")
      .update({
        full_name: fullName,
      })
      .eq("id", userId);

    if (error) {
      console.warn(
        "O perfil público não foi atualizado:",
        error.message
      );
    }
  }

  /* ========================================================
    URL de confirmação
  ======================================================== */

  function getCompleteAccountRedirectUrl() {
    const hostname =
      window.location.hostname;

    const isLocalEnvironment =
      hostname === "127.0.0.1" ||
      hostname === "localhost";

    const origin =
      isLocalEnvironment
        ? PRODUCTION_ORIGIN
        : window.location.origin;

    return (
      `${origin}` +
      COMPLETE_ACCOUNT_PATH
    );
  }
  /* ========================================================
     Enviar formulário
  ======================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    clearError();


    const fullName =
      nameInput.value.trim();


    const email =
      emailInput.value
        .trim()
        .toLowerCase();


    const validationError =
      validateForm(
        fullName,
        email
      );


    if (validationError) {
      showError(validationError);
      return;
    }


    const client =
      getSupabaseClient();


    if (!client) {
      showError(
        "O cliente Supabase não foi carregado."
      );

      return;
    }


    setLoading(true);


    try {
      const {
        data: userData,
        error: userError,
      } =
        await client.auth.getUser();


      if (userError) {
        throw userError;
      }


      const user =
        userData?.user || null;


      if (!user) {
        throw new Error(
          "A sessão atual não foi encontrada."
        );
      }


      if (
        user.is_anonymous !== true
      ) {
        throw new Error(
          "Esta conta já não é uma conta de demonstração."
        );
      }


      const redirectTo =
        getCompleteAccountRedirectUrl();


      const {
        error: updateError,
      } =
        await client.auth.updateUser(
          {
            email,

            data: {
              full_name: fullName,

              account_conversion_started:
                true,

              account_conversion_started_at:
                new Date().toISOString(),
            },
          },
          {
            emailRedirectTo: redirectTo,
          }
        );


      if (updateError) {
        throw updateError;
      }


      await updateProfile(
        fullName,
        user.id
      );


      setStorageValue(
        STORAGE_KEYS.pendingEmail,
        email
      );


      setStorageValue(
        STORAGE_KEYS.pendingName,
        fullName
      );


      successEmailElement.textContent =
        email;


      formContent.hidden = true;

      successContent.hidden = false;


      refreshIcons();
    } catch (error) {
      console.error(
        "Erro ao converter conta demo:",
        error
      );

      showError(
        mapAuthenticationError(error)
      );
    } finally {
      setLoading(false);
    }
  }


  /* ========================================================
     Abrir modal
  ======================================================== */

  function openModal() {
    if (!isDemoMode()) {
      console.warn(
        "A criação de conta está disponível apenas no modo demo."
      );

      return;
    }


    createModal();

    clearError();

    form.reset();

    formContent.hidden = false;

    successContent.hidden = true;


    const pendingName =
      getStorageValue(
        STORAGE_KEYS.pendingName
      );


    const pendingEmail =
      getStorageValue(
        STORAGE_KEYS.pendingEmail
      );


    if (pendingName) {
      nameInput.value =
        pendingName;
    }


    if (pendingEmail) {
      emailInput.value =
        pendingEmail;
    }


    previousFocus =
      document.activeElement;


    previousBodyOverflow =
      document.body.style.overflow;


    modal.hidden = false;

    document.body.style.overflow =
      "hidden";


    window.setTimeout(
      function focusFirstField() {
        nameInput.focus();
      },
      30
    );
  }


  /* ========================================================
     Fechar modal
  ======================================================== */

  function closeModal() {
    if (
      !modal ||
      modal.hidden
    ) {
      return;
    }

    modal.hidden = true;

    document.body.style.overflow =
      previousBodyOverflow;

    previousFocus?.focus();
  }


  /* ========================================================
     Teclado
  ======================================================== */

  function handleKeyboard(event) {
    if (
      event.key === "Escape" &&
      modal &&
      !modal.hidden
    ) {
      closeModal();
    }
  }


  document.addEventListener(
    "keydown",
    handleKeyboard
  );


  /* ========================================================
     API pública
  ======================================================== */

  window.StudioVDemoAccount = {
    open: openModal,
    close: closeModal,
    isDemo: isDemoMode,
  };


  console.log(
    "Componente Demo Account carregado."
  );
})();
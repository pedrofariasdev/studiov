"use strict";

/* ==========================================================
   StudioV — Minha conta
========================================================== */

(function initializeProfilePage() {
  const ROUTES = {
    home: "/html/dashboard/home.html",
    login: "/html/auth/login.html",
  };

  const STORAGE_KEYS = {
    activeWorkspace:
      "studiov_active_workspace_id",

    demoMode:
      "studiov_demo_mode",

    demoUserId:
      "studiov_demo_user_id",

    demoTour:
      "studiov_demo_tour_completed",

    pendingEmail:
      "studiov_account_pending_email",

    pendingName:
      "studiov_account_pending_name",

    theme:
      "verseTheme",
  };

  const SECTION_TITLES = {
    overview: "Visão geral",
    personal: "Dados pessoais",
    security: "Segurança",
    preferences: "Preferências",
  };

  const state = {
    user: null,
    profile: null,
    workspace: null,
    activeSection: "overview",
    initialTheme: "light",
  };

  const elements = {
    sidebar: null,
    sidebarOverlay: null,
    mobileMenu: null,
    pageTitle: null,

    loading: null,
    errorState: null,
    errorMessage: null,
    content: null,

    logout: null,

    sidebarName: null,
    sidebarEmail: null,

    overviewName: null,
    overviewEmail: null,
    overviewStatus: null,
    overviewPlan: null,
    overviewWorkspace: null,
    overviewCreatedAt: null,
    overviewTimezone: null,

    personalForm: null,
    personalName: null,
    personalEmail: null,
    personalCountry: null,
    personalMessage: null,
    personalReset: null,
    personalSubmit: null,

    securityForm: null,
    currentPassword: null,
    newPassword: null,
    confirmPassword: null,
    securityMessage: null,
    securitySubmit: null,

    preferencesForm: null,
    language: null,
    timezone: null,
    preferencesMessage: null,
    preferencesReset: null,
    preferencesSubmit: null,
  };


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
    elements.sidebar =
      document.getElementById(
        "profile-sidebar"
      );

    elements.sidebarOverlay =
      document.getElementById(
        "profile-sidebar-overlay"
      );

    elements.mobileMenu =
      document.getElementById(
        "profile-mobile-menu"
      );

    elements.pageTitle =
      document.getElementById(
        "profile-page-title"
      );

    elements.loading =
      document.getElementById(
        "profile-loading"
      );

    elements.errorState =
      document.getElementById(
        "profile-error-state"
      );

    elements.errorMessage =
      document.getElementById(
        "profile-error-message"
      );

    elements.content =
      document.getElementById(
        "profile-content"
      );

    elements.logout =
      document.getElementById(
        "profile-logout"
      );

    elements.sidebarName =
      document.getElementById(
        "sidebar-profile-name"
      );

    elements.sidebarEmail =
      document.getElementById(
        "sidebar-profile-email"
      );

    elements.overviewName =
      document.getElementById(
        "overview-profile-name"
      );

    elements.overviewEmail =
      document.getElementById(
        "overview-profile-email"
      );

    elements.overviewStatus =
      document.getElementById(
        "overview-account-status"
      );

    elements.overviewPlan =
      document.getElementById(
        "overview-plan"
      );

    elements.overviewWorkspace =
      document.getElementById(
        "overview-workspace"
      );

    elements.overviewCreatedAt =
      document.getElementById(
        "overview-created-at"
      );

    elements.overviewTimezone =
      document.getElementById(
        "overview-timezone"
      );

    elements.personalForm =
      document.getElementById(
        "personal-profile-form"
      );

    elements.personalName =
      document.getElementById(
        "personal-full-name"
      );

    elements.personalEmail =
      document.getElementById(
        "personal-email"
      );

    elements.personalCountry =
      document.getElementById(
        "personal-country"
      );

    elements.personalMessage =
      document.getElementById(
        "personal-profile-message"
      );

    elements.personalReset =
      document.getElementById(
        "personal-profile-reset"
      );

    elements.personalSubmit =
      document.getElementById(
        "personal-profile-submit"
      );

    elements.securityForm =
      document.getElementById(
        "security-profile-form"
      );

    elements.currentPassword =
      document.getElementById(
        "current-password"
      );

    elements.newPassword =
      document.getElementById(
        "new-password"
      );

    elements.confirmPassword =
      document.getElementById(
        "confirm-new-password"
      );

    elements.securityMessage =
      document.getElementById(
        "security-profile-message"
      );

    elements.securitySubmit =
      document.getElementById(
        "security-profile-submit"
      );

    elements.preferencesForm =
      document.getElementById(
        "preferences-profile-form"
      );

    elements.language =
      document.getElementById(
        "profile-language"
      );

    elements.timezone =
      document.getElementById(
        "profile-timezone"
      );

    elements.preferencesMessage =
      document.getElementById(
        "preferences-profile-message"
      );

    elements.preferencesReset =
      document.getElementById(
        "preferences-profile-reset"
      );

    elements.preferencesSubmit =
      document.getElementById(
        "preferences-profile-submit"
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
     Estados principais
  ======================================================== */

  function showLoading() {
    elements.loading.hidden = false;
    elements.errorState.hidden = true;
    elements.content.hidden = true;
  }


  function showContent() {
    elements.loading.hidden = true;
    elements.errorState.hidden = true;
    elements.content.hidden = false;
  }


  function showErrorState(message) {
    elements.loading.hidden = true;
    elements.content.hidden = true;

    elements.errorMessage.textContent =
      message;

    elements.errorState.hidden = false;

    refreshIcons();
  }


  /* ========================================================
     Sidebar mobile
  ======================================================== */

  function openSidebar() {
    document.body.classList.add(
      "profile-sidebar-open"
    );

    elements.sidebarOverlay.hidden = false;

    elements.mobileMenu.setAttribute(
      "aria-expanded",
      "true"
    );
  }


  function closeSidebar() {
    document.body.classList.remove(
      "profile-sidebar-open"
    );

    elements.sidebarOverlay.hidden = true;

    elements.mobileMenu.setAttribute(
      "aria-expanded",
      "false"
    );
  }


  /* ========================================================
     Navegação interna
  ======================================================== */

  function setActiveSection(
    section,
    updateHash = true
  ) {
    if (!SECTION_TITLES[section]) {
      section = "overview";
    }

    state.activeSection = section;

    document
      .querySelectorAll(
        "[data-profile-section]"
      )
      .forEach(function (button) {
        const isActive =
          button.dataset.profileSection ===
          section;

        button.classList.toggle(
          "is-active",
          isActive
        );

        if (isActive) {
          button.setAttribute(
            "aria-current",
            "page"
          );
        } else {
          button.removeAttribute(
            "aria-current"
          );
        }
      });


    document
      .querySelectorAll(
        "[data-profile-panel]"
      )
      .forEach(function (panel) {
        panel.hidden =
          panel.dataset.profilePanel !==
          section;
      });


    elements.pageTitle.textContent =
      SECTION_TITLES[section];


    if (updateHash) {
      history.replaceState(
        null,
        "",
        `#${section}`
      );
    }


    closeSidebar();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  /* ========================================================
     Tema
  ======================================================== */

  function readStoredTheme() {
    const stored =
      localStorage.getItem(
        STORAGE_KEYS.theme
      );

    if (stored) {
      try {
        const parsed =
          JSON.parse(stored);

        if (
          parsed === "light" ||
          parsed === "dark"
        ) {
          return parsed;
        }
      } catch (_error) {
        if (
          stored === "light" ||
          stored === "dark"
        ) {
          return stored;
        }
      }
    }

    return document.body.classList.contains(
      "dark-theme"
    )
      ? "dark"
      : "light";
  }


  function applyTheme(theme) {
    const safeTheme =
      theme === "dark"
        ? "dark"
        : "light";


    if (
      typeof window.alterarTema ===
      "function"
    ) {
      window.alterarTema(
        safeTheme
      );

      return;
    }


    localStorage.setItem(
      STORAGE_KEYS.theme,
      safeTheme
    );

    document.body.classList.toggle(
      "dark-theme",
      safeTheme === "dark"
    );
  }


  function getSelectedTheme() {
    return (
      document.querySelector(
        'input[name="profileTheme"]:checked'
      )?.value ||
      "light"
    );
  }


  function selectTheme(theme) {
    const input =
      document.querySelector(
        `input[name="profileTheme"][value="${theme}"]`
      );

    if (input) {
      input.checked = true;
    }
  }


  /* ========================================================
     Formatação
  ======================================================== */

  function getDisplayName() {
    return (
      state.profile?.full_name ||
      state.user?.user_metadata
        ?.full_name ||
      state.user?.email
        ?.split("@")[0] ||
      "Utilizador StudioV"
    );
  }


  function getInitial(name) {
    return String(name || "U")
      .trim()
      .charAt(0)
      .toUpperCase();
  }


  function formatDate(value) {
    if (!value) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "pt-PT",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(
      new Date(value)
    );
  }


  function formatPlan(plan) {
    const plans = {
      free: "Básico",
      starter: "Starter",
      professional: "Professional",
      business: "Empresa",
    };

    return (
      plans[plan] ||
      plan ||
      "Básico"
    );
  }


  function formatAccountStatus(status) {
    const statuses = {
      active: "Conta ativa",
      suspended: "Conta suspensa",
      inactive: "Conta inativa",
    };

    return (
      statuses[status] ||
      "Conta ativa"
    );
  }


  /* ========================================================
     Avatar
  ======================================================== */

  function renderAvatars() {
    const name =
      getDisplayName();

    const initial =
      getInitial(name);

    const avatarUrl =
      state.profile?.avatar_url ||
      null;


    document
      .querySelectorAll(
        "[data-profile-avatar-fallback]"
      )
      .forEach(function (element) {
        element.textContent =
          initial;

        element.hidden =
          Boolean(avatarUrl);
      });


    document
      .querySelectorAll(
        "[data-profile-avatar-image]"
      )
      .forEach(function (image) {
        if (!avatarUrl) {
          image.hidden = true;
          image.removeAttribute("src");
          return;
        }

        image.src = avatarUrl;
        image.alt =
          `Avatar de ${name}`;

        image.hidden = false;


        image.onerror =
          function handleAvatarError() {
            image.hidden = true;

            image
              .parentElement
              ?.querySelector(
                "[data-profile-avatar-fallback]"
              )
              ?.removeAttribute(
                "hidden"
              );
          };
      });
  }


  /* ========================================================
     Renderizar dados
  ======================================================== */

  function renderProfile() {
    const name =
      getDisplayName();

    const email =
      state.user?.email || "—";

    const timezone =
      state.profile?.timezone ||
      "Europe/Lisbon";

    const status =
      state.profile?.account_status ||
      "active";


    elements.sidebarName.textContent =
      name;

    elements.sidebarEmail.textContent =
      email;

    elements.overviewName.textContent =
      name;

    elements.overviewEmail.textContent =
      email;

    elements.overviewStatus.textContent =
      formatAccountStatus(status);

    elements.overviewPlan.textContent =
      formatPlan(
        state.workspace?.plan
      );

    elements.overviewWorkspace.textContent =
      state.workspace?.name ||
      "Sem workspace";

    elements.overviewCreatedAt.textContent =
      formatDate(
        state.user?.created_at
      );

    elements.overviewTimezone.textContent =
      timezone;


    elements.personalName.value =
      name;

    elements.personalEmail.value =
      email;

    elements.personalCountry.value =
      state.profile?.country || "";


    elements.language.value =
      state.profile?.language ||
      "pt-PT";

    elements.timezone.value =
      timezone;


    state.initialTheme =
      readStoredTheme();

    selectTheme(
      state.initialTheme
    );


    renderAvatars();
    refreshIcons();
  }


  /* ========================================================
     Carregar workspace
  ======================================================== */

  async function loadWorkspace(
    client,
    user
  ) {
    const storedWorkspaceId =
      localStorage.getItem(
        STORAGE_KEYS.activeWorkspace
      );


    if (storedWorkspaceId) {
      const {
        data,
        error,
      } = await client
        .from("workspaces")
        .select(
          `
            id,
            name,
            plan,
            status,
            created_at
          `
        )
        .eq(
          "id",
          storedWorkspaceId
        )
        .maybeSingle();


      if (!error && data) {
        return data;
      }
    }


    const {
      data,
      error,
    } = await client
      .from("workspaces")
      .select(
        `
          id,
          name,
          plan,
          status,
          created_at
        `
      )
      .eq(
        "owner_id",
        user.id
      )
      .eq(
        "status",
        "active"
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();


    if (error) {
      console.warn(
        "Workspace não carregado:",
        error.message
      );

      return null;
    }


    if (data?.id) {
      localStorage.setItem(
        STORAGE_KEYS.activeWorkspace,
        data.id
      );
    }


    return data || null;
  }


  /* ========================================================
     Carregar conta
  ======================================================== */

  async function loadAccount() {
    const client =
      getClient();


    if (!client) {
      throw new Error(
        "O cliente Supabase não foi carregado."
      );
    }


    if (
      window.studioVAuthReady &&
      typeof window.studioVAuthReady.then ===
        "function"
    ) {
      await window.studioVAuthReady;
    }


    const {
      data: userData,
      error: userError,
    } = await client.auth.getUser();


    if (userError) {
      throw userError;
    }


    const user =
      userData?.user || null;


    if (!user) {
      window.location.replace(
        ROUTES.login
      );

      return;
    }


    const {
      data: profile,
      error: profileError,
    } = await client
      .from("profiles")
      .select(
        `
          id,
          avatar_url,
          full_name,
          country,
          language,
          timezone,
          account_status,
          onboarding_completed,
          created_at,
          updated_at
        `
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();


    if (profileError) {
      throw profileError;
    }


    state.user =
      user;

    state.profile =
      profile || {
        id: user.id,
        full_name:
          user.user_metadata
            ?.full_name || null,
        country: null,
        language: "pt-PT",
        timezone: "Europe/Lisbon",
        account_status: "active",
        avatar_url: null,
      };


    state.workspace =
      await loadWorkspace(
        client,
        user
      );


    renderProfile();
    showContent();
  }


  /* ========================================================
     Mensagens dos formulários
  ======================================================== */

  function clearMessage(element) {
    element.textContent = "";
    element.hidden = true;

    element.classList.remove(
      "is-success",
      "is-error"
    );
  }


  function showMessage(
    element,
    type,
    message
  ) {
    element.textContent =
      message;

    element.classList.remove(
      "is-success",
      "is-error"
    );

    element.classList.add(
      type === "success"
        ? "is-success"
        : "is-error"
    );

    element.hidden = false;
  }


  /* ========================================================
     Estado dos botões
  ======================================================== */

  function setButtonLoading(
    button,
    isLoading,
    normalText,
    loadingText,
    icon
  ) {
    button.disabled =
      isLoading;

    button.setAttribute(
      "aria-busy",
      String(isLoading)
    );

    button.innerHTML =
      isLoading
        ? `
            <i data-lucide="loader-circle"></i>
            <span>${loadingText}</span>
          `
        : `
            <i data-lucide="${icon}"></i>
            <span>${normalText}</span>
          `;

    refreshIcons();
  }


  /* ========================================================
     Guardar dados pessoais
  ======================================================== */

  async function handlePersonalSubmit(
    event
  ) {
    event.preventDefault();

    clearMessage(
      elements.personalMessage
    );


    const fullName =
      elements.personalName
        .value
        .trim();

    const country =
      elements.personalCountry
        .value
        .trim();


    if (fullName.length < 2) {
      showMessage(
        elements.personalMessage,
        "error",
        "Informe um nome completo válido."
      );

      return;
    }


    const client =
      getClient();


    setButtonLoading(
      elements.personalSubmit,
      true,
      "Guardar alterações",
      "A guardar...",
      "save"
    );


    try {
      const {
        data: authData,
        error: authError,
      } = await client.auth.updateUser({
        data: {
          full_name: fullName,
        },
      });


      if (authError) {
        throw authError;
      }


      const {
        error: profileError,
      } = await client
        .from("profiles")
        .update({
          full_name: fullName,
          country:
            country || null,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          state.user.id
        );


      if (profileError) {
        throw profileError;
      }


      state.user =
        authData?.user ||
        state.user;

      state.profile.full_name =
        fullName;

      state.profile.country =
        country || null;


      renderProfile();


      showMessage(
        elements.personalMessage,
        "success",
        "Os dados pessoais foram atualizados com sucesso."
      );


      window.dispatchEvent(
        new CustomEvent(
          "studiov:profile-updated",
          {
            detail: {
              fullName,
              country,
            },
          }
        )
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar perfil:",
        error
      );


        const errorMessage =
        String(
            error?.message || ""
        ).toLowerCase();


        if (
        errorMessage.includes(
            "profiles_country_check"
        )
        ) {
        showMessage(
            elements.personalMessage,
            "error",
            "Selecione um país válido na lista."
        );
        } else {
        showMessage(
            elements.personalMessage,
            "error",
            error?.message ||
            "Não foi possível atualizar os dados pessoais."
        );
        }
    } finally {
      setButtonLoading(
        elements.personalSubmit,
        false,
        "Guardar alterações",
        "A guardar...",
        "save"
      );
    }
  }


  function resetPersonalForm() {
    clearMessage(
      elements.personalMessage
    );

    elements.personalName.value =
      getDisplayName();

    elements.personalCountry.value =
      state.profile?.country || "";
  }


  /* ========================================================
     Alterar palavra-passe
  ======================================================== */

  async function handleSecuritySubmit(
    event
  ) {
    event.preventDefault();

    clearMessage(
      elements.securityMessage
    );


    const currentPassword =
      elements.currentPassword.value;

    const newPassword =
      elements.newPassword.value;

    const confirmation =
      elements.confirmPassword.value;


    if (!currentPassword) {
      showMessage(
        elements.securityMessage,
        "error",
        "Informe a palavra-passe atual."
      );

      return;
    }


    if (newPassword.length < 8) {
      showMessage(
        elements.securityMessage,
        "error",
        "A nova palavra-passe deve ter pelo menos 8 caracteres."
      );

      return;
    }


    if (
      newPassword !==
      confirmation
    ) {
      showMessage(
        elements.securityMessage,
        "error",
        "As novas palavras-passe não coincidem."
      );

      return;
    }


    if (
      currentPassword ===
      newPassword
    ) {
      showMessage(
        elements.securityMessage,
        "error",
        "A nova palavra-passe deve ser diferente da atual."
      );

      return;
    }


    const client =
      getClient();


    setButtonLoading(
      elements.securitySubmit,
      true,
      "Atualizar palavra-passe",
      "A atualizar...",
      "key-round"
    );


    try {
      const {
        error,
      } = await client.auth.updateUser({
        password: newPassword,
        currentPassword:
          currentPassword,
      });


      if (error) {
        throw error;
      }


      elements.securityForm.reset();


      showMessage(
        elements.securityMessage,
        "success",
        "A palavra-passe foi atualizada com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao alterar palavra-passe:",
        error
      );


      const errorMessage =
        String(
          error?.message || ""
        ).toLowerCase();


      if (
        errorMessage.includes(
          "current password"
        ) ||
        errorMessage.includes(
          "invalid login"
        )
      ) {
        showMessage(
          elements.securityMessage,
          "error",
          "A palavra-passe atual está incorreta."
        );
      } else if (
        errorMessage.includes(
          "reauthentication"
        ) ||
        errorMessage.includes(
          "nonce"
        )
      ) {
        showMessage(
          elements.securityMessage,
          "error",
          "A sessão precisa ser confirmada novamente antes de alterar a palavra-passe."
        );
      } else {
        showMessage(
          elements.securityMessage,
          "error",
          error?.message ||
          "Não foi possível alterar a palavra-passe."
        );
      }
    } finally {
      setButtonLoading(
        elements.securitySubmit,
        false,
        "Atualizar palavra-passe",
        "A atualizar...",
        "key-round"
      );
    }
  }


  /* ========================================================
     Guardar preferências
  ======================================================== */

  async function handlePreferencesSubmit(
    event
  ) {
    event.preventDefault();

    clearMessage(
      elements.preferencesMessage
    );


    const language =
      elements.language.value;

    const timezone =
      elements.timezone.value;

    const theme =
      getSelectedTheme();


    const client =
      getClient();


    setButtonLoading(
      elements.preferencesSubmit,
      true,
      "Guardar preferências",
      "A guardar...",
      "save"
    );


    try {
      const {
        error,
      } = await client
        .from("profiles")
        .update({
          language,
          timezone,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          state.user.id
        );


      if (error) {
        throw error;
      }


      applyTheme(theme);


      state.profile.language =
        language;

      state.profile.timezone =
        timezone;

      state.initialTheme =
        theme;


      elements.overviewTimezone.textContent =
        timezone;


      showMessage(
        elements.preferencesMessage,
        "success",
        "As preferências foram guardadas com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar preferências:",
        error
      );


      showMessage(
        elements.preferencesMessage,
        "error",
        error?.message ||
        "Não foi possível guardar as preferências."
      );
    } finally {
      setButtonLoading(
        elements.preferencesSubmit,
        false,
        "Guardar preferências",
        "A guardar...",
        "save"
      );
    }
  }


  function resetPreferencesForm() {
    clearMessage(
      elements.preferencesMessage
    );

    elements.language.value =
      state.profile?.language ||
      "pt-PT";

    elements.timezone.value =
      state.profile?.timezone ||
      "Europe/Lisbon";

    selectTheme(
      state.initialTheme
    );

    applyTheme(
      state.initialTheme
    );
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
            const input =
              document.getElementById(
                button.dataset
                  .passwordToggle
              );


            if (!input) {
              return;
            }


            const isHidden =
              input.type ===
              "password";


            input.type =
              isHidden
                ? "text"
                : "password";


            button.innerHTML =
              isHidden
                ? `
                    <i data-lucide="eye-off"></i>
                  `
                : `
                    <i data-lucide="eye"></i>
                  `;


            button.setAttribute(
              "aria-label",
              isHidden
                ? "Ocultar palavra-passe"
                : "Mostrar palavra-passe"
            );


            refreshIcons();
          }
        );
      });
  }


  /* ========================================================
     Logout
  ======================================================== */

  function clearLocalSession() {
    Object.values(
      STORAGE_KEYS
    ).forEach(function (key) {
      if (
        key !==
        STORAGE_KEYS.theme
      ) {
        localStorage.removeItem(
          key
        );
      }
    });
  }


  async function handleLogout() {
    const client =
      getClient();


    elements.logout.disabled = true;


    try {
      if (client) {
        const {
          error,
        } = await client.auth.signOut();


        if (error) {
          throw error;
        }
      }


      clearLocalSession();


      window.location.replace(
        ROUTES.login
      );
    } catch (error) {
      console.error(
        "Erro ao terminar sessão:",
        error
      );


      elements.logout.disabled = false;


      alert(
        "Não foi possível terminar a sessão."
      );
    }
  }


  /* ========================================================
     Eventos
  ======================================================== */

  function registerEvents() {
    elements.mobileMenu.addEventListener(
      "click",
      openSidebar
    );

    elements.sidebarOverlay.addEventListener(
      "click",
      closeSidebar
    );


    document
      .querySelectorAll(
        "[data-profile-section]"
      )
      .forEach(function (button) {
        button.addEventListener(
          "click",
          function () {
            setActiveSection(
              button.dataset
                .profileSection
            );
          }
        );
      });


    document
      .querySelectorAll(
        "[data-profile-open-section]"
      )
      .forEach(function (button) {
        button.addEventListener(
          "click",
          function () {
            setActiveSection(
              button.dataset
                .profileOpenSection
            );
          }
        );
      });


    document
      .querySelectorAll(
        'input[name="profileTheme"]'
      )
      .forEach(function (input) {
        input.addEventListener(
          "change",
          function () {
            if (input.checked) {
              applyTheme(
                input.value
              );
            }
          }
        );
      });


    elements.personalForm.addEventListener(
      "submit",
      handlePersonalSubmit
    );

    elements.personalReset.addEventListener(
      "click",
      resetPersonalForm
    );

    elements.securityForm.addEventListener(
      "submit",
      handleSecuritySubmit
    );

    elements.preferencesForm.addEventListener(
      "submit",
      handlePreferencesSubmit
    );

    elements.preferencesReset.addEventListener(
      "click",
      resetPreferencesForm
    );

    elements.logout.addEventListener(
      "click",
      handleLogout
    );


    window.addEventListener(
      "hashchange",
      function () {
        const section =
          window.location.hash
            .replace("#", "");

        setActiveSection(
          section,
          false
        );
      }
    );


    window.addEventListener(
      "resize",
      function () {
        if (
          window.innerWidth > 820
        ) {
          closeSidebar();
        }
      }
    );


    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Escape") {
          closeSidebar();
        }
      }
    );


    registerPasswordToggles();
  }


  /* ========================================================
     Inicialização
  ======================================================== */

  async function initialize() {
    getElements();
    registerEvents();
    refreshIcons();
    showLoading();


    const initialSection =
      window.location.hash
        .replace("#", "");


    setActiveSection(
      SECTION_TITLES[
        initialSection
      ]
        ? initialSection
        : "overview",
      false
    );


    try {
      await loadAccount();
    } catch (error) {
      console.error(
        "Erro ao carregar perfil:",
        error
      );


      showErrorState(
        error?.message ||
        "Não foi possível carregar os dados da sua conta."
      );
    }
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


  window.StudioVProfile = {
    refresh: loadAccount,
    openSection: setActiveSection,
  };
})();

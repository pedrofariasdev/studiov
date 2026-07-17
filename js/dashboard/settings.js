"use strict";

document.addEventListener("DOMContentLoaded", async function () {
  const supabaseClient = window.supabaseClient;

  /* =======================================================
     Configurações gerais
  ======================================================= */

  const LOGIN_URL = "/html/login.html";

  const STORAGE_KEYS = {
    theme: "studiov_theme",
    language: "studiov_language",
    notifications: "studiov_notifications",
    workspaceId: "studiov_active_workspace_id",
    demoMode: "studiov_demo_mode",
    demoUserId: "studiov_demo_user_id",
  };

  const DEFAULT_NOTIFICATIONS = {
    contentApproval: true,
    scheduledContent: true,
    publication: true,
    workspace: true,
    importantActivity: true,
    weeklySummary: false,
    productNews: false,
  };



  let currentUser = null;
  let currentProfile = null;
  let currentWorkspaceId = null;
  let saveStatusTimeout = null;

  /* =======================================================
     Elementos
  ======================================================= */

  const navigationButtons = Array.from(
    document.querySelectorAll(
      ".settings-navigation-item[data-settings-section]"
    )
  );

  const sections = Array.from(
    document.querySelectorAll(
      ".settings-section[data-section-name]"
    )
  );

  const themeInputs = Array.from(
    document.querySelectorAll('input[name="theme"]')
  );

  const languageSelect = document.getElementById(
    "settings-language"
  );

  const saveStatus = document.getElementById(
    "settings-save-status"
  );

  const profileForm = document.getElementById(
    "settings-profile-form"
  );

  const fullNameInput = document.getElementById(
    "settings-full-name"
  );

  const emailInput = document.getElementById(
    "settings-email"
  );

  const saveProfileButton = document.getElementById(
    "save-profile-button"
  );

  const changePasswordButton = document.getElementById(
    "change-password-button"
  );

  const signOutAllButton = document.getElementById(
    "sign-out-all-button"
  );

  const passwordModal = document.getElementById(
    "password-modal"
  );

  const passwordForm = document.getElementById(
    "password-form"
  );

  const newPasswordInput = document.getElementById(
    "new-password"
  );

  const confirmPasswordInput = document.getElementById(
    "confirm-new-password"
  );

  const savePasswordButton = document.getElementById(
    "save-password-button"
  );

  const closePasswordModalButtons = Array.from(
    document.querySelectorAll(
      "[data-close-password-modal]"
    )
  );

  const integrationsList = document.getElementById(
    "settings-integrations-list"
  );

  const toastContainer = document.getElementById(
    "settings-toast-container"
  );

  const sidebarUserName = document.getElementById(
    "sidebar-user-name"
  );

  const sidebarUserEmail = document.getElementById(
    "sidebar-user-email"
  );

  const sidebarUserAvatar = document.getElementById(
    "sidebar-user-avatar"
  );

  const topbarAvatar = document.getElementById(
    "topbar-avatar"
  );

  const currentWorkspaceName = document.getElementById(
    "current-workspace-name"
  );

  const notificationInputs = {
    contentApproval: document.getElementById(
      "notification-content-approval"
    ),

    scheduledContent: document.getElementById(
      "notification-scheduled-content"
    ),

    publication: document.getElementById(
      "notification-publication"
    ),

    workspace: document.getElementById(
      "notification-workspace"
    ),

    importantActivity: document.getElementById(
      "email-important-activity"
    ),

    weeklySummary: document.getElementById(
      "email-weekly-summary"
    ),

    productNews: document.getElementById(
      "email-product-news"
    ),
  };

  /* =======================================================
     Utilitários
  ======================================================= */

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function escapeHtml(value) {
    const element = document.createElement("div");

    element.textContent = String(value ?? "");

    return element.innerHTML;
  }

  function getInitial(value) {
    const cleanValue = String(value || "U").trim();

    return cleanValue.charAt(0).toUpperCase() || "U";
  }

  function setButtonLoading(
    button,
    isLoading,
    loadingText
  ) {
    if (!button) {
      return;
    }

    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = button.innerHTML;
    }

    button.disabled = isLoading;

    if (isLoading) {
      button.innerHTML = `
        <i data-lucide="loader-circle"></i>
        ${escapeHtml(loadingText)}
      `;

      button.classList.add("is-loading");
    } else {
      button.innerHTML =
        button.dataset.originalHtml;

      button.classList.remove("is-loading");
    }

    refreshIcons();
  }

  function showSaveStatus() {
    if (!saveStatus) {
      return;
    }

    window.clearTimeout(saveStatusTimeout);

    saveStatus.classList.add("visible");

    saveStatusTimeout = window.setTimeout(
      function () {
        saveStatus.classList.remove("visible");
      },
      2200
    );
  }

  function showToast(
    type,
    title,
    message
  ) {
    if (!toastContainer) {
      console.log(title, message);
      return;
    }

    const iconByType = {
      success: "circle-check",
      error: "circle-alert",
      info: "info",
    };

    const toast = document.createElement("article");

    toast.className = `settings-toast ${type}`;

    toast.innerHTML = `
      <span class="settings-toast-icon">
        <i data-lucide="${
          iconByType[type] || "info"
        }"></i>
      </span>

      <div class="settings-toast-content">
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(message)}</p>
      </div>

      <button
        class="settings-toast-close"
        type="button"
        aria-label="Fechar notificação"
      >
        <i data-lucide="x"></i>
      </button>
    `;

    toastContainer.appendChild(toast);

    const closeButton = toast.querySelector(
      ".settings-toast-close"
    );

    function removeToast() {
      toast.remove();
    }

    closeButton?.addEventListener(
      "click",
      removeToast
    );

    window.setTimeout(removeToast, 5000);

    refreshIcons();
  }

  function safeLocalStorageGet(key) {
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

  function safeLocalStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(
        `Não foi possível guardar ${key}:`,
        error
      );

      return false;
    }
  }

  function safeLocalStorageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(
        `Não foi possível remover ${key}:`,
        error
      );
    }
  }

  /* =======================================================
     Navegação interna
  ======================================================= */

  function openSettingsSection(sectionName) {
    navigationButtons.forEach(function (button) {
      const isActive =
        button.dataset.settingsSection ===
        sectionName;

      button.classList.toggle(
        "active",
        isActive
      );

      button.setAttribute(
        "aria-selected",
        String(isActive)
      );
    });

    sections.forEach(function (section) {
      const isActive =
        section.dataset.sectionName ===
        sectionName;

      section.classList.toggle(
        "active",
        isActive
      );

      section.hidden = !isActive;
    });

    window.history.replaceState(
      null,
      "",
      `#${sectionName}`
    );

    refreshIcons();
  }

  function initializeNavigation() {
    const requestedSection =
      window.location.hash.replace("#", "");

    const sectionExists = sections.some(
      function (section) {
        return (
          section.dataset.sectionName ===
          requestedSection
        );
      }
    );

    openSettingsSection(
      sectionExists
        ? requestedSection
        : "appearance"
    );

    navigationButtons.forEach(function (button) {
      button.addEventListener(
        "click",
        function () {
          openSettingsSection(
            button.dataset.settingsSection
          );
        }
      );
    });
  }

    /* =======================================================
    Tema
    ======================================================= */

   function initializeTheme() {
    const themeManager =
        window.StudioVTheme;

    if (!themeManager) {
        console.error(
        "O gestor global de tema não foi carregado."
        );

        return;
    }

    function updateSelectedTheme() {
        const currentPreference =
        themeManager.getPreference();

        themeInputs.forEach(function (input) {
        input.checked =
            input.value === currentPreference;
        });
    }

    updateSelectedTheme();

    themeInputs.forEach(function (input) {
        input.addEventListener(
        "change",
        function () {
            if (!input.checked) {
            return;
            }

            themeManager.setTheme(input.value);

            updateSelectedTheme();
            showSaveStatus();

            const messages = {
            light:
                "O tema claro foi aplicado em toda a plataforma.",

            dark:
                "O tema escuro foi aplicado em toda a plataforma.",

            system:
                "A plataforma seguirá o tema do dispositivo.",
            };

            showToast(
            "success",
            "Tema atualizado",
            messages[input.value]
            );
        }
        );
    });

    window.addEventListener(
        "studiov:theme-change",
        updateSelectedTheme
    );
    }
  /* =======================================================
     Idioma
  ======================================================= */

  function initializeLanguage() {
    if (!languageSelect) {
      return;
    }

    const savedLanguage =
      safeLocalStorageGet(
        STORAGE_KEYS.language
      ) || "pt-PT";

    const optionExists = Array.from(
      languageSelect.options
    ).some(function (option) {
      return option.value === savedLanguage;
    });

    languageSelect.value = optionExists
      ? savedLanguage
      : "pt-PT";

    languageSelect.addEventListener(
      "change",
      function () {
        safeLocalStorageSet(
          STORAGE_KEYS.language,
          languageSelect.value
        );

        document.documentElement.lang =
          languageSelect.value;

        showSaveStatus();

        showToast(
          "info",
          "Idioma guardado",
          "A tradução completa da interface será aplicada progressivamente."
        );
      }
    );
  }

  /* =======================================================
     Notificações
  ======================================================= */

  function getSavedNotifications() {
    const savedValue = safeLocalStorageGet(
      STORAGE_KEYS.notifications
    );

    if (!savedValue) {
      return {
        ...DEFAULT_NOTIFICATIONS,
      };
    }

    try {
      return {
        ...DEFAULT_NOTIFICATIONS,
        ...JSON.parse(savedValue),
      };
    } catch (error) {
      console.warn(
        "Configurações de notificações inválidas:",
        error
      );

      return {
        ...DEFAULT_NOTIFICATIONS,
      };
    }
  }

  function collectNotificationSettings() {
    const settings = {};

    Object.entries(
      notificationInputs
    ).forEach(function ([key, input]) {
      settings[key] = Boolean(input?.checked);
    });

    return settings;
  }

  function saveNotificationSettings() {
    const settings =
      collectNotificationSettings();

    safeLocalStorageSet(
      STORAGE_KEYS.notifications,
      JSON.stringify(settings)
    );

    showSaveStatus();
  }

  function initializeNotifications() {
    const savedSettings =
      getSavedNotifications();

    Object.entries(
      notificationInputs
    ).forEach(function ([key, input]) {
      if (!input) {
        return;
      }

      input.checked =
        Boolean(savedSettings[key]);

      input.addEventListener(
        "change",
        saveNotificationSettings
      );
    });
  }

  /* =======================================================
     Autenticação e perfil
  ======================================================= */

  async function loadAuthenticatedUser() {
    if (!supabaseClient) {
      throw new Error(
        "O cliente do Supabase não foi carregado."
      );
    }

    const {
      data,
      error,
    } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data.user) {
      window.location.replace(LOGIN_URL);
      return null;
    }

    currentUser = data.user;

    return currentUser;
  }

  async function loadProfile() {
    if (!currentUser) {
      return null;
    }

    const {
      data,
      error,
    } = await supabaseClient
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.warn(
        "Erro ao carregar perfil:",
        error.message
      );

      currentProfile = null;
      return null;
    }

    currentProfile = data;

    return currentProfile;
  }

  function renderUserInformation() {
    if (!currentUser) {
      return;
    }

    const isAnonymous =
      Boolean(currentUser.is_anonymous);

    const fullName =
      currentProfile?.full_name ||
      currentUser.user_metadata?.full_name ||
      (isAnonymous
        ? "Utilizador demo"
        : "Utilizador");

    const email =
      currentUser.email ||
      (isAnonymous
        ? "Sessão de demonstração"
        : "Email não informado");

    const initial = getInitial(fullName);

    if (fullNameInput) {
      fullNameInput.value =
        isAnonymous ? "" : fullName;

      fullNameInput.disabled = isAnonymous;

      if (isAnonymous) {
        fullNameInput.placeholder =
          "Disponível após criar a conta";
      }
    }

    if (emailInput) {
      emailInput.value =
        currentUser.email || "";

      emailInput.disabled = isAnonymous;

      if (isAnonymous) {
        emailInput.placeholder =
          "Crie uma conta para adicionar email";
      }
    }

    if (saveProfileButton) {
      saveProfileButton.disabled =
        isAnonymous;
    }

    if (changePasswordButton) {
      changePasswordButton.disabled =
        isAnonymous;

      if (isAnonymous) {
        changePasswordButton.title =
          "Crie uma conta para definir uma palavra-passe.";
      }
    }

    if (sidebarUserName) {
      sidebarUserName.textContent = fullName;
    }

    if (sidebarUserEmail) {
      sidebarUserEmail.textContent = email;
    }

    if (sidebarUserAvatar) {
      sidebarUserAvatar.textContent = initial;
    }

    if (topbarAvatar) {
      topbarAvatar.textContent = initial;
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    if (currentUser.is_anonymous) {
      showToast(
        "info",
        "Conta de demonstração",
        "Crie uma conta permanente para alterar os dados pessoais."
      );

      return;
    }

    const fullName =
      fullNameInput?.value.trim() || "";

    const newEmail =
      emailInput?.value.trim().toLowerCase() ||
      "";

    if (fullName.length < 2) {
      showToast(
        "error",
        "Nome inválido",
        "Informe um nome com pelo menos 2 caracteres."
      );

      fullNameInput?.focus();
      return;
    }

    if (!newEmail) {
      showToast(
        "error",
        "Email obrigatório",
        "Informe um endereço de email válido."
      );

      emailInput?.focus();
      return;
    }

    setButtonLoading(
      saveProfileButton,
      true,
      "A guardar..."
    );

    try {
      const {
        error: profileError,
      } = await supabaseClient
        .from("profiles")
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id);

      if (profileError) {
        throw profileError;
      }

      const currentEmail =
        currentUser.email?.toLowerCase() || "";

      let emailChanged = false;

      if (newEmail !== currentEmail) {
        const {
          error: emailError,
        } = await supabaseClient.auth.updateUser({
          email: newEmail,
        });

        if (emailError) {
          throw emailError;
        }

        emailChanged = true;
      }

      currentProfile = {
        ...currentProfile,
        full_name: fullName,
      };

      renderUserInformation();
      showSaveStatus();

      showToast(
        "success",
        "Perfil atualizado",
        emailChanged
          ? "Verifique o novo endereço de email para confirmar a alteração."
          : "As informações pessoais foram guardadas."
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar perfil:",
        error
      );

      showToast(
        "error",
        "Não foi possível guardar",
        error.message ||
          "Ocorreu um erro ao atualizar o perfil."
      );
    } finally {
      setButtonLoading(
        saveProfileButton,
        false,
        ""
      );
    }
  }

  /* =======================================================
     Palavra-passe
  ======================================================= */

  function openPasswordModal() {
    if (!passwordModal) {
      return;
    }

    if (currentUser?.is_anonymous) {
      showToast(
        "info",
        "Conta de demonstração",
        "Crie uma conta permanente para definir uma palavra-passe."
      );

      return;
    }

    passwordModal.classList.add("open");
    passwordModal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow = "hidden";

    window.setTimeout(function () {
      newPasswordInput?.focus();
    }, 100);
  }

  function closePasswordModal() {
    if (!passwordModal) {
      return;
    }

    passwordModal.classList.remove("open");
    passwordModal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.style.overflow = "";

    passwordForm?.reset();
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    const password =
      newPasswordInput?.value || "";

    const confirmation =
      confirmPasswordInput?.value || "";

    if (password.length < 8) {
      showToast(
        "error",
        "Palavra-passe muito curta",
        "Utilize pelo menos 8 caracteres."
      );

      newPasswordInput?.focus();
      return;
    }

    if (password !== confirmation) {
      showToast(
        "error",
        "As palavras-passe não coincidem",
        "Confirme a mesma palavra-passe nos dois campos."
      );

      confirmPasswordInput?.focus();
      return;
    }

    setButtonLoading(
      savePasswordButton,
      true,
      "A guardar..."
    );

    try {
      const {
        error,
      } = await supabaseClient.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      closePasswordModal();

      showToast(
        "success",
        "Palavra-passe atualizada",
        "A nova palavra-passe já está ativa."
      );
    } catch (error) {
      console.error(
        "Erro ao alterar palavra-passe:",
        error
      );

      showToast(
        "error",
        "Não foi possível alterar",
        error.message ||
          "Ocorreu um erro ao alterar a palavra-passe."
      );
    } finally {
      setButtonLoading(
        savePasswordButton,
        false,
        ""
      );
    }
  }

  /* =======================================================
     Workspace
  ======================================================= */

  async function loadCurrentWorkspace() {
    const storedWorkspaceId =
      safeLocalStorageGet(
        STORAGE_KEYS.workspaceId
      );

    if (storedWorkspaceId) {
      const {
        data: workspace,
        error,
      } = await supabaseClient
        .from("workspaces")
        .select("id, name")
        .eq("id", storedWorkspaceId)
        .maybeSingle();

      if (!error && workspace) {
        currentWorkspaceId = workspace.id;

        if (currentWorkspaceName) {
          currentWorkspaceName.textContent =
            workspace.name;
        }

        return workspace;
      }
    }

    const {
      data: membership,
      error: membershipError,
    } = await supabaseClient
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", currentUser.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.warn(
        "Erro ao localizar workspace:",
        membershipError.message
      );

      return null;
    }

    if (!membership?.workspace_id) {
      return null;
    }

    const {
      data: workspace,
      error: workspaceError,
    } = await supabaseClient
      .from("workspaces")
      .select("id, name")
      .eq("id", membership.workspace_id)
      .maybeSingle();

    if (workspaceError || !workspace) {
      console.warn(
        "Erro ao carregar workspace:",
        workspaceError?.message
      );

      return null;
    }

    currentWorkspaceId = workspace.id;

    safeLocalStorageSet(
      STORAGE_KEYS.workspaceId,
      workspace.id
    );

    if (currentWorkspaceName) {
      currentWorkspaceName.textContent =
        workspace.name;
    }

    return workspace;
  }

  /* =======================================================
     Integrações
  ======================================================= */

  function getPlatformInformation(platform) {
    const platforms = {
      instagram: {
        name: "Instagram",
        icon: "camera",
      },

      facebook: {
        name: "Facebook",
        icon: "users",
      },

      linkedin: {
        name: "LinkedIn",
        icon: "briefcase-business",
      },

      tiktok: {
        name: "TikTok",
        icon: "music",
      },

      youtube: {
        name: "YouTube",
        icon: "play",
      },

      pinterest: {
        name: "Pinterest",
        icon: "bookmark",
      },

      threads: {
        name: "Threads",
        icon: "at-sign",
      },

      x: {
        name: "X",
        icon: "message-circle",
      },
    };

    return (
      platforms[platform] || {
        name: platform
          ? platform.charAt(0).toUpperCase() +
            platform.slice(1)
          : "Plataforma",
        icon: "plug",
      }
    );
  }

  function renderIntegrations(accounts) {
    if (!integrationsList) {
      return;
    }

    const principalPlatforms = [
      "instagram",
      "facebook",
      "linkedin",
      "tiktok",
      "youtube",
    ];

    const accountByPlatform = new Map();

    accounts.forEach(function (account) {
      if (!accountByPlatform.has(account.platform)) {
        accountByPlatform.set(
          account.platform,
          account
        );
      }
    });

    integrationsList.innerHTML =
      principalPlatforms
        .map(function (platform) {
          const account =
            accountByPlatform.get(platform);

          const information =
            getPlatformInformation(platform);

          const isConnected =
            account?.status === "active";

          const accountLabel =
            account?.username ||
            account?.account_name ||
            "Nenhuma conta conectada";

          return `
            <article class="settings-integration-row">
              <span class="settings-integration-icon">
                <i data-lucide="${
                  information.icon
                }"></i>
              </span>

              <div class="settings-integration-content">
                <strong>
                  ${escapeHtml(information.name)}
                </strong>

                <span>
                  ${escapeHtml(accountLabel)}
                </span>
              </div>

              <span
                class="settings-integration-status ${
                  isConnected
                    ? "connected"
                    : "disconnected"
                }"
              >
                ${
                  isConnected
                    ? "Conectado"
                    : "Não conectado"
                }
              </span>
            </article>
          `;
        })
        .join("");

    refreshIcons();
  }

  async function loadIntegrations() {
    if (!currentWorkspaceId) {
      renderIntegrations([]);
      return;
    }

    const {
      data,
      error,
    } = await supabaseClient
      .from("social_accounts")
      .select(`
        id,
        platform,
        account_name,
        username,
        status
      `)
      .eq(
        "workspace_id",
        currentWorkspaceId
      )
      .order("connected_at", {
        ascending: false,
      });

    if (error) {
      console.warn(
        "Erro ao carregar integrações:",
        error.message
      );

      renderIntegrations([]);

      showToast(
        "error",
        "Integrações indisponíveis",
        "Não foi possível consultar as contas conectadas."
      );

      return;
    }

    renderIntegrations(data || []);
  }

  /* =======================================================
     Terminar sessões
  ======================================================= */

  async function handleSignOutAll() {
    const confirmed = window.confirm(
      "Deseja terminar a sessão em todos os dispositivos?"
    );

    if (!confirmed) {
      return;
    }

    setButtonLoading(
      signOutAllButton,
      true,
      "A terminar..."
    );

    try {
      const {
        error,
      } = await supabaseClient.auth.signOut({
        scope: "global",
      });

      if (error) {
        throw error;
      }

      safeLocalStorageRemove(
        STORAGE_KEYS.workspaceId
      );

      safeLocalStorageRemove(
        STORAGE_KEYS.demoMode
      );

      safeLocalStorageRemove(
        STORAGE_KEYS.demoUserId
      );

      window.location.replace(LOGIN_URL);
    } catch (error) {
      console.error(
        "Erro ao terminar sessões:",
        error
      );

      showToast(
        "error",
        "Não foi possível terminar",
        error.message ||
          "Ocorreu um erro ao terminar as sessões."
      );

      setButtonLoading(
        signOutAllButton,
        false,
        ""
      );
    }
  }

  /* =======================================================
     Eventos
  ======================================================= */

  function initializeEvents() {
    profileForm?.addEventListener(
      "submit",
      handleProfileSubmit
    );

    changePasswordButton?.addEventListener(
      "click",
      openPasswordModal
    );

    passwordForm?.addEventListener(
      "submit",
      handlePasswordSubmit
    );

    closePasswordModalButtons.forEach(
      function (button) {
        button.addEventListener(
          "click",
          closePasswordModal
        );
      }
    );

    signOutAllButton?.addEventListener(
      "click",
      handleSignOutAll
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key === "Escape" &&
          passwordModal?.classList.contains(
            "open"
          )
        ) {
          closePasswordModal();
        }
      }
    );
  }

  /* =======================================================
     Inicialização
  ======================================================= */

  async function initializeSettings() {
    initializeNavigation();
    initializeTheme();
    initializeLanguage();
    initializeNotifications();
    initializeEvents();

    refreshIcons();

    try {
      await loadAuthenticatedUser();

      if (!currentUser) {
        return;
      }

      await loadProfile();

      renderUserInformation();

      await loadCurrentWorkspace();
      await loadIntegrations();

      console.log(
        "Configurações carregadas com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao carregar configurações:",
        error
      );

      showToast(
        "error",
        "Erro ao carregar configurações",
        error.message ||
          "Atualize a página e tente novamente."
      );
    }
  }

  await initializeSettings();
});
"use strict";

document.addEventListener(
  "DOMContentLoaded",
  async function () {
    const supabaseClient =
      window.supabaseClient;

  /* =======================================================
     Configurações gerais
  ======================================================= */

  const LOGIN_URL =
  "/html/auth/login.html";

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

  const PLANNED_PAID_PLANS = [
    {
      code: "pro",
      name: "Pro",
      description:
        "Para criadores e profissionais que produzem conteúdo com frequência.",
      currency: "EUR",
      monthly_price_cents: 1900,
      yearly_price_cents: 18000,
      limits: {
        brands: 10,
        members: 1,
        social_accounts: 15,
        storage_bytes:
          10 * 1024 * 1024 * 1024,
        ai_text_generations_monthly: 300,
      },
      features: {
        content_planner: true,
        analytics: true,
        team_management: false,
      },
    },

    {
      code: "business",
      name: "Empresa",
      description:
        "Para equipas, agências e operações com maior volume de conteúdo.",
      currency: "EUR",
      monthly_price_cents: 0,
      yearly_price_cents: 0,
      limits: {
        brands: 30,
        members: 15,
        social_accounts: 50,
        storage_bytes:
          50 * 1024 * 1024 * 1024,
        ai_text_generations_monthly: 1000,
      },
      features: {
        content_planner: true,
        analytics: true,
        team_management: true,
      },
    },
  ];



  let currentUser = null;
  let currentProfile = null;
  let currentWorkspaceId = null;
  let currentWorkspace = null;

let currentBillingSummary = null;
let availableBillingPlans = [];

let availableCreditPacks = [];
let currentCreditBalance = 0;

let selectedBillingAction = null;
let billingReturnStatus = null;
let portalReturnStatus = null;
let instagramReturnStatus = null;
let instagramReturnReason = null;
let facebookReturnStatus = null;
let facebookReturnReason = null;
let facebookReturnPages = null;


  let workspaceMembers = [];
  let workspaceMemberProfiles =
    new Map();

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

  const connectSocialAccountButton =
    document.getElementById(
      "connect-social-account-button"
    );

  const socialIntegrationModal =
    document.getElementById(
      "social-integration-modal"
    );

  const closeSocialIntegrationModalButton =
    document.getElementById(
      "close-social-integration-modal"
    );

  const socialPlatformButtons =
    document.querySelectorAll(
      "[data-social-platform]"
    );

  const closeSocialModalButtons =
    document.querySelectorAll(
      "[data-close-social-modal]"
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

  const currentPlanName =
    document.getElementById(
      "settings-current-plan-name"
    );

  const currentPlanDescription =
    document.getElementById(
      "settings-current-plan-description"
    );

  const currentPlanStatus =
    document.getElementById(
      "settings-current-plan-status"
    );

  const billingAlert =
    document.getElementById(
      "settings-billing-alert"
    );

  const billingAlertTitle =
    document.getElementById(
      "settings-billing-alert-title"
    );

  const billingAlertMessage =
    document.getElementById(
      "settings-billing-alert-message"
    );

  const billingAlertButton =
    document.getElementById(
      "settings-billing-alert-button"
    );

  const plansGrid =
    document.getElementById(
      "settings-plans-grid"
    );

  const creditPacksGrid =
    document.getElementById(
      "settings-credit-packs-grid"
    );

  const creditBalanceElement =
    document.getElementById(
      "settings-credit-balance"
    );

    const invoicesList =
  document.getElementById(
    "settings-invoices-list"
  );

  const billingActionModal =
    document.getElementById(
      "billing-action-modal"
    );

  const billingModalTitle =
    document.getElementById(
      "billing-modal-title"
    );

  const billingModalDescription =
    document.getElementById(
      "billing-modal-description"
    );

  const billingModalItemLabel =
    document.getElementById(
      "billing-modal-item-label"
    );

  const billingModalItemName =
    document.getElementById(
      "billing-modal-item-name"
    );

  const billingModalItemPrice =
    document.getElementById(
      "billing-modal-item-price"
    );

  const billingModalExtraRow =
    document.getElementById(
      "billing-modal-extra-row"
    );

  const billingModalExtraLabel =
    document.getElementById(
      "billing-modal-extra-label"
    );

  const billingModalExtraValue =
    document.getElementById(
      "billing-modal-extra-value"
    );

  const billingConfirmButton =
    document.getElementById(
      "billing-confirm-button"
    );

  const billingConfirmButtonText =
    document.getElementById(
      "billing-confirm-button-text"
    );

  const closeBillingModalButtons =
    Array.from(
      document.querySelectorAll(
        "[data-close-billing-modal]"
      )
    );

  const membersList =
    document.getElementById(
      "settings-members-list"
    );

  const inviteMemberForm =
    document.getElementById(
      "settings-invite-member-form"
    );

  const inviteMemberEmail =
    document.getElementById(
      "settings-member-email"
    );

  const inviteMemberRole =
    document.getElementById(
      "settings-member-role"
    );

  const inviteMemberButton =
    document.getElementById(
      "settings-invite-member-button"
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

  function formatStorage(bytes) {
    const value =
      Number(bytes) || 0;

    if (value <= 0) {
      return "0 MB";
    }

    if (
      value >=
      1024 * 1024 * 1024
    ) {
      return (
        value /
        (1024 * 1024 * 1024)
      ).toFixed(
        value %
          (1024 * 1024 * 1024) ===
          0
          ? 0
          : 1
      ) + " GB";
    }

    return Math.round(
      value /
      (1024 * 1024)
    ) + " MB";
  }


  function getRoleLabel(role) {
    const labels = {
      owner: "Proprietário",
      admin: "Administrador",
      editor: "Editor",
      viewer: "Visualizador",
    };

    return labels[role] ||
      role ||
      "Membro";
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
    const queryParameters =
      new URLSearchParams(
        window.location.search
      );

    billingReturnStatus =
      queryParameters.get("payment");

    portalReturnStatus =
      queryParameters.get("portal");

    instagramReturnStatus =
      queryParameters.get("instagram");

    instagramReturnReason =
      queryParameters.get("reason");

    facebookReturnStatus =
      queryParameters.get("facebook");

    facebookReturnReason =
      queryParameters.get("reason");

    facebookReturnPages =
      queryParameters.get("pages");

    const sectionFromQuery =
      queryParameters.get("section");

    const sectionFromHash =
      window.location.hash
        .replace("#", "")
        .trim();

    const requestedSection =
      sectionFromQuery ||
      sectionFromHash ||
      "appearance";

    const sectionExists =
      sections.some(function (section) {
        return (
          section.dataset.sectionName ===
          requestedSection
        );
      });

    const initialSection =
      sectionExists
        ? requestedSection
        : "appearance";

    openSettingsSection(initialSection);

    navigationButtons.forEach(
      function (button) {
        button.addEventListener(
          "click",
          function () {
            const sectionName =
              button.dataset.settingsSection;

            if (!sectionName) {
              return;
            }

            openSettingsSection(sectionName);
          }
        );
      }
    );
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
        .select(`
          id,
          owner_id,
          name,
          plan,
          status,
          created_at
        `)
        .eq(
          "id",
          storedWorkspaceId
        )
        .maybeSingle();


      if (!error && workspace) {
        currentWorkspaceId =
          workspace.id;

        currentWorkspace =
          workspace;


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
      .eq(
        "user_id",
        currentUser.id
      )
      .eq(
        "status",
        "active"
      )
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
      .select(`
        id,
        owner_id,
        name,
        plan,
        status,
        created_at
      `)
      .eq(
        "id",
        membership.workspace_id
      )
      .maybeSingle();


    if (
      workspaceError ||
      !workspace
    ) {
      console.warn(
        "Erro ao carregar workspace:",
        workspaceError?.message
      );

      return null;
    }


    currentWorkspaceId =
      workspace.id;

    currentWorkspace =
      workspace;


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
    Plano e faturação
  ======================================================= */

  function getPlanHighlights(plan) {
    const limits =
      plan?.limits || {};

    const features =
      plan?.features || {};

    const highlights = [
      `${
        limits.ai_text_generations_monthly ??
        "—"
      } gerações de posts com IA/mês`,

      "Criação, calendário e publicações",

      `${
        limits.social_accounts ?? "—"
      } contas sociais`,

      `${formatStorage(
        limits.storage_bytes
      )} de armazenamento`,
    ];

    if (
      features.content_planner === true &&
      features.analytics === true
    ) {
      highlights.push(
        "Planner e Analytics completos"
      );
    }

    if (
      features.team_management === true
    ) {
      highlights.push(
        `${
          limits.members ?? "—"
        } membros com permissões`
      );
    }

    return highlights;
  }


  function renderBillingPlans() {
    if (!plansGrid) {
      return;
    }

    const currentPlanCode =
      currentBillingSummary?.plan_code ||
      currentWorkspace?.plan ||
      "free";

    const databaseCodes =
      new Set(
        availableBillingPlans.map(
          function (plan) {
            return plan.code;
          }
        )
      );

    const plannedPlans =
      PLANNED_PAID_PLANS.filter(
        function (plan) {
          return !databaseCodes.has(
            plan.code
          );
        }
      );

    const plans = [
      ...availableBillingPlans.map(
        function (plan) {
          return {
            ...plan,
            available: true,
          };
        }
      ),

      ...plannedPlans.map(
        function (plan) {
          return {
            ...plan,
            available: false,
          };
        }
      ),
    ];

    plansGrid.innerHTML =
      plans
        .map(function (plan) {
          const isCurrent =
            plan.code === currentPlanCode;

          const monthlyPriceCents =
            Number(
              plan.monthly_price_cents
            ) || 0;

          const yearlyPriceCents =
            Number(
              plan.yearly_price_cents
            ) || 0;

          const monthlyPrice =
            monthlyPriceCents > 0
              ? formatCurrencyFromCents(
                  monthlyPriceCents,
                  plan.currency || "EUR"
                )
              : plan.code === "free"
                ? "€0"
                : "Preço a definir";

          const yearlyPrice =
            yearlyPriceCents > 0
              ? formatCurrencyFromCents(
                  yearlyPriceCents,
                  plan.currency || "EUR"
                )
              : null;

          const highlights =
            getPlanHighlights(plan)
              .map(function (item) {
                return `
                  <li>
                    <i data-lucide="check"></i>

                    <span>
                      ${escapeHtml(item)}
                    </span>
                  </li>
                `;
              })
              .join("");

          let actionsHtml;

          if (isCurrent) {
            if (plan.code !== "free") {
              actionsHtml = `
                <button
                  class="btn btn-outline"
                  type="button"
                  data-open-billing-portal
                >
                  <i data-lucide="credit-card"></i>

                  Gerir subscrição
                </button>
              `;
            } else {
              actionsHtml = `
                <button
                  class="btn btn-outline"
                  type="button"
                  disabled
                >
                  Plano atual
                </button>
              `;
            }
          } else if (
            plan.available &&
            plan.code === "pro"
          ) {
            actionsHtml = `
              <div
                class="settings-form-actions"
                style="margin-top: auto;"
              >
                <button
                  class="btn btn-primary"
                  type="button"
                  data-subscribe-plan="${escapeHtml(
                    plan.code
                  )}"
                  data-billing-interval="monthly"
                >
                  <i data-lucide="calendar-range"></i>

                  Mensal — ${escapeHtml(
                    monthlyPrice
                  )}
                </button>

                <button
                  class="btn btn-outline"
                  type="button"
                  data-subscribe-plan="${escapeHtml(
                    plan.code
                  )}"
                  data-billing-interval="yearly"
                >
                  <i data-lucide="calendar-check"></i>

                  Anual — ${escapeHtml(
                    yearlyPrice ||
                    "Indisponível"
                  )}
                </button>
              </div>
            `;


          } else {
            actionsHtml = `
              <button
                class="btn btn-outline"
                type="button"
                disabled
              >
                ${
                  plan.code === "free"
                    ? "Plano gratuito"
                    : "Em breve"
                }
              </button>
            `;
          }

          return `
            <article
              class="
                settings-plan-card
                ${
                  isCurrent
                    ? "is-current"
                    : ""
                }
              "
            >
              <div class="settings-plan-card-header">

                <div>
                  <span>
                    ${
                      isCurrent
                        ? "Plano atual"
                        : plan.available
                          ? "Disponível"
                          : "Em preparação"
                    }
                  </span>

                  <h4>
                    ${escapeHtml(plan.name)}
                  </h4>
                </div>

                ${
                  isCurrent
                    ? `
                      <i
                        data-lucide="badge-check"
                        class="settings-plan-current-icon"
                      ></i>
                    `
                    : ""
                }

              </div>

              <p class="settings-plan-price">
                ${escapeHtml(monthlyPrice)}

                ${
                  monthlyPriceCents > 0
                    ? "<small>/mês</small>"
                    : ""
                }
              </p>

              ${
                yearlyPrice
                  ? `
                    <p class="settings-plan-description">
                      Ou ${escapeHtml(
                        yearlyPrice
                      )} por ano.
                    </p>
                  `
                  : ""
              }

              <p class="settings-plan-description">
                ${escapeHtml(
                  plan.description ||
                  "Plano StudioV."
                )}
              </p>

              <ul class="settings-plan-features">
                ${highlights}
              </ul>

              ${actionsHtml}

            </article>
          `;
        })
        .join("");

    refreshIcons();
  }


  async function loadBillingInformation() {
    if (!currentWorkspaceId) {
      return;
    }


    const [
      billingResponse,
      plansResponse,
    ] = await Promise.all([
      supabaseClient.rpc(
        "get_workspace_billing_summary",
        {
          workspace_id_value:
            currentWorkspaceId,
        }
      ),

      supabaseClient
        .from("billing_plans")
        .select(`
          id,
          code,
          name,
          description,
          currency,
          monthly_price_cents,
          yearly_price_cents,
          limits,
          features,
          is_public,
          is_active,
          sort_order
        `)
        .eq("is_active", true)
        .eq("is_public", true)
        .order(
          "sort_order",
          {
            ascending: true,
          }
        ),
    ]);


    if (billingResponse.error) {
      console.warn(
        "Não foi possível carregar a subscrição:",
        billingResponse.error.message
      );
    }


    if (plansResponse.error) {
      console.warn(
        "Não foi possível carregar os planos:",
        plansResponse.error.message
      );
    }


    currentBillingSummary =
      Array.isArray(
        billingResponse.data
      )
        ? billingResponse.data[0] ||
          null
        : billingResponse.data ||
          null;


    availableBillingPlans =
      plansResponse.data || [];


    const planName =
      currentBillingSummary
        ?.plan_name ||
      currentWorkspace?.plan ||
      "Básico";


    if (currentPlanName) {
      currentPlanName.textContent =
        planName;
    }


    const cancelAtPeriodEnd =
      currentBillingSummary
        ?.cancel_at_period_end === true;

    const currentPeriodEnd =
      currentBillingSummary
        ?.current_period_end || null;


    const formattedPeriodEnd =
      currentPeriodEnd
        ? new Intl.DateTimeFormat(
            "pt-PT",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }
          ).format(
            new Date(currentPeriodEnd)
          )
        : null;


    if (currentPlanDescription) {

      if (
        cancelAtPeriodEnd &&
        formattedPeriodEnd
      ) {

        currentPlanDescription.textContent =
          `O plano ${planName} permanece ativo até ${formattedPeriodEnd}.`;

      } else {

        currentPlanDescription.textContent =
          currentBillingSummary
            ?.plan_description ||
          "O workspace utiliza atualmente o plano ativo apresentado abaixo.";

      }
    }


    if (currentPlanStatus) {

      currentPlanStatus.textContent =
        cancelAtPeriodEnd
          ? "Cancelamento agendado"
          : "Ativo";

    }

    const subscriptionStatus =
      currentBillingSummary
        ?.subscription_status ||
      "active";

    const hasPaymentProblem =
      subscriptionStatus === "past_due" ||
      subscriptionStatus === "unpaid" ||
      subscriptionStatus === "incomplete";


    if (billingAlert) {
      billingAlert.hidden =
        !hasPaymentProblem;
    }


    if (
      hasPaymentProblem &&
      billingAlertTitle
    ) {
      billingAlertTitle.textContent =
        subscriptionStatus === "unpaid"
          ? "Pagamento não concluído"
          : "Pagamento pendente";
    }


    if (
      hasPaymentProblem &&
      billingAlertMessage
    ) {
      billingAlertMessage.textContent =
        "Não foi possível processar o pagamento da subscrição. Atualize o método de pagamento para evitar a perda de acesso.";
    }


    if (
      currentPlanStatus &&
      hasPaymentProblem
    ) {
      currentPlanStatus.textContent =
        subscriptionStatus === "unpaid"
          ? "Pagamento não concluído"
          : "Pagamento pendente";
    }


    renderBillingPlans();
  }

  /* =======================================================
    Créditos extras
  ======================================================= */

  function formatCurrencyFromCents(
    value,
    currency = "EUR"
  ) {
    const cents = Number(value) || 0;

    return new Intl.NumberFormat(
      "pt-PT",
      {
        style: "currency",
        currency,
      }
    ).format(cents / 100);
  }


  function renderCreditPacks() {
    if (!creditPacksGrid) {
      return;
    }

    if (availableCreditPacks.length === 0) {
      creditPacksGrid.innerHTML = `
        <div class="settings-empty-state">

          <i data-lucide="coins"></i>

          <strong>
            Nenhum pacote disponível
          </strong>

          <p>
            Os pacotes de créditos não estão disponíveis
            neste momento.
          </p>

        </div>
      `;

      refreshIcons();
      return;
    }


    creditPacksGrid.innerHTML =
      availableCreditPacks
        .map(function (pack) {
          const credits =
            Number(pack.credits) || 0;

          const price =
            formatCurrencyFromCents(
              pack.price_cents,
              pack.currency || "EUR"
            );

          return `
            <article
              class="settings-credit-pack"
              data-credit-pack-code="${escapeHtml(
                pack.code
              )}"
            >

              <div class="settings-credit-pack-header">

                <span class="settings-credit-pack-icon">
                  <i data-lucide="sparkles"></i>
                </span>

                <span class="settings-credit-pack-label">
                  Compra única
                </span>

              </div>


              <h4>
                ${escapeHtml(pack.name)}
              </h4>


              <p class="settings-credit-pack-description">
                Adiciona ${credits} gerações de IA
                ao saldo deste workspace.
              </p>


              <strong class="settings-credit-pack-price">
                ${escapeHtml(price)}
              </strong>


              <button
                class="btn btn-primary"
                type="button"
                data-buy-credit-pack="${escapeHtml(
                  pack.code
                )}"
              >
                <i data-lucide="shopping-cart"></i>

                Comprar créditos
              </button>

            </article>
          `;
        })
        .join("");


    refreshIcons();
  }


  async function loadCreditInformation() {
    if (!currentWorkspaceId) {
      return;
    }


    const [
      packsResponse,
      balanceResponse,
    ] = await Promise.all([

      supabaseClient
        .from("ai_credit_packs")
        .select(`
          id,
          code,
          name,
          credits,
          price_cents,
          currency,
          stripe_price_id,
          is_public,
          is_active,
          sort_order
        `)
        .eq("is_active", true)
        .eq("is_public", true)
        .order(
          "sort_order",
          {
            ascending: true,
          }
        ),


      supabaseClient.rpc(
        "get_workspace_ai_credit_status",
        {
          workspace_id_value:
            currentWorkspaceId,
        }
      ),

    ]);


    if (packsResponse.error) {
      console.warn(
        "Não foi possível carregar os pacotes:",
        packsResponse.error.message
      );
    }


    if (balanceResponse.error) {
      console.warn(
        "Não foi possível carregar o saldo:",
        balanceResponse.error.message
      );
    }


    availableCreditPacks =
      packsResponse.data || [];


    const creditStatus =
      Array.isArray(balanceResponse.data)
        ? balanceResponse.data[0] || null
        : balanceResponse.data || null;


    currentCreditBalance =
      Number(
        creditStatus?.extra_credit_balance
      ) || 0;


    if (creditBalanceElement) {
      creditBalanceElement.textContent =
        `${currentCreditBalance} ${
          currentCreditBalance === 1
            ? "crédito"
            : "créditos"
        }`;
    }


    renderCreditPacks();
  }

  function getInvoiceStatusLabel(status) {
    const labels = {
      paid: "Pago",
      open: "Pendente",
      draft: "Rascunho",
      void: "Anulado",
      uncollectible: "Não cobrável",
    };

    return labels[status] ||
      status ||
      "Desconhecido";
  }


  function formatInvoiceDate(value) {
    if (!value) {
      return "Data indisponível";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Data indisponível";
    }

    return new Intl.DateTimeFormat(
      "pt-PT",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    ).format(date);
  }


  function renderBillingInvoices(invoices) {
    if (!invoicesList) {
      return;
    }

    if (!invoices.length) {
      invoicesList.innerHTML = `
        <div class="settings-empty-state">

          <i data-lucide="receipt-text"></i>

          <strong>
            Nenhuma fatura encontrada
          </strong>

          <p>
            As faturas dos pagamentos aparecerão aqui
            assim que forem emitidas.
          </p>

        </div>
      `;

      refreshIcons();
      return;
    }


    invoicesList.innerHTML =
      invoices
        .map(function (invoice) {
          const amount =
            formatCurrencyFromCents(
              invoice.total_cents,
              invoice.currency || "EUR"
            );

          const status =
            getInvoiceStatusLabel(
              invoice.status
            );

          const date =
            formatInvoiceDate(
              invoice.paid_at ||
              invoice.issued_at ||
              invoice.created_at
            );

          const invoiceNumber =
            invoice.invoice_number ||
            "Fatura Stripe";

          const hostedInvoiceButton =
            invoice.hosted_invoice_url
              ? `
                <a
                  class="btn btn-outline"
                  href="${escapeHtml(
                    invoice.hosted_invoice_url
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i data-lucide="external-link"></i>

                  Ver fatura
                </a>
              `
              : "";

          const pdfButton =
            invoice.invoice_pdf_url
              ? `
                <a
                  class="btn btn-outline"
                  href="${escapeHtml(
                    invoice.invoice_pdf_url
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i data-lucide="file-down"></i>

                  PDF
                </a>
              `
              : "";

          return `
            <article class="settings-invoice-row">

              <div class="settings-invoice-icon">
                <i data-lucide="receipt-text"></i>
              </div>


              <div class="settings-invoice-information">

                <strong>
                  ${escapeHtml(invoiceNumber)}
                </strong>

                <span>
                  ${escapeHtml(date)}
                </span>

              </div>


              <div class="settings-invoice-amount">

                <strong>
                  ${escapeHtml(amount)}
                </strong>

                <span
                  class="
                    settings-invoice-status
                    settings-invoice-status--${escapeHtml(
                      invoice.status || "unknown"
                    )}
                  "
                >
                  ${escapeHtml(status)}
                </span>

              </div>


              <div class="settings-invoice-actions">
                ${hostedInvoiceButton}
                ${pdfButton}
              </div>

            </article>
          `;
        })
        .join("");


    refreshIcons();
  }


  async function loadBillingInvoices() {
    if (
      !currentWorkspaceId ||
      !invoicesList
    ) {
      return;
    }

    const {
      data,
      error,
    } =
      await supabaseClient
        .from("billing_invoices")
        .select(`
          id,
          invoice_number,
          currency,
          status,
          total_cents,
          amount_paid_cents,
          amount_due_cents,
          issued_at,
          paid_at,
          hosted_invoice_url,
          invoice_pdf_url,
          created_at
        `)
        .eq(
          "workspace_id",
          currentWorkspaceId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(20);


    if (error) {
      console.error(
        "Erro ao carregar faturas:",
        error
      );

      invoicesList.innerHTML = `
        <div class="settings-empty-state">

          <i data-lucide="circle-alert"></i>

          <strong>
            Não foi possível carregar as faturas
          </strong>

          <p>
            Atualize a página e tente novamente.
          </p>

        </div>
      `;

      refreshIcons();
      return;
    }


    renderBillingInvoices(
      data || []
    );
  }

  /* =======================================================
    Modal de faturação
  ======================================================= */

  function openCreditPackModal(
    creditPackCode
  ) {
    const pack =
      availableCreditPacks.find(
        function (item) {
          return (
            item.code ===
            creditPackCode
          );
        }
      );


    if (!pack) {
      showToast(
        "error",
        "Pacote não encontrado",
        "Atualize a página e tente novamente."
      );

      return;
    }


    selectedBillingAction = {
      type: "credit_pack",
      code: pack.code,
    };


    const credits =
      Number(pack.credits) || 0;

    const price =
      formatCurrencyFromCents(
        pack.price_cents,
        pack.currency || "EUR"
      );


    if (billingModalTitle) {
      billingModalTitle.textContent =
        "Comprar créditos";
    }


    if (billingModalDescription) {
      billingModalDescription.textContent =
        "Revise o pacote escolhido antes de continuar para o pagamento.";
    }


    if (billingModalItemLabel) {
      billingModalItemLabel.textContent =
        "Pacote";
    }


    if (billingModalItemName) {
      billingModalItemName.textContent =
        pack.name;
    }


    if (billingModalItemPrice) {
      billingModalItemPrice.textContent =
        price;
    }


    if (billingModalExtraLabel) {
      billingModalExtraLabel.textContent =
        "Créditos adicionados";
    }


    if (billingModalExtraValue) {
      billingModalExtraValue.textContent =
        `${credits} ${
          credits === 1
            ? "geração"
            : "gerações"
        }`;
    }


    if (billingModalExtraRow) {
      billingModalExtraRow.hidden = false;
    }


    if (billingConfirmButtonText) {
      billingConfirmButtonText.textContent =
        "Continuar para pagamento";
    }


    billingActionModal?.classList.add(
      "open"
    );

    billingActionModal?.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";


    window.setTimeout(
      function () {
        billingConfirmButton?.focus();
      },
      100
    );


    refreshIcons();
  }

  function openSubscriptionModal(
    planCode,
    billingInterval
  ) {
    const plan =
      availableBillingPlans.find(
        function (item) {
          return item.code === planCode;
        }
      );

    if (!plan) {
      showToast(
        "error",
        "Plano não encontrado",
        "Atualize a página e tente novamente."
      );

      return;
    }

    if (
      billingInterval !== "monthly" &&
      billingInterval !== "yearly"
    ) {
      showToast(
        "error",
        "Periodicidade inválida",
        "Escolha o pagamento mensal ou anual."
      );

      return;
    }

    const priceCents =
      billingInterval === "monthly"
        ? Number(
            plan.monthly_price_cents
          ) || 0
        : Number(
            plan.yearly_price_cents
          ) || 0;

    if (priceCents <= 0) {
      showToast(
        "error",
        "Preço indisponível",
        "Este plano ainda não possui um preço configurado."
      );

      return;
    }

    selectedBillingAction = {
      type: "subscription",
      code: plan.code,
      billingInterval,
    };

    const intervalLabel =
      billingInterval === "monthly"
        ? "Mensal"
        : "Anual";

    const intervalDescription =
      billingInterval === "monthly"
        ? "Cobrança mensal"
        : "Cobrança anual";

    const price =
      formatCurrencyFromCents(
        priceCents,
        plan.currency || "EUR"
      );

    if (billingModalTitle) {
      billingModalTitle.textContent =
        `Assinar plano ${plan.name}`;
    }

    if (billingModalDescription) {
      billingModalDescription.textContent =
        "Revise a subscrição escolhida antes de continuar para o pagamento.";
    }

    if (billingModalItemLabel) {
      billingModalItemLabel.textContent =
        "Plano";
    }

    if (billingModalItemName) {
      billingModalItemName.textContent =
        `${plan.name} — ${intervalLabel}`;
    }

    if (billingModalItemPrice) {
      billingModalItemPrice.textContent =
        `${price}${
          billingInterval === "monthly"
            ? "/mês"
            : "/ano"
        }`;
    }

    if (billingModalExtraLabel) {
      billingModalExtraLabel.textContent =
        "Periodicidade";
    }

    if (billingModalExtraValue) {
      billingModalExtraValue.textContent =
        intervalDescription;
    }

    if (billingModalExtraRow) {
      billingModalExtraRow.hidden = false;
    }

    if (billingConfirmButtonText) {
      billingConfirmButtonText.textContent =
        "Continuar para pagamento";
    }

    billingActionModal?.classList.add(
      "open"
    );

    billingActionModal?.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";

    window.setTimeout(
      function () {
        billingConfirmButton?.focus();
      },
      100
    );

    refreshIcons();
  }


  function closeBillingModal() {
    if (!billingActionModal) {
      return;
    }


    billingActionModal.classList.remove(
      "open"
    );

    billingActionModal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.style.overflow = "";

    selectedBillingAction = null;


    if (billingModalExtraRow) {
      billingModalExtraRow.hidden = true;
    }
  }


  async function handleBillingConfirmation() {
    if (
      !selectedBillingAction ||
      !currentWorkspaceId
    ) {
      return;
    }

    let requestBody;

    if (
      selectedBillingAction.type ===
      "credit_pack"
    ) {
      const selectedPack =
        availableCreditPacks.find(
          function (pack) {
            return (
              pack.code ===
              selectedBillingAction.code
            );
          }
        );

      if (!selectedPack) {
        showToast(
          "error",
          "Pacote não encontrado",
          "Atualize a página e tente novamente."
        );

        return;
      }

      requestBody = {
        action_type: "credit_pack",
        workspace_id:
          currentWorkspaceId,
        code: selectedPack.code,
      };
    } else if (
      selectedBillingAction.type ===
      "subscription"
    ) {
      const selectedPlan =
        availableBillingPlans.find(
          function (plan) {
            return (
              plan.code ===
              selectedBillingAction.code
            );
          }
        );

      if (!selectedPlan) {
        showToast(
          "error",
          "Plano não encontrado",
          "Atualize a página e tente novamente."
        );

        return;
      }

      if (
        selectedBillingAction
          .billingInterval !==
          "monthly" &&
        selectedBillingAction
          .billingInterval !==
          "yearly"
      ) {
        showToast(
          "error",
          "Periodicidade inválida",
          "Escolha o pagamento mensal ou anual."
        );

        return;
      }

      requestBody = {
        action_type: "subscription",
        workspace_id:
          currentWorkspaceId,
        code: selectedPlan.code,
        billing_interval:
          selectedBillingAction
            .billingInterval,
      };
    } else {
      showToast(
        "error",
        "Operação inválida",
        "Não foi possível identificar a compra."
      );

      return;
    }

    if (billingConfirmButton) {
      billingConfirmButton.disabled = true;

      billingConfirmButton.classList.add(
        "is-loading"
      );
    }

    if (billingConfirmButtonText) {
      billingConfirmButtonText.textContent =
        "A abrir pagamento...";
    }

    try {
      const {
        data,
        error,
      } =
        await supabaseClient.functions.invoke(
          "create-checkout-session",
          {
            body: requestBody,
          }
        );

      if (error) {
        let errorMessage =
          error.message ||
          "Não foi possível abrir o pagamento.";

        if (
          error.context instanceof Response
        ) {
          try {
            const errorPayload =
              await error.context.json();

            errorMessage =
              errorPayload?.error ||
              errorMessage;
          } catch {
            // Mantém a mensagem original.
          }
        }

        throw new Error(errorMessage);
      }

      if (!data?.url) {
        throw new Error(
          "A Stripe não devolveu a página de pagamento."
        );
      }

      window.location.assign(data.url);

    } catch (error) {
      console.error(
        "Erro ao criar checkout:",
        error
      );

      showToast(
        "error",
        "Pagamento indisponível",
        error.message ||
          "Tente novamente dentro de alguns instantes."
      );

      if (billingConfirmButton) {
        billingConfirmButton.disabled = false;

        billingConfirmButton.classList.remove(
          "is-loading"
        );
      }

      if (billingConfirmButtonText) {
        billingConfirmButtonText.textContent =
          "Continuar para pagamento";
      }
    }
  }

  async function handleOpenBillingPortal(
      button
    ) {
      if (!currentWorkspaceId) {
        showToast(
          "error",
          "Workspace não encontrado",
          "Atualize a página e tente novamente."
        );

        return;
      }

      setButtonLoading(
        button,
        true,
        "A abrir portal..."
      );

      try {
        const {
          data,
          error,
        } =
          await supabaseClient.functions.invoke(
            "create-billing-portal-session",
            {
              body: {
                workspace_id:
                  currentWorkspaceId,
              },
            }
          );

        if (error) {
          let errorMessage =
            error.message ||
            "Não foi possível abrir o portal.";

          if (
            error.context instanceof Response
          ) {
            try {
              const errorPayload =
                await error.context.json();

              errorMessage =
                errorPayload?.error ||
                errorMessage;
            } catch {
              // Mantém a mensagem original.
            }
          }

          throw new Error(errorMessage);
        }

        if (!data?.url) {
          throw new Error(
            "A Stripe não devolveu a página do portal."
          );
        }

        window.location.assign(data.url);

      } catch (error) {
        console.error(
          "Erro ao abrir portal Stripe:",
          error
        );

        showToast(
          "error",
          "Portal indisponível",
          error.message ||
            "Tente novamente dentro de alguns instantes."
        );

        setButtonLoading(
          button,
          false,
          ""
        );
      }
    }

  /* =======================================================
    Membros
  ======================================================= */

  function renderWorkspaceMembers() {
    if (!membersList) {
      return;
    }


    if (
      workspaceMembers.length === 0
    ) {
      membersList.innerHTML = `
        <div class="settings-empty-state">

          <i data-lucide="users"></i>

          <strong>
            Nenhum membro encontrado
          </strong>

          <p>
            Ainda não existem membros neste workspace.
          </p>

        </div>
      `;

      refreshIcons();
      return;
    }


    membersList.innerHTML =
      workspaceMembers
        .map(function (member) {
          const profile =
            workspaceMemberProfiles.get(
              member.user_id
            );

          const isCurrentUser =
            member.user_id ===
            currentUser.id;

          const name =
            profile?.full_name ||
            (
              isCurrentUser
                ? currentProfile
                    ?.full_name
                : null
            ) ||
            "Membro do workspace";


          const email =
            isCurrentUser
              ? currentUser.email
              : "Email protegido";


          return `
            <article class="settings-member-row">

              <span class="settings-member-avatar">
                ${escapeHtml(
                  getInitial(name)
                )}
              </span>


              <div class="settings-member-information">

                <strong>
                  ${escapeHtml(name)}
                </strong>

                <span>
                  ${escapeHtml(email)}
                </span>

              </div>


              <span class="settings-member-role">
                ${escapeHtml(
                  getRoleLabel(
                    member.role
                  )
                )}
              </span>


              <span class="settings-member-status">
                ${
                  member.status ===
                  "active"
                    ? "Ativo"
                    : escapeHtml(
                        member.status
                      )
                }
              </span>

            </article>
          `;
        })
        .join("");


    refreshIcons();
  }


  async function loadWorkspaceMembers() {
    if (!currentWorkspaceId) {
      return;
    }


    const {
      data: members,
      error,
    } = await supabaseClient
      .from("workspace_members")
      .select(`
        id,
        workspace_id,
        user_id,
        role,
        status,
        invited_at,
        joined_at,
        created_at
      `)
      .eq(
        "workspace_id",
        currentWorkspaceId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );


    if (error) {
      console.warn(
        "Não foi possível carregar os membros:",
        error.message
      );

      workspaceMembers = [];
      renderWorkspaceMembers();

      return;
    }


    workspaceMembers =
      members || [];


    const userIds =
      workspaceMembers
        .map(function (member) {
          return member.user_id;
        })
        .filter(Boolean);


    workspaceMemberProfiles =
      new Map();


    if (userIds.length > 0) {
      const {
        data: profiles,
        error: profilesError,
      } = await supabaseClient
        .from("profiles")
        .select(
          "id, full_name, avatar_url"
        )
        .in(
          "id",
          userIds
        );


      if (profilesError) {
        console.warn(
          "Alguns perfis não puderam ser carregados:",
          profilesError.message
        );
      }


      (
        profiles || []
      ).forEach(
        function (profile) {
          workspaceMemberProfiles.set(
            profile.id,
            profile
          );
        }
      );
    }


    renderWorkspaceMembers();
  }


  function handleInviteMember(
    event
  ) {
    event.preventDefault();


    const email =
      inviteMemberEmail
        ?.value
        .trim()
        .toLowerCase() ||
      "";


    const memberLimit =
      Number(
        currentBillingSummary
          ?.plan_limits
          ?.members
      ) || 0;


    if (!email) {
      showToast(
        "error",
        "Email obrigatório",
        "Informe o email da pessoa que deseja convidar."
      );

      inviteMemberEmail?.focus();
      return;
    }


    if (
      memberLimit > 0 &&
      workspaceMembers.length >=
        memberLimit
    ) {
      showToast(
        "info",
        "Limite do plano atingido",
        `O plano atual permite ${memberLimit} membro. Os planos pagos serão disponibilizados posteriormente.`
      );

      return;
    }


    showToast(
      "info",
      "Convites em preparação",
      "A área de membros está pronta, mas nenhum convite foi enviado. O envio seguro por email será implementado na próxima etapa."
    );


    console.log(
      "Convite preparado:",
      {
        email,
        role:
          inviteMemberRole?.value ||
          "viewer",
        workspaceId:
          currentWorkspaceId,
      }
    );
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

    const accountsByPlatform = new Map();

    accounts.forEach(function (account) {
      if (!accountsByPlatform.has(account.platform)) {
        accountsByPlatform.set(
          account.platform,
          []
        );
      }

      accountsByPlatform
        .get(account.platform)
        .push(account);
    });

    integrationsList.innerHTML =
      principalPlatforms
        .map(function (platform) {
          const platformAccounts =
            accountsByPlatform.get(platform) || [];

          const information =
            getPlatformInformation(platform);

          const isConnected =
            platformAccounts.some(
              function (account) {
                return [
                  "active",
                  "connected",
                ].includes(account.status);
              }
            );

          const accountLabel =
            platformAccounts.length > 0
              ? platformAccounts
                  .map(function (account) {
                    return (
                      account.username ||
                      account.account_name ||
                      "Conta conectada"
                    );
                  })
                  .join(", ")
              : "Nenhuma conta conectada";

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
      external_account_id,
      account_name,
      username,
      status,
      avatar_url,
      profile_url,
      connected_at
    `)
    .eq(
      "workspace_id",
      currentWorkspaceId
    )
    .order(
      "connected_at",
      {
        ascending: false,
      }
    );


  console.log(
    "Workspace atual:",
    currentWorkspaceId
  );

  console.log(
    "Integrações recebidas:",
    data
  );



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

    inviteMemberForm?.addEventListener(
      "submit",
      handleInviteMember
    );


    connectSocialAccountButton
      ?.addEventListener(
        "click",
        function () {
          showToast(
            "info",
            "Integração em preparação",
            "A conexão real com redes sociais será implementada utilizando as APIs oficiais de cada plataforma."
          );
        }
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

  plansGrid?.addEventListener(
    "click",
    function (event) {
      const portalButton =
        event.target.closest(
          "[data-open-billing-portal]"
        );

      if (
        portalButton &&
        plansGrid.contains(portalButton)
      ) {
        handleOpenBillingPortal(
          portalButton
        );

        return;
      }

      const subscriptionButton =
        event.target.closest(
          "[data-subscribe-plan]"
        );

      if (
        !subscriptionButton ||
        !plansGrid.contains(
          subscriptionButton
        )
      ) {
        return;
      }

      openSubscriptionModal(
        subscriptionButton.dataset
          .subscribePlan,

        subscriptionButton.dataset
          .billingInterval
      );
    }
  );


  creditPacksGrid?.addEventListener(
    "click",
    function (event) {
      const button =
        event.target.closest(
          "[data-buy-credit-pack]"
        );


      if (
        !button ||
        !creditPacksGrid.contains(button)
      ) {
        return;
      }


      openCreditPackModal(
        button.dataset.buyCreditPack
      );
    }
  );


  closeBillingModalButtons.forEach(
    function (button) {
      button.addEventListener(
        "click",
        closeBillingModal
      );
    }
  );


  billingConfirmButton?.addEventListener(
    "click",
    handleBillingConfirmation
  );

  function openSocialIntegrationModal() {
    if (!socialIntegrationModal) return;

    socialIntegrationModal.classList.add(
      "is-open"
    );

    socialIntegrationModal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "social-modal-open"
    );

    refreshIcons();
  }

  function closeSocialIntegrationModal() {
    if (!socialIntegrationModal) return;

    socialIntegrationModal.classList.remove(
      "is-open"
    );

    socialIntegrationModal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "social-modal-open"
    );
  }

  async function handleFacebookOAuth(platformButton) {
    if (!currentWorkspaceId) {
      showToast(
        "error",
        "Workspace indisponÃ­vel",
        "Selecione um workspace antes de conectar o Facebook."
      );
      return;
    }

    platformButton.disabled = true;
    platformButton.setAttribute(
      "aria-busy",
      "true"
    );

    try {
      const returnUrl =
        window.location.origin +
        window.location.pathname;
      const brandId =
        platformButton.dataset.brandId?.trim();
      const body = {
        workspaceId: currentWorkspaceId,
        returnUrl,
      };

      if (brandId) {
        body.brandId = brandId;
      }

      const {
        data,
        error,
      } = await supabaseClient.functions.invoke(
        "facebook-oauth-start",
        { body }
      );

      if (error) {
        throw error;
      }

      const authorizationUrl =
        new URL(data?.authorizationUrl || "");
      const isFacebookHost =
        authorizationUrl.hostname === "facebook.com" ||
        authorizationUrl.hostname.endsWith(".facebook.com");

      if (
        authorizationUrl.protocol !== "https:" ||
        !isFacebookHost
      ) {
        throw new Error(
          "A resposta de autorizaÃ§Ã£o Ã© invÃ¡lida."
        );
      }

      window.location.assign(
        authorizationUrl.toString()
      );
    } catch (error) {
      console.error(
        "Erro ao iniciar OAuth do Facebook:",
        error
      );

      platformButton.disabled = false;
      platformButton.removeAttribute(
        "aria-busy"
      );

      showToast(
        "error",
        "NÃ£o foi possÃ­vel conectar",
        "Atualize a pÃ¡gina e tente novamente."
      );
    }
  }

  async function handleSocialPlatformSelection(event) {
    const platformButton =
      event.currentTarget;

    const platform =
      platformButton.dataset.socialPlatform;

    if (platform === "facebook") {
      await handleFacebookOAuth(platformButton);
      return;
    }

    if (platform !== "instagram") {
      showToast(
        "info",
        "Integração em preparação",
        `A conexão com ${platform} ainda não está disponível.`
      );
      return;
    }

    if (!currentWorkspaceId) {
      showToast(
        "error",
        "Workspace indisponível",
        "Selecione um workspace antes de conectar o Instagram."
      );
      return;
    }

    platformButton.disabled = true;
    platformButton.setAttribute(
      "aria-busy",
      "true"
    );

    try {
      const returnUrl =
        window.location.origin +
        window.location.pathname;
      const {
        data,
        error,
      } = await supabaseClient.functions.invoke(
        "instagram-oauth-start",
        {
          body: {
            workspaceId: currentWorkspaceId,
            returnUrl,
          },
        }
      );

      if (error) {
        throw error;
      }

      const authorizationUrl =
        new URL(data?.authorizationUrl || "");

      if (
        authorizationUrl.protocol !== "https:" ||
        authorizationUrl.hostname !==
          "www.instagram.com"
      ) {
        throw new Error(
          "A resposta de autorização é inválida."
        );
      }

      window.location.assign(
        authorizationUrl.toString()
      );
    } catch (error) {
      console.error(
        "Erro ao iniciar OAuth do Instagram:",
        error
      );

      platformButton.disabled = false;
      platformButton.removeAttribute(
        "aria-busy"
      );

      showToast(
        "error",
        "Não foi possível conectar",
        "Atualize a página e tente novamente."
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

    connectSocialAccountButton?.addEventListener(
      "click",
      openSocialIntegrationModal
    );

    closeSocialIntegrationModalButton?.addEventListener(
      "click",
      closeSocialIntegrationModal
    );

    closeSocialModalButtons.forEach(
      function (button) {
        button.addEventListener(
          "click",
          closeSocialIntegrationModal
        );
      }
    );

    socialPlatformButtons.forEach(
      function (button) {
        button.addEventListener(
          "click",
          handleSocialPlatformSelection
        );
      }
    );

    signOutAllButton?.addEventListener(
      "click",
      handleSignOutAll
    );

    billingAlertButton?.addEventListener(
      "click",
      function () {
        handleOpenBillingPortal(
          billingAlertButton
        );
      }
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key !== "Escape") {
          return;
        }

        if (event.key === "Escape") {
          closeSocialIntegrationModal();
        }


        if (
          billingActionModal
            ?.classList.contains("open")
        ) {
          closeBillingModal();
          return;
        }


        if (
          passwordModal
            ?.classList.contains("open")
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

      await Promise.all([
        loadIntegrations(),
        loadBillingInformation(),
        loadCreditInformation(),
        loadBillingInvoices(),
        loadWorkspaceMembers(),
      ]);

      if (portalReturnStatus === "return") {
        await Promise.all([
          loadBillingInformation(),
          loadBillingInvoices(),
        ]);

        showToast(
          "success",
          "Faturação atualizada",
          "As informações da subscrição foram atualizadas."
        );
      }

      if (
        billingReturnStatus ||
        portalReturnStatus ||
        instagramReturnStatus ||
        facebookReturnStatus
      ) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}#${
            instagramReturnStatus ||
            facebookReturnStatus
              ? "integrations"
              : "billing"
          }`
        );
      }

      if (billingReturnStatus === "success") {
        showToast(
          "success",
          "Pagamento concluído",
          "A Stripe confirmou o pagamento. O plano ou os créditos serão atualizados automaticamente."
        );
      } else if (
        billingReturnStatus === "cancelled"
      ) {
        showToast(
          "info",
          "Pagamento cancelado",
          "Nenhuma cobrança foi concluída."
        );
      }

      if (instagramReturnStatus === "connected") {
        showToast(
          "success",
          "Instagram conectado",
          "A conta foi ligada e guardada com segurança."
        );
      } else if (
        instagramReturnStatus === "cancelled"
      ) {
        showToast(
          "info",
          "Ligação cancelada",
          "A conta do Instagram não foi conectada."
        );
      } else if (instagramReturnStatus === "error") {
        const invalidState =
          instagramReturnReason === "invalid_state";

        showToast(
          "error",
          "Não foi possível conectar",
          invalidState
            ? "O pedido expirou ou já foi utilizado. Tente conectar novamente."
            : "O Instagram não concluiu a autorização. Tente novamente."
        );
      }

      if (facebookReturnStatus === "connected") {
        await loadIntegrations();

        const connectedPages =
          Number.parseInt(facebookReturnPages, 10);
        const pagesMessage =
          Number.isInteger(connectedPages) &&
          connectedPages > 0
            ? `${connectedPages} ${
                connectedPages === 1
                  ? "pÃ¡gina foi conectada"
                  : "pÃ¡ginas foram conectadas"
              } e jÃ¡ estÃ£o disponÃ­veis.`
            : "As pÃ¡ginas autorizadas jÃ¡ estÃ£o disponÃ­veis.";

        showToast(
          "success",
          "Facebook conectado",
          pagesMessage
        );
      } else if (
        facebookReturnStatus === "cancelled"
      ) {
        showToast(
          "info",
          "LigaÃ§Ã£o cancelada",
          "Nenhuma pÃ¡gina do Facebook foi conectada."
        );
      } else if (facebookReturnStatus === "error") {
        const invalidState =
          facebookReturnReason === "invalid_state";

        showToast(
          "error",
          "NÃ£o foi possÃ­vel conectar",
          invalidState
            ? "O pedido expirou ou jÃ¡ foi utilizado. Tente conectar novamente."
            : "O Facebook nÃ£o concluiu a autorizaÃ§Ã£o. Tente novamente."
        );
      }

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

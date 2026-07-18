"use strict";

document.addEventListener("DOMContentLoaded", async function () {
  const supabaseClient = window.supabaseClient;

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
      code: "starter",
      name: "Starter",
      description:
        "Para criadores que estão a começar a organizar várias marcas.",
      limits: {
        brands: 3,
        members: 2,
        social_accounts: 5,
        storage_bytes:
          2 * 1024 * 1024 * 1024,
      },
    },

    {
      code: "professional",
      name: "Professional",
      description:
        "Para profissionais e pequenas equipas de conteúdo.",
      limits: {
        brands: 10,
        members: 5,
        social_accounts: 15,
        storage_bytes:
          10 * 1024 * 1024 * 1024,
      },
    },

    {
      code: "business",
      name: "Business",
      description:
        "Para agências e equipas que gerenciam vários clientes.",
      limits: {
        brands: 30,
        members: 15,
        social_accounts: 50,
        storage_bytes:
          50 * 1024 * 1024 * 1024,
      },
    },
  ];



  let currentUser = null;
  let currentProfile = null;
  let currentWorkspaceId = null;
  let currentWorkspace = null;

  let currentBillingSummary = null;
  let availableBillingPlans = [];

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

  const plansGrid =
    document.getElementById(
      "settings-plans-grid"
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

  const connectSocialAccountButton =
    document.getElementById(
      "connect-social-account-button"
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

    return [
      `${
        limits.brands ?? "—"
      } marcas`,

      `${
        limits.members ?? "—"
      } membros`,

      `${
        limits.social_accounts ?? "—"
      } contas sociais`,

      `${formatStorage(
        limits.storage_bytes
      )} de armazenamento`,
    ];
  }


  function renderBillingPlans() {
    if (!plansGrid) {
      return;
    }


    const currentPlanCode =
      currentBillingSummary
        ?.plan_code ||
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
            plan.code ===
            currentPlanCode;

          const price =
            Number(
              plan.monthly_price_cents
            ) > 0
              ? new Intl.NumberFormat(
                  "pt-PT",
                  {
                    style: "currency",
                    currency:
                      plan.currency ||
                      "EUR",
                  }
                ).format(
                  plan.monthly_price_cents /
                    100
                )
              : plan.code === "free"
                ? "Grátis"
                : "Preço a definir";


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
                ${escapeHtml(price)}

                ${
                  Number(
                    plan.monthly_price_cents
                  ) > 0
                    ? "<small>/mês</small>"
                    : ""
                }
              </p>


              <p class="settings-plan-description">
                ${escapeHtml(
                  plan.description ||
                  "Plano StudioV."
                )}
              </p>


              <ul class="settings-plan-features">
                ${highlights}
              </ul>


              <button
                class="
                  btn
                  ${
                    isCurrent
                      ? "btn-outline"
                      : "btn-primary"
                  }
                "
                type="button"
                disabled
              >
                ${
                  isCurrent
                    ? "Plano atual"
                    : plan.available
                      ? "Pagamento indisponível"
                      : "Em breve"
                }
              </button>

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
      "Free";


    if (currentPlanName) {
      currentPlanName.textContent =
        planName;
    }


    if (currentPlanDescription) {
      currentPlanDescription.textContent =
        currentBillingSummary
          ?.plan_description ||
        "O workspace utiliza atualmente o plano ativo apresentado abaixo.";
    }


    if (currentPlanStatus) {
      currentPlanStatus.textContent =
        "Ativo";
    }


    renderBillingPlans();
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

      await Promise.all([
        loadIntegrations(),
        loadBillingInformation(),
        loadWorkspaceMembers(),
      ]);

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
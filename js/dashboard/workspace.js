"use strict";

/* ==========================================================
   StudioV — Workspace
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const supabaseClient = window.supabaseClient;

  if (!supabaseClient) {
    console.error("Supabase Client não encontrado.");
    return;
  }

  /* ========================================================
     Elementos do HTML
  ======================================================== */

  const elements = {
    currentWorkspaceName:
      document.getElementById("current-workspace-name"),

    sidebarUserName:
      document.getElementById("sidebar-user-name"),

    sidebarUserEmail:
      document.getElementById("sidebar-user-email"),

    sidebarUserAvatar:
      document.getElementById("sidebar-user-avatar"),

    topbarAvatar:
      document.getElementById("topbar-avatar"),

    workspaceNameSummary:
      document.getElementById("workspace-name-summary"),

    workspaceMembersCount:
      document.getElementById("workspace-members-count"),

    workspacePlanName:
      document.getElementById("workspace-plan-name"),

    workspaceBrandsCount:
      document.getElementById("workspace-brands-count"),

    workspaceDetailName:
      document.getElementById("workspace-detail-name"),

    workspaceDetailDescription:
      document.getElementById("workspace-detail-description"),

    workspaceDetailLanguage:
      document.getElementById("workspace-detail-language"),

    workspaceDetailTimezone:
      document.getElementById("workspace-detail-timezone"),

    workspaceDetailStatus:
      document.getElementById("workspace-detail-status"),

    workspacePlanBadge:
      document.getElementById("workspace-plan-badge"),

    workspaceMembersUsage:
      document.getElementById("workspace-members-usage"),

    workspaceMembersProgress:
      document.getElementById("workspace-members-progress"),

    workspaceBrandsUsage:
      document.getElementById("workspace-brands-usage"),

    workspaceBrandsProgress:
      document.getElementById("workspace-brands-progress"),

    workspaceSocialUsage:
      document.getElementById("workspace-social-usage"),

    workspaceSocialProgress:
      document.getElementById("workspace-social-progress"),

    workspaceStorageUsage:
      document.getElementById("workspace-storage-usage"),

    workspaceStorageProgress:
      document.getElementById("workspace-storage-progress"),

    workspaceContentsCount:
      document.getElementById("workspace-contents-count"),

    workspaceMembersList:
      document.getElementById("workspace-members-list"),

    workspaceIntegrationsList:
      document.getElementById("workspace-integrations-list"),

    editWorkspaceButton:
      document.getElementById("edit-workspace-button"),

    editWorkspaceSecondaryButton:
      document.getElementById(
        "edit-workspace-secondary-button"
      ),

    workspaceModal:
      document.getElementById("workspace-modal"),

    workspaceModalClose:
      document.getElementById("workspace-modal-close"),

    workspaceForm:
      document.getElementById("workspace-form"),

    workspaceFormCancel:
      document.getElementById("workspace-form-cancel"),

    workspaceFormSubmit:
      document.getElementById("workspace-form-submit"),

    workspaceFormLoader:
      document.getElementById("workspace-form-loader"),

    workspaceFormSubmitText:
      document.getElementById("workspace-form-submit-text"),

    workspaceNameInput:
      document.getElementById("workspace-name-input"),

    workspaceNameError:
      document.getElementById("workspace-name-error"),

    workspaceDescriptionInput:
      document.getElementById("workspace-description-input"),

    workspaceLanguageInput:
      document.getElementById("workspace-language-input"),

    workspaceTimezoneInput:
      document.getElementById("workspace-timezone-input"),

    workspaceFormError:
      document.getElementById("workspace-form-error"),

    sidebarOverlay:
      document.getElementById("sidebar-overlay"),

    sidebarOpenButton:
      document.getElementById("topbar-menu-button"),

    sidebarCloseButton:
      document.getElementById("sidebar-close"),

    toastContainer:
      document.getElementById("toast-container"),
  };

  /* ========================================================
     Estado da página
  ======================================================== */

  let currentUser = null;
  let currentProfile = null;
  let currentMembership = null;
  let currentWorkspace = null;

  let workspaceMembers = [];
  let memberProfiles = new Map();
  let workspaceBrands = [];
  let socialAccounts = [];
  let contentsCount = 0;
  let workspaceStorageBytes = 0;
  let billingSummary = null;

  /* ========================================================
     Utilitários
  ======================================================== */

  function escapeHtml(value = "") {
    const temporaryElement =
      document.createElement("div");

    temporaryElement.textContent =
      String(value ?? "");

    return temporaryElement.innerHTML;
  }

  function setText(element, value) {
    if (!element) {
      return;
    }

    element.textContent =
      value ?? "—";
  }

  function getInitials(name = "") {
    const words = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) {
      return "U";
    }

    if (words.length === 1) {
      return words[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  }

  function getLanguageLabel(language) {
    const labels = {
      "pt-PT": "Português — Portugal",
      "pt-BR": "Português — Brasil",
      "en-GB": "English — United Kingdom",
      "en-US": "English — United States",
      "es-ES": "Español — España",
    };

    return labels[language] || language || "—";
  }

  function getWorkspaceStatusLabel(status) {
    const labels = {
      active: "Ativo",
      suspended: "Suspenso",
      archived: "Arquivado",
    };

    return labels[status] || status || "—";
  }

  function getMemberRoleLabel(role) {
    const labels = {
      owner: "Proprietário",
      admin: "Administrador",
      editor: "Editor",
      viewer: "Visualizador",
    };

    return labels[role] || role || "Membro";
  }

  function getMemberStatusLabel(status) {
    const labels = {
      invited: "Convidado",
      active: "Ativo",
      suspended: "Suspenso",
    };

    return labels[status] || status || "—";
  }

  function getPlatformLabel(platform) {
    const labels = {
      instagram: "Instagram",
      facebook: "Facebook",
      linkedin: "LinkedIn",
      tiktok: "TikTok",
      pinterest: "Pinterest",
      youtube: "YouTube",
    };

    return labels[platform] || platform || "Conta social";
  }

  function getPlatformIcon(platform) {
    const icons = {
      instagram: "camera",
      facebook: "users",
      linkedin: "briefcase",
      tiktok: "music",
      pinterest: "bookmark",
      youtube: "play",
    };

    return icons[platform] || "share-2";
  }

  function getSocialStatusLabel(status) {
    const labels = {
      pending: "Pendente",
      active: "Conectada",
      expired: "Expirada",
      revoked: "Revogada",
      error: "Com erro",
      disconnected: "Desconectada",
    };

    return labels[status] || status || "—";
  }

  function getPlanName() {
    return (
      billingSummary?.plan_name ||
      currentWorkspace?.plan ||
      "Básico"
    );
  }

  function formatBytes(bytes = 0) {
    const numericBytes =
      Number(bytes) || 0;

    if (numericBytes <= 0) {
      return "0 B";
    }

    const units = [
      "B",
      "KB",
      "MB",
      "GB",
      "TB",
    ];

    const unitIndex = Math.min(
      Math.floor(
        Math.log(numericBytes) /
        Math.log(1024)
      ),
      units.length - 1
    );

    const value =
      numericBytes /
      Math.pow(1024, unitIndex);

    const decimals =
      unitIndex === 0 ? 0 : 1;

    const formattedValue =
      Number(
        value.toFixed(decimals)
      ).toString();

    return `${formattedValue} ${units[unitIndex]}`;
  }

  function showToast(
    type,
    title,
    message
  ) {
    if (!elements.toastContainer) {
      return;
    }

    const toast =
      document.createElement("div");

    toast.className =
      `toast is-${type}`;

    toast.innerHTML = `
      <strong>
        ${escapeHtml(title)}
      </strong>

      <p>
        ${escapeHtml(message)}
      </p>
    `;

    elements.toastContainer.appendChild(
      toast
    );

    window.setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  /* ========================================================
     Autenticação
  ======================================================== */

  async function getAuthenticatedUser() {
    if (window.studioVAuthReady) {
      const userFromGuard =
        await window.studioVAuthReady;

      if (userFromGuard) {
        return userFromGuard;
      }
    }

    const {
      data,
      error,
    } =
      await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user || null;
  }

  /* ========================================================
     Contexto do workspace
  ======================================================== */

  async function loadWorkspaceContext() {
    currentUser =
      await getAuthenticatedUser();

    if (!currentUser) {
      throw new Error(
        "Utilizador não autenticado."
      );
    }

    const [
      profileResponse,
      membershipResponse,
    ] =
      await Promise.all([
        supabaseClient
          .from("profiles")
          .select(`
            id,
            full_name,
            avatar_url
          `)
          .eq("id", currentUser.id)
          .maybeSingle(),

        supabaseClient
          .from("workspace_members")
          .select(`
            id,
            workspace_id,
            user_id,
            role,
            status,
            joined_at,
            created_at
          `)
          .eq("user_id", currentUser.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle(),
      ]);

    if (profileResponse.error) {
      console.warn(
        "Erro ao carregar perfil:",
        profileResponse.error.message
      );
    }

    if (membershipResponse.error) {
      throw membershipResponse.error;
    }

    if (
      !membershipResponse.data?.workspace_id
    ) {
      throw new Error(
        "Nenhum workspace ativo foi encontrado."
      );
    }

    currentProfile =
      profileResponse.data;

    currentMembership =
      membershipResponse.data;

    const {
      data: workspace,
      error: workspaceError,
    } =
      await supabaseClient
        .from("workspaces")
        .select(`
          id,
          owner_id,
          name,
          slug,
          description,
          logo_url,
          language,
          timezone,
          plan,
          status,
          created_at,
          updated_at
        `)
        .eq(
          "id",
          currentMembership.workspace_id
        )
        .single();

    if (workspaceError) {
      throw workspaceError;
    }

    currentWorkspace =
      workspace;

    renderUserIdentity();
    configureWorkspacePermissions();
  }

  /* ========================================================
     Carregamento dos dados
  ======================================================== */

  async function loadMembers() {
    const {
      data,
      error,
    } =
      await supabaseClient
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
          currentWorkspace.id
        )
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    const members =
      data || [];

    const userIds =
      members
        .map((member) => member.user_id)
        .filter(Boolean);

    const profilesMap =
      new Map();

    if (userIds.length > 0) {
      const {
        data: profiles,
        error: profilesError,
      } =
        await supabaseClient
          .from("profiles")
          .select(`
            id,
            full_name,
            avatar_url
          `)
          .in("id", userIds);

      if (profilesError) {
        console.warn(
          "Não foi possível carregar todos os perfis:",
          profilesError.message
        );
      }

      (profiles || []).forEach(
        (profile) => {
          profilesMap.set(
            profile.id,
            profile
          );
        }
      );
    }

    return {
      members,
      profilesMap,
    };
  }

  async function loadBrands() {
    const {
      data,
      error,
    } =
      await supabaseClient
        .from("brands")
        .select(`
          id,
          name,
          status
        `)
        .eq(
          "workspace_id",
          currentWorkspace.id
        )
        .order("name", {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    return data || [];
  }

  async function loadContentsCount() {
    const {
      count,
      error,
    } =
      await supabaseClient
        .from("contents")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "workspace_id",
          currentWorkspace.id
        );

    if (error) {
      throw error;
    }

    return count || 0;
  }

  async function loadSocialAccounts() {
    const {
      data,
      error,
    } =
      await supabaseClient
        .from("social_accounts")
        .select(`
          id,
          workspace_id,
          brand_id,
          platform,
          account_name,
          username,
          status,
          connected_at,
          created_at
        `)
        .eq(
          "workspace_id",
          currentWorkspace.id
        )
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      throw error;
    }

    return data || [];
  }

  async function loadWorkspaceStorageUsage() {
    const {
      data,
      error,
    } =
      await supabaseClient
        .from("media_assets")
        .select(`
          file_size,
          status,
          status_before_archive,
          storage_object_id
        `)
        .eq(
          "workspace_id",
          currentWorkspace.id
        )
        .in(
          "status",
          [
            "ready",
            "archived",
          ]
        );

    if (error) {
      throw error;
    }

    return (data || []).reduce(
      (total, asset) => {
        const hasStoredObject =
          Boolean(
            asset.storage_object_id
          );

        const isReady =
          asset.status === "ready";

        const wasReadyBeforeArchive =
          asset.status === "archived" &&
          asset.status_before_archive ===
            "ready";

        const occupiesStorage =
          hasStoredObject ||
          isReady ||
          wasReadyBeforeArchive;

        if (!occupiesStorage) {
          return total;
        }

        return (
          total +
          Number(asset.file_size || 0)
        );
      },
      0
    );
  }

  async function loadBillingSummary() {
    const {
      data,
      error,
    } =
      await supabaseClient.rpc(
        "get_workspace_billing_summary",
        {
          workspace_id_value:
            currentWorkspace.id,
        }
      );

    if (error) {
      console.warn(
        "Não foi possível carregar o resumo do plano:",
        error.message
      );

      return null;
    }

    if (Array.isArray(data)) {
      return data[0] || null;
    }

    return data || null;
  }

  async function loadWorkspaceData() {
    const [
      membersResult,
      brandsResult,
      contentsResult,
      socialResult,
      storageResult,
      billingResult,
    ] =
      await Promise.all([
        loadMembers(),
        loadBrands(),
        loadContentsCount(),
        loadSocialAccounts(),
        loadWorkspaceStorageUsage(),
        loadBillingSummary(),
      ]);

    workspaceMembers =
      membersResult.members;

    memberProfiles =
      membersResult.profilesMap;

    workspaceBrands =
      brandsResult;

    contentsCount =
      contentsResult;

    socialAccounts =
      socialResult;

    workspaceStorageBytes =
      storageResult;

    billingSummary =
      billingResult;
  }

  /* ========================================================
     Identidade
  ======================================================== */

  function renderUserIdentity() {
    const userName =
      currentProfile?.full_name?.trim() ||
      currentUser?.email?.split("@")[0] ||
      "Utilizador";

    const initial =
      userName
        .charAt(0)
        .toUpperCase();

    setText(
      elements.currentWorkspaceName,
      currentWorkspace?.name
    );

    setText(
      elements.sidebarUserName,
      userName
    );

    setText(
      elements.sidebarUserEmail,
      currentUser?.email || ""
    );

    setText(
      elements.sidebarUserAvatar,
      initial
    );

    setText(
      elements.topbarAvatar,
      initial
    );
  }

  /* ========================================================
     Resumo e informações
  ======================================================== */

  function renderWorkspaceInformation() {
    const planName =
      getPlanName();

    setText(
      elements.currentWorkspaceName,
      currentWorkspace.name
    );

    setText(
      elements.workspaceNameSummary,
      currentWorkspace.name
    );

    setText(
      elements.workspaceMembersCount,
      workspaceMembers.length === 1
        ? "1 membro"
        : `${workspaceMembers.length} membros`
    );

    setText(
      elements.workspacePlanName,
      planName
    );

    setText(
      elements.workspaceBrandsCount,
      workspaceBrands.length
    );

    setText(
      elements.workspaceDetailName,
      currentWorkspace.name
    );

    setText(
      elements.workspaceDetailDescription,
      currentWorkspace.description ||
        "Nenhuma descrição adicionada."
    );

    setText(
      elements.workspaceDetailLanguage,
      getLanguageLabel(
        currentWorkspace.language
      )
    );

    setText(
      elements.workspaceDetailTimezone,
      currentWorkspace.timezone
    );

    setText(
      elements.workspaceDetailStatus,
      getWorkspaceStatusLabel(
        currentWorkspace.status
      )
    );

    setText(
      elements.workspacePlanBadge,
      planName
    );

    setText(
      elements.workspaceContentsCount,
      contentsCount
    );

    if (
      elements.workspaceDetailStatus
    ) {
      elements.workspaceDetailStatus.classList.remove(
        "is-suspended",
        "is-archived"
      );

      if (
        currentWorkspace.status ===
        "suspended"
      ) {
        elements.workspaceDetailStatus.classList.add(
          "is-suspended"
        );
      }

      if (
        currentWorkspace.status ===
        "archived"
      ) {
        elements.workspaceDetailStatus.classList.add(
          "is-archived"
        );
      }
    }
  }

  /* ========================================================
     Utilização do plano
  ======================================================== */

  function updateProgressBar(
    progressElement,
    used,
    limit
  ) {
    if (!progressElement) {
      return;
    }

    const numericUsed =
      Number(used) || 0;

    const numericLimit =
      Number(limit) || 0;

    const percentage =
      numericLimit > 0
        ? Math.min(
            (numericUsed / numericLimit) *
              100,
            100
          )
        : 0;

    progressElement.style.width =
      `${Math.max(percentage, 0)}%`;

    progressElement.classList.remove(
      "is-warning",
      "is-danger"
    );

    if (
      numericLimit > 0 &&
      numericUsed >= numericLimit
    ) {
      progressElement.classList.add(
        "is-danger"
      );

      return;
    }

    if (
      numericLimit > 0 &&
      numericUsed / numericLimit >= 0.8
    ) {
      progressElement.classList.add(
        "is-warning"
      );
    }
  }

  function renderWorkspaceUsage() {
    const limits =
      billingSummary?.plan_limits || {};

    const membersLimit =
      Number(limits.members) || 0;

    const brandsLimit =
      Number(limits.brands) || 0;

    const socialLimit =
      Number(limits.social_accounts) || 0;

    const storageLimit =
      Number(limits.storage_bytes) || 0;

    const currentStorage =
      Number(
        workspaceStorageBytes
      ) || 0;

    const activeSocialAccounts =
      socialAccounts.filter(
        (account) =>
          ![
            "revoked",
            "disconnected",
          ].includes(account.status)
      ).length;

    setText(
      elements.workspaceMembersUsage,
      `${workspaceMembers.length} / ${
        membersLimit || "∞"
      }`
    );

    setText(
      elements.workspaceBrandsUsage,
      `${workspaceBrands.length} / ${
        brandsLimit || "∞"
      }`
    );

    setText(
      elements.workspaceSocialUsage,
      `${activeSocialAccounts} / ${
        socialLimit || "∞"
      }`
    );

    setText(
      elements.workspaceStorageUsage,
      `${formatBytes(
        currentStorage
      )} / ${
        storageLimit
          ? formatBytes(storageLimit)
          : "∞"
      }`
    );

    updateProgressBar(
      elements.workspaceMembersProgress,
      workspaceMembers.length,
      membersLimit
    );

    updateProgressBar(
      elements.workspaceBrandsProgress,
      workspaceBrands.length,
      brandsLimit
    );

    updateProgressBar(
      elements.workspaceSocialProgress,
      activeSocialAccounts,
      socialLimit
    );

    updateProgressBar(
      elements.workspaceStorageProgress,
      currentStorage,
      storageLimit
    );
  }

  /* ========================================================
     Membros
  ======================================================== */

  function renderWorkspaceMembers() {
    if (!elements.workspaceMembersList) {
      return;
    }

    if (workspaceMembers.length === 0) {
      elements.workspaceMembersList.innerHTML = `
        <div class="workspace-empty-state">

          <div class="workspace-empty-state-icon">
            <i data-lucide="users"></i>
          </div>

          <strong>
            Nenhum membro encontrado
          </strong>

          <p>
            Ainda não existem membros ativos neste workspace.
          </p>

        </div>
      `;

      window.lucide?.createIcons();
      return;
    }

    elements.workspaceMembersList.innerHTML =
      workspaceMembers
        .map((member) => {
          const profile =
            memberProfiles.get(
              member.user_id
            );

          const isCurrentUser =
            member.user_id ===
            currentUser.id;

          const memberName =
            profile?.full_name?.trim() ||
            (isCurrentUser
              ? currentProfile?.full_name?.trim()
              : "") ||
            "Membro do Workspace";

          const memberEmail =
            isCurrentUser
              ? currentUser.email
              : "E-mail indisponível";

          const initials =
            getInitials(memberName);

          return `
            <article class="workspace-member-item">

              <div class="workspace-member-avatar">
                ${escapeHtml(initials)}
              </div>

              <div class="workspace-member-info">

                <strong>
                  ${escapeHtml(memberName)}
                </strong>

                <span>
                  ${escapeHtml(memberEmail)}
                </span>

              </div>

              <div class="workspace-member-meta">

                <span class="workspace-member-role">
                  ${escapeHtml(
                    getMemberRoleLabel(
                      member.role
                    )
                  )}
                </span>

                <span class="workspace-member-status">
                  ${escapeHtml(
                    getMemberStatusLabel(
                      member.status
                    )
                  )}
                </span>

              </div>

            </article>
          `;
        })
        .join("");

    window.lucide?.createIcons();
  }

  /* ========================================================
     Integrações
  ======================================================== */

  function renderSocialAccounts() {
    if (
      !elements.workspaceIntegrationsList
    ) {
      return;
    }

    if (socialAccounts.length === 0) {
      elements.workspaceIntegrationsList.innerHTML = `
        <div class="workspace-empty-state">

          <div class="workspace-empty-state-icon">
            <i data-lucide="share-2"></i>
          </div>

          <strong>
            Nenhuma conta social conectada
          </strong>

          <p>
            As contas sociais conectadas às suas marcas aparecerão aqui.
          </p>

        </div>
      `;

      window.lucide?.createIcons();
      return;
    }

    const brandsMap =
      new Map(
        workspaceBrands.map(
          (brand) => [
            brand.id,
            brand,
          ]
        )
      );

    elements.workspaceIntegrationsList.innerHTML =
      socialAccounts
        .map((account) => {
          const brand =
            brandsMap.get(
              account.brand_id
            );

          const accountTitle =
            account.account_name ||
            account.username ||
            getPlatformLabel(
              account.platform
            );

          const accountSubtitle = [
            brand?.name,
            account.username
              ? `@${String(
                  account.username
                ).replace(/^@/, "")}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return `
            <article class="workspace-integration-item">

              <div class="workspace-integration-icon">

                <i
                  data-lucide="${getPlatformIcon(
                    account.platform
                  )}"
                  aria-hidden="true"
                ></i>

              </div>

              <div class="workspace-integration-info">

                <strong>
                  ${escapeHtml(accountTitle)}
                </strong>

                <span>
                  ${escapeHtml(
                    accountSubtitle ||
                      getPlatformLabel(
                        account.platform
                      )
                  )}
                </span>

              </div>

              <span class="workspace-integration-status">
                ${escapeHtml(
                  getSocialStatusLabel(
                    account.status
                  )
                )}
              </span>

            </article>
          `;
        })
        .join("");

    window.lucide?.createIcons();
  }

  /* ========================================================
     Permissões
  ======================================================== */

  function canEditWorkspace() {
    return [
      "owner",
      "admin",
    ].includes(
      currentMembership?.role
    );
  }

  function configureWorkspacePermissions() {
    const canEdit =
      canEditWorkspace();

    [
      elements.editWorkspaceButton,
      elements.editWorkspaceSecondaryButton,
    ].forEach((button) => {
      if (!button) {
        return;
      }

      button.disabled =
        !canEdit;

      button.setAttribute(
        "aria-disabled",
        String(!canEdit)
      );

      if (!canEdit) {
        button.title =
          "Apenas proprietários e administradores podem editar o workspace.";
      }
    });
  }

  /* ========================================================
     Modal
  ======================================================== */

  function ensureSelectValue(
    selectElement,
    value
  ) {
    if (
      !selectElement ||
      !value
    ) {
      return;
    }

    const optionExists =
      Array.from(
        selectElement.options
      ).some(
        (option) =>
          option.value === value
      );

    if (!optionExists) {
      const option =
        document.createElement("option");

      option.value =
        value;

      option.textContent =
        value;

      selectElement.appendChild(
        option
      );
    }

    selectElement.value =
      value;
  }

  function clearWorkspaceFormErrors() {
    elements.workspaceNameInput?.classList.remove(
      "is-invalid"
    );

    if (
      elements.workspaceNameError
    ) {
      elements.workspaceNameError.textContent =
        "";
    }

    if (
      elements.workspaceFormError
    ) {
      elements.workspaceFormError.textContent =
        "";

      elements.workspaceFormError.classList.add(
        "hidden"
      );
    }
  }

  function showWorkspaceFormError(
    message
  ) {
    if (
      !elements.workspaceFormError
    ) {
      return;
    }

    elements.workspaceFormError.textContent =
      message;

    elements.workspaceFormError.classList.remove(
      "hidden"
    );
  }

  function validateWorkspaceForm() {
    clearWorkspaceFormErrors();

    const name =
      elements.workspaceNameInput?.value.trim() ||
      "";

    if (
      name.length < 2 ||
      name.length > 100
    ) {
      elements.workspaceNameInput?.classList.add(
        "is-invalid"
      );

      if (
        elements.workspaceNameError
      ) {
        elements.workspaceNameError.textContent =
          "O nome deve ter entre 2 e 100 caracteres.";
      }

      return false;
    }

    return true;
  }

  function openWorkspaceModal() {
    if (!canEditWorkspace()) {
      showToast(
        "warning",
        "Sem permissão",
        "Apenas proprietários e administradores podem editar o workspace."
      );

      return;
    }

    clearWorkspaceFormErrors();

    if (
      elements.workspaceNameInput
    ) {
      elements.workspaceNameInput.value =
        currentWorkspace.name || "";
    }

    if (
      elements.workspaceDescriptionInput
    ) {
      elements.workspaceDescriptionInput.value =
        currentWorkspace.description || "";
    }

    ensureSelectValue(
      elements.workspaceLanguageInput,
      currentWorkspace.language
    );

    ensureSelectValue(
      elements.workspaceTimezoneInput,
      currentWorkspace.timezone
    );

    elements.workspaceModal?.classList.remove(
      "hidden"
    );

    elements.workspaceModal?.classList.add(
      "is-open"
    );

    elements.workspaceModal?.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "modal-open"
    );

    window.setTimeout(() => {
      elements.workspaceNameInput?.focus();
    }, 100);
  }

  function closeWorkspaceModal() {
    elements.workspaceModal?.classList.remove(
      "is-open"
    );

    elements.workspaceModal?.classList.add(
      "hidden"
    );

    elements.workspaceModal?.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "modal-open"
    );
  }

  function setWorkspaceFormSubmitting(
    isSubmitting
  ) {
    if (
      elements.workspaceFormSubmit
    ) {
      elements.workspaceFormSubmit.disabled =
        isSubmitting;

      elements.workspaceFormSubmit.setAttribute(
        "aria-busy",
        String(isSubmitting)
      );
    }

    elements.workspaceFormLoader?.classList.toggle(
      "hidden",
      !isSubmitting
    );

    if (
      elements.workspaceFormSubmitText
    ) {
      elements.workspaceFormSubmitText.textContent =
        isSubmitting
          ? "A guardar..."
          : "Guardar alterações";
    }
  }

  /* ========================================================
     Atualizar workspace
  ======================================================== */

  async function handleWorkspaceSubmit(
    event
  ) {
    event.preventDefault();

    if (!validateWorkspaceForm()) {
      return;
    }

    const name =
      elements.workspaceNameInput.value.trim();

    const description =
      elements.workspaceDescriptionInput
        ?.value.trim() || null;

    const language =
      elements.workspaceLanguageInput
        ?.value || "pt-PT";

    const timezone =
      elements.workspaceTimezoneInput
        ?.value || "Europe/Lisbon";

    setWorkspaceFormSubmitting(true);

    try {
      const {
        data,
        error,
      } =
        await supabaseClient
          .from("workspaces")
          .update({
            name,
            description,
            language,
            timezone,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            currentWorkspace.id
          )
          .select(`
            id,
            owner_id,
            name,
            slug,
            description,
            logo_url,
            language,
            timezone,
            plan,
            status,
            created_at,
            updated_at
          `)
          .single();

      if (error) {
        throw error;
      }

      currentWorkspace =
        data;

      renderUserIdentity();
      renderWorkspaceInformation();

      closeWorkspaceModal();

      showToast(
        "success",
        "Workspace atualizado",
        "As informações foram guardadas com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar workspace:",
        error
      );

      const message =
        error?.message ||
        "Não foi possível guardar as alterações.";

      showWorkspaceFormError(
        message
      );

      showToast(
        "error",
        "Erro ao guardar",
        message
      );
    } finally {
      setWorkspaceFormSubmitting(false);
    }
  }

  /* ========================================================
     Eventos
  ======================================================== */

  elements.editWorkspaceButton?.addEventListener(
    "click",
    openWorkspaceModal
  );

  elements.editWorkspaceSecondaryButton?.addEventListener(
    "click",
    openWorkspaceModal
  );

  elements.workspaceModalClose?.addEventListener(
    "click",
    closeWorkspaceModal
  );

  elements.workspaceFormCancel?.addEventListener(
    "click",
    closeWorkspaceModal
  );

  elements.workspaceForm?.addEventListener(
    "submit",
    handleWorkspaceSubmit
  );

  elements.workspaceModal?.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        elements.workspaceModal
      ) {
        closeWorkspaceModal();
      }
    }
  );

  elements.sidebarOpenButton?.addEventListener(
    "click",
    () => {
      document.body.classList.add(
        "sidebar-open"
      );

      elements.sidebarOpenButton.setAttribute(
        "aria-expanded",
        "true"
      );
    }
  );

  elements.sidebarCloseButton?.addEventListener(
    "click",
    () => {
      document.body.classList.remove(
        "sidebar-open"
      );

      elements.sidebarOpenButton?.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  );

  elements.sidebarOverlay?.addEventListener(
    "click",
    () => {
      document.body.classList.remove(
        "sidebar-open"
      );

      elements.sidebarOpenButton?.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (
        elements.workspaceModal?.classList.contains(
          "is-open"
        )
      ) {
        closeWorkspaceModal();
      }

      document.body.classList.remove(
        "sidebar-open"
      );

      elements.sidebarOpenButton?.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  );

  /* ========================================================
     Inicialização
  ======================================================== */

  try {
    await loadWorkspaceContext();
    await loadWorkspaceData();

    renderWorkspaceInformation();
    renderWorkspaceUsage();
    renderWorkspaceMembers();
    renderSocialAccounts();

    window.lucide?.createIcons();

    console.log(
      "Workspace carregado:",
      currentWorkspace
    );
  } catch (error) {
    console.error(
      "Erro ao iniciar a página Workspace:",
      error
    );

    if (
      elements.workspaceMembersList
    ) {
      elements.workspaceMembersList.innerHTML = `
        <div class="workspace-empty-state">

          <div class="workspace-empty-state-icon">
            <i data-lucide="triangle-alert"></i>
          </div>

          <strong>
            Não foi possível carregar os membros
          </strong>

          <p>
            Atualize a página e tente novamente.
          </p>

        </div>
      `;
    }

    if (
      elements.workspaceIntegrationsList
    ) {
      elements.workspaceIntegrationsList.innerHTML = `
        <div class="workspace-empty-state">

          <div class="workspace-empty-state-icon">
            <i data-lucide="triangle-alert"></i>
          </div>

          <strong>
            Não foi possível carregar as integrações
          </strong>

          <p>
            Atualize a página e tente novamente.
          </p>

        </div>
      `;
    }

    showToast(
      "error",
      "Erro de inicialização",
      error?.message ||
        "Não foi possível carregar o workspace."
    );

    window.lucide?.createIcons();
  }
});

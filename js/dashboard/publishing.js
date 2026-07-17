"use strict";

/* =========================================================
   StudioV — Publicações
   Banco utilizado: public.contents
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const supabaseClient = window.supabaseClient;

  if (!supabaseClient) {
    console.error("Supabase Client não encontrado.");
    return;
  }

  /* =======================================================
     ELEMENTOS DO HTML
  ======================================================= */

  const elements = {
    publicationsGrid:
      document.getElementById("publications-grid"),

    publicationsLoading:
      document.getElementById("publications-loading"),

    publicationsEmpty:
      document.getElementById("publications-empty"),

    publicationsNoResults:
      document.getElementById("publications-no-results"),

    searchInput:
      document.getElementById("publications-search-input"),

    brandFilter:
      document.getElementById("publications-brand-filter"),

    statusFilter:
      document.getElementById("publications-status-filter"),

    sortSelect:
      document.getElementById("publications-sort-select"),

    clearFiltersButton:
      document.getElementById(
        "clear-publication-filters-button"
      ),

    totalCount:
      document.getElementById(
        "total-publications-count"
      ),

    scheduledCount:
      document.getElementById(
        "scheduled-publications-count"
      ),

    publishedCount:
      document.getElementById(
        "published-publications-count"
      ),

    createButton:
      document.getElementById(
        "create-publication-button"
      ),

    emptyCreateButton:
      document.getElementById(
        "empty-create-publication-button"
      ),

    publicationModal:
      document.getElementById("publication-modal"),

    publicationModalTitle:
      document.getElementById(
        "publication-modal-title"
      ),

    publicationModalClose:
      document.getElementById(
        "publication-modal-close"
      ),

    publicationForm:
      document.getElementById("publication-form"),

    publicationFormCancel:
      document.getElementById(
        "publication-form-cancel"
      ),

    publicationId:
      document.getElementById("publication-id"),

    publicationBrand:
      document.getElementById("publication-brand"),

    publicationPlatform:
      document.getElementById(
        "publication-platform"
      ),

    publicationTitle:
      document.getElementById("publication-title"),

    publicationTitleError:
      document.getElementById(
        "publication-title-error"
      ),

    publicationDescription:
      document.getElementById(
        "publication-description"
      ),

    publicationDate:
      document.getElementById("publication-date"),

    publicationStatus:
      document.getElementById(
        "publication-status"
      ),

    publicationFormError:
      document.getElementById(
        "publication-form-error"
      ),

    publicationSubmitText:
      document.getElementById(
        "publication-form-submit-text"
      ),

    toastContainer:
      document.getElementById("toast-container"),

    currentWorkspaceName:
      document.getElementById(
        "current-workspace-name"
      ),

    sidebarUserName:
      document.getElementById("sidebar-user-name"),

    sidebarUserEmail:
      document.getElementById("sidebar-user-email"),

    sidebarUserAvatar:
      document.getElementById("sidebar-user-avatar"),

    topbarAvatar:
      document.getElementById("topbar-avatar"),

    sidebarOverlay:
      document.getElementById("sidebar-overlay"),

    sidebarOpenButton:
      document.getElementById("topbar-menu-button"),

    sidebarCloseButton:
      document.getElementById("sidebar-close"),
  };

  elements.publicationSubmitButton =
    elements.publicationForm?.querySelector(
      'button[type="submit"]'
    );

  elements.publicationButtonLoader =
    elements.publicationSubmitButton?.querySelector(
      ".button-loader"
    );

  /* =======================================================
     ESTADO DA PÁGINA
  ======================================================= */

  let currentUser = null;
  let currentWorkspace = null;
  let brands = [];
  let publications = [];

  const validStatuses = [
    "draft",
    "in_review",
    "approved",
    "scheduled",
    "published",
    "cancelled",
    "archived",
  ];

  /* =======================================================
     FUNÇÕES UTILITÁRIAS
  ======================================================= */

  function escapeHtml(value = "") {
    const temporaryElement =
      document.createElement("div");

    temporaryElement.textContent =
      String(value ?? "");

    return temporaryElement.innerHTML;
  }

  function normalizeText(value = "") {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function getSafeMetadata(metadata) {
    if (
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      return {};
    }

    return metadata;
  }

  function getSafeColor(color) {
    if (
      typeof color === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(color)
    ) {
      return color;
    }

    return "#6D28D9";
  }

  function formatDate(value) {
    if (!value) {
      return "Sem data";
    }

    const normalizedValue =
      /^\d{4}-\d{2}-\d{2}$/.test(String(value))
        ? `${value}T12:00:00`
        : value;

    const date = new Date(normalizedValue);

    if (Number.isNaN(date.getTime())) {
      return "Sem data";
    }

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function getStatusLabel(status) {
    const labels = {
      draft: "Rascunho",
      in_review: "Em revisão",
      approved: "Aprovado",
      scheduled: "Agendado",
      published: "Publicado",
      cancelled: "Cancelado",
      archived: "Arquivado",
    };

    return labels[status] || status || "Rascunho";
  }

  function getContentTypeLabel(contentType) {
    const labels = {
      post: "Post",
      reel: "Reel",
      story: "Story",
      carousel: "Carrossel",
      video: "Vídeo",
      article: "Artigo",
      email: "E-mail",
      short: "Short",
    };

    return labels[contentType] || contentType || "Post";
  }

  function getSourceLabel(source) {
    const labels = {
      manual: "Manual",
      planner: "Planner",
      ai: "IA",
      imported: "Importado",
      reused: "Reutilizado",
    };

    return labels[source] || source || "Manual";
  }

  function getPlatformLabel(platform) {
    const labels = {
      instagram: "Instagram",
      facebook: "Facebook",
      linkedin: "LinkedIn",
      tiktok: "TikTok",
      youtube: "YouTube",
      pinterest: "Pinterest",
      threads: "Threads",
      x: "X",
      blog: "Blog",
      email: "E-mail",
    };

    return labels[platform] || platform || "Sem plataforma";
  }

  function getPlatformIcon(platform) {
    const icons = {
      instagram: "camera",
      facebook: "users",
      linkedin: "briefcase",
      tiktok: "music",
      youtube: "play",
      pinterest: "bookmark",
      threads: "at-sign",
      x: "message-circle",
      blog: "file-text",
      email: "mail",
    };

    return icons[platform] || "send";
  }

  function getContentIcon(contentType) {
    const icons = {
      post: "file-text",
      reel: "clapperboard",
      story: "smartphone",
      carousel: "gallery-horizontal-end",
      video: "video",
      article: "newspaper",
      email: "mail",
      short: "film",
    };

    return icons[contentType] || "file-text";
  }

  function getPublicationPlatforms(publication) {
    if (
      Array.isArray(publication.target_platforms) &&
      publication.target_platforms.length > 0
    ) {
      return publication.target_platforms;
    }

    const metadata = getSafeMetadata(publication.metadata);

    if (
      Array.isArray(metadata.platforms) &&
      metadata.platforms.length > 0
    ) {
      return metadata.platforms;
    }

    if (
      typeof metadata.platform === "string" &&
      metadata.platform.trim()
    ) {
      return [metadata.platform.trim()];
    }

    return [];
  }

  function getPublicationDate(publication) {
    const metadata = getSafeMetadata(publication.metadata);

    return (
      metadata.scheduled_at ||
      metadata.publication_date ||
      null
    );
  }

  function getBrandById(brandId) {
    return (
      brands.find((brand) => brand.id === brandId) ||
      null
    );
  }

  /* =======================================================
     TOAST
  ======================================================= */

  function showToast(type, title, message) {
    if (!elements.toastContainer) {
      return;
    }

    const toast = document.createElement("div");

    toast.className = `toast is-${type}`;

    toast.innerHTML = `
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
    `;

    elements.toastContainer.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  /* =======================================================
     ESTADOS VISUAIS
  ======================================================= */

  function setPublicationsView(view) {
    elements.publicationsLoading?.classList.toggle(
      "hidden",
      view !== "loading"
    );

    elements.publicationsEmpty?.classList.toggle(
      "hidden",
      view !== "empty"
    );

    elements.publicationsNoResults?.classList.toggle(
      "hidden",
      view !== "no-results"
    );

    elements.publicationsGrid?.classList.toggle(
      "hidden",
      view !== "grid"
    );
  }

  function openModal() {
    if (!elements.publicationModal) {
      return;
    }

    elements.publicationModal.classList.remove("hidden");
    elements.publicationModal.classList.add("is-open");

    elements.publicationModal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add("modal-open");
  }

  function closeModal() {
    if (!elements.publicationModal) {
      return;
    }

    elements.publicationModal.classList.remove("is-open");
    elements.publicationModal.classList.add("hidden");

    elements.publicationModal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove("modal-open");
  }

  /* =======================================================
     AUTENTICAÇÃO E WORKSPACE
  ======================================================= */

  async function getAuthenticatedUser() {
    if (window.studioVAuthReady) {
      const userFromGuard =
        await window.studioVAuthReady;

      if (userFromGuard) {
        return userFromGuard;
      }
    }

    const { data, error } =
      await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user || null;
  }

  async function loadWorkspaceContext() {
    currentUser = await getAuthenticatedUser();

    if (!currentUser) {
      throw new Error("Utilizador não autenticado.");
    }

    const [
      profileResponse,
      membershipResponse,
    ] = await Promise.all([
      supabaseClient
        .from("profiles")
        .select("full_name")
        .eq("id", currentUser.id)
        .maybeSingle(),

      supabaseClient
        .from("workspace_members")
        .select("workspace_id, role")
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

    const membership = membershipResponse.data;

    if (!membership?.workspace_id) {
      throw new Error(
        "Nenhum workspace ativo foi encontrado."
      );
    }

    const { data: workspace, error: workspaceError } =
      await supabaseClient
        .from("workspaces")
        .select("id, name, status")
        .eq("id", membership.workspace_id)
        .single();

    if (workspaceError) {
      throw workspaceError;
    }

    currentWorkspace = {
      ...workspace,
      role: membership.role,
    };

    const profile = profileResponse.data;

    const userName =
      profile?.full_name?.trim() ||
      currentUser.email?.split("@")[0] ||
      "Utilizador";

    const userInitial =
      userName.charAt(0).toUpperCase();

    if (elements.currentWorkspaceName) {
      elements.currentWorkspaceName.textContent =
        currentWorkspace.name;
    }

    if (elements.sidebarUserName) {
      elements.sidebarUserName.textContent =
        userName;
    }

    if (elements.sidebarUserEmail) {
      elements.sidebarUserEmail.textContent =
        currentUser.email || "";
    }

    if (elements.sidebarUserAvatar) {
      elements.sidebarUserAvatar.textContent =
        userInitial;
    }

    if (elements.topbarAvatar) {
      elements.topbarAvatar.textContent =
        userInitial;
    }

    console.log(
      "Workspace carregado:",
      currentWorkspace
    );
  }

  /* =======================================================
     MARCAS
  ======================================================= */

  async function loadBrands() {
    if (!currentWorkspace?.id) {
      return;
    }

    const { data, error } =
      await supabaseClient
        .from("brands")
        .select(`
          id,
          name,
          logo_url,
          primary_color,
          status
        `)
        .eq("workspace_id", currentWorkspace.id)
        .order("name", {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    brands = data || [];

    populateBrandFilter();
    populatePublicationBrandSelect();
  }

  function populateBrandFilter() {
    if (!elements.brandFilter) {
      return;
    }

    const currentValue =
      elements.brandFilter.value || "all";

    elements.brandFilter.innerHTML = `
      <option value="all">
        Todas as marcas
      </option>
    `;

    brands.forEach((brand) => {
      const option = document.createElement("option");

      option.value = brand.id;
      option.textContent = brand.name;

      elements.brandFilter.appendChild(option);
    });

    const valueExists = Array.from(
      elements.brandFilter.options
    ).some((option) => option.value === currentValue);

    elements.brandFilter.value = valueExists
      ? currentValue
      : "all";
  }

  function populatePublicationBrandSelect(
    selectedBrandId = ""
  ) {
    if (!elements.publicationBrand) {
      return;
    }

    elements.publicationBrand.innerHTML = `
      <option value="">
        Selecionar marca
      </option>
    `;

    brands
      .filter(
        (brand) =>
          brand.status === "active" ||
          brand.id === selectedBrandId
      )
      .forEach((brand) => {
        const option =
          document.createElement("option");

        option.value = brand.id;

        option.textContent =
          brand.status === "archived"
            ? `${brand.name} — Arquivada`
            : brand.name;

        elements.publicationBrand.appendChild(option);
      });

    elements.publicationBrand.value =
      selectedBrandId;
  }

  /* =======================================================
     OPÇÕES DE ESTADO
  ======================================================= */

  function populateStatusOptions() {
    if (elements.statusFilter) {
      const currentFilter =
        elements.statusFilter.value || "all";

      elements.statusFilter.innerHTML = `
        <option value="all">
          Todos os estados
        </option>
      `;

      validStatuses.forEach((status) => {
        const option =
          document.createElement("option");

        option.value = status;
        option.textContent = getStatusLabel(status);

        elements.statusFilter.appendChild(option);
      });

      elements.statusFilter.value =
        currentFilter === "all" ||
        validStatuses.includes(currentFilter)
          ? currentFilter
          : "all";
    }

    if (elements.publicationStatus) {
      const currentStatus =
        elements.publicationStatus.value || "draft";

      elements.publicationStatus.innerHTML = "";

      validStatuses.forEach((status) => {
        const option =
          document.createElement("option");

        option.value = status;
        option.textContent = getStatusLabel(status);

        elements.publicationStatus.appendChild(option);
      });

      elements.publicationStatus.value =
        validStatuses.includes(currentStatus)
          ? currentStatus
          : "draft";
    }
  }

  /* =======================================================
     CARREGAR CONTEÚDOS
  ======================================================= */

  async function loadPublications() {
    if (!currentWorkspace?.id) {
      return;
    }

    setPublicationsView("loading");

    const { data, error } =
      await supabaseClient
        .from("contents")
        .select(`
          id,
          workspace_id,
          brand_id,
          plan_item_id,
          title,
          brief,
          main_text,
          content_type,
          target_platforms,
          source,
          status,
          metadata,
          status_before_archive,
          archived_at,
          created_at,
          updated_at
        `)
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      publications = [];

      updateCounters();
      setPublicationsView("empty");

      console.error(
        "Erro ao carregar conteúdos:",
        error
      );

      showToast(
        "error",
        "Erro ao carregar",
        "Não foi possível carregar os conteúdos."
      );

      return;
    }

    publications = data || [];

    updateCounters();
    applyPublicationFilters();

    console.log(
      "Conteúdos carregados:",
      publications.length
    );
  }

  /* =======================================================
     CONTADORES
  ======================================================= */

  function updateCounters() {
    const scheduledCount =
      publications.filter(
        (publication) =>
          publication.status === "scheduled"
      ).length;

    const publishedCount =
      publications.filter(
        (publication) =>
          publication.status === "published"
      ).length;

    if (elements.totalCount) {
      elements.totalCount.textContent =
        String(publications.length);
    }

    if (elements.scheduledCount) {
      elements.scheduledCount.textContent =
        String(scheduledCount);
    }

    if (elements.publishedCount) {
      elements.publishedCount.textContent =
        String(publishedCount);
    }
  }

  /* =======================================================
     FILTROS
  ======================================================= */

  function getFilteredPublications() {
    const searchTerm = normalizeText(
      elements.searchInput?.value || ""
    );

    const selectedBrand =
      elements.brandFilter?.value || "all";

    const selectedStatus =
      elements.statusFilter?.value || "all";

    const selectedSort =
      elements.sortSelect?.value || "newest";

    const filteredPublications =
      publications.filter((publication) => {
        const brand = getBrandById(
          publication.brand_id
        );

        const platforms =
          getPublicationPlatforms(publication)
            .map(getPlatformLabel)
            .join(" ");

        const searchableContent = normalizeText(
          [
            publication.title,
            publication.brief,
            publication.main_text,
            publication.content_type,
            publication.source,
            publication.status,
            brand?.name,
            platforms,
          ]
            .filter(Boolean)
            .join(" ")
        );

        const matchesSearch =
          !searchTerm ||
          searchableContent.includes(searchTerm);

        const matchesBrand =
          selectedBrand === "all" ||
          publication.brand_id === selectedBrand;

        const matchesStatus =
          selectedStatus === "all" ||
          publication.status === selectedStatus;

        return (
          matchesSearch &&
          matchesBrand &&
          matchesStatus
        );
      });

    filteredPublications.sort(
      (firstPublication, secondPublication) => {
        const firstCreatedAt = new Date(
          firstPublication.created_at
        ).getTime();

        const secondCreatedAt = new Date(
          secondPublication.created_at
        ).getTime();

        switch (selectedSort) {
          case "oldest":
            return firstCreatedAt - secondCreatedAt;

          case "title-asc":
            return String(
              firstPublication.title || ""
            ).localeCompare(
              String(secondPublication.title || ""),
              "pt"
            );

          case "title-desc":
            return String(
              secondPublication.title || ""
            ).localeCompare(
              String(firstPublication.title || ""),
              "pt"
            );

          default:
            return secondCreatedAt - firstCreatedAt;
        }
      }
    );

    return filteredPublications;
  }

  function applyPublicationFilters() {
    if (publications.length === 0) {
      if (elements.publicationsGrid) {
        elements.publicationsGrid.innerHTML = "";
      }

      setPublicationsView("empty");
      return;
    }

    const filteredPublications =
      getFilteredPublications();

    if (filteredPublications.length === 0) {
      if (elements.publicationsGrid) {
        elements.publicationsGrid.innerHTML = "";
      }

      setPublicationsView("no-results");
      return;
    }

    renderPublications(filteredPublications);
  }

  /* =======================================================
     RENDERIZAR CARDS
  ======================================================= */

  function renderPublications(items) {
    if (!elements.publicationsGrid) {
      return;
    }

    elements.publicationsGrid.innerHTML = "";

    items.forEach((publication) => {
      const brand = getBrandById(
        publication.brand_id
      );

      const brandName =
        brand?.name || "Sem marca";

      const brandColor = getSafeColor(
        brand?.primary_color
      );

      const platforms =
        getPublicationPlatforms(publication);

      const platformsHtml =
        platforms.length > 0
          ? platforms
              .map((platform) => {
                return `
                  <span class="publication-platform">
                    ${escapeHtml(getPlatformLabel(platform))}
                  </span>
                `;
              })
              .join("")
          : `
              <span class="publication-platform is-empty">
                <i
                  data-lucide="circle-slash"
                  aria-hidden="true"
                ></i>

                Sem plataforma
              </span>
            `;

      const mainPlatform =
        platforms[0] || "";

      const platformText =
        platforms.length > 0
          ? platforms.map(getPlatformLabel).join(", ")
          : "Sem plataforma";

      const publicationDate =
        getPublicationDate(publication);

      const isArchived =
        publication.status === "archived";

      const title =
        publication.title?.trim() ||
        "Conteúdo sem título";

      const description =
        publication.main_text?.trim() ||
        publication.brief?.trim() ||
        "Nenhum texto principal adicionado.";

      const avatarContent = brand?.logo_url
        ? `
          <img
            src="${escapeHtml(brand.logo_url)}"
            alt="${escapeHtml(brandName)}"
          >
        `
        : `
          <i
            data-lucide="${getContentIcon(
              publication.content_type
            )}"
            aria-hidden="true"
          ></i>
        `;

      const card = document.createElement("article");

      card.className = "content-card";

      card.dataset.publicationId =
        publication.id;

      if (isArchived) {
        card.classList.add("is-archived");
      }

      card.innerHTML = `
        <header class="content-card-header">

          <div class="content-card-identity">

            <div
              class="content-card-avatar"
              style="background: ${brandColor};"
            >
              ${avatarContent}
            </div>

            <div class="content-card-title-group">

              <h2 class="content-card-title">
                ${escapeHtml(title)}
              </h2>

              <p class="content-card-subtitle">
                ${escapeHtml(brandName)}
              </p>

            </div>

          </div>

        </header>

        <div class="content-card-body">

          <p>
            ${escapeHtml(description)}
          </p>

          <div class="publication-platforms">
            <div class="publication-platforms">
              ${platformsHtml}
            </div>
          </div>

          <div class="publication-information">

            <div class="publication-information-item">

              <span>Tipo</span>

              <strong>
                ${escapeHtml(
                  getContentTypeLabel(
                    publication.content_type
                  )
                )}
              </strong>

            </div>

            <div class="publication-information-item">

              <span>Origem</span>

              <strong>
                ${escapeHtml(
                  getSourceLabel(publication.source)
                )}
              </strong>

            </div>

            <div class="publication-information-item">

              <span>Data planeada</span>

              <strong>
                ${escapeHtml(
                  formatDate(publicationDate)
                )}
              </strong>

            </div>

          </div>

        </div>

        <footer class="content-card-footer">

          <div>

            <span
              class="publication-status is-${escapeHtml(
                publication.status || "draft"
              )}"
            >
              ${escapeHtml(
                getStatusLabel(publication.status)
              )}
            </span>

            <small>
              Criado em
              ${escapeHtml(
                formatDate(publication.created_at)
              )}
            </small>

          </div>

          <div class="publication-card-actions">

            <button
              type="button"
              class="publication-action-button is-edit"
              data-publication-action="edit"
            >
              <i
                data-lucide="pencil"
                aria-hidden="true"
              ></i>

              Editar
            </button>

            <button
              type="button"
              class="publication-action-button ${
                isArchived
                  ? "is-restore"
                  : "is-archive"
              }"
              data-publication-action="${
                isArchived
                  ? "restore"
                  : "archive"
              }"
            >
              <i
                data-lucide="${
                  isArchived
                    ? "rotate-ccw"
                    : "archive"
                }"
                aria-hidden="true"
              ></i>

              ${
                isArchived
                  ? "Restaurar"
                  : "Arquivar"
              }
            </button>

          </div>

        </footer>
      `;

      elements.publicationsGrid.appendChild(card);
    });

    setPublicationsView("grid");

    window.lucide?.createIcons();
  }

  /* =======================================================
     FORMULÁRIO
  ======================================================= */

  function clearFormErrors() {
    elements.publicationTitle?.classList.remove(
      "is-invalid"
    );

    elements.publicationBrand?.classList.remove(
      "is-invalid"
    );

    elements.publicationPlatform?.classList.remove(
      "is-invalid"
    );

    elements.publicationDate?.classList.remove(
      "is-invalid"
    );

    if (elements.publicationTitleError) {
      elements.publicationTitleError.textContent = "";
    }

    if (elements.publicationFormError) {
      elements.publicationFormError.textContent = "";

      elements.publicationFormError.classList.add(
        "hidden"
      );
    }
  }

  function showFormError(message) {
    if (!elements.publicationFormError) {
      return;
    }

    elements.publicationFormError.textContent =
      message;

    elements.publicationFormError.classList.remove(
      "hidden"
    );
  }

  function validateForm() {
    clearFormErrors();

    const title =
      elements.publicationTitle?.value.trim() || "";

    const brandId =
      elements.publicationBrand?.value || "";

    const platform =
      elements.publicationPlatform?.value || "";

    const status =
      elements.publicationStatus?.value || "draft";

    const publicationDate =
      elements.publicationDate?.value || "";

    if (title.length < 2) {
      elements.publicationTitle?.classList.add(
        "is-invalid"
      );

      if (elements.publicationTitleError) {
        elements.publicationTitleError.textContent =
          "O título deve ter pelo menos 2 caracteres.";
      }

      return false;
    }

    if (!brandId) {
      elements.publicationBrand?.classList.add(
        "is-invalid"
      );

      showFormError("Selecione uma marca.");
      return false;
    }

    if (!platform) {
      elements.publicationPlatform?.classList.add(
        "is-invalid"
      );

      showFormError("Selecione uma plataforma.");
      return false;
    }

    if (
      status === "scheduled" &&
      !publicationDate
    ) {
      elements.publicationDate?.classList.add(
        "is-invalid"
      );

      showFormError(
        "Informe uma data para agendar a publicação."
      );

      return false;
    }

    return true;
  }

  function setFormSubmitting(isSubmitting) {
    if (elements.publicationSubmitButton) {
      elements.publicationSubmitButton.disabled =
        isSubmitting;
    }

    elements.publicationButtonLoader?.classList.toggle(
      "hidden",
      !isSubmitting
    );

    if (!elements.publicationSubmitText) {
      return;
    }

    if (isSubmitting) {
      elements.publicationSubmitText.textContent =
        elements.publicationId?.value
          ? "A guardar..."
          : "A criar...";

      return;
    }

    elements.publicationSubmitText.textContent =
      elements.publicationId?.value
        ? "Guardar alterações"
        : "Criar publicação";
  }

  function resetPublicationForm() {
    elements.publicationForm?.reset();

    clearFormErrors();

    if (elements.publicationId) {
      elements.publicationId.value = "";
    }

    if (elements.publicationBrand) {
      elements.publicationBrand.disabled = false;
    }

    populatePublicationBrandSelect();

    if (elements.publicationStatus) {
      elements.publicationStatus.value = "draft";
    }

    if (elements.publicationModalTitle) {
      elements.publicationModalTitle.textContent =
        "Nova publicação";
    }

    if (elements.publicationSubmitText) {
      elements.publicationSubmitText.textContent =
        "Criar publicação";
    }
  }

  function openCreatePublicationModal() {
    resetPublicationForm();
    openModal();

    window.setTimeout(() => {
      elements.publicationTitle?.focus();
    }, 100);
  }

  function openEditPublicationModal(contentId) {
    const publication = publications.find(
      (item) => item.id === contentId
    );

    if (!publication) {
      showToast(
        "error",
        "Conteúdo não encontrado",
        "Não foi possível abrir esta publicação."
      );

      return;
    }

    if (publication.status === "archived") {
      showToast(
        "warning",
        "Conteúdo arquivado",
        "Restaure o conteúdo antes de o editar."
      );

      return;
    }

    resetPublicationForm();

    const metadata = getSafeMetadata(
      publication.metadata
    );

    const platforms =
      getPublicationPlatforms(publication);

    populatePublicationBrandSelect(
      publication.brand_id
    );

    if (elements.publicationId) {
      elements.publicationId.value =
        publication.id;
    }

    if (elements.publicationBrand) {
      elements.publicationBrand.value =
        publication.brand_id;

      elements.publicationBrand.disabled = true;
    }

    if (elements.publicationPlatform) {
      elements.publicationPlatform.value =
        platforms[0] || "";
    }

    if (elements.publicationTitle) {
      elements.publicationTitle.value =
        publication.title || "";
    }

    if (elements.publicationDescription) {
      elements.publicationDescription.value =
        publication.main_text || "";
    }

    if (elements.publicationDate) {
      elements.publicationDate.value =
        metadata.scheduled_at ||
        metadata.publication_date ||
        "";
    }

    if (elements.publicationStatus) {
      elements.publicationStatus.value =
        publication.status || "draft";
    }

    if (elements.publicationModalTitle) {
      elements.publicationModalTitle.textContent =
        "Editar publicação";
    }

    if (elements.publicationSubmitText) {
      elements.publicationSubmitText.textContent =
        "Guardar alterações";
    }

    openModal();

    window.setTimeout(() => {
      elements.publicationTitle?.focus();
    }, 100);
  }

  async function changeContentStatus(
    contentId,
    currentStatus,
    requestedStatus
  ) {
    if (
      !contentId ||
      !requestedStatus ||
      currentStatus === requestedStatus
    ) {
      return;
    }

    if (requestedStatus === "archived") {
      const { error } = await supabaseClient.rpc(
        "archive_content",
        {
          content_id_value: contentId,
        }
      );

      if (error) {
        throw error;
      }

      return;
    }

    const { error } = await supabaseClient.rpc(
      "change_content_status",
      {
        content_id_value: contentId,
        status_value: requestedStatus,
      }
    );

    if (error) {
      throw error;
    }
  }

  /* =======================================================
     SALVAR PUBLICAÇÃO
  ======================================================= */

  async function handlePublicationSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!currentWorkspace?.id) {
      showFormError(
        "Não foi possível identificar o workspace."
      );

      return;
    }

    const editingId =
      elements.publicationId?.value.trim() || null;

    const existingPublication = editingId
      ? publications.find(
          (item) => item.id === editingId
        )
      : null;

    const brandId =
      elements.publicationBrand?.value || "";

    const platform =
      elements.publicationPlatform?.value || "";

    const title =
      elements.publicationTitle?.value.trim() || "";

    const mainText =
      elements.publicationDescription?.value.trim() ||
      null;

    const publicationDate =
      elements.publicationDate?.value || null;

    const requestedStatus =
      elements.publicationStatus?.value || "draft";

    const existingMetadata = getSafeMetadata(
      existingPublication?.metadata
    );

    const metadata = {
      ...existingMetadata,
      platform,
      platforms: [platform],
      scheduled_at: publicationDate,
      publication_date: publicationDate,
    };

    setFormSubmitting(true);

    try {
      let savedPublication = null;

      if (editingId) {
        const { data, error } =
          await supabaseClient.rpc(
            "update_content",
            {
              content_id_value: editingId,
              title_value: title,
              brief_value:
                existingPublication?.brief || null,
              main_text_value: mainText,
              content_type_value:
                existingPublication?.content_type ||
                "post",
              target_platforms_value: [platform],
              metadata_value: metadata,
            }
          );

        if (error) {
          throw error;
        }

        savedPublication = Array.isArray(data)
          ? data[0]
          : data;
      } else {
        const { data, error } =
          await supabaseClient.rpc(
            "create_manual_content",
            {
              workspace_id_value:
                currentWorkspace.id,

              brand_id_value: brandId,
              assigned_to_value: null,
              title_value: title,
              brief_value: null,
              main_text_value: mainText,
              content_type_value: "post",
              target_platforms_value: [platform],
              metadata_value: metadata,
            }
          );

        if (error) {
          throw error;
        }

        savedPublication = Array.isArray(data)
          ? data[0]
          : data;
      }

      const savedContentId =
        savedPublication?.id || editingId;

      if (!savedContentId) {
        throw new Error(
          "O conteúdo foi guardado, mas o ID não foi retornado."
        );
      }

      const originalStatus =
        savedPublication?.status ||
        existingPublication?.status ||
        "draft";

      await changeContentStatus(
        savedContentId,
        originalStatus,
        requestedStatus
      );

      closeModal();
      await loadPublications();

      showToast(
        "success",
        editingId
          ? "Publicação atualizada"
          : "Publicação criada",
        editingId
          ? "As alterações foram guardadas."
          : "O conteúdo foi criado com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao guardar publicação:",
        error
      );

      const message =
        error?.message ||
        "Não foi possível guardar a publicação.";

      showFormError(message);

      showToast(
        "error",
        "Erro ao guardar",
        message
      );
    } finally {
      setFormSubmitting(false);
    }
  }

  /* =======================================================
     ARQUIVAR E RESTAURAR
  ======================================================= */

  async function archivePublication(contentId) {
    const confirmed = window.confirm(
      "Deseja arquivar esta publicação?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabaseClient.rpc(
      "archive_content",
      {
        content_id_value: contentId,
      }
    );

    if (error) {
      throw error;
    }

    await loadPublications();

    showToast(
      "success",
      "Publicação arquivada",
      "O conteúdo foi arquivado com sucesso."
    );
  }

  async function restorePublication(contentId) {
    const { error } = await supabaseClient.rpc(
      "restore_content",
      {
        content_id_value: contentId,
      }
    );

    if (error) {
      throw error;
    }

    await loadPublications();

    showToast(
      "success",
      "Publicação restaurada",
      "O conteúdo voltou ao estado anterior."
    );
  }

  /* =======================================================
     EVENTOS
  ======================================================= */

  elements.publicationForm?.addEventListener(
    "submit",
    handlePublicationSubmit
  );

  elements.createButton?.addEventListener(
    "click",
    openCreatePublicationModal
  );

  elements.emptyCreateButton?.addEventListener(
    "click",
    openCreatePublicationModal
  );

  elements.publicationModalClose?.addEventListener(
    "click",
    closeModal
  );

  elements.publicationFormCancel?.addEventListener(
    "click",
    closeModal
  );

  elements.publicationModal?.addEventListener(
    "click",
    (event) => {
      if (event.target === elements.publicationModal) {
        closeModal();
      }
    }
  );

  elements.searchInput?.addEventListener(
    "input",
    applyPublicationFilters
  );

  elements.brandFilter?.addEventListener(
    "change",
    applyPublicationFilters
  );

  elements.statusFilter?.addEventListener(
    "change",
    applyPublicationFilters
  );

  elements.sortSelect?.addEventListener(
    "change",
    applyPublicationFilters
  );

  elements.clearFiltersButton?.addEventListener(
    "click",
    () => {
      if (elements.searchInput) {
        elements.searchInput.value = "";
      }

      if (elements.brandFilter) {
        elements.brandFilter.value = "all";
      }

      if (elements.statusFilter) {
        elements.statusFilter.value = "all";
      }

      if (elements.sortSelect) {
        elements.sortSelect.value = "newest";
      }

      applyPublicationFilters();
    }
  );

  elements.publicationsGrid?.addEventListener(
    "click",
    async (event) => {
      const actionButton = event.target.closest(
        "[data-publication-action]"
      );

      if (!actionButton) {
        return;
      }

      const card = actionButton.closest(
        "[data-publication-id]"
      );

      const contentId =
        card?.dataset.publicationId;

      const action =
        actionButton.dataset.publicationAction;

      if (!contentId) {
        return;
      }

      if (action === "edit") {
        openEditPublicationModal(contentId);
        return;
      }

      actionButton.disabled = true;

      try {
        if (action === "archive") {
          await archivePublication(contentId);
        }

        if (action === "restore") {
          await restorePublication(contentId);
        }
      } catch (error) {
        console.error(
          "Erro na operação da publicação:",
          error
        );

        showToast(
          "error",
          "Operação não concluída",
          error?.message ||
            "Não foi possível concluir a operação."
        );
      } finally {
        if (actionButton.isConnected) {
          actionButton.disabled = false;
        }
      }
    }
  );

  elements.sidebarOpenButton?.addEventListener(
    "click",
    () => {
      document.body.classList.add("sidebar-open");

      elements.sidebarOpenButton?.setAttribute(
        "aria-expanded",
        "true"
      );
    }
  );

  elements.sidebarCloseButton?.addEventListener(
    "click",
    () => {
      document.body.classList.remove("sidebar-open");

      elements.sidebarOpenButton?.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  );

  elements.sidebarOverlay?.addEventListener(
    "click",
    () => {
      document.body.classList.remove("sidebar-open");

      elements.sidebarOpenButton?.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  );

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (
      elements.publicationModal?.classList.contains(
        "is-open"
      )
    ) {
      closeModal();
    }

    document.body.classList.remove("sidebar-open");

    elements.sidebarOpenButton?.setAttribute(
      "aria-expanded",
      "false"
    );
  });

  /* =======================================================
     INICIALIZAÇÃO
  ======================================================= */

  try {
    setPublicationsView("loading");

    populateStatusOptions();

    await loadWorkspaceContext();
    await loadBrands();
    await loadPublications();

    window.lucide?.createIcons();
  } catch (error) {
    console.error(
      "Erro ao iniciar a página de Publicações:",
      error
    );

    setPublicationsView("empty");

    showToast(
      "error",
      "Erro de inicialização",
      error?.message ||
        "Não foi possível iniciar a página."
    );
  }
});
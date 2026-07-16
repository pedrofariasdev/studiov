"use strict";

/* ==========================================================
   StudioV — Gestão de Marcas
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  /* ======================================================
       Elementos gerais
    ====================================================== */

  const body = document.body;

  const sidebar = document.getElementById("dashboard-sidebar");

  const sidebarOverlay = document.getElementById("sidebar-overlay");

  const sidebarOpenButton = document.getElementById("topbar-menu-button");

  const sidebarCloseButton = document.getElementById("sidebar-close");

  const createBrandButton = document.getElementById("create-brand-button");

  const emptyCreateBrandButton = document.getElementById("empty-create-brand-button");

  const brandModal = document.getElementById("brand-modal");

  const brandModalTitle = document.getElementById("brand-modal-title");

  const brandModalClose = document.getElementById("brand-modal-close");

  const brandFormCancel = document.getElementById("brand-form-cancel");

  const archiveBrandModal = document.getElementById("archive-brand-modal");

  const archiveBrandCancel = document.getElementById("archive-brand-cancel");

  const archiveBrandConfirm = document.getElementById("archive-brand-confirm");

  const brandForm = document.getElementById("brand-form");

  const brandIdInput = document.getElementById("brand-id");

  const brandNameInput = document.getElementById("brand-name");

  const brandNameError = document.getElementById("brand-name-error");

  const brandIndustryInput = document.getElementById("brand-industry");

  const brandLogoInput = document.getElementById("brand-logo-url");

  const brandLanguageInput = document.getElementById("brand-language");

  const brandWebsiteInput = document.getElementById("brand-website");

  const brandWebsiteError = document.getElementById("brand-website-error");

  const brandDescriptionInput = document.getElementById("brand-description");

  const brandDescriptionCounter = document.getElementById("brand-description-counter");

  const primaryColorPicker = document.getElementById("brand-primary-color-picker");

  const primaryColorInput = document.getElementById("brand-primary-color");

  const secondaryColorPicker = document.getElementById("brand-secondary-color-picker");

  const secondaryColorInput = document.getElementById("brand-secondary-color");

  const brandFormError = document.getElementById("brand-form-error");

  const brandFormSubmitText = document.getElementById("brand-form-submit-text");

  const brandFormSubmitButton = brandForm?.querySelector('button[type="submit"]');

  const brandFormSubmitLoader = brandFormSubmitButton?.querySelector(".button-loader");

  const brandsSearchInput = document.getElementById("brands-search-input");

  const brandsStatusFilter = document.getElementById("brands-status-filter");

  const brandsSortSelect = document.getElementById("brands-sort-select");

  const clearBrandFiltersButton = document.getElementById("clear-brand-filters-button");

  const brandsLoading = document.getElementById("brands-loading");

  const brandsEmpty = document.getElementById("brands-empty");

  const brandsNoResults = document.getElementById("brands-no-results");

  const brandsGrid = document.getElementById("brands-grid");

  const totalBrandsCount = document.getElementById("total-brands-count");

  const activeBrandsCount = document.getElementById("active-brands-count");

  const archivedBrandsCount = document.getElementById("archived-brands-count");

  const toastContainer = document.getElementById("toast-container");

  /* ======================================================
       Contexto autenticado
    ====================================================== */

  const supabaseClient = window.supabaseClient;

  const currentWorkspaceName = document.getElementById("current-workspace-name");

  const sidebarUserName = document.getElementById("sidebar-user-name");

  const sidebarUserEmail = document.getElementById("sidebar-user-email");

  const sidebarUserAvatar = document.getElementById("sidebar-user-avatar");

  const topbarAvatar = document.getElementById("topbar-avatar");

  let currentUser = null;
  let currentWorkspace = null;

  let brands = [];
  let selectedBrandId = null;
  let lastFocusedElement = null;

  /* ======================================================
       Utilitários
    ====================================================== */

  function escapeHtml(value = "") {
    const element = document.createElement("div");

    element.textContent = String(value);

    return element.innerHTML;
  }

  function getSafeColor(value, fallback) {
    return /^#[0-9A-F]{6}$/i.test(value || "") ? value : fallback;
  }

  function getSafeHttpUrl(value) {
    if (!value) {
      return null;
    }

    try {
      const url = new URL(value);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return null;
      }

      return url.href;
    } catch {
      return null;
    }
  }

  function getLanguageInfo(languageCode) {
    const languages = {
      "pt-PT": {
        short: "Português · PT",
        full: "Português — Portugal",
      },

      "pt-BR": {
        short: "Português · BR",
        full: "Português — Brasil",
      },

      "en-US": {
        short: "Inglês · US",
        full: "Inglês — Estados Unidos",
      },

      "en-GB": {
        short: "Inglês · UK",
        full: "Inglês — Reino Unido",
      },

      "es-ES": {
        short: "Espanhol · ES",
        full: "Espanhol — Espanha",
      },

      "fr-FR": {
        short: "Francês · FR",
        full: "Francês — França",
      },

      "de-DE": {
        short: "Alemão · DE",
        full: "Alemão — Alemanha",
      },

      "it-IT": {
        short: "Italiano · IT",
        full: "Italiano — Itália",
      },

      en: {
        short: "Inglês",
        full: "Inglês",
      },

      es: {
        short: "Espanhol",
        full: "Espanhol",
      },
    };

    return (
      languages[languageCode] || {
        short: languageCode || "Português · PT",
        full: languageCode || "Português — Portugal",
      }
    );
  }

  function formatBrandDate(value) {
    if (!value) {
      return "Data indisponível";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Data indisponível";
    }

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function normalizeSearchText(value = "") {
    return String(value)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function normalizeHexColor(value = "") {
    return value.trim().toUpperCase();
  }

  function isValidHexColor(value) {
    return /^#[0-9A-F]{6}$/i.test(value);
  }

  function isValidHttpUrl(value) {
    if (!value) {
      return true;
    }

    try {
      const url = new URL(value);

      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  /* ======================================================
       Toasts
    ====================================================== */

  function getToastIcon(type) {
    const icons = {
      success: "circle-check",
      error: "circle-alert",
      warning: "triangle-alert",
      info: "info",
    };

    return icons[type] || icons.info;
  }

  function showToast(type = "info", title = "", message = "") {
    if (!toastContainer) {
      return;
    }

    const toast = document.createElement("div");

    toast.className = `toast is-${type}`;

    const iconWrapper = document.createElement("div");

    iconWrapper.className = "toast-icon";

    const icon = document.createElement("i");

    icon.setAttribute("data-lucide", getToastIcon(type));

    iconWrapper.appendChild(icon);

    const content = document.createElement("div");

    content.className = "toast-content";

    const toastTitle = document.createElement("strong");

    toastTitle.textContent = title;

    const toastMessage = document.createElement("p");

    toastMessage.textContent = message;

    content.append(toastTitle, toastMessage);

    const closeButton = document.createElement("button");

    closeButton.className = "toast-close";
    closeButton.type = "button";

    closeButton.setAttribute("aria-label", "Fechar mensagem");

    const closeIcon = document.createElement("i");

    closeIcon.setAttribute("data-lucide", "x");

    closeButton.appendChild(closeIcon);

    toast.append(iconWrapper, content, closeButton);

    toastContainer.appendChild(toast);

    if (window.lucide) {
      window.lucide.createIcons();
    }

    function removeToast() {
      toast.remove();
    }

    closeButton.addEventListener("click", removeToast);

    window.setTimeout(removeToast, 5000);
  }

  /* ======================================================
       Perfil e workspace
    ====================================================== */

  async function loadUserProfile(userId) {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Não foi possível carregar o perfil:", error.message);

      return null;
    }

    return data;
  }

  async function loadCurrentWorkspace(userId) {
    const { data: membership, error: membershipError } = await supabaseClient
      .from("workspace_members")
      .select("workspace_id, role, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership?.workspace_id) {
      throw new Error("O utilizador não possui um workspace ativo.");
    }

    const { data: workspace, error: workspaceError } = await supabaseClient
      .from("workspaces")
      .select("id, name, status")
      .eq("id", membership.workspace_id)
      .eq("status", "active")
      .single();

    if (workspaceError) {
      throw workspaceError;
    }

    return {
      ...workspace,
      role: membership.role,
    };
  }

  function getAvatarLetter(name, email) {
    const source = name?.trim() || email?.trim() || "U";

    return source.charAt(0).toUpperCase();
  }

  function updateDashboardIdentity(user, profile, workspace) {
    const fullName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Utilizador";

    const email = user.email || "Email não disponível";

    const avatarLetter = getAvatarLetter(fullName, email);

    if (currentWorkspaceName) {
      currentWorkspaceName.textContent = workspace.name;
    }

    if (sidebarUserName) {
      sidebarUserName.textContent = fullName;
    }

    if (sidebarUserEmail) {
      sidebarUserEmail.textContent = email;
    }

    if (sidebarUserAvatar) {
      sidebarUserAvatar.textContent = avatarLetter;
    }

    if (topbarAvatar) {
      topbarAvatar.textContent = avatarLetter;
    }
  }

  async function initializeWorkspaceContext() {
    if (!supabaseClient) {
      console.error("Cliente Supabase não encontrado.");

      return;
    }

    const user = await window.studioVAuthReady;

    if (!user) {
      return;
    }

    currentUser = user;

    try {
      const [profile, workspace] = await Promise.all([
        loadUserProfile(user.id),
        loadCurrentWorkspace(user.id),
      ]);

      currentWorkspace = workspace;

      updateDashboardIdentity(user, profile, workspace);

      console.log("Contexto do dashboard carregado:", {
        userId: user.id,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        role: workspace.role,
      });
    } catch (error) {
      console.error("Erro ao carregar contexto do dashboard:", error);

      showToast(
        "error",
        "Erro ao carregar workspace",
        "Não foi possível identificar o workspace atual."
      );
    }
  }

  /* ======================================================
       Estados da página
    ====================================================== */

  function setBrandsView(view) {
    brandsLoading?.classList.toggle("hidden", view !== "loading");

    brandsEmpty?.classList.toggle("hidden", view !== "empty");

    brandsNoResults?.classList.toggle("hidden", view !== "no-results");

    brandsGrid?.classList.toggle("hidden", view !== "grid");
  }

  function updateBrandCounters() {
    const activeCount = brands.filter((brand) => brand.status === "active").length;

    const archivedCount = brands.filter((brand) => brand.status === "archived").length;

    if (totalBrandsCount) {
      totalBrandsCount.textContent = String(brands.length);
    }

    if (activeBrandsCount) {
      activeBrandsCount.textContent = String(activeCount);
    }

    if (archivedBrandsCount) {
      archivedBrandsCount.textContent = String(archivedCount);
    }
  }

  /* ======================================================
       Pesquisa, filtros e ordenação
    ====================================================== */

  function getFilteredAndSortedBrands() {
    const searchTerm = normalizeSearchText(brandsSearchInput?.value || "");

    const selectedStatus = brandsStatusFilter?.value || "all";

    const selectedSort = brandsSortSelect?.value || "newest";

    const filteredBrands = brands.filter((brand) => {
      const matchesStatus = selectedStatus === "all" || brand.status === selectedStatus;

      const searchableContent = normalizeSearchText(
        [brand.name, brand.industry, brand.description, brand.website_url].filter(Boolean).join(" ")
      );

      const matchesSearch = searchTerm === "" || searchableContent.includes(searchTerm);

      return matchesStatus && matchesSearch;
    });

    filteredBrands.sort((firstBrand, secondBrand) => {
      if (selectedSort === "oldest") {
        return (
          new Date(firstBrand.created_at).getTime() - new Date(secondBrand.created_at).getTime()
        );
      }

      if (selectedSort === "name-asc") {
        return String(firstBrand.name || "").localeCompare(String(secondBrand.name || ""), "pt-PT");
      }

      if (selectedSort === "name-desc") {
        return String(secondBrand.name || "").localeCompare(String(firstBrand.name || ""), "pt-PT");
      }

      return new Date(secondBrand.created_at).getTime() - new Date(firstBrand.created_at).getTime();
    });

    return filteredBrands;
  }

  function applyBrandFilters() {
    if (brands.length === 0) {
      setBrandsView("empty");
      return;
    }

    const visibleBrands = getFilteredAndSortedBrands();

    if (visibleBrands.length === 0) {
      if (brandsGrid) {
        brandsGrid.innerHTML = "";
      }

      setBrandsView("no-results");

      return;
    }

    renderBrands(visibleBrands);
  }

  /* ======================================================
       Renderização das marcas
    ====================================================== */

  function renderBrands(items = brands) {
    if (!brandsGrid) {
      return;
    }

    brandsGrid.innerHTML = "";

    items.forEach((brand) => {
      const primaryColor = getSafeColor(brand.primary_color, "#6D28D9");

      const secondaryColor = getSafeColor(brand.secondary_color, "#A78BFA");

      const initial = brand.name?.trim().charAt(0).toUpperCase() || "M";

      const logoUrl = getSafeHttpUrl(brand.logo_url);

      const languageInfo = getLanguageInfo(brand.default_language);

      const isArchived = brand.status === "archived";

      const description = brand.description?.trim() || "Nenhuma descrição adicionada.";

      const logoContent = logoUrl
        ? `
                    <img
                        src="${escapeHtml(logoUrl)}"
                        alt="Logótipo da marca ${escapeHtml(brand.name || "")}"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                    >
                `
        : escapeHtml(initial);

      const card = document.createElement("article");

      card.className = ["brand-card", isArchived ? "is-archived" : ""].filter(Boolean).join(" ");

      card.dataset.brandId = brand.id;

      card.innerHTML = `
                <header class="brand-card-header">

                    <div class="brand-card-identity">

                        <div
                            class="brand-card-logo"
                            style="background-color: ${primaryColor}"
                        >
                            ${logoContent}
                        </div>

                        <div class="brand-card-title-group">

                            <h2 class="brand-card-title">
                                ${escapeHtml(brand.name || "Marca sem nome")}
                            </h2>

                            <span class="brand-card-industry">
                                ${escapeHtml(brand.industry || "Segmento não definido")}
                            </span>

                        </div>

                    </div>

                </header>

                <p class="brand-card-description ${brand.description ? "" : "is-empty"}">
                    ${escapeHtml(description)}
                </p>

                <div
                    class="brand-card-colors"
                    aria-label="Cores da marca"
                >

                    <span
                        class="brand-card-color"
                        style="background-color: ${primaryColor}"
                        title="Cor principal"
                    ></span>

                    <span
                        class="brand-card-color"
                        style="background-color: ${secondaryColor}"
                        title="Cor secundária"
                    ></span>

                </div>

                <div class="brand-card-meta">

                    <div class="brand-card-meta-item">

                        <span>Idioma</span>

                        <strong
                            title="${escapeHtml(languageInfo.full)}"
                        >
                            ${escapeHtml(languageInfo.short)}
                        </strong>

                    </div>

                    <div class="brand-card-meta-item">

                        <span>Website</span>

                        <strong title="${escapeHtml(brand.website_url || "Não definido")}">
                            ${escapeHtml(brand.website_url || "Não definido")}
                        </strong>

                    </div>

                </div>

                <footer class="brand-card-footer">

                    <div class="brand-card-footer-info">

                        <span class="brand-status ${isArchived ? "is-archived" : "is-active"}">
                            ${isArchived ? "Arquivada" : "Ativa"}
                        </span>

                        <span class="brand-card-date">
                            Criada em
                            ${escapeHtml(formatBrandDate(brand.created_at))}
                        </span>

                    </div>

                    <div class="brand-card-actions-inline">

                        <button
                            type="button"
                            class="brand-status-action is-edit"
                            data-brand-action="edit"
                            aria-label="Editar marca"
                        >
                            <i
                                data-lucide="pencil"
                                aria-hidden="true"
                            ></i>

                            <span>Editar</span>
                        </button>

                        <button
                            type="button"
                            class="brand-status-action ${isArchived ? "is-restore" : "is-archive"}"
                            data-brand-action="${isArchived ? "restore" : "archive"}"
                            aria-label="${isArchived ? "Restaurar marca" : "Arquivar marca"}"
                        >
                            <i
                                data-lucide="${isArchived ? "rotate-ccw" : "archive"}"
                                aria-hidden="true"
                            ></i>

                            <span>
                                ${isArchived ? "Restaurar" : "Arquivar"}
                            </span>
                        </button>

                    </div>

                </footer>
            `;

      const logoImage = card.querySelector(".brand-card-logo img");

      logoImage?.addEventListener("error", () => {
        const logoContainer = logoImage.parentElement;

        if (logoContainer) {
          logoContainer.textContent = initial;
        }
      });

      brandsGrid.appendChild(card);
    });

    setBrandsView("grid");

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* ======================================================
       Carregamento das marcas
    ====================================================== */

  async function loadBrands() {
    if (!currentWorkspace?.id) {
      return;
    }

    setBrandsView("loading");

    try {
      const { data, error } = await supabaseClient
        .from("brands")
        .select(
          `
                        id,
                        workspace_id,
                        name,
                        slug,
                        description,
                        industry,
                        website_url,
                        logo_url,
                        primary_color,
                        secondary_color,
                        default_language,
                        status,
                        created_at,
                        updated_at,
                        client_id
                    `
        )
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      brands = data || [];

      updateBrandCounters();

      if (brands.length === 0) {
        setBrandsView("empty");
        return;
      }

      applyBrandFilters();

      console.log("Marcas carregadas:", brands.length);
    } catch (error) {
      console.error("Erro ao carregar marcas:", error);

      setBrandsView(null);

      showToast(
        "error",
        "Erro ao carregar marcas",
        "Não foi possível obter as marcas deste workspace."
      );
    }
  }

  /* ======================================================
       Sidebar
    ====================================================== */

  function openSidebar() {
    body.classList.add("sidebar-open");

    sidebarOpenButton?.setAttribute("aria-expanded", "true");

    window.setTimeout(() => {
      sidebarCloseButton?.focus();
    }, 100);
  }

  function closeSidebar() {
    body.classList.remove("sidebar-open");

    sidebarOpenButton?.setAttribute("aria-expanded", "false");
  }

  sidebarOpenButton?.addEventListener("click", openSidebar);

  sidebarCloseButton?.addEventListener("click", closeSidebar);

  sidebarOverlay?.addEventListener("click", closeSidebar);

  /* ======================================================
       Controle dos modais
    ====================================================== */

  function openModal(modal) {
    if (!modal) {
      return;
    }

    lastFocusedElement = document.activeElement;

    modal.classList.remove("hidden");
    modal.classList.add("is-open");

    modal.setAttribute("aria-hidden", "false");

    body.classList.add("modal-open");
  }

  function closeModal(modal) {
    if (!modal) {
      return;
    }

    modal.classList.remove("is-open");
    modal.classList.add("hidden");

    modal.setAttribute("aria-hidden", "true");

    const hasOpenModal = document.querySelector(".modal-overlay.is-open");

    if (!hasOpenModal) {
      body.classList.remove("modal-open");
    }

    lastFocusedElement?.focus();
  }

  /* ======================================================
       Formulário
    ====================================================== */

  function setGeneralFormError(message) {
    if (!brandFormError) {
      return;
    }

    brandFormError.textContent = message;

    brandFormError.classList.remove("hidden");
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

  function clearFormErrors() {
    clearFieldError(brandNameInput, brandNameError);

    clearFieldError(brandWebsiteInput, brandWebsiteError);

    brandLogoInput?.classList.remove("is-invalid");

    primaryColorInput?.classList.remove("is-invalid");

    secondaryColorInput?.classList.remove("is-invalid");

    if (brandFormError) {
      brandFormError.textContent = "";

      brandFormError.classList.add("hidden");
    }
  }

  function updateDescriptionCounter() {
    if (!brandDescriptionInput || !brandDescriptionCounter) {
      return;
    }

    const currentLength = brandDescriptionInput.value.length;

    brandDescriptionCounter.textContent = `${currentLength}/1000`;
  }

  function setBrandFormSubmitting(isSubmitting) {
    const isEditing = Boolean(brandIdInput?.value.trim());

    if (brandFormSubmitButton) {
      brandFormSubmitButton.disabled = isSubmitting;

      brandFormSubmitButton.setAttribute("aria-busy", String(isSubmitting));
    }

    if (brandFormSubmitLoader) {
      brandFormSubmitLoader.classList.toggle("hidden", !isSubmitting);
    }

    if (!brandFormSubmitText) {
      return;
    }

    if (isSubmitting) {
      brandFormSubmitText.textContent = isEditing ? "A guardar..." : "A criar...";

      return;
    }

    brandFormSubmitText.textContent = isEditing ? "Guardar alterações" : "Criar marca";
  }

  function resetBrandForm() {
    brandForm?.reset();

    if (brandIdInput) {
      brandIdInput.value = "";
    }

    if (primaryColorInput) {
      primaryColorInput.value = "#6D28D9";
    }

    if (primaryColorPicker) {
      primaryColorPicker.value = "#6D28D9";
    }

    if (secondaryColorInput) {
      secondaryColorInput.value = "#A78BFA";
    }

    if (secondaryColorPicker) {
      secondaryColorPicker.value = "#A78BFA";
    }

    if (brandLanguageInput) {
      brandLanguageInput.value = "pt-PT";
    }

    if (brandModalTitle) {
      brandModalTitle.textContent = "Nova marca";
    }

    if (brandFormSubmitText) {
      brandFormSubmitText.textContent = "Criar marca";
    }

    clearFormErrors();
    updateDescriptionCounter();
  }

  function getLanguageForForm(language) {
    const legacyLanguages = {
      en: "en-US",
      es: "es-ES",
    };

    return legacyLanguages[language] || language || "pt-PT";
  }

  function setLanguageFormValue(language) {
    if (!brandLanguageInput) {
      return;
    }

    const normalizedLanguage = getLanguageForForm(language);

    const optionExists = Array.from(brandLanguageInput.options).some(
      (option) => option.value === normalizedLanguage
    );

    if (!optionExists) {
      const newOption = document.createElement("option");

      newOption.value = normalizedLanguage;

      newOption.textContent = normalizedLanguage;

      brandLanguageInput.appendChild(newOption);
    }

    brandLanguageInput.value = normalizedLanguage;
  }

  function openCreateBrandModal() {
    resetBrandForm();
    openModal(brandModal);

    window.setTimeout(() => {
      brandNameInput?.focus();
    }, 100);
  }

  function openEditBrandModal(brandId) {
    const brand = brands.find((item) => item.id === brandId);

    if (!brand) {
      showToast("error", "Marca não encontrada", "Não foi possível carregar os dados da marca.");

      return;
    }

    resetBrandForm();

    if (brandIdInput) {
      brandIdInput.value = brand.id;
    }

    if (brandNameInput) {
      brandNameInput.value = brand.name || "";
    }

    if (brandIndustryInput) {
      brandIndustryInput.value = brand.industry || "";
    }

    if (brandDescriptionInput) {
      brandDescriptionInput.value = brand.description || "";
    }

    if (brandWebsiteInput) {
      brandWebsiteInput.value = brand.website_url || "";
    }

    if (brandLogoInput) {
      brandLogoInput.value = brand.logo_url || "";
    }

    setLanguageFormValue(brand.default_language);

    const primaryColor = getSafeColor(brand.primary_color, "#6D28D9");

    const secondaryColor = getSafeColor(brand.secondary_color, "#A78BFA");

    if (primaryColorInput) {
      primaryColorInput.value = primaryColor;
    }

    if (primaryColorPicker) {
      primaryColorPicker.value = primaryColor;
    }

    if (secondaryColorInput) {
      secondaryColorInput.value = secondaryColor;
    }

    if (secondaryColorPicker) {
      secondaryColorPicker.value = secondaryColor;
    }

    if (brandModalTitle) {
      brandModalTitle.textContent = "Editar marca";
    }

    if (brandFormSubmitText) {
      brandFormSubmitText.textContent = "Guardar alterações";
    }

    updateDescriptionCounter();
    clearFormErrors();
    openModal(brandModal);

    window.setTimeout(() => {
      brandNameInput?.focus();
    }, 100);
  }

  function validateBrandForm() {
    clearFormErrors();

    let isValid = true;

    const brandName = brandNameInput?.value.trim() || "";

    const website = brandWebsiteInput?.value.trim() || "";

    const logoUrl = brandLogoInput?.value.trim() || "";

    const primaryColor = primaryColorInput?.value.trim() || "";

    const secondaryColor = secondaryColorInput?.value.trim() || "";

    if (!brandName) {
      setFieldError(brandNameInput, brandNameError, "Informe o nome da marca.");

      isValid = false;
    } else if (brandName.length < 2) {
      setFieldError(brandNameInput, brandNameError, "O nome deve ter pelo menos 2 caracteres.");

      isValid = false;
    } else if (brandName.length > 100) {
      setFieldError(brandNameInput, brandNameError, "O nome deve ter no máximo 100 caracteres.");

      isValid = false;
    }

    if (!isValidHttpUrl(website)) {
      setFieldError(
        brandWebsiteInput,
        brandWebsiteError,
        "Informe um endereço válido iniciado por http:// ou https://."
      );

      isValid = false;
    }

    if (!isValidHttpUrl(logoUrl)) {
      brandLogoInput?.classList.add("is-invalid");

      setGeneralFormError("A URL do logótipo deve começar com http:// ou https://.");

      isValid = false;
    }

    if (primaryColor && !isValidHexColor(primaryColor)) {
      primaryColorInput?.classList.add("is-invalid");

      setGeneralFormError("A cor principal deve seguir o formato #RRGGBB.");

      isValid = false;
    }

    if (secondaryColor && !isValidHexColor(secondaryColor)) {
      secondaryColorInput?.classList.add("is-invalid");

      setGeneralFormError("A cor secundária deve seguir o formato #RRGGBB.");

      isValid = false;
    }

    return isValid;
  }

  /* ======================================================
       Campos do formulário
    ====================================================== */

  brandDescriptionInput?.addEventListener("input", updateDescriptionCounter);

  primaryColorPicker?.addEventListener("input", () => {
    if (!primaryColorInput) {
      return;
    }

    primaryColorInput.value = primaryColorPicker.value.toUpperCase();
  });

  primaryColorInput?.addEventListener("input", () => {
    const color = normalizeHexColor(primaryColorInput.value);

    primaryColorInput.value = color;

    primaryColorInput.classList.remove("is-invalid");

    if (primaryColorPicker && isValidHexColor(color)) {
      primaryColorPicker.value = color;
    }
  });

  secondaryColorPicker?.addEventListener("input", () => {
    if (!secondaryColorInput) {
      return;
    }

    secondaryColorInput.value = secondaryColorPicker.value.toUpperCase();
  });

  secondaryColorInput?.addEventListener("input", () => {
    const color = normalizeHexColor(secondaryColorInput.value);

    secondaryColorInput.value = color;

    secondaryColorInput.classList.remove("is-invalid");

    if (secondaryColorPicker && isValidHexColor(color)) {
      secondaryColorPicker.value = color;
    }
  });

  brandNameInput?.addEventListener("input", () => {
    clearFieldError(brandNameInput, brandNameError);
  });

  brandWebsiteInput?.addEventListener("input", () => {
    clearFieldError(brandWebsiteInput, brandWebsiteError);
  });

  brandLogoInput?.addEventListener("input", () => {
    brandLogoInput.classList.remove("is-invalid");
  });

  updateDescriptionCounter();

  /* ======================================================
       Criar e editar marca
    ====================================================== */

  brandForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const isValid = validateBrandForm();

    if (!isValid) {
      showToast("error", "Verifique o formulário", "Existem campos que precisam ser corrigidos.");

      return;
    }

    if (!currentWorkspace?.id) {
      showToast(
        "error",
        "Workspace indisponível",
        "Não foi possível identificar o workspace atual."
      );

      return;
    }

    const editingBrandId = brandIdInput?.value.trim() || null;

    const isEditing = Boolean(editingBrandId);

    setBrandFormSubmitting(true);

    if (brandFormError) {
      brandFormError.textContent = "";

      brandFormError.classList.add("hidden");
    }

    const commonParameters = {
      brand_name: brandNameInput.value.trim(),

      brand_description: brandDescriptionInput?.value.trim() || null,

      brand_industry: brandIndustryInput?.value.trim() || null,

      brand_website_url: brandWebsiteInput?.value.trim() || null,

      brand_primary_color: primaryColorInput?.value.trim() || "#6D28D9",

      brand_secondary_color: secondaryColorInput?.value.trim() || "#A78BFA",

      brand_logo_url: brandLogoInput?.value.trim() || null,

      brand_default_language: brandLanguageInput?.value || "pt-PT",
    };

    try {
      const functionName = isEditing ? "update_brand" : "create_brand";

      const parameters = isEditing
        ? {
            target_brand_id: editingBrandId,

            ...commonParameters,
          }
        : {
            target_workspace_id: currentWorkspace.id,

            ...commonParameters,
          };

      const { data, error } = await supabaseClient.rpc(functionName, parameters);

      if (error) {
        throw error;
      }

      console.log(isEditing ? "Marca atualizada:" : "Marca criada:", data);

      closeModal(brandModal);

      await loadBrands();

      showToast(
        "success",
        isEditing ? "Marca atualizada" : "Marca criada",
        isEditing
          ? "As alterações foram guardadas com sucesso."
          : "A nova marca foi adicionada ao workspace."
      );
    } catch (error) {
      console.error(isEditing ? "Erro ao atualizar marca:" : "Erro ao criar marca:", error);

      const message =
        error?.message ||
        (isEditing ? "Não foi possível atualizar a marca." : "Não foi possível criar a marca.");

      setGeneralFormError(message);

      showToast("error", isEditing ? "Erro ao atualizar marca" : "Erro ao criar marca", message);
    } finally {
      setBrandFormSubmitting(false);
    }
  });

  /* ======================================================
       Arquivar e restaurar marcas
    ====================================================== */

  function openArchiveBrandModal(brandId) {
    if (!archiveBrandModal) {
      console.error('Elemento com id="archive-brand-modal" não encontrado.');

      return;
    }

    selectedBrandId = brandId;

    openModal(archiveBrandModal);
  }

  function closeArchiveBrandModal() {
    closeModal(archiveBrandModal);

    selectedBrandId = null;
  }

  function setArchiveSubmitting(isSubmitting) {
    if (!archiveBrandConfirm) {
      return;
    }

    archiveBrandConfirm.disabled = isSubmitting;

    archiveBrandConfirm.setAttribute("aria-busy", String(isSubmitting));

    archiveBrandConfirm.textContent = isSubmitting ? "A arquivar..." : "Arquivar marca";
  }

  async function archiveBrand(brandId) {
    setArchiveSubmitting(true);

    try {
      const { data, error } = await supabaseClient.rpc("archive_brand", {
        target_brand_id: brandId,
      });

      if (error) {
        throw error;
      }

      console.log("Marca arquivada:", data);

      closeArchiveBrandModal();

      await loadBrands();

      showToast("success", "Marca arquivada", "A marca foi arquivada com sucesso.");
    } catch (error) {
      console.error("Erro ao arquivar marca:", error);

      showToast(
        "error",
        "Erro ao arquivar marca",
        error?.message || "Não foi possível arquivar a marca."
      );
    } finally {
      setArchiveSubmitting(false);
    }
  }

  async function restoreBrand(brandId) {
    try {
      const { data, error } = await supabaseClient.rpc("restore_brand", {
        target_brand_id: brandId,
      });

      if (error) {
        throw error;
      }

      console.log("Marca restaurada:", data);

      await loadBrands();

      showToast("success", "Marca restaurada", "A marca voltou a ficar ativa.");
    } catch (error) {
      console.error("Erro ao restaurar marca:", error);

      showToast(
        "error",
        "Erro ao restaurar marca",
        error?.message || "Não foi possível restaurar a marca."
      );
    }
  }

  /* ======================================================
       Eventos dos modais
    ====================================================== */

  createBrandButton?.addEventListener("click", openCreateBrandModal);

  emptyCreateBrandButton?.addEventListener("click", openCreateBrandModal);

  brandModalClose?.addEventListener("click", () => {
    closeModal(brandModal);
  });

  brandFormCancel?.addEventListener("click", () => {
    closeModal(brandModal);
  });

  brandModal?.addEventListener("click", (event) => {
    if (event.target === brandModal) {
      closeModal(brandModal);
    }
  });

  archiveBrandCancel?.addEventListener("click", closeArchiveBrandModal);

  archiveBrandModal?.addEventListener("click", (event) => {
    if (event.target === archiveBrandModal) {
      closeArchiveBrandModal();
    }
  });

  archiveBrandConfirm?.addEventListener("click", async () => {
    if (!selectedBrandId) {
      return;
    }

    await archiveBrand(selectedBrandId);
  });

  /* ======================================================
       Eventos dos cartões
    ====================================================== */

  brandsGrid?.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("[data-brand-action]");

    if (!actionButton) {
      return;
    }

    const brandCard = actionButton.closest("[data-brand-id]");

    const brandId = brandCard?.dataset.brandId;

    const action = actionButton.dataset.brandAction;

    console.log("Ação da marca:", action, brandId);

    if (!brandId) {
      return;
    }

    if (action === "edit") {
      openEditBrandModal(brandId);

      return;
    }

    if (action === "archive") {
      openArchiveBrandModal(brandId);

      return;
    }

    if (action === "restore") {
      actionButton.disabled = true;

      await restoreBrand(brandId);

      /*
       * O botão pode já não existir após
       * a lista ser renderizada novamente.
       */
      if (actionButton.isConnected) {
        actionButton.disabled = false;
      }
    }
  });

  /* ======================================================
       Pesquisa e filtros
    ====================================================== */

  brandsSearchInput?.addEventListener("input", applyBrandFilters);

  brandsStatusFilter?.addEventListener("change", applyBrandFilters);

  brandsSortSelect?.addEventListener("change", applyBrandFilters);

  clearBrandFiltersButton?.addEventListener("click", () => {
    if (brandsSearchInput) {
      brandsSearchInput.value = "";
    }

    if (brandsStatusFilter) {
      brandsStatusFilter.value = "all";
    }

    if (brandsSortSelect) {
      brandsSortSelect.value = "newest";
    }

    applyBrandFilters();

    showToast("info", "Filtros removidos", "A pesquisa e os filtros foram redefinidos.");
  });

  /* ======================================================
       Tecla Escape
    ====================================================== */

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (archiveBrandModal && archiveBrandModal.classList.contains("is-open")) {
      closeArchiveBrandModal();
      return;
    }

    if (brandModal && brandModal.classList.contains("is-open")) {
      closeModal(brandModal);
      return;
    }

    if (body.classList.contains("sidebar-open")) {
      closeSidebar();
    }
  });

  /* ======================================================
       Inicialização
    ====================================================== */

  await initializeWorkspaceContext();

  if (currentWorkspace) {
    await loadBrands();
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
});

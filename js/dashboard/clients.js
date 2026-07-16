"use strict";

/* ==========================================================
   StudioV — Clientes
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  /* ======================================================
       Elementos
    ====================================================== */

  const body = document.body;

  const sidebarOpenButton = document.getElementById("topbar-menu-button");

  const sidebarCloseButton = document.getElementById("sidebar-close");

  const sidebarOverlay = document.getElementById("sidebar-overlay");

  const currentWorkspaceName = document.getElementById("current-workspace-name");

  const sidebarUserName = document.getElementById("sidebar-user-name");

  const sidebarUserEmail = document.getElementById("sidebar-user-email");

  const sidebarUserAvatar = document.getElementById("sidebar-user-avatar");

  const topbarAvatar = document.getElementById("topbar-avatar");

  const clientsLoading = document.getElementById("clients-loading");

  const clientsEmpty = document.getElementById("clients-empty");

  const clientsNoResults = document.getElementById("clients-no-results");

  const clientsGrid = document.getElementById("clients-grid");

  const totalClientsCount = document.getElementById("total-clients-count");

  const activeClientsCount = document.getElementById("active-clients-count");

  const archivedClientsCount = document.getElementById("archived-clients-count");

  const clientsSearchInput = document.getElementById("clients-search-input");

  const clientsStatusFilter = document.getElementById("clients-status-filter");

  const clientsSortSelect = document.getElementById("clients-sort-select");

  const clearClientFiltersButton = document.getElementById("clear-client-filters-button");

  const toastContainer = document.getElementById("toast-container");

  const createClientButton = document.getElementById("create-client-button");

  const emptyCreateClientButton = document.getElementById("empty-create-client-button");

  const clientModal = document.getElementById("client-modal");

  const clientModalTitle = document.getElementById("client-modal-title");

  const clientModalClose = document.getElementById("client-modal-close");

  const clientFormCancel = document.getElementById("client-form-cancel");

  const clientForm = document.getElementById("client-form");

  const clientIdInput = document.getElementById("client-id");

  const clientNameInput = document.getElementById("client-name");

  const clientNameError = document.getElementById("client-name-error");

  const clientCompanyInput = document.getElementById("client-company-name");

  const clientEmailInput = document.getElementById("client-email");

  const clientEmailError = document.getElementById("client-email-error");

  const clientPhoneInput = document.getElementById("client-phone");

  const clientWebsiteInput = document.getElementById("client-website");

  const clientWebsiteError = document.getElementById("client-website-error");

  const clientNotesInput = document.getElementById("client-notes");

  const clientNotesCounter = document.getElementById("client-notes-counter");

  const clientFormError = document.getElementById("client-form-error");

  const clientFormSubmitText = document.getElementById("client-form-submit-text");

  const clientFormSubmitButton = document.getElementById("client-form-submit");

  const clientFormLoader = document.getElementById("client-form-loader");

  const archiveClientModal = document.getElementById("archive-client-modal");

  const archiveClientCancel = document.getElementById("archive-client-cancel");

  const archiveClientConfirm = document.getElementById("archive-client-confirm");

  const clientBrandsModal = document.getElementById("client-brands-modal");

  const clientBrandsModalClose = document.getElementById("client-brands-modal-close");

  const clientBrandsClientName = document.getElementById("client-brands-client-name");

  const clientBrandsLoading = document.getElementById("client-brands-loading");

  const clientBrandsEmpty = document.getElementById("client-brands-empty");

  const clientBrandsList = document.getElementById("client-brands-list");

  const clientBrandsCancel = document.getElementById("client-brands-cancel");

  const clientBrandsSave = document.getElementById("client-brands-save");

  let lastFocusedElement = null;
  let selectedClientId = null;
  let selectedBrandsClientId = null;

  const supabaseClient = window.supabaseClient;

  let currentWorkspace = null;
  let clients = [];
  let brands = [];

  /* ======================================================
       Utilitários
    ====================================================== */

  function escapeHtml(value = "") {
    const element = document.createElement("div");

    element.textContent = String(value);

    return element.innerHTML;
  }

  function getSafeColor(value, fallback = "#6D28D9") {
    return /^#[0-9A-F]{6}$/i.test(value || "") ? value : fallback;
  }

  function getInitials(name = "") {
    const words = String(name).trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      return "C";
    }

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  function formatClientDate(value) {
    if (!value) {
      return "Data indisponível";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Data indisponível";
    }

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "2-digit",
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

  function getSafeMailto(value) {
    if (!value) {
      return null;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : null;
  }

  function getSafeTelephone(value) {
    if (!value) {
      return null;
    }

    const normalized = String(value).replace(/[^0-9+]/g, "");

    return normalized ? `tel:${normalized}` : null;
  }

  /* ======================================================
       Toasts
    ====================================================== */

  function showToast(type = "info", title = "", message = "") {
    if (!toastContainer) {
      return;
    }

    const icons = {
      success: "circle-check",
      error: "circle-alert",
      warning: "triangle-alert",
      info: "info",
    };

    const toast = document.createElement("div");

    toast.className = `toast is-${type}`;

    toast.innerHTML = `
            <div class="toast-icon">
                <i
                    data-lucide="${icons[type] || icons.info}"
                    aria-hidden="true"
                ></i>
            </div>

            <div class="toast-content">
                <strong>${escapeHtml(title)}</strong>
                <p>${escapeHtml(message)}</p>
            </div>

            <button
                class="toast-close"
                type="button"
                aria-label="Fechar mensagem"
            >
                <i data-lucide="x"></i>
            </button>
        `;

    toastContainer.appendChild(toast);

    toast.querySelector(".toast-close")?.addEventListener("click", () => {
      toast.remove();
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }

    window.setTimeout(() => {
      toast.remove();
    }, 5000);
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

  function updateDashboardIdentity(user, profile, workspace) {
    const fullName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Utilizador";

    const email = user.email || "Email não disponível";

    const avatarLetter = fullName.charAt(0).toUpperCase();

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
      throw new Error("Cliente Supabase não encontrado.");
    }

    const user = await window.studioVAuthReady;

    if (!user) {
      return false;
    }

    const [profile, workspace] = await Promise.all([
      loadUserProfile(user.id),
      loadCurrentWorkspace(user.id),
    ]);

    currentWorkspace = workspace;

    updateDashboardIdentity(user, profile, workspace);

    console.log("Contexto de Clientes carregado:", {
      userId: user.id,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      role: workspace.role,
    });

    return true;
  }

  /* ======================================================
       Estados da página
    ====================================================== */

  function setClientsView(view) {
    clientsLoading?.classList.toggle("hidden", view !== "loading");

    clientsEmpty?.classList.toggle("hidden", view !== "empty");

    clientsNoResults?.classList.toggle("hidden", view !== "no-results");

    clientsGrid?.classList.toggle("hidden", view !== "grid");
  }

  function updateClientCounters() {
    const activeCount = clients.filter((client) => client.status === "active").length;

    const archivedCount = clients.filter((client) => client.status === "archived").length;

    if (totalClientsCount) {
      totalClientsCount.textContent = String(clients.length);
    }

    if (activeClientsCount) {
      activeClientsCount.textContent = String(activeCount);
    }

    if (archivedClientsCount) {
      archivedClientsCount.textContent = String(archivedCount);
    }
  }

  /* ======================================================
       Filtros
    ====================================================== */

  function getFilteredAndSortedClients() {
    const searchTerm = normalizeSearchText(clientsSearchInput?.value || "");

    const selectedStatus = clientsStatusFilter?.value || "all";

    const selectedSort = clientsSortSelect?.value || "newest";

    const filteredClients = clients.filter((client) => {
      const matchesStatus = selectedStatus === "all" || client.status === selectedStatus;

      const searchableContent = normalizeSearchText(
        [
          client.name,
          client.company_name,
          client.email,
          client.phone,
          client.website_url,
          client.notes,
        ]
          .filter(Boolean)
          .join(" ")
      );

      const matchesSearch = searchTerm === "" || searchableContent.includes(searchTerm);

      return matchesStatus && matchesSearch;
    });

    filteredClients.sort((firstClient, secondClient) => {
      if (selectedSort === "oldest") {
        return (
          new Date(firstClient.created_at).getTime() - new Date(secondClient.created_at).getTime()
        );
      }

      if (selectedSort === "name-asc") {
        return String(firstClient.name || "").localeCompare(
          String(secondClient.name || ""),
          "pt-PT"
        );
      }

      if (selectedSort === "name-desc") {
        return String(secondClient.name || "").localeCompare(
          String(firstClient.name || ""),
          "pt-PT"
        );
      }

      return (
        new Date(secondClient.created_at).getTime() - new Date(firstClient.created_at).getTime()
      );
    });

    return filteredClients;
  }

  function applyClientFilters() {
    if (clients.length === 0) {
      setClientsView("empty");
      return;
    }

    const visibleClients = getFilteredAndSortedClients();

    if (visibleClients.length === 0) {
      if (clientsGrid) {
        clientsGrid.innerHTML = "";
      }

      setClientsView("no-results");
      return;
    }

    renderClients(visibleClients);
  }

  /* ======================================================
       Marcas associadas
    ====================================================== */

  function getClientBrands(clientId) {
    return brands.filter((brand) => brand.client_id === clientId);
  }

  function renderBrandChips(clientId) {
    const associatedBrands = getClientBrands(clientId);

    if (associatedBrands.length === 0) {
      return `
                <span class="client-brand-empty">
                    Nenhuma marca associada
                </span>
            `;
    }

    return associatedBrands
      .slice(0, 3)
      .map((brand) => {
        const color = getSafeColor(brand.primary_color);

        return `
                    <span
                        class="client-brand-chip"
                        title="${escapeHtml(brand.name)}"
                    >
                        <span
                            class="client-brand-chip-color"
                            style="background-color: ${color}"
                        ></span>

                        <span>
                            ${escapeHtml(brand.name)}
                        </span>
                    </span>
                `;
      })
      .join("");
  }

  /* ======================================================
       Renderização
    ====================================================== */

  function renderClients(items = clients) {
    if (!clientsGrid) {
      return;
    }

    clientsGrid.innerHTML = "";

    items.forEach((client) => {
      const isArchived = client.status === "archived";

      const initials = getInitials(client.name);

      const notes = client.notes?.trim() || "Nenhuma observação adicionada.";

      const emailHref = getSafeMailto(client.email);

      const telephoneHref = getSafeTelephone(client.phone);

      const websiteHref = getSafeHttpUrl(client.website_url);

      const associatedBrands = getClientBrands(client.id);

      const card = document.createElement("article");

      card.className = ["client-card", isArchived ? "is-archived" : ""].filter(Boolean).join(" ");

      card.dataset.clientId = client.id;

      card.innerHTML = `
                <header class="client-card-header">

                    <div class="client-card-identity">

                        <div
                            class="client-card-avatar"
                            aria-hidden="true"
                        >
                            ${escapeHtml(initials)}
                        </div>

                        <div class="client-card-title-group">

                            <h2 class="client-card-title">
                                ${escapeHtml(client.name)}
                            </h2>

                            <span class="client-card-company">
                                ${escapeHtml(client.company_name || "Empresa não definida")}
                            </span>

                        </div>

                    </div>

                </header>

                <p class="client-card-notes ${client.notes ? "" : "is-empty"}">
                    ${escapeHtml(notes)}
                </p>

                <div class="client-card-contacts">

                    <div class="client-contact-item">
                        <i
                            data-lucide="mail"
                            aria-hidden="true"
                        ></i>

                        ${
                          emailHref
                            ? `
                                    <a href="${escapeHtml(emailHref)}">
                                        ${escapeHtml(client.email)}
                                    </a>
                                `
                            : `
                                    <span>
                                        Email não definido
                                    </span>
                                `
                        }
                    </div>

                    <div class="client-contact-item">
                        <i
                            data-lucide="phone"
                            aria-hidden="true"
                        ></i>

                        ${
                          telephoneHref
                            ? `
                                    <a href="${escapeHtml(telephoneHref)}">
                                        ${escapeHtml(client.phone)}
                                    </a>
                                `
                            : `
                                    <span>
                                        Telefone não definido
                                    </span>
                                `
                        }
                    </div>

                    <div class="client-contact-item">
                        <i
                            data-lucide="globe-2"
                            aria-hidden="true"
                        ></i>

                        ${
                          websiteHref
                            ? `
                                    <a
                                        href="${escapeHtml(websiteHref)}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        ${escapeHtml(client.website_url)}
                                    </a>
                                `
                            : `
                                    <span>
                                        Website não definido
                                    </span>
                                `
                        }
                    </div>

                </div>

                <div class="client-card-brands">

                    <div class="client-card-brands-header">

                        <span>
                            Marcas (${associatedBrands.length})
                        </span>

                        <button
                            type="button"
                            class="client-card-brands-button"
                            data-client-action="brands"
                        >
                            <i
                                data-lucide="link-2"
                                aria-hidden="true"
                            ></i>

                            Gerir
                        </button>

                    </div>

                    <div class="client-brand-chips">
                        ${renderBrandChips(client.id)}
                    </div>

                </div>

                <footer class="client-card-footer">

                    <div class="client-card-footer-info">

                        <span class="client-status ${isArchived ? "is-archived" : "is-active"}">
                            ${isArchived ? "Arquivado" : "Ativo"}
                        </span>

                        <span class="client-card-date">
                            Criado em
                            ${escapeHtml(formatClientDate(client.created_at))}
                        </span>

                    </div>

                    <div class="client-card-actions-inline">

                        <button
                            type="button"
                            class="client-action-button is-edit"
                            data-client-action="edit"
                        >
                            <i
                                data-lucide="pencil"
                                aria-hidden="true"
                            ></i>

                            Editar
                        </button>

                        <button
                            type="button"
                            class="client-action-button ${isArchived ? "is-restore" : "is-archive"}"
                            data-client-action="${isArchived ? "restore" : "archive"}"
                        >
                            <i
                                data-lucide="${isArchived ? "rotate-ccw" : "archive"}"
                                aria-hidden="true"
                            ></i>

                            ${isArchived ? "Restaurar" : "Arquivar"}
                        </button>

                    </div>

                </footer>
            `;

      clientsGrid.appendChild(card);
    });

    setClientsView("grid");

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* ======================================================
       Carregamento dos dados
    ====================================================== */

  async function loadClientsAndBrands() {
    if (!currentWorkspace?.id) {
      return;
    }

    setClientsView("loading");

    try {
      const [clientsResult, brandsResult] = await Promise.all([
        supabaseClient
          .from("clients")
          .select(
            `
                        id,
                        workspace_id,
                        created_by,
                        name,
                        company_name,
                        email,
                        phone,
                        website_url,
                        notes,
                        status,
                        created_at,
                        updated_at
                    `
          )
          .eq("workspace_id", currentWorkspace.id)
          .order("created_at", {
            ascending: false,
          }),

        supabaseClient
          .from("brands")
          .select(
            `
                        id,
                        workspace_id,
                        client_id,
                        name,
                        primary_color,
                        status
                    `
          )
          .eq("workspace_id", currentWorkspace.id)
          .order("name", {
            ascending: true,
          }),
      ]);

      if (clientsResult.error) {
        throw clientsResult.error;
      }

      if (brandsResult.error) {
        throw brandsResult.error;
      }

      clients = clientsResult.data || [];

      brands = brandsResult.data || [];

      updateClientCounters();

      if (clients.length === 0) {
        setClientsView("empty");
        return;
      }

      applyClientFilters();

      console.log("Clientes carregados:", clients.length);

      console.log("Marcas disponíveis:", brands.length);
    } catch (error) {
      console.error("Erro ao carregar Clientes:", error);

      setClientsView(null);

      showToast(
        "error",
        "Erro ao carregar clientes",
        "Não foi possível obter os clientes deste workspace."
      );
    }
  }

  /* ======================================================
    Modal do cliente
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

  function clearClientFormErrors() {
    clientNameInput?.classList.remove("is-invalid");
    clientEmailInput?.classList.remove("is-invalid");
    clientWebsiteInput?.classList.remove("is-invalid");

    if (clientNameError) {
      clientNameError.textContent = "";
    }

    if (clientEmailError) {
      clientEmailError.textContent = "";
    }

    if (clientWebsiteError) {
      clientWebsiteError.textContent = "";
    }

    if (clientFormError) {
      clientFormError.textContent = "";
      clientFormError.classList.add("hidden");
    }
  }

  function updateClientNotesCounter() {
    if (!clientNotesInput || !clientNotesCounter) {
      return;
    }

    clientNotesCounter.textContent = `${clientNotesInput.value.length}/2000`;
  }

  function resetClientForm() {
    clientForm?.reset();

    if (clientIdInput) {
      clientIdInput.value = "";
    }

    if (clientModalTitle) {
      clientModalTitle.textContent = "Novo cliente";
    }

    if (clientFormSubmitText) {
      clientFormSubmitText.textContent = "Criar cliente";
    }

    clearClientFormErrors();
    updateClientNotesCounter();
  }

  function openCreateClientModal() {
    resetClientForm();
    openModal(clientModal);

    window.setTimeout(() => {
      clientNameInput?.focus();
    }, 100);
  }

  function openEditClientModal(clientId) {
    const client = clients.find((item) => item.id === clientId);

    if (!client) {
      showToast(
        "error",
        "Cliente não encontrado",
        "Não foi possível carregar os dados do cliente."
      );

      return;
    }

    resetClientForm();

    if (clientIdInput) {
      clientIdInput.value = client.id;
    }

    if (clientNameInput) {
      clientNameInput.value = client.name || "";
    }

    if (clientCompanyInput) {
      clientCompanyInput.value = client.company_name || "";
    }

    if (clientEmailInput) {
      clientEmailInput.value = client.email || "";
    }

    if (clientPhoneInput) {
      clientPhoneInput.value = client.phone || "";
    }

    if (clientWebsiteInput) {
      clientWebsiteInput.value = client.website_url || "";
    }

    if (clientNotesInput) {
      clientNotesInput.value = client.notes || "";
    }

    if (clientModalTitle) {
      clientModalTitle.textContent = "Editar cliente";
    }

    if (clientFormSubmitText) {
      clientFormSubmitText.textContent = "Guardar alterações";
    }

    clearClientFormErrors();
    updateClientNotesCounter();
    openModal(clientModal);

    window.setTimeout(() => {
      clientNameInput?.focus();
    }, 100);
  }

  function setClientFormSubmitting(isSubmitting) {
    const isEditing = Boolean(clientIdInput?.value.trim());

    if (clientFormSubmitButton) {
      clientFormSubmitButton.disabled = isSubmitting;

      clientFormSubmitButton.setAttribute("aria-busy", String(isSubmitting));
    }

    clientFormLoader?.classList.toggle("hidden", !isSubmitting);

    if (!clientFormSubmitText) {
      return;
    }

    if (isSubmitting) {
      clientFormSubmitText.textContent = isEditing ? "A guardar..." : "A criar...";

      return;
    }

    clientFormSubmitText.textContent = isEditing ? "Guardar alterações" : "Criar cliente";
  }

  function isValidEmail(value) {
    if (!value) {
      return true;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidWebsite(value) {
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

  function validateClientForm() {
    clearClientFormErrors();

    let isValid = true;

    const name = clientNameInput?.value.trim() || "";

    const email = clientEmailInput?.value.trim() || "";

    const website = clientWebsiteInput?.value.trim() || "";

    if (name.length < 2 || name.length > 120) {
      clientNameInput?.classList.add("is-invalid");

      if (clientNameError) {
        clientNameError.textContent = "O nome deve ter entre 2 e 120 caracteres.";
      }

      isValid = false;
    }

    if (!isValidEmail(email)) {
      clientEmailInput?.classList.add("is-invalid");

      if (clientEmailError) {
        clientEmailError.textContent = "Informe um email válido.";
      }

      isValid = false;
    }

    if (!isValidWebsite(website)) {
      clientWebsiteInput?.classList.add("is-invalid");

      if (clientWebsiteError) {
        clientWebsiteError.textContent = "O website deve começar com http:// ou https://.";
      }

      isValid = false;
    }

    return isValid;
  }

  createClientButton?.addEventListener("click", openCreateClientModal);

  emptyCreateClientButton?.addEventListener("click", openCreateClientModal);

  clientModalClose?.addEventListener("click", () => {
    closeModal(clientModal);
  });

  clientFormCancel?.addEventListener("click", () => {
    closeModal(clientModal);
  });

  clientModal?.addEventListener("click", (event) => {
    if (event.target === clientModal) {
      closeModal(clientModal);
    }
  });

  clientNotesInput?.addEventListener("input", updateClientNotesCounter);

  clientNameInput?.addEventListener("input", () => {
    clientNameInput.classList.remove("is-invalid");

    if (clientNameError) {
      clientNameError.textContent = "";
    }
  });

  clientEmailInput?.addEventListener("input", () => {
    clientEmailInput.classList.remove("is-invalid");

    if (clientEmailError) {
      clientEmailError.textContent = "";
    }
  });

  clientWebsiteInput?.addEventListener("input", () => {
    clientWebsiteInput.classList.remove("is-invalid");

    if (clientWebsiteError) {
      clientWebsiteError.textContent = "";
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (clientBrandsModal && clientBrandsModal.classList.contains("is-open")) {
      closeClientBrandsModal();
      return;
    }

    if (archiveClientModal && archiveClientModal.classList.contains("is-open")) {
      closeArchiveClientModal();
      return;
    }

    if (clientModal && clientModal.classList.contains("is-open")) {
      closeModal(clientModal);
      return;
    }

    if (body.classList.contains("sidebar-open")) {
      closeSidebar();
    }
  });

  /* ======================================================
    Eventos dos cartões
    ====================================================== */

  clientsGrid?.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("[data-client-action]");

    if (!actionButton) {
      return;
    }

    const clientCard = actionButton.closest("[data-client-id]");

    const clientId = clientCard?.dataset.clientId;

    const action = actionButton.dataset.clientAction;

    if (!clientId) {
      return;
    }

    console.log("Ação do cliente:", action, clientId);

    if (action === "brands") {
      openClientBrandsModal(clientId);
      return;
    }

    if (action === "edit") {
      openEditClientModal(clientId);
      return;
    }

    if (action === "archive") {
      openArchiveClientModal(clientId);
      return;
    }

    if (action === "restore") {
      actionButton.disabled = true;

      await restoreClient(clientId);

      if (actionButton.isConnected) {
        actionButton.disabled = false;
      }
    }
  });

  clientForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateClientForm()) {
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

    const editingClientId = clientIdInput?.value.trim() || null;

    const isEditing = Boolean(editingClientId);

    setClientFormSubmitting(true);

    if (clientFormError) {
      clientFormError.textContent = "";

      clientFormError.classList.add("hidden");
    }

    const commonParameters = {
      client_name: clientNameInput.value.trim(),

      client_company_name: clientCompanyInput?.value.trim() || null,

      client_email: clientEmailInput?.value.trim() || null,

      client_phone: clientPhoneInput?.value.trim() || null,

      client_website_url: clientWebsiteInput?.value.trim() || null,

      client_notes: clientNotesInput?.value.trim() || null,
    };

    try {
      const functionName = isEditing ? "update_client" : "create_client";

      const parameters = isEditing
        ? {
            target_client_id: editingClientId,

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

      console.log(isEditing ? "Cliente atualizado:" : "Cliente criado:", data);

      closeModal(clientModal);

      await loadClientsAndBrands();

      showToast(
        "success",
        isEditing ? "Cliente atualizado" : "Cliente criado",
        isEditing
          ? "As alterações foram guardadas com sucesso."
          : "O novo cliente foi adicionado ao workspace."
      );
    } catch (error) {
      console.error(isEditing ? "Erro ao atualizar cliente:" : "Erro ao criar cliente:", error);

      const message =
        error?.message ||
        (isEditing ? "Não foi possível atualizar o cliente." : "Não foi possível criar o cliente.");

      if (clientFormError) {
        clientFormError.textContent = message;

        clientFormError.classList.remove("hidden");
      }

      showToast(
        "error",
        isEditing ? "Erro ao atualizar cliente" : "Erro ao criar cliente",
        message
      );
    } finally {
      setClientFormSubmitting(false);
    }
  });

  archiveClientCancel?.addEventListener("click", closeArchiveClientModal);

  archiveClientModal?.addEventListener("click", (event) => {
    if (event.target === archiveClientModal) {
      closeArchiveClientModal();
    }
  });

  archiveClientConfirm?.addEventListener("click", async () => {
    if (!selectedClientId) {
      return;
    }

    await archiveClient(selectedClientId);
  });

  /* ======================================================
    Gerir marcas do cliente
    ====================================================== */

  function setClientBrandsView(view) {
    clientBrandsLoading?.classList.toggle("hidden", view !== "loading");

    clientBrandsEmpty?.classList.toggle("hidden", view !== "empty");

    clientBrandsList?.classList.toggle("hidden", view !== "list");
  }

  function getBrandClientName(clientId) {
    if (!clientId) {
      return null;
    }

    const client = clients.find((item) => item.id === clientId);

    return client?.name || null;
  }

  function renderClientBrandOptions(clientId) {
    if (!clientBrandsList) {
      return;
    }

    clientBrandsList.innerHTML = "";

    if (brands.length === 0) {
      setClientBrandsView("empty");
      return;
    }

    brands.forEach((brand) => {
      const isAssignedToCurrentClient = brand.client_id === clientId;

      const assignedClientName = getBrandClientName(brand.client_id);

      const color = getSafeColor(brand.primary_color);

      let relationshipText = "Disponível para associação";

      if (isAssignedToCurrentClient) {
        relationshipText = "Associada a este cliente";
      } else if (assignedClientName) {
        relationshipText = `Associada a ${assignedClientName}`;
      }

      if (brand.status === "archived") {
        relationshipText += " · Arquivada";
      }

      const label = document.createElement("label");

      label.className = "client-brand-option";

      label.innerHTML = `
                <input
                    type="checkbox"
                    data-brand-id="${escapeHtml(brand.id)}"
                    ${isAssignedToCurrentClient ? "checked" : ""}
                >

                <span
                    class="client-brand-option-color"
                    style="background-color: ${color}"
                    aria-hidden="true"
                ></span>

                <span class="client-brand-option-content">

                    <strong>
                        ${escapeHtml(brand.name)}
                    </strong>

                    <span>
                        ${escapeHtml(relationshipText)}
                    </span>

                </span>
            `;

      clientBrandsList.appendChild(label);
    });

    setClientBrandsView("list");
  }

  function openClientBrandsModal(clientId) {
    const client = clients.find((item) => item.id === clientId);

    if (!client) {
      showToast(
        "error",
        "Cliente não encontrado",
        "Não foi possível carregar as marcas deste cliente."
      );

      return;
    }

    selectedBrandsClientId = clientId;

    if (clientBrandsClientName) {
      clientBrandsClientName.textContent = client.name;
    }

    setClientBrandsView("loading");
    openModal(clientBrandsModal);

    renderClientBrandOptions(clientId);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function closeClientBrandsModal() {
    closeModal(clientBrandsModal);

    selectedBrandsClientId = null;

    if (clientBrandsList) {
      clientBrandsList.innerHTML = "";
    }
  }

  function setClientBrandsSubmitting(isSubmitting) {
    if (!clientBrandsSave) {
      return;
    }

    clientBrandsSave.disabled = isSubmitting;

    clientBrandsSave.setAttribute("aria-busy", String(isSubmitting));

    clientBrandsSave.textContent = isSubmitting ? "A guardar..." : "Guardar associações";
  }

  async function saveClientBrandAssociations() {
    if (!selectedBrandsClientId || !clientBrandsList) {
      return;
    }

    const selectedBrandIds = Array.from(
      clientBrandsList.querySelectorAll("input[data-brand-id]:checked")
    ).map((input) => input.dataset.brandId);

    const currentBrandIds = brands
      .filter((brand) => brand.client_id === selectedBrandsClientId)
      .map((brand) => brand.id);

    const brandsToAssign = selectedBrandIds.filter((brandId) => !currentBrandIds.includes(brandId));

    const brandsToRemove = currentBrandIds.filter((brandId) => !selectedBrandIds.includes(brandId));

    if (brandsToAssign.length === 0 && brandsToRemove.length === 0) {
      showToast("info", "Nenhuma alteração", "As associações das marcas continuam iguais.");

      return;
    }

    setClientBrandsSubmitting(true);

    try {
      for (const brandId of brandsToRemove) {
        const { error } = await supabaseClient.rpc("remove_brand_from_client", {
          target_brand_id: brandId,
        });

        if (error) {
          throw error;
        }
      }

      for (const brandId of brandsToAssign) {
        const { error } = await supabaseClient.rpc("assign_brand_to_client", {
          target_brand_id: brandId,

          target_client_id: selectedBrandsClientId,
        });

        if (error) {
          throw error;
        }
      }

      console.log("Associações atualizadas:", {
        clientId: selectedBrandsClientId,

        assigned: brandsToAssign,

        removed: brandsToRemove,
      });

      closeClientBrandsModal();

      await loadClientsAndBrands();

      showToast("success", "Marcas atualizadas", "As associações do cliente foram guardadas.");
    } catch (error) {
      console.error("Erro ao atualizar marcas do cliente:", error);

      await loadClientsAndBrands();

      showToast(
        "error",
        "Erro ao guardar marcas",
        error?.message || "Não foi possível atualizar as associações."
      );
    } finally {
      setClientBrandsSubmitting(false);
    }
  }

  clientBrandsModalClose?.addEventListener("click", closeClientBrandsModal);

  clientBrandsCancel?.addEventListener("click", closeClientBrandsModal);

  clientBrandsModal?.addEventListener("click", (event) => {
    if (event.target === clientBrandsModal) {
      closeClientBrandsModal();
    }
  });

  clientBrandsSave?.addEventListener("click", saveClientBrandAssociations);

  /* ======================================================
    Arquivar e restaurar clientes
    ====================================================== */

  function openArchiveClientModal(clientId) {
    if (!archiveClientModal) {
      console.error('Elemento com id="archive-client-modal" não encontrado.');

      return;
    }

    selectedClientId = clientId;

    openModal(archiveClientModal);
  }

  function closeArchiveClientModal() {
    closeModal(archiveClientModal);

    selectedClientId = null;
  }

  function setArchiveClientSubmitting(isSubmitting) {
    if (!archiveClientConfirm) {
      return;
    }

    archiveClientConfirm.disabled = isSubmitting;

    archiveClientConfirm.setAttribute("aria-busy", String(isSubmitting));

    archiveClientConfirm.textContent = isSubmitting ? "A arquivar..." : "Arquivar cliente";
  }

  async function archiveClient(clientId) {
    setArchiveClientSubmitting(true);

    try {
      const { data, error } = await supabaseClient.rpc("archive_client", {
        target_client_id: clientId,
      });

      if (error) {
        throw error;
      }

      console.log("Cliente arquivado:", data);

      closeArchiveClientModal();

      await loadClientsAndBrands();

      showToast("success", "Cliente arquivado", "O cliente foi arquivado com sucesso.");
    } catch (error) {
      console.error("Erro ao arquivar cliente:", error);

      showToast(
        "error",
        "Erro ao arquivar cliente",
        error?.message || "Não foi possível arquivar o cliente."
      );
    } finally {
      setArchiveClientSubmitting(false);
    }
  }

  async function restoreClient(clientId) {
    try {
      const { data, error } = await supabaseClient.rpc("restore_client", {
        target_client_id: clientId,
      });

      if (error) {
        throw error;
      }

      console.log("Cliente restaurado:", data);

      await loadClientsAndBrands();

      showToast("success", "Cliente restaurado", "O cliente voltou a ficar ativo.");
    } catch (error) {
      console.error("Erro ao restaurar cliente:", error);

      showToast(
        "error",
        "Erro ao restaurar cliente",
        error?.message || "Não foi possível restaurar o cliente."
      );
    }
  }

  /* ======================================================
       Sidebar
    ====================================================== */

  function openSidebar() {
    body.classList.add("sidebar-open");

    sidebarOpenButton?.setAttribute("aria-expanded", "true");
  }

  function closeSidebar() {
    body.classList.remove("sidebar-open");

    sidebarOpenButton?.setAttribute("aria-expanded", "false");
  }

  sidebarOpenButton?.addEventListener("click", openSidebar);

  sidebarCloseButton?.addEventListener("click", closeSidebar);

  sidebarOverlay?.addEventListener("click", closeSidebar);

  /* ======================================================
       Pesquisa e filtros
    ====================================================== */

  clientsSearchInput?.addEventListener("input", applyClientFilters);

  clientsStatusFilter?.addEventListener("change", applyClientFilters);

  clientsSortSelect?.addEventListener("change", applyClientFilters);

  clearClientFiltersButton?.addEventListener("click", () => {
    if (clientsSearchInput) {
      clientsSearchInput.value = "";
    }

    if (clientsStatusFilter) {
      clientsStatusFilter.value = "all";
    }

    if (clientsSortSelect) {
      clientsSortSelect.value = "newest";
    }

    applyClientFilters();

    showToast("info", "Filtros removidos", "A pesquisa e os filtros foram redefinidos.");
  });

  /* ======================================================
       Inicialização
    ====================================================== */

  try {
    const contextLoaded = await initializeWorkspaceContext();

    if (contextLoaded) {
      await loadClientsAndBrands();
    }
  } catch (error) {
    console.error("Erro ao inicializar Clientes:", error);

    setClientsView(null);

    showToast(
      "error",
      "Erro ao iniciar página",
      error?.message || "Não foi possível iniciar a página de clientes."
    );
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
});

"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const supabaseClient = window.supabaseClient;
  const body = document.body;

  const $ = (id) => document.getElementById(id);

  /* ======================================================
       Elementos gerais
    ====================================================== */

  const currentWorkspaceName = $("current-workspace-name");
  const sidebarUserName = $("sidebar-user-name");
  const sidebarUserEmail = $("sidebar-user-email");
  const sidebarUserAvatar = $("sidebar-user-avatar");
  const topbarAvatar = $("topbar-avatar");

  const sidebarOpenButton = $("topbar-menu-button");
  const sidebarCloseButton = $("sidebar-close");
  const sidebarOverlay = $("sidebar-overlay");

  const toastContainer = $("toast-container");

  /* ======================================================
       Biblioteca
    ====================================================== */

  const mediaLoading = $("media-loading");
  const mediaEmpty = $("media-empty");
  const mediaNoResults = $("media-no-results");
  const mediaAssetsGrid = $("media-assets-grid");

  const mediaFoldersGrid = $("media-folders-grid");
  const mediaFoldersEmpty = $("media-folders-empty");

  const mediaTotalCount = $("media-total-count");
  const mediaImageCount = $("media-image-count");
  const mediaVideoCount = $("media-video-count");
  const mediaStorageCount = $("media-storage-count");

  const mediaSearchInput = $("media-search-input");
  const mediaBrandFilter = $("media-brand-filter");
  const mediaFolderFilter = $("media-folder-filter");
  const mediaTypeFilter = $("media-type-filter");
  const mediaStatusFilter = $("media-status-filter");

  const clearMediaFiltersButton = $("clear-media-filters-button");

  const mediaGridViewButton = $("media-grid-view-button");
  const mediaListViewButton = $("media-list-view-button");

  const uploadMediaButton = $("upload-media-button");
  const emptyUploadMediaButton = $("empty-upload-media-button");
  const createFolderButton = $("create-folder-button");
  const toggleArchivedFoldersButton = $("toggle-archived-folders-button");

  /* ======================================================
       Upload
    ====================================================== */

  const uploadMediaModal = $("upload-media-modal");
  const uploadMediaModalClose = $("upload-media-modal-close");
  const uploadMediaCancel = $("upload-media-cancel");
  const uploadMediaForm = $("upload-media-form");
  const uploadMediaSubmit = $("upload-media-submit");
  const uploadMediaSubmitText = $("upload-media-submit-text");

  const mediaDropzone = $("media-dropzone");
  const mediaFileInput = $("media-file-input");
  const mediaUploadFiles = $("media-upload-files");

  const uploadMediaBrand = $("upload-media-brand");
  const uploadMediaFolder = $("upload-media-folder");
  const uploadMediaDisplayName = $("upload-media-display-name");
  const uploadMediaError = $("upload-media-error");

  /* ======================================================
       Pastas
    ====================================================== */

  const createFolderModal = $("create-folder-modal");
  const createFolderModalClose = $("create-folder-modal-close");
  const createFolderCancel = $("create-folder-cancel");
  const createFolderForm = $("create-folder-form");
  const createFolderSubmit = $("create-folder-submit");
  const createFolderSubmitText = $("create-folder-submit-text");

  const createFolderName = $("create-folder-name");
  const createFolderNameError = $("create-folder-name-error");
  const createFolderBrand = $("create-folder-brand");
  const createFolderParent = $("create-folder-parent");
  const createFolderError = $("create-folder-error");

  /* ======================================================
       Detalhes
    ====================================================== */

  const mediaDetailsModal = $("media-details-modal");
  const mediaDetailsClose = $("media-details-close");
  const mediaDetailsTitle = $("media-details-title");
  const mediaDetailsPreview = $("media-details-preview");
  const mediaDetailsStatus = $("media-details-status");
  const mediaDetailsType = $("media-details-type");

  const mediaDetailsName = $("media-details-name");
  const mediaDetailsFolder = $("media-details-folder");
  const mediaDetailsAltText = $("media-details-alt-text");
  const mediaDetailsCaption = $("media-details-caption");

  const mediaDetailsBrand = $("media-details-brand");
  const mediaDetailsFormat = $("media-details-format");
  const mediaDetailsSize = $("media-details-size");
  const mediaDetailsDimensions = $("media-details-dimensions");
  const mediaDetailsCreatedAt = $("media-details-created-at");
  const mediaDetailsOriginalName = $("media-details-original-name");

  const mediaDetailsError = $("media-details-error");
  const mediaDetailsDownload = $("media-details-download");
  const mediaDetailsArchive = $("media-details-archive");
  const mediaDetailsRestore = $("media-details-restore");
  const mediaDetailsSave = $("media-details-save");

  /* ======================================================
       Confirmação
    ====================================================== */

  const mediaConfirmModal = $("media-confirm-modal");
  const mediaConfirmTitle = $("media-confirm-title");
  const mediaConfirmDescription = $("media-confirm-description");
  const mediaConfirmCancel = $("media-confirm-cancel");
  const mediaConfirmSubmit = $("media-confirm-submit");

  /* ======================================================
       Estado
    ====================================================== */

  let currentUser = null;
  let currentWorkspace = null;

  let brands = [];
  let folders = [];
  let assets = [];

  let selectedFiles = [];
  let selectedAssetId = null;
  let confirmationAction = null;

  let showArchivedFolders = false;
  let currentView = "grid";

  const signedUrls = new Map();

  const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/x-m4a",
    "application/pdf",
  ]);

  const maximumFileSize = 262144000;

  const statusLabels = {
    pending_upload: "Upload pendente",
    processing: "Em processamento",
    ready: "Pronto",
    failed: "Com erro",
    archived: "Arquivado",
  };

  const mediaTypeLabels = {
    image: "Imagem",
    video: "Vídeo",
    audio: "Áudio",
    document: "Documento",
  };

  const mediaTypeIcons = {
    image: "image",
    video: "video",
    audio: "music",
    document: "file-text",
  };

  /* ======================================================
       Utilitários
    ====================================================== */

  function escapeHtml(value = "") {
    const element = document.createElement("div");

    element.textContent = String(value);

    return element.innerHTML;
  }

  function normalizeText(value = "") {
    return String(value)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function formatBytes(bytes = 0) {
    const value = Number(bytes) || 0;

    if (value === 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.floor(Math.log(value) / Math.log(1024));

    return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function getBrandById(id) {
    return brands.find((brand) => brand.id === id) || null;
  }

  function getFolderById(id) {
    return folders.find((folder) => folder.id === id) || null;
  }

  function getAssetById(id) {
    return assets.find((asset) => asset.id === id) || null;
  }

  function getFileIconFromMime(mimeType = "") {
    if (mimeType.startsWith("image/")) {
      return "image";
    }

    if (mimeType.startsWith("video/")) {
      return "video";
    }

    if (mimeType.startsWith("audio/")) {
      return "music";
    }

    return "file-text";
  }

  function getDimensionsText(asset) {
    if (asset.width && asset.height) {
      return `${asset.width} × ${asset.height}px`;
    }

    if (asset.duration_ms) {
      const seconds = Math.round(asset.duration_ms / 1000);

      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    }

    return "Não disponível";
  }

  /* ======================================================
       Toast
    ====================================================== */

  function showToast(type, title, message) {
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
                <i data-lucide="${icons[type] || icons.info}"></i>
            </div>

            <div class="toast-content">
                <strong>${escapeHtml(title)}</strong>
                <p>${escapeHtml(message)}</p>
            </div>

            <button
                class="toast-close"
                type="button"
                aria-label="Fechar"
            >
                <i data-lucide="x"></i>
            </button>
        `;

    toastContainer.appendChild(toast);

    toast.querySelector(".toast-close")?.addEventListener("click", () => toast.remove());

    window.lucide?.createIcons();

    window.setTimeout(() => toast.remove(), 5000);
  }

  /* ======================================================
       Modais
    ====================================================== */

  function openModal(modal) {
    if (!modal) {
      return;
    }

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");

    body.classList.add("modal-open");
  }

  function closeModal(modal) {
    if (!modal) {
      return;
    }

    if (modal.contains(document.activeElement)) {
      document.activeElement?.blur();
    }

    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");

    const openModalElement = document.querySelector(".media-modal-overlay:not(.hidden)");

    if (!openModalElement) {
      body.classList.remove("modal-open");
    }
  }

  /* ======================================================
       Perfil e workspace
    ====================================================== */

  async function loadUserProfile(userId) {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Erro ao carregar perfil:", error.message);

      return null;
    }

    return data;
  }

  async function loadCurrentWorkspace(userId) {
    const { data: membership, error: membershipError } = await supabaseClient
      .from("workspace_members")
      .select("workspace_id, role, status, created_at")
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

  function updateIdentity(user, profile, workspace) {
    const fullName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Utilizador";

    const email = user.email || "Email não disponível";
    const avatarLetter = fullName.charAt(0).toUpperCase();

    currentWorkspaceName.textContent = workspace.name;
    sidebarUserName.textContent = fullName;
    sidebarUserEmail.textContent = email;
    sidebarUserAvatar.textContent = avatarLetter;
    topbarAvatar.textContent = avatarLetter;
  }

  async function initializeContext() {
    if (!supabaseClient) {
      throw new Error("Cliente Supabase não encontrado.");
    }

    const user = await window.studioVAuthReady;

    if (!user) {
      return false;
    }

    currentUser = user;

    const [profile, workspace] = await Promise.all([
      loadUserProfile(user.id),
      loadCurrentWorkspace(user.id),
    ]);

    currentWorkspace = workspace;

    updateIdentity(user, profile, workspace);

    return true;
  }

  /* ======================================================
       Carregamento
    ====================================================== */

  function setLoading(isLoading) {
    mediaLoading.classList.toggle("hidden", !isLoading);

    if (isLoading) {
      mediaAssetsGrid.classList.add("hidden");
      mediaEmpty.classList.add("hidden");
      mediaNoResults.classList.add("hidden");
    }
  }

  async function createAssetSignedUrl(asset) {
    if (asset.status !== "ready") {
      return null;
    }

    const { data, error } = await supabaseClient.storage
      .from(asset.bucket_id)
      .createSignedUrl(asset.object_path, 3600);

    if (error) {
      console.warn(`Não foi possível gerar URL para ${asset.display_name}:`, error.message);

      return null;
    }

    return data?.signedUrl || null;
  }

  async function hydrateSignedUrls() {
    signedUrls.clear();

    const readyAssets = assets.filter((asset) => asset.status === "ready");

    await Promise.all(
      readyAssets.map(async (asset) => {
        const url = await createAssetSignedUrl(asset);

        if (url) {
          signedUrls.set(asset.id, url);
        }
      })
    );
  }

  async function loadMediaData() {
    if (!currentWorkspace?.id) {
      return;
    }

    setLoading(true);

    try {
      const [brandsResult, foldersResult, assetsResult] = await Promise.all([
        supabaseClient
          .from("brands")
          .select("id, name, primary_color, status")
          .eq("workspace_id", currentWorkspace.id)
          .order("name", {
            ascending: true,
          }),

        supabaseClient
          .from("media_folders")
          .select("*")
          .eq("workspace_id", currentWorkspace.id)
          .order("name", {
            ascending: true,
          }),

        supabaseClient
          .from("media_assets")
          .select("*")
          .eq("workspace_id", currentWorkspace.id)
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (brandsResult.error) {
        throw brandsResult.error;
      }

      if (foldersResult.error) {
        throw foldersResult.error;
      }

      if (assetsResult.error) {
        throw assetsResult.error;
      }

      brands = brandsResult.data || [];
      folders = foldersResult.data || [];
      assets = assetsResult.data || [];

      await hydrateSignedUrls();

      populateAllSelects();
      updateSummary();
      renderFolders();
      renderAssets();
    } catch (error) {
      console.error("Erro ao carregar Biblioteca:", error);

      showToast(
        "error",
        "Erro ao carregar Biblioteca",
        error?.message || "Não foi possível carregar os ficheiros."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ======================================================
       Selects
    ====================================================== */

  function appendOption(select, value, label) {
    const option = document.createElement("option");

    option.value = value;
    option.textContent = label;

    select.appendChild(option);
  }

  function populateBrandSelect(select, firstLabel, firstValue) {
    const previousValue = select.value;

    select.innerHTML = "";

    appendOption(select, firstValue, firstLabel);

    brands
      .filter((brand) => brand.status === "active")
      .forEach((brand) => {
        appendOption(select, brand.id, brand.name);
      });

    if (Array.from(select.options).some((option) => option.value === previousValue)) {
      select.value = previousValue;
    }
  }

  function populateFolderSelect(select, brandId, firstLabel, firstValue, includeArchived = false) {
    const previousValue = select.value;

    select.innerHTML = "";

    appendOption(select, firstValue, firstLabel);

    folders
      .filter((folder) => {
        const correctBrand = (folder.brand_id || "") === (brandId || "");

        const correctStatus = includeArchived || folder.status === "active";

        return correctBrand && correctStatus;
      })
      .forEach((folder) => {
        appendOption(select, folder.id, folder.name);
      });

    if (Array.from(select.options).some((option) => option.value === previousValue)) {
      select.value = previousValue;
    }
  }

  function populateFilterFolders() {
    const previousValue = mediaFolderFilter.value;

    mediaFolderFilter.innerHTML = "";

    appendOption(mediaFolderFilter, "all", "Todas as pastas");

    appendOption(mediaFolderFilter, "none", "Sem pasta");

    folders
      .filter((folder) => folder.status === "active")
      .forEach((folder) => {
        appendOption(mediaFolderFilter, folder.id, folder.name);
      });

    if (Array.from(mediaFolderFilter.options).some((option) => option.value === previousValue)) {
      mediaFolderFilter.value = previousValue;
    }
  }

  function populateAllSelects() {
    populateBrandSelect(mediaBrandFilter, "Todas as marcas", "all");

    populateBrandSelect(uploadMediaBrand, "Ficheiro partilhado", "");

    populateBrandSelect(createFolderBrand, "Pasta partilhada", "");

    populateFilterFolders();

    populateFolderSelect(uploadMediaFolder, uploadMediaBrand.value, "Sem pasta", "");

    populateFolderSelect(createFolderParent, createFolderBrand.value, "Nenhuma", "");
  }

  /* ======================================================
       Resumo
    ====================================================== */

  function updateSummary() {
    const activeAssets = assets.filter((asset) => asset.status !== "archived");

    const images = activeAssets.filter((asset) => asset.media_type === "image");

    const videos = activeAssets.filter((asset) => asset.media_type === "video");

    const usedStorage = activeAssets
      .filter((asset) => asset.status === "ready")
      .reduce((total, asset) => total + Number(asset.file_size || 0), 0);

    mediaTotalCount.textContent = String(activeAssets.length);
    mediaImageCount.textContent = String(images.length);
    mediaVideoCount.textContent = String(videos.length);
    mediaStorageCount.textContent = formatBytes(usedStorage);
  }

  /* ======================================================
       Pastas
    ====================================================== */

  function renderFolders() {
    mediaFoldersGrid.innerHTML = "";

    const visibleFolders = folders.filter((folder) =>
      showArchivedFolders ? folder.status === "archived" : folder.status === "active"
    );

    mediaFoldersEmpty.classList.toggle("hidden", visibleFolders.length > 0);

    visibleFolders.forEach((folder) => {
      const brand = getBrandById(folder.brand_id);

      const assetCount = assets.filter(
        (asset) => asset.folder_id === folder.id && asset.status !== "archived"
      ).length;

      const card = document.createElement("article");

      card.className = [
        "media-folder-card",
        folder.status === "archived" ? "is-archived" : "",
        mediaFolderFilter.value === folder.id ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ");

      card.dataset.folderId = folder.id;

      card.innerHTML = `
                <div class="media-folder-icon">
                    <i data-lucide="${
                      folder.status === "archived" ? "folder-archive" : "folder"
                    }"></i>
                </div>

                <div class="media-folder-content">
                    <strong>
                        ${escapeHtml(folder.name)}
                    </strong>

                    <span>
                        ${brand ? escapeHtml(brand.name) : "Partilhada"}
                        · ${assetCount} ficheiro${assetCount === 1 ? "" : "s"}
                    </span>
                </div>

                <button
                    class="media-folder-action"
                    type="button"
                    data-folder-action="${folder.status === "archived" ? "restore" : "archive"}"
                    data-folder-id="${folder.id}"
                    aria-label="${
                      folder.status === "archived" ? "Restaurar pasta" : "Arquivar pasta"
                    }"
                >
                    <i data-lucide="${folder.status === "archived" ? "rotate-ccw" : "archive"}"></i>
                </button>
            `;

      mediaFoldersGrid.appendChild(card);
    });

    toggleArchivedFoldersButton.innerHTML = `
            <i data-lucide="${showArchivedFolders ? "folder" : "archive"}"></i>

            ${showArchivedFolders ? "Ver pastas ativas" : "Ver pastas arquivadas"}
        `;

    window.lucide?.createIcons();
  }

  /* ======================================================
       Filtros
    ====================================================== */

  function hasActiveFilters() {
    return Boolean(
      mediaSearchInput.value.trim() ||
      mediaBrandFilter.value !== "all" ||
      mediaFolderFilter.value !== "all" ||
      mediaTypeFilter.value !== "all" ||
      mediaStatusFilter.value !== "all"
    );
  }

  function getFilteredAssets() {
    const search = normalizeText(mediaSearchInput.value);
    const brand = mediaBrandFilter.value;
    const folder = mediaFolderFilter.value;
    const type = mediaTypeFilter.value;
    const status = mediaStatusFilter.value;

    return assets.filter((asset) => {
      if (status === "all" && asset.status === "archived") {
        return false;
      }

      const searchable = normalizeText(
        [
          asset.display_name,
          asset.original_name,
          asset.alt_text,
          asset.caption,
          asset.mime_type,
          asset.media_type,
        ]
          .filter(Boolean)
          .join(" ")
      );

      const matchesSearch = !search || searchable.includes(search);

      const matchesBrand = brand === "all" || asset.brand_id === brand;

      const matchesFolder =
        folder === "all" || (folder === "none" ? !asset.folder_id : asset.folder_id === folder);

      const matchesType = type === "all" || asset.media_type === type;

      const matchesStatus = status === "all" || asset.status === status;

      return matchesSearch && matchesBrand && matchesFolder && matchesType && matchesStatus;
    });
  }

  /* ======================================================
       Cards
    ====================================================== */

  function createAssetPreview(asset) {
    const signedUrl = signedUrls.get(asset.id);

    if (asset.media_type === "image" && signedUrl) {
      return `
                <img
                    src="${escapeHtml(signedUrl)}"
                    alt="${escapeHtml(asset.alt_text || asset.display_name)}"
                    loading="lazy"
                >
            `;
    }

    return `
            <i data-lucide="${mediaTypeIcons[asset.media_type] || "file"}"></i>
        `;
  }

  function renderAssets() {
    const filteredAssets = getFilteredAssets();

    mediaAssetsGrid.innerHTML = "";

    mediaEmpty.classList.toggle("hidden", assets.length > 0);

    mediaNoResults.classList.toggle(
      "hidden",
      !(assets.length > 0 && filteredAssets.length === 0 && hasActiveFilters())
    );

    mediaAssetsGrid.classList.toggle("hidden", filteredAssets.length === 0);

    mediaAssetsGrid.classList.toggle("is-list", currentView === "list");

    filteredAssets.forEach((asset) => {
      const brand = getBrandById(asset.brand_id);
      const folder = getFolderById(asset.folder_id);

      const card = document.createElement("article");

      card.className = "media-asset-card";
      card.dataset.assetId = asset.id;

      card.innerHTML = `
                <div class="media-asset-preview">

                    ${createAssetPreview(asset)}

                    <span class="media-asset-preview-status">
                        ${statusLabels[asset.status] || asset.status}
                    </span>

                </div>

                <div class="media-asset-content">

                    <h3>
                        ${escapeHtml(asset.display_name)}
                    </h3>

                    <p>
                        ${folder ? escapeHtml(folder.name) : "Sem pasta"}
                        ·
                        ${brand ? escapeHtml(brand.name) : "Partilhado"}
                    </p>

                    <div class="media-asset-meta">

                        <span>
                            ${escapeHtml(mediaTypeLabels[asset.media_type] || asset.media_type)}
                        </span>

                        <span>
                            ${formatBytes(asset.file_size)}
                        </span>

                    </div>

                </div>
            `;

      mediaAssetsGrid.appendChild(card);
    });

    window.lucide?.createIcons();
  }

  /* ======================================================
       Upload
    ====================================================== */

  function resetUploadForm() {
    uploadMediaForm.reset();

    selectedFiles = [];

    uploadMediaError.textContent = "";
    uploadMediaError.classList.add("hidden");

    mediaUploadFiles.innerHTML = "";
    mediaUploadFiles.classList.add("hidden");

    uploadMediaDisplayName.disabled = false;

    populateFolderSelect(uploadMediaFolder, "", "Sem pasta", "");

    renderSelectedFiles();
  }

  function openUploadModal() {
    resetUploadForm();

    openModal(uploadMediaModal);
  }

  function closeUploadModal() {
    closeModal(uploadMediaModal);

    resetUploadForm();
  }

  function validateFiles(files) {
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach((file) => {
      if (!allowedMimeTypes.has(file.type)) {
        errors.push(`${file.name}: formato não suportado.`);

        return;
      }

      if (file.size < 1 || file.size > maximumFileSize) {
        errors.push(`${file.name}: o ficheiro deve ter no máximo 250 MiB.`);

        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      showToast("warning", "Alguns ficheiros foram ignorados", errors.join(" "));
    }

    return validFiles;
  }

  function addSelectedFiles(files) {
    const validFiles = validateFiles(files);

    validFiles.forEach((file) => {
      const alreadySelected = selectedFiles.some(
        (selected) =>
          selected.name === file.name &&
          selected.size === file.size &&
          selected.lastModified === file.lastModified
      );

      if (!alreadySelected) {
        selectedFiles.push(file);
      }
    });

    renderSelectedFiles();
  }

  function renderSelectedFiles() {
    mediaUploadFiles.innerHTML = "";

    mediaUploadFiles.classList.toggle("hidden", selectedFiles.length === 0);

    uploadMediaDisplayName.disabled = selectedFiles.length !== 1;

    if (selectedFiles.length !== 1) {
      uploadMediaDisplayName.value = "";
    }

    selectedFiles.forEach((file, index) => {
      const row = document.createElement("div");

      row.className = "media-upload-file";
      row.dataset.uploadIndex = String(index);

      row.innerHTML = `
                <div class="media-upload-file-icon">
                    <i data-lucide="${getFileIconFromMime(file.type)}"></i>
                </div>

                <div class="media-upload-file-content">
                    <strong>${escapeHtml(file.name)}</strong>
                    <span>${formatBytes(file.size)}</span>
                </div>

                <span
                    class="media-upload-file-status"
                    data-upload-status="${index}"
                >
                    Pronto
                </span>

                <button
                    class="media-upload-file-remove"
                    type="button"
                    data-remove-upload="${index}"
                    aria-label="Remover ficheiro"
                >
                    <i data-lucide="x"></i>
                </button>
            `;

      mediaUploadFiles.appendChild(row);
    });

    window.lucide?.createIcons();
  }

  function updateUploadFileStatus(index, status, type = "") {
    const element = document.querySelector(`[data-upload-status="${index}"]`);

    if (!element) {
      return;
    }

    element.textContent = status;

    element.className = ["media-upload-file-status", type ? `is-${type}` : ""]
      .filter(Boolean)
      .join(" ");
  }

  async function uploadSingleFile(file, index) {
    updateUploadFileStatus(index, "A preparar...");

    const displayName =
      selectedFiles.length === 1 && uploadMediaDisplayName.value.trim()
        ? uploadMediaDisplayName.value.trim()
        : file.name;

    const { data: preparedData, error: prepareError } = await supabaseClient.rpc(
      "prepare_media_upload",
      {
        target_workspace_id: currentWorkspace.id,

        original_file_name: file.name,

        mime_type_value: file.type,

        file_size_value: file.size,

        target_brand_id: uploadMediaBrand.value || null,

        target_folder_id: uploadMediaFolder.value || null,

        display_name_value: displayName,

        source_value: "upload",
      }
    );

    if (prepareError) {
      throw prepareError;
    }

    const preparedAsset = Array.isArray(preparedData) ? preparedData[0] : preparedData;

    if (!preparedAsset?.id || !preparedAsset?.object_path) {
      throw new Error("O Supabase não retornou os dados do upload.");
    }

    updateUploadFileStatus(index, "A enviar...");

    const { error: storageError } = await supabaseClient.storage
      .from(preparedAsset.bucket_id)
      .upload(preparedAsset.object_path, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      });

    if (storageError) {
      throw storageError;
    }

    updateUploadFileStatus(index, "A concluir...");

    const { error: completeError } = await supabaseClient.rpc("complete_media_upload", {
      target_asset_id: preparedAsset.id,
    });

    if (completeError) {
      throw completeError;
    }

    updateUploadFileStatus(index, "Concluído", "success");
  }

  /* ======================================================
       Pastas
    ====================================================== */

  function resetCreateFolderForm() {
    createFolderForm.reset();

    createFolderNameError.textContent = "";
    createFolderError.textContent = "";
    createFolderError.classList.add("hidden");

    populateFolderSelect(createFolderParent, "", "Nenhuma", "");
  }

  function openCreateFolderModal() {
    resetCreateFolderForm();

    openModal(createFolderModal);

    window.setTimeout(() => createFolderName.focus(), 100);
  }

  function closeCreateFolderModal() {
    closeModal(createFolderModal);

    resetCreateFolderForm();
  }

  async function restoreFolder(folderId) {
    try {
      const { error } = await supabaseClient.rpc("restore_media_folder", {
        target_folder_id: folderId,
      });

      if (error) {
        throw error;
      }

      await loadMediaData();

      showToast("success", "Pasta restaurada", "A pasta voltou para a Biblioteca.");
    } catch (error) {
      console.error("Erro ao restaurar pasta:", error);

      showToast(
        "error",
        "Erro ao restaurar pasta",
        error?.message || "Não foi possível restaurar a pasta."
      );
    }
  }

  /* ======================================================
       Detalhes
    ====================================================== */

  function renderDetailsPreview(asset) {
    const signedUrl = signedUrls.get(asset.id);

    if (asset.status !== "ready" || !signedUrl) {
      mediaDetailsPreview.innerHTML = `
                <div class="media-details-preview-message">

                    <i data-lucide="${mediaTypeIcons[asset.media_type] || "file"}"></i>

                    <span>
                        ${
                          asset.status === "pending_upload"
                            ? "O upload deste ficheiro ainda não foi concluído."
                            : "Pré-visualização indisponível."
                        }
                    </span>

                </div>
            `;

      window.lucide?.createIcons();

      return;
    }

    if (asset.media_type === "image") {
      mediaDetailsPreview.innerHTML = `
                <img
                    src="${escapeHtml(signedUrl)}"
                    alt="${escapeHtml(asset.alt_text || asset.display_name)}"
                >
            `;

      return;
    }

    if (asset.media_type === "video") {
      mediaDetailsPreview.innerHTML = `
                <video
                    src="${escapeHtml(signedUrl)}"
                    controls
                    preload="metadata"
                ></video>
            `;

      return;
    }

    if (asset.media_type === "audio") {
      mediaDetailsPreview.innerHTML = `
                <audio
                    src="${escapeHtml(signedUrl)}"
                    controls
                ></audio>
            `;

      return;
    }

    if (asset.media_type === "document" && asset.mime_type === "application/pdf") {
      mediaDetailsPreview.innerHTML = `
                <iframe
                    src="${escapeHtml(signedUrl)}"
                    title="${escapeHtml(asset.display_name)}"
                ></iframe>
            `;

      return;
    }

    mediaDetailsPreview.innerHTML = `
            <i data-lucide="file"></i>
        `;

    window.lucide?.createIcons();
  }

  function populateDetailsFolderSelect(asset) {
    populateFolderSelect(mediaDetailsFolder, asset.brand_id || "", "Sem pasta", "");

    mediaDetailsFolder.value = asset.folder_id || "";
  }

  function openAssetDetails(assetId) {
    const asset = getAssetById(assetId);

    if (!asset) {
      showToast("error", "Ficheiro não encontrado", "Não foi possível localizar o ficheiro.");

      return;
    }

    selectedAssetId = asset.id;

    const brand = getBrandById(asset.brand_id);

    mediaDetailsTitle.textContent = asset.display_name;

    mediaDetailsStatus.className = `media-status-badge is-${asset.status}`;

    mediaDetailsStatus.textContent = statusLabels[asset.status] || asset.status;

    mediaDetailsType.textContent = mediaTypeLabels[asset.media_type] || asset.media_type;

    mediaDetailsName.value = asset.display_name || "";

    mediaDetailsAltText.value = asset.alt_text || "";

    mediaDetailsCaption.value = asset.caption || "";

    populateDetailsFolderSelect(asset);

    mediaDetailsBrand.textContent = brand?.name || "Partilhado";

    mediaDetailsFormat.textContent = asset.mime_type;

    mediaDetailsSize.textContent = formatBytes(asset.file_size);

    mediaDetailsDimensions.textContent = getDimensionsText(asset);

    mediaDetailsCreatedAt.textContent = formatDate(asset.created_at);

    mediaDetailsOriginalName.textContent = asset.original_name;

    mediaDetailsError.textContent = "";
    mediaDetailsError.classList.add("hidden");

    const isArchived = asset.status === "archived";

    mediaDetailsName.disabled = isArchived;
    mediaDetailsFolder.disabled = isArchived;
    mediaDetailsAltText.disabled = isArchived;
    mediaDetailsCaption.disabled = isArchived;
    mediaDetailsSave.disabled = isArchived;

    mediaDetailsArchive.classList.toggle("hidden", isArchived);

    mediaDetailsRestore.classList.toggle("hidden", !isArchived);

    mediaDetailsDownload.disabled = asset.status !== "ready";

    renderDetailsPreview(asset);

    openModal(mediaDetailsModal);
  }

  function closeAssetDetails() {
    closeModal(mediaDetailsModal);

    selectedAssetId = null;
  }

  async function saveAssetMetadata() {
    const asset = getAssetById(selectedAssetId);

    if (!asset) {
      return;
    }

    const displayName = mediaDetailsName.value.trim();

    if (displayName.length < 1 || displayName.length > 255) {
      mediaDetailsError.textContent = "O nome deve ter entre 1 e 255 caracteres.";

      mediaDetailsError.classList.remove("hidden");

      return;
    }

    mediaDetailsSave.disabled = true;
    mediaDetailsSave.textContent = "A guardar...";

    try {
      const { error } = await supabaseClient.rpc("update_media_asset_metadata", {
        target_asset_id: asset.id,

        target_folder_id: mediaDetailsFolder.value || null,

        display_name_value: displayName,

        alt_text_value: mediaDetailsAltText.value.trim() || null,

        caption_value: mediaDetailsCaption.value.trim() || null,
      });

      if (error) {
        throw error;
      }

      closeAssetDetails();

      await loadMediaData();

      showToast("success", "Ficheiro atualizado", "As informações foram guardadas.");
    } catch (error) {
      console.error("Erro ao atualizar ficheiro:", error);

      mediaDetailsError.textContent = error?.message || "Não foi possível guardar as alterações.";

      mediaDetailsError.classList.remove("hidden");
    } finally {
      mediaDetailsSave.disabled = false;

      mediaDetailsSave.innerHTML = `
                <i data-lucide="save"></i>
                Guardar alterações
            `;

      window.lucide?.createIcons();
    }
  }

  async function downloadAsset() {
    const asset = getAssetById(selectedAssetId);

    if (!asset || asset.status !== "ready") {
      return;
    }

    mediaDetailsDownload.disabled = true;

    try {
      const { data, error } = await supabaseClient.storage
        .from(asset.bucket_id)
        .download(asset.object_path);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");

      link.href = url;
      link.download = asset.original_name || asset.display_name;

      document.body.appendChild(link);

      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      showToast("success", "Download iniciado", "O ficheiro está a ser descarregado.");
    } catch (error) {
      console.error("Erro no download:", error);

      showToast(
        "error",
        "Erro no download",
        error?.message || "Não foi possível descarregar o ficheiro."
      );
    } finally {
      mediaDetailsDownload.disabled = false;
    }
  }

  async function restoreAsset(assetId) {
    try {
      const { error } = await supabaseClient.rpc("restore_media_asset", {
        target_asset_id: assetId,
      });

      if (error) {
        throw error;
      }

      closeAssetDetails();

      await loadMediaData();

      showToast("success", "Ficheiro restaurado", "O ficheiro voltou para a Biblioteca.");
    } catch (error) {
      console.error("Erro ao restaurar ficheiro:", error);

      showToast(
        "error",
        "Erro ao restaurar ficheiro",
        error?.message || "Não foi possível restaurar o ficheiro."
      );
    }
  }

  /* ======================================================
       Confirmação
    ====================================================== */

  function openArchiveConfirmation(type, id) {
    confirmationAction = {
      type,
      id,
    };

    if (type === "asset") {
      mediaConfirmTitle.textContent = "Arquivar ficheiro?";

      mediaConfirmDescription.textContent =
        "O ficheiro será removido da visualização principal, mas poderá ser restaurado.";
    } else {
      mediaConfirmTitle.textContent = "Arquivar pasta?";

      mediaConfirmDescription.textContent =
        "A pasta será arquivada. Os ficheiros dentro dela continuarão disponíveis na Biblioteca.";
    }

    closeAssetDetails();

    openModal(mediaConfirmModal);
  }

  function closeArchiveConfirmation() {
    closeModal(mediaConfirmModal);

    confirmationAction = null;
  }

  async function confirmArchive() {
    if (!confirmationAction) {
      return;
    }

    mediaConfirmSubmit.disabled = true;
    mediaConfirmSubmit.textContent = "A arquivar...";

    try {
      const isAsset = confirmationAction.type === "asset";

      const rpcName = isAsset ? "archive_media_asset" : "archive_media_folder";

      const parameters = isAsset
        ? {
            target_asset_id: confirmationAction.id,
          }
        : {
            target_folder_id: confirmationAction.id,
          };

      const { error } = await supabaseClient.rpc(rpcName, parameters);

      if (error) {
        throw error;
      }

      closeArchiveConfirmation();

      await loadMediaData();

      showToast(
        "success",
        isAsset ? "Ficheiro arquivado" : "Pasta arquivada",
        isAsset ? "O ficheiro foi enviado para o arquivo." : "A pasta foi enviada para o arquivo."
      );
    } catch (error) {
      console.error("Erro ao arquivar:", error);

      showToast("error", "Erro ao arquivar", error?.message || "Não foi possível arquivar o item.");
    } finally {
      mediaConfirmSubmit.disabled = false;
      mediaConfirmSubmit.textContent = "Arquivar";
    }
  }

  /* ======================================================
       Eventos do upload
    ====================================================== */

  uploadMediaButton.addEventListener("click", openUploadModal);

  emptyUploadMediaButton.addEventListener("click", openUploadModal);

  uploadMediaModalClose.addEventListener("click", closeUploadModal);

  uploadMediaCancel.addEventListener("click", closeUploadModal);

  uploadMediaModal.addEventListener("click", (event) => {
    if (event.target === uploadMediaModal) {
      closeUploadModal();
    }
  });

  mediaDropzone.addEventListener("click", () => {
    mediaFileInput.click();
  });

  mediaDropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      mediaFileInput.click();
    }
  });

  mediaDropzone.addEventListener("dragover", (event) => {
    event.preventDefault();

    mediaDropzone.classList.add("is-dragging");
  });

  mediaDropzone.addEventListener("dragleave", () => {
    mediaDropzone.classList.remove("is-dragging");
  });

  mediaDropzone.addEventListener("drop", (event) => {
    event.preventDefault();

    mediaDropzone.classList.remove("is-dragging");

    addSelectedFiles(event.dataTransfer.files);
  });

  mediaFileInput.addEventListener("change", () => {
    addSelectedFiles(mediaFileInput.files);

    mediaFileInput.value = "";
  });

  mediaUploadFiles.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-upload]");

    if (!button) {
      return;
    }

    const index = Number(button.dataset.removeUpload);

    selectedFiles.splice(index, 1);

    renderSelectedFiles();
  });

  uploadMediaBrand.addEventListener("change", () => {
    populateFolderSelect(uploadMediaFolder, uploadMediaBrand.value, "Sem pasta", "");
  });

  uploadMediaForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    uploadMediaError.textContent = "";
    uploadMediaError.classList.add("hidden");

    if (selectedFiles.length === 0) {
      uploadMediaError.textContent = "Selecione pelo menos um ficheiro.";

      uploadMediaError.classList.remove("hidden");

      return;
    }

    uploadMediaSubmit.disabled = true;
    uploadMediaSubmitText.textContent = "A enviar...";

    let successCount = 0;
    let errorCount = 0;

    for (let index = 0; index < selectedFiles.length; index += 1) {
      try {
        await uploadSingleFile(selectedFiles[index], index);

        successCount += 1;
      } catch (error) {
        errorCount += 1;

        console.error(`Erro no upload de ${selectedFiles[index].name}:`, error);

        updateUploadFileStatus(index, "Erro", "error");
      }
    }

    uploadMediaSubmit.disabled = false;
    uploadMediaSubmitText.textContent = "Enviar ficheiros";

    if (successCount > 0) {
      await loadMediaData();

      showToast(
        "success",
        "Upload concluído",
        `${successCount} ficheiro${successCount === 1 ? "" : "s"} enviado${
          successCount === 1 ? "" : "s"
        } com sucesso.`
      );
    }

    if (errorCount === 0) {
      closeUploadModal();
    } else {
      uploadMediaError.textContent = `${errorCount} ficheiro${errorCount === 1 ? "" : "s"} não ${
        errorCount === 1 ? "foi enviado" : "foram enviados"
      }. Consulte o console para mais detalhes.`;

      uploadMediaError.classList.remove("hidden");
    }
  });

  /* ======================================================
       Eventos das pastas
    ====================================================== */

  createFolderButton.addEventListener("click", openCreateFolderModal);

  createFolderModalClose.addEventListener("click", closeCreateFolderModal);

  createFolderCancel.addEventListener("click", closeCreateFolderModal);

  createFolderModal.addEventListener("click", (event) => {
    if (event.target === createFolderModal) {
      closeCreateFolderModal();
    }
  });

  createFolderBrand.addEventListener("change", () => {
    populateFolderSelect(createFolderParent, createFolderBrand.value, "Nenhuma", "");
  });

  createFolderForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const folderName = createFolderName.value.trim();

    createFolderNameError.textContent = "";
    createFolderError.classList.add("hidden");

    if (folderName.length < 1 || folderName.length > 100) {
      createFolderNameError.textContent = "O nome deve ter entre 1 e 100 caracteres.";

      return;
    }

    createFolderSubmit.disabled = true;
    createFolderSubmitText.textContent = "A criar...";

    try {
      const { error } = await supabaseClient.rpc("create_media_folder", {
        target_workspace_id: currentWorkspace.id,

        folder_name: folderName,

        target_brand_id: createFolderBrand.value || null,

        target_parent_id: createFolderParent.value || null,
      });

      if (error) {
        throw error;
      }

      closeCreateFolderModal();

      await loadMediaData();

      showToast("success", "Pasta criada", "A nova pasta foi adicionada à Biblioteca.");
    } catch (error) {
      console.error("Erro ao criar pasta:", error);

      createFolderError.textContent = error?.message || "Não foi possível criar a pasta.";

      createFolderError.classList.remove("hidden");
    } finally {
      createFolderSubmit.disabled = false;
      createFolderSubmitText.textContent = "Criar pasta";
    }
  });

  toggleArchivedFoldersButton.addEventListener("click", () => {
    showArchivedFolders = !showArchivedFolders;

    renderFolders();
  });

  mediaFoldersGrid.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-folder-action]");

    if (actionButton) {
      event.stopPropagation();

      const folderId = actionButton.dataset.folderId;

      if (actionButton.dataset.folderAction === "restore") {
        restoreFolder(folderId);
      } else {
        openArchiveConfirmation("folder", folderId);
      }

      return;
    }

    const folderCard = event.target.closest("[data-folder-id]");

    if (!folderCard) {
      return;
    }

    mediaFolderFilter.value = folderCard.dataset.folderId;

    renderFolders();
    renderAssets();
  });

  /* ======================================================
       Eventos dos filtros
    ====================================================== */

  [
    mediaSearchInput,
    mediaBrandFilter,
    mediaFolderFilter,
    mediaTypeFilter,
    mediaStatusFilter,
  ].forEach((element) => {
    element.addEventListener(element.tagName === "INPUT" ? "input" : "change", () => {
      renderFolders();
      renderAssets();
    });
  });

  clearMediaFiltersButton.addEventListener("click", () => {
    mediaSearchInput.value = "";
    mediaBrandFilter.value = "all";
    mediaFolderFilter.value = "all";
    mediaTypeFilter.value = "all";
    mediaStatusFilter.value = "all";

    renderFolders();
    renderAssets();

    showToast("info", "Filtros removidos", "A pesquisa e os filtros foram redefinidos.");
  });

  mediaGridViewButton.addEventListener("click", () => {
    currentView = "grid";

    mediaGridViewButton.classList.add("is-active");
    mediaListViewButton.classList.remove("is-active");

    renderAssets();
  });

  mediaListViewButton.addEventListener("click", () => {
    currentView = "list";

    mediaListViewButton.classList.add("is-active");
    mediaGridViewButton.classList.remove("is-active");

    renderAssets();
  });

  /* ======================================================
       Eventos dos ficheiros
    ====================================================== */

  mediaAssetsGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-asset-id]");

    if (!card) {
      return;
    }

    openAssetDetails(card.dataset.assetId);
  });

  mediaDetailsClose.addEventListener("click", closeAssetDetails);

  mediaDetailsModal.addEventListener("click", (event) => {
    if (event.target === mediaDetailsModal) {
      closeAssetDetails();
    }
  });

  mediaDetailsSave.addEventListener("click", saveAssetMetadata);

  mediaDetailsDownload.addEventListener("click", downloadAsset);

  mediaDetailsArchive.addEventListener("click", () => {
    if (selectedAssetId) {
      openArchiveConfirmation("asset", selectedAssetId);
    }
  });

  mediaDetailsRestore.addEventListener("click", () => {
    if (selectedAssetId) {
      restoreAsset(selectedAssetId);
    }
  });

  /* ======================================================
       Confirmação
    ====================================================== */

  mediaConfirmCancel.addEventListener("click", closeArchiveConfirmation);

  mediaConfirmModal.addEventListener("click", (event) => {
    if (event.target === mediaConfirmModal) {
      closeArchiveConfirmation();
    }
  });

  mediaConfirmSubmit.addEventListener("click", confirmArchive);

  /* ======================================================
       Sidebar
    ====================================================== */

  function openSidebar() {
    body.classList.add("sidebar-open");

    sidebarOpenButton.setAttribute("aria-expanded", "true");
  }

  function closeSidebar() {
    body.classList.remove("sidebar-open");

    sidebarOpenButton.setAttribute("aria-expanded", "false");
  }

  sidebarOpenButton.addEventListener("click", openSidebar);

  sidebarCloseButton.addEventListener("click", closeSidebar);

  sidebarOverlay.addEventListener("click", closeSidebar);

  /* ======================================================
       Escape
    ====================================================== */

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (!mediaConfirmModal.classList.contains("hidden")) {
      closeArchiveConfirmation();
      return;
    }

    if (!mediaDetailsModal.classList.contains("hidden")) {
      closeAssetDetails();
      return;
    }

    if (!createFolderModal.classList.contains("hidden")) {
      closeCreateFolderModal();
      return;
    }

    if (!uploadMediaModal.classList.contains("hidden")) {
      closeUploadModal();
      return;
    }

    closeSidebar();
  });

  /* ======================================================
       Inicialização
    ====================================================== */

  try {
    const contextLoaded = await initializeContext();

    if (contextLoaded) {
      await loadMediaData();
    }
  } catch (error) {
    console.error("Erro ao inicializar Biblioteca:", error);

    setLoading(false);

    showToast(
      "error",
      "Erro ao iniciar Biblioteca",
      error?.message || "Não foi possível iniciar a página."
    );
  }

  window.lucide?.createIcons();
});

"use strict";

/* ==========================================================
   StudioV — Conteúdos
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        /* ==================================================
           Elementos gerais
        ================================================== */

        const body = document.body;

        const supabaseClient =
            window.supabaseClient;

        const sidebarOpenButton =
            document.getElementById(
                "topbar-menu-button"
            );

        const sidebarCloseButton =
            document.getElementById(
                "sidebar-close"
            );

        const sidebarOverlay =
            document.getElementById(
                "sidebar-overlay"
            );

        const currentWorkspaceName =
            document.getElementById(
                "current-workspace-name"
            );

        const sidebarUserName =
            document.getElementById(
                "sidebar-user-name"
            );

        const sidebarUserEmail =
            document.getElementById(
                "sidebar-user-email"
            );

        const sidebarUserAvatar =
            document.getElementById(
                "sidebar-user-avatar"
            );

        const topbarAvatar =
            document.getElementById(
                "topbar-avatar"
            );

        const toastContainer =
            document.getElementById(
                "toast-container"
            );

        /* ==================================================
           Elementos de Conteúdos
        ================================================== */

        const contentLoading =
            document.getElementById(
                "content-loading"
            );

        const contentEmpty =
            document.getElementById(
                "content-empty"
            );

        const contentNoResults =
            document.getElementById(
                "content-no-results"
            );

        const contentGrid =
            document.getElementById(
                "content-grid"
            );

        const contentSearchInput =
            document.getElementById(
                "content-search-input"
            );

        const contentBrandFilter =
            document.getElementById(
                "content-brand-filter"
            );

        const contentStatusFilter =
            document.getElementById(
                "content-status-filter"
            );

        const contentTypeFilter =
            document.getElementById(
                "content-type-filter"
            );

        const clearContentFiltersButton =
            document.getElementById(
                "clear-content-filters-button"
            );

        const createContentButton =
            document.getElementById(
                "create-content-button"
            );

        /* ==================================================
           Contadores
        ================================================== */

        const contentTotalCount =
            document.getElementById(
                "content-total-count"
            );

        const contentDraftCount =
            document.getElementById(
                "content-draft-count"
            );

        const contentReviewCount =
            document.getElementById(
                "content-review-count"
            );

        const contentPublishedCount =
            document.getElementById(
                "content-published-count"
            );

        /* ==================================================
           Modal de detalhes
        ================================================== */

        const contentDetailsModal =
            document.getElementById(
                "content-details-modal"
            );

        const contentDetailsClose =
            document.getElementById(
                "content-details-close"
            );

        const contentDetailsCancel =
            document.getElementById(
                "content-details-cancel"
            );

        const contentDetailsTitle =
            document.getElementById(
                "content-details-title"
            );

        const contentDetailsStatus =
            document.getElementById(
                "content-details-status"
            );

        const contentDetailsBrand =
            document.getElementById(
                "content-details-brand"
            );

        const contentDetailsType =
            document.getElementById(
                "content-details-type"
            );

        const contentDetailsPlatforms =
            document.getElementById(
                "content-details-platforms"
            );

        const contentDetailsMainText =
            document.getElementById(
                "content-details-main-text"
            );

        const contentDetailsCreatedAt =
            document.getElementById(
                "content-details-created-at"
            );

        const contentDetailsUpdatedAt =
            document.getElementById(
                "content-details-updated-at"
            );

        /* ==================================================
           Estado
        ================================================== */

        let currentUser = null;
        let currentWorkspace = null;

        let contents = [];
        let brands = [];

        let lastFocusedElement = null;

        /* ==================================================
           Mapas
        ================================================== */

        const statusLabels = {
            draft: "Rascunho",
            in_progress: "Em produção",
            review: "Em revisão",
            approved: "Aprovado",
            scheduled: "Agendado",
            published: "Publicado",
            archived: "Arquivado"
        };

        const contentTypeLabels = {
            post: "Publicação",
            carousel: "Carrossel",
            story: "Story",
            reel: "Reel",
            short: "Short",
            video: "Vídeo",
            article: "Artigo",
            email: "Email",
            other: "Outro"
        };

        const platformLabels = {
            instagram: "Instagram",
            facebook: "Facebook",
            linkedin: "LinkedIn",
            tiktok: "TikTok",
            youtube: "YouTube",
            pinterest: "Pinterest",
            threads: "Threads",
            x: "X",
            blog: "Blog",
            email: "Email"
        };

        /* ==================================================
           Utilitários
        ================================================== */

        function escapeHtml(value = "") {
            const element =
                document.createElement("div");

            element.textContent =
                String(value);

            return element.innerHTML;
        }

        function normalizeSearchText(
            value = ""
        ) {
            return String(value)
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                );
        }

        function getSafeColor(
            value,
            fallback = "#6D28D9"
        ) {
            return /^#[0-9A-F]{6}$/i.test(
                value || ""
            )
                ? value
                : fallback;
        }

        function getContentMainText(
            content
        ) {
            return (
                content.main_text ||
                content.body ||
                content.caption ||
                content.description ||
                ""
            );
        }

        function getContentType(content) {
            return (
                content.content_type ||
                content.type ||
                "post"
            );
        }

        function getContentPlatforms(
            content
        ) {
            if (
                Array.isArray(
                    content.target_platforms
                )
            ) {
                return content.target_platforms;
            }

            if (
                Array.isArray(
                    content.platforms
                )
            ) {
                return content.platforms;
            }

            return [];
        }

        function getContentStatus(content) {
            return content.status || "draft";
        }

        function getBrandById(brandId) {
            return brands.find(
                brand =>
                    brand.id === brandId
            ) || null;
        }

        function formatDate(value) {
            if (!value) {
                return "Data indisponível";
            }

            const date = new Date(value);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return "Data indisponível";
            }

            return new Intl.DateTimeFormat(
                "pt-PT",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ).format(date);
        }

        /* ==================================================
           Toasts
        ================================================== */

        function showToast(
            type = "info",
            title = "",
            message = ""
        ) {
            if (!toastContainer) {
                return;
            }

            const icons = {
                success: "circle-check",
                error: "circle-alert",
                warning: "triangle-alert",
                info: "info"
            };

            const toast =
                document.createElement(
                    "div"
                );

            toast.className =
                `toast is-${type}`;

            toast.innerHTML = `
                <div class="toast-icon">
                    <i
                        data-lucide="${
                            icons[type] ||
                            icons.info
                        }"
                    ></i>
                </div>

                <div class="toast-content">
                    <strong>
                        ${escapeHtml(title)}
                    </strong>

                    <p>
                        ${escapeHtml(message)}
                    </p>
                </div>

                <button
                    type="button"
                    class="toast-close"
                    aria-label="Fechar mensagem"
                >
                    <i data-lucide="x"></i>
                </button>
            `;

            toastContainer.appendChild(
                toast
            );

            toast
                .querySelector(
                    ".toast-close"
                )
                ?.addEventListener(
                    "click",
                    () => toast.remove()
                );

            window.lucide?.createIcons();

            window.setTimeout(
                () => toast.remove(),
                5000
            );
        }

        /* ==================================================
           Perfil e workspace
        ================================================== */

        async function loadUserProfile(
            userId
        ) {
            const { data, error } =
                await supabaseClient
                    .from("profiles")
                    .select(
                        "id, full_name"
                    )
                    .eq("id", userId)
                    .maybeSingle();

            if (error) {
                console.warn(
                    "Erro ao carregar perfil:",
                    error.message
                );

                return null;
            }

            return data;
        }

        async function loadCurrentWorkspace(
            userId
        ) {
            const {
                data: membership,
                error: membershipError
            } = await supabaseClient
                .from("workspace_members")
                .select(
                    "workspace_id, role, status, created_at"
                )
                .eq(
                    "user_id",
                    userId
                )
                .eq(
                    "status",
                    "active"
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                )
                .limit(1)
                .maybeSingle();

            if (membershipError) {
                throw membershipError;
            }

            if (
                !membership?.workspace_id
            ) {
                throw new Error(
                    "O utilizador não possui um workspace ativo."
                );
            }

            const {
                data: workspace,
                error: workspaceError
            } = await supabaseClient
                .from("workspaces")
                .select(
                    "id, name, status"
                )
                .eq(
                    "id",
                    membership.workspace_id
                )
                .eq(
                    "status",
                    "active"
                )
                .single();

            if (workspaceError) {
                throw workspaceError;
            }

            return {
                ...workspace,
                role: membership.role
            };
        }

        function updateDashboardIdentity(
            user,
            profile,
            workspace
        ) {
            const fullName =
                profile?.full_name?.trim() ||
                user.email?.split("@")[0] ||
                "Utilizador";

            const email =
                user.email ||
                "Email não disponível";

            const avatarLetter =
                fullName
                    .charAt(0)
                    .toUpperCase();

            if (currentWorkspaceName) {
                currentWorkspaceName.textContent =
                    workspace.name;
            }

            if (sidebarUserName) {
                sidebarUserName.textContent =
                    fullName;
            }

            if (sidebarUserEmail) {
                sidebarUserEmail.textContent =
                    email;
            }

            if (sidebarUserAvatar) {
                sidebarUserAvatar.textContent =
                    avatarLetter;
            }

            if (topbarAvatar) {
                topbarAvatar.textContent =
                    avatarLetter;
            }
        }

        async function initializeWorkspaceContext() {
            if (!supabaseClient) {
                throw new Error(
                    "Cliente Supabase não encontrado."
                );
            }

            const user =
                await window.studioVAuthReady;

            if (!user) {
                return false;
            }

            currentUser = user;

            const [
                profile,
                workspace
            ] = await Promise.all([
                loadUserProfile(user.id),
                loadCurrentWorkspace(user.id)
            ]);

            currentWorkspace = workspace;

            updateDashboardIdentity(
                user,
                profile,
                workspace
            );

            console.log(
                "Contexto de Conteúdos carregado:",
                {
                    userId: user.id,
                    workspaceId:
                        workspace.id,
                    workspaceName:
                        workspace.name,
                    role:
                        workspace.role
                }
            );

            return true;
        }

        /* ==================================================
           Estados visuais
        ================================================== */

        function setContentView(view) {
            contentLoading?.classList.toggle(
                "hidden",
                view !== "loading"
            );

            contentEmpty?.classList.toggle(
                "hidden",
                view !== "empty"
            );

            contentNoResults?.classList.toggle(
                "hidden",
                view !== "no-results"
            );

            contentGrid?.classList.toggle(
                "hidden",
                view !== "grid"
            );
        }

        /* ==================================================
           Filtros
        ================================================== */

        function populateBrandFilter() {
            if (!contentBrandFilter) {
                return;
            }

            contentBrandFilter.innerHTML = `
                <option value="all">
                    Todas as marcas
                </option>
            `;

            brands.forEach(brand => {
                const option =
                    document.createElement(
                        "option"
                    );

                option.value = brand.id;
                option.textContent =
                    brand.name;

                contentBrandFilter.appendChild(
                    option
                );
            });
        }

        function hasActiveFilters() {
            return Boolean(
                contentSearchInput
                    ?.value
                    .trim() ||

                contentBrandFilter
                    ?.value !== "all" ||

                contentStatusFilter
                    ?.value !== "all" ||

                contentTypeFilter
                    ?.value !== "all"
            );
        }

        function getFilteredContents() {
            const searchTerm =
                normalizeSearchText(
                    contentSearchInput
                        ?.value || ""
                );

            const selectedBrand =
                contentBrandFilter
                    ?.value || "all";

            const selectedStatus =
                contentStatusFilter
                    ?.value || "all";

            const selectedType =
                contentTypeFilter
                    ?.value || "all";

            return contents.filter(
                content => {
                    const status =
                        getContentStatus(
                            content
                        );

                    const type =
                        getContentType(
                            content
                        );

                    const searchableText =
                        normalizeSearchText(
                            [
                                content.title,
                                getContentMainText(
                                    content
                                ),
                                type,
                                status
                            ]
                                .filter(Boolean)
                                .join(" ")
                        );

                    const matchesSearch =
                        searchTerm === "" ||
                        searchableText.includes(
                            searchTerm
                        );

                    const matchesBrand =
                        selectedBrand ===
                            "all" ||
                        content.brand_id ===
                            selectedBrand;

                    const matchesStatus =
                        selectedStatus ===
                            "all" ||
                        status ===
                            selectedStatus;

                    const matchesType =
                        selectedType ===
                            "all" ||
                        type ===
                            selectedType;

                    return (
                        matchesSearch &&
                        matchesBrand &&
                        matchesStatus &&
                        matchesType
                    );
                }
            );
        }

        /* ==================================================
           Contadores
        ================================================== */

        function updateContentCounters() {
            const drafts =
                contents.filter(
                    content =>
                        getContentStatus(
                            content
                        ) === "draft"
                );

            const review =
                contents.filter(
                    content =>
                        getContentStatus(
                            content
                        ) === "review"
                );

            const published =
                contents.filter(
                    content =>
                        getContentStatus(
                            content
                        ) === "published"
                );

            if (contentTotalCount) {
                contentTotalCount.textContent =
                    String(
                        contents.length
                    );
            }

            if (contentDraftCount) {
                contentDraftCount.textContent =
                    String(
                        drafts.length
                    );
            }

            if (contentReviewCount) {
                contentReviewCount.textContent =
                    String(
                        review.length
                    );
            }

            if (contentPublishedCount) {
                contentPublishedCount.textContent =
                    String(
                        published.length
                    );
            }
        }

        /* ==================================================
           Renderização
        ================================================== */

        function createContentCard(
            content
        ) {
            const brand =
                getBrandById(
                    content.brand_id
                );

            const status =
                getContentStatus(
                    content
                );

            const type =
                getContentType(
                    content
                );

            const platforms =
                getContentPlatforms(
                    content
                );

            const mainText =
                getContentMainText(
                    content
                );

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "content-card";

            card.dataset.contentId =
                content.id;

            const platformsHtml =
                platforms.length > 0
                    ? platforms
                        .slice(0, 5)
                        .map(
                            platform => `
                                <span class="content-platform">
                                    ${escapeHtml(
                                        platformLabels[
                                            platform
                                        ] ||
                                        platform
                                    )}
                                </span>
                            `
                        )
                        .join("")
                    : `
                        <span class="content-platform">
                            Sem plataforma
                        </span>
                    `;

            card.innerHTML = `
                <header class="content-card-header">

                    <div class="content-card-brand">

                        <span
                            class="content-brand-color"
                            style="background-color: ${
                                getSafeColor(
                                    brand
                                        ?.primary_color
                                )
                            }"
                        ></span>

                        <span class="content-brand-name">
                            ${escapeHtml(
                                brand?.name ||
                                "Marca indisponível"
                            )}
                        </span>

                    </div>

                    <span
                        class="content-status-badge is-${escapeHtml(
                            status
                        )}"
                    >
                        ${escapeHtml(
                            statusLabels[
                                status
                            ] ||
                            status
                        )}
                    </span>

                </header>

                <h2 class="content-card-title">
                    ${escapeHtml(
                        content.title ||
                        "Conteúdo sem título"
                    )}
                </h2>

                <p class="content-card-text">
                    ${escapeHtml(
                        mainText.trim() ||
                        "Este conteúdo ainda não possui texto principal."
                    )}
                </p>

                <div class="content-card-meta">

                    <span class="content-meta-badge">
                        <i data-lucide="file-text"></i>

                        ${escapeHtml(
                            contentTypeLabels[
                                type
                            ] ||
                            type
                        )}
                    </span>

                    ${
                        content.source
                            ? `
                                <span class="content-meta-badge">
                                    <i data-lucide="git-branch"></i>

                                    ${escapeHtml(
                                        content.source
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

                <div class="content-platforms">
                    ${platformsHtml}
                </div>

                <footer class="content-card-footer">

                    <span class="content-card-date">
                        <i data-lucide="clock-3"></i>

                        ${escapeHtml(
                            formatDate(
                                content.updated_at ||
                                content.created_at
                            )
                        )}
                    </span>

                    <button
                        type="button"
                        class="content-view-button"
                        data-content-action="view"
                    >
                        <i data-lucide="eye"></i>
                        Ver conteúdo
                    </button>

                </footer>
            `;

            return card;
        }

        function renderContents(items) {
            if (!contentGrid) {
                return;
            }

            contentGrid.innerHTML = "";

            items.forEach(content => {
                contentGrid.appendChild(
                    createContentCard(
                        content
                    )
                );
            });

            setContentView("grid");

            window.lucide?.createIcons();
        }

        function applyContentFilters() {
            if (
                contents.length === 0 &&
                !hasActiveFilters()
            ) {
                setContentView("empty");
                return;
            }

            const filteredContents =
                getFilteredContents();

            if (
                filteredContents.length ===
                0
            ) {
                setContentView(
                    "no-results"
                );

                return;
            }

            renderContents(
                filteredContents
            );
        }

        /* ==================================================
           Carregamento
        ================================================== */

        async function loadContentData() {
            if (
                !currentWorkspace?.id
            ) {
                return;
            }

            setContentView("loading");

            try {
                const [
                    brandsResult,
                    contentsResult
                ] = await Promise.all([
                    supabaseClient
                        .from("brands")
                        .select(`
                            id,
                            name,
                            primary_color,
                            status
                        `)
                        .eq(
                            "workspace_id",
                            currentWorkspace.id
                        ),

                    supabaseClient
                        .from("contents")
                        .select("*")
                        .eq(
                            "workspace_id",
                            currentWorkspace.id
                        )
                ]);

                if (brandsResult.error) {
                    throw brandsResult.error;
                }

                if (contentsResult.error) {
                    throw contentsResult.error;
                }

                brands =
                    brandsResult.data || [];

                contents =
                    contentsResult.data || [];

                contents.sort(
                    (first, second) => {
                        const firstDate =
                            new Date(
                                first.updated_at ||
                                first.created_at ||
                                0
                            ).getTime();

                        const secondDate =
                            new Date(
                                second.updated_at ||
                                second.created_at ||
                                0
                            ).getTime();

                        return (
                            secondDate -
                            firstDate
                        );
                    }
                );

                populateBrandFilter();
                updateContentCounters();
                applyContentFilters();

                console.log(
                    "Conteúdos carregados:",
                    {
                        contents:
                            contents.length,
                        brands:
                            brands.length
                    }
                );
            } catch (error) {
                console.error(
                    "Erro ao carregar conteúdos:",
                    error
                );

                setContentView(null);

                showToast(
                    "error",
                    "Erro ao carregar conteúdos",
                    error?.message ||
                    "Não foi possível carregar os conteúdos."
                );
            }
        }

        /* ==================================================
           Modal
        ================================================== */

        function openModal(modal) {
            if (!modal) {
                return;
            }

            lastFocusedElement =
                document.activeElement;

            modal.classList.remove(
                "hidden"
            );

            modal.classList.add(
                "is-open"
            );

            modal.setAttribute(
                "aria-hidden",
                "false"
            );

            body.classList.add(
                "modal-open"
            );
        }

        function closeModal(modal) {
            if (!modal) {
                return;
            }

            modal.classList.remove(
                "is-open"
            );

            modal.classList.add(
                "hidden"
            );

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

            body.classList.remove(
                "modal-open"
            );

            lastFocusedElement
                ?.focus();
        }

        function openContentDetails(
            contentId
        ) {
            const content =
                contents.find(
                    item =>
                        item.id ===
                        contentId
                );

            if (!content) {
                showToast(
                    "error",
                    "Conteúdo não encontrado",
                    "Não foi possível localizar o conteúdo selecionado."
                );

                return;
            }

            const brand =
                getBrandById(
                    content.brand_id
                );

            const status =
                getContentStatus(
                    content
                );

            const type =
                getContentType(
                    content
                );

            const platforms =
                getContentPlatforms(
                    content
                );

            if (contentDetailsTitle) {
                contentDetailsTitle.textContent =
                    content.title ||
                    "Conteúdo sem título";
            }

            if (contentDetailsStatus) {
                contentDetailsStatus.className =
                    `content-status-badge is-${status}`;

                contentDetailsStatus.textContent =
                    statusLabels[
                        status
                    ] ||
                    status;
            }

            if (contentDetailsBrand) {
                contentDetailsBrand.textContent =
                    brand?.name ||
                    "Marca indisponível";
            }

            if (contentDetailsType) {
                contentDetailsType.textContent =
                    contentTypeLabels[
                        type
                    ] ||
                    type;
            }

            if (
                contentDetailsPlatforms
            ) {
                contentDetailsPlatforms.innerHTML =
                    platforms.length > 0
                        ? platforms
                            .map(
                                platform => `
                                    <span class="content-platform">
                                        ${escapeHtml(
                                            platformLabels[
                                                platform
                                            ] ||
                                            platform
                                        )}
                                    </span>
                                `
                            )
                            .join("")
                        : `
                            <span class="content-platform">
                                Sem plataforma
                            </span>
                        `;
            }

            if (contentDetailsMainText) {
                contentDetailsMainText.textContent =
                    getContentMainText(
                        content
                    ).trim() ||
                    "Sem texto principal.";
            }

            if (
                contentDetailsCreatedAt
            ) {
                contentDetailsCreatedAt.textContent =
                    `Criado em ${formatDate(
                        content.created_at
                    )}`;
            }

            if (
                contentDetailsUpdatedAt
            ) {
                contentDetailsUpdatedAt.textContent =
                    `Atualizado em ${formatDate(
                        content.updated_at
                    )}`;
            }

            openModal(
                contentDetailsModal
            );

            window.lucide?.createIcons();
        }

        /* ==================================================
           Eventos
        ================================================== */

        contentSearchInput
            ?.addEventListener(
                "input",
                applyContentFilters
            );

        contentBrandFilter
            ?.addEventListener(
                "change",
                applyContentFilters
            );

        contentStatusFilter
            ?.addEventListener(
                "change",
                applyContentFilters
            );

        contentTypeFilter
            ?.addEventListener(
                "change",
                applyContentFilters
            );

        clearContentFiltersButton
            ?.addEventListener(
                "click",
                () => {
                    if (
                        contentSearchInput
                    ) {
                        contentSearchInput.value =
                            "";
                    }

                    if (
                        contentBrandFilter
                    ) {
                        contentBrandFilter.value =
                            "all";
                    }

                    if (
                        contentStatusFilter
                    ) {
                        contentStatusFilter.value =
                            "all";
                    }

                    if (
                        contentTypeFilter
                    ) {
                        contentTypeFilter.value =
                            "all";
                    }

                    applyContentFilters();

                    showToast(
                        "info",
                        "Filtros removidos",
                        "A pesquisa e os filtros foram redefinidos."
                    );
                }
            );

        contentGrid?.addEventListener(
            "click",
            event => {
                const viewButton =
                    event.target.closest(
                        '[data-content-action="view"]'
                    );

                if (!viewButton) {
                    return;
                }

                const card =
                    viewButton.closest(
                        "[data-content-id]"
                    );

                const contentId =
                    card?.dataset
                        .contentId;

                if (!contentId) {
                    return;
                }

                openContentDetails(
                    contentId
                );
            }
        );

        createContentButton
            ?.addEventListener(
                "click",
                () => {
                    showToast(
                        "info",
                        "Criação manual",
                        "A criação manual será implementada no próximo passo."
                    );
                }
            );

        contentDetailsClose
            ?.addEventListener(
                "click",
                () =>
                    closeModal(
                        contentDetailsModal
                    )
            );

        contentDetailsCancel
            ?.addEventListener(
                "click",
                () =>
                    closeModal(
                        contentDetailsModal
                    )
            );

        contentDetailsModal
            ?.addEventListener(
                "click",
                event => {
                    if (
                        event.target ===
                        contentDetailsModal
                    ) {
                        closeModal(
                            contentDetailsModal
                        );
                    }
                }
            );

        /* ==================================================
           Sidebar
        ================================================== */

        function openSidebar() {
            body.classList.add(
                "sidebar-open"
            );

            sidebarOpenButton
                ?.setAttribute(
                    "aria-expanded",
                    "true"
                );
        }

        function closeSidebar() {
            body.classList.remove(
                "sidebar-open"
            );

            sidebarOpenButton
                ?.setAttribute(
                    "aria-expanded",
                    "false"
                );
        }

        sidebarOpenButton
            ?.addEventListener(
                "click",
                openSidebar
            );

        sidebarCloseButton
            ?.addEventListener(
                "click",
                closeSidebar
            );

        sidebarOverlay
            ?.addEventListener(
                "click",
                closeSidebar
            );

        document.addEventListener(
            "keydown",
            event => {
                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }

                if (
                    contentDetailsModal
                        ?.classList
                        .contains(
                            "is-open"
                        )
                ) {
                    closeModal(
                        contentDetailsModal
                    );

                    return;
                }

                if (
                    body.classList.contains(
                        "sidebar-open"
                    )
                ) {
                    closeSidebar();
                }
            }
        );

        /* ==================================================
           Inicialização
        ================================================== */

        try {
            const contextLoaded =
                await initializeWorkspaceContext();

            if (contextLoaded) {
                await loadContentData();
            }
        } catch (error) {
            console.error(
                "Erro ao inicializar Conteúdos:",
                error
            );

            setContentView(null);

            showToast(
                "error",
                "Erro ao iniciar Conteúdos",
                error?.message ||
                "Não foi possível iniciar a página."
            );
        }

        window.lucide?.createIcons();
    }
);
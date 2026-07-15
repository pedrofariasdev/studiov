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

        const deleteContentModal =
            document.getElementById(
                "delete-content-modal"
            );


        const deleteContentCancel =
            document.getElementById(
                "delete-content-cancel"
            );


        const deleteContentConfirm =
            document.getElementById(
                "delete-content-confirm"
            );


        let contentToDelete = null;            
            

        /* ==================================================
           Modal de criação e edição
        ================================================== */

        const manualContentModal =
            document.getElementById(
                "manual-content-modal"
            );

        const manualContentModalClose =
            document.getElementById(
                "manual-content-modal-close"
            );

        const manualContentModalTitle =
            document.getElementById(
                "manual-content-modal-title"
            );

        const manualContentForm =
            document.getElementById(
                "manual-content-form"
            );

        const manualContentIdInput =
            document.getElementById(
                "manual-content-id"
            );

        const manualContentBrandInput =
            document.getElementById(
                "manual-content-brand"
            );

        const manualContentBrandError =
            document.getElementById(
                "manual-content-brand-error"
            );

        const manualContentTypeInput =
            document.getElementById(
                "manual-content-type"
            );

        const manualContentTitleInput =
            document.getElementById(
                "manual-content-title"
            );

        const manualContentTitleError =
            document.getElementById(
                "manual-content-title-error"
            );

        const manualContentBriefInput =
            document.getElementById(
                "manual-content-brief"
            );

        const manualContentMainTextInput =
            document.getElementById(
                "manual-content-main-text"
            );

        const manualContentFormError =
            document.getElementById(
                "manual-content-form-error"
            );

        const manualContentCancel =
            document.getElementById(
                "manual-content-cancel"
            );

        const manualContentSubmit =
            document.getElementById(
                "manual-content-submit"
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

        const contentDetailsEdit =
            document.getElementById(
                "content-details-edit"
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
        let selectedContentId = null;

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

        function escapeHtml(
            value = ""
        ) {
            const element =
                document.createElement(
                    "div"
                );

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

        function getContentType(
            content
        ) {
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
                return content
                    .target_platforms;
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

        function getContentStatus(
            content
        ) {
            return (
                content.status ||
                "draft"
            );
        }

        function getBrandById(
            brandId
        ) {
            return (
                brands.find(
                    brand =>
                        brand.id === brandId
                ) ||
                null
            );
        }

        function formatDate(
            value
        ) {
            if (!value) {
                return "Data indisponível";
            }

            const date =
                new Date(value);

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
            const {
                data,
                error
            } = await supabaseClient
                .from("profiles")
                .select(
                    "id, full_name"
                )
                .eq(
                    "id",
                    userId
                )
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
                !membership
                    ?.workspace_id
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
                role:
                    membership.role
            };
        }

        function updateDashboardIdentity(
            user,
            profile,
            workspace
        ) {
            const fullName =
                profile
                    ?.full_name
                    ?.trim() ||
                user.email
                    ?.split("@")[0] ||
                "Utilizador";

            const email =
                user.email ||
                "Email não disponível";

            const avatarLetter =
                fullName
                    .charAt(0)
                    .toUpperCase();

            if (currentWorkspaceName) {
                currentWorkspaceName
                    .textContent =
                    workspace.name;
            }

            if (sidebarUserName) {
                sidebarUserName
                    .textContent =
                    fullName;
            }

            if (sidebarUserEmail) {
                sidebarUserEmail
                    .textContent =
                    email;
            }

            if (sidebarUserAvatar) {
                sidebarUserAvatar
                    .textContent =
                    avatarLetter;
            }

            if (topbarAvatar) {
                topbarAvatar
                    .textContent =
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
                await window
                    .studioVAuthReady;

            if (!user) {
                return false;
            }

            currentUser =
                user;

            const [
                profile,
                workspace
            ] = await Promise.all([
                loadUserProfile(
                    user.id
                ),
                loadCurrentWorkspace(
                    user.id
                )
            ]);

            currentWorkspace =
                workspace;

            updateDashboardIdentity(
                user,
                profile,
                workspace
            );

            console.log(
                "Contexto de Conteúdos carregado:",
                {
                    userId:
                        user.id,

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

        function setContentView(
            view
        ) {
            contentLoading
                ?.classList
                .toggle(
                    "hidden",
                    view !== "loading"
                );

            contentEmpty
                ?.classList
                .toggle(
                    "hidden",
                    view !== "empty"
                );

            contentNoResults
                ?.classList
                .toggle(
                    "hidden",
                    view !== "no-results"
                );

            contentGrid
                ?.classList
                .toggle(
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

            const previousValue =
                contentBrandFilter.value;

            contentBrandFilter.innerHTML = `
                <option value="all">
                    Todas as marcas
                </option>
            `;

            brands.forEach(
                brand => {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        brand.id;

                    option.textContent =
                        brand.name;

                    contentBrandFilter
                        .appendChild(
                            option
                        );
                }
            );

            const optionExists =
                Array.from(
                    contentBrandFilter.options
                ).some(
                    option =>
                        option.value ===
                        previousValue
                );

            contentBrandFilter.value =
                optionExists
                    ? previousValue
                    : "all";
        }

        function hasActiveFilters() {
            return Boolean(
                contentSearchInput
                    ?.value
                    .trim() ||

                contentBrandFilter
                    ?.value !==
                    "all" ||

                contentStatusFilter
                    ?.value !==
                    "all" ||

                contentTypeFilter
                    ?.value !==
                    "all"
            );
        }

        function getFilteredContents() {
            const searchTerm =
                normalizeSearchText(
                    contentSearchInput
                        ?.value ||
                    ""
                );

            const selectedBrand =
                contentBrandFilter
                    ?.value ||
                "all";

            const selectedStatus =
                contentStatusFilter
                    ?.value ||
                "all";

            const selectedType =
                contentTypeFilter
                    ?.value ||
                "all";

                return contents.filter(
                    content => {
                    const status =
                        getContentStatus(
                            content
                        );
                    
                    // Oculta conteúdos arquivados da listagem principal
                    if (
                        status === "archived" &&
                        selectedStatus !== "archived"
                    ) {
                        return false;
                    }

                    const type =
                        getContentType(
                            content
                        );

                    const searchableText =
                        normalizeSearchText(
                            [
                                content.title,
                                content.brief,
                                getContentMainText(
                                    content
                                ),
                                type,
                                status
                            ]
                                .filter(
                                    Boolean
                                )
                                .join(" ")
                        );

                    const matchesSearch =
                        searchTerm === "" ||
                        searchableText
                            .includes(
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

            const activeContents =
                contents.filter(
                    content =>
                        getContentStatus(
                            content
                        ) !== "archived"
                );


            const draftCount =
                activeContents.filter(
                    content =>
                        getContentStatus(
                            content
                        ) === "draft"
                ).length;


            const reviewCount =
                activeContents.filter(
                    content =>
                        getContentStatus(
                            content
                        ) === "review"
                ).length;


            const publishedCount =
                activeContents.filter(
                    content =>
                        getContentStatus(
                            content
                        ) === "published"
                ).length;


            if (contentTotalCount) {
                contentTotalCount.textContent =
                    String(
                        activeContents.length
                    );
            }


            if (contentDraftCount) {
                contentDraftCount.textContent =
                    String(
                        draftCount
                    );
            }


            if (contentReviewCount) {
                contentReviewCount.textContent =
                    String(
                        reviewCount
                    );
            }


            if (contentPublishedCount) {
                contentPublishedCount.textContent =
                    String(
                        publishedCount
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
                    :
                        `
                            <span class="content-platform">
                                Sem plataforma
                            </span>
                        `;


            card.innerHTML = `

                <header class="content-card-header">

                    <div class="content-card-brand">

                        <span
                            class="content-brand-color"
                            style="background-color:${getSafeColor(
                                brand?.primary_color
                            )}"
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
                            ?
                            `
                            <span class="content-meta-badge">

                                <i data-lucide="git-branch"></i>

                                ${escapeHtml(
                                    content.source
                                )}

                            </span>
                            `
                            :
                            ""
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


                <div class="content-card-actions">


                    <button
                        type="button"
                        class="content-view-button"
                        data-content-action="view"
                    >

                        <i data-lucide="eye"></i>

                        Ver

                    </button>



                    <div class="content-menu-wrapper">


                        <button
                            type="button"
                            class="content-menu-button"
                            aria-label="Ações do conteúdo"
                            data-content-menu-toggle
                        >

                            <i data-lucide="ellipsis"></i>

                        </button>



                        <div class="content-menu hidden">


                            ${
                                status !== "archived"
                                    ?
                                    `
                                    <button
                                        type="button"
                                        data-content-action="edit"
                                    >

                                        <i data-lucide="pencil"></i>

                                        Editar

                                    </button>
                                    `
                                    :
                                    ""
                            }

                            ${
                                status === "archived"
                                    ? `
                                        <button
                                            type="button"
                                            data-content-action="restore"
                                        >
                                            <i data-lucide="rotate-ccw"></i>
                                            Restaurar
                                        </button>
                                    `
                                    : ""
                            }



                            <button
                                type="button"
                                data-content-action="duplicate"
                            >

                                <i data-lucide="copy"></i>

                                Duplicar

                            </button>



                            ${
                                status !== "archived"
                                    ?
                                    `
                                    <button
                                        type="button"
                                        data-content-action="archive"
                                    >

                                        <i data-lucide="archive"></i>

                                        Arquivar

                                    </button>
                                    `
                                    :
                                    ""
                            }



                            <button
                                type="button"
                                class="danger"
                                data-content-action="delete"
                            >

                                <i data-lucide="trash-2"></i>

                                Excluir

                            </button>


                        </div>


                    </div>


                </div>


            </footer>

        `;

        return card;
        }


        /* ==================================================
        Aplicar filtros
        ================================================== */

        function applyContentFilters() {

            if (
                contents.length === 0 &&
                !hasActiveFilters()
            ) {
                setContentView(
                    "empty"
                );

                return;
            }


            const filteredContents =
                getFilteredContents();


            if (
                filteredContents.length === 0
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

    async function archiveContent(
        contentId
    ) {

        try {

            const {
                data,
                error
            } = await supabaseClient
                .rpc(
                    "archive_content",
                    {
                        content_id_value:
                            contentId
                    }
                );


            if (error) {
                throw error;
            }


            console.log(
                "Conteúdo arquivado:",
                data
            );


            await loadContentData();


            showToast(
                "success",
                "Conteúdo arquivado",
                "O conteúdo foi movido para arquivados."
            );


        } catch (error) {

            console.error(
                "Erro ao arquivar conteúdo:",
                error
            );


            showToast(
                "error",
                "Erro ao arquivar",
                error.message ||
                "Não foi possível arquivar o conteúdo."
            );

        }

    }


    /* ==================================================
    Renderizar conteúdos
    ================================================== */

    function renderContents(
        items
    ) {

        if (!contentGrid) {
            return;
        }


        contentGrid.innerHTML = "";


        items.forEach(
            content => {

                const card =
                    createContentCard(
                        content
                    );

                contentGrid.appendChild(
                    card
                );

            }
        );


        setContentView(
            "grid"
        );


        window.lucide
            ?.createIcons();
    }   
    
    /* ==================================================
    Exclusão de conteúdo
    ================================================== */


    function openDeleteContentModal(
        contentId
    ) {

        contentToDelete =
            contentId;


        openModal(
            deleteContentModal
        );

    }



    function closeDeleteContentModal() {

        contentToDelete =
            null;


        closeModal(
            deleteContentModal
        );

    }



    async function deleteContent() {

        if (!contentToDelete) {
            return;
        }


        try {

            const {
                error
            } =
            await supabaseClient.rpc(
                "delete_content",
                {
                    content_id_value:
                        contentToDelete
                }
            );


            if(error){
                throw error;
            }


            await loadContentData();


            showToast(
                "success",
                "Conteúdo excluído",
                "O conteúdo foi removido com sucesso."
            );


            closeDeleteContentModal();


        } catch(error) {

            console.error(
                "Erro ao excluir conteúdo:",
                error
            );


            showToast(
                "error",
                "Erro ao excluir",
                error.message ||
                "Não foi possível excluir o conteúdo."
            );

        }

    }    

    /* ==================================================
        Criação e edição
    ================================================== */

        function populateManualContentBrands() {

            if (!manualContentBrandInput) {
                return;
            }

            manualContentBrandInput.innerHTML =
                '<option value="">Selecione uma marca</option>';

            brands
                .filter(
                    brand =>
                        brand.status === "active"
                )
                .forEach(
                    brand => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value = brand.id;
                        option.textContent =
                            brand.name;

                        manualContentBrandInput.appendChild(
                            option
                        );
                    }
                );
        }

        function getSelectedManualPlatforms() {
            return Array.from(
                document.querySelectorAll(
                    'input[name="manual_content_platforms"]:checked'
                )
            ).map(
                input =>
                    input.value
            );
        }

        function setSelectedManualPlatforms(
            platforms = []
        ) {
            const normalizedPlatforms =
                Array.isArray(platforms)
                    ? platforms
                    : [];

            document
                .querySelectorAll(
                    'input[name="manual_content_platforms"]'
                )
                .forEach(
                    input => {
                        input.checked =
                            normalizedPlatforms
                                .includes(
                                    input.value
                                );
                    }
                );
        }

        function clearManualContentErrors() {
            manualContentBrandInput
                ?.classList
                .remove(
                    "is-invalid"
                );

            manualContentTitleInput
                ?.classList
                .remove(
                    "is-invalid"
                );

            if (manualContentBrandError) {
                manualContentBrandError
                    .textContent =
                    "";
            }

            if (manualContentTitleError) {
                manualContentTitleError
                    .textContent =
                    "";
            }

            if (manualContentFormError) {
                manualContentFormError
                    .textContent =
                    "";

                manualContentFormError
                    .classList
                    .add(
                        "hidden"
                    );
            }
        }

        function resetManualContentForm() {
            manualContentForm
                ?.reset();

            if (manualContentIdInput) {
                manualContentIdInput
                    .value =
                    "";
            }

            if (manualContentModalTitle) {
                manualContentModalTitle
                    .textContent =
                    "Novo conteúdo";
            }

            if (manualContentTypeInput) {
                manualContentTypeInput
                    .value =
                    "post";
            }

            if (manualContentBrandInput) {
                manualContentBrandInput
                    .disabled =
                    false;
            }

            if (manualContentSubmit) {
                manualContentSubmit
                    .disabled =
                    false;

                manualContentSubmit
                    .textContent =
                    "Criar conteúdo";
            }

            setSelectedManualPlatforms(
                []
            );

            clearManualContentErrors();
        }

        function openManualContentModal() {
            const activeBrands =
                brands.filter(
                    brand =>
                        brand.status ===
                        "active"
                );

            if (
                activeBrands.length ===
                0
            ) {
                showToast(
                    "warning",
                    "Nenhuma marca disponível",
                    "Crie ou restaure uma marca antes de criar conteúdos."
                );

                return;
            }

            resetManualContentForm();

            populateManualContentBrands();

            openModal(
                manualContentModal
            );

            window.setTimeout(
                () =>
                    manualContentTitleInput
                        ?.focus(),
                100
            );
        }

        function openEditContentModal(
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

            if (
                content.status ===
                "archived"
            ) {
                showToast(
                    "warning",
                    "Edição indisponível",
                    "Conteúdos arquivados não podem ser editados."
                );

                return;
            }

            resetManualContentForm();

            populateManualContentBrands();

            if (manualContentIdInput) {
                manualContentIdInput
                    .value =
                    content.id;
            }

            if (manualContentModalTitle) {
                manualContentModalTitle
                    .textContent =
                    "Editar conteúdo";
            }

            if (manualContentBrandInput) {
                manualContentBrandInput
                    .value =
                    content.brand_id ||
                    "";

                manualContentBrandInput
                    .disabled =
                    true;
            }

            if (manualContentTitleInput) {
                manualContentTitleInput
                    .value =
                    content.title ||
                    "";
            }

            if (manualContentBriefInput) {
                manualContentBriefInput
                    .value =
                    content.brief ||
                    "";
            }

            if (manualContentMainTextInput) {
                manualContentMainTextInput
                    .value =
                    content.main_text ||
                    "";
            }

            if (manualContentTypeInput) {
                manualContentTypeInput
                    .value =
                    getContentType(
                        content
                    );
            }

            setSelectedManualPlatforms(
                getContentPlatforms(
                    content
                )
            );

            if (manualContentSubmit) {
                manualContentSubmit
                    .textContent =
                    "Guardar alterações";
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
            }

            openModal(
                manualContentModal
            );

            window.setTimeout(
                () =>
                    manualContentTitleInput
                        ?.focus(),
                100
            );
        }

        function closeManualContentModal() {
            closeModal(
                manualContentModal
            );

            resetManualContentForm();
        }

        function setManualContentSubmitting(
            isSubmitting
        ) {
            if (!manualContentSubmit) {
                return;
            }

            const isEditing =
                Boolean(
                    manualContentIdInput
                        ?.value
                        .trim()
                );

            manualContentSubmit.disabled =
                isSubmitting;

            manualContentSubmit
                .setAttribute(
                    "aria-busy",
                    String(
                        isSubmitting
                    )
                );

            if (isSubmitting) {
                manualContentSubmit
                    .textContent =
                    isEditing
                        ? "A guardar..."
                        : "A criar...";

                return;
            }

            manualContentSubmit
                .textContent =
                isEditing
                    ? "Guardar alterações"
                    : "Criar conteúdo";
        }

        function validateManualContentForm() {
            clearManualContentErrors();

            let isValid =
                true;

            const brandId =
                manualContentBrandInput
                    ?.value ||
                "";

            const title =
                manualContentTitleInput
                    ?.value
                    .trim() ||
                "";

            if (!brandId) {
                manualContentBrandInput
                    ?.classList
                    .add(
                        "is-invalid"
                    );

                if (
                    manualContentBrandError
                ) {
                    manualContentBrandError
                        .textContent =
                        "Selecione uma marca.";
                }

                isValid =
                    false;
            }

            if (
                title.length < 2 ||
                title.length > 160
            ) {
                manualContentTitleInput
                    ?.classList
                    .add(
                        "is-invalid"
                    );

                if (
                    manualContentTitleError
                ) {
                    manualContentTitleError
                        .textContent =
                        "O título deve ter entre 2 e 160 caracteres.";
                }

                isValid =
                    false;
            }

            return isValid;
        }

        /* ==================================================
           Carregamento
        ================================================== */

        async function loadContentData() {
            if (
                !currentWorkspace
                    ?.id
            ) {
                return;
            }

            setContentView(
                "loading"
            );

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

                if (
                    brandsResult.error
                ) {
                    throw brandsResult
                        .error;
                }

                if (
                    contentsResult.error
                ) {
                    throw contentsResult
                        .error;
                }

                brands =
                    brandsResult.data ||
                    [];

                contents =
                    contentsResult.data ||
                    [];

                contents.sort(
                    (
                        first,
                        second
                    ) => {
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

                populateManualContentBrands();

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

                setContentView(
                    null
                );

                showToast(
                    "error",
                    "Erro ao carregar conteúdos",
                    error?.message ||
                    "Não foi possível carregar os conteúdos."
                );
            }
        }

        /* ==================================================
           Modais
        ================================================== */

        function openModal(
            modal
        ) {
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

        function closeModal(
            modal
        ) {
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

            const anotherModalOpen =
                document.querySelector(
                    ".modal-overlay.is-open"
                );

            if (!anotherModalOpen) {
                body.classList.remove(
                    "modal-open"
                );
            }

            lastFocusedElement
                ?.focus();
        }

        function closeContentDetailsModal() {
            closeModal(
                contentDetailsModal
            );

            selectedContentId =
                null;
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

            selectedContentId =
                content.id;

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
                contentDetailsTitle
                    .textContent =
                    content.title ||
                    "Conteúdo sem título";
            }

            if (contentDetailsStatus) {
                contentDetailsStatus
                    .className =
                    `content-status-badge is-${status}`;

                contentDetailsStatus
                    .textContent =
                    statusLabels[
                        status
                    ] ||
                    status;
            }

            if (contentDetailsBrand) {
                contentDetailsBrand
                    .textContent =
                    brand?.name ||
                    "Marca indisponível";
            }

            if (contentDetailsType) {
                contentDetailsType
                    .textContent =
                    contentTypeLabels[
                        type
                    ] ||
                    type;
            }

            if (
                contentDetailsPlatforms
            ) {
                contentDetailsPlatforms
                    .innerHTML =
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

            if (
                contentDetailsMainText
            ) {
                contentDetailsMainText
                    .textContent =
                    getContentMainText(
                        content
                    ).trim() ||
                    "Sem texto principal.";
            }

            if (
                contentDetailsCreatedAt
            ) {
                contentDetailsCreatedAt
                    .textContent =
                    `Criado em ${formatDate(
                        content.created_at
                    )}`;
            }

            if (
                contentDetailsUpdatedAt
            ) {
                contentDetailsUpdatedAt
                    .textContent =
                    `Atualizado em ${formatDate(
                        content.updated_at
                    )}`;
            }

            if (contentDetailsEdit) {
                contentDetailsEdit
                    .classList
                    .toggle(
                        "hidden",
                        status ===
                        "archived"
                    );
            }

            openModal(
                contentDetailsModal
            );

            window.lucide
                ?.createIcons();
        }

        /* ==================================================
           Envio do formulário
        ================================================== */

        manualContentForm
            ?.addEventListener(
                "submit",
                async event => {
                    event.preventDefault();

                    if (
                        !validateManualContentForm()
                    ) {
                        showToast(
                            "error",
                            "Verifique o formulário",
                            "Existem campos obrigatórios que precisam ser corrigidos."
                        );

                        return;
                    }

                    if (
                        !currentWorkspace
                            ?.id
                    ) {
                        showToast(
                            "error",
                            "Workspace indisponível",
                            "Não foi possível identificar o workspace atual."
                        );

                        return;
                    }

                    const editingContentId =
                        manualContentIdInput
                            ?.value
                            .trim() ||
                        null;

                    const isEditing =
                        Boolean(
                            editingContentId
                        );

                    setManualContentSubmitting(
                        true
                    );

                    try {
                        let data =
                            null;

                        if (isEditing) {
                            const originalContent =
                                contents.find(
                                    content =>
                                        content.id ===
                                        editingContentId
                                );

                            if (
                                !originalContent
                            ) {
                                throw new Error(
                                    "Conteúdo não encontrado para edição."
                                );
                            }

                            const {
                                data: updatedContent,
                                error: updateError
                            } =
                                await supabaseClient
                                    .rpc(
                                        "update_content",
                                        {
                                            content_id_value:
                                                editingContentId,

                                            title_value:
                                                manualContentTitleInput
                                                    .value
                                                    .trim(),

                                            brief_value:
                                                manualContentBriefInput
                                                    ?.value
                                                    .trim() ||
                                                null,

                                            main_text_value:
                                                manualContentMainTextInput
                                                    ?.value
                                                    .trim() ||
                                                null,

                                            content_type_value:
                                                manualContentTypeInput
                                                    ?.value ||
                                                "post",

                                            target_platforms_value:
                                                getSelectedManualPlatforms(),

                                            metadata_value:
                                                originalContent.metadata &&
                                                typeof originalContent.metadata ===
                                                    "object" &&
                                                !Array.isArray(
                                                    originalContent.metadata
                                                )
                                                    ? originalContent.metadata
                                                    : {}
                                        }
                                    );

                            if (updateError) {
                                throw updateError;
                            }

                            data =
                                updatedContent;
                        } else {
                            const {
                                data: createdContent,
                                error: createError
                            } =
                                await supabaseClient
                                    .rpc(
                                        "create_manual_content",
                                        {
                                            workspace_id_value:
                                                currentWorkspace.id,

                                            brand_id_value:
                                                manualContentBrandInput.value,

                                            assigned_to_value:
                                                null,

                                            title_value:
                                                manualContentTitleInput
                                                    .value
                                                    .trim(),

                                            brief_value:
                                                manualContentBriefInput
                                                    ?.value
                                                    .trim() ||
                                                null,

                                            main_text_value:
                                                manualContentMainTextInput
                                                    ?.value
                                                    .trim() ||
                                                null,

                                            content_type_value:
                                                manualContentTypeInput
                                                    ?.value ||
                                                "post",

                                            target_platforms_value:
                                                getSelectedManualPlatforms(),

                                            metadata_value:
                                                {}
                                        }
                                    );

                            if (createError) {
                                throw createError;
                            }

                            data =
                                createdContent;
                        }

                        console.log(
                            isEditing
                                ? "Conteúdo atualizado:"
                                : "Conteúdo manual criado:",
                            data
                        );

                        closeManualContentModal();

                        await loadContentData();

                        showToast(
                            "success",
                            isEditing
                                ? "Conteúdo atualizado"
                                : "Conteúdo criado",
                            isEditing
                                ? "As alterações foram guardadas com sucesso."
                                : "O conteúdo foi criado como rascunho."
                        );
                    } catch (error) {
                        console.error(
                            isEditing
                                ? "Erro ao atualizar conteúdo:"
                                : "Erro ao criar conteúdo manual:",
                            error
                        );

                        const message =
                            error?.message ||
                            (
                                isEditing
                                    ? "Não foi possível atualizar o conteúdo."
                                    : "Não foi possível criar o conteúdo."
                            );

                        if (
                            manualContentFormError
                        ) {
                            manualContentFormError
                                .textContent =
                                message;

                            manualContentFormError
                                .classList
                                .remove(
                                    "hidden"
                                );
                        }

                        showToast(
                            "error",
                            isEditing
                                ? "Erro ao atualizar conteúdo"
                                : "Erro ao criar conteúdo",
                            message
                        );
                    } finally {
                        setManualContentSubmitting(
                            false
                        );
                    }
                }
            );

        /* ==================================================
           Eventos dos filtros
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


    async function restoreContent(
        contentId
    ) {
        if (!contentId) {
            return;
        }

        try {
            const {
                data,
                error
            } = await supabaseClient.rpc(
                "restore_content",
                {
                    content_id_value:
                        contentId
                }
            );

            if (error) {
                throw error;
            }

            console.log(
                "Conteúdo restaurado:",
                data
            );

            await loadContentData();

            showToast(
                "success",
                "Conteúdo restaurado",
                "O conteúdo voltou para a listagem ativa."
            );
        } catch (error) {
            console.error(
                "Erro ao restaurar conteúdo:",
                error
            );

            showToast(
                "error",
                "Erro ao restaurar",
                error?.message ||
                "Não foi possível restaurar o conteúdo."
            );
        }
    }


    /* ==================================================
    Duplicar conteúdo
    ================================================== */

    async function duplicateContent(contentId) {

        const content =
            contents.find(
                item =>
                    item.id === contentId
            );


        if (!content) {

            showToast(
                "error",
                "Conteúdo não encontrado",
                "Não foi possível duplicar este conteúdo."
            );

            return;
        }


        try {

            const {
                data,
                error
            } = await supabaseClient
                .rpc(
                    "duplicate_content",
                    {
                        content_id_value:
                            contentId
                    }
                );


            if (error) {
                throw error;
            }


            console.log(
                "Conteúdo duplicado:",
                data
            );


            await loadContentData();


            showToast(
                "success",
                "Conteúdo duplicado",
                "Uma cópia do conteúdo foi criada com sucesso."
            );


        } catch(error) {

            console.error(
                "Erro ao duplicar conteúdo:",
                error
            );


            showToast(
                "error",
                "Erro ao duplicar",
                error.message ||
                "Não foi possível duplicar o conteúdo."
            );

        }

    }  
    
    /* ==================================================
    Ações dos conteúdos
    ================================================== */

    async function archiveContent(
        contentId
    ) {

        try {

            const {
                data,
                error
            } = await supabaseClient
                .rpc(
                    "archive_content",
                    {
                        content_id_value:
                            contentId
                    }
                );


            if (error) {
                throw error;
            }


            console.log(
                "Conteúdo arquivado:",
                data
            );


            await loadContentData();


            showToast(
                "success",
                "Conteúdo arquivado",
                "O conteúdo foi movido para arquivados."
            );


        } catch(error) {

            console.error(
                "Erro ao arquivar conteúdo:",
                error
            );


            showToast(
                "error",
                "Erro ao arquivar",
                error.message ||
                "Não foi possível arquivar o conteúdo."
            );

        }

    }    


    /* ==================================================
    Eventos dos cartões
    ================================================== */

    contentGrid
        ?.addEventListener(
            "click",
            async event => {

                // Abrir / fechar menu dos 3 pontos
                const menuButton =
                    event.target.closest(
                        "[data-content-menu-toggle]"
                    );


                if (menuButton) {

                    const currentCard =
                        menuButton.closest(
                            "[data-content-id]"
                        );


                    const currentMenu =
                        currentCard?.querySelector(
                            ".content-menu"
                        );


                    document
                        .querySelectorAll(
                            ".content-menu"
                        )
                        .forEach(
                            menu => {

                                if (
                                    menu !== currentMenu
                                ) {
                                    menu.classList.add(
                                        "hidden"
                                    );
                                }

                            }
                        );


                    currentMenu?.classList.toggle(
                        "hidden"
                    );


                    return;
                }



                // Ações do conteúdo
                const actionButton =
                    event.target.closest(
                        "[data-content-action]"
                    );


                if (!actionButton) {
                    return;
                }


                const card =
                    actionButton.closest(
                        "[data-content-id]"
                    );


                const contentId =
                    card?.dataset.contentId;


                const action =
                    actionButton.dataset
                        .contentAction;


                if (!contentId) {
                    return;
                }



                if (
                    action === "view"
                ) {

                    openContentDetails(
                        contentId
                    );

                    return;
                }



                if (
                    action === "edit"
                ) {

                    openEditContentModal(
                        contentId
                    );

                    return;
                }



                if (
                    action === "duplicate"
                ) {

                    duplicateContent(
                        contentId
                    );

                    return;
                }



                if (
                    action === "archive"
                ) {

                    archiveContent(
                        contentId
                    );

                    return;
                }

                if (
                    action === "restore"
                ) {
                    await restoreContent(
                        contentId
                    );

                    return;
                }

                if (
                    action === "delete"
                ) {

                    openDeleteContentModal(
                        contentId
                    );

                    return;
                }

            }
        );



    /* Fecha menus ao clicar fora */

    document.addEventListener(
        "click",
        event => {

            if (
                !event.target.closest(
                    ".content-menu-wrapper"
                )
            ) {

                document
                    .querySelectorAll(
                        ".content-menu"
                    )
                    .forEach(
                        menu => {

                            menu.classList.add(
                                "hidden"
                            );

                        }
                    );

            }

        }
    );


    
    deleteContentCancel
    ?.addEventListener(
        "click",
        () => {

            closeDeleteContentModal();

        }
    );



    deleteContentConfirm
    ?.addEventListener(
        "click",
        () => {

            deleteContent();

        }
    );

        /* ==================================================
           Eventos do modal manual
        ================================================== */

        createContentButton
            ?.addEventListener(
                "click",
                openManualContentModal
            );

        manualContentModalClose
            ?.addEventListener(
                "click",
                event => {
                    event.preventDefault();

                    closeManualContentModal();
                }
            );

        manualContentCancel
            ?.addEventListener(
                "click",
                event => {
                    event.preventDefault();

                    closeManualContentModal();
                }
            );

        manualContentModal
            ?.addEventListener(
                "click",
                event => {
                    if (
                        event.target ===
                        manualContentModal
                    ) {
                        closeManualContentModal();
                    }
                }
            );

        manualContentBrandInput
            ?.addEventListener(
                "change",
                () => {
                    manualContentBrandInput
                        .classList
                        .remove(
                            "is-invalid"
                        );

                    if (
                        manualContentBrandError
                    ) {
                        manualContentBrandError
                            .textContent =
                            "";
                    }
                }
            );

        manualContentTitleInput
            ?.addEventListener(
                "input",
                () => {
                    manualContentTitleInput
                        .classList
                        .remove(
                            "is-invalid"
                        );

                    if (
                        manualContentTitleError
                    ) {
                        manualContentTitleError
                            .textContent =
                            "";
                    }
                }
            );

        /* ==================================================
           Eventos do modal de detalhes
        ================================================== */

        contentDetailsClose
            ?.addEventListener(
                "click",
                event => {
                    event.preventDefault();

                    closeContentDetailsModal();
                }
            );

        contentDetailsCancel
            ?.addEventListener(
                "click",
                event => {
                    event.preventDefault();

                    closeContentDetailsModal();
                }
            );

        contentDetailsEdit
            ?.addEventListener(
                "click",
                event => {
                    event.preventDefault();

                    const contentId =
                        selectedContentId;

                    if (!contentId) {
                        return;
                    }

                    openEditContentModal(
                        contentId
                    );
                }
            );

        contentDetailsModal
            ?.addEventListener(
                "click",
                event => {
                    if (
                        event.target ===
                        contentDetailsModal
                    ) {
                        closeContentDetailsModal();
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

        /* ==================================================
           Tecla Escape
        ================================================== */

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
                    manualContentModal
                        ?.classList
                        .contains(
                            "is-open"
                        )
                ) {
                    closeManualContentModal();

                    return;
                }

                if (
                    contentDetailsModal
                        ?.classList
                        .contains(
                            "is-open"
                        )
                ) {
                    closeContentDetailsModal();

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

            setContentView(
                null
            );

            showToast(
                "error",
                "Erro ao iniciar Conteúdos",
                error?.message ||
                "Não foi possível iniciar a página."
            );
        }

        window.lucide
            ?.createIcons();
    }
);
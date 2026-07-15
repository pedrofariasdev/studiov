"use strict";

/* ==========================================================
   StudioV — Planner
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    /* ======================================================
       Elementos gerais
    ====================================================== */

    const body = document.body;

    const sidebarOpenButton = document.getElementById(
        "topbar-menu-button"
    );

    const sidebarCloseButton = document.getElementById(
        "sidebar-close"
    );

    const sidebarOverlay = document.getElementById(
        "sidebar-overlay"
    );

    const currentWorkspaceName = document.getElementById(
        "current-workspace-name"
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

    const toastContainer = document.getElementById(
        "toast-container"
    );

    /* ======================================================
       Elementos do Planner
    ====================================================== */

    const plannerLoading = document.getElementById(
        "planner-loading"
    );

    const plannerEmpty = document.getElementById(
        "planner-empty"
    );

    const plannerNoResults = document.getElementById(
        "planner-no-results"
    );

    const plannerBoard = document.getElementById(
        "planner-board"
    );

    const plannerArchived = document.getElementById(
        "planner-archived"
    );

    const plannerArchivedList = document.getElementById(
        "planner-archived-list"
    );

    const archivedItemsCount = document.getElementById(
        "archived-items-count"
    );

    const plannerSearchInput = document.getElementById(
        "planner-search-input"
    );

    const plannerBrandFilter = document.getElementById(
        "planner-brand-filter"
    );

    const plannerPriorityFilter = document.getElementById(
        "planner-priority-filter"
    );

    const plannerAssigneeFilter = document.getElementById(
        "planner-assignee-filter"
    );

    const plannerArchiveToggle = document.getElementById(
        "planner-archive-toggle"
    );

    const clearPlannerFiltersButton = document.getElementById(
        "clear-planner-filters-button"
    );

    /* ======================================================
       Contadores
    ====================================================== */

    const plannerTotalCount = document.getElementById(
        "planner-total-count"
    );

    const plannerOverdueCount = document.getElementById(
        "planner-overdue-count"
    );

    const plannerReviewCount = document.getElementById(
        "planner-review-count"
    );

    const plannerApprovedCount = document.getElementById(
        "planner-approved-count"
    );

    const statusColumns = {
        idea: {
            container: document.getElementById(
                "idea-column"
            ),
            counter: document.getElementById(
                "idea-count"
            ),
            emptyText: "Nenhuma ideia"
        },

        planned: {
            container: document.getElementById(
                "planned-column"
            ),
            counter: document.getElementById(
                "planned-count"
            ),
            emptyText: "Nenhum conteúdo planeado"
        },

        in_progress: {
            container: document.getElementById(
                "in-progress-column"
            ),
            counter: document.getElementById(
                "in-progress-count"
            ),
            emptyText: "Nenhum conteúdo em produção"
        },

        review: {
            container: document.getElementById(
                "review-column"
            ),
            counter: document.getElementById(
                "review-count"
            ),
            emptyText: "Nenhum conteúdo em revisão"
        },

        approved: {
            container: document.getElementById(
                "approved-column"
            ),
            counter: document.getElementById(
                "approved-count"
            ),
            emptyText: "Nenhum conteúdo aprovado"
        },

        converted: {
            container: document.getElementById(
                "converted-column"
            ),
            counter: document.getElementById(
                "converted-count"
            ),
            emptyText: "Nenhum conteúdo convertido"
        }
    };

    /* ======================================================
       Modal de criação
    ====================================================== */

    const createPlanItemButton = document.getElementById(
        "create-plan-item-button"
    );

    const emptyCreatePlanItemButton = document.getElementById(
        "empty-create-plan-item-button"
    );

    const planItemModal = document.getElementById(
        "plan-item-modal"
    );

    const planItemModalTitle = document.getElementById(
        "plan-item-modal-title"
    );

    const planItemModalClose = document.getElementById(
        "plan-item-modal-close"
    );

    const planItemFormCancel = document.getElementById(
        "plan-item-form-cancel"
    );

    const planItemForm = document.getElementById(
        "plan-item-form"
    );

    const planItemIdInput = document.getElementById(
        "plan-item-id"
    );

    const planItemBrandInput = document.getElementById(
        "plan-item-brand"
    );

    const planItemBrandError = document.getElementById(
        "plan-item-brand-error"
    );

    const planItemAssignedToInput = document.getElementById(
        "plan-item-assigned-to"
    );

    const planItemTitleInput = document.getElementById(
        "plan-item-title"
    );

    const planItemTitleError = document.getElementById(
        "plan-item-title-error"
    );

    const planItemTitleCounter = document.getElementById(
        "plan-item-title-counter"
    );

    const planItemBriefInput = document.getElementById(
        "plan-item-brief"
    );

    const planItemBriefCounter = document.getElementById(
        "plan-item-brief-counter"
    );

    const planItemContentTypeInput = document.getElementById(
        "plan-item-content-type"
    );

    const planItemSourceInput = document.getElementById(
        "plan-item-source"
    );

    const planItemPriorityInput = document.getElementById(
        "plan-item-priority"
    );

    const planItemDueDateInput = document.getElementById(
        "plan-item-due-date"
    );

    const planItemFormError = document.getElementById(
        "plan-item-form-error"
    );

    const planItemFormSubmit = document.getElementById(
        "plan-item-form-submit"
    );

    const planItemFormSubmitText = document.getElementById(
        "plan-item-form-submit-text"
    );

    const planItemFormLoader = document.getElementById(
        "plan-item-form-loader"
    );

    const archivePlanItemModal = document.getElementById(
        "archive-plan-item-modal"
    );

    const archivePlanItemCancel = document.getElementById(
        "archive-plan-item-cancel"
    );

    const archivePlanItemConfirm = document.getElementById(
        "archive-plan-item-confirm"
    );

    const convertPlanItemModal = document.getElementById(
        "convert-plan-item-modal"
    );

    const convertPlanItemModalClose = document.getElementById(
        "convert-plan-item-modal-close"
    );

    const convertContentForm = document.getElementById(
        "convert-content-form"
    );

    const convertPlanItemIdInput = document.getElementById(
        "convert-plan-item-id"
    );

    const convertContentTitleInput = document.getElementById(
        "convert-content-title"
    );

    const convertContentTitleError = document.getElementById(
        "convert-content-title-error"
    );

    const convertContentMainTextInput = document.getElementById(
        "convert-content-main-text"
    );

    const convertContentFormError = document.getElementById(
        "convert-content-form-error"
    );

    const convertContentCancel = document.getElementById(
        "convert-content-cancel"
    );

    const convertContentSubmit = document.getElementById(
        "convert-content-submit"
    );

    /* ======================================================
       Estado
    ====================================================== */

    const supabaseClient = window.supabaseClient;

    let currentUser = null;
    let currentWorkspace = null;

    let plannerItems = [];
    let brands = [];
    let members = [];

    let showArchivedItems = false;
    let lastFocusedElement = null;
    let draggedPlanItemId = null;
    let isMovingPlanItem = false;
    let selectedArchivePlanItemId = null;

    /* ======================================================
       Mapas de apresentação
    ====================================================== */

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

    const priorityLabels = {
        low: "Baixa",
        medium: "Média",
        high: "Alta",
        urgent: "Urgente"
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

    const plannerStatusLabels = {
        idea: "Ideias",
        planned: "Planeado",
        in_progress: "Em produção",
        review: "Em revisão",
        approved: "Aprovado"
    };

    /* ======================================================
       Utilitários
    ====================================================== */

    function escapeHtml(value = "") {
        const element = document.createElement("div");

        element.textContent = String(value);

        return element.innerHTML;
    }

    function normalizeSearchText(value = "") {
        return String(value)
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function getSafeColor(
        value,
        fallback = "#6D28D9"
    ) {
        return /^#[0-9A-F]{6}$/i.test(value || "")
            ? value
            : fallback;
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

    function formatDate(value) {
        if (!value) {
            return "Sem prazo";
        }

        const date = new Date(
            `${value}T00:00:00`
        );

        if (Number.isNaN(date.getTime())) {
            return "Data inválida";
        }

        return new Intl.DateTimeFormat(
            "pt-PT",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        ).format(date);
    }

    function formatArchivedDate(value) {
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
                year: "numeric"
            }
        ).format(date);
    }

    function isItemOverdue(item) {
        if (
            !item.due_date ||
            item.status === "approved" ||
            item.status === "converted" ||
            item.status === "archived"
        ) {
            return false;
        }

        const dueDate = new Date(
            `${item.due_date}T00:00:00`
        );

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        return dueDate.getTime() < today.getTime();
    }

    function getBrandById(brandId) {
        return brands.find(
            brand => brand.id === brandId
        ) || null;
    }

    function getMemberById(userId) {
        return members.find(
            member => member.id === userId
        ) || null;
    }

    function getSelectedPlatforms() {
        return Array.from(
            document.querySelectorAll(
                'input[name="target_platforms"]:checked'
            )
        ).map(input => input.value);
    }

    function setSelectedPlatforms(platforms = []) {
        const normalizedPlatforms = Array.isArray(platforms)
            ? platforms
            : [];

        document
            .querySelectorAll(
                'input[name="target_platforms"]'
            )
            .forEach(input => {
                input.checked =
                    normalizedPlatforms.includes(
                        input.value
                    );
            });
    }    

    /* ======================================================
       Toasts
    ====================================================== */

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
                type="button"
                class="toast-close"
                aria-label="Fechar mensagem"
            >
                <i data-lucide="x"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        toast
            .querySelector(".toast-close")
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

    /* ======================================================
       Perfil e workspace
    ====================================================== */

    async function loadUserProfile(userId) {
        const { data, error } =
            await supabaseClient
                .from("profiles")
                .select("id, full_name")
                .eq("id", userId)
                .maybeSingle();

        if (error) {
            console.warn(
                "Não foi possível carregar o perfil:",
                error.message
            );

            return null;
        }

        return data;
    }

    async function loadCurrentWorkspace(userId) {
        const {
            data: membership,
            error: membershipError
        } = await supabaseClient
            .from("workspace_members")
            .select(
                "workspace_id, role, status, created_at"
            )
            .eq("user_id", userId)
            .eq("status", "active")
            .order("created_at", {
                ascending: true
            })
            .limit(1)
            .maybeSingle();

        if (membershipError) {
            throw membershipError;
        }

        if (!membership?.workspace_id) {
            throw new Error(
                "O utilizador não possui um workspace ativo."
            );
        }

        const {
            data: workspace,
            error: workspaceError
        } = await supabaseClient
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

        const avatarLetter = fullName
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

        const [profile, workspace] =
            await Promise.all([
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
            "Contexto do Planner carregado:",
            {
                userId: user.id,
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                role: workspace.role
            }
        );

        return true;
    }

    /* ======================================================
       Estados visuais
    ====================================================== */

    function setPlannerView(view) {
        plannerLoading?.classList.toggle(
            "hidden",
            view !== "loading"
        );

        plannerEmpty?.classList.toggle(
            "hidden",
            view !== "empty"
        );

        plannerNoResults?.classList.toggle(
            "hidden",
            view !== "no-results"
        );

        plannerBoard?.classList.toggle(
            "hidden",
            view !== "board"
        );

        plannerArchived?.classList.toggle(
            "hidden",
            view !== "archived"
        );
    }

    /* ======================================================
       Carregamento de membros
    ====================================================== */

    async function loadWorkspaceMembers() {
        const {
            data: membershipRows,
            error: membershipError
        } = await supabaseClient
            .from("workspace_members")
            .select("user_id, role, status")
            .eq(
                "workspace_id",
                currentWorkspace.id
            )
            .eq("status", "active");

        if (membershipError) {
            throw membershipError;
        }

        const userIds = (
            membershipRows || []
        )
            .map(row => row.user_id)
            .filter(Boolean);

        if (userIds.length === 0) {
            members = [];
            return;
        }

        const {
            data: profiles,
            error: profilesError
        } = await supabaseClient
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);

        if (profilesError) {
            throw profilesError;
        }

        members = userIds.map(userId => {
            const profile = profiles?.find(
                item => item.id === userId
            );

            const membership =
                membershipRows.find(
                    item => item.user_id === userId
                );

            return {
                id: userId,

                full_name:
                    profile?.full_name?.trim() ||
                    "Utilizador",

                role:
                    membership?.role ||
                    "member"
            };
        });
    }

    /* ======================================================
       Preenchimento dos filtros e formulários
    ====================================================== */

    function populateBrandOptions() {
        if (
            !plannerBrandFilter ||
            !planItemBrandInput
        ) {
            return;
        }

        plannerBrandFilter.innerHTML = `
            <option value="all">
                Todas as marcas
            </option>
        `;

        planItemBrandInput.innerHTML = `
            <option value="">
                Selecione uma marca
            </option>
        `;

        brands.forEach(brand => {
            const archivedLabel =
                brand.status === "archived"
                    ? " — Arquivada"
                    : "";

            const filterOption =
                document.createElement("option");

            filterOption.value = brand.id;

            filterOption.textContent =
                `${brand.name}${archivedLabel}`;

            plannerBrandFilter.appendChild(
                filterOption
            );

            if (brand.status !== "archived") {
                const formOption =
                    document.createElement("option");

                formOption.value = brand.id;
                formOption.textContent = brand.name;

                planItemBrandInput.appendChild(
                    formOption
                );
            }
        });
    }

    function populateMemberOptions() {
        if (
            !plannerAssigneeFilter ||
            !planItemAssignedToInput
        ) {
            return;
        }

        plannerAssigneeFilter.innerHTML = `
            <option value="all">
                Todos os responsáveis
            </option>

            <option value="unassigned">
                Sem responsável
            </option>
        `;

        planItemAssignedToInput.innerHTML = `
            <option value="">
                Sem responsável
            </option>
        `;

        members.forEach(member => {
            const filterOption =
                document.createElement("option");

            filterOption.value = member.id;

            filterOption.textContent =
                member.full_name;

            plannerAssigneeFilter.appendChild(
                filterOption
            );

            const formOption =
                document.createElement("option");

            formOption.value = member.id;
            formOption.textContent =
                member.full_name;

            planItemAssignedToInput.appendChild(
                formOption
            );
        });
    }

    /* ======================================================
       Contadores
    ====================================================== */

    function updatePlannerCounters() {
        const activeItems = plannerItems.filter(
            item => item.status !== "archived"
        );

        const overdueItems = activeItems.filter(
            isItemOverdue
        );

        const reviewItems = activeItems.filter(
            item => item.status === "review"
        );

        const approvedItems = activeItems.filter(
            item => item.status === "approved"
        );

        if (plannerTotalCount) {
            plannerTotalCount.textContent =
                String(activeItems.length);
        }

        if (plannerOverdueCount) {
            plannerOverdueCount.textContent =
                String(overdueItems.length);
        }

        if (plannerReviewCount) {
            plannerReviewCount.textContent =
                String(reviewItems.length);
        }

        if (plannerApprovedCount) {
            plannerApprovedCount.textContent =
                String(approvedItems.length);
        }
    }

    /* ======================================================
       Filtros
    ====================================================== */

    function getFilteredItems() {
        const searchTerm = normalizeSearchText(
            plannerSearchInput?.value || ""
        );

        const selectedBrand =
            plannerBrandFilter?.value || "all";

        const selectedPriority =
            plannerPriorityFilter?.value || "all";

        const selectedAssignee =
            plannerAssigneeFilter?.value || "all";

        const expectedStatus =
            showArchivedItems
                ? "archived"
                : "active";

        return plannerItems.filter(item => {
            const matchesArchiveMode =
                expectedStatus === "archived"
                    ? item.status === "archived"
                    : item.status !== "archived";

            const matchesBrand =
                selectedBrand === "all" ||
                item.brand_id === selectedBrand;

            const matchesPriority =
                selectedPriority === "all" ||
                item.priority === selectedPriority;

            const matchesAssignee =
                selectedAssignee === "all" ||
                (
                    selectedAssignee ===
                        "unassigned" &&
                    !item.assigned_to
                ) ||
                item.assigned_to ===
                    selectedAssignee;

            const searchableText =
                normalizeSearchText(
                    [
                        item.title,
                        item.brief,
                        item.content_type,
                        item.source
                    ]
                        .filter(Boolean)
                        .join(" ")
                );

            const matchesSearch =
                searchTerm === "" ||
                searchableText.includes(
                    searchTerm
                );

            return (
                matchesArchiveMode &&
                matchesBrand &&
                matchesPriority &&
                matchesAssignee &&
                matchesSearch
            );
        });
    }

    function hasActiveFilters() {
        return Boolean(
            plannerSearchInput?.value.trim() ||
            plannerBrandFilter?.value !== "all" ||
            plannerPriorityFilter?.value !== "all" ||
            plannerAssigneeFilter?.value !== "all"
        );
    }

    /* ======================================================
       Cartões do quadro
    ====================================================== */

    function createPlanItemCard(item) {
        const brand = getBrandById(
            item.brand_id
        );

        const member = getMemberById(
            item.assigned_to
        );

        const overdue = isItemOverdue(item);

        const canEdit =
            item.status !== "archived" &&
            item.status !== "converted";

        const card = document.createElement(
            "article"
        );

        card.className = [
            "plan-item-card",
            overdue
                ? "is-overdue"
                : ""
        ]
            .filter(Boolean)
            .join(" ");

            card.dataset.planItemId = item.id;
            card.dataset.planItemStatus = item.status;

            const canMove =
                item.status !== "archived" &&
                item.status !== "converted";

            card.setAttribute(
                "draggable",
                String(canMove)
            );

            if (canMove) {
                card.style.cursor = "grab";
            } else {
                card.classList.add("is-locked");
                card.style.cursor = "default";
            }

        const platforms = Array.isArray(
            item.target_platforms
        )
            ? item.target_platforms
            : [];

        const platformsHtml =
            platforms.length > 0
                ? platforms
                    .slice(0, 5)
                    .map(platform => `
                        <span class="plan-item-platform">
                            ${escapeHtml(
                                platformLabels[platform] ||
                                platform
                            )}
                        </span>
                    `)
                    .join("")
                : `
                    <span class="plan-item-platform">
                        Sem plataforma
                    </span>
                `;

        const assigneeHtml = member
            ? `
                <span
                    class="plan-item-assignee"
                    title="${escapeHtml(
                        member.full_name
                    )}"
                >
                    ${escapeHtml(
                        getInitials(
                            member.full_name
                        )
                    )}
                </span>
            `
            : `
                <span
                    class="plan-item-assignee is-unassigned"
                    title="Sem responsável"
                >
                    <i data-lucide="user-round"></i>
                </span>
            `;

            const moveActionsHtml = canMove
                ? Object.entries(
                    plannerStatusLabels
                )
                    .filter(
                        ([status]) =>
                            status !== item.status
                    )
                    .map(
                        ([status, label]) => `
                            <button
                                type="button"
                                class="plan-item-action"
                                data-plan-action="move"
                                data-target-status="${status}"
                            >
                                <i data-lucide="arrow-right"></i>

                                ${escapeHtml(label)}
                            </button>
                        `
                    )
                    .join("")
                : "";            

            const canArchive =
                item.status !== "archived";

            const canConvert =
                item.status === "approved";

            const actionsHtml = canArchive
                ? `
                    <button
                        type="button"
                        class="plan-item-menu-button"
                        data-plan-menu-button
                        aria-label="Abrir ações do item"
                        aria-expanded="false"
                    >
                        <i data-lucide="ellipsis"></i>
                    </button>

                    <div
                        class="plan-item-actions hidden"
                        data-plan-actions
                    >
                        ${
                            canEdit
                                ? `
                                    <button
                                        type="button"
                                        class="plan-item-action is-primary"
                                        data-plan-action="edit"
                                    >
                                        <i data-lucide="pencil"></i>
                                        Editar item
                                    </button>
                                `
                                : ""
                        }

                        ${
                            canMove
                                ? `
                                    <div class="plan-item-actions-divider"></div>

                                    <span class="plan-item-actions-label">
                                        Mover para
                                    </span>

                                    ${moveActionsHtml}
                                `
                                : ""
                        }

                        ${
                            canConvert
                                ? `
                                    <div class="plan-item-actions-divider"></div>

                                    <button
                                        type="button"
                                        class="plan-item-action is-primary"
                                        data-plan-action="convert"
                                    >
                                        <i data-lucide="file-plus-2"></i>
                                        Criar conteúdo
                                    </button>
                                `
                                : ""
                        }

                        <div class="plan-item-actions-divider"></div>

                        <button
                            type="button"
                            class="plan-item-action is-danger"
                            data-plan-action="archive"
                        >
                            <i data-lucide="archive"></i>
                            Arquivar item
                        </button>
                    </div>
                `
                : "";

        card.innerHTML = `
            <header class="plan-item-card-header">

                <div class="plan-item-card-brand">

                    <span
                        class="plan-item-brand-color"
                        style="background-color: ${
                            getSafeColor(
                                brand?.primary_color
                            )
                        }"
                    ></span>

                    <span class="plan-item-brand-name">
                        ${escapeHtml(
                            brand?.name ||
                            "Marca indisponível"
                        )}
                    </span>

                </div>

                ${actionsHtml}

            </header>

            <h3 class="plan-item-title">
                ${escapeHtml(item.title)}
            </h3>

            <p class="plan-item-brief">
                ${escapeHtml(
                    item.brief?.trim() ||
                    "Sem brief definido."
                )}
            </p>

            <div class="plan-item-meta">

                <span class="plan-item-badge is-type">
                    <i data-lucide="file-text"></i>

                    ${escapeHtml(
                        contentTypeLabels[
                            item.content_type
                        ] ||
                        item.content_type
                    )}
                </span>

                <span class="plan-item-badge is-${
                    escapeHtml(item.priority)
                }">
                    <i data-lucide="flag"></i>

                    ${escapeHtml(
                        priorityLabels[
                            item.priority
                        ] ||
                        item.priority
                    )}
                </span>

            </div>

            <div class="plan-item-platforms">
                ${platformsHtml}
            </div>

            <footer class="plan-item-card-footer">

                <span class="plan-item-due-date ${
                    overdue
                        ? "is-overdue"
                        : ""
                }">
                    <i data-lucide="calendar-days"></i>

                    ${escapeHtml(
                        formatDate(
                            item.due_date
                        )
                    )}
                </span>

                ${assigneeHtml}

            </footer>
        `;

        if (canMove) {
            card.addEventListener(
                "dragstart",
                event => {
                    const interactiveElement =
                        event.target.closest(
                            "button, a, input, select, textarea"
                        );

                    if (interactiveElement) {
                        event.preventDefault();
                        return;
                    }

                    draggedPlanItemId = item.id;

                    if (event.dataTransfer) {
                        event.dataTransfer.effectAllowed =
                            "move";

                        event.dataTransfer.setData(
                            "text/plain",
                            item.id
                        );
                    }

                    window.setTimeout(
                        () => {
                            card.classList.add(
                                "is-dragging"
                            );
                        },
                        0
                    );

                    closeAllPlanItemMenus();

                    console.log(
                        "Arraste iniciado:",
                        item.id,
                        item.status
                    );
                }
            );

            card.addEventListener(
                "dragend",
                () => {
                    draggedPlanItemId = null;

                    clearDragStates();

                    console.log(
                        "Arraste finalizado:",
                        item.id
                    );
                }
            );
        }

        return card;
    }

    function renderBoard(items) {
        Object.values(statusColumns).forEach(
            column => {
                if (column.container) {
                    column.container.innerHTML = "";
                }

                if (column.counter) {
                    column.counter.textContent = "0";
                }
            }
        );

        Object.entries(statusColumns).forEach(
            ([status, column]) => {
                const statusItems = items
                    .filter(
                        item => item.status === status
                    )
                    .sort(
                        (first, second) =>
                            Number(first.position) -
                            Number(second.position)
                    );

                if (column.counter) {
                    column.counter.textContent =
                        String(statusItems.length);
                }

                if (!column.container) {
                    return;
                }

                if (statusItems.length === 0) {
                    column.container.innerHTML = `
                        <div class="planner-column-empty">
                            ${escapeHtml(
                                column.emptyText
                            )}
                        </div>
                    `;

                    return;
                }

                statusItems.forEach(item => {
                    column.container.appendChild(
                        createPlanItemCard(item)
                    );
                });
            }
        );

        setPlannerView("board");

        window.lucide?.createIcons();
    }

    /* ======================================================
       Arquivados
    ====================================================== */

    function renderArchivedItems(items) {
        if (
            !plannerArchivedList ||
            !archivedItemsCount
        ) {
            return;
        }

        plannerArchivedList.innerHTML = "";

        archivedItemsCount.textContent =
            `${items.length} ${
                items.length === 1
                    ? "item"
                    : "itens"
            }`;

        items.forEach(item => {
            const brand = getBrandById(
                item.brand_id
            );

            const card = document.createElement(
                "article"
            );

            card.className =
                "archived-plan-item";

            card.dataset.planItemId = item.id;

            card.innerHTML = `
                <div class="archived-plan-item-header">

                    <div>

                        <span
                            class="plan-item-brand-name"
                        >
                            ${escapeHtml(
                                brand?.name ||
                                "Marca indisponível"
                            )}
                        </span>

                        <h3>
                            ${escapeHtml(item.title)}
                        </h3>

                    </div>

                </div>

                <p>
                    ${escapeHtml(
                        item.brief?.trim() ||
                        "Sem brief definido."
                    )}
                </p>

                <div class="archived-plan-item-footer">

                    <span>
                        Arquivado em
                        ${escapeHtml(
                            formatArchivedDate(
                                item.archived_at
                            )
                        )}
                    </span>

                    <button
                        type="button"
                        class="restore-plan-item-button"
                        data-plan-action="restore"
                    >
                        <i data-lucide="rotate-ccw"></i>
                        Restaurar
                    </button>

                </div>
            `;

            plannerArchivedList.appendChild(
                card
            );
        });

        setPlannerView("archived");
        window.lucide?.createIcons();
    }

    /* ======================================================
       Aplicação dos filtros
    ====================================================== */

    function applyPlannerFilters() {
        const activeItems = plannerItems.filter(
            item => item.status !== "archived"
        );

        const archivedItems = plannerItems.filter(
            item => item.status === "archived"
        );

        const filteredItems =
            getFilteredItems();

        if (
            !showArchivedItems &&
            activeItems.length === 0 &&
            !hasActiveFilters()
        ) {
            setPlannerView("empty");
            return;
        }

        if (
            showArchivedItems &&
            archivedItems.length === 0 &&
            !hasActiveFilters()
        ) {
            renderArchivedItems([]);
            return;
        }

        if (filteredItems.length === 0) {
            setPlannerView("no-results");
            return;
        }

        if (showArchivedItems) {
            renderArchivedItems(filteredItems);
            return;
        }

        renderBoard(filteredItems);
    }

    /* ======================================================
       Carregamento dos dados
    ====================================================== */

    async function loadPlannerData() {
        if (!currentWorkspace?.id) {
            return;
        }

        setPlannerView("loading");

        try {
            const [
                brandsResult,
                plannerResult
            ] = await Promise.all([
                supabaseClient
                    .from("brands")
                    .select(`
                        id,
                        workspace_id,
                        name,
                        primary_color,
                        status
                    `)
                    .eq(
                        "workspace_id",
                        currentWorkspace.id
                    )
                    .order("name", {
                        ascending: true
                    }),

                supabaseClient
                    .from("content_plan_items")
                    .select(`
                        id,
                        workspace_id,
                        brand_id,
                        created_by,
                        assigned_to,
                        title,
                        brief,
                        content_type,
                        target_platforms,
                        source,
                        priority,
                        status,
                        due_date,
                        position,
                        metadata,
                        status_before_archive,
                        created_at,
                        updated_at,
                        archived_at
                    `)
                    .eq(
                        "workspace_id",
                        currentWorkspace.id
                    )
                    .order("position", {
                        ascending: true
                    })
            ]);

            if (brandsResult.error) {
                throw brandsResult.error;
            }

            if (plannerResult.error) {
                throw plannerResult.error;
            }

            brands =
                brandsResult.data || [];

            plannerItems =
                plannerResult.data || [];

            await loadWorkspaceMembers();

            populateBrandOptions();
            populateMemberOptions();
            updatePlannerCounters();
            applyPlannerFilters();

            console.log(
                "Planner carregado:",
                {
                    items:
                        plannerItems.length,

                    brands:
                        brands.length,

                    members:
                        members.length
                }
            );
        } catch (error) {
            console.error(
                "Erro ao carregar Planner:",
                error
            );

            setPlannerView(null);

            showToast(
                "error",
                "Erro ao carregar Planner",
                error?.message ||
                "Não foi possível carregar os itens do Planner."
            );
        }
    }

    /* ======================================================
       Modal
    ====================================================== */

    function openModal(modal) {
        if (!modal) {
            return;
        }

        lastFocusedElement =
            document.activeElement;

        modal.classList.remove("hidden");
        modal.classList.add("is-open");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        body.classList.add("modal-open");
    }

    function closeModal(modal) {
        if (!modal) {
            return;
        }

        modal.classList.remove("is-open");
        modal.classList.add("hidden");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        if (
            !document.querySelector(
                ".modal-overlay.is-open"
            )
        ) {
            body.classList.remove(
                "modal-open"
            );
        }

        lastFocusedElement?.focus();
    }

    function clearPlanItemFormErrors() {
        planItemBrandInput?.classList.remove(
            "is-invalid"
        );

        planItemTitleInput?.classList.remove(
            "is-invalid"
        );

        if (planItemBrandError) {
            planItemBrandError.textContent = "";
        }

        if (planItemTitleError) {
            planItemTitleError.textContent = "";
        }

        if (planItemFormError) {
            planItemFormError.textContent = "";

            planItemFormError.classList.add(
                "hidden"
            );
        }
    }

    function updateFormCounters() {
        if (
            planItemTitleInput &&
            planItemTitleCounter
        ) {
            planItemTitleCounter.textContent =
                `${planItemTitleInput.value.length}/160`;
        }

        if (
            planItemBriefInput &&
            planItemBriefCounter
        ) {
            planItemBriefCounter.textContent =
                `${planItemBriefInput.value.length}/10000`;
        }
    }

    function resetPlanItemForm() {
        planItemForm?.reset();

        if (planItemBrandInput) {
            planItemBrandInput.disabled = false;
        }

        if (planItemSourceInput) {
            planItemSourceInput.disabled = false;
        }

        if (planItemAssignedToInput) {
            planItemAssignedToInput.disabled = false;
        }    

        if (planItemIdInput) {
            planItemIdInput.value = "";
        }

        if (planItemModalTitle) {
            planItemModalTitle.textContent =
                "Novo item";
        }

        if (planItemContentTypeInput) {
            planItemContentTypeInput.value =
                "post";
        }

        if (planItemSourceInput) {
            planItemSourceInput.value =
                "manual";
        }

        if (planItemPriorityInput) {
            planItemPriorityInput.value =
                "medium";
        }

        if (planItemFormSubmitText) {
            planItemFormSubmitText.textContent =
                "Criar item";
        }

        clearPlanItemFormErrors();
        updateFormCounters();
    }

    function openCreatePlanItemModal() {
        const activeBrands = brands.filter(
            brand => brand.status !== "archived"
        );

        if (activeBrands.length === 0) {
            showToast(
                "warning",
                "Nenhuma marca disponível",
                "Crie ou restaure uma marca antes de adicionar itens ao Planner."
            );

            return;
        }

        resetPlanItemForm();
        openModal(planItemModal);

        window.setTimeout(
            () => planItemTitleInput?.focus(),
            100
        );
    }

    function openEditPlanItemModal(itemId) {
        const item = plannerItems.find(
            plannerItem => plannerItem.id === itemId
        );

        if (!item) {
            showToast(
                "error",
                "Item não encontrado",
                "Não foi possível carregar o item selecionado."
            );

            return;
        }

        if (
            item.status === "archived" ||
            item.status === "converted"
        ) {
            showToast(
                "warning",
                "Edição indisponível",
                "Itens arquivados ou convertidos não podem ser editados."
            );

            return;
        }

        resetPlanItemForm();

        if (planItemIdInput) {
            planItemIdInput.value = item.id;
        }

        if (planItemBrandInput) {
            planItemBrandInput.value =
                item.brand_id || "";

            planItemBrandInput.disabled = true;
        }

        if (planItemAssignedToInput) {
            planItemAssignedToInput.value =
                item.assigned_to || "";
        }

        if (planItemTitleInput) {
            planItemTitleInput.value =
                item.title || "";
        }

        if (planItemBriefInput) {
            planItemBriefInput.value =
                item.brief || "";
        }

        if (planItemContentTypeInput) {
            planItemContentTypeInput.value =
                item.content_type || "post";
        }

        if (planItemSourceInput) {
            planItemSourceInput.value =
                item.source || "manual";

            planItemSourceInput.disabled = true;
        }

        if (planItemPriorityInput) {
            planItemPriorityInput.value =
                item.priority || "medium";
        }

        if (planItemDueDateInput) {
            planItemDueDateInput.value =
                item.due_date || "";
        }

        setSelectedPlatforms(
            item.target_platforms
        );

        if (planItemModalTitle) {
            planItemModalTitle.textContent =
                "Editar item";
        }

        if (planItemFormSubmitText) {
            planItemFormSubmitText.textContent =
                "Guardar alterações";
        }

        clearPlanItemFormErrors();
        updateFormCounters();
        openModal(planItemModal);

        window.setTimeout(
            () => planItemTitleInput?.focus(),
            100
        );
    }    

    function setPlanItemSubmitting(
        isSubmitting
    ) {
        const isEditing = Boolean(
            planItemIdInput?.value.trim()
        );

        if (planItemFormSubmit) {
            planItemFormSubmit.disabled =
                isSubmitting;

            planItemFormSubmit.setAttribute(
                "aria-busy",
                String(isSubmitting)
            );
        }

        planItemFormLoader?.classList.toggle(
            "hidden",
            !isSubmitting
        );

        if (!planItemFormSubmitText) {
            return;
        }

        if (isSubmitting) {
            planItemFormSubmitText.textContent =
                isEditing
                    ? "A guardar..."
                    : "A criar...";

            return;
        }

        planItemFormSubmitText.textContent =
            isEditing
                ? "Guardar alterações"
                : "Criar item";
    }

    function validatePlanItemForm() {
        clearPlanItemFormErrors();

        let isValid = true;

        const brandId =
            planItemBrandInput?.value || "";

        const title =
            planItemTitleInput?.value.trim() ||
            "";

        if (!brandId) {
            planItemBrandInput?.classList.add(
                "is-invalid"
            );

            if (planItemBrandError) {
                planItemBrandError.textContent =
                    "Selecione uma marca.";
            }

            isValid = false;
        }

        if (
            title.length < 2 ||
            title.length > 160
        ) {
            planItemTitleInput?.classList.add(
                "is-invalid"
            );

            if (planItemTitleError) {
                planItemTitleError.textContent =
                    "O título deve ter entre 2 e 160 caracteres.";
            }

            isValid = false;
        }

        return isValid;
    }

    /* ======================================================
       Criação do item
    ====================================================== */

    planItemForm?.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            if (!validatePlanItemForm()) {
                showToast(
                    "error",
                    "Verifique o formulário",
                    "Existem campos obrigatórios que precisam ser corrigidos."
                );

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

            const editingItemId =
                planItemIdInput?.value.trim() ||
                null;

            const isEditing =
                Boolean(editingItemId);

            const originalItem = isEditing
                ? plannerItems.find(
                    item => item.id === editingItemId
                )
                : null;

            if (isEditing && !originalItem) {
                showToast(
                    "error",
                    "Item não encontrado",
                    "Não foi possível encontrar o item para edição."
                );

                return;
            }

            setPlanItemSubmitting(true);

            if (planItemFormError) {
                planItemFormError.textContent = "";

                planItemFormError.classList.add(
                    "hidden"
                );
            }

            try {
                let data = null;

                if (isEditing) {
                    const {
                        data: updatedItem,
                        error: updateError
                    } = await supabaseClient.rpc(
                        "update_content_plan_item",
                        {
                            item_id_value:
                                editingItemId,

                            title_value:
                                planItemTitleInput.value.trim(),

                            brief_value:
                                planItemBriefInput?.value.trim() ||
                                null,

                            content_type_value:
                                planItemContentTypeInput?.value ||
                                "post",

                            target_platforms_value:
                                getSelectedPlatforms(),

                            priority_value:
                                planItemPriorityInput?.value ||
                                "medium",

                            due_date_value:
                                planItemDueDateInput?.value ||
                                null,

                            metadata_value:
                                originalItem?.metadata &&
                                typeof originalItem.metadata ===
                                    "object" &&
                                !Array.isArray(
                                    originalItem.metadata
                                )
                                    ? originalItem.metadata
                                    : {}
                        }
                    );

                    if (updateError) {
                        throw updateError;
                    }

                    const selectedAssignee =
                        planItemAssignedToInput?.value ||
                        null;

                    const currentAssignee =
                        originalItem.assigned_to ||
                        null;

                    if (
                        selectedAssignee !==
                        currentAssignee
                    ) {
                        const {
                            error: assignError
                        } = await supabaseClient.rpc(
                            "assign_content_plan_item",
                            {
                                item_id_value:
                                    editingItemId,

                                assigned_to_value:
                                    selectedAssignee
                            }
                        );

                        if (assignError) {
                            throw assignError;
                        }
                    }

                    data = updatedItem;
                } else {
                    const {
                        data: createdItem,
                        error: createError
                    } = await supabaseClient.rpc(
                        "create_content_plan_item",
                        {
                            workspace_id_value:
                                currentWorkspace.id,

                            brand_id_value:
                                planItemBrandInput.value,

                            title_value:
                                planItemTitleInput.value.trim(),

                            brief_value:
                                planItemBriefInput?.value.trim() ||
                                null,

                            content_type_value:
                                planItemContentTypeInput?.value ||
                                "post",

                            target_platforms_value:
                                getSelectedPlatforms(),

                            source_value:
                                planItemSourceInput?.value ||
                                "manual",

                            priority_value:
                                planItemPriorityInput?.value ||
                                "medium",

                            due_date_value:
                                planItemDueDateInput?.value ||
                                null,

                            assigned_to_value:
                                planItemAssignedToInput?.value ||
                                null
                        }
                    );

                    if (createError) {
                        throw createError;
                    }

                    data = createdItem;
                }

                console.log(
                    isEditing
                        ? "Item do Planner atualizado:"
                        : "Item do Planner criado:",
                    data
                );

                closeModal(planItemModal);

                await loadPlannerData();

                showToast(
                    "success",
                    isEditing
                        ? "Item atualizado"
                        : "Item criado",
                    isEditing
                        ? "As alterações foram guardadas com sucesso."
                        : "O novo item foi adicionado à coluna Ideias."
                );
            } catch (error) {
                console.error(
                    isEditing
                        ? "Erro ao atualizar item:"
                        : "Erro ao criar item:",
                    error
                );

                const message =
                    error?.message ||
                    (
                        isEditing
                            ? "Não foi possível atualizar o item."
                            : "Não foi possível criar o item."
                    );

                if (planItemFormError) {
                    planItemFormError.textContent =
                        message;

                    planItemFormError.classList.remove(
                        "hidden"
                    );
                }

                showToast(
                    "error",
                    isEditing
                        ? "Erro ao atualizar item"
                        : "Erro ao criar item",
                    message
                );
            } finally {
                setPlanItemSubmitting(false);
            }
        }
    );    
    

    /* ======================================================
       Eventos do formulário
    ====================================================== */

    createPlanItemButton?.addEventListener(
        "click",
        openCreatePlanItemModal
    );

    emptyCreatePlanItemButton?.addEventListener(
        "click",
        openCreatePlanItemModal
    );

    planItemModalClose?.addEventListener(
        "click",
        () => closeModal(planItemModal)
    );

    planItemFormCancel?.addEventListener(
        "click",
        () => closeModal(planItemModal)
    );

    planItemModal?.addEventListener(
        "click",
        event => {
            if (event.target === planItemModal) {
                closeModal(planItemModal);
            }
        }
    );

    planItemTitleInput?.addEventListener(
        "input",
        () => {
            planItemTitleInput.classList.remove(
                "is-invalid"
            );

            if (planItemTitleError) {
                planItemTitleError.textContent =
                    "";
            }

            updateFormCounters();
        }
    );

    planItemBriefInput?.addEventListener(
        "input",
        updateFormCounters
    );

    planItemBrandInput?.addEventListener(
        "change",
        () => {
            planItemBrandInput.classList.remove(
                "is-invalid"
            );

            if (planItemBrandError) {
                planItemBrandError.textContent =
                    "";
            }
        }
    );

    /* ======================================================
    Converter item em conteúdo
    ====================================================== */

    function clearConvertContentFormErrors() {
        convertContentTitleInput?.classList.remove(
            "is-invalid"
        );

        if (convertContentTitleError) {
            convertContentTitleError.textContent = "";
        }

        if (convertContentFormError) {
            convertContentFormError.textContent = "";

            convertContentFormError.classList.add(
                "hidden"
            );
        }
    }

    function resetConvertContentForm() {
        convertContentForm?.reset();

        if (convertPlanItemIdInput) {
            convertPlanItemIdInput.value = "";
        }

        clearConvertContentFormErrors();

        if (convertContentSubmit) {
            convertContentSubmit.disabled = false;
            convertContentSubmit.textContent =
                "Criar conteúdo";
        }
    }

    function openConvertPlanItemModal(itemId) {
        const item = plannerItems.find(
            plannerItem =>
                plannerItem.id === itemId
        );

        if (!item) {
            showToast(
                "error",
                "Item não encontrado",
                "Não foi possível localizar o item selecionado."
            );

            return;
        }

        if (item.status !== "approved") {
            showToast(
                "warning",
                "Conversão indisponível",
                "O item precisa estar na etapa Aprovado antes de ser convertido."
            );

            return;
        }

        resetConvertContentForm();

        if (convertPlanItemIdInput) {
            convertPlanItemIdInput.value =
                item.id;
        }

        if (convertContentTitleInput) {
            convertContentTitleInput.value =
                item.title || "";
        }

        if (convertContentMainTextInput) {
            convertContentMainTextInput.value =
                item.brief || "";
        }

        openModal(convertPlanItemModal);

        window.setTimeout(
            () =>
                convertContentTitleInput?.focus(),
            100
        );
    }

    function closeConvertPlanItemModal() {
        closeModal(convertPlanItemModal);

        resetConvertContentForm();
    }

    function setConvertContentSubmitting(
        isSubmitting
    ) {
        if (!convertContentSubmit) {
            return;
        }

        convertContentSubmit.disabled =
            isSubmitting;

        convertContentSubmit.setAttribute(
            "aria-busy",
            String(isSubmitting)
        );

        convertContentSubmit.textContent =
            isSubmitting
                ? "A criar..."
                : "Criar conteúdo";
    }

    function validateConvertContentForm() {
        clearConvertContentFormErrors();

        const title =
            convertContentTitleInput?.value.trim() ||
            "";

        if (
            title.length < 2 ||
            title.length > 160
        ) {
            convertContentTitleInput?.classList.add(
                "is-invalid"
            );

            if (convertContentTitleError) {
                convertContentTitleError.textContent =
                    "O título deve ter entre 2 e 160 caracteres.";
            }

            return false;
        }

        return true;
    }

    convertContentForm?.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            if (!validateConvertContentForm()) {
                showToast(
                    "error",
                    "Verifique o formulário",
                    "O título do conteúdo precisa ser corrigido."
                );

                return;
            }

            const planItemId =
                convertPlanItemIdInput?.value.trim() ||
                "";

            if (!planItemId) {
                showToast(
                    "error",
                    "Item indisponível",
                    "Não foi possível identificar o item do Planner."
                );

                return;
            }

            const item = plannerItems.find(
                plannerItem =>
                    plannerItem.id === planItemId
            );

            if (!item) {
                showToast(
                    "error",
                    "Item não encontrado",
                    "O item selecionado não está disponível."
                );

                return;
            }

            setConvertContentSubmitting(true);

            try {
                const metadata =
                    item.metadata &&
                    typeof item.metadata === "object" &&
                    !Array.isArray(item.metadata)
                        ? item.metadata
                        : {};

                const { data, error } =
                    await supabaseClient.rpc(
                        "create_content_from_plan_item",
                        {
                            plan_item_id_value:
                                planItemId,

                            title_value:
                                convertContentTitleInput.value.trim(),

                            main_text_value:
                                convertContentMainTextInput?.value.trim() ||
                                null,

                            metadata_value:
                                metadata
                        }
                    );

                if (error) {
                    throw error;
                }

                console.log(
                    "Conteúdo criado pelo Planner:",
                    data
                );

                closeConvertPlanItemModal();

                await loadPlannerData();

                showToast(
                    "success",
                    "Conteúdo criado",
                    "O item foi convertido e enviado para a área de Conteúdos."
                );
            } catch (error) {
                console.error(
                    "Erro ao converter item:",
                    error
                );

                const message =
                    error?.message ||
                    "Não foi possível criar o conteúdo.";

                if (convertContentFormError) {
                    convertContentFormError.textContent =
                        message;

                    convertContentFormError.classList.remove(
                        "hidden"
                    );
                }

                showToast(
                    "error",
                    "Erro ao criar conteúdo",
                    message
                );
            } finally {
                setConvertContentSubmitting(false);
            }
        }
    );

    convertPlanItemModalClose?.addEventListener(
        "click",
        closeConvertPlanItemModal
    );

    convertContentCancel?.addEventListener(
        "click",
        closeConvertPlanItemModal
    );

    convertPlanItemModal?.addEventListener(
        "click",
        event => {
            if (
                event.target ===
                convertPlanItemModal
            ) {
                closeConvertPlanItemModal();
            }
        }
    );

    convertContentTitleInput?.addEventListener(
        "input",
        () => {
            convertContentTitleInput.classList.remove(
                "is-invalid"
            );

            if (convertContentTitleError) {
                convertContentTitleError.textContent =
                    "";
            }
        }
    );

    /* ======================================================
    Arquivar e restaurar itens
    ====================================================== */

    function openArchivePlanItemModal(itemId) {
        const item = plannerItems.find(
            plannerItem =>
                plannerItem.id === itemId
        );

        if (!item) {
            showToast(
                "error",
                "Item não encontrado",
                "Não foi possível localizar o item selecionado."
            );

            return;
        }

        selectedArchivePlanItemId = itemId;

        openModal(archivePlanItemModal);
    }

    function closeArchivePlanItemModal() {
        closeModal(archivePlanItemModal);

        selectedArchivePlanItemId = null;
    }

    function setArchivePlanItemSubmitting(
        isSubmitting
    ) {
        if (!archivePlanItemConfirm) {
            return;
        }

        archivePlanItemConfirm.disabled =
            isSubmitting;

        archivePlanItemConfirm.setAttribute(
            "aria-busy",
            String(isSubmitting)
        );

        archivePlanItemConfirm.textContent =
            isSubmitting
                ? "A arquivar..."
                : "Arquivar item";
    }

    async function archivePlanItem(itemId) {
        if (!itemId) {
            return;
        }

        setArchivePlanItemSubmitting(true);

        try {
            const { data, error } =
                await supabaseClient.rpc(
                    "archive_content_plan_item",
                    {
                        item_id_value:
                            itemId
                    }
                );

            if (error) {
                throw error;
            }

            console.log(
                "Item do Planner arquivado:",
                data
            );

            closeArchivePlanItemModal();

            await loadPlannerData();

            showToast(
                "success",
                "Item arquivado",
                "O item foi removido do quadro e enviado para o arquivo."
            );
        } catch (error) {
            console.error(
                "Erro ao arquivar item:",
                error
            );

            showToast(
                "error",
                "Erro ao arquivar item",
                error?.message ||
                "Não foi possível arquivar o item."
            );
        } finally {
            setArchivePlanItemSubmitting(false);
        }
    }

    async function restorePlanItem(itemId) {
        if (!itemId) {
            return;
        }

        try {
            const { data, error } =
                await supabaseClient.rpc(
                    "restore_content_plan_item",
                    {
                        item_id_value:
                            itemId
                    }
                );

            if (error) {
                throw error;
            }

            console.log(
                "Item do Planner restaurado:",
                data
            );

            await loadPlannerData();

            showToast(
                "success",
                "Item restaurado",
                "O item voltou para a etapa em que estava antes de ser arquivado."
            );
        } catch (error) {
            console.error(
                "Erro ao restaurar item:",
                error
            );

            showToast(
                "error",
                "Erro ao restaurar item",
                error?.message ||
                "Não foi possível restaurar o item."
            );
        }
    }    

    archivePlanItemCancel?.addEventListener(
        "click",
        closeArchivePlanItemModal
    );

    archivePlanItemModal?.addEventListener(
        "click",
        event => {
            if (
                event.target ===
                archivePlanItemModal
            ) {
                closeArchivePlanItemModal();
            }
        }
    );

    archivePlanItemConfirm?.addEventListener(
        "click",
        async () => {
            if (!selectedArchivePlanItemId) {
                return;
            }

            await archivePlanItem(
                selectedArchivePlanItemId
            );
        }
    );

    /* ======================================================
    Movimentação do Planner
    ====================================================== */

    function clearDragStates() {
        document
            .querySelectorAll(
                ".planner-column-items.is-drag-over"
            )
            .forEach(column => {
                column.classList.remove(
                    "is-drag-over"
                );
            });

        document
            .querySelectorAll(
                ".plan-item-card.is-dragging"
            )
            .forEach(card => {
                card.classList.remove(
                    "is-dragging"
                );
            });
    }

    async function movePlanItem(
        itemId,
        targetStatus
    ) {
        const allowedStatuses = [
            "idea",
            "planned",
            "in_progress",
            "review",
            "approved"
        ];

        if (
            !itemId ||
            !allowedStatuses.includes(targetStatus)
        ) {
            return;
        }

        const item = plannerItems.find(
            plannerItem =>
                plannerItem.id === itemId
        );

        if (!item) {
            showToast(
                "error",
                "Item não encontrado",
                "Não foi possível encontrar o item selecionado."
            );

            return;
        }

        if (item.status === targetStatus) {
            return;
        }

        if (
            item.status === "archived" ||
            item.status === "converted"
        ) {
            showToast(
                "warning",
                "Movimentação indisponível",
                "Itens arquivados ou convertidos não podem ser movidos."
            );

            return;
        }

        if (isMovingPlanItem) {
            return;
        }

        isMovingPlanItem = true;

        try {
            const { data, error } =
                await supabaseClient.rpc(
                    "move_content_plan_item",
                    {
                        item_id_value:
                            itemId,

                        target_status_value:
                            targetStatus,

                        target_position_value:
                            null
                    }
                );

            if (error) {
                throw error;
            }

            console.log(
                "Item do Planner movido:",
                data
            );

            await loadPlannerData();

            showToast(
                "success",
                "Item movido",
                "O item foi transferido para a nova etapa."
            );
        } catch (error) {
            console.error(
                "Erro ao mover item do Planner:",
                error
            );

            showToast(
                "error",
                "Erro ao mover item",
                error?.message ||
                "Não foi possível mover o item."
            );

            await loadPlannerData();
        } finally {
            isMovingPlanItem = false;
            draggedPlanItemId = null;

            clearDragStates();
        }
    }


    plannerBoard?.addEventListener(
        "dragover",
        event => {
            const targetColumn =
                event.target.closest(
                    "[data-drop-status]"
                );

            if (
                !targetColumn ||
                isMovingPlanItem
            ) {
                return;
            }

            event.preventDefault();

            if (event.dataTransfer) {
                event.dataTransfer.dropEffect =
                    "move";
            }

            document
                .querySelectorAll(
                    ".planner-column-items.is-drag-over"
                )
                .forEach(column => {
                    if (column !== targetColumn) {
                        column.classList.remove(
                            "is-drag-over"
                        );
                    }
                });

            targetColumn.classList.add(
                "is-drag-over"
            );
        }
    );

    plannerBoard?.addEventListener(
        "dragleave",
        event => {
            const targetColumn =
                event.target.closest(
                    "[data-drop-status]"
                );

            if (!targetColumn) {
                return;
            }

            const nextElement =
                event.relatedTarget;

            if (
                nextElement instanceof Node &&
                targetColumn.contains(nextElement)
            ) {
                return;
            }

            targetColumn.classList.remove(
                "is-drag-over"
            );
        }
    );

    plannerBoard?.addEventListener(
        "drop",
        async event => {
            event.preventDefault();

            const targetColumn =
                event.target.closest(
                    "[data-drop-status]"
                );

            if (!targetColumn) {
                clearDragStates();
                return;
            }

            const targetStatus =
                targetColumn.dataset.dropStatus;

            const transferredItemId =
                event.dataTransfer?.getData(
                    "text/plain"
                );

            const itemId =
                draggedPlanItemId ||
                transferredItemId;

            clearDragStates();

            if (!itemId) {
                console.error(
                    "Nenhum item identificado no arraste."
                );

                return;
            }

            if (targetStatus === "converted") {
                showToast(
                    "info",
                    "Conversão necessária",
                    "Use a ação Criar conteúdo para colocar o item em Convertido."
                );

                return;
            }

            console.log(
                "Item solto:",
                {
                    itemId,
                    targetStatus
                }
            );

            await movePlanItem(
                itemId,
                targetStatus
            );
        }
    );

    /* ======================================================
    Ações dos cartões
    ====================================================== */

    function closeAllPlanItemMenus() {
        document
            .querySelectorAll(
                "[data-plan-actions]"
            )
            .forEach(menu => {
                menu.classList.add("hidden");
            });

        document
            .querySelectorAll(
                "[data-plan-menu-button]"
            )
            .forEach(button => {
                button.setAttribute(
                    "aria-expanded",
                    "false"
                );
            });
    }

    plannerBoard?.addEventListener(
        "click",
        async event => {
            const menuButton = event.target.closest(
                "[data-plan-menu-button]"
            );

            if (menuButton) {
                event.stopPropagation();

                const card = menuButton.closest(
                    "[data-plan-item-id]"
                );

                const menu = card?.querySelector(
                    "[data-plan-actions]"
                );

                const willOpen =
                    menu?.classList.contains("hidden");

                closeAllPlanItemMenus();

                if (willOpen && menu) {
                    menu.classList.remove("hidden");

                    menuButton.setAttribute(
                        "aria-expanded",
                        "true"
                    );
                }

                return;
            }

            const actionButton = event.target.closest(
                "[data-plan-action]"
            );

            if (!actionButton) {
                return;
            }

            const card = actionButton.closest(
                "[data-plan-item-id]"
            );

            const itemId =
                card?.dataset.planItemId;

            const action =
                actionButton.dataset.planAction;

            if (!itemId) {
                return;
            }

            closeAllPlanItemMenus();

            console.log(
                "Ação do Planner:",
                action,
                itemId
            );

            if (action === "edit") {
                openEditPlanItemModal(itemId);
                return;
            }

            if (action === "move") {
                const targetStatus =
                    actionButton.dataset.targetStatus;

                await movePlanItem(
                    itemId,
                    targetStatus
                );

                return;
            }

            if (action === "convert") {
                openConvertPlanItemModal(itemId);
                return;
            }

            if (action === "archive") {
                openArchivePlanItemModal(itemId);
            }
        }
    );

    plannerArchivedList?.addEventListener(
        "click",
        async event => {
            const restoreButton =
                event.target.closest(
                    '[data-plan-action="restore"]'
                );

            if (!restoreButton) {
                return;
            }

            const card = restoreButton.closest(
                "[data-plan-item-id]"
            );

            const itemId =
                card?.dataset.planItemId;

            if (!itemId) {
                return;
            }

            restoreButton.disabled = true;

            await restorePlanItem(itemId);

            if (restoreButton.isConnected) {
                restoreButton.disabled = false;
            }
        }
    );    

    document.addEventListener(
        "click",
        event => {
            if (
                !event.target.closest(
                    ".plan-item-card"
                )
            ) {
                closeAllPlanItemMenus();
            }
        }
    );

    /* ======================================================
       Filtros
    ====================================================== */

    plannerSearchInput?.addEventListener(
        "input",
        applyPlannerFilters
    );

    plannerBrandFilter?.addEventListener(
        "change",
        applyPlannerFilters
    );

    plannerPriorityFilter?.addEventListener(
        "change",
        applyPlannerFilters
    );

    plannerAssigneeFilter?.addEventListener(
        "change",
        applyPlannerFilters
    );

    plannerArchiveToggle?.addEventListener(
        "click",
        () => {
            showArchivedItems =
                !showArchivedItems;

            plannerArchiveToggle.setAttribute(
                "aria-pressed",
                String(showArchivedItems)
            );

            applyPlannerFilters();
        }
    );

    clearPlannerFiltersButton?.addEventListener(
        "click",
        () => {
            if (plannerSearchInput) {
                plannerSearchInput.value = "";
            }

            if (plannerBrandFilter) {
                plannerBrandFilter.value = "all";
            }

            if (plannerPriorityFilter) {
                plannerPriorityFilter.value =
                    "all";
            }

            if (plannerAssigneeFilter) {
                plannerAssigneeFilter.value =
                    "all";
            }

            applyPlannerFilters();

            showToast(
                "info",
                "Filtros removidos",
                "A pesquisa e os filtros foram redefinidos."
            );
        }
    );

    /* ======================================================
       Sidebar
    ====================================================== */

    function openSidebar() {
        body.classList.add("sidebar-open");

        sidebarOpenButton?.setAttribute(
            "aria-expanded",
            "true"
        );
    }

    function closeSidebar() {
        body.classList.remove(
            "sidebar-open"
        );

        sidebarOpenButton?.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    sidebarOpenButton?.addEventListener(
        "click",
        openSidebar
    );

    sidebarCloseButton?.addEventListener(
        "click",
        closeSidebar
    );

    sidebarOverlay?.addEventListener(
        "click",
        closeSidebar
    );

    /* ======================================================
       Tecla Escape
    ====================================================== */

    document.addEventListener(
        "keydown",
        event => {
            if (event.key !== "Escape") {
                return;
            }

            if (
                convertPlanItemModal?.classList.contains(
                    "is-open"
                )
            ) {
                closeConvertPlanItemModal();
                return;
            }

            if (
                archivePlanItemModal?.classList.contains(
                    "is-open"
                )
            ) {
                closeArchivePlanItemModal();
                return;
            }

            if (
                planItemModal?.classList.contains(
                    "is-open"
                )
            ) {
                closeModal(planItemModal);
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

    /* ======================================================
       Inicialização
    ====================================================== */

    try {
        const contextLoaded =
            await initializeWorkspaceContext();

        if (contextLoaded) {
            await loadPlannerData();
        }
    } catch (error) {
        console.error(
            "Erro ao inicializar Planner:",
            error
        );

        setPlannerView(null);

        showToast(
            "error",
            "Erro ao iniciar Planner",
            error?.message ||
            "Não foi possível iniciar a página."
        );
    }

    window.lucide?.createIcons();
});
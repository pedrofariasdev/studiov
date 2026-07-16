"use strict";

/* ==========================================================
   StudioV — Calendário
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        /* ==================================================
           Elementos gerais
        ================================================== */

        const body =
            document.body;

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
           Calendário
        ================================================== */

        const calendarLoading =
            document.getElementById(
                "calendar-loading"
            );

        const calendarEmpty =
            document.getElementById(
                "calendar-empty"
            );

        const calendarNoResults =
            document.getElementById(
                "calendar-no-results"
            );

        const calendarBoard =
            document.getElementById(
                "calendar-board"
            );

        const calendarGrid =
            document.getElementById(
                "calendar-grid"
            );

        const calendarMonthLabel =
            document.getElementById(
                "calendar-month-label"
            );

        const calendarPreviousButton =
            document.getElementById(
                "calendar-previous-button"
            );

        const calendarNextButton =
            document.getElementById(
                "calendar-next-button"
            );

        const calendarTodayButton =
            document.getElementById(
                "calendar-today-button"
            );

        const createCalendarEventButton =
            document.getElementById(
                "create-calendar-event-button"
            );

        const emptyCreateCalendarEventButton =
            document.getElementById(
                "empty-create-calendar-event-button"
            );

        /* ==================================================
           Filtros
        ================================================== */

        const calendarSearchInput =
            document.getElementById(
                "calendar-search-input"
            );

        const calendarBrandFilter =
            document.getElementById(
                "calendar-brand-filter"
            );

        const calendarStatusFilter =
            document.getElementById(
                "calendar-status-filter"
            );

        const calendarTypeFilter =
            document.getElementById(
                "calendar-type-filter"
            );

        const calendarPlatformFilter =
            document.getElementById(
                "calendar-platform-filter"
            );

        const clearCalendarFiltersButton =
            document.getElementById(
                "clear-calendar-filters-button"
            );

        /* ==================================================
           Contadores
        ================================================== */

        const calendarTotalCount =
            document.getElementById(
                "calendar-total-count"
            );

        const calendarUpcomingCount =
            document.getElementById(
                "calendar-upcoming-count"
            );

        const calendarCompletedCount =
            document.getElementById(
                "calendar-completed-count"
            );

        const calendarArchivedCount =
            document.getElementById(
                "calendar-archived-count"
            );

        /* ==================================================
           Modal criar e editar
        ================================================== */

        const calendarEventModal =
            document.getElementById(
                "calendar-event-modal"
            );

        const calendarEventModalClose =
            document.getElementById(
                "calendar-event-modal-close"
            );

        const calendarEventModalTitle =
            document.getElementById(
                "calendar-event-modal-title"
            );

        const calendarEventForm =
            document.getElementById(
                "calendar-event-form"
            );

        const calendarEventIdInput =
            document.getElementById(
                "calendar-event-id"
            );

        const calendarEventBrandInput =
            document.getElementById(
                "calendar-event-brand"
            );

        const calendarEventBrandError =
            document.getElementById(
                "calendar-event-brand-error"
            );

        const calendarEventAssignedToInput =
            document.getElementById(
                "calendar-event-assigned-to"
            );

        const calendarEventTitleInput =
            document.getElementById(
                "calendar-event-title"
            );

        const calendarEventTitleError =
            document.getElementById(
                "calendar-event-title-error"
            );

        const calendarEventDescriptionInput =
            document.getElementById(
                "calendar-event-description"
            );

        const calendarEventTypeInput =
            document.getElementById(
                "calendar-event-type"
            );

        const calendarEventPlatformInput =
            document.getElementById(
                "calendar-event-platform"
            );

        const calendarEventStartInput =
            document.getElementById(
                "calendar-event-start"
            );

        const calendarEventStartError =
            document.getElementById(
                "calendar-event-start-error"
            );

        const calendarEventEndInput =
            document.getElementById(
                "calendar-event-end"
            );

        const calendarEventEndError =
            document.getElementById(
                "calendar-event-end-error"
            );

        const calendarEventStatusInput =
            document.getElementById(
                "calendar-event-status"
            );

        const calendarEventTimezoneInput =
            document.getElementById(
                "calendar-event-timezone"
            );

        const calendarEventPlanItemInput =
            document.getElementById(
                "calendar-event-plan-item"
            );

        const calendarEventAllDayInput =
            document.getElementById(
                "calendar-event-all-day"
            );

        const calendarEventFormError =
            document.getElementById(
                "calendar-event-form-error"
            );

        const calendarEventFormCancel =
            document.getElementById(
                "calendar-event-form-cancel"
            );

        const calendarEventFormSubmit =
            document.getElementById(
                "calendar-event-form-submit"
            );

        const calendarEventFormSubmitText =
            document.getElementById(
                "calendar-event-form-submit-text"
            );

        const calendarEventFormLoader =
            document.getElementById(
                "calendar-event-form-loader"
            );

        /* ==================================================
           Modal de detalhes
        ================================================== */

        const calendarEventDetailsModal =
            document.getElementById(
                "calendar-event-details-modal"
            );

        const calendarEventDetailsClose =
            document.getElementById(
                "calendar-event-details-close"
            );

        const calendarEventDetailsCancel =
            document.getElementById(
                "calendar-event-details-cancel"
            );

        const calendarEventDetailsEdit =
            document.getElementById(
                "calendar-event-details-edit"
            );

        const calendarEventDetailsArchive =
            document.getElementById(
                "calendar-event-details-archive"
            );

        const calendarEventDetailsRestore =
            document.getElementById(
                "calendar-event-details-restore"
            );

        const calendarEventDetailsTitle =
            document.getElementById(
                "calendar-event-details-title"
            );

        const calendarEventDetailsStatus =
            document.getElementById(
                "calendar-event-details-status"
            );

        const calendarEventDetailsStatusSelect =
            document.getElementById(
                "calendar-event-details-status-select"
            );

        const calendarEventDetailsDescription =
            document.getElementById(
                "calendar-event-details-description"
            );

        const calendarEventDetailsBrand =
            document.getElementById(
                "calendar-event-details-brand"
            );

        const calendarEventDetailsType =
            document.getElementById(
                "calendar-event-details-type"
            );

        const calendarEventDetailsPlatform =
            document.getElementById(
                "calendar-event-details-platform"
            );

        const calendarEventDetailsAssignee =
            document.getElementById(
                "calendar-event-details-assignee"
            );

        const calendarEventDetailsDate =
            document.getElementById(
                "calendar-event-details-date"
            );

        const calendarEventDetailsPlanItem =
            document.getElementById(
                "calendar-event-details-plan-item"
            );

        /* ==================================================
           Modal arquivar
        ================================================== */

        const archiveCalendarEventModal =
            document.getElementById(
                "archive-calendar-event-modal"
            );

        const archiveCalendarEventCancel =
            document.getElementById(
                "archive-calendar-event-cancel"
            );

        const archiveCalendarEventConfirm =
            document.getElementById(
                "archive-calendar-event-confirm"
            );

        /* ==================================================
           Estado
        ================================================== */

        let currentUser = null;
        let currentWorkspace = null;

        let calendarEvents = [];
        let brands = [];
        let members = [];
        let plannerItems = [];

        let selectedCalendarEventId = null;
        let selectedArchiveEventId = null;

        let lastFocusedElement = null;

        const today =
            new Date();

        let visibleMonth =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

        /* ==================================================
           Mapas
        ================================================== */

        const statusLabels = {
            planned: "Planeado",
            confirmed: "Confirmado",
            completed: "Concluído",
            cancelled: "Cancelado",
            archived: "Arquivado"
        };

        const eventTypeLabels = {
            content: "Conteúdo",
            deadline: "Prazo",
            event: "Evento",
            reminder: "Lembrete"
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

        function getMemberById(
            userId
        ) {
            return (
                members.find(
                    member =>
                        member.id === userId
                ) ||
                null
            );
        }

        function getPlannerItemById(
            plannerItemId
        ) {
            return (
                plannerItems.find(
                    item =>
                        item.id ===
                        plannerItemId
                ) ||
                null
            );
        }

        function getDateKey(
            date
        ) {
            const year =
                date.getFullYear();

            const month =
                String(
                    date.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );

            const day =
                String(
                    date.getDate()
                ).padStart(
                    2,
                    "0"
                );

            return `${year}-${month}-${day}`;
        }

        function getEventDateKey(
            event
        ) {
            const date =
                new Date(
                    event.starts_at
                );

            return getDateKey(
                date
            );
        }

        function formatEventTime(
            event
        ) {
            if (event.all_day) {
                return "Dia inteiro";
            }

            const start =
                new Date(
                    event.starts_at
                );

            const startText =
                new Intl.DateTimeFormat(
                    "pt-PT",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                ).format(start);

            if (!event.ends_at) {
                return startText;
            }

            const end =
                new Date(
                    event.ends_at
                );

            const endText =
                new Intl.DateTimeFormat(
                    "pt-PT",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                ).format(end);

            return `${startText}–${endText}`;
        }

        function formatEventDateRange(
            event
        ) {
            const start =
                new Date(
                    event.starts_at
                );

            const startDate =
                new Intl.DateTimeFormat(
                    "pt-PT",
                    {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                    }
                ).format(start);

            if (event.all_day) {
                return `${startDate} · Dia inteiro`;
            }

            return `${startDate} · ${formatEventTime(
                event
            )}`;
        }

        function toDatetimeLocal(
            value
        ) {
            if (!value) {
                return "";
            }

            const date =
                new Date(value);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return "";
            }

            const adjusted =
                new Date(
                    date.getTime() -
                    date.getTimezoneOffset() *
                    60000
                );

            return adjusted
                .toISOString()
                .slice(0, 16);
        }

        function createDefaultStartValue() {
            const date =
                new Date();

            date.setMinutes(
                Math.ceil(
                    date.getMinutes() / 30
                ) * 30,
                0,
                0
            );

            return toDatetimeLocal(
                date.toISOString()
            );
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

            window.lucide
                ?.createIcons();

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
                "Contexto do Calendário carregado:",
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
           Carregamento de membros
        ================================================== */

        async function loadWorkspaceMembers() {
            const {
                data: membershipRows,
                error: membershipError
            } = await supabaseClient
                .from("workspace_members")
                .select(
                    "user_id, role, status"
                )
                .eq(
                    "workspace_id",
                    currentWorkspace.id
                )
                .eq(
                    "status",
                    "active"
                );

            if (membershipError) {
                throw membershipError;
            }

            const userIds =
                (
                    membershipRows ||
                    []
                )
                    .map(
                        row =>
                            row.user_id
                    )
                    .filter(
                        Boolean
                    );

            if (
                userIds.length ===
                0
            ) {
                members =
                    [];

                return;
            }

            const {
                data: profiles,
                error: profilesError
            } = await supabaseClient
                .from("profiles")
                .select(
                    "id, full_name"
                )
                .in(
                    "id",
                    userIds
                );

            if (profilesError) {
                throw profilesError;
            }

            members =
                userIds.map(
                    userId => {
                        const profile =
                            profiles?.find(
                                item =>
                                    item.id ===
                                    userId
                            );

                        const membership =
                            membershipRows.find(
                                item =>
                                    item.user_id ===
                                    userId
                            );

                        return {
                            id:
                                userId,

                            full_name:
                                profile
                                    ?.full_name
                                    ?.trim() ||
                                "Utilizador",

                            role:
                                membership
                                    ?.role ||
                                "member"
                        };
                    }
                );
        }

        /* ==================================================
           Estados visuais
        ================================================== */

        function setCalendarLoading(
            isLoading
        ) {
            calendarLoading
                ?.classList
                .toggle(
                    "hidden",
                    !isLoading
                );

            calendarBoard
                ?.classList
                .toggle(
                    "hidden",
                    isLoading
                );
        }

        /* ==================================================
           Opções dos selects
        ================================================== */

        function populateBrandOptions() {
            const previousFilter =
                calendarBrandFilter
                    ?.value ||
                "all";

            if (calendarBrandFilter) {
                calendarBrandFilter.innerHTML = `
                    <option value="all">
                        Todas as marcas
                    </option>
                `;
            }

            if (calendarEventBrandInput) {
                calendarEventBrandInput.innerHTML = `
                    <option value="">
                        Selecione uma marca
                    </option>
                `;
            }

            brands.forEach(
                brand => {
                    if (calendarBrandFilter) {
                        const filterOption =
                            document.createElement(
                                "option"
                            );

                        filterOption.value =
                            brand.id;

                        filterOption.textContent =
                            brand.name;

                        calendarBrandFilter.appendChild(
                            filterOption
                        );
                    }

                    if (
                        calendarEventBrandInput &&
                        brand.status ===
                            "active"
                    ) {
                        const formOption =
                            document.createElement(
                                "option"
                            );

                        formOption.value =
                            brand.id;

                        formOption.textContent =
                            brand.name;

                        calendarEventBrandInput.appendChild(
                            formOption
                        );
                    }
                }
            );

            if (calendarBrandFilter) {
                const optionExists =
                    Array.from(
                        calendarBrandFilter.options
                    ).some(
                        option =>
                            option.value ===
                            previousFilter
                    );

                calendarBrandFilter.value =
                    optionExists
                        ? previousFilter
                        : "all";
            }
        }

        function populateMemberOptions() {
            if (
                !calendarEventAssignedToInput
            ) {
                return;
            }

            calendarEventAssignedToInput.innerHTML = `
                <option value="">
                    Sem responsável
                </option>
            `;

            members.forEach(
                member => {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        member.id;

                    option.textContent =
                        member.full_name;

                    calendarEventAssignedToInput.appendChild(
                        option
                    );
                }
            );
        }

        function populatePlannerOptions() {
            if (
                !calendarEventPlanItemInput
            ) {
                return;
            }

            calendarEventPlanItemInput.innerHTML = `
                <option value="">
                    Sem item associado
                </option>
            `;

            plannerItems
                .filter(
                    item =>
                        item.status !==
                        "archived"
                )
                .forEach(
                    item => {
                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            item.id;

                        option.textContent =
                            item.title;

                        calendarEventPlanItemInput.appendChild(
                            option
                        );
                    }
                );
        }

        /* ==================================================
           Contadores
        ================================================== */

        function updateCalendarCounters() {
            const now =
                new Date();

            const activeEvents =
                calendarEvents.filter(
                    event =>
                        event.status !==
                        "archived"
                );

            const upcomingEvents =
                activeEvents.filter(
                    event =>
                        new Date(
                            event.starts_at
                        ) >= now &&
                        event.status !==
                            "completed" &&
                        event.status !==
                            "cancelled"
                );

            const completedEvents =
                activeEvents.filter(
                    event =>
                        event.status ===
                        "completed"
                );

            const archivedEvents =
                calendarEvents.filter(
                    event =>
                        event.status ===
                        "archived"
                );

            if (calendarTotalCount) {
                calendarTotalCount.textContent =
                    String(
                        activeEvents.length
                    );
            }

            if (calendarUpcomingCount) {
                calendarUpcomingCount.textContent =
                    String(
                        upcomingEvents.length
                    );
            }

            if (calendarCompletedCount) {
                calendarCompletedCount.textContent =
                    String(
                        completedEvents.length
                    );
            }

            if (calendarArchivedCount) {
                calendarArchivedCount.textContent =
                    String(
                        archivedEvents.length
                    );
            }
        }

        /* ==================================================
           Filtros
        ================================================== */

        function hasActiveFilters() {
            return Boolean(
                calendarSearchInput
                    ?.value
                    .trim() ||

                calendarBrandFilter
                    ?.value !==
                    "all" ||

                calendarStatusFilter
                    ?.value !==
                    "all" ||

                calendarTypeFilter
                    ?.value !==
                    "all" ||

                calendarPlatformFilter
                    ?.value !==
                    "all"
            );
        }

        function getFilteredCalendarEvents() {
            const searchTerm =
                normalizeSearchText(
                    calendarSearchInput
                        ?.value ||
                    ""
                );

            const selectedBrand =
                calendarBrandFilter
                    ?.value ||
                "all";

            const selectedStatus =
                calendarStatusFilter
                    ?.value ||
                "all";

            const selectedType =
                calendarTypeFilter
                    ?.value ||
                "all";

            const selectedPlatform =
                calendarPlatformFilter
                    ?.value ||
                "all";

            return calendarEvents.filter(
                event => {
                    if (
                        event.status ===
                            "archived" &&
                        selectedStatus !==
                            "archived"
                    ) {
                        return false;
                    }

                    const searchableText =
                        normalizeSearchText(
                            [
                                event.title,
                                event.description,
                                event.event_type,
                                event.platform,
                                event.status
                            ]
                                .filter(
                                    Boolean
                                )
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
                        event.brand_id ===
                            selectedBrand;

                    const matchesStatus =
                        selectedStatus ===
                            "all" ||
                        event.status ===
                            selectedStatus;

                    const matchesType =
                        selectedType ===
                            "all" ||
                        event.event_type ===
                            selectedType;

                    const matchesPlatform =
                        selectedPlatform ===
                            "all" ||
                        event.platform ===
                            selectedPlatform;

                    return (
                        matchesSearch &&
                        matchesBrand &&
                        matchesStatus &&
                        matchesType &&
                        matchesPlatform
                    );
                }
            );
        }

        /* ==================================================
           Renderização
        ================================================== */

        function updateMonthLabel() {
            if (!calendarMonthLabel) {
                return;
            }

            calendarMonthLabel.textContent =
                new Intl.DateTimeFormat(
                    "pt-PT",
                    {
                        month: "long",
                        year: "numeric"
                    }
                ).format(
                    visibleMonth
                );
        }

        function createCalendarEventChip(
            event
        ) {
            const brand =
                getBrandById(
                    event.brand_id
                );

            const chip =
                document.createElement(
                    "button"
                );

            chip.type =
                "button";

            chip.className =
                `calendar-event-chip is-${event.status}`;

            chip.dataset.calendarEventId =
                event.id;

            chip.style.setProperty(
                "--calendar-event-color",
                getSafeColor(
                    brand
                        ?.primary_color
                )
            );

            chip.innerHTML = `
                <strong>
                    ${escapeHtml(
                        event.title
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        formatEventTime(
                            event
                        )
                    )}
                </span>
            `;

            return chip;
        }

        function renderCalendar() {
            if (!calendarGrid) {
                return;
            }

            updateMonthLabel();

            const filteredEvents =
                getFilteredCalendarEvents();

            calendarEmpty
                ?.classList
                .toggle(
                    "hidden",
                    calendarEvents.length >
                        0
                );

            calendarNoResults
                ?.classList
                .toggle(
                    "hidden",
                    !(
                        calendarEvents.length >
                            0 &&
                        filteredEvents.length ===
                            0 &&
                        hasActiveFilters()
                    )
                );

            calendarGrid.innerHTML =
                "";

            const firstDay =
                new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth(),
                    1
                );

            const mondayOffset =
                (
                    firstDay.getDay() +
                    6
                ) % 7;

            const gridStart =
                new Date(
                    firstDay
                );

            gridStart.setDate(
                firstDay.getDate() -
                mondayOffset
            );

            const todayKey =
                getDateKey(
                    new Date()
                );

            for (
                let index = 0;
                index < 42;
                index += 1
            ) {
                const dayDate =
                    new Date(
                        gridStart
                    );

                dayDate.setDate(
                    gridStart.getDate() +
                    index
                );

                const dayKey =
                    getDateKey(
                        dayDate
                    );

                const isOutside =
                    dayDate.getMonth() !==
                    visibleMonth.getMonth();

                const isToday =
                    dayKey ===
                    todayKey;

                const dayEvents =
                    filteredEvents
                        .filter(
                            event =>
                                getEventDateKey(
                                    event
                                ) ===
                                dayKey
                        )
                        .sort(
                            (
                                first,
                                second
                            ) =>
                                new Date(
                                    first.starts_at
                                ) -
                                new Date(
                                    second.starts_at
                                )
                        );

                const day =
                    document.createElement(
                        "article"
                    );

                day.className = [
                    "calendar-day",
                    isOutside
                        ? "is-outside"
                        : "",
                    isToday
                        ? "is-today"
                        : ""
                ]
                    .filter(
                        Boolean
                    )
                    .join(" ");

                day.dataset.calendarDate =
                    dayKey;

                const dayNumber =
                    document.createElement(
                        "span"
                    );

                dayNumber.className =
                    "calendar-day-number";

                dayNumber.textContent =
                    String(
                        dayDate.getDate()
                    );

                const eventsContainer =
                    document.createElement(
                        "div"
                    );

                eventsContainer.className =
                    "calendar-day-events";

                dayEvents
                    .slice(
                        0,
                        3
                    )
                    .forEach(
                        event => {
                            eventsContainer.appendChild(
                                createCalendarEventChip(
                                    event
                                )
                            );
                        }
                    );

                if (
                    dayEvents.length >
                    3
                ) {
                    const moreButton =
                        document.createElement(
                            "button"
                        );

                    moreButton.type =
                        "button";

                    moreButton.className =
                        "calendar-more-events";

                    moreButton.textContent =
                        `+${dayEvents.length - 3} eventos`;

                    eventsContainer.appendChild(
                        moreButton
                    );
                }

                day.appendChild(
                    dayNumber
                );

                day.appendChild(
                    eventsContainer
                );

                calendarGrid.appendChild(
                    day
                );
            }

            calendarBoard
                ?.classList
                .remove(
                    "hidden"
                );

            window.lucide
                ?.createIcons();
        }

        /* ==================================================
           Carregamento
        ================================================== */

        async function loadCalendarData() {
            if (
                !currentWorkspace
                    ?.id
            ) {
                return;
            }

            setCalendarLoading(
                true
            );

            try {
                const [
                    brandsResult,
                    eventsResult,
                    plannerResult
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
                        )
                        .order(
                            "name",
                            {
                                ascending: true
                            }
                        ),

                    supabaseClient
                        .from(
                            "calendar_events"
                        )
                        .select("*")
                        .eq(
                            "workspace_id",
                            currentWorkspace.id
                        )
                        .order(
                            "starts_at",
                            {
                                ascending: true
                            }
                        ),

                    supabaseClient
                        .from(
                            "content_plan_items"
                        )
                        .select(`
                            id,
                            brand_id,
                            title,
                            status
                        `)
                        .eq(
                            "workspace_id",
                            currentWorkspace.id
                        )
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        )
                ]);

                if (brandsResult.error) {
                    throw brandsResult.error;
                }

                if (eventsResult.error) {
                    throw eventsResult.error;
                }

                if (plannerResult.error) {
                    throw plannerResult.error;
                }

                brands =
                    brandsResult.data ||
                    [];

                calendarEvents =
                    eventsResult.data ||
                    [];

                plannerItems =
                    plannerResult.data ||
                    [];

                await loadWorkspaceMembers();

                populateBrandOptions();
                populateMemberOptions();
                populatePlannerOptions();

                updateCalendarCounters();
                renderCalendar();

                console.log(
                    "Calendário carregado:",
                    {
                        events:
                            calendarEvents.length,

                        brands:
                            brands.length,

                        members:
                            members.length,

                        plannerItems:
                            plannerItems.length
                    }
                );
            } catch (error) {
                console.error(
                    "Erro ao carregar calendário:",
                    error
                );

                showToast(
                    "error",
                    "Erro ao carregar calendário",
                    error?.message ||
                    "Não foi possível carregar os eventos."
                );
            } finally {
                setCalendarLoading(
                    false
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

            if (
                modal.contains(
                    document.activeElement
                )
            ) {
                document.activeElement
                    ?.blur();
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

        /* ==================================================
           Formulário
        ================================================== */

        function clearCalendarFormErrors() {
            calendarEventBrandInput
                ?.classList
                .remove(
                    "is-invalid"
                );

            calendarEventTitleInput
                ?.classList
                .remove(
                    "is-invalid"
                );

            calendarEventStartInput
                ?.classList
                .remove(
                    "is-invalid"
                );

            calendarEventEndInput
                ?.classList
                .remove(
                    "is-invalid"
                );

            if (calendarEventBrandError) {
                calendarEventBrandError.textContent =
                    "";
            }

            if (calendarEventTitleError) {
                calendarEventTitleError.textContent =
                    "";
            }

            if (calendarEventStartError) {
                calendarEventStartError.textContent =
                    "";
            }

            if (calendarEventEndError) {
                calendarEventEndError.textContent =
                    "";
            }

            if (calendarEventFormError) {
                calendarEventFormError.textContent =
                    "";

                calendarEventFormError
                    .classList
                    .add(
                        "hidden"
                    );
            }
        }

        function resetCalendarEventForm() {
            calendarEventForm
                ?.reset();

            if (calendarEventIdInput) {
                calendarEventIdInput.value =
                    "";
            }

            if (calendarEventModalTitle) {
                calendarEventModalTitle.textContent =
                    "Novo evento";
            }

            if (calendarEventTypeInput) {
                calendarEventTypeInput.value =
                    "content";
            }

            if (calendarEventStatusInput) {
                calendarEventStatusInput.value =
                    "planned";
            }

            if (calendarEventTimezoneInput) {
                calendarEventTimezoneInput.value =
                    "Europe/Lisbon";
            }

            if (calendarEventStartInput) {
                calendarEventStartInput.value =
                    createDefaultStartValue();
            }

            if (calendarEventEndInput) {
                calendarEventEndInput.value =
                    "";
            }

            if (calendarEventFormSubmitText) {
                calendarEventFormSubmitText.textContent =
                    "Criar evento";
            }

            clearCalendarFormErrors();
        }

        function validateCalendarEventForm() {
            clearCalendarFormErrors();

            let isValid =
                true;

            const brandId =
                calendarEventBrandInput
                    ?.value ||
                "";

            const title =
                calendarEventTitleInput
                    ?.value
                    .trim() ||
                "";

            const startValue =
                calendarEventStartInput
                    ?.value ||
                "";

            const endValue =
                calendarEventEndInput
                    ?.value ||
                "";

            if (!brandId) {
                calendarEventBrandInput
                    ?.classList
                    .add(
                        "is-invalid"
                    );

                if (
                    calendarEventBrandError
                ) {
                    calendarEventBrandError.textContent =
                        "Selecione uma marca.";
                }

                isValid =
                    false;
            }

            if (
                title.length < 2 ||
                title.length > 160
            ) {
                calendarEventTitleInput
                    ?.classList
                    .add(
                        "is-invalid"
                    );

                if (
                    calendarEventTitleError
                ) {
                    calendarEventTitleError.textContent =
                        "O título deve ter entre 2 e 160 caracteres.";
                }

                isValid =
                    false;
            }

            if (!startValue) {
                calendarEventStartInput
                    ?.classList
                    .add(
                        "is-invalid"
                    );

                if (
                    calendarEventStartError
                ) {
                    calendarEventStartError.textContent =
                        "Defina a data de início.";
                }

                isValid =
                    false;
            }

            if (
                startValue &&
                endValue &&
                new Date(endValue) <
                    new Date(startValue)
            ) {
                calendarEventEndInput
                    ?.classList
                    .add(
                        "is-invalid"
                    );

                if (
                    calendarEventEndError
                ) {
                    calendarEventEndError.textContent =
                        "O fim não pode ser anterior ao início.";
                }

                isValid =
                    false;
            }

            return isValid;
        }

        function openCreateCalendarEventModal() {
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
                    "Crie ou restaure uma marca antes de adicionar eventos."
                );

                return;
            }

            resetCalendarEventForm();

            openModal(
                calendarEventModal
            );

            window.setTimeout(
                () =>
                    calendarEventTitleInput
                        ?.focus(),
                100
            );
        }

        function openEditCalendarEventModal(
            eventId
        ) {
            const event =
                calendarEvents.find(
                    item =>
                        item.id ===
                        eventId
                );

            if (!event) {
                showToast(
                    "error",
                    "Evento não encontrado",
                    "Não foi possível localizar o evento."
                );

                return;
            }

            if (
                event.status ===
                "archived"
            ) {
                showToast(
                    "warning",
                    "Edição indisponível",
                    "Restaure o evento antes de editá-lo."
                );

                return;
            }

            resetCalendarEventForm();

            if (calendarEventIdInput) {
                calendarEventIdInput.value =
                    event.id;
            }

            if (calendarEventModalTitle) {
                calendarEventModalTitle.textContent =
                    "Editar evento";
            }

            if (calendarEventBrandInput) {
                calendarEventBrandInput.value =
                    event.brand_id ||
                    "";
            }

            if (calendarEventAssignedToInput) {
                calendarEventAssignedToInput.value =
                    event.assigned_to ||
                    "";
            }

            if (calendarEventTitleInput) {
                calendarEventTitleInput.value =
                    event.title ||
                    "";
            }

            if (calendarEventDescriptionInput) {
                calendarEventDescriptionInput.value =
                    event.description ||
                    "";
            }

            if (calendarEventTypeInput) {
                calendarEventTypeInput.value =
                    event.event_type ||
                    "content";
            }

            if (calendarEventPlatformInput) {
                calendarEventPlatformInput.value =
                    event.platform ||
                    "";
            }

            if (calendarEventStartInput) {
                calendarEventStartInput.value =
                    toDatetimeLocal(
                        event.starts_at
                    );
            }

            if (calendarEventEndInput) {
                calendarEventEndInput.value =
                    toDatetimeLocal(
                        event.ends_at
                    );
            }

            if (calendarEventStatusInput) {
                calendarEventStatusInput.value =
                    event.status ||
                    "planned";
            }

            if (calendarEventTimezoneInput) {
                calendarEventTimezoneInput.value =
                    event.timezone ||
                    "Europe/Lisbon";
            }

            if (calendarEventPlanItemInput) {
                calendarEventPlanItemInput.value =
                    event.plan_item_id ||
                    "";
            }

            if (calendarEventAllDayInput) {
                calendarEventAllDayInput.checked =
                    Boolean(
                        event.all_day
                    );
            }

            if (calendarEventFormSubmitText) {
                calendarEventFormSubmitText.textContent =
                    "Guardar alterações";
            }

            closeModal(
                calendarEventDetailsModal
            );

            openModal(
                calendarEventModal
            );

            window.setTimeout(
                () =>
                    calendarEventTitleInput
                        ?.focus(),
                100
            );
        }

        function closeCalendarEventModal() {
            closeModal(
                calendarEventModal
            );

            resetCalendarEventForm();
        }

        function setCalendarEventSubmitting(
            isSubmitting
        ) {
            if (
                !calendarEventFormSubmit
            ) {
                return;
            }

            const isEditing =
                Boolean(
                    calendarEventIdInput
                        ?.value
                        .trim()
                );

            calendarEventFormSubmit.disabled =
                isSubmitting;

            calendarEventFormSubmit
                .setAttribute(
                    "aria-busy",
                    String(
                        isSubmitting
                    )
                );

            calendarEventFormLoader
                ?.classList
                .toggle(
                    "hidden",
                    !isSubmitting
                );

            if (
                calendarEventFormSubmitText
            ) {
                if (isSubmitting) {
                    calendarEventFormSubmitText.textContent =
                        isEditing
                            ? "A guardar..."
                            : "A criar...";
                } else {
                    calendarEventFormSubmitText.textContent =
                        isEditing
                            ? "Guardar alterações"
                            : "Criar evento";
                }
            }
        }

        /* ==================================================
           Detalhes
        ================================================== */

        function closeCalendarEventDetailsModal() {
            closeModal(
                calendarEventDetailsModal
            );

            selectedCalendarEventId =
                null;
        }

        function openCalendarEventDetails(
            eventId
        ) {
            const event =
                calendarEvents.find(
                    item =>
                        item.id ===
                        eventId
                );

            if (!event) {
                showToast(
                    "error",
                    "Evento não encontrado",
                    "Não foi possível localizar o evento."
                );

                return;
            }

            selectedCalendarEventId =
                event.id;

            const brand =
                getBrandById(
                    event.brand_id
                );

            const member =
                getMemberById(
                    event.assigned_to
                );

            const plannerItem =
                getPlannerItemById(
                    event.plan_item_id
                );

            if (calendarEventDetailsTitle) {
                calendarEventDetailsTitle.textContent =
                    event.title;
            }

            if (calendarEventDetailsStatus) {
                calendarEventDetailsStatus.className =
                    `calendar-status-badge is-${event.status}`;

                calendarEventDetailsStatus.textContent =
                    statusLabels[
                        event.status
                    ] ||
                    event.status;
            }

            if (
                calendarEventDetailsStatusSelect
            ) {
                calendarEventDetailsStatusSelect.value =
                    event.status ===
                        "archived"
                        ? (
                            event.status_before_archive ||
                            "planned"
                        )
                        : event.status;

                calendarEventDetailsStatusSelect.disabled =
                    event.status ===
                    "archived";
            }

            if (
                calendarEventDetailsDescription
            ) {
                calendarEventDetailsDescription.textContent =
                    event.description
                        ?.trim() ||
                    "Sem descrição.";
            }

            if (calendarEventDetailsBrand) {
                calendarEventDetailsBrand.textContent =
                    brand?.name ||
                    "Marca indisponível";
            }

            if (calendarEventDetailsType) {
                calendarEventDetailsType.textContent =
                    eventTypeLabels[
                        event.event_type
                    ] ||
                    event.event_type;
            }

            if (
                calendarEventDetailsPlatform
            ) {
                calendarEventDetailsPlatform.textContent =
                    event.platform
                        ? (
                            platformLabels[
                                event.platform
                            ] ||
                            event.platform
                        )
                        : "Sem plataforma";
            }

            if (
                calendarEventDetailsAssignee
            ) {
                calendarEventDetailsAssignee.textContent =
                    member
                        ?.full_name ||
                    "Sem responsável";
            }

            if (calendarEventDetailsDate) {
                calendarEventDetailsDate.textContent =
                    formatEventDateRange(
                        event
                    );
            }

            if (
                calendarEventDetailsPlanItem
            ) {
                calendarEventDetailsPlanItem.textContent =
                    plannerItem
                        ?.title ||
                    "Sem item associado";
            }

            const isArchived =
                event.status ===
                "archived";

            calendarEventDetailsEdit
                ?.classList
                .toggle(
                    "hidden",
                    isArchived
                );

            calendarEventDetailsArchive
                ?.classList
                .toggle(
                    "hidden",
                    isArchived
                );

            calendarEventDetailsRestore
                ?.classList
                .toggle(
                    "hidden",
                    !isArchived
                );

            openModal(
                calendarEventDetailsModal
            );

            window.lucide
                ?.createIcons();
        }

        /* ==================================================
           Criação e edição
        ================================================== */

        calendarEventForm
            ?.addEventListener(
                "submit",
                async event => {
                    event.preventDefault();

                    if (
                        !validateCalendarEventForm()
                    ) {
                        showToast(
                            "error",
                            "Verifique o formulário",
                            "Existem campos que precisam ser corrigidos."
                        );

                        return;
                    }

                    const editingEventId =
                        calendarEventIdInput
                            ?.value
                            .trim() ||
                        null;

                    const isEditing =
                        Boolean(
                            editingEventId
                        );

                    const startValue =
                        new Date(
                            calendarEventStartInput.value
                        ).toISOString();

                    const endValue =
                        calendarEventEndInput
                            ?.value
                            ? new Date(
                                calendarEventEndInput.value
                            ).toISOString()
                            : null;

                    setCalendarEventSubmitting(
                        true
                    );

                    try {
                        let savedEvent =
                            null;

                        if (isEditing) {
                            const originalEvent =
                                calendarEvents.find(
                                    item =>
                                        item.id ===
                                        editingEventId
                                );

                            if (!originalEvent) {
                                throw new Error(
                                    "Evento não encontrado para edição."
                                );
                            }

                            const {
                                data: updatedEvent,
                                error: updateError
                            } = await supabaseClient.rpc(
                                "update_calendar_event",
                                {
                                    event_id_value:
                                        editingEventId,

                                    title_value:
                                        calendarEventTitleInput
                                            .value
                                            .trim(),

                                    description_value:
                                        calendarEventDescriptionInput
                                            ?.value
                                            .trim() ||
                                        null,

                                    event_type_value:
                                        calendarEventTypeInput
                                            ?.value ||
                                        "content",

                                    platform_value:
                                        calendarEventPlatformInput
                                            ?.value ||
                                        null,

                                    plan_item_id_value:
                                        calendarEventPlanItemInput
                                            ?.value ||
                                        null,

                                    metadata_value:
                                        originalEvent.metadata &&
                                        typeof originalEvent.metadata ===
                                            "object" &&
                                        !Array.isArray(
                                            originalEvent.metadata
                                        )
                                            ? originalEvent.metadata
                                            : {}
                                }
                            );

                            if (updateError) {
                                throw updateError;
                            }

                            const {
                                error: rescheduleError
                            } = await supabaseClient.rpc(
                                "reschedule_calendar_event",
                                {
                                    event_id_value:
                                        editingEventId,

                                    starts_at_value:
                                        startValue,

                                    ends_at_value:
                                        endValue,

                                    timezone_value:
                                        calendarEventTimezoneInput
                                            ?.value ||
                                        "Europe/Lisbon",

                                    all_day_value:
                                        Boolean(
                                            calendarEventAllDayInput
                                                ?.checked
                                        )
                                }
                            );

                            if (rescheduleError) {
                                throw rescheduleError;
                            }

                            const selectedAssignee =
                                calendarEventAssignedToInput
                                    ?.value ||
                                null;

                            const currentAssignee =
                                originalEvent.assigned_to ||
                                null;

                            if (
                                selectedAssignee !==
                                currentAssignee
                            ) {
                                const {
                                    error: assignError
                                } = await supabaseClient.rpc(
                                    "assign_calendar_event",
                                    {
                                        event_id_value:
                                            editingEventId,

                                        assigned_to_value:
                                            selectedAssignee
                                    }
                                );

                                if (assignError) {
                                    throw assignError;
                                }
                            }

                            const selectedStatus =
                                calendarEventStatusInput
                                    ?.value ||
                                "planned";

                            if (
                                selectedStatus !==
                                originalEvent.status
                            ) {
                                const {
                                    error: statusError
                                } = await supabaseClient.rpc(
                                    "change_calendar_event_status",
                                    {
                                        event_id_value:
                                            editingEventId,

                                        status_value:
                                            selectedStatus
                                    }
                                );

                                if (statusError) {
                                    throw statusError;
                                }
                            }

                            savedEvent =
                                updatedEvent;
                        } else {
                            const {
                                data: createdEvent,
                                error: createError
                            } = await supabaseClient.rpc(
                                "create_calendar_event",
                                {
                                    workspace_id_value:
                                        currentWorkspace.id,

                                    brand_id_value:
                                        calendarEventBrandInput.value,

                                    title_value:
                                        calendarEventTitleInput
                                            .value
                                            .trim(),

                                    event_type_value:
                                        calendarEventTypeInput
                                            ?.value ||
                                        "content",

                                    starts_at_value:
                                        startValue,

                                    timezone_value:
                                        calendarEventTimezoneInput
                                            ?.value ||
                                        "Europe/Lisbon",

                                    ends_at_value:
                                        endValue,

                                    all_day_value:
                                        Boolean(
                                            calendarEventAllDayInput
                                                ?.checked
                                        ),

                                    plan_item_id_value:
                                        calendarEventPlanItemInput
                                            ?.value ||
                                        null,

                                    assigned_to_value:
                                        calendarEventAssignedToInput
                                            ?.value ||
                                        null,

                                    platform_value:
                                        calendarEventPlatformInput
                                            ?.value ||
                                        null,

                                    description_value:
                                        calendarEventDescriptionInput
                                            ?.value
                                            .trim() ||
                                        null,

                                    metadata_value:
                                        {}
                                }
                            );

                            if (createError) {
                                throw createError;
                            }

                            const selectedStatus =
                                calendarEventStatusInput
                                    ?.value ||
                                "planned";

                            if (
                                selectedStatus !==
                                "planned"
                            ) {
                                const {
                                    error: statusError
                                } = await supabaseClient.rpc(
                                    "change_calendar_event_status",
                                    {
                                        event_id_value:
                                            createdEvent.id,

                                        status_value:
                                            selectedStatus
                                    }
                                );

                                if (statusError) {
                                    throw statusError;
                                }
                            }

                            savedEvent =
                                createdEvent;
                        }

                        console.log(
                            isEditing
                                ? "Evento atualizado:"
                                : "Evento criado:",
                            savedEvent
                        );

                        closeCalendarEventModal();

                        await loadCalendarData();

                        showToast(
                            "success",
                            isEditing
                                ? "Evento atualizado"
                                : "Evento criado",
                            isEditing
                                ? "As alterações foram guardadas."
                                : "O evento foi adicionado ao calendário."
                        );
                    } catch (error) {
                        console.error(
                            isEditing
                                ? "Erro ao atualizar evento:"
                                : "Erro ao criar evento:",
                            error
                        );

                        const message =
                            error?.message ||
                            (
                                isEditing
                                    ? "Não foi possível atualizar o evento."
                                    : "Não foi possível criar o evento."
                            );

                        if (
                            calendarEventFormError
                        ) {
                            calendarEventFormError.textContent =
                                message;

                            calendarEventFormError
                                .classList
                                .remove(
                                    "hidden"
                                );
                        }

                        showToast(
                            "error",
                            isEditing
                                ? "Erro ao atualizar evento"
                                : "Erro ao criar evento",
                            message
                        );
                    } finally {
                        setCalendarEventSubmitting(
                            false
                        );
                    }
                }
            );

        /* ==================================================
           Estado do evento
        ================================================== */

        async function changeCalendarEventStatus(
            eventId,
            status
        ) {
            try {
                const {
                    error
                } = await supabaseClient.rpc(
                    "change_calendar_event_status",
                    {
                        event_id_value:
                            eventId,

                        status_value:
                            status
                    }
                );

                if (error) {
                    throw error;
                }

                closeCalendarEventDetailsModal();

                await loadCalendarData();

                showToast(
                    "success",
                    "Estado atualizado",
                    "O estado do evento foi alterado."
                );
            } catch (error) {
                console.error(
                    "Erro ao alterar estado:",
                    error
                );

                showToast(
                    "error",
                    "Erro ao alterar estado",
                    error?.message ||
                    "Não foi possível alterar o estado."
                );
            }
        }

        /* ==================================================
           Arquivar e restaurar
        ================================================== */

        function openArchiveCalendarEventModal(
            eventId
        ) {
            selectedArchiveEventId =
                eventId;

            closeCalendarEventDetailsModal();

            openModal(
                archiveCalendarEventModal
            );
        }

        function closeArchiveCalendarEventModal() {
            closeModal(
                archiveCalendarEventModal
            );

            selectedArchiveEventId =
                null;
        }

        async function archiveCalendarEvent(
            eventId
        ) {
            if (!eventId) {
                return;
            }

            archiveCalendarEventConfirm.disabled =
                true;

            archiveCalendarEventConfirm.textContent =
                "A arquivar...";

            try {
                const {
                    data,
                    error
                } = await supabaseClient.rpc(
                    "archive_calendar_event",
                    {
                        event_id_value:
                            eventId
                    }
                );

                if (error) {
                    throw error;
                }

                console.log(
                    "Evento arquivado:",
                    data
                );

                closeArchiveCalendarEventModal();

                await loadCalendarData();

                showToast(
                    "success",
                    "Evento arquivado",
                    "O evento foi enviado para o arquivo."
                );
            } catch (error) {
                console.error(
                    "Erro ao arquivar evento:",
                    error
                );

                showToast(
                    "error",
                    "Erro ao arquivar evento",
                    error?.message ||
                    "Não foi possível arquivar o evento."
                );
            } finally {
                archiveCalendarEventConfirm.disabled =
                    false;

                archiveCalendarEventConfirm.textContent =
                    "Arquivar evento";
            }
        }

        async function restoreCalendarEvent(
            eventId
        ) {
            if (!eventId) {
                return;
            }

            try {
                const {
                    data,
                    error
                } = await supabaseClient.rpc(
                    "restore_calendar_event",
                    {
                        event_id_value:
                            eventId
                    }
                );

                if (error) {
                    throw error;
                }

                console.log(
                    "Evento restaurado:",
                    data
                );

                closeCalendarEventDetailsModal();

                await loadCalendarData();

                showToast(
                    "success",
                    "Evento restaurado",
                    "O evento voltou ao calendário."
                );
            } catch (error) {
                console.error(
                    "Erro ao restaurar evento:",
                    error
                );

                showToast(
                    "error",
                    "Erro ao restaurar evento",
                    error?.message ||
                    "Não foi possível restaurar o evento."
                );
            }
        }

        /* ==================================================
           Eventos da página
        ================================================== */

        createCalendarEventButton
            ?.addEventListener(
                "click",
                openCreateCalendarEventModal
            );

        emptyCreateCalendarEventButton
            ?.addEventListener(
                "click",
                openCreateCalendarEventModal
            );

        calendarPreviousButton
            ?.addEventListener(
                "click",
                () => {
                    visibleMonth =
                        new Date(
                            visibleMonth.getFullYear(),
                            visibleMonth.getMonth() -
                                1,
                            1
                        );

                    renderCalendar();
                }
            );

        calendarNextButton
            ?.addEventListener(
                "click",
                () => {
                    visibleMonth =
                        new Date(
                            visibleMonth.getFullYear(),
                            visibleMonth.getMonth() +
                                1,
                            1
                        );

                    renderCalendar();
                }
            );

        calendarTodayButton
            ?.addEventListener(
                "click",
                () => {
                    const now =
                        new Date();

                    visibleMonth =
                        new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            1
                        );

                    renderCalendar();
                }
            );

        calendarGrid
            ?.addEventListener(
                "click",
                event => {
                    const eventChip =
                        event.target.closest(
                            "[data-calendar-event-id]"
                        );

                    if (!eventChip) {
                        return;
                    }

                    openCalendarEventDetails(
                        eventChip.dataset
                            .calendarEventId
                    );
                }
            );

        /* ==================================================
           Eventos dos filtros
        ================================================== */

        calendarSearchInput
            ?.addEventListener(
                "input",
                renderCalendar
            );

        calendarBrandFilter
            ?.addEventListener(
                "change",
                renderCalendar
            );

        calendarStatusFilter
            ?.addEventListener(
                "change",
                renderCalendar
            );

        calendarTypeFilter
            ?.addEventListener(
                "change",
                renderCalendar
            );

        calendarPlatformFilter
            ?.addEventListener(
                "change",
                renderCalendar
            );

        clearCalendarFiltersButton
            ?.addEventListener(
                "click",
                () => {
                    if (
                        calendarSearchInput
                    ) {
                        calendarSearchInput.value =
                            "";
                    }

                    if (
                        calendarBrandFilter
                    ) {
                        calendarBrandFilter.value =
                            "all";
                    }

                    if (
                        calendarStatusFilter
                    ) {
                        calendarStatusFilter.value =
                            "all";
                    }

                    if (
                        calendarTypeFilter
                    ) {
                        calendarTypeFilter.value =
                            "all";
                    }

                    if (
                        calendarPlatformFilter
                    ) {
                        calendarPlatformFilter.value =
                            "all";
                    }

                    renderCalendar();

                    showToast(
                        "info",
                        "Filtros removidos",
                        "A pesquisa e os filtros foram redefinidos."
                    );
                }
            );

        /* ==================================================
           Eventos do modal de formulário
        ================================================== */

        calendarEventModalClose
            ?.addEventListener(
                "click",
                closeCalendarEventModal
            );

        calendarEventFormCancel
            ?.addEventListener(
                "click",
                closeCalendarEventModal
            );

        calendarEventModal
            ?.addEventListener(
                "click",
                event => {
                    if (
                        event.target ===
                        calendarEventModal
                    ) {
                        closeCalendarEventModal();
                    }
                }
            );

        calendarEventBrandInput
            ?.addEventListener(
                "change",
                () => {
                    calendarEventBrandInput
                        .classList
                        .remove(
                            "is-invalid"
                        );

                    calendarEventBrandError.textContent =
                        "";
                }
            );

        calendarEventTitleInput
            ?.addEventListener(
                "input",
                () => {
                    calendarEventTitleInput
                        .classList
                        .remove(
                            "is-invalid"
                        );

                    calendarEventTitleError.textContent =
                        "";
                }
            );

        calendarEventStartInput
            ?.addEventListener(
                "change",
                () => {
                    calendarEventStartInput
                        .classList
                        .remove(
                            "is-invalid"
                        );

                    calendarEventStartError.textContent =
                        "";
                }
            );

        calendarEventEndInput
            ?.addEventListener(
                "change",
                () => {
                    calendarEventEndInput
                        .classList
                        .remove(
                            "is-invalid"
                        );

                    calendarEventEndError.textContent =
                        "";
                }
            );

        /* ==================================================
           Eventos dos detalhes
        ================================================== */

        calendarEventDetailsClose
            ?.addEventListener(
                "click",
                closeCalendarEventDetailsModal
            );

        calendarEventDetailsCancel
            ?.addEventListener(
                "click",
                closeCalendarEventDetailsModal
            );

        calendarEventDetailsModal
            ?.addEventListener(
                "click",
                event => {
                    if (
                        event.target ===
                        calendarEventDetailsModal
                    ) {
                        closeCalendarEventDetailsModal();
                    }
                }
            );

        calendarEventDetailsEdit
            ?.addEventListener(
                "click",
                () => {
                    const eventId =
                        selectedCalendarEventId;

                    if (!eventId) {
                        return;
                    }

                    openEditCalendarEventModal(
                        eventId
                    );
                }
            );

        calendarEventDetailsArchive
            ?.addEventListener(
                "click",
                () => {
                    if (
                        !selectedCalendarEventId
                    ) {
                        return;
                    }

                    openArchiveCalendarEventModal(
                        selectedCalendarEventId
                    );
                }
            );

        calendarEventDetailsRestore
            ?.addEventListener(
                "click",
                async () => {
                    if (
                        !selectedCalendarEventId
                    ) {
                        return;
                    }

                    await restoreCalendarEvent(
                        selectedCalendarEventId
                    );
                }
            );

        calendarEventDetailsStatusSelect
            ?.addEventListener(
                "change",
                async () => {
                    if (
                        !selectedCalendarEventId
                    ) {
                        return;
                    }

                    await changeCalendarEventStatus(
                        selectedCalendarEventId,
                        calendarEventDetailsStatusSelect.value
                    );
                }
            );

        /* ==================================================
           Eventos do arquivamento
        ================================================== */

        archiveCalendarEventCancel
            ?.addEventListener(
                "click",
                closeArchiveCalendarEventModal
            );

        archiveCalendarEventModal
            ?.addEventListener(
                "click",
                event => {
                    if (
                        event.target ===
                        archiveCalendarEventModal
                    ) {
                        closeArchiveCalendarEventModal();
                    }
                }
            );

        archiveCalendarEventConfirm
            ?.addEventListener(
                "click",
                async () => {
                    if (
                        !selectedArchiveEventId
                    ) {
                        return;
                    }

                    await archiveCalendarEvent(
                        selectedArchiveEventId
                    );
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
           Escape
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
                    archiveCalendarEventModal
                        ?.classList
                        .contains(
                            "is-open"
                        )
                ) {
                    closeArchiveCalendarEventModal();

                    return;
                }

                if (
                    calendarEventModal
                        ?.classList
                        .contains(
                            "is-open"
                        )
                ) {
                    closeCalendarEventModal();

                    return;
                }

                if (
                    calendarEventDetailsModal
                        ?.classList
                        .contains(
                            "is-open"
                        )
                ) {
                    closeCalendarEventDetailsModal();

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
                await loadCalendarData();
            }
        } catch (error) {
            console.error(
                "Erro ao inicializar Calendário:",
                error
            );

            setCalendarLoading(
                false
            );

            showToast(
                "error",
                "Erro ao iniciar Calendário",
                error?.message ||
                "Não foi possível iniciar a página."
            );
        }

        window.lucide
            ?.createIcons();
    }
);
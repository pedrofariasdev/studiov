"use strict";

/* ==========================================================
   StudioV — Analytics
========================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async function () {
    const supabaseClient =
      window.supabaseClient;

    if (!supabaseClient) {
      console.error(
        "Cliente Supabase não encontrado."
      );

      return;
    }

    /* ======================================================
       Configurações
    ====================================================== */

    const STORAGE_KEYS = {
      activeWorkspace:
        "studiov_active_workspace_id",
    };

    const STATUS_ORDER = [
      "draft",
      "in_review",
      "approved",
      "scheduled",
      "published",
      "cancelled",
    ];

    const STATUS_LABELS = {
      draft: "Rascunho",
      in_review: "Em revisão",
      approved: "Aprovado",
      scheduled: "Agendado",
      published: "Publicado",
      cancelled: "Cancelado",
      archived: "Arquivado",
    };

    const PLATFORM_INFORMATION = {
        instagram: {
        label: "Instagram",
        icon: "camera",
        },

      facebook: {
        label: "Facebook",
        icon: "users",
      },

      linkedin: {
        label: "LinkedIn",
        icon: "briefcase-business",
      },

      tiktok: {
        label: "TikTok",
        icon: "music-2",
      },

      youtube: {
        label: "YouTube",
        icon: "youtube",
      },

      youtube_shorts: {
        label: "YouTube Shorts",
        icon: "youtube",
      },

      pinterest: {
        label: "Pinterest",
        icon: "bookmark",
      },

      threads: {
        label: "Threads",
        icon: "at-sign",
      },

      x: {
        label: "X",
        icon: "message-circle",
      },
    };

    /* ======================================================
       Elementos
    ====================================================== */

    const elements = {
      currentWorkspaceName:
        document.getElementById(
          "current-workspace-name"
        ),

      sidebarUserName:
        document.getElementById(
          "sidebar-user-name"
        ),

      sidebarUserEmail:
        document.getElementById(
          "sidebar-user-email"
        ),

      sidebarUserAvatar:
        document.getElementById(
          "sidebar-user-avatar"
        ),

      topbarAvatar:
        document.getElementById(
          "topbar-avatar"
        ),

      period:
        document.getElementById(
          "analytics-period"
        ),

      pageMessage:
        document.getElementById(
          "analytics-page-message"
        ),

      totalContents:
        document.getElementById(
          "analytics-total-contents"
        ),

      publishedContents:
        document.getElementById(
          "analytics-published-contents"
        ),

      scheduledContents:
        document.getElementById(
          "analytics-scheduled-contents"
        ),

      publicationRate:
        document.getElementById(
          "analytics-publication-rate"
        ),

      statusList:
        document.getElementById(
          "analytics-status-list"
        ),

      activityChart:
        document.getElementById(
          "analytics-activity-chart"
        ),

      platformList:
        document.getElementById(
          "analytics-platform-list"
        ),

      recentList:
        document.getElementById(
          "analytics-recent-list"
        ),

      sidebar:
        document.getElementById(
          "dashboard-sidebar"
        ),

      sidebarOpenButton:
        document.getElementById(
          "topbar-menu-button"
        ),

      sidebarCloseButton:
        document.getElementById(
          "sidebar-close"
        ),

      sidebarOverlay:
        document.getElementById(
          "sidebar-overlay"
        ),

      toastContainer:
        document.getElementById(
          "analytics-toast-container"
        ),
    };

    /* ======================================================
       Estado
    ====================================================== */

    let currentUser = null;
    let currentProfile = null;
    let currentWorkspace = null;

    let allContents = [];

    /* ======================================================
       Utilitários
    ====================================================== */

    function refreshIcons() {
      window.lucide?.createIcons();
    }

    function escapeHtml(value) {
      const temporaryElement =
        document.createElement("div");

      temporaryElement.textContent =
        String(value ?? "");

      return temporaryElement.innerHTML;
    }

    function getInitial(value) {
      return (
        String(value || "U")
          .trim()
          .charAt(0)
          .toUpperCase() || "U"
      );
    }

    function normalizeText(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .trim()
        .toLowerCase();
    }

    function safeStorageGet(key) {
      try {
        return window.localStorage.getItem(
          key
        );
      } catch (error) {
        console.warn(
          `Erro ao ler ${key}:`,
          error
        );

        return null;
      }
    }

    function safeStorageSet(
      key,
      value
    ) {
      try {
        window.localStorage.setItem(
          key,
          value
        );
      } catch (error) {
        console.warn(
          `Erro ao guardar ${key}:`,
          error
        );
      }
    }

    function formatDate(value) {
      if (!value) {
        return "Sem data";
      }

      const date = new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "Sem data";
      }

      return new Intl.DateTimeFormat(
        "pt-PT",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      ).format(date);
    }

    function showPageMessage(message) {
      if (!elements.pageMessage) {
        return;
      }

      elements.pageMessage.textContent =
        message;

      elements.pageMessage.hidden =
        false;
    }

    function hidePageMessage() {
      if (elements.pageMessage) {
        elements.pageMessage.hidden =
          true;
      }
    }

    function showToast(
      title,
      message
    ) {
      if (!elements.toastContainer) {
        return;
      }

      const toast =
        document.createElement("article");

      toast.className =
        "analytics-toast";

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

      window.setTimeout(
        function () {
          toast.remove();
        },
        5000
      );
    }

    function getStatusLabel(status) {
      return (
        STATUS_LABELS[status] ||
        status ||
        "Sem estado"
      );
    }

    function getStatusClass(status) {
      return String(status || "")
        .replaceAll("_", "-");
    }

    function getPlatformInformation(
      platform
    ) {
      const normalized =
        normalizeText(platform)
          .replaceAll(" ", "_")
          .replaceAll("-", "_");

      return (
        PLATFORM_INFORMATION[
          normalized
        ] || {
          label:
            platform ||
            "Outra plataforma",

          icon: "share-2",
        }
      );
    }

    function normalizePlatforms(value) {
      if (!value) {
        return [];
      }

      if (Array.isArray(value)) {
        return value.filter(Boolean);
      }

      if (
        typeof value === "string"
      ) {
        try {
          const parsed =
            JSON.parse(value);

          if (
            Array.isArray(parsed)
          ) {
            return parsed.filter(Boolean);
          }
        } catch (error) {
          return value
            .split(",")
            .map(function (item) {
              return item.trim();
            })
            .filter(Boolean);
        }
      }

      return [];
    }

    /* ======================================================
       Autenticação
    ====================================================== */

    async function loadAuthenticatedUser() {
      if (window.studioVAuthReady) {
        const guardedUser =
          await window.studioVAuthReady;

        if (guardedUser) {
          currentUser =
            guardedUser;

          return currentUser;
        }

        if (
          window.studioVPageAccessDenied ===
          true
        ) {
          return null;
        }
      }

      const {
        data,
        error,
      } =
        await supabaseClient
          .auth
          .getUser();

      if (error) {
        throw error;
      }

      currentUser =
        data?.user || null;

      return currentUser;
    }

    async function loadProfile() {
      if (!currentUser) {
        return null;
      }

      const {
        data,
        error,
      } =
        await supabaseClient
          .from("profiles")
          .select(`
            id,
            full_name,
            avatar_url
          `)
          .eq(
            "id",
            currentUser.id
          )
          .maybeSingle();

      if (error) {
        console.warn(
          "Erro ao carregar perfil:",
          error.message
        );

        return null;
      }

      currentProfile =
        data || null;

      return currentProfile;
    }

    /* ======================================================
       Workspace
    ====================================================== */

    async function loadWorkspace() {
      const storedWorkspaceId =
        safeStorageGet(
          STORAGE_KEYS.activeWorkspace
        );

      if (storedWorkspaceId) {
        const {
          data,
          error,
        } =
          await supabaseClient
            .from("workspaces")
            .select(`
              id,
              owner_id,
              name,
              plan,
              status
            `)
            .eq(
              "id",
              storedWorkspaceId
            )
            .maybeSingle();

        if (!error && data) {
          currentWorkspace =
            data;

          return currentWorkspace;
        }
      }

      const {
        data: ownedWorkspace,
        error: ownedError,
      } =
        await supabaseClient
          .from("workspaces")
          .select(`
            id,
            owner_id,
            name,
            plan,
            status
          `)
          .eq(
            "owner_id",
            currentUser.id
          )
          .eq(
            "status",
            "active"
          )
          .limit(1)
          .maybeSingle();

      if (
        !ownedError &&
        ownedWorkspace
      ) {
        currentWorkspace =
          ownedWorkspace;

        safeStorageSet(
          STORAGE_KEYS.activeWorkspace,
          ownedWorkspace.id
        );

        return currentWorkspace;
      }

      const {
        data: membership,
        error: membershipError,
      } =
        await supabaseClient
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
        throw membershipError;
      }

      if (
        !membership?.workspace_id
      ) {
        return null;
      }

      const {
        data: memberWorkspace,
        error: workspaceError,
      } =
        await supabaseClient
          .from("workspaces")
          .select(`
            id,
            owner_id,
            name,
            plan,
            status
          `)
          .eq(
            "id",
            membership.workspace_id
          )
          .maybeSingle();

      if (workspaceError) {
        throw workspaceError;
      }

      currentWorkspace =
        memberWorkspace || null;

      if (currentWorkspace) {
        safeStorageSet(
          STORAGE_KEYS.activeWorkspace,
          currentWorkspace.id
        );
      }

      return currentWorkspace;
    }

    /* ======================================================
       Identidade
    ====================================================== */

    function renderIdentity() {
      const isAnonymous =
        Boolean(
          currentUser?.is_anonymous
        );

      const name =
        currentProfile
          ?.full_name ||
        currentUser
          ?.user_metadata
          ?.full_name ||
        (
          isAnonymous
            ? "Utilizador demo"
            : currentUser?.email
                ?.split("@")[0]
        ) ||
        "Utilizador";

      const email =
        currentUser?.email ||
        (
          isAnonymous
            ? "Sessão de demonstração"
            : "Email indisponível"
        );

      const initial =
        getInitial(name);

      if (
        elements.currentWorkspaceName
      ) {
        elements.currentWorkspaceName
          .textContent =
          currentWorkspace?.name ||
          "Workspace";
      }

      if (
        elements.sidebarUserName
      ) {
        elements.sidebarUserName
          .textContent =
          name;
      }

      if (
        elements.sidebarUserEmail
      ) {
        elements.sidebarUserEmail
          .textContent =
          email;
      }

      if (
        elements.sidebarUserAvatar
      ) {
        elements.sidebarUserAvatar
          .textContent =
          initial;
      }

      if (
        elements.topbarAvatar
      ) {
        elements.topbarAvatar
          .textContent =
          initial;
      }
    }

    /* ======================================================
       Dados
    ====================================================== */

    async function loadContents() {
      const {
        data,
        error,
      } =
        await supabaseClient
          .from("contents")
          .select(`
            id,
            title,
            content_type,
            status,
            target_platforms,
            created_at,
            updated_at
          `)
          .eq(
            "workspace_id",
            currentWorkspace.id
          )
          .neq(
            "status",
            "archived"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) {
        throw error;
      }

      allContents =
        data || [];

      return allContents;
    }

    /* ======================================================
       Período
    ====================================================== */

    function getFilteredContents() {
      const selectedPeriod =
        elements.period?.value ||
        "180";

      if (
        selectedPeriod === "all"
      ) {
        return [...allContents];
      }

      const days =
        Number(selectedPeriod);

      const limitDate =
        new Date();

      limitDate.setDate(
        limitDate.getDate() -
        days
      );

      return allContents.filter(
        function (content) {
          const createdAt =
            new Date(
              content.created_at
            );

          return (
            !Number.isNaN(
              createdAt.getTime()
            ) &&
            createdAt >= limitDate
          );
        }
      );
    }

    /* ======================================================
       Indicadores
    ====================================================== */

    function renderKpis(contents) {
      const total =
        contents.length;

      const published =
        contents.filter(
          function (content) {
            return (
              content.status ===
              "published"
            );
          }
        ).length;

      const scheduled =
        contents.filter(
          function (content) {
            return (
              content.status ===
              "scheduled"
            );
          }
        ).length;

      const publicationRate =
        total > 0
          ? Math.round(
              (
                published /
                total
              ) * 100
            )
          : 0;

      elements.totalContents.textContent =
        String(total);

      elements.publishedContents.textContent =
        String(published);

      elements.scheduledContents.textContent =
        String(scheduled);

      elements.publicationRate.textContent =
        `${publicationRate}%`;
    }

    /* ======================================================
       Estados
    ====================================================== */

    function renderStatusDistribution(
      contents
    ) {
      if (!elements.statusList) {
        return;
      }

      if (
        contents.length === 0
      ) {
        elements.statusList.innerHTML = `
          <div class="analytics-empty-state">

            <i data-lucide="list-checks"></i>

            <strong>
              Nenhum conteúdo encontrado
            </strong>

            <p>
              Crie conteúdos para acompanhar
              a distribuição por estado.
            </p>

          </div>
        `;

        refreshIcons();
        return;
      }

      const counts =
        new Map();

      contents.forEach(
        function (content) {
          const status =
            content.status ||
            "draft";

          counts.set(
            status,
            (
              counts.get(status) ||
              0
            ) + 1
          );
        }
      );

      const statuses = [
        ...STATUS_ORDER,

        ...Array.from(
          counts.keys()
        ).filter(
          function (status) {
            return !STATUS_ORDER.includes(
              status
            );
          }
        ),
      ];

      elements.statusList.innerHTML =
        statuses
          .filter(
            function (status) {
              return counts.has(status);
            }
          )
          .map(
            function (status) {
              const count =
                counts.get(status) ||
                0;

              const percentage =
                Math.round(
                  (
                    count /
                    contents.length
                  ) * 100
                );

              return `
                <div class="analytics-status-item">

                  <div class="analytics-status-label">

                    <span
                      class="
                        analytics-status-dot
                        ${getStatusClass(
                          status
                        )}
                      "
                    ></span>

                    <span>
                      ${escapeHtml(
                        getStatusLabel(
                          status
                        )
                      )}
                    </span>

                  </div>

                  <div class="analytics-status-progress">

                    <span
                      style="width: ${percentage}%;"
                    ></span>

                  </div>

                  <strong class="analytics-status-count">
                    ${count}
                  </strong>

                </div>
              `;
            }
          )
          .join("");
    }

    /* ======================================================
       Atividade mensal
    ====================================================== */

    function getMonthKey(date) {
      return [
        date.getFullYear(),
        String(
          date.getMonth() + 1
        ).padStart(2, "0"),
      ].join("-");
    }

    function createMonthBuckets() {
      const selectedPeriod =
        elements.period?.value ||
        "180";

      const numberOfMonths =
        selectedPeriod === "365"
          ? 12
          : selectedPeriod === "all"
            ? 12
            : 6;

      const buckets = [];

      const currentDate =
        new Date();

      currentDate.setDate(1);
      currentDate.setHours(
        0,
        0,
        0,
        0
      );

      for (
        let index =
          numberOfMonths - 1;
        index >= 0;
        index -= 1
      ) {
        const date =
          new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() -
              index,
            1
          );

        buckets.push({
          key: getMonthKey(date),

          label:
            new Intl.DateTimeFormat(
              "pt-PT",
              {
                month: "short",
              }
            ).format(date),

          value: 0,
        });
      }

      return buckets;
    }

    function renderActivity(contents) {
      if (!elements.activityChart) {
        return;
      }

      const buckets =
        createMonthBuckets();

      const bucketsMap =
        new Map(
          buckets.map(
            function (bucket) {
              return [
                bucket.key,
                bucket,
              ];
            }
          )
        );

      contents.forEach(
        function (content) {
          const date =
            new Date(
              content.created_at
            );

          if (
            Number.isNaN(
              date.getTime()
            )
          ) {
            return;
          }

          const bucket =
            bucketsMap.get(
              getMonthKey(date)
            );

          if (bucket) {
            bucket.value += 1;
          }
        }
      );

      const maximum =
        Math.max(
          ...buckets.map(
            function (bucket) {
              return bucket.value;
            }
          ),
          1
        );

      elements.activityChart.innerHTML =
        buckets
          .map(
            function (bucket) {
              const percentage =
                bucket.value > 0
                  ? Math.max(
                      (
                        bucket.value /
                        maximum
                      ) * 100,
                      4
                    )
                  : 2;

              return `
                <div class="analytics-activity-column">

                  <span class="analytics-activity-value">
                    ${bucket.value}
                  </span>

                  <div class="analytics-activity-bar-area">

                    <span
                      class="analytics-activity-bar"
                      style="height: ${percentage}%;"
                      title="${bucket.value} conteúdos"
                    ></span>

                  </div>

                  <span class="analytics-activity-label">
                    ${escapeHtml(
                      bucket.label
                    )}
                  </span>

                </div>
              `;
            }
          )
          .join("");
    }

    /* ======================================================
       Plataformas
    ====================================================== */

    function renderPlatforms(contents) {
      if (!elements.platformList) {
        return;
      }

      const platformCounts =
        new Map();

      contents.forEach(
        function (content) {
          const platforms =
            normalizePlatforms(
              content.target_platforms
            );

          platforms.forEach(
            function (platform) {
              const normalized =
                normalizeText(platform)
                  .replaceAll(
                    " ",
                    "_"
                  )
                  .replaceAll(
                    "-",
                    "_"
                  );

              platformCounts.set(
                normalized,
                (
                  platformCounts.get(
                    normalized
                  ) || 0
                ) + 1
              );
            }
          );
        }
      );

      const orderedPlatforms =
        Array.from(
          platformCounts.entries()
        ).sort(
          function (
            first,
            second
          ) {
            return (
              second[1] -
              first[1]
            );
          }
        );

      if (
        orderedPlatforms.length === 0
      ) {
        elements.platformList.innerHTML = `
          <div class="analytics-empty-state">

            <i data-lucide="share-2"></i>

            <strong>
              Nenhuma plataforma selecionada
            </strong>

            <p>
              Escolha as redes sociais nos
              conteúdos para visualizar esta análise.
            </p>

          </div>
        `;

        refreshIcons();
        return;
      }

      elements.platformList.innerHTML =
        orderedPlatforms
          .slice(0, 6)
          .map(
            function (
              [
                platform,
                count,
              ]
            ) {
              const information =
                getPlatformInformation(
                  platform
                );

              return `
                <article class="analytics-platform-item">

                  <span class="analytics-platform-icon">

                    <i
                      data-lucide="${information.icon}"
                    ></i>

                  </span>

                  <div class="analytics-platform-information">

                    <strong>
                      ${escapeHtml(
                        information.label
                      )}
                    </strong>

                    <span>
                      Conteúdos direcionados
                    </span>

                  </div>

                  <strong class="analytics-platform-count">
                    ${count}
                  </strong>

                </article>
              `;
            }
          )
          .join("");

      refreshIcons();
    }

    /* ======================================================
       Conteúdos recentes
    ====================================================== */

    function renderRecentContents(
      contents
    ) {
      if (!elements.recentList) {
        return;
      }

      const recentContents = [
        ...contents,
      ]
        .sort(
          function (
            first,
            second
          ) {
            return (
              new Date(
                second.updated_at ||
                second.created_at
              ) -
              new Date(
                first.updated_at ||
                first.created_at
              )
            );
          }
        )
        .slice(0, 6);

      if (
        recentContents.length === 0
      ) {
        elements.recentList.innerHTML = `
          <div class="analytics-empty-state">

            <i data-lucide="files"></i>

            <strong>
              Nenhum conteúdo recente
            </strong>

            <p>
              Os últimos conteúdos do workspace
              aparecerão aqui.
            </p>

          </div>
        `;

        refreshIcons();
        return;
      }

      elements.recentList.innerHTML =
        recentContents
          .map(
            function (content) {
              const status =
                content.status ||
                "draft";

              return `
                <article class="analytics-recent-item">

                  <div class="analytics-recent-information">

                    <strong>
                      ${escapeHtml(
                        content.title ||
                        "Conteúdo sem título"
                      )}
                    </strong>

                    <span>
                      ${escapeHtml(
                        content.content_type ||
                        "Conteúdo"
                      )}
                    </span>

                  </div>

                  <span
                    class="
                      analytics-recent-status
                      ${getStatusClass(
                        status
                      )}
                    "
                  >
                    ${escapeHtml(
                      getStatusLabel(
                        status
                      )
                    )}
                  </span>

                  <time class="analytics-recent-date">
                    ${escapeHtml(
                      formatDate(
                        content.updated_at ||
                        content.created_at
                      )
                    )}
                  </time>

                </article>
              `;
            }
          )
          .join("");
    }

    /* ======================================================
       Renderização geral
    ====================================================== */

    function renderAnalytics() {
      const filteredContents =
        getFilteredContents();

      renderKpis(
        filteredContents
      );

      renderStatusDistribution(
        filteredContents
      );

      renderActivity(
        filteredContents
      );

      renderPlatforms(
        filteredContents
      );

      renderRecentContents(
        filteredContents
      );

      refreshIcons();
    }

    /* ======================================================
       Sidebar móvel
    ====================================================== */

    function openSidebar() {
      document.body.classList.add(
        "sidebar-open"
      );

      elements.sidebarOpenButton
        ?.setAttribute(
          "aria-expanded",
          "true"
        );
    }

    function closeSidebar() {
      document.body.classList.remove(
        "sidebar-open"
      );

      elements.sidebarOpenButton
        ?.setAttribute(
          "aria-expanded",
          "false"
        );
    }

    function initializeEvents() {
      elements.period?.addEventListener(
        "change",
        renderAnalytics
      );

      elements.sidebarOpenButton
        ?.addEventListener(
          "click",
          openSidebar
        );

      elements.sidebarCloseButton
        ?.addEventListener(
          "click",
          closeSidebar
        );

      elements.sidebarOverlay
        ?.addEventListener(
          "click",
          closeSidebar
        );

      document.addEventListener(
        "keydown",
        function (event) {
          if (
            event.key === "Escape"
          ) {
            closeSidebar();
          }
        }
      );
    }

    /* ======================================================
       Inicialização
    ====================================================== */

    async function initializeAnalytics() {
      initializeEvents();
      refreshIcons();

      try {
        hidePageMessage();

        await loadAuthenticatedUser();

        if (!currentUser) {
          throw new Error(
            "Utilizador não autenticado."
          );
        }

        await loadProfile();
        await loadWorkspace();

        if (!currentWorkspace) {
          throw new Error(
            "Nenhum workspace ativo foi encontrado."
          );
        }

        renderIdentity();

        await loadContents();

        renderAnalytics();

        console.log(
          "Analytics carregada:",
          {
            workspace:
              currentWorkspace.name,

            contents:
              allContents.length,
          }
        );
      } catch (error) {
        console.error(
          "Erro ao iniciar Analytics:",
          error
        );

        showPageMessage(
          error?.message ||
          "Não foi possível carregar os dados da Analytics."
        );

        showToast(
          "Analytics indisponível",
          "Atualize a página e tente novamente."
        );
      }
    }

    await initializeAnalytics();
  }
);

"use strict";

/* ==========================================================
   StudioV — Menu do utilizador
========================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function initializeUserMenu() {
    const ROUTES = {
      profile:
        "/html/dashboard/profile.html",

      home:
        "/html/dashboard/home.html",

      login:
        "/html/auth/login.html",
    };

    const STORAGE_KEYS = {
      demoMode:
        "studiov_demo_mode",

      demoUserId:
        "studiov_demo_user_id",

      activeWorkspace:
        "studiov_active_workspace_id",

      tourCompleted:
        "studiov_demo_tour_completed",

      pendingEmail:
        "studiov_account_pending_email",

      pendingName:
        "studiov_account_pending_name",
    };


    /* ========================================================
       Elementos
    ======================================================== */

    const trigger =
      document.getElementById(
        "sidebar-user-trigger"
      );

    const menu =
      document.getElementById(
        "sidebar-user-menu"
      );

    const restartTourButton =
      document.getElementById(
        "restart-demo-tour"
      );

    const createAccountButton =
      document.getElementById(
        "create-account-demo"
      );

    const logoutButton =
      document.getElementById(
        "logout-user"
      );

    /*
     * Procura o botão Meu perfil por diferentes
     * formatos possíveis no HTML.
     */

    const profileButton =
      document.getElementById(
        "open-user-profile"
      ) ||

      document.getElementById(
        "user-profile-link"
      ) ||

      menu?.querySelector(
        `
          [data-user-profile],
          [data-action="profile"],
          a[href$="/profile.html"],
          a[href*="/profile.html"]
        `
      );


    if (!trigger || !menu) {
      console.error(
        "Menu do utilizador não encontrado no HTML."
      );

      return;
    }


    /* ========================================================
       Supabase
    ======================================================== */

    function getSupabaseClient() {
      return window.supabaseClient || null;
    }


    /* ========================================================
       Abrir e fechar
    ======================================================== */

    function openMenu() {
      menu.hidden = false;

      trigger.setAttribute(
        "aria-expanded",
        "true"
      );
    }


    function closeMenu() {
      menu.hidden = true;

      trigger.setAttribute(
        "aria-expanded",
        "false"
      );
    }


    function toggleMenu() {
      const isOpen =
        trigger.getAttribute(
          "aria-expanded"
        ) === "true";

      if (isOpen) {
        closeMenu();
        return;
      }

      openMenu();
    }


    trigger.addEventListener(
      "click",
      function handleTriggerClick(event) {
        event.preventDefault();
        event.stopPropagation();

        toggleMenu();
      }
    );


    menu.addEventListener(
      "click",
      function handleMenuClick(event) {
        event.stopPropagation();
      }
    );


    document.addEventListener(
      "click",
      function handleDocumentClick() {
        closeMenu();
      }
    );


    document.addEventListener(
      "keydown",
      function handleKeyboard(event) {
        if (event.key !== "Escape") {
          return;
        }

        closeMenu();
        trigger.focus();
      }
    );


    /* ========================================================
       Controlar estado visual Demo
    ======================================================== */

    function applyDemoState(
      isDemoMode,
      user = null
    ) {
      document.body.classList.toggle(
        "demo-mode",
        isDemoMode
      );

      document.documentElement
        .classList
        .toggle(
          "demo-mode",
          isDemoMode
        );


      if (createAccountButton) {
        createAccountButton.hidden =
          !isDemoMode;
      }


      if (restartTourButton) {
        restartTourButton.hidden =
          !isDemoMode;
      }


      if (isDemoMode) {
        localStorage.setItem(
          STORAGE_KEYS.demoMode,
          "true"
        );

        if (user?.id) {
          localStorage.setItem(
            STORAGE_KEYS.demoUserId,
            user.id
          );
        }

        return;
      }


      localStorage.removeItem(
        STORAGE_KEYS.demoMode
      );

      localStorage.removeItem(
        STORAGE_KEYS.demoUserId
      );

      localStorage.removeItem(
        STORAGE_KEYS.tourCompleted
      );
    }


    /* ========================================================
       Resolver estado real do utilizador
    ======================================================== */

    async function resolveUserState() {
      /*
       * Evita que os botões Demo apareçam
       * por alguns milissegundos em contas reais.
       */

      if (createAccountButton) {
        createAccountButton.hidden = true;
      }

      if (restartTourButton) {
        restartTourButton.hidden = true;
      }


      const client =
        getSupabaseClient();


      if (!client) {
        console.warn(
          "Supabase não disponível no menu do utilizador."
        );

        applyDemoState(false);

        return;
      }


      try {
        /*
         * Aguarda o auth-guard quando ele estiver
         * disponível na página.
         */

        if (
          window.studioVAuthReady &&
          typeof window.studioVAuthReady.then ===
            "function"
        ) {
          try {
            await window.studioVAuthReady;
          } catch (error) {
            console.warn(
              "O auth-guard terminou com aviso:",
              error
            );
          }
        }


        const {
          data,
          error,
        } = await client.auth.getUser();


        if (error) {
          throw error;
        }


        const user =
          data?.user || null;


        if (!user) {
          applyDemoState(false);
          return;
        }


        const metadata =
          user.user_metadata || {};


        const conversionStarted =
          metadata
            .account_conversion_started ===
          true;


        const conversionCompleted =
          metadata
            .account_conversion_completed ===
          true;


        /*
         * O botão Criar minha conta só aparece
         * enquanto a conta for realmente anónima
         * e a conversão ainda não tiver começado.
         */

        const isRealDemo =
          user.is_anonymous === true &&
          conversionStarted !== true &&
          conversionCompleted !== true;


        applyDemoState(
          isRealDemo,
          user
        );
      } catch (error) {
        console.error(
          "Erro ao verificar estado do utilizador:",
          error
        );

        /*
         * Em caso de erro, escondemos as ações
         * Demo por segurança.
         */

        applyDemoState(false);
      }
    }


    /* ========================================================
       Meu perfil
    ======================================================== */

    profileButton?.addEventListener(
      "click",
      function handleProfileClick(event) {
        event.preventDefault();

        closeMenu();

        window.location.href =
          ROUTES.profile;
      }
    );


    /* ========================================================
       Reiniciar tutorial
    ======================================================== */

    restartTourButton?.addEventListener(
      "click",
      function handleRestartTour() {
        localStorage.removeItem(
          STORAGE_KEYS.tourCompleted
        );

        closeMenu();


        const isHomePage =
          window.location.pathname.endsWith(
            "/home.html"
          );


        if (
          isHomePage &&
          window.StudioVDemoTour &&
          typeof window.StudioVDemoTour.restart ===
            "function"
        ) {
          window.StudioVDemoTour.restart();
          return;
        }


        window.location.href =
          `${ROUTES.home}?tour=1`;
      }
    );


    /* ========================================================
       Criar conta
    ======================================================== */

    createAccountButton?.addEventListener(
      "click",
      function handleCreateAccount() {
        closeMenu();


        if (
          window.StudioVDemoAccount &&
          typeof window.StudioVDemoAccount.open ===
            "function"
        ) {
          window.StudioVDemoAccount.open();
          return;
        }


        console.error(
          "O componente demo-account.js não foi carregado."
        );
      }
    );


    /* ========================================================
       Limpar armazenamento local
    ======================================================== */

    function clearLocalSession() {
      localStorage.removeItem(
        STORAGE_KEYS.demoMode
      );

      localStorage.removeItem(
        STORAGE_KEYS.demoUserId
      );

      localStorage.removeItem(
        STORAGE_KEYS.activeWorkspace
      );

      localStorage.removeItem(
        STORAGE_KEYS.tourCompleted
      );

      localStorage.removeItem(
        STORAGE_KEYS.pendingEmail
      );

      localStorage.removeItem(
        STORAGE_KEYS.pendingName
      );
    }


    /* ========================================================
       Logout
    ======================================================== */

    logoutButton?.addEventListener(
      "click",
      async function handleLogout() {
        closeMenu();

        logoutButton.disabled = true;

        logoutButton.setAttribute(
          "aria-busy",
          "true"
        );


        try {
          const client =
            getSupabaseClient();


          if (client) {
            const {
              error,
            } = await client.auth.signOut();


            if (error) {
              throw error;
            }
          }


          clearLocalSession();


          window.location.replace(
            ROUTES.login
          );
        } catch (error) {
          console.error(
            "Erro ao terminar sessão:",
            error
          );


          logoutButton.disabled = false;

          logoutButton.setAttribute(
            "aria-busy",
            "false"
          );


          alert(
            "Não foi possível terminar a sessão."
          );
        }
      }
    );


    /* ========================================================
       Atualizações de autenticação
    ======================================================== */

    const client =
      getSupabaseClient();


    client?.auth.onAuthStateChange(
      function handleAuthStateChange(
        event
      ) {
        if (
          event === "SIGNED_IN" ||
          event === "USER_UPDATED" ||
          event === "TOKEN_REFRESHED"
        ) {
          resolveUserState();
        }
      }
    );


    /* ========================================================
       API pública
    ======================================================== */

    window.StudioVUserMenu = {
      open: openMenu,
      close: closeMenu,
      toggle: toggleMenu,
      refresh: resolveUserState,
    };


    /* ========================================================
       Inicialização
    ======================================================== */

    if (
      window.lucide &&
      typeof window.lucide.createIcons ===
        "function"
    ) {
      window.lucide.createIcons();
    }


    resolveUserState();


    console.log(
      "Menu do utilizador carregado com sucesso."
    );
  }
);
"use strict";

/* ==========================================================
   StudioV — Menu do utilizador
========================================================== */

(function initializeStudioVUserMenu() {
  const ROUTES = {
    home: "/html/dashboard/home.html",
    login: "/html/login.html",
  };

  const STORAGE_KEYS = {
    demoMode: "studiov_demo_mode",
    demoTourCompleted: "studiov_demo_tour_completed",
    demoUserId: "studiov_demo_user_id",
    activeWorkspace: "studiov_active_workspace_id",
  };

  const elements = {
    userContainer: null,
    trigger: null,
    menu: null,
    avatar: null,
    name: null,
    email: null,
    restartTour: null,
    createAccount: null,
    logout: null,
  };

  let currentUser = null;
  let authSubscription = null;

  /* ========================================================
     Supabase
  ======================================================== */

    function getSupabaseClient() {
    return window.supabaseClient || null;
    }

    if (window.supabaseClient) {
      return window.supabaseClient;
    }

  /* ========================================================
     Local Storage
  ======================================================== */

  function getStorageValue(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn(
        `Não foi possível ler ${key}:`,
        error
      );

      return null;
    }
  }

  function setStorageValue(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn(
        `Não foi possível guardar ${key}:`,
        error
      );
    }
  }

  function removeStorageValue(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(
        `Não foi possível remover ${key}:`,
        error
      );
    }
  }

  /* ========================================================
     Elementos
  ======================================================== */

  function getElements() {
    elements.userContainer =
      document.querySelector(".sidebar-user");

    elements.trigger =
      document.getElementById(
        "sidebar-user-trigger"
      );

    elements.menu =
      document.getElementById(
        "sidebar-user-menu"
      );

    elements.avatar =
      document.getElementById(
        "sidebar-user-avatar"
      );

    elements.name =
      document.getElementById(
        "sidebar-user-name"
      );

    elements.email =
      document.getElementById(
        "sidebar-user-email"
      );

    elements.restartTour =
      document.getElementById(
        "restart-demo-tour"
      );

    elements.createAccount =
      document.getElementById(
        "create-account-demo"
      );

    elements.logout =
      document.getElementById(
        "logout-user"
      );

    return Boolean(
      elements.userContainer &&
      elements.trigger &&
      elements.menu
    );
  }

  /* ========================================================
     Ícones
  ======================================================== */

  function refreshIcons() {
    if (
      window.lucide &&
      typeof window.lucide.createIcons ===
        "function"
    ) {
      window.lucide.createIcons();
    }
  }

  /* ========================================================
     Menu
  ======================================================== */

  function isMenuOpen() {
    return (
      elements.trigger?.getAttribute(
        "aria-expanded"
      ) === "true"
    );
  }

  function openMenu() {
    if (
      !elements.trigger ||
      !elements.menu
    ) {
      return;
    }

    elements.menu.hidden = false;

    elements.trigger.setAttribute(
      "aria-expanded",
      "true"
    );

    const firstItem =
      elements.menu.querySelector(
        "a:not([hidden]), button:not([hidden])"
      );

    window.setTimeout(function () {
      firstItem?.focus();
    }, 30);
  }

  function closeMenu(options = {}) {
    if (
      !elements.trigger ||
      !elements.menu
    ) {
      return;
    }

    elements.menu.hidden = true;

    elements.trigger.setAttribute(
      "aria-expanded",
      "false"
    );

    if (options.restoreFocus === true) {
      elements.trigger.focus();
    }
  }

  function toggleMenu() {
    if (isMenuOpen()) {
      closeMenu();
      return;
    }

    openMenu();
  }

  /* ========================================================
     Dados do utilizador
  ======================================================== */

  function getUserDisplayName(user, profile) {
    const profileName =
      profile?.full_name?.trim();

    if (profileName) {
      return profileName;
    }

    const metadata =
      user?.user_metadata || {};

    const metadataName =
      (
        metadata.full_name ||
        metadata.name ||
        metadata.display_name ||
        ""
      ).trim();

    if (metadataName) {
      return metadataName;
    }

    const emailName =
      user?.email
        ?.split("@")[0]
        ?.replace(/[._-]+/g, " ")
        ?.trim();

    if (emailName) {
      return emailName
        .split(" ")
        .filter(Boolean)
        .map(function (word) {
          return (
            word.charAt(0).toUpperCase() +
            word.slice(1)
          );
        })
        .join(" ");
    }

    return user?.is_anonymous
      ? "Visitante Demo"
      : "Utilizador";
  }

  function getInitials(name) {
    const words = String(name || "")
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

  function updateUserInterface(user, profile) {
    const displayName =
      getUserDisplayName(user, profile);

    const email =
      user?.email ||
      (
        user?.is_anonymous
          ? "Sessão temporária"
          : "utilizador@studiov.pt"
      );

    if (elements.name) {
      elements.name.textContent =
        displayName;
    }

    if (elements.email) {
      elements.email.textContent =
        email;
    }

    if (elements.avatar) {
      elements.avatar.textContent =
        getInitials(displayName);

      elements.avatar.setAttribute(
        "aria-label",
        `Avatar de ${displayName}`
      );
    }
  }

  async function loadUserProfile(user) {
    const client = getSupabaseClient();

    if (!client || !user?.id) {
      return null;
    }

    try {
      const {
        data,
        error,
      } = await client
        .from("profiles")
        .select(
          "full_name, avatar_url"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.warn(
          "Não foi possível carregar o perfil:",
          error.message
        );

        return null;
      }

      return data;
    } catch (error) {
      console.warn(
        "Erro ao carregar o perfil:",
        error
      );

      return null;
    }
  }

  /* ========================================================
     Modo Demo
  ======================================================== */

  function detectDemoMode(user) {
    const localDemoMode =
      getStorageValue(
        STORAGE_KEYS.demoMode
      ) === "true";

    const anonymousUser =
      user?.is_anonymous === true;

    const isDemo =
      localDemoMode || anonymousUser;

    document.body.classList.toggle(
      "demo-mode",
      isDemo
    );

    if (elements.createAccount) {
      elements.createAccount.hidden =
        !isDemo;
    }

    return isDemo;
  }

  /* ========================================================
     Toast
  ======================================================== */

  function showToast(message, type = "info") {
    const previousToast =
      document.querySelector(
        ".user-menu-toast"
      );

    previousToast?.remove();

    const toast =
      document.createElement("div");

    toast.className =
      `user-menu-toast user-menu-toast--${type}`;

    toast.setAttribute(
      "role",
      type === "error"
        ? "alert"
        : "status"
    );

    toast.textContent = message;

    Object.assign(toast.style, {
      position: "fixed",
      right: "24px",
      bottom: "24px",
      zIndex: "9999",
      maxWidth: "360px",
      padding: "14px 18px",
      color: "#ffffff",
      background:
        type === "error"
          ? "#dc2626"
          : "#6d28d9",
      borderRadius: "12px",
      boxShadow:
        "0 18px 45px rgba(15, 23, 42, 0.28)",
      fontSize: "14px",
      fontWeight: "600",
    });

    document.body.appendChild(toast);

    window.setTimeout(function () {
      toast.remove();
    }, 3500);
  }

  /* ========================================================
     Reiniciar tutorial
  ======================================================== */

  function restartTutorial() {
    setStorageValue(
      STORAGE_KEYS.demoTourCompleted,
      "false"
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

  /* ========================================================
     Criar conta Demo
  ======================================================== */

  function requestDemoAccountCreation() {
    closeMenu();

    const isDemo =
      document.body.classList.contains(
        "demo-mode"
      );

    if (!isDemo) {
      return;
    }

    /*
     * Este evento será usado no próximo passo
     * pelo fluxo de conversão Demo → Conta Real.
     */

    const event =
      new CustomEvent(
        "studiov:create-demo-account",
        {
          bubbles: true,
          cancelable: true,
          detail: {
            user: currentUser,
          },
        }
      );

    const wasHandled =
      !window.dispatchEvent(event);

    if (!wasHandled) {
      showToast(
        "O fluxo para criar a conta será configurado no próximo passo."
      );
    }
  }

  /* ========================================================
     Logout
  ======================================================== */

  function clearSessionStorage() {
    removeStorageValue(
      STORAGE_KEYS.demoMode
    );

    removeStorageValue(
      STORAGE_KEYS.demoTourCompleted
    );

    removeStorageValue(
      STORAGE_KEYS.demoUserId
    );

    removeStorageValue(
      STORAGE_KEYS.activeWorkspace
    );
  }

  async function logoutUser() {
    const client = getSupabaseClient();

    closeMenu();

    if (elements.logout) {
      elements.logout.disabled = true;
      elements.logout.setAttribute(
        "aria-busy",
        "true"
      );
    }

    try {
      if (client) {
        const { error } =
          await client.auth.signOut();

        if (error) {
          throw error;
        }
      }

      clearSessionStorage();

      window.location.href =
        ROUTES.login;
    } catch (error) {
      console.error(
        "Erro ao terminar sessão:",
        error
      );

      showToast(
        "Não foi possível terminar a sessão.",
        "error"
      );

      if (elements.logout) {
        elements.logout.disabled = false;
        elements.logout.removeAttribute(
          "aria-busy"
        );
      }
    }
  }

  /* ========================================================
     Carregar autenticação
  ======================================================== */

  async function loadAuthenticatedUser() {
    const client = getSupabaseClient();

    if (!client) {
      console.warn(
        "Cliente Supabase não encontrado no menu do utilizador."
      );

      updateUserInterface(null, null);
      detectDemoMode(null);

      return;
    }

    try {
      const {
        data,
        error,
      } = await client.auth.getUser();

      if (error) {
        throw error;
      }

      currentUser =
        data?.user || null;

      const profile =
        await loadUserProfile(
          currentUser
        );

      updateUserInterface(
        currentUser,
        profile
      );

      detectDemoMode(currentUser);
    } catch (error) {
      console.error(
        "Erro ao carregar utilizador:",
        error
      );

      updateUserInterface(null, null);
      detectDemoMode(null);
    }
  }

  /* ========================================================
     Eventos
  ======================================================== */

  function handleDocumentClick(event) {
    if (!isMenuOpen()) {
      return;
    }

    const clickedInside =
      elements.userContainer?.contains(
        event.target
      );

    if (!clickedInside) {
      closeMenu();
    }
  }

  function handleKeyboard(event) {
    if (!isMenuOpen()) {
      return;
    }

    if (event.key === "Escape") {
      closeMenu({
        restoreFocus: true,
      });
    }
  }

  function registerEvents() {
    elements.trigger?.addEventListener(
      "click",
      toggleMenu
    );

    elements.restartTour?.addEventListener(
      "click",
      restartTutorial
    );

    elements.createAccount?.addEventListener(
      "click",
      requestDemoAccountCreation
    );

    elements.logout?.addEventListener(
      "click",
      logoutUser
    );

    document.addEventListener(
      "click",
      handleDocumentClick
    );

    document.addEventListener(
      "keydown",
      handleKeyboard
    );

    window.addEventListener(
      "resize",
      closeMenu
    );
  }

  function subscribeToAuthChanges() {
    const client = getSupabaseClient();

    if (!client) {
      return;
    }

    const {
      data,
    } = client.auth.onAuthStateChange(
      function (_event, session) {
        currentUser =
          session?.user || null;

        loadAuthenticatedUser();
      }
    );

    authSubscription =
      data?.subscription || null;
  }

  /* ========================================================
     API pública
  ======================================================== */

  window.StudioVUserMenu = {
    open: openMenu,
    close: closeMenu,
    toggle: toggleMenu,
    reloadUser: loadAuthenticatedUser,
    isDemo: function () {
      return document.body.classList.contains(
        "demo-mode"
      );
    },
  };

  /* ========================================================
     Inicialização
  ======================================================== */

  async function initialize() {
    const hasRequiredElements =
      getElements();

    if (!hasRequiredElements) {
      return;
    }

    registerEvents();
    refreshIcons();

    await loadAuthenticatedUser();

    subscribeToAuthChanges();
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );
  } else {
    initialize();
  }

  window.addEventListener(
    "beforeunload",
    function () {
      authSubscription?.unsubscribe();
    }
  );
})();
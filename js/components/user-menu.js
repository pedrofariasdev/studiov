"use strict";

/* ==========================================================
   StudioV — Menu do utilizador
========================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const trigger = document.getElementById(
    "sidebar-user-trigger"
  );

  const menu = document.getElementById(
    "sidebar-user-menu"
  );

  const restartTourButton = document.getElementById(
    "restart-demo-tour"
  );

  const createAccountButton = document.getElementById(
    "create-account-demo"
  );

  const logoutButton = document.getElementById(
    "logout-user"
  );

  if (!trigger || !menu) {
    console.error(
      "Menu do utilizador não encontrado no HTML."
    );

    return;
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
      trigger.getAttribute("aria-expanded") ===
      "true";

    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
  }

  trigger.addEventListener(
    "click",
    function (event) {
      event.preventDefault();
      event.stopPropagation();

      toggleMenu();
    }
  );

  menu.addEventListener(
    "click",
    function (event) {
      event.stopPropagation();
    }
  );

  document.addEventListener(
    "click",
    function () {
      closeMenu();
    }
  );

  document.addEventListener(
    "keydown",
    function (event) {
      if (event.key === "Escape") {
        closeMenu();
        trigger.focus();
      }
    }
  );

  /* ========================================================
     Modo demo
  ======================================================== */

  const isDemoMode =
    localStorage.getItem(
      "studiov_demo_mode"
    ) === "true";

  document.body.classList.toggle(
    "demo-mode",
    isDemoMode
  );

  if (createAccountButton) {
    createAccountButton.hidden =
      !isDemoMode;
  }

  /* ========================================================
     Reiniciar tutorial
  ======================================================== */

  restartTourButton?.addEventListener(
    "click",
    function () {
      localStorage.removeItem(
        "studiov_demo_tour_completed"
      );

      closeMenu();

      const isHomePage =
        window.location.pathname.endsWith(
          "/home.html"
        );

      if (
        isHomePage &&
        window.StudioVDemoTour
      ) {
        window.StudioVDemoTour.restart();
        return;
      }

      window.location.href =
        "/html/dashboard/home.html?tour=1";
    }
  );

  /* ========================================================
     Criar conta
  ======================================================== */

  createAccountButton?.addEventListener(
    "click",
    function () {
      closeMenu();

      console.log(
        "Iniciar conversão da conta demo."
      );

      alert(
        "O fluxo de criação da conta será implementado no próximo passo."
      );
    }
  );

  /* ========================================================
     Logout
  ======================================================== */

  logoutButton?.addEventListener(
    "click",
    async function () {
      closeMenu();

      logoutButton.disabled = true;

      try {
        const client =
          window.supabaseClient;

        if (client) {
          const { error } =
            await client.auth.signOut();

          if (error) {
            throw error;
          }
        }

        localStorage.removeItem(
          "studiov_demo_mode"
        );

        localStorage.removeItem(
          "studiov_demo_user_id"
        );

        localStorage.removeItem(
          "studiov_active_workspace_id"
        );

        localStorage.removeItem(
          "studiov_demo_tour_completed"
        );

        window.location.href =
          "/html/auth/login.html";
      } catch (error) {
        console.error(
          "Erro ao terminar sessão:",
          error
        );

        logoutButton.disabled = false;

        alert(
          "Não foi possível terminar a sessão."
        );
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
  };

  if (window.lucide) {
    window.lucide.createIcons();
  }

  console.log(
    "Menu do utilizador carregado com sucesso."
  );
});
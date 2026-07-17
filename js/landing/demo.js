"use strict";

document.addEventListener("DOMContentLoaded", async function () {
  const supabaseClient = window.supabaseClient;

  const demoPage = document.body;
  const progressValue = document.getElementById(
    "demo-progress-value"
  );
  const statusText = document.getElementById("demo-status");

  const errorBox = document.getElementById("demo-error");
  const errorMessage = document.getElementById(
    "demo-error-message"
  );

  const retryButton = document.getElementById(
    "demo-retry-button"
  );

  const steps = {
    auth: document.getElementById("demo-step-auth"),
    workspace: document.getElementById(
      "demo-step-workspace"
    ),
    data: document.getElementById("demo-step-data"),
    dashboard: document.getElementById(
      "demo-step-dashboard"
    ),
  };

  /*
   * Altere somente esta linha caso o arquivo principal
   * do dashboard tenha outro nome.
   */
  const DASHBOARD_URL =
    "/html/dashboard/home.html";

  const STORAGE_KEYS = {
    workspaceId: "studiov_active_workspace_id",
    demoMode: "studiov_demo_mode",
    demoUserId: "studiov_demo_user_id",
  };

  let isPreparingDemo = false;

  function wait(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function setProgress(value, message) {
    if (progressValue) {
      progressValue.style.width = `${value}%`;
    }

    if (statusText && message) {
      statusText.textContent = message;
    }
  }

  function setStepStatus(stepName, status) {
    const step = steps[stepName];

    if (!step) {
      return;
    }

    step.dataset.status = status;

    const statusContainer = step.querySelector(
      ".demo-step-status"
    );

    if (!statusContainer) {
      return;
    }

    if (status === "completed") {
      statusContainer.innerHTML =
        '<i data-lucide="circle-check"></i>';
    } else if (status === "active") {
      statusContainer.innerHTML =
        '<i data-lucide="loader-circle"></i>';
    } else if (status === "error") {
      statusContainer.innerHTML =
        '<i data-lucide="circle-alert"></i>';
    } else {
      statusContainer.innerHTML =
        '<i data-lucide="circle"></i>';
    }

    refreshIcons();
  }

  function resetInterface() {
    demoPage.classList.remove(
      "has-error",
      "is-completed"
    );

    if (errorBox) {
      errorBox.hidden = true;
    }

    if (retryButton) {
      retryButton.hidden = true;
      retryButton.disabled = false;
    }

    Object.keys(steps).forEach(function (stepName) {
      setStepStatus(stepName, "pending");
    });

    setProgress(8, "Iniciando demonstração...");
  }

  function showError(error) {
    const message =
      error?.message ||
      "Ocorreu um erro inesperado ao preparar a demonstração.";

    demoPage.classList.add("has-error");

    if (errorMessage) {
      errorMessage.textContent = message;
    }

    if (errorBox) {
      errorBox.hidden = false;
    }

    if (retryButton) {
      retryButton.hidden = false;
      retryButton.disabled = false;
    }

    setProgress(
      100,
      "Não foi possível concluir a demonstração."
    );

    refreshIcons();
  }

  async function createAnonymousSession() {
    const {
      data: sessionData,
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    const currentUser =
      sessionData.session?.user || null;

    /*
     * Caso exista um usuário normal logado, encerramos
     * essa sessão para a demonstração não usar a conta real.
     */
    if (currentUser && !currentUser.is_anonymous) {
      const { error: signOutError } =
        await supabaseClient.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }
    }

    /*
     * Caso já exista uma sessão anônima, reutilizamos.
     */
    if (currentUser?.is_anonymous) {
      return sessionData.session;
    }

    const {
      data: anonymousData,
      error: anonymousError,
    } =
      await supabaseClient.auth.signInAnonymously();

    if (anonymousError) {
      throw anonymousError;
    }

    if (!anonymousData.session?.user) {
      throw new Error(
        "Não foi possível criar o acesso temporário."
      );
    }

    return anonymousData.session;
  }

  function saveDemoData(workspaceId, userId) {
    localStorage.setItem(
      STORAGE_KEYS.workspaceId,
      workspaceId
    );

    localStorage.setItem(
      STORAGE_KEYS.demoMode,
      "true"
    );

    localStorage.setItem(
      STORAGE_KEYS.demoUserId,
      userId
    );
  }

  async function prepareDemo() {
    if (isPreparingDemo) {
      return;
    }

    if (!supabaseClient) {
      showError(
        new Error(
          "O cliente do Supabase não foi carregado."
        )
      );

      return;
    }

    isPreparingDemo = true;
    resetInterface();

    try {
      /*
       * Etapa 1 — autenticação
       */
      setStepStatus("auth", "active");

      setProgress(
        18,
        "Preparando uma sessão temporária..."
      );

      const session =
        await createAnonymousSession();

      await wait(500);

      setStepStatus("auth", "completed");

      /*
       * Etapa 2 — workspace
       */
      setStepStatus("workspace", "active");

      setProgress(
        42,
        "Criando o workspace de demonstração..."
      );

      const {
        data: workspaceId,
        error: workspaceError,
      } = await supabaseClient.rpc(
        "create_demo_workspace"
      );

      if (workspaceError) {
        throw workspaceError;
      }

      if (!workspaceId) {
        throw new Error(
          "O workspace de demonstração não foi retornado."
        );
      }

      await wait(600);

      setStepStatus(
        "workspace",
        "completed"
      );

      /*
       * Etapa 3 — dados demo
       *
       * A função SQL já cria clientes, marcas,
       * conteúdos, planner e calendário.
       */
      setStepStatus("data", "active");

      setProgress(
        70,
        "Organizando os dados de demonstração..."
      );

      saveDemoData(
        workspaceId,
        session.user.id
      );

      await wait(700);

      setStepStatus("data", "completed");

      /*
       * Etapa 4 — dashboard
       */
      setStepStatus("dashboard", "active");

      setProgress(
        92,
        "Abrindo o dashboard StudioV..."
      );

      await wait(700);

      setStepStatus(
        "dashboard",
        "completed"
      );

      demoPage.classList.add("is-completed");

      setProgress(
        100,
        "Demonstração preparada com sucesso."
      );

      await wait(700);

      window.location.assign(DASHBOARD_URL);
    } catch (error) {
      console.error(
        "Erro ao preparar demonstração:",
        error
      );

      const activeStep = Object.keys(
        steps
      ).find(function (stepName) {
        return (
          steps[stepName]?.dataset.status ===
          "active"
        );
      });

      if (activeStep) {
        setStepStatus(activeStep, "error");
      }

      showError(error);
    } finally {
      isPreparingDemo = false;
    }
  }

  if (retryButton) {
    retryButton.addEventListener(
      "click",
      prepareDemo
    );
  }

  refreshIcons();
  await prepareDemo();
});
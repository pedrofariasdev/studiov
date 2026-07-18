"use strict";

(function initializeStudioVDemoTour() {
  const STORAGE_KEYS = {
    demoMode: "studiov_demo_mode",
    completed: "studiov_demo_tour_completed",
  };

  const steps = [
    {
      title: "Bem-vindo à StudioV",
      description:
        "Este tour apresenta as principais áreas da plataforma. Você pode avançar, voltar ou pular a qualquer momento.",
      selectors: [],
    },
    {
      title: "Dashboard",
      description:
        "Aqui você acompanha os principais números, ações rápidas, tarefas e atividades recentes do workspace.",
      selectors: [
        'a.sidebar-link[href$="dashboard.html"]',
      ],
    },
    {
      title: "Workspace",
      description:
        "Nesta área ficam as informações da organização, membros, plano, utilização e integrações do workspace.",
      selectors: [
        'a.sidebar-link[href$="workspace.html"]',
      ],
    },
    {
      title: "Marcas",
      description:
        "Organize as identidades, segmentos, informações e estratégias das marcas geridas pela sua equipa.",
      selectors: [
        'a.sidebar-link[href$="brands.html"]',
      ],
    },
    {
      title: "Clientes",
      description:
        "Centralize os contactos, empresas, observações e marcas associadas a cada cliente.",
      selectors: [
        'a.sidebar-link[href$="clients.html"]',
      ],
    },
    {
      title: "Planner",
      description:
        "Planeie ideias, produção, revisões, responsáveis e aprovações num fluxo visual de trabalho.",
      selectors: [
        'a.sidebar-link[href$="planner.html"]',
      ],
    },
    {
      title: "Calendário",
      description:
        "Consulte conteúdos, eventos, lembretes e prazos organizados por data.",
      selectors: [
        'a.sidebar-link[href$="calendar.html"]',
      ],
    },
    {
      title: "Conteúdos",
      description:
        "Acompanhe todos os conteúdos criados manualmente ou convertidos a partir do Planner.",
      selectors: [
        'a.sidebar-link[href$="content.html"]',
        'a.sidebar-link[href$="contents.html"]',
      ],
    },
    {
      title: "Biblioteca",
      description:
        "Guarde e organize imagens, vídeos, áudios e documentos utilizados na produção dos conteúdos.",
      selectors: [
        'a.sidebar-link[href$="library.html"]',
      ],
    },
    {
      title: "Publicações",
      description:
        "Prepare, agende e acompanhe as publicações destinadas às diferentes plataformas sociais.",
      selectors: [
        'a.sidebar-link[href$="publishing.html"]',
        'a.sidebar-link[href$="publications.html"]',
      ],
    },
    {
      title: "Configurações",
      description:
        "Personalize o tema, notificações, conta e integrações da sua experiência na StudioV.",
      selectors: [
        'a.sidebar-link[href$="settings.html"]',
      ],
    },
    {
      title: "Tudo pronto",
      description:
        "Agora você pode explorar livremente a demonstração. Os dados apresentados são fictícios e exclusivos deste ambiente temporário.",
      selectors: [],
    },
  ];

  let currentStepIndex = 0;
  let root = null;
  let spotlight = null;
  let tooltip = null;
  let titleElement = null;
  let descriptionElement = null;
  let progressText = null;
  let progressValue = null;
  let backButton = null;
  let nextButton = null;
  let skipButton = null;
  let currentTarget = null;
  let resizeTimeout = null;

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

  function isDemoMode() {
    return (
      getStorageValue(STORAGE_KEYS.demoMode) ===
      "true"
    );
  }

  function isTourCompleted() {
    return (
      getStorageValue(STORAGE_KEYS.completed) ===
      "true"
    );
  }

  function isTourForced() {
    const parameters =
      new URLSearchParams(window.location.search);

    return parameters.get("tour") === "1";
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function wait(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  function findTarget(step) {
    for (const selector of step.selectors) {
      const element =
        document.querySelector(selector);

      if (element) {
        return element;
      }
    }

    return null;
  }

  function createTourInterface() {
    if (root) {
      return;
    }

    root = document.createElement("div");
    root.className = "demo-tour-root";
    root.setAttribute(
      "aria-label",
      "Tutorial da demonstração"
    );

    root.innerHTML = `
      <div class="demo-tour-blocker"></div>

      <div
        class="demo-tour-spotlight is-centered"
        aria-hidden="true"
      ></div>

      <section
        class="demo-tour-tooltip is-centered"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-tour-title"
        aria-describedby="demo-tour-description"
      >
        <header class="demo-tour-header">
          <span class="demo-tour-badge">
            <i data-lucide="sparkles"></i>
            Tour da plataforma
          </span>

          <button
            id="demo-tour-skip"
            class="demo-tour-close"
            type="button"
            aria-label="Pular tutorial"
            title="Pular tutorial"
          >
            <i data-lucide="x"></i>
          </button>
        </header>

        <div class="demo-tour-content">
          <span
            id="demo-tour-progress-text"
            class="demo-tour-progress"
          ></span>

          <h2 id="demo-tour-title"></h2>

          <p id="demo-tour-description"></p>

          <div
            class="demo-tour-progress-bar"
            aria-hidden="true"
          >
            <span
              id="demo-tour-progress-value"
              class="demo-tour-progress-value"
            ></span>
          </div>
        </div>

        <footer class="demo-tour-footer">
          <div class="demo-tour-footer-left">
            <button
              id="demo-tour-back"
              class="
                demo-tour-button
                demo-tour-button--secondary
              "
              type="button"
            >
              <i data-lucide="arrow-left"></i>
              Voltar
            </button>
          </div>

          <div class="demo-tour-footer-right">
            <button
              id="demo-tour-next"
              class="
                demo-tour-button
                demo-tour-button--primary
              "
              type="button"
            >
              Próximo
              <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </footer>
      </section>
    `;

    document.body.appendChild(root);

    spotlight = root.querySelector(
      ".demo-tour-spotlight"
    );

    tooltip = root.querySelector(
      ".demo-tour-tooltip"
    );

    titleElement = root.querySelector(
      "#demo-tour-title"
    );

    descriptionElement = root.querySelector(
      "#demo-tour-description"
    );

    progressText = root.querySelector(
      "#demo-tour-progress-text"
    );

    progressValue = root.querySelector(
      "#demo-tour-progress-value"
    );

    backButton = root.querySelector(
      "#demo-tour-back"
    );

    nextButton = root.querySelector(
      "#demo-tour-next"
    );

    skipButton = root.querySelector(
      "#demo-tour-skip"
    );

    backButton.addEventListener(
      "click",
      previousStep
    );

    nextButton.addEventListener(
      "click",
      nextStep
    );

    skipButton.addEventListener(
      "click",
      completeTour
    );

    refreshIcons();
  }

  function setCenteredPosition() {
    currentTarget = null;

    spotlight.classList.add("is-centered");
    tooltip.classList.add("is-centered");

    spotlight.style.top = "50%";
    spotlight.style.left = "50%";
    spotlight.style.width = "0";
    spotlight.style.height = "0";

    tooltip.style.top = "50%";
    tooltip.style.left = "50%";
    tooltip.style.right = "";
    tooltip.style.bottom = "";
  }

  function setTargetPosition(target) {
    currentTarget = target;

    spotlight.classList.remove("is-centered");
    tooltip.classList.remove("is-centered");

    const rectangle =
      target.getBoundingClientRect();

    const padding = 7;

    const spotlightTop = Math.max(
      8,
      rectangle.top - padding
    );

    const spotlightLeft = Math.max(
      8,
      rectangle.left - padding
    );

    const spotlightWidth = Math.min(
      window.innerWidth - spotlightLeft - 8,
      rectangle.width + padding * 2
    );

    const spotlightHeight = Math.min(
      window.innerHeight - spotlightTop - 8,
      rectangle.height + padding * 2
    );

    spotlight.style.top =
      `${spotlightTop}px`;

    spotlight.style.left =
      `${spotlightLeft}px`;

    spotlight.style.width =
      `${spotlightWidth}px`;

    spotlight.style.height =
      `${spotlightHeight}px`;

    positionTooltip(rectangle);
  }

  function positionTooltip(targetRectangle) {
    const margin = 18;
    const tooltipWidth =
      Math.min(420, window.innerWidth - 32);

    tooltip.style.width =
      `${tooltipWidth}px`;

    tooltip.style.right = "";
    tooltip.style.bottom = "";

    const tooltipHeight =
      tooltip.offsetHeight || 320;

    const spaceRight =
      window.innerWidth -
      targetRectangle.right;

    const spaceLeft =
      targetRectangle.left;

    const spaceBelow =
      window.innerHeight -
      targetRectangle.bottom;

    const spaceAbove =
      targetRectangle.top;

    let top;
    let left;

    if (spaceRight >= tooltipWidth + margin) {
      top = Math.max(
        16,
        Math.min(
          targetRectangle.top,
          window.innerHeight -
            tooltipHeight -
            16
        )
      );

      left =
        targetRectangle.right + margin;
    } else if (
      spaceLeft >= tooltipWidth + margin
    ) {
      top = Math.max(
        16,
        Math.min(
          targetRectangle.top,
          window.innerHeight -
            tooltipHeight -
            16
        )
      );

      left =
        targetRectangle.left -
        tooltipWidth -
        margin;
    } else if (
      spaceBelow >= tooltipHeight + margin
    ) {
      top =
        targetRectangle.bottom + margin;

      left = Math.max(
        16,
        Math.min(
          targetRectangle.left,
          window.innerWidth -
            tooltipWidth -
            16
        )
      );
    } else if (
      spaceAbove >= tooltipHeight + margin
    ) {
      top =
        targetRectangle.top -
        tooltipHeight -
        margin;

      left = Math.max(
        16,
        Math.min(
          targetRectangle.left,
          window.innerWidth -
            tooltipWidth -
            16
        )
      );
    } else {
      tooltip.classList.add("is-centered");

      tooltip.style.top = "50%";
      tooltip.style.left = "50%";

      return;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  async function renderStep() {
    const step = steps[currentStepIndex];

    titleElement.textContent =
      step.title;

    descriptionElement.textContent =
      step.description;

    progressText.textContent =
      `Passo ${currentStepIndex + 1} de ${
        steps.length
      }`;

    const percentage =
      ((currentStepIndex + 1) /
        steps.length) *
      100;

    progressValue.style.width =
      `${percentage}%`;

    backButton.hidden =
      currentStepIndex === 0;

    const isLastStep =
      currentStepIndex ===
      steps.length - 1;

    nextButton.innerHTML = isLastStep
      ? `
          Finalizar
          <i data-lucide="circle-check"></i>
        `
      : `
          Próximo
          <i data-lucide="arrow-right"></i>
        `;

    refreshIcons();

    const target = findTarget(step);

    if (!target) {
      setCenteredPosition();
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    await wait(320);

    setTargetPosition(target);
  }

  function nextStep() {
    if (
      currentStepIndex >=
      steps.length - 1
    ) {
      completeTour();
      return;
    }

    currentStepIndex += 1;
    renderStep();
  }

  function previousStep() {
    if (currentStepIndex <= 0) {
      return;
    }

    currentStepIndex -= 1;
    renderStep();
  }

  function removeTour() {
    root?.remove();

    root = null;
    spotlight = null;
    tooltip = null;
    currentTarget = null;

    document.body.style.overflow = "";
  }

  function completeTour() {
    setStorageValue(
      STORAGE_KEYS.completed,
      "true"
    );

    removeTour();
  }

  async function startTour(options = {}) {
    if (root) {
      return;
    }

    if (
      options.force !== true &&
      !isDemoMode()
    ) {
      return;
    }

    if (
      options.force !== true &&
      isTourCompleted()
    ) {
      return;
    }

    currentStepIndex = 0;

    createTourInterface();

    document.body.style.overflow = "hidden";

    await renderStep();
  }

  function restartTour() {
    setStorageValue(
      STORAGE_KEYS.completed,
      "false"
    );

    removeTour();

    startTour({
      force: true,
    });
  }

  function handleKeyboard(event) {
    if (!root) {
      return;
    }

    if (event.key === "Escape") {
      completeTour();
      return;
    }

    if (event.key === "ArrowRight") {
      nextStep();
      return;
    }

    if (event.key === "ArrowLeft") {
      previousStep();
    }
  }

  function handleViewportChange() {
    if (!root) {
      return;
    }

    window.clearTimeout(resizeTimeout);

    resizeTimeout = window.setTimeout(
      function () {
        if (currentTarget) {
          setTargetPosition(currentTarget);
        } else {
          setCenteredPosition();
        }
      },
      80
    );
  }

  document.addEventListener(
    "keydown",
    handleKeyboard
  );

  window.addEventListener(
    "resize",
    handleViewportChange
  );

  window.addEventListener(
    "scroll",
    handleViewportChange,
    true
  );

  window.StudioVDemoTour = {
    start: startTour,
    restart: restartTour,
    complete: completeTour,
  };

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      const shouldStart =
        isTourForced() ||
        (
          isDemoMode() &&
          !isTourCompleted()
        );

      if (!shouldStart) {
        return;
      }

      window.setTimeout(
        function () {
          startTour({
            force: isTourForced(),
          });
        },
        700
      );
    }
  );
})();
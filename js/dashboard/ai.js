"use strict";

/* ==========================================================
   StudioV — Criador de posts com IA
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const supabaseClient = window.supabaseClient;

  const elements = {
    body: document.body,
    sidebar: document.getElementById("dashboard-sidebar"),
    sidebarOpenButton: document.getElementById("topbar-menu-button"),
    sidebarCloseButton: document.getElementById("sidebar-close"),
    sidebarOverlay: document.getElementById("sidebar-overlay"),
    currentWorkspaceName: document.getElementById("current-workspace-name"),
    sidebarUserName: document.getElementById("sidebar-user-name"),
    sidebarUserEmail: document.getElementById("sidebar-user-email"),
    sidebarUserAvatar: document.getElementById("sidebar-user-avatar"),
    topbarAvatar: document.getElementById("topbar-avatar"),
    form: document.getElementById("ai-post-form"),
    topic: document.getElementById("ai-topic"),
    topicCount: document.getElementById("ai-topic-count"),
    topicError: document.getElementById("ai-topic-error"),
    platform: document.getElementById("ai-platform"),
    objective: document.getElementById("ai-objective"),
    tone: document.getElementById("ai-tone"),
    language: document.getElementById("ai-language"),
    details: document.getElementById("ai-details"),
    formError: document.getElementById("ai-form-error"),
    generateButton: document.getElementById("ai-generate-button"),
    resultEmpty: document.getElementById("ai-result-empty"),
    resultLoading: document.getElementById("ai-result-loading"),
    resultContent: document.getElementById("ai-result-content"),
    resultTitle: document.getElementById("ai-result-title-input"),
    resultCaption: document.getElementById("ai-result-caption"),
    resultCta: document.getElementById("ai-result-cta"),
    resultHashtags: document.getElementById("ai-result-hashtags"),
    copyAllButton: document.getElementById("ai-copy-all-button"),
    clearButton: document.getElementById("ai-clear-button"),
    copyButtons: document.querySelectorAll("[data-copy-target]"),
    toastContainer: document.getElementById("toast-container"),
  };

  let currentWorkspace = null;
  let isGenerating = false;

  initialize();

  async function initialize() {
    setupSidebar();
    setupForm();
    window.lucide?.createIcons();

    if (!supabaseClient) {
      showFormError("Não foi possível ligar ao StudioV. Atualize a página e tente novamente.");

      return;
    }

    try {
      const user = window.studioVAuthReady
        ? await window.studioVAuthReady
        : await loadAuthenticatedUser();

      if (!user) {
        return;
      }

      const [profile, workspace] = await Promise.all([
        loadUserProfile(user.id),
        loadCurrentWorkspace(user.id),
      ]);

      currentWorkspace = workspace;

      updateDashboardIdentity(user, profile, workspace);
    } catch (error) {
      console.error("Erro ao preparar o criador de posts:", error);

      showFormError(
        "Não foi possível carregar o seu workspace. Atualize a página e tente novamente."
      );
    }
  }

  /* ========================================================
     Contexto do utilizador
  ======================================================== */

  async function loadAuthenticatedUser() {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    return user;
  }

  async function loadUserProfile(userId) {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Erro ao carregar perfil:", error.message);

      return null;
    }

    return data;
  }

  async function loadCurrentWorkspace(userId) {
    const { data: membership, error: membershipError } = await supabaseClient
      .from("workspace_members")
      .select("workspace_id, role, status, created_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership?.workspace_id) {
      throw new Error("O utilizador não possui um workspace ativo.");
    }

    const { data: workspace, error: workspaceError } = await supabaseClient
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
      role: membership.role,
    };
  }

  function updateDashboardIdentity(user, profile, workspace) {
    const fullName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Utilizador";

    const email = user.email || "Conta de demonstração";
    const avatarLetter = fullName.charAt(0).toUpperCase();

    if (elements.currentWorkspaceName) {
      elements.currentWorkspaceName.textContent = workspace?.name || "Meu Workspace";
    }

    if (elements.sidebarUserName) {
      elements.sidebarUserName.textContent = fullName;
    }

    if (elements.sidebarUserEmail) {
      elements.sidebarUserEmail.textContent = email;
    }

    if (elements.sidebarUserAvatar) {
      elements.sidebarUserAvatar.textContent = avatarLetter;
    }

    if (elements.topbarAvatar) {
      elements.topbarAvatar.textContent = avatarLetter;
    }
  }

  /* ========================================================
     Sidebar
  ======================================================== */

  function setupSidebar() {
    elements.sidebarOpenButton?.addEventListener("click", openSidebar);
    elements.sidebarCloseButton?.addEventListener("click", closeSidebar);
    elements.sidebarOverlay?.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && elements.body.classList.contains("sidebar-open")) {
        closeSidebar();
      }
    });
  }

  function openSidebar() {
    elements.body.classList.add("sidebar-open");
    elements.sidebarOpenButton?.setAttribute("aria-expanded", "true");
    elements.sidebarOverlay?.setAttribute("aria-hidden", "false");
  }

  function closeSidebar() {
    elements.body.classList.remove("sidebar-open");
    elements.sidebarOpenButton?.setAttribute("aria-expanded", "false");
    elements.sidebarOverlay?.setAttribute("aria-hidden", "true");
  }

  /* ========================================================
     Formulário
  ======================================================== */

  function setupForm() {
    elements.form?.addEventListener("submit", handleGeneratePost);

    elements.topic?.addEventListener("input", () => {
      updateTopicCount();
      clearTopicError();
    });

    elements.clearButton?.addEventListener("click", resetCreator);
    elements.copyAllButton?.addEventListener("click", copyCompletePost);

    elements.copyButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.copyTarget;
        const target = targetId ? document.getElementById(targetId) : null;

        if (target) {
          copyText(target.value, "Campo copiado");
        }
      });
    });

    updateTopicCount();
    setResultState("empty");
  }

  async function handleGeneratePost(event) {
    event.preventDefault();

    if (isGenerating || !validateForm()) {
      return;
    }

    if (!currentWorkspace?.id) {
      showFormError("O seu workspace ainda não está pronto. Atualize a página e tente novamente.");

      return;
    }

    clearFormError();
    setLoading(true);
    setResultState("loading");

    const requestBody = {
      topic: elements.topic.value.trim(),
      platform: elements.platform.value,
      objective: elements.objective.value,
      tone: elements.tone.value,
      language: elements.language.value,
      details: elements.details.value.trim(),
    };

    try {
      const { data, error } = await supabaseClient.functions.invoke("generate-post", {
        body: requestBody,
      });

      if (error) {
        throw error;
      }

      if (!data?.post) {
        throw new Error("A IA não devolveu um post válido.");
      }

      renderPost(data.post);
      setResultState("content");

      showToast(
        "success",
        "Post criado",
        "Pode editar o resultado ou copiá-lo para usar onde quiser."
      );
    } catch (error) {
      console.error("Erro ao gerar post:", error);

      const message = await resolveFunctionError(error);

      showFormError(message);
      setResultState("empty");
      showToast("error", "Não foi possível gerar", message);
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const topic = elements.topic.value.trim();

    clearTopicError();

    if (topic.length < 3) {
      elements.topic.classList.add("is-invalid");
      elements.topicError.textContent = "Descreva o tema com pelo menos 3 caracteres.";
      elements.topic.focus();

      return false;
    }

    if (topic.length > 500) {
      elements.topic.classList.add("is-invalid");
      elements.topicError.textContent = "O tema não pode ultrapassar 500 caracteres.";
      elements.topic.focus();

      return false;
    }

    return true;
  }

  function updateTopicCount() {
    if (elements.topicCount && elements.topic) {
      elements.topicCount.textContent = String(elements.topic.value.length);
    }
  }

  function clearTopicError() {
    elements.topic?.classList.remove("is-invalid");

    if (elements.topicError) {
      elements.topicError.textContent = "";
    }
  }

  function setLoading(loading) {
    isGenerating = loading;

    if (!elements.generateButton) {
      return;
    }

    elements.generateButton.disabled = loading;
    elements.generateButton.classList.toggle("is-loading", loading);

    const label = elements.generateButton.querySelector("span");

    if (label) {
      label.textContent = loading ? "A gerar…" : "Gerar post";
    }
  }

  function showFormError(message) {
    if (!elements.formError) {
      return;
    }

    elements.formError.textContent = message;
    elements.formError.classList.remove("hidden");
  }

  function clearFormError() {
    if (!elements.formError) {
      return;
    }

    elements.formError.textContent = "";
    elements.formError.classList.add("hidden");
  }

  /* ========================================================
     Resultado
  ======================================================== */

  function setResultState(state) {
    elements.resultEmpty?.classList.toggle("hidden", state !== "empty");
    elements.resultLoading?.classList.toggle("hidden", state !== "loading");
    elements.resultContent?.classList.toggle("hidden", state !== "content");
  }

  function renderPost(post) {
    elements.resultTitle.value = String(post.title || "").trim();
    elements.resultCaption.value = String(post.caption || "").trim();
    elements.resultCta.value = String(post.cta || "").trim();

    const hashtags = Array.isArray(post.hashtags)
      ? post.hashtags
      : String(post.hashtags || "").split(/\s+/);

    elements.resultHashtags.value = hashtags.map(normalizeHashtag).filter(Boolean).join(" ");

    window.lucide?.createIcons();
  }

  function normalizeHashtag(value) {
    const hashtag = String(value || "").trim();

    if (!hashtag) {
      return "";
    }

    return hashtag.startsWith("#") ? hashtag : "#" + hashtag;
  }

  function resetCreator() {
    elements.form?.reset();

    clearFormError();
    clearTopicError();
    clearResultFields();
    updateTopicCount();
    setResultState("empty");

    elements.topic?.focus();
  }

  function clearResultFields() {
    [
      elements.resultTitle,
      elements.resultCaption,
      elements.resultCta,
      elements.resultHashtags,
    ].forEach((field) => {
      if (field) {
        field.value = "";
      }
    });
  }

  async function copyCompletePost() {
    const parts = [
      elements.resultTitle.value.trim(),
      elements.resultCaption.value.trim(),
      elements.resultCta.value.trim(),
      elements.resultHashtags.value.trim(),
    ].filter(Boolean);

    await copyText(parts.join("\n\n"), "Post completo copiado");
  }

  async function copyText(text, successMessage) {
    if (!text) {
      showToast("error", "Nada para copiar", "Este campo está vazio.");

      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        copyTextFallback(text);
      }

      showToast("success", successMessage, "O texto foi guardado na área de transferência.");
    } catch (error) {
      console.error("Erro ao copiar texto:", error);

      showToast("error", "Não foi possível copiar", "Selecione o texto e copie manualmente.");
    }
  }

  function copyTextFallback(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");

    textarea.remove();

    if (!copied) {
      throw new Error("O navegador recusou a cópia.");
    }
  }

  /* ========================================================
     Erros da função
  ======================================================== */

  async function resolveFunctionError(error) {
    const response = error?.context;

    if (response && typeof response.clone === "function") {
      try {
        const payload = await response.clone().json();

        if (payload?.message) {
          return payload.message;
        }
      } catch {
        // A resposta pode não ser JSON. Usa a mensagem genérica abaixo.
      }
    }

    const message = String(error?.message || "");

    if (/401|jwt|unauthorized/i.test(message)) {
      return "A sua sessão expirou. Inicie sessão novamente para continuar.";
    }

    if (/429|rate|limit/i.test(message)) {
      return "Foram feitos muitos pedidos. Aguarde um pouco e tente novamente.";
    }

    if (/network|fetch|failed/i.test(message)) {
      return "Não foi possível contactar o serviço de IA. Verifique a ligação e tente novamente.";
    }

    return "Ocorreu um erro ao criar o post. Tente novamente dentro de alguns instantes.";
  }

  /* ========================================================
     Toasts
  ======================================================== */

  function showToast(type, title, message) {
    if (!elements.toastContainer) {
      return;
    }

    const icons = {
      success: "circle-check",
      error: "circle-alert",
      info: "info",
    };

    const toast = document.createElement("div");
    const iconBox = document.createElement("div");
    const icon = document.createElement("i");
    const content = document.createElement("div");
    const heading = document.createElement("strong");
    const paragraph = document.createElement("p");
    const closeButton = document.createElement("button");
    const closeIcon = document.createElement("i");

    toast.className = "toast is-" + type;
    iconBox.className = "toast-icon";
    content.className = "toast-content";
    closeButton.className = "toast-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Fechar mensagem");

    icon.setAttribute("data-lucide", icons[type] || icons.info);
    closeIcon.setAttribute("data-lucide", "x");

    heading.textContent = title;
    paragraph.textContent = message;

    iconBox.appendChild(icon);
    content.append(heading, paragraph);
    closeButton.appendChild(closeIcon);
    toast.append(iconBox, content, closeButton);
    elements.toastContainer.appendChild(toast);

    closeButton.addEventListener("click", () => toast.remove());

    window.lucide?.createIcons();
    window.setTimeout(() => toast.remove(), 5200);
  }
});

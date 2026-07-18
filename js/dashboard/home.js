"use strict";

/* ==========================================================
   StudioV — Dashboard Home
========================================================== */

const HOME_STORAGE_KEYS = {
  activeWorkspace: "studiov_active_workspace_id",
  demoMode: "studiov_demo_mode",
};

let homeCurrentUser = null;
let homeCurrentWorkspace = null;


/* ==========================================================
   Inicialização
========================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async function () {
    console.log("Dashboard Home carregado.");

    const client = getHomeSupabaseClient();

    if (!client) {
      console.error(
        "Cliente Supabase não encontrado no Dashboard."
      );

      return;
    }

    await initializeHomeDashboard(client);
  }
);


/* ==========================================================
   Cliente Supabase
========================================================== */

function getHomeSupabaseClient() {
  return window.supabaseClient || null;
}


/* ==========================================================
   Inicialização principal
========================================================== */

async function initializeHomeDashboard(client) {
  setDashboardLoadingState();

  try {
    homeCurrentUser =
      await getAuthenticatedUser(client);

    if (!homeCurrentUser) {
      console.warn(
        "Nenhum utilizador autenticado."
      );

      return;
    }

    updateTopbarUser(homeCurrentUser);

    homeCurrentWorkspace =
      await resolveActiveWorkspace(
        client,
        homeCurrentUser
      );

    if (!homeCurrentWorkspace) {
      throw new Error(
        "Nenhum workspace disponível para este utilizador."
      );
    }

    updateWorkspaceInterface(
      homeCurrentWorkspace
    );

    await loadDashboardCounters(
      client,
      homeCurrentWorkspace.id
    );

    console.log(
      "Dashboard inicializado para:",
      homeCurrentWorkspace.name
    );
  } catch (error) {
    console.error(
      "Erro ao inicializar Dashboard:",
      error
    );

    setDashboardErrorState();
  }
}


/* ==========================================================
   Utilizador autenticado
========================================================== */

async function getAuthenticatedUser(client) {
  const {
    data,
    error,
  } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  return data?.user || null;
}


/* ==========================================================
   Workspace ativo
========================================================== */

async function resolveActiveWorkspace(
  client,
  user
) {
  const storedWorkspaceId =
    getHomeStorageValue(
      HOME_STORAGE_KEYS.activeWorkspace
    );

  /*
   * Primeira prioridade:
   * workspace selecionado no localStorage.
   */

  if (storedWorkspaceId) {
    const {
      data: storedWorkspace,
      error: storedWorkspaceError,
    } = await client
      .from("workspaces")
      .select(
        `
          id,
          name,
          slug,
          plan,
          status,
          owner_id
        `
      )
      .eq("id", storedWorkspaceId)
      .maybeSingle();

    if (
      !storedWorkspaceError &&
      storedWorkspace
    ) {
      return storedWorkspace;
    }

    console.warn(
      "Workspace guardado não foi encontrado:",
      storedWorkspaceError?.message
    );
  }

  /*
   * Segunda prioridade:
   * workspace pertencente ao utilizador.
   */

  const {
    data: ownedWorkspace,
    error: ownedWorkspaceError,
  } = await client
    .from("workspaces")
    .select(
      `
        id,
        name,
        slug,
        plan,
        status,
        owner_id
      `
    )
    .eq("owner_id", user.id)
    .eq("status", "active")
    .order("created_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (ownedWorkspaceError) {
    console.warn(
      "Erro ao procurar workspace próprio:",
      ownedWorkspaceError.message
    );
  }

  if (ownedWorkspace) {
    setHomeStorageValue(
      HOME_STORAGE_KEYS.activeWorkspace,
      ownedWorkspace.id
    );

    return ownedWorkspace;
  }

  /*
   * Terceira prioridade:
   * workspace onde o utilizador é membro.
   */

  const {
    data: membership,
    error: membershipError,
  } = await client
    .from("workspace_members")
    .select(
      `
        workspace_id,
        workspaces (
          id,
          name,
          slug,
          plan,
          status,
          owner_id
        )
      `
    )
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.warn(
      "Erro ao procurar participação:",
      membershipError.message
    );
  }

  const memberWorkspace =
    membership?.workspaces || null;

  if (memberWorkspace) {
    setHomeStorageValue(
      HOME_STORAGE_KEYS.activeWorkspace,
      memberWorkspace.id
    );

    return memberWorkspace;
  }

  return null;
}


/* ==========================================================
   Contadores
========================================================== */

async function loadDashboardCounters(
  client,
  workspaceId
) {
  const [
    brandsResult,
    contentsResult,
    clientsResult,
    publicationsResult,
  ] = await Promise.all([
    getTableCount(
      client,
      "brands",
      workspaceId
    ),

    getTableCount(
      client,
      "contents",
      workspaceId
    ),

    getTableCount(
      client,
      "clients",
      workspaceId
    ),

    getPublicationsCount(
      client,
      workspaceId
    ),
  ]);

  updateDashboardCounter(
    "brands",
    "Marcas",
    brandsResult
  );

  updateDashboardCounter(
    "contents",
    "Conteúdos",
    contentsResult
  );

  updateDashboardCounter(
    "clients",
    "Clientes",
    clientsResult
  );

  updateDashboardCounter(
    "publications",
    "Publicações",
    publicationsResult
  );
}


/* ==========================================================
   Contagem genérica
========================================================== */

async function getTableCount(
  client,
  table,
  workspaceId
) {
  const {
    count,
    error,
  } = await client
    .from(table)
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error(
      `Erro ao contar ${table}:`,
      error.message
    );

    return 0;
  }

  return count || 0;
}


/* ==========================================================
   Publicações
========================================================== */

async function getPublicationsCount(
  client,
  workspaceId
) {
  /*
   * Atualmente a página Publicações utiliza
   * os registos da tabela contents.
   *
   * Por isso o total apresentado no Dashboard
   * corresponde ao total de conteúdos disponíveis
   * para publicação.
   */

  const {
    count,
    error,
  } = await client
    .from("contents")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("workspace_id", workspaceId)
    .neq("status", "archived");

  if (error) {
    console.error(
      "Erro ao contar publicações:",
      error.message
    );

    return 0;
  }

  return count || 0;
}


/* ==========================================================
   Atualizar workspace na interface
========================================================== */

function updateWorkspaceInterface(workspace) {
  const workspaceName =
    workspace?.name || "Meu Workspace";

  const selectors = [
    "#workspace-name",
    "#topbar-workspace-name",
    "#active-workspace-name",
    ".workspace-selector-content strong",
  ];

  selectors.forEach(function (selector) {
    document
      .querySelectorAll(selector)
      .forEach(function (element) {
        element.textContent =
          workspaceName;
      });
  });
}


/* ==========================================================
   Atualizar utilizador na topbar
========================================================== */

function updateTopbarUser(user) {
  const metadata =
    user?.user_metadata || {};

  const displayName =
    metadata.full_name ||
    metadata.name ||
    (
      user?.is_anonymous
        ? "Utilizador demo"
        : user?.email?.split("@")[0]
    ) ||
    "Utilizador";

  const avatarLetter =
    displayName
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  document
    .querySelectorAll(".topbar-avatar")
    .forEach(function (element) {
      element.textContent =
        avatarLetter;
    });
}


/* ==========================================================
   Atualizar cartões
========================================================== */

function updateDashboardCounter(
  key,
  label,
  value
) {
  const possibleIds = [
    `${key}-count`,
    `${key}-total`,
    `total-${key}`,
    `dashboard-${key}-count`,
    `stat-${key}`,
  ];

  let elementFound = false;

  possibleIds.forEach(function (id) {
    const element =
      document.getElementById(id);

    if (!element) {
      return;
    }

    element.textContent =
      String(value);

    elementFound = true;
  });

  /*
   * Fallback:
   * encontra o cartão pelo texto da etiqueta.
   *
   * Assim funciona mesmo que o HTML ainda
   * não tenha IDs nos números.
   */

  if (!elementFound) {
    updateStatCardByLabel(
      label,
      value
    );
  }
}


/* ==========================================================
   Encontrar cartão pela etiqueta
========================================================== */

function updateStatCardByLabel(
  expectedLabel,
  value
) {
  const normalizedExpected =
    normalizeDashboardText(
      expectedLabel
    );

  const cards =
    document.querySelectorAll(
      ".stat-card"
    );

  cards.forEach(function (card) {
    const labelElement =
      card.querySelector(
        `
          .stat-card-label,
          [class*="label"],
          small
        `
      );

    if (!labelElement) {
      return;
    }

    const normalizedLabel =
      normalizeDashboardText(
        labelElement.textContent
      );

    if (
      normalizedLabel !==
      normalizedExpected
    ) {
      return;
    }

    const valueElement =
      card.querySelector(
        `
          .stat-card-value,
          [class*="value"],
          strong
        `
      );

    if (valueElement) {
      valueElement.textContent =
        String(value);
    }
  });
}


/* ==========================================================
   Normalizar texto
========================================================== */

function normalizeDashboardText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase();
}


/* ==========================================================
   Estado de carregamento
========================================================== */

function setDashboardLoadingState() {
  const labels = [
    "Marcas",
    "Conteúdos",
    "Clientes",
    "Publicações",
  ];

  labels.forEach(function (label) {
    updateStatCardByLabel(
      label,
      "—"
    );
  });
}


/* ==========================================================
   Estado de erro
========================================================== */

function setDashboardErrorState() {
  const labels = [
    "Marcas",
    "Conteúdos",
    "Clientes",
    "Publicações",
  ];

  labels.forEach(function (label) {
    updateStatCardByLabel(
      label,
      "0"
    );
  });
}


/* ==========================================================
   Local Storage
========================================================== */

function getHomeStorageValue(key) {
  try {
    return window.localStorage.getItem(
      key
    );
  } catch (error) {
    console.warn(
      `Não foi possível ler ${key}:`,
      error
    );

    return null;
  }
}

function setHomeStorageValue(
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
      `Não foi possível guardar ${key}:`,
      error
    );
  }
}
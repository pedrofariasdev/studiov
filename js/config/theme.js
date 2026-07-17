"use strict";

(function initializeStudioVTheme() {
  const STORAGE_KEY = "studiov_theme";

  const VALID_THEMES = [
    "light",
    "dark",
    "system",
  ];

  const systemThemeMedia = window.matchMedia(
    "(prefers-color-scheme: dark)"
  );

  function getPreference() {
    try {
      const savedTheme =
        window.localStorage.getItem(STORAGE_KEY);

      if (VALID_THEMES.includes(savedTheme)) {
        return savedTheme;
      }
    } catch (error) {
      console.warn(
        "Não foi possível carregar o tema:",
        error
      );
    }

    return "system";
  }

  function resolveTheme(preference) {
    if (preference === "system") {
      return systemThemeMedia.matches
        ? "dark"
        : "light";
    }

    return preference;
  }

  function updateDocument(
    preference,
    resolvedTheme
  ) {
    document.documentElement.dataset.theme =
      resolvedTheme;

    document.documentElement.dataset.themePreference =
      preference;

    document.documentElement.style.colorScheme =
      resolvedTheme;

    if (document.body) {
      document.body.dataset.theme =
        resolvedTheme;
    }
  }

  function dispatchThemeEvent(
    preference,
    resolvedTheme
  ) {
    window.dispatchEvent(
      new CustomEvent(
        "studiov:theme-change",
        {
          detail: {
            preference,
            resolvedTheme,
          },
        }
      )
    );
  }

  function applyTheme(
    preference = getPreference(),
    options = {}
  ) {
    const normalizedPreference =
      VALID_THEMES.includes(preference)
        ? preference
        : "system";

    const resolvedTheme =
      resolveTheme(normalizedPreference);

    if (options.save === true) {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          normalizedPreference
        );
      } catch (error) {
        console.warn(
          "Não foi possível guardar o tema:",
          error
        );
      }
    }

    updateDocument(
      normalizedPreference,
      resolvedTheme
    );

    if (options.emit !== false) {
      dispatchThemeEvent(
        normalizedPreference,
        resolvedTheme
      );
    }

    return resolvedTheme;
  }

  function setTheme(preference) {
    return applyTheme(preference, {
      save: true,
      emit: true,
    });
  }

  function handleSystemThemeChange() {
    if (getPreference() === "system") {
      applyTheme("system");
    }
  }

  function handleStorageChange(event) {
    if (event.key === STORAGE_KEY) {
      applyTheme(getPreference());
    }
  }

  applyTheme(getPreference(), {
    emit: false,
  });

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      applyTheme(getPreference(), {
        emit: false,
      });
    }
  );

  if (systemThemeMedia.addEventListener) {
    systemThemeMedia.addEventListener(
      "change",
      handleSystemThemeChange
    );
  } else {
    systemThemeMedia.addListener(
      handleSystemThemeChange
    );
  }

  window.addEventListener(
    "storage",
    handleStorageChange
  );

  window.StudioVTheme = {
    getPreference,
    resolveTheme,
    applyTheme,
    setTheme,
  };
})();
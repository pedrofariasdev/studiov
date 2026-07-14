"use strict";

/* ==========================================================
   StudioV — Brands
   Interações visuais iniciais

   A integração com o Supabase será adicionada depois.
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    /* ======================================================
       Elementos gerais
    ====================================================== */

    const body = document.body;

    const sidebar = document.getElementById("dashboard-sidebar");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const sidebarOpenButton = document.getElementById("topbar-menu-button");
    const sidebarCloseButton = document.getElementById("sidebar-close");

    const createBrandButton = document.getElementById("create-brand-button");
    const emptyCreateBrandButton = document.getElementById(
        "empty-create-brand-button"
    );

    const brandModal = document.getElementById("brand-modal");
    const brandModalTitle = document.getElementById("brand-modal-title");
    const brandModalClose = document.getElementById("brand-modal-close");
    const brandFormCancel = document.getElementById("brand-form-cancel");

    const archiveBrandModal = document.getElementById(
        "archive-brand-modal"
    );

    const archiveBrandCancel = document.getElementById(
        "archive-brand-cancel"
    );

    const archiveBrandConfirm = document.getElementById(
        "archive-brand-confirm"
    );

    const brandForm = document.getElementById("brand-form");
    const brandIdInput = document.getElementById("brand-id");
    const brandNameInput = document.getElementById("brand-name");
    const brandNameError = document.getElementById("brand-name-error");

    const brandWebsiteInput = document.getElementById("brand-website");
    const brandWebsiteError = document.getElementById(
        "brand-website-error"
    );

    const brandDescriptionInput = document.getElementById(
        "brand-description"
    );

    const brandDescriptionCounter = document.getElementById(
        "brand-description-counter"
    );

    const primaryColorPicker = document.getElementById(
        "brand-primary-color-picker"
    );

    const primaryColorInput = document.getElementById(
        "brand-primary-color"
    );

    const secondaryColorPicker = document.getElementById(
        "brand-secondary-color-picker"
    );

    const secondaryColorInput = document.getElementById(
        "brand-secondary-color"
    );

    const brandFormError = document.getElementById("brand-form-error");
    const brandFormSubmitText = document.getElementById(
        "brand-form-submit-text"
    );

    const brandsSearchInput = document.getElementById(
        "brands-search-input"
    );

    const brandsStatusFilter = document.getElementById(
        "brands-status-filter"
    );

    const brandsSortSelect = document.getElementById(
        "brands-sort-select"
    );

    const clearBrandFiltersButton = document.getElementById(
        "clear-brand-filters-button"
    );

    const toastContainer = document.getElementById("toast-container");

    let lastFocusedElement = null;

    /* ======================================================
       Sidebar
    ====================================================== */

    function openSidebar() {
        body.classList.add("sidebar-open");

        sidebarOpenButton?.setAttribute(
            "aria-expanded",
            "true"
        );

        window.setTimeout(() => {
            sidebarCloseButton?.focus();
        }, 100);
    }

    function closeSidebar() {
        body.classList.remove("sidebar-open");

        sidebarOpenButton?.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    sidebarOpenButton?.addEventListener(
        "click",
        openSidebar
    );

    sidebarCloseButton?.addEventListener(
        "click",
        closeSidebar
    );

    sidebarOverlay?.addEventListener(
        "click",
        closeSidebar
    );

    /* ======================================================
       Controle dos modais
    ====================================================== */

    function openModal(modal) {
        if (!modal) {
            return;
        }

        lastFocusedElement = document.activeElement;

        modal.classList.remove("hidden");
        modal.setAttribute("aria-hidden", "false");

        body.classList.add("modal-open");
    }

    function closeModal(modal) {
        if (!modal) {
            return;
        }

        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");

        const hasOpenModal =
            document.querySelector(".modal-overlay:not(.hidden)");

        if (!hasOpenModal) {
            body.classList.remove("modal-open");
        }

        lastFocusedElement?.focus();
    }

    function resetBrandForm() {
        brandForm?.reset();

        if (brandIdInput) {
            brandIdInput.value = "";
        }

        if (primaryColorInput) {
            primaryColorInput.value = "#6D28D9";
        }

        if (primaryColorPicker) {
            primaryColorPicker.value = "#6D28D9";
        }

        if (secondaryColorInput) {
            secondaryColorInput.value = "#A78BFA";
        }

        if (secondaryColorPicker) {
            secondaryColorPicker.value = "#A78BFA";
        }

        if (brandModalTitle) {
            brandModalTitle.textContent = "Nova marca";
        }

        if (brandFormSubmitText) {
            brandFormSubmitText.textContent = "Criar marca";
        }

        clearFormErrors();
        updateDescriptionCounter();
    }

    function openCreateBrandModal() {
        resetBrandForm();
        openModal(brandModal);

        window.setTimeout(() => {
            brandNameInput?.focus();
        }, 100);
    }

    createBrandButton?.addEventListener(
        "click",
        openCreateBrandModal
    );

    emptyCreateBrandButton?.addEventListener(
        "click",
        openCreateBrandModal
    );

    brandModalClose?.addEventListener("click", () => {
        closeModal(brandModal);
    });

    brandFormCancel?.addEventListener("click", () => {
        closeModal(brandModal);
    });

    archiveBrandCancel?.addEventListener("click", () => {
        closeModal(archiveBrandModal);
    });

    archiveBrandConfirm?.addEventListener("click", () => {
        closeModal(archiveBrandModal);

        showToast(
            "warning",
            "Integração pendente",
            "O arquivamento será ligado ao Supabase nos próximos passos."
        );
    });

    brandModal?.addEventListener("click", event => {
        if (event.target === brandModal) {
            closeModal(brandModal);
        }
    });

    archiveBrandModal?.addEventListener("click", event => {
        if (event.target === archiveBrandModal) {
            closeModal(archiveBrandModal);
        }
    });

    /* ======================================================
       Contador da descrição
    ====================================================== */

    function updateDescriptionCounter() {
        if (
            !brandDescriptionInput ||
            !brandDescriptionCounter
        ) {
            return;
        }

        const currentLength =
            brandDescriptionInput.value.length;

        brandDescriptionCounter.textContent =
            `${currentLength}/1000`;
    }

    brandDescriptionInput?.addEventListener(
        "input",
        updateDescriptionCounter
    );

    updateDescriptionCounter();

    /* ======================================================
       Campos de cores
    ====================================================== */

    function normalizeHexColor(value) {
        return value.trim().toUpperCase();
    }

    function isValidHexColor(value) {
        return /^#[0-9A-F]{6}$/i.test(value);
    }

    primaryColorPicker?.addEventListener("input", () => {
        primaryColorInput.value =
            primaryColorPicker.value.toUpperCase();
    });

    primaryColorInput?.addEventListener("input", () => {
        const color = normalizeHexColor(
            primaryColorInput.value
        );

        primaryColorInput.value = color;

        if (isValidHexColor(color)) {
            primaryColorPicker.value = color;
        }
    });

    secondaryColorPicker?.addEventListener("input", () => {
        secondaryColorInput.value =
            secondaryColorPicker.value.toUpperCase();
    });

    secondaryColorInput?.addEventListener("input", () => {
        const color = normalizeHexColor(
            secondaryColorInput.value
        );

        secondaryColorInput.value = color;

        if (isValidHexColor(color)) {
            secondaryColorPicker.value = color;
        }
    });

    /* ======================================================
       Validação do formulário
    ====================================================== */

    function clearFieldError(input, errorElement) {
        input?.classList.remove("is-invalid");

        if (errorElement) {
            errorElement.textContent = "";
        }
    }

    function setFieldError(input, errorElement, message) {
        input?.classList.add("is-invalid");

        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function clearFormErrors() {
        clearFieldError(
            brandNameInput,
            brandNameError
        );

        clearFieldError(
            brandWebsiteInput,
            brandWebsiteError
        );

        brandFormError?.classList.add("hidden");

        if (brandFormError) {
            brandFormError.textContent = "";
        }
    }

    function isValidHttpUrl(value) {
        if (!value) {
            return true;
        }

        try {
            const url = new URL(value);

            return (
                url.protocol === "http:" ||
                url.protocol === "https:"
            );
        } catch {
            return false;
        }
    }

    function validateBrandForm() {
        clearFormErrors();

        let isValid = true;

        const brandName =
            brandNameInput?.value.trim() || "";

        const website =
            brandWebsiteInput?.value.trim() || "";

        if (!brandName) {
            setFieldError(
                brandNameInput,
                brandNameError,
                "Informe o nome da marca."
            );

            isValid = false;
        }

        if (brandName.length > 120) {
            setFieldError(
                brandNameInput,
                brandNameError,
                "O nome deve ter no máximo 120 caracteres."
            );

            isValid = false;
        }

        if (!isValidHttpUrl(website)) {
            setFieldError(
                brandWebsiteInput,
                brandWebsiteError,
                "Informe um endereço válido iniciado por http:// ou https://."
            );

            isValid = false;
        }

        if (
            primaryColorInput &&
            !isValidHexColor(primaryColorInput.value)
        ) {
            primaryColorInput.classList.add("is-invalid");
            isValid = false;
        }

        if (
            secondaryColorInput &&
            !isValidHexColor(secondaryColorInput.value)
        ) {
            secondaryColorInput.classList.add("is-invalid");
            isValid = false;
        }

        return isValid;
    }

    brandNameInput?.addEventListener("input", () => {
        clearFieldError(
            brandNameInput,
            brandNameError
        );
    });

    brandWebsiteInput?.addEventListener("input", () => {
        clearFieldError(
            brandWebsiteInput,
            brandWebsiteError
        );
    });

    brandForm?.addEventListener("submit", event => {
        event.preventDefault();

        const isValid = validateBrandForm();

        if (!isValid) {
            showToast(
                "error",
                "Verifique o formulário",
                "Existem campos que precisam ser corrigidos."
            );

            return;
        }

        showToast(
            "info",
            "Interface preparada",
            "O formulário está válido. No próximo passo vamos conectá-lo ao Supabase."
        );
    });

    /* ======================================================
       Pesquisa e filtros
    ====================================================== */

    clearBrandFiltersButton?.addEventListener(
        "click",
        () => {
            if (brandsSearchInput) {
                brandsSearchInput.value = "";
            }

            if (brandsStatusFilter) {
                brandsStatusFilter.value = "all";
            }

            if (brandsSortSelect) {
                brandsSortSelect.value = "newest";
            }

            showToast(
                "info",
                "Filtros removidos",
                "A pesquisa e os filtros foram redefinidos."
            );
        }
    );

    /* ======================================================
       Toasts
    ====================================================== */

    function getToastIcon(type) {
        const icons = {
            success: "circle-check",
            error: "circle-alert",
            warning: "triangle-alert",
            info: "info"
        };

        return icons[type] || icons.info;
    }

    function showToast(
        type = "info",
        title = "",
        message = ""
    ) {
        if (!toastContainer) {
            return;
        }

        const toast = document.createElement("div");
        toast.className = `toast is-${type}`;

        const iconWrapper = document.createElement("div");
        iconWrapper.className = "toast-icon";

        const icon = document.createElement("i");
        icon.setAttribute(
            "data-lucide",
            getToastIcon(type)
        );

        iconWrapper.appendChild(icon);

        const content = document.createElement("div");
        content.className = "toast-content";

        const toastTitle = document.createElement("strong");
        toastTitle.textContent = title;

        const toastMessage = document.createElement("p");
        toastMessage.textContent = message;

        content.append(
            toastTitle,
            toastMessage
        );

        const closeButton = document.createElement("button");
        closeButton.className = "toast-close";
        closeButton.type = "button";
        closeButton.setAttribute(
            "aria-label",
            "Fechar mensagem"
        );

        const closeIcon = document.createElement("i");
        closeIcon.setAttribute("data-lucide", "x");

        closeButton.appendChild(closeIcon);

        toast.append(
            iconWrapper,
            content,
            closeButton
        );

        toastContainer.appendChild(toast);

        if (window.lucide) {
            window.lucide.createIcons();
        }

        function removeToast() {
            toast.remove();
        }

        closeButton.addEventListener(
            "click",
            removeToast
        );

        window.setTimeout(
            removeToast,
            5000
        );
    }

    /* ======================================================
       Tecla Escape
    ====================================================== */

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") {
            return;
        }

        if (
            archiveBrandModal &&
            !archiveBrandModal.classList.contains("hidden")
        ) {
            closeModal(archiveBrandModal);
            return;
        }

        if (
            brandModal &&
            !brandModal.classList.contains("hidden")
        ) {
            closeModal(brandModal);
            return;
        }

        if (body.classList.contains("sidebar-open")) {
            closeSidebar();
        }
    });

    /* ======================================================
       Ícones
    ====================================================== */

    if (window.lucide) {
        window.lucide.createIcons();
    }
});
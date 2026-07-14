"use strict";

/* ==========================================================
   StudioV — Proteção das páginas autenticadas
========================================================== */

(() => {
    const supabaseClient = window.supabaseClient;

    window.studioVAuthReady = (async () => {
        if (!supabaseClient) {
            console.error(
                "O cliente Supabase não foi encontrado."
            );

            window.location.replace(
                "/html/auth/login.html"
            );

            return null;
        }

        try {
            const {
                data,
                error
            } = await supabaseClient.auth.getUser();

            if (error) {
                console.error(
                    "Erro ao validar utilizador:",
                    error.message
                );

                window.location.replace(
                    "/html/auth/login.html"
                );

                return null;
            }

            if (!data?.user) {
                window.location.replace(
                    "/html/auth/login.html"
                );

                return null;
            }

            return data.user;
        } catch (error) {
            console.error(
                "Falha ao validar autenticação:",
                error
            );

            window.location.replace(
                "/html/auth/login.html"
            );

            return null;
        }
    })();
})();
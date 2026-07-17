(() => {
  "use strict";

  const SUPABASE_URL =
    "https://frwnelhsmcyingkblego.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_x3n7rTHeguCjeE02wmT2BA_DqpmIZ04";

  if (!window.supabase?.createClient) {
    console.error(
      "A biblioteca Supabase JS não foi carregada."
    );

    return;
  }

  if (
    !SUPABASE_URL.startsWith("https://") ||
    SUPABASE_URL.includes("COLE_AQUI")
  ) {
    console.error(
      "Configure corretamente o Project URL do Supabase."
    );

    return;
  }

  if (
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY.includes("COLE_AQUI")
  ) {
    console.error(
      "Configure corretamente a Publishable Key do Supabase."
    );

    return;
  }

  /*
   * Evita criar o cliente novamente caso o arquivo
   * seja carregado mais de uma vez.
   */
  if (window.supabaseClient) {
    return;
  }

  window.supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );

  console.log("Supabase conectado com sucesso.");
})();
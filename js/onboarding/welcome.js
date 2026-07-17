"use strict";

/* ==========================================================
   StudioV — Onboarding Welcome
========================================================== */


document.addEventListener("DOMContentLoaded", async () => {


  console.log("Onboarding Welcome carregado.");



  const supabaseClient = window.supabaseClient;



  /* ======================================================
     Verificar Supabase
  ====================================================== */


  if (!supabaseClient) {

    console.error(
      "Cliente Supabase não encontrado."
    );

    return;

  }



  /* ======================================================
     Verificar autenticação
  ====================================================== */


  try {


    const {
      data: { session },
      error
    } = await supabaseClient.auth.getSession();



    if (error) {

      console.error(
        "Erro ao verificar sessão:",
        error.message
      );

      return;

    }



    /*
      Se futuramente quisermos impedir
      acesso direto ao onboarding sem login,
      fazemos aqui.
    */


    if (!session?.user) {


      console.warn(
        "Usuário não autenticado."
      );


      // Futuramente:
      // window.location.href =
      // "/html/auth/login.html";


      return;

    }



    console.log(
      "Usuário autenticado:",
      session.user.email
    );



  } catch (error) {


    console.error(
      "Falha ao verificar autenticação:",
      error
    );


  }



});
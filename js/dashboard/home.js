"use strict";

/* ==========================================================
   StudioV — Dashboard Home
========================================================== */


document.addEventListener(
  "DOMContentLoaded",
  async () => {


    console.log(
      "Dashboard Home carregado."
    );



    await carregarUsuario();



    inicializarDashboard();



  }
);





/* ==========================================================
   Usuário
========================================================== */


async function carregarUsuario() {


  try {


    if (
      typeof supabaseClient === "undefined"
    ) {


      console.warn(
        "Supabase ainda não carregado."
      );


      return;


    }




    const {
      data,
      error
    } =
      await supabaseClient.auth.getUser();





    if (
      error ||
      !data.user
    ) {


      console.warn(
        "Usuário não autenticado."
      );


      return;


    }





    const usuario =
      data.user;





    const nome =
      usuario.user_metadata?.full_name ||
      usuario.email?.split("@")[0] ||
      "Utilizador";





    const avatar =
      nome
        .charAt(0)
        .toUpperCase();





    const nameElement =
      document.getElementById(
        "sidebar-user-name"
      );



    const emailElement =
      document.getElementById(
        "sidebar-user-email"
      );



    const avatarElement =
      document.getElementById(
        "sidebar-user-avatar"
      );



    const topAvatar =
      document.querySelector(
        ".topbar-avatar"
      );





    if(nameElement){

      nameElement.textContent =
        nome;

    }



    if(emailElement){

      emailElement.textContent =
        usuario.email;

    }




    if(avatarElement){

      avatarElement.textContent =
        avatar;

    }



    if(topAvatar){

      topAvatar.textContent =
        avatar;

    }





  } catch(error){


    console.error(
      "Erro ao carregar usuário:",
      error
    );


  }


}







/* ==========================================================
   Dashboard
========================================================== */


function inicializarDashboard(){



  console.log(
    "Dashboard inicializado."
  );



  /*
    Futuramente:

    - carregar quantidade de marcas
    - carregar conteúdos
    - carregar clientes
    - carregar publicações
    - carregar atividades recentes

  */



}
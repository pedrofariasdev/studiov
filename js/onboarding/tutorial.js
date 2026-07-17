"use strict";

/* ==========================================================
   StudioV — Onboarding Tutorial
========================================================== */


document.addEventListener("DOMContentLoaded", () => {


  console.log("Onboarding Tutorial carregado.");



  const finishButton =
    document.getElementById(
      "finish-onboarding"
    );



  if (!finishButton) {


    console.error(
      "Botão finalizar onboarding não encontrado."
    );


    return;


  }





  finishButton.addEventListener(
    "click",
    async () => {


      try {


        finishButton.disabled = true;



        finishButton.innerHTML = `
          Preparando StudioV...
        `;





        /*
          Recupera dados coletados
          durante o onboarding
        */


        const userType =
          localStorage.getItem(
            "studiov_user_type"
          );



        const goals =
          JSON.parse(
            localStorage.getItem(
              "studiov_goals"
            )
          ) || [];



        const platforms =
          JSON.parse(
            localStorage.getItem(
              "studiov_platforms"
            )
          ) || [];






        const onboardingData = {


          userType,

          goals,

          platforms,


          completedAt:
            new Date().toISOString()


        };







        console.log(
          "Resumo onboarding:",
          onboardingData
        );







        /*
          Guarda resumo completo
          para futura integração
          com Supabase

          profiles
          workspace
          preferences

        */


        localStorage.setItem(
          "studiov_onboarding_data",
          JSON.stringify(
            onboardingData
          )
        );







        /*
          Marca onboarding como concluído
        */


        localStorage.setItem(
          "studiov_onboarding_completed",
          "true"
        );








        /*
          Remove dados temporários
        */


        localStorage.removeItem(
          "studiov_user_type"
        );


        localStorage.removeItem(
          "studiov_goals"
        );


        localStorage.removeItem(
          "studiov_platforms"
        );








        console.log(
          "Onboarding finalizado com sucesso."
        );







        /*
          Entrada no produto
        */


        window.location.href =
          "/html/dashboard/home.html";






      } catch (error) {



        console.error(
          "Erro ao finalizar onboarding:",
          error
        );



        finishButton.disabled = false;



        finishButton.innerHTML = `
          Entrar na StudioV
          <i data-lucide="arrow-right"></i>
        `;



        if (window.lucide) {

          lucide.createIcons();

        }



      }


    }
  );



});
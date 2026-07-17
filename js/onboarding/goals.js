"use strict";

/* ==========================================================
   StudioV — Onboarding Goals
========================================================== */


document.addEventListener("DOMContentLoaded", () => {


  console.log("Onboarding Goals carregado.");



  const form = document.getElementById(
    "goals-form"
  );


  const options = document.querySelectorAll(
    ".onboarding-option"
  );


  const errorMessage = document.getElementById(
    "goals-error"
  );




  /* ======================================================
     Seleção visual dos objetivos
  ====================================================== */


  options.forEach((option) => {


    const input = option.querySelector(
      "input"
    );



    input.addEventListener(
      "change",
      () => {


        if (input.checked) {


          option.classList.add(
            "selected"
          );


        } else {


          option.classList.remove(
            "selected"
          );


        }



        errorMessage?.classList.add(
          "hidden"
        );


      }
    );


  });





  /* ======================================================
     Envio do formulário
  ====================================================== */


  form?.addEventListener(
    "submit",
    (event) => {


      event.preventDefault();




      const selectedGoals =
        Array.from(
          form.querySelectorAll(
            "input[name='goals']:checked"
          )
        ).map(
          (input) => input.value
        );





      if (selectedGoals.length === 0) {


        errorMessage?.classList.remove(
          "hidden"
        );


        return;


      }





      /*
        Guardar temporariamente.
        Depois será enviado para Supabase.
      */


      localStorage.setItem(
        "studiov_goals",
        JSON.stringify(selectedGoals)
      );



      console.log(
        "Objetivos selecionados:",
        selectedGoals
      );




      window.location.href =
        "/html/onboarding/platforms.html";



    }
  );



});
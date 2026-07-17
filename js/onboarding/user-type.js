"use strict";

/* ==========================================================
   StudioV — Onboarding User Type
========================================================== */


document.addEventListener("DOMContentLoaded", () => {


  console.log("Onboarding User Type carregado.");



  const form = document.getElementById("user-type-form");

  const options = document.querySelectorAll(
    ".onboarding-option"
  );

  const errorMessage = document.getElementById(
    "user-type-error"
  );



  /* ======================================================
     Seleção visual das opções
  ====================================================== */


  options.forEach((option) => {


    const input = option.querySelector(
      "input"
    );



    input.addEventListener(
      "change",
      () => {


        options.forEach((item) => {

          item.classList.remove(
            "selected"
          );

        });



        option.classList.add(
          "selected"
        );



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



      const selectedOption =
        form.querySelector(
          "input[name='user_type']:checked"
        );



      if (!selectedOption) {


        errorMessage?.classList.remove(
          "hidden"
        );


        return;


      }




      const userType =
        selectedOption.value;



      /*
        Guardamos temporariamente.
        Depois será enviado para profiles
        no Supabase.
      */


      localStorage.setItem(
        "studiov_user_type",
        userType
      );



      console.log(
        "Tipo selecionado:",
        userType
      );



      window.location.href =
        "/html/onboarding/goals.html";


    }
  );


});
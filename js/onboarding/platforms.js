"use strict";


console.log("Onboarding Platforms carregado.");



document.addEventListener(
  "DOMContentLoaded",
  () => {


    const form = document.getElementById(
      "platforms-form"
    );


    const errorMessage = document.getElementById(
      "platforms-error"
    );


    const options = document.querySelectorAll(
      ".onboarding-option"
    );



    if (!form) {

      console.error(
        "Formulário platforms não encontrado."
      );

      return;

    }





    options.forEach((option) => {


      const input =
        option.querySelector("input");



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



        }
      );



    });







    form.addEventListener(
      "submit",
      (event) => {


        event.preventDefault();



        const selectedPlatforms =
          Array.from(
            document.querySelectorAll(
              "input[name='platforms']:checked"
            )
          )
          .map(
            (input) => input.value
          );





        if (
          selectedPlatforms.length === 0
        ) {


          errorMessage.classList.remove(
            "hidden"
          );


          return;


        }




        localStorage.setItem(
          "studiov_platforms",
          JSON.stringify(
            selectedPlatforms
          )
        );




        console.log(
          "Plataformas selecionadas:",
          selectedPlatforms
        );




        window.location.href =
          "/html/onboarding/tutorial.html";



      }
    );



  }
);
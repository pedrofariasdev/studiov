"use strict";

/* ==========================================================
   StudioV — Login
========================================================== */


document.addEventListener("DOMContentLoaded", async () => {


  const loginForm =
    document.getElementById("login-form");


  const emailInput =
    document.getElementById("login-email");


  const emailError =
    document.getElementById("login-email-error");


  const passwordInput =
    document.getElementById("login-password");


  const passwordError =
    document.getElementById("login-password-error");


  const passwordToggle =
    document.getElementById("login-password-toggle");


  const submitButton =
    document.getElementById("login-submit-button");


  const submitText =
    document.getElementById("login-submit-text");


  const buttonLoader =
    document.getElementById("login-button-loader");


  const generalError =
    document.getElementById("login-general-error");


  const googleLoginButton =
    document.getElementById("google-login-button");



  const supabaseClient =
    window.supabaseClient;




  /* ======================================================
     Verificar Supabase
  ====================================================== */


  if (!supabaseClient) {


    showGeneralError(
      "Não foi possível iniciar a ligação com o servidor."
    );


    console.error(
      "Supabase não encontrado."
    );


    return;


  }







  /* ======================================================
     Verificar sessão existente
  ====================================================== */


  try {


    const {
      data: { session },
      error
    } =
      await supabaseClient.auth.getSession();



    if (error) {


      console.error(
        "Erro ao verificar sessão:",
        error.message
      );


    }




    if (session?.user) {


      window.location.replace(
        "/html/dashboard/home.html"
      );


      return;


    }



  } catch(error) {


    console.error(
      "Erro ao verificar sessão:",
      error
    );


  }







  /* ======================================================
     Mostrar / esconder senha
  ====================================================== */


  passwordToggle?.addEventListener(
    "click",
    () => {


      const visible =
        passwordInput.type === "text";



      passwordInput.type =
        visible
          ? "password"
          : "text";



      passwordToggle.innerHTML = `

        <i data-lucide="${
          visible
            ? "eye"
            : "eye-off"
        }"></i>

      `;



      window.lucide?.createIcons();


    }
  );







  /* ======================================================
     Validação
  ====================================================== */


  function isValidEmail(email) {


    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);


  }






  function clearFieldError(
    input,
    errorElement
  ) {


    input?.classList.remove(
      "is-invalid"
    );


    if(errorElement){

      errorElement.textContent = "";

    }


  }







  function setFieldError(
    input,
    errorElement,
    message
  ){


    input?.classList.add(
      "is-invalid"
    );


    if(errorElement){

      errorElement.textContent =
        message;

    }


  }







  function clearGeneralError(){


    if(!generalError){

      return;

    }


    generalError.textContent = "";


    generalError.classList.add(
      "hidden"
    );


  }







  function showGeneralError(message){


    if(!generalError){

      return;

    }


    generalError.textContent =
      message;


    generalError.classList.remove(
      "hidden"
    );


  }







  function validateLoginForm(){


    clearFieldError(
      emailInput,
      emailError
    );


    clearFieldError(
      passwordInput,
      passwordError
    );


    clearGeneralError();




    let valid = true;



    const email =
      emailInput.value.trim();


    const password =
      passwordInput.value;





    if(!email){


      setFieldError(
        emailInput,
        emailError,
        "Introduza o seu email."
      );


      valid = false;


    }
    else if(
      !isValidEmail(email)
    ){


      setFieldError(
        emailInput,
        emailError,
        "Introduza um email válido."
      );


      valid = false;


    }





    if(!password){


      setFieldError(
        passwordInput,
        passwordError,
        "Introduza a sua palavra-passe."
      );


      valid = false;


    }
    else if(password.length < 6){


      setFieldError(
        passwordInput,
        passwordError,
        "A palavra-passe deve ter pelo menos 6 caracteres."
      );


      valid = false;


    }



    return valid;


  }








  /* ======================================================
     Loading
  ====================================================== */


  function setLoading(state){


    submitButton.disabled =
      state;


    emailInput.disabled =
      state;


    passwordInput.disabled =
      state;



    if(submitText){


      submitText.textContent =
        state
          ? "A entrar..."
          : "Entrar";


    }


    buttonLoader?.classList.toggle(
      "hidden",
      !state
    );


  }







  /* ======================================================
     Login
  ====================================================== */


  loginForm?.addEventListener(
    "submit",
    async(event)=>{


      event.preventDefault();



      if(!validateLoginForm()){

        return;

      }



      setLoading(true);



      const email =
        emailInput.value
        .trim()
        .toLowerCase();



      const password =
        passwordInput.value;





      try{


        const {
          data,
          error
        } =
        await supabaseClient.auth
        .signInWithPassword({

          email,

          password

        });





        if(error){

          throw error;

        }




        if(
          !data?.session ||
          !data?.user
        ){


          throw new Error(
            "Sessão não criada."
          );


        }




        console.log(
          "Login efetuado com sucesso."
        );




        window.location.replace(
          "/html/dashboard/home.html"
        );




      }
      catch(error){



        console.error(
          "Erro no login:",
          error
        );



        showGeneralError(
          "Email ou palavra-passe incorretos."
        );



        setLoading(false);



      }



    }
  );







  /* ======================================================
     Google
  ====================================================== */


  googleLoginButton?.addEventListener(
    "click",
    ()=>{


      showGeneralError(
        "Login com Google ainda não configurado."
      );


    }
  );







  window.lucide?.createIcons();



});
const authPage = document.getElementById("authPage");
const notesPage = document.getElementById("notesPage");

const authForm = document.getElementById("authForm");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");

const authSwitchText =
    document.getElementById("authSwitchText");

const authSwitchButton =
    document.getElementById("authSwitchButton");

const logoutButton =
    document.getElementById("logoutButton");


let isSignUpMode = false;


/* =========================
   AUTH MODE
========================= */

authSwitchButton.addEventListener("click", () => {

    isSignUpMode = !isSignUpMode;


    if (isSignUpMode) {

        authTitle.textContent =
            "Create your account";

        authSubtitle.textContent =
            "Create an account to start keeping your notes.";

        authSwitchText.textContent =
            "Already have an account?";

        authSwitchButton.textContent =
            "Sign in";

    } else {

        authTitle.textContent =
            "Welcome back";

        authSubtitle.textContent =
            "Sign in to access your notes.";

        authSwitchText.textContent =
            "Don't have an account?";

        authSwitchButton.textContent =
            "Sign up";
    }

});


/* =========================
   TEMPORARY LOGIN
========================= */

authForm.addEventListener("submit", (event) => {

    event.preventDefault();

    authPage.classList.add("hidden");

    notesPage.classList.remove("hidden");

});


/* =========================
   TEMPORARY LOGOUT
========================= */

logoutButton.addEventListener("click", () => {

    notesPage.classList.add("hidden");

    authPage.classList.remove("hidden");

});
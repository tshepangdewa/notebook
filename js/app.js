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

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

let isSignUpMode = false;


/* =========================
   AUTH MODE
========================= */

authSwitchButton.addEventListener("click", () => {

    isSignUpMode = !isSignUpMode;

    clearAuthMessage();

    if (isSignUpMode) {

        authTitle.textContent =
            "Create your account";

        authSubtitle.textContent =
            "Create an account to start keeping your notes.";

        authSwitchText.textContent =
            "Already have an account?";

        authSwitchButton.textContent =
            "Sign in";

        authForm.querySelector(".primary-button").textContent =
            "Sign up";

    } else {

        authTitle.textContent =
            "Your notes, understood by AI";

        authSubtitle.textContent =
            "Sign in to access your notes.";

        authSwitchText.textContent =
            "Don't have an account?";

        authSwitchButton.textContent =
            "Sign up";

        authForm.querySelector(".primary-button").textContent =
            "Sign in";
    }

    passwordInput.value = "";
});


/* =========================
   AUTH MESSAGE
========================= */

function showAuthMessage(message, type = "error") {

    let messageElement =
        document.getElementById("authMessage");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.className =
        `auth-message ${type}`;
}


function clearAuthMessage() {

    const messageElement =
        document.getElementById("authMessage");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = "";
    messageElement.className =
        "auth-message hidden";
}


/* =========================
   BUTTON LOADING STATE
========================= */

function setAuthLoading(isLoading) {

    const button =
        authForm.querySelector(".primary-button");

    button.disabled = isLoading;

    if (isLoading) {

        button.textContent =
            isSignUpMode
                ? "Creating account..."
                : "Signing in...";

    } else {

        button.textContent =
            isSignUpMode
                ? "Sign up"
                : "Sign in";
    }
}


/* =========================
   AUTH FORM
========================= */

authForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearAuthMessage();

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    if (!email || !password) {

        showAuthMessage(
            "Please enter your email and password."
        );

        return;
    }

    setAuthLoading(true);


    try {

        /* =========================
           SIGN UP
        ========================= */

        if (isSignUpMode) {

            const { data, error } =
                await supabaseClient.auth.signUp({
                    email: email,
                    password: password
                });


            if (error) {
                throw error;
            }


            /*
             * If email confirmation is enabled,
             * Supabase creates the account but
             * does not immediately create a session.
             */

            if (data.session) {

                showNotesPage();

            } else {

                showAuthMessage(
                    "Account created. Please check your email to confirm your account.",
                    "success"
                );

                passwordInput.value = "";
            }

            return;
        }


        /* =========================
           SIGN IN
        ========================= */

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) {
            throw error;
        }


        if (data.session) {

            showNotesPage();

        }

    } catch (error) {

        console.error("Authentication error:", error);

        showAuthMessage(
            getFriendlyAuthError(error)
        );

    } finally {

        setAuthLoading(false);
    }
});


/* =========================
   FRIENDLY AUTH ERRORS
========================= */

function getFriendlyAuthError(error) {

    const message =
        error?.message?.toLowerCase() || "";


    if (message.includes("invalid login credentials")) {

        return "Incorrect email or password.";
    }


    if (message.includes("email not confirmed")) {

        return "Please confirm your email before signing in.";
    }


    if (message.includes("password")) {

        return error.message;
    }


    if (message.includes("email")) {

        return error.message;
    }


    return "Something went wrong. Please try again.";
}


/* =========================
   SHOW NOTES PAGE
========================= */

function showNotesPage() {

    authPage.classList.add("hidden");
    notesPage.classList.remove("hidden");
}


/* =========================
   SHOW AUTH PAGE
========================= */

function showAuthPage() {

    notesPage.classList.add("hidden");
    authPage.classList.remove("hidden");
}


/* =========================
   LOGOUT
========================= */

logoutButton.addEventListener("click", async () => {

    clearAuthMessage();

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {

        console.error(
            "Logout error:",
            error
        );

        return;
    }

    showAuthPage();

    authForm.reset();

    isSignUpMode = false;

    authTitle.textContent =
        "Your notes, understood by AI";

    authSubtitle.textContent =
        "Sign in to access your notes.";

    authSwitchText.textContent =
        "Don't have an account?";

    authSwitchButton.textContent =
        "Sign up";

    authForm.querySelector(".primary-button").textContent =
        "Sign in";
});


/* =========================
   CHECK AUTH SESSION
========================= */

async function checkSession() {

    const {
        data,
        error
    } = await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        showAuthPage();

        return;
    }


    if (data.session) {

        showNotesPage();

    } else {

        showAuthPage();
    }
}


/* =========================
   AUTH STATE LISTENER
========================= */

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        if (
            event === "SIGNED_IN" &&
            session
        ) {

            showNotesPage();
        }


        if (
            event === "SIGNED_OUT"
        ) {

            showAuthPage();
        }
    }
);


/* =========================
   INITIALIZE
========================= */

checkSession();
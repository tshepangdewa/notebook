// DOM Elements - Navigation & Cards
const welcomeScreen = document.getElementById("welcome-screen");
const signupScreen = document.getElementById("signup-screen");
const signinScreen = document.getElementById("signin-screen");

const signupButton = document.getElementById("signup-btn");
const signinButton = document.getElementById("signin-btn");

const signupBack = document.getElementById("signup-back");
const signinBack = document.getElementById("signin-back");

const showSignin = document.getElementById("show-signin");
const showSignup = document.getElementById("show-signup");

// DOM Elements - Forms & Inputs
const signupForm = document.getElementById("signup-form");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupConfirmPassword = document.getElementById("signup-confirm-password");
const signupMessage = document.getElementById("signup-message");

const signinForm = document.getElementById("signin-form");
const signinEmail = document.getElementById("signin-email");
const signinPassword = document.getElementById("signin-password");
const signinMessage = document.getElementById("signin-message");


// Screen Navigation Handler
function showScreen(screen) {
    welcomeScreen.classList.add("hidden");
    signupScreen.classList.add("hidden");
    signinScreen.classList.add("hidden");

    // Clear messages when switching screens
    signupMessage.textContent = "";
    signinMessage.textContent = "";

    screen.classList.remove("hidden");
}

// UI Event Listeners
signupButton.addEventListener("click", () => showScreen(signupScreen));
signinButton.addEventListener("click", () => showScreen(signinScreen));

signupBack.addEventListener("click", () => showScreen(welcomeScreen));
signinBack.addEventListener("click", () => showScreen(welcomeScreen));

showSignin.addEventListener("click", () => showScreen(signinScreen));
showSignup.addEventListener("click", () => showScreen(signupScreen));


// Helpers for Form Messaging
function showMessage(element, text, isError = true) {
    element.textContent = text;
    element.style.color = isError ? "#B42318" : "#067A5B";
}

function setButtonLoading(button, isLoading, defaultText) {
    button.disabled = isLoading;
    button.textContent = isLoading ? "Please wait..." : defaultText;
}


// --- SUPABASE AUTHENTICATION ---

// 1. Sign Up Handler
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirmPassword = signupConfirmPassword.value;
    const submitBtn = signupForm.querySelector("button[type='submit']");

    signupMessage.textContent = "";

    // Client-side Password Confirmation Check
    if (password !== confirmPassword) {
        showMessage(signupMessage, "Passwords do not match.");
        return;
    }

    if (password.length < 6) {
        showMessage(signupMessage, "Password must be at least 6 characters.");
        return;
    }

    setButtonLoading(submitBtn, true, "Create Account");

    try {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        // Check if email confirmation is required by Supabase settings
        if (data.user && data.session === null) {
            showMessage(
                signupMessage,
                "Success! Check your email to confirm your account.",
                false
            );
            signupForm.reset();
        } else if (data.session) {
            // Auto sign-in enabled
            window.location.href = "app.html";
        }
    } catch (error) {
        showMessage(signupMessage, error.message || "Failed to sign up.");
    } finally {
        setButtonLoading(submitBtn, false, "Create Account");
    }
});


// 2. Sign In Handler
signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = signinEmail.value.trim();
    const password = signinPassword.value;
    const submitBtn = signinForm.querySelector("button[type='submit']");

    signinMessage.textContent = "";

    setButtonLoading(submitBtn, true, "Sign In");

    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        if (data.session) {
            window.location.href = "app.html";
        }
    } catch (error) {
        showMessage(signinMessage, error.message || "Invalid login credentials.");
    } finally {
        setButtonLoading(submitBtn, false, "Sign In");
    }
});


// 3. Auth Session Guard (Auto-redirect if already signed in)
async function checkExistingSession() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
        window.location.href = "app.html";
    }
}

checkExistingSession();
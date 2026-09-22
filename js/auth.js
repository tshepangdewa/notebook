const welcomeScreen = document.getElementById("welcome-screen");
const signupScreen = document.getElementById("signup-screen");
const signinScreen = document.getElementById("signin-screen");

const signupButton = document.getElementById("signup-btn");
const signinButton = document.getElementById("signin-btn");

const signupBack = document.getElementById("signup-back");
const signinBack = document.getElementById("signin-back");

const showSignin = document.getElementById("show-signin");
const showSignup = document.getElementById("show-signup");


function showScreen(screen) {
    welcomeScreen.classList.add("hidden");
    signupScreen.classList.add("hidden");
    signinScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}


signupButton.addEventListener("click", () => {
    showScreen(signupScreen);
});


signinButton.addEventListener("click", () => {
    showScreen(signinScreen);
});


signupBack.addEventListener("click", () => {
    showScreen(welcomeScreen);
});


signinBack.addEventListener("click", () => {
    showScreen(welcomeScreen);
});


showSignin.addEventListener("click", () => {
    showScreen(signinScreen);
});


showSignup.addEventListener("click", () => {
    showScreen(signupScreen);
});
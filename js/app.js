// js/app.js

// Auth guard & User Email initialization
async function initDashboardGuard() {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error || !session) {
        window.location.href = "index.html";
        return;
    }

    const userEmailElement = document.getElementById("user-email");
    if (userEmailElement) {
        userEmailElement.textContent = session.user.email;
    }
}

// Sign Out listener
const signoutBtn = document.getElementById("signout-btn");
if (signoutBtn) {
    signoutBtn.addEventListener("click", async () => {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
            alert("Error signing out: " + error.message);
        } else {
            window.location.href = "index.html";
        }
    });
}

// Expand Quick-Create Note Bar on focus
const createContent = document.getElementById("create-content");
const createTitle = document.getElementById("create-title");
const createActions = document.getElementById("create-actions");

if (createContent) {
    createContent.addEventListener("focus", () => {
        createTitle.classList.remove("hidden");
        createActions.classList.remove("hidden");
        createContent.rows = 3;
    });
}

initDashboardGuard();
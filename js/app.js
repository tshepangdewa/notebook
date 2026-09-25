// js/app.js

// State management for quick-create bar
let isCreatePinned = false;

// Initialize Session Guard and Load Notes
async function initDashboard() {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error || !session) {
        window.location.href = "index.html";
        return;
    }

    // Set user email display
    const userEmailElement = document.getElementById("user-email");
    if (userEmailElement) {
        userEmailElement.textContent = session.user.email;
    }

    // Attach event listeners
    setupCreateFormListeners();
}

// Event Listeners for Note Creation Form
function setupCreateFormListeners() {
    const createForm = document.getElementById("create-note-form");
    const createTitle = document.getElementById("create-title");
    const createContent = document.getElementById("create-content");
    const createActions = document.getElementById("create-actions");
    const createPinBtn = document.getElementById("create-pin-btn");

    if (!createContent) return;

    // Expand bar when user clicks/focuses inside content field
    createContent.addEventListener("focus", () => {
        createTitle.classList.remove("hidden");
        createActions.classList.remove("hidden");
        createContent.rows = 3;
    });

    // Toggle Pin state on quick-create bar
    if (createPinBtn) {
        createPinBtn.addEventListener("click", () => {
            isCreatePinned = !isCreatePinned;
            if (isCreatePinned) {
                createPinBtn.classList.remove("btn-primary");
                createPinBtn.classList.add("btn-secondary");
                createPinBtn.textContent = "Pinned";
            } else {
                createPinBtn.classList.remove("btn-secondary");
                createPinBtn.classList.add("btn-primary");
                createPinBtn.textContent = "Pin";
            }
        });
    }

    // Collapse creation bar when user clicks outside the form (if fields are empty)
    document.addEventListener("click", (event) => {
        if (!createForm.contains(event.target)) {
            if (!createTitle.value.trim() && !createContent.value.trim()) {
                collapseCreateForm();
            }
        }
    });

    // Form Submission (Save to Supabase)
    createForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = createTitle.value.trim();
        const content = createContent.value.trim();

        // Do not save if both fields are blank
        if (!title && !content) {
            collapseCreateForm();
            return;
        }

        // Get active user ID
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        // Insert row into 'notes' table
        const { data, error } = await window.supabaseClient
            .from("notes")
            .insert([
                {
                    user_id: session.user.id,
                    title: title,
                    content: content,
                    is_pinned: isCreatePinned,
                    color: "default"
                }
            ])
            .select();

        if (error) {
            alert("Error creating note: " + error.message);
            return;
        }

        // Reset creation bar state
        createTitle.value = "";
        createContent.value = "";
        isCreatePinned = false;

        if (createPinBtn) {
            createPinBtn.classList.remove("btn-secondary");
            createPinBtn.classList.add("btn-primary");
            createPinBtn.textContent = "Pin";
        }

        collapseCreateForm();

        // Placeholder for Step 11: Refresh displayed notes list
        console.log("Note saved successfully:", data);
        if (typeof fetchAndRenderNotes === "function") {
            fetchAndRenderNotes();
        }
    });
}

// Helper to collapse quick-create form back to initial single-line state
function collapseCreateForm() {
    const createTitle = document.getElementById("create-title");
    const createContent = document.getElementById("create-content");
    const createActions = document.getElementById("create-actions");

    if (createTitle) createTitle.classList.add("hidden");
    if (createActions) createActions.classList.add("hidden");
    if (createContent) createContent.rows = 1;
}

// Sign Out Handler
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

// Start Dashboard logic
initDashboard();
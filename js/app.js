// js/app.js

// Global State
let isCreatePinned = false;
let currentNotes = []; // Stores loaded notes locally

// Initialize Dashboard
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

    // Attach form and control listeners
    setupCreateFormListeners();
    setupSortListener();

    // Initial Fetch of Notes
    await fetchAndRenderNotes();
}

// --------------------------------------------------------------------------
// Fetch Notes from Supabase
// --------------------------------------------------------------------------
async function fetchAndRenderNotes() {
    const sortSelect = document.getElementById("sort-select");
    const sortValue = sortSelect ? sortSelect.value : "updated_desc";

    let query = window.supabaseClient.from("notes").select("*");

    // Apply Sorting based on UI selection
    switch (sortValue) {
        case "created_desc":
            query = query.order("created_at", { ascending: false });
            break;
        case "created_asc":
            query = query.order("created_at", { ascending: true });
            break;
        case "title_asc":
            query = query.order("title", { ascending: true });
            break;
        case "updated_desc":
        default:
            query = query.order("updated_at", { ascending: false });
            break;
    }

    const { data: notes, error } = await query;

    if (error) {
        console.error("Error fetching notes:", error.message);
        return;
    }

    currentNotes = notes || [];
    renderNotesGrid(currentNotes);
}

// --------------------------------------------------------------------------
// Render Notes Grid (Pinned vs Others)
// --------------------------------------------------------------------------
function renderNotesGrid(notes) {
    const pinnedSection = document.getElementById("pinned-section");
    const pinnedGrid = document.getElementById("pinned-grid");
    const othersSection = document.getElementById("others-section");
    const othersGrid = document.getElementById("others-grid");
    const othersTitle = document.getElementById("others-title");
    const emptyState = document.getElementById("empty-state");

    // Clear grids
    pinnedGrid.innerHTML = "";
    othersGrid.innerHTML = "";

    if (!notes || notes.length === 0) {
        pinnedSection.classList.add("hidden");
        othersSection.classList.add("hidden");
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");

    // Separate notes into Pinned and Unpinned
    const pinnedNotes = notes.filter(n => n.is_pinned);
    const otherNotes = notes.filter(n => !n.is_pinned);

    // Render Pinned Section
    if (pinnedNotes.length > 0) {
        pinnedSection.classList.remove("hidden");
        pinnedNotes.forEach(note => {
            pinnedGrid.appendChild(createNoteCardElement(note));
        });
    } else {
        pinnedSection.classList.add("hidden");
    }

    // Render Others Section
    if (otherNotes.length > 0) {
        othersSection.classList.remove("hidden");
        
        // Show "OTHERS" section header only if there are also pinned notes
        if (pinnedNotes.length > 0) {
            othersTitle.classList.remove("hidden");
        } else {
            othersTitle.classList.add("hidden");
        }

        otherNotes.forEach(note => {
            othersGrid.appendChild(createNoteCardElement(note));
        });
    } else {
        othersSection.classList.add("hidden");
    }
}

// --------------------------------------------------------------------------
// Helper: Build DOM Node for Single Note Card
// --------------------------------------------------------------------------
function createNoteCardElement(note) {
    const card = document.createElement("div");
    card.className = `note-card color-${note.color || 'default'}`;
    card.dataset.id = note.id;

    const titleText = note.title ? escapeHtml(note.title) : "";
    const contentText = note.content ? escapeHtml(note.content) : "";

    card.innerHTML = `
        ${note.is_pinned ? '<span class="note-pin-badge">Pinned</span>' : ''}
        ${titleText ? `<div class="note-title">${titleText}</div>` : ''}
        ${contentText ? `<div class="note-content">${contentText}</div>` : ''}
    `;

    // Click card to open edit modal (Step 12 hook)
    card.addEventListener("click", () => {
        if (typeof openEditModal === "function") {
            openEditModal(note);
        }
    });

    return card;
}

// HTML Escape Helper to prevent XSS
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --------------------------------------------------------------------------
// Quick Create Form Listeners
// --------------------------------------------------------------------------
function setupCreateFormListeners() {
    const createForm = document.getElementById("create-note-form");
    const createTitle = document.getElementById("create-title");
    const createContent = document.getElementById("create-content");
    const createActions = document.getElementById("create-actions");
    const createPinBtn = document.getElementById("create-pin-btn");

    if (!createContent) return;

    createContent.addEventListener("focus", () => {
        createTitle.classList.remove("hidden");
        createActions.classList.remove("hidden");
        createContent.rows = 3;
    });

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

    document.addEventListener("click", (event) => {
        if (!createForm.contains(event.target)) {
            if (!createTitle.value.trim() && !createContent.value.trim()) {
                collapseCreateForm();
            }
        }
    });

    createForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = createTitle.value.trim();
        const content = createContent.value.trim();

        if (!title && !content) {
            collapseCreateForm();
            return;
        }

        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        const { error } = await window.supabaseClient
            .from("notes")
            .insert([
                {
                    user_id: session.user.id,
                    title: title,
                    content: content,
                    is_pinned: isCreatePinned,
                    color: "default"
                }
            ]);

        if (error) {
            alert("Error creating note: " + error.message);
            return;
        }

        createTitle.value = "";
        createContent.value = "";
        isCreatePinned = false;

        if (createPinBtn) {
            createPinBtn.classList.remove("btn-secondary");
            createPinBtn.classList.add("btn-primary");
            createPinBtn.textContent = "Pin";
        }

        collapseCreateForm();
        await fetchAndRenderNotes();
    });
}

function collapseCreateForm() {
    const createTitle = document.getElementById("create-title");
    const createContent = document.getElementById("create-content");
    const createActions = document.getElementById("create-actions");

    if (createTitle) createTitle.classList.add("hidden");
    if (createActions) createActions.classList.add("hidden");
    if (createContent) createContent.rows = 1;
}

// --------------------------------------------------------------------------
// Sort Control Listener
// --------------------------------------------------------------------------
function setupSortListener() {
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            fetchAndRenderNotes();
        });
    }
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
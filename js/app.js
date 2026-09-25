// js/app.js

// Global State
let isCreatePinned = false;
let currentNotes = []; 
let currentlyEditingNoteId = null;
let modalIsPinned = false;

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

    // Attach form, modal, and control listeners
    setupCreateFormListeners();
    setupSortListener();
    setupModalListeners();

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

    pinnedGrid.innerHTML = "";
    othersGrid.innerHTML = "";

    if (!notes || notes.length === 0) {
        pinnedSection.classList.add("hidden");
        othersSection.classList.add("hidden");
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");

    const pinnedNotes = notes.filter(n => n.is_pinned);
    const otherNotes = notes.filter(n => !n.is_pinned);

    if (pinnedNotes.length > 0) {
        pinnedSection.classList.remove("hidden");
        pinnedNotes.forEach(note => {
            pinnedGrid.appendChild(createNoteCardElement(note));
        });
    } else {
        pinnedSection.classList.add("hidden");
    }

    if (otherNotes.length > 0) {
        othersSection.classList.remove("hidden");
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

// Helper: Build DOM Node for Single Note Card
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

    card.addEventListener("click", () => {
        openEditModal(note);
    });

    return card;
}

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
// Modal Edit & Delete Handlers
// --------------------------------------------------------------------------
function setupModalListeners() {
    const modalOverlay = document.getElementById("edit-modal");
    const modalCloseBtn = document.getElementById("modal-close-btn");
    const modalDeleteBtn = document.getElementById("modal-delete-btn");
    const modalPinBtn = document.getElementById("modal-pin-btn");

    // Close button event
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", async () => {
            await saveAndCloseModal();
        });
    }

    // Click backdrop overlay to save & close
    if (modalOverlay) {
        modalOverlay.addEventListener("click", async (e) => {
            if (e.target === modalOverlay) {
                await saveAndCloseModal();
            }
        });
    }

    // Toggle Pin status in Modal
    if (modalPinBtn) {
        modalPinBtn.addEventListener("click", () => {
            modalIsPinned = !modalIsPinned;
            updateModalPinBtnState();
        });
    }

    // Delete Note event
    if (modalDeleteBtn) {
        modalDeleteBtn.addEventListener("click", async () => {
            if (!currentlyEditingNoteId) return;

            const confirmDelete = confirm("Are you sure you want to delete this note?");
            if (!confirmDelete) return;

            const { error } = await window.supabaseClient
                .from("notes")
                .delete()
                .eq("id", currentlyEditingNoteId);

            if (error) {
                alert("Error deleting note: " + error.message);
                return;
            }

            closeModal();
            await fetchAndRenderNotes();
        });
    }
}

// Open modal and populate fields
function openEditModal(note) {
    currentlyEditingNoteId = note.id;
    modalIsPinned = note.is_pinned;

    document.getElementById("modal-title").value = note.title || "";
    document.getElementById("modal-content").value = note.content || "";

    updateModalPinBtnState();

    // Show AI summary if available (prepping for Step 19)
    const aiSection = document.getElementById("modal-ai-section");
    const aiText = document.getElementById("ai-summary-text");
    if (note.summary) {
        aiText.textContent = note.summary;
        aiSection.classList.remove("hidden");
    } else {
        aiSection.classList.add("hidden");
        aiText.textContent = "";
    }

    document.getElementById("edit-modal").classList.remove("hidden");
}

// Save changes to Supabase and close modal
async function saveAndCloseModal() {
    if (!currentlyEditingNoteId) {
        closeModal();
        return;
    }

    const title = document.getElementById("modal-title").value.trim();
    const content = document.getElementById("modal-content").value.trim();

    // Send Update request to Supabase
    const { error } = await window.supabaseClient
        .from("notes")
        .update({
            title: title,
            content: content,
            is_pinned: modalIsPinned,
            updated_at: new Date().toISOString()
        })
        .eq("id", currentlyEditingNoteId);

    if (error) {
        alert("Error updating note: " + error.message);
        return;
    }

    closeModal();
    await fetchAndRenderNotes();
}

function closeModal() {
    currentlyEditingNoteId = null;
    document.getElementById("edit-modal").classList.add("hidden");
}

function updateModalPinBtnState() {
    const modalPinBtn = document.getElementById("modal-pin-btn");
    if (!modalPinBtn) return;

    if (modalIsPinned) {
        modalPinBtn.classList.remove("btn-primary");
        modalPinBtn.classList.add("btn-secondary");
        modalPinBtn.textContent = "Pinned";
    } else {
        modalPinBtn.classList.remove("btn-secondary");
        modalPinBtn.classList.add("btn-primary");
        modalPinBtn.textContent = "Pin";
    }
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
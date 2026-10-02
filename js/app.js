/* =========================
   DOM ELEMENTS
========================= */

const authPage = document.getElementById("authPage");
const notesPage = document.getElementById("notesPage");

const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");

const authSwitchText = document.getElementById("authSwitchText");
const authSwitchButton = document.getElementById("authSwitchButton");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const logoutButton = document.getElementById("logoutButton");
const homeButton = document.getElementById("homeButton");

const searchInput = document.getElementById("searchInput");
const addNoteButton = document.getElementById("addNoteButton");
const emptyStateCreateButton = document.getElementById("emptyStateCreateButton");

const noteCount = document.getElementById("noteCount");

const emptyState = document.getElementById("emptyState");
const emptyStateTitle = document.getElementById("emptyStateTitle");
const emptyStateDescription = document.getElementById("emptyStateDescription");

const pinnedSection = document.getElementById("pinnedSection");
const pinnedGrid = document.getElementById("pinnedGrid");
const pinnedCount = document.getElementById("pinnedCount");

const otherNotesSection = document.getElementById("otherNotesSection");
const otherNotesHeading = document.getElementById("otherNotesHeading");
const otherNotesCount = document.getElementById("otherNotesCount");
const notesGrid = document.getElementById("notesGrid");


/* =========================
   EDITOR ELEMENTS
========================= */

const editorOverlay = document.getElementById("editorOverlay");
const closeEditorButton = document.getElementById("closeEditorButton");
const editorStatus = document.getElementById("editorStatus");

const editorPinButton = document.getElementById("editorPinButton");
const editorTitleInput = document.getElementById("editorTitleInput");
const editorContentInput = document.getElementById("editorContentInput");

const editorDeleteButton = document.getElementById("editorDeleteButton");
const editorDoneButton = document.getElementById("editorDoneButton");


/* =========================
   AI ELEMENTS
========================= */

const summarizeButton =
    document.getElementById("summarizeButton");

const aiSummaryResult =
    document.getElementById("aiSummaryResult");

const aiSummaryText =
    document.getElementById("aiSummaryText");

const aiSummaryMessage =
    document.getElementById("aiSummaryMessage");

const aiCopyButton =
    document.getElementById("aiCopyButton");

const aiUseButton =
    document.getElementById("aiUseButton");


/* =========================
   APPLICATION STATE
========================= */

let isSignUpMode = false;

let notes = [];
let currentNote = null;

let saveTimer = null;
let savePromise = null;

let isEditorDirty = false;
let editRevision = 0;

let isCreatingNote = false;
let isDeletingNote = false;
let isClosingEditor = false;

let isSummarizing = false;


/* =========================
   AUTHENTICATION MODE
========================= */

authSwitchButton.addEventListener("click", () => {

    isSignUpMode = !isSignUpMode;

    clearAuthMessage();

    if (isSignUpMode) {

        authTitle.textContent = "Create your account";

        authSubtitle.textContent =
            "Create an account to start keeping your notes.";

        authSwitchText.textContent =
            "Already have an account?";

        authSwitchButton.textContent = "Sign in";

    } else {

        authTitle.textContent =
            "Your notes, understood by AI";

        authSubtitle.textContent =
            "Sign in to access your notes.";

        authSwitchText.textContent =
            "Don't have an account?";

        authSwitchButton.textContent = "Sign up";
    }

    authForm.querySelector(".primary-button").textContent =
        isSignUpMode ? "Sign up" : "Sign in";

    passwordInput.value = "";
});


/* =========================
   AUTHENTICATION MESSAGES
========================= */

function showAuthMessage(message, type = "error") {

    const messageElement = document.getElementById("authMessage");

    messageElement.textContent = message;
    messageElement.className = `auth-message ${type}`;
}


function clearAuthMessage() {

    const messageElement = document.getElementById("authMessage");

    messageElement.textContent = "";
    messageElement.className = "auth-message hidden";
}


/* =========================
   AUTHENTICATION LOADING
========================= */

function setAuthLoading(isLoading) {

    const button = authForm.querySelector(".primary-button");

    button.disabled = isLoading;

    if (isLoading) {

        button.textContent = isSignUpMode
            ? "Creating account..."
            : "Signing in...";

    } else {

        button.textContent = isSignUpMode
            ? "Sign up"
            : "Sign in";
    }
}


/* =========================
   AUTHENTICATION FORM
========================= */

authForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearAuthMessage();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {

        showAuthMessage(
            "Please enter your email and password."
        );

        return;
    }

    setAuthLoading(true);

    try {

        if (isSignUpMode) {

            const { data, error } =
                await supabaseClient.auth.signUp({
                    email,
                    password
                });

            if (error) {
                throw error;
            }

            if (data.session) {

                await showNotesPage();

            } else {

                showAuthMessage(
                    "Account created. Please check your email to confirm your account.",
                    "success"
                );

                passwordInput.value = "";
            }

            return;
        }

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            throw error;
        }

        if (data.session) {
            await showNotesPage();
        }

    } catch (error) {

        console.error("Authentication error:", error);

        showAuthMessage(getFriendlyAuthError(error));

    } finally {

        setAuthLoading(false);
    }
});


/* =========================
   FRIENDLY AUTH ERRORS
========================= */

function getFriendlyAuthError(error) {

    const message = error?.message?.toLowerCase() || "";

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

async function showNotesPage() {

    closeEditorImmediately();

    authPage.classList.add("hidden");
    notesPage.classList.remove("hidden");

    await loadNotes();
}


/* =========================
   SHOW AUTH PAGE
========================= */

function showAuthPage() {

    closeEditorImmediately();

    notesPage.classList.add("hidden");
    authPage.classList.remove("hidden");
}


/* =========================
   LOAD NOTES
========================= */

async function loadNotes() {

    notesGrid.innerHTML = `
        <p class="notes-status">Loading your notes...</p>
    `;

    pinnedGrid.innerHTML = "";

    try {

        const { data, error } = await supabaseClient
            .from("notes")
            .select("*")
            .order("is_pinned", { ascending: false })
            .order("updated_at", { ascending: false });

        if (error) {
            throw error;
        }

        notes = data || [];

        sortNotes();
        renderNotes();

    } catch (error) {

        console.error("Load notes error:", error);

        pinnedSection.classList.add("hidden");
        otherNotesSection.classList.remove("hidden");
        emptyState.classList.add("hidden");

        notesGrid.innerHTML = `
            <p class="notes-status error">
                Unable to load your notes. Please refresh and try again.
            </p>
        `;
    }
}


/* =========================
   SORT NOTES
========================= */

function sortNotes() {

    notes.sort((a, b) => {

        if (a.is_pinned !== b.is_pinned) {
            return a.is_pinned ? -1 : 1;
        }

        return new Date(b.updated_at || 0)
            - new Date(a.updated_at || 0);
    });
}


/* =========================
   FILTER NOTES
========================= */

function getFilteredNotes() {

    const searchTerm = searchInput.value
        .trim()
        .toLowerCase();

    if (!searchTerm) {
        return notes;
    }

    return notes.filter((note) => {

        const title = note.title?.toLowerCase() || "";
        const content = note.content?.toLowerCase() || "";

        return (
            title.includes(searchTerm) ||
            content.includes(searchTerm)
        );
    });
}


/* =========================
   RENDER NOTES
========================= */

function renderNotes() {

    const filteredNotes = getFilteredNotes();

    const pinnedNotes = filteredNotes.filter(
        (note) => note.is_pinned
    );

    const otherNotes = filteredNotes.filter(
        (note) => !note.is_pinned
    );

    const searchTerm = searchInput.value.trim();

    noteCount.textContent = searchTerm
        ? `${filteredNotes.length} result${filteredNotes.length === 1 ? "" : "s"}`
        : `${notes.length} note${notes.length === 1 ? "" : "s"}`;

    pinnedCount.textContent = pinnedNotes.length;
    otherNotesCount.textContent = otherNotes.length;

    pinnedGrid.innerHTML = "";
    notesGrid.innerHTML = "";

    if (filteredNotes.length === 0) {

        pinnedSection.classList.add("hidden");
        otherNotesSection.classList.add("hidden");

        emptyState.classList.remove("hidden");

        if (searchTerm) {

            emptyStateTitle.textContent = "No matching notes";

            emptyStateDescription.textContent =
                "Try a different search term or clear your search.";

            emptyStateCreateButton.classList.add("hidden");

        } else {

            emptyStateTitle.textContent = "Your space for ideas";

            emptyStateDescription.textContent =
                "Create your first note and keep your thoughts in one place.";

            emptyStateCreateButton.classList.remove("hidden");
        }

        return;
    }

    emptyState.classList.add("hidden");

    if (pinnedNotes.length > 0) {

        pinnedSection.classList.remove("hidden");

        pinnedNotes.forEach((note) => {
            pinnedGrid.appendChild(createNoteCard(note));
        });

    } else {

        pinnedSection.classList.add("hidden");
    }

    if (otherNotes.length > 0) {

        otherNotesSection.classList.remove("hidden");

        otherNotesHeading.textContent =
            searchTerm ? "Other matching notes" : "Others";

        otherNotes.forEach((note) => {
            notesGrid.appendChild(createNoteCard(note));
        });

    } else {

        otherNotesSection.classList.add("hidden");
    }
}


/* =========================
   CREATE NOTE CARD
========================= */

function createNoteCard(note) {

    const card = document.createElement("article");

    card.className = "note-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    card.setAttribute(
        "aria-label",
        `Open note: ${note.title || "Untitled note"}`
    );

    if (note.is_pinned) {
        card.classList.add("pinned");
    }

    const header = document.createElement("div");
    header.className = "note-card-header";

    const title = document.createElement("h3");
    title.textContent = note.title || "Untitled note";

    header.appendChild(title);

    if (note.is_pinned) {

        const pinIndicator = document.createElement("span");

        pinIndicator.className = "note-pin-indicator";
        pinIndicator.textContent = "Pinned";

        header.appendChild(pinIndicator);
    }

    const content = document.createElement("p");

    content.textContent = note.content || "No content yet.";

    const footer = document.createElement("div");
    footer.className = "note-card-footer";

    const timestamp = document.createElement("time");

    timestamp.className = "note-timestamp";
    timestamp.dateTime = note.updated_at || "";

    timestamp.textContent = formatUpdatedAt(note.updated_at);

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const pinButton = document.createElement("button");

    pinButton.type = "button";
    pinButton.className = "note-action-button";
    pinButton.textContent = note.is_pinned ? "Unpin" : "Pin";

    pinButton.addEventListener("click", async (event) => {

        event.stopPropagation();

        pinButton.disabled = true;

        await togglePin(note);

        pinButton.disabled = false;
    });

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "note-action-button delete";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", async (event) => {

        event.stopPropagation();

        deleteButton.disabled = true;

        await deleteNote(note.id);

        deleteButton.disabled = false;
    });

    actions.appendChild(pinButton);
    actions.appendChild(deleteButton);

    footer.appendChild(timestamp);
    footer.appendChild(actions);

    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(footer);

    card.addEventListener("click", () => {
        openNoteEditor(note);
    });

    card.addEventListener("keydown", (event) => {

        if (
            event.target === card &&
            (event.key === "Enter" || event.key === " ")
        ) {

            event.preventDefault();

            openNoteEditor(note);
        }
    });

    return card;
}


/* =========================
   FORMAT TIMESTAMP
========================= */

function formatUpdatedAt(timestamp) {

    if (!timestamp) {
        return "Date unavailable";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    const now = new Date();

    const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

    const yesterday = new Date(now);

    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        date.getFullYear() === yesterday.getFullYear() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate();

    const timeText = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit"
    }).format(date);

    if (isToday) {
        return `Updated today at ${timeText}`;
    }

    if (isYesterday) {
        return `Updated yesterday at ${timeText}`;
    }

    const dateText = new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: date.getFullYear() === now.getFullYear()
            ? undefined
            : "numeric"
    }).format(date);

    return `Updated ${dateText}`;
}


/* =========================
   CREATE NOTE
========================= */

addNoteButton.addEventListener("click", createEmptyNote);

emptyStateCreateButton.addEventListener("click", createEmptyNote);


async function createEmptyNote() {

    if (isCreatingNote) {
        return;
    }

    isCreatingNote = true;
    addNoteButton.disabled = true;
    emptyStateCreateButton.disabled = true;

    try {

        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) {

            showAuthPage();

            return;
        }

        const { data, error } = await supabaseClient
            .from("notes")
            .insert({
                user_id: user.id,
                title: "",
                content: "",
                is_pinned: false
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        notes.unshift(data);

        sortNotes();
        renderNotes();

        openNoteEditor(data);

    } catch (error) {

        console.error("Create note error:", error);

        emptyStateTitle.textContent = "Couldn't create your note";

        emptyStateDescription.textContent =
            "Please try again. If the problem continues, check your connection.";

        emptyState.classList.remove("hidden");

    } finally {

        isCreatingNote = false;
        addNoteButton.disabled = false;
        emptyStateCreateButton.disabled = false;
    }
}


/* =========================
   OPEN NOTE EDITOR
========================= */

function openNoteEditor(note) {

    clearTimeout(saveTimer);

    currentNote = { ...note };

    isEditorDirty = false;
    editRevision = 0;

    editorTitleInput.value = note.title || "";
    editorContentInput.value = note.content || "";

    clearAISummary();

    updateEditorPinButton();

    setEditorStatus("Saved");

    editorOverlay.classList.remove("hidden");

    document.body.style.overflow = "hidden";

    editorTitleInput.focus();
}


/* =========================
   EDITOR INPUT
========================= */

editorTitleInput.addEventListener("input", handleEditorInput);

editorContentInput.addEventListener("input", handleEditorInput);


function handleEditorInput() {

    if (!currentNote) {
        return;
    }

    currentNote.title = editorTitleInput.value;
    currentNote.content = editorContentInput.value;

    editRevision += 1;
    isEditorDirty = true;

    clearAISummary();

    setEditorStatus("Unsaved changes");

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        saveCurrentNote();
    }, 700);
}


/* =========================
   SAVE CURRENT NOTE
========================= */

async function saveCurrentNote() {

    clearTimeout(saveTimer);

    if (!currentNote) {
        return true;
    }

    if (!isEditorDirty) {
        return true;
    }

    if (savePromise) {

        await savePromise;

        if (currentNote && isEditorDirty) {
            return saveCurrentNote();
        }

        return !isEditorDirty;
    }

    savePromise = (async () => {

        let succeeded = true;

        while (currentNote && isEditorDirty) {

            const noteId = currentNote.id;
            const revisionBeingSaved = editRevision;

            const title = editorTitleInput.value.trim();
            const content = editorContentInput.value;

            setEditorStatus("Saving...");

            try {

                const { data, error } = await supabaseClient
                    .from("notes")
                    .update({
                        title: title || "Untitled note",
                        content,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", noteId)
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                if (!currentNote || currentNote.id !== noteId) {
                    break;
                }

                currentNote = data;

                notes = notes.map((note) =>
                    note.id === data.id ? data : note
                );

                sortNotes();

                if (editRevision === revisionBeingSaved) {

                    isEditorDirty = false;

                    setEditorStatus("Saved");

                } else {

                    isEditorDirty = true;

                    setEditorStatus("Saving latest changes...");
                }

            } catch (error) {

                console.error("Save note error:", error);

                setEditorStatus("Unable to save. Try again.");

                succeeded = false;

                break;
            }
        }

        return succeeded && !isEditorDirty;

    })();

    let result = false;

    try {

        result = await savePromise;

    } finally {

        savePromise = null;
    }

    if (result) {
        return true;
    }

    return false;
}


/* =========================
   EDITOR STATUS
========================= */

function setEditorStatus(message) {
    editorStatus.textContent = message;
}


/* =========================
   AI SUMMARY
========================= */

function clearAISummary() {

    aiSummaryResult.classList.add("hidden");

    aiSummaryText.textContent = "";

    aiSummaryMessage.classList.add("hidden");

    aiSummaryMessage.textContent = "";

    summarizeButton.disabled = false;

    summarizeButton.textContent = "Summarize with AI";

    aiCopyButton.textContent = "Copy summary";

    aiUseButton.disabled = false;

    isSummarizing = false;
}


function showAISummaryMessage(message) {

    aiSummaryMessage.textContent = message;

    aiSummaryMessage.classList.remove("hidden");
}


async function summarizeCurrentNote() {

    if (!currentNote || isSummarizing) {
        return;
    }

    const title = editorTitleInput.value.trim();
    const content = editorContentInput.value.trim();

    if (!content) {

        showAISummaryMessage(
            "Add some text to your note before summarizing it."
        );

        return;
    }

    isSummarizing = true;

    summarizeButton.disabled = true;
    summarizeButton.textContent = "Summarizing...";

    aiSummaryResult.classList.add("hidden");
    aiSummaryText.textContent = "";
    aiSummaryMessage.classList.add("hidden");

    try {

        const { data, error } =
            await supabaseClient.functions.invoke(
                "summarize-note",
                {
                    body: {
                        title,
                        content
                    }
                }
            );

        if (error) {
            throw error;
        }

        if (!data?.summary) {

            throw new Error(
                "The AI did not return a summary."
            );
        }

        aiSummaryText.textContent = data.summary;

        aiSummaryResult.classList.remove("hidden");

        summarizeButton.textContent = "Summarize again";

    } catch (error) {

        console.error(
            "AI summarization error:",
            error
        );

        showAISummaryMessage(
            "Unable to summarize this note right now. Please try again."
        );

        summarizeButton.textContent = "Try again";

    } finally {

        isSummarizing = false;
        summarizeButton.disabled = false;
    }
}


/* =========================
   COPY AI SUMMARY
========================= */

async function copyAISummary() {

    const summary =
        aiSummaryText.textContent.trim();

    if (!summary) {
        return;
    }

    try {

        await navigator.clipboard.writeText(summary);

        aiCopyButton.textContent = "Copied!";

        setTimeout(() => {

            aiCopyButton.textContent = "Copy summary";

        }, 1500);

    } catch (error) {

        console.error(
            "Copy summary error:",
            error
        );

        showAISummaryMessage(
            "Unable to copy the summary. Please try again."
        );
    }
}


/* =========================
   USE AI SUMMARY IN NOTE
========================= */

function useAISummaryInNote() {

    if (!currentNote) {
        return;
    }

    const summary =
        aiSummaryText.textContent.trim();

    if (!summary) {
        return;
    }

    editorContentInput.value = summary;

    currentNote.content = summary;

    editRevision += 1;
    isEditorDirty = true;

    clearAISummary();

    setEditorStatus("Unsaved changes");

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        saveCurrentNote();
    }, 700);

    editorContentInput.focus();
}


/* =========================
   AI EVENT LISTENERS
========================= */

summarizeButton.addEventListener(
    "click",
    summarizeCurrentNote
);

aiCopyButton.addEventListener(
    "click",
    copyAISummary
);

aiUseButton.addEventListener(
    "click",
    useAISummaryInNote
);


/* =========================
   CLOSE EDITOR
========================= */

closeEditorButton.addEventListener("click", closeEditor);

editorDoneButton.addEventListener("click", closeEditor);


async function closeEditor() {

    if (!currentNote || isClosingEditor) {
        return;
    }

    isClosingEditor = true;

    clearTimeout(saveTimer);

    if (isEditorDirty) {

        const saved = await saveCurrentNote();

        if (!saved) {

            isClosingEditor = false;

            return;
        }
    }

    if (savePromise) {
        await savePromise;
    }

    currentNote = null;

    isEditorDirty = false;

    editorOverlay.classList.add("hidden");

    document.body.style.overflow = "";

    renderNotes();

    isClosingEditor = false;
}


function closeEditorImmediately() {

    clearTimeout(saveTimer);

    currentNote = null;

    isEditorDirty = false;

    editorOverlay.classList.add("hidden");

    document.body.style.overflow = "";

    isClosingEditor = false;

    clearAISummary();
}


/* =========================
   PIN CURRENT NOTE
========================= */

editorPinButton.addEventListener("click", toggleCurrentNotePin);


async function toggleCurrentNotePin() {

    if (!currentNote) {
        return;
    }

    if (isEditorDirty) {

        const saved = await saveCurrentNote();

        if (!saved) {
            return;
        }
    }

    const newPinnedState = !currentNote.is_pinned;

    editorPinButton.disabled = true;

    try {

        const { data, error } = await supabaseClient
            .from("notes")
            .update({
                is_pinned: newPinnedState,
                updated_at: new Date().toISOString()
            })
            .eq("id", currentNote.id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        currentNote = data;

        notes = notes.map((note) =>
            note.id === data.id ? data : note
        );

        sortNotes();

        updateEditorPinButton();
        renderNotes();

    } catch (error) {

        console.error("Pin update error:", error);

        setEditorStatus("Unable to update pin.");

    } finally {

        editorPinButton.disabled = false;
    }
}


/* =========================
   UPDATE EDITOR PIN BUTTON
========================= */

function updateEditorPinButton() {

    if (!currentNote) {
        return;
    }

    if (currentNote.is_pinned) {

        editorPinButton.textContent = "Pinned";

        editorPinButton.classList.add("active");

    } else {

        editorPinButton.textContent = "Pin";

        editorPinButton.classList.remove("active");
    }
}


/* =========================
   PIN NOTE FROM CARD
========================= */

async function togglePin(note) {

    try {

        const { data, error } = await supabaseClient
            .from("notes")
            .update({
                is_pinned: !note.is_pinned,
                updated_at: new Date().toISOString()
            })
            .eq("id", note.id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        notes = notes.map((item) =>
            item.id === note.id ? data : item
        );

        sortNotes();
        renderNotes();

    } catch (error) {

        console.error("Pin update error:", error);
    }
}


/* =========================
   DELETE CURRENT NOTE
========================= */

editorDeleteButton.addEventListener("click", async () => {

    if (!currentNote || isDeletingNote) {
        return;
    }

    isDeletingNote = true;
    editorDeleteButton.disabled = true;

    clearTimeout(saveTimer);

    if (isEditorDirty) {

        const saved = await saveCurrentNote();

        if (!saved) {

            isDeletingNote = false;
            editorDeleteButton.disabled = false;

            return;
        }
    }

    const noteId = currentNote.id;

    const deleted = await deleteNote(noteId, true);

    isDeletingNote = false;
    editorDeleteButton.disabled = false;

    if (!deleted) {
        setEditorStatus("Unable to delete note.");
    }
});


/* =========================
   DELETE NOTE
========================= */

async function deleteNote(
    noteId,
    closeEditorAfterDelete = false
) {

    try {

        const { error } = await supabaseClient
            .from("notes")
            .delete()
            .eq("id", noteId);

        if (error) {
            throw error;
        }

        notes = notes.filter((note) => note.id !== noteId);

        if (
            closeEditorAfterDelete &&
            currentNote &&
            currentNote.id === noteId
        ) {

            closeEditorImmediately();
        }

        sortNotes();
        renderNotes();

        return true;

    } catch (error) {

        console.error("Delete note error:", error);

        return false;
    }
}


/* =========================
   SEARCH NOTES
========================= */

searchInput.addEventListener("input", renderNotes);


/* =========================
   HOME BUTTON
========================= */

homeButton.addEventListener("click", (event) => {

    event.preventDefault();

    searchInput.value = "";

    renderNotes();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


/* =========================
   LOGOUT
========================= */

logoutButton.addEventListener("click", async () => {

    clearTimeout(saveTimer);

    if (isEditorDirty) {

        const saved = await saveCurrentNote();

        if (!saved) {
            return;
        }
    }

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {

        console.error("Logout error:", error);

        return;
    }

    notes = [];

    searchInput.value = "";

    authForm.reset();

    isSignUpMode = false;

    authTitle.textContent =
        "Your notes, understood by AI";

    authSubtitle.textContent =
        "Sign in to access your notes.";

    authSwitchText.textContent =
        "Don't have an account?";

    authSwitchButton.textContent = "Sign up";

    authForm.querySelector(".primary-button").textContent =
        "Sign in";

    clearAuthMessage();

    renderNotes();

    showAuthPage();
});


/* =========================
   ESCAPE KEY
========================= */

document.addEventListener("keydown", (event) => {

    if (
        event.key === "Escape" &&
        !editorOverlay.classList.contains("hidden")
    ) {
        closeEditor();
    }
});


/* =========================
   AUTH STATE LISTENER
========================= */

supabaseClient.auth.onAuthStateChange((event) => {

    if (event === "SIGNED_OUT") {

        notes = [];

        searchInput.value = "";

        showAuthPage();
    }
});


/* =========================
   CHECK SESSION
========================= */

async function checkSession() {

    try {

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        if (data.session) {

            await showNotesPage();

        } else {

            showAuthPage();
        }

    } catch (error) {

        console.error("Session check error:", error);

        showAuthPage();
    }
}


/* =========================
   INITIALIZE APPLICATION
========================= */

checkSession();
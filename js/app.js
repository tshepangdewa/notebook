// =========================
// DOM ELEMENTS
// =========================

const authPage =
    document.getElementById("authPage");

const notesPage =
    document.getElementById("notesPage");

const authForm =
    document.getElementById("authForm");

const authTitle =
    document.getElementById("authTitle");

const authSubtitle =
    document.getElementById("authSubtitle");

const authSwitchText =
    document.getElementById("authSwitchText");

const authSwitchButton =
    document.getElementById("authSwitchButton");

const authMessage =
    document.getElementById("authMessage");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const homeButton =
    document.getElementById("homeButton");

const logoutButton =
    document.getElementById("logoutButton");

const noteCount =
    document.getElementById("noteCount");

const searchInput =
    document.getElementById("searchInput");

const sortSelect =
    document.getElementById("sortSelect");

const emptyState =
    document.getElementById("emptyState");

const emptyStateTitle =
    document.getElementById("emptyStateTitle");

const emptyStateDescription =
    document.getElementById("emptyStateDescription");

const emptyStateCreateButton =
    document.getElementById("emptyStateCreateButton");

const pinnedSection =
    document.getElementById("pinnedSection");

const pinnedCount =
    document.getElementById("pinnedCount");

const pinnedGrid =
    document.getElementById("pinnedGrid");

const otherNotesSection =
    document.getElementById("otherNotesSection");

const otherNotesHeading =
    document.getElementById("otherNotesHeading");

const otherNotesCount =
    document.getElementById("otherNotesCount");

const notesGrid =
    document.getElementById("notesGrid");

const addNoteButton =
    document.getElementById("addNoteButton");

const editorOverlay =
    document.getElementById("editorOverlay");

const closeEditorButton =
    document.getElementById("closeEditorButton");

const editorStatus =
    document.getElementById("editorStatus");

const editorPinButton =
    document.getElementById("editorPinButton");

const editorTitleInput =
    document.getElementById("editorTitleInput");

const editorContentInput =
    document.getElementById("editorContentInput");

const editorCount =
    document.getElementById("editorCount");

const editorDeleteButton =
    document.getElementById("editorDeleteButton");

const editorDoneButton =
    document.getElementById("editorDoneButton");

const summarizeButton =
    document.getElementById("summarizeButton");

const aiSummaryResult =
    document.getElementById("aiSummaryResult");

const aiSummaryText =
    document.getElementById("aiSummaryText");

const aiCopyButton =
    document.getElementById("aiCopyButton");

const aiUseButton =
    document.getElementById("aiUseButton");

const aiSummaryMessage =
    document.getElementById("aiSummaryMessage");


// =========================
// APPLICATION STATE
// =========================

let currentUser = null;

let notes = [];

let currentNote = null;

let isSignUpMode = false;

let saveTimeout = null;

let isSaving = false;

let pendingSave = false;

let currentAISummary = "";


// =========================
// INITIALIZATION
// =========================

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);

async function initializeApp() {

    setupEventListeners();

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();

    if (session?.user) {

        currentUser =
            session.user;

        showNotesPage();

        await loadNotes();

    } else {

        showAuthPage();
    }

    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            if (session?.user) {

                currentUser =
                    session.user;

                showNotesPage();

                if (
                    event === "SIGNED_IN" ||
                    event === "INITIAL_SESSION"
                ) {
                    await loadNotes();
                }

            } else {

                currentUser = null;

                notes = [];

                currentNote = null;

                showAuthPage();
            }
        }
    );
}


// =========================
// EVENT LISTENERS
// =========================

function setupEventListeners() {

    authForm.addEventListener(
        "submit",
        handleAuthSubmit
    );

    authSwitchButton.addEventListener(
        "click",
        toggleAuthMode
    );

    logoutButton.addEventListener(
        "click",
        handleLogout
    );

    homeButton.addEventListener(
        "click",
        handleHomeClick
    );

    searchInput.addEventListener(
        "input",
        renderNotes
    );

    sortSelect.addEventListener(
        "change",
        renderNotes
    );

    addNoteButton.addEventListener(
        "click",
        createNote
    );

    emptyStateCreateButton.addEventListener(
        "click",
        createNote
    );

    closeEditorButton.addEventListener(
        "click",
        closeNoteEditor
    );

    editorDoneButton.addEventListener(
        "click",
        closeNoteEditor
    );

    editorDeleteButton.addEventListener(
        "click",
        deleteCurrentNote
    );

    editorPinButton.addEventListener(
        "click",
        toggleCurrentNotePin
    );

    editorTitleInput.addEventListener(
        "input",
        handleEditorInput
    );

    editorContentInput.addEventListener(
        "input",
        handleEditorInput
    );

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

    editorOverlay.addEventListener(
        "click",
        handleOverlayClick
    );

    document.addEventListener(
        "keydown",
        handleKeyboardShortcuts
    );
}


// =========================
// AUTHENTICATION
// =========================

function toggleAuthMode() {

    isSignUpMode =
        !isSignUpMode;

    clearAuthMessage();

    passwordInput.value = "";

    if (isSignUpMode) {

        authTitle.textContent =
            "Create your Notebook";

        authSubtitle.textContent =
            "Sign up to start organizing your thoughts.";

        authSwitchText.textContent =
            "Already have an account?";

        authSwitchButton.textContent =
            "Sign in";

    } else {

        authTitle.textContent =
            "Your notes, understood by AI";

        authSubtitle.textContent =
            "Sign in to access your notes.";

        authSwitchText.textContent =
            "Don't have an account?";

        authSwitchButton.textContent =
            "Sign up";
    }
}


async function handleAuthSubmit(event) {

    event.preventDefault();

    clearAuthMessage();

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    if (!email || !password) {
        return;
    }

    const submitButton =
        authForm.querySelector(
            'button[type="submit"]'
        );

    const originalText =
        submitButton.textContent;

    submitButton.disabled = true;

    submitButton.textContent =
        isSignUpMode
            ? "Creating account..."
            : "Signing in...";

    try {

        if (isSignUpMode) {

            const {
                data,
                error
            } =
                await supabaseClient.auth.signUp({
                    email,
                    password
                });

            if (error) {
                throw error;
            }

            if (
                data.user &&
                !data.session
            ) {

                showAuthMessage(
                    "Account created. Check your email to confirm your account.",
                    false
                );

            } else {

                showAuthMessage(
                    "Account created successfully.",
                    false
                );
            }

        } else {

            const {
                error
            } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) {
                throw error;
            }
        }

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        showAuthMessage(
            error.message ||
            "Unable to complete authentication.",
            true
        );

    } finally {

        submitButton.disabled = false;

        submitButton.textContent =
            originalText;
    }
}


async function handleLogout() {

    try {

        const {
            error
        } =
            await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            error.message ||
            "Unable to log out."
        );
    }
}


// =========================
// PAGE VISIBILITY
// =========================

function showAuthPage() {

    authPage.classList.remove("hidden");

    notesPage.classList.add("hidden");

    closeNoteEditor();

    emailInput.focus();
}


function showNotesPage() {

    authPage.classList.add("hidden");

    notesPage.classList.remove("hidden");
}


function handleHomeClick(event) {

    event.preventDefault();

    closeNoteEditor();

    searchInput.value = "";

    renderNotes();
}


// =========================
// AUTH MESSAGES
// =========================

function showAuthMessage(
    message,
    isError = false
) {

    authMessage.textContent =
        message;

    authMessage.classList.remove(
        "hidden"
    );

    authMessage.classList.toggle(
        "error",
        isError
    );
}


function clearAuthMessage() {

    authMessage.textContent = "";

    authMessage.classList.add(
        "hidden"
    );

    authMessage.classList.remove(
        "error"
    );
}


// =========================
// LOAD NOTES
// =========================

async function loadNotes() {

    if (!currentUser) {
        return;
    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("notes")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "updated_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        notes =
            data || [];

        renderNotes();

    } catch (error) {

        console.error(
            "Load notes error:",
            error
        );

        alert(
            "Unable to load your notes."
        );
    }
}


// =========================
// SORTING
// =========================

function sortNotes(noteList) {

    const sortedNotes =
        [...noteList];

    const sortMode =
        sortSelect.value;

    sortedNotes.sort(
        (a, b) => {

            if (
                sortMode ===
                "title-asc"
            ) {

                return compareTitles(
                    a,
                    b
                );
            }

            if (
                sortMode ===
                "title-desc"
            ) {

                return compareTitles(
                    b,
                    a
                );
            }

            const dateDifference =
                new Date(b.updated_at) -
                new Date(a.updated_at);

            if (
                sortMode ===
                "updated-asc"
            ) {

                return -dateDifference;
            }

            return dateDifference;
        }
    );

    return sortedNotes;
}


function compareTitles(
    firstNote,
    secondNote
) {

    const firstTitle =
        (
            firstNote.title ||
            "Untitled note"
        )
            .trim()
            .toLowerCase();

    const secondTitle =
        (
            secondNote.title ||
            "Untitled note"
        )
            .trim()
            .toLowerCase();

    return firstTitle.localeCompare(
        secondTitle
    );
}


// =========================
// SEARCH
// =========================

function getFilteredNotes() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();

    if (!searchTerm) {

        return [
            ...notes
        ];
    }

    return notes.filter(
        note => {

            const title =
                note.title ||
                "";

            const content =
                note.content ||
                "";

            return (
                title
                    .toLowerCase()
                    .includes(searchTerm) ||
                content
                    .toLowerCase()
                    .includes(searchTerm)
            );
        }
    );
}


// =========================
// RENDER NOTES
// =========================

function renderNotes() {

    const filteredNotes =
        getFilteredNotes();

    const sortedNotes =
        sortNotes(
            filteredNotes
        );

    const pinnedNotes =
        sortedNotes.filter(
            note => note.is_pinned
        );

    const otherNotes =
        sortedNotes.filter(
            note => !note.is_pinned
        );

    updateNoteCount(
        filteredNotes.length
    );

    pinnedGrid.innerHTML = "";

    notesGrid.innerHTML = "";

    pinnedCount.textContent =
        pinnedNotes.length;

    otherNotesCount.textContent =
        otherNotes.length;

    if (
        notes.length === 0
    ) {

        showGlobalEmptyState();

        pinnedSection.classList.add(
            "hidden"
        );

        otherNotesSection.classList.add(
            "hidden"
        );

        return;
    }

    if (
        filteredNotes.length === 0
    ) {

        showSearchEmptyState();

        pinnedSection.classList.add(
            "hidden"
        );

        otherNotesSection.classList.add(
            "hidden"
        );

        return;
    }

    emptyState.classList.add(
        "hidden"
    );

    if (
        pinnedNotes.length > 0
    ) {

        pinnedSection.classList.remove(
            "hidden"
        );

        pinnedNotes.forEach(
            note => {

                pinnedGrid.appendChild(
                    createNoteCard(note)
                );
            }
        );

    } else {

        pinnedSection.classList.add(
            "hidden"
        );
    }

    if (
        otherNotes.length > 0
    ) {

        otherNotesSection.classList.remove(
            "hidden"
        );

        otherNotesHeading.textContent =
            "Others";

        otherNotes.forEach(
            note => {

                notesGrid.appendChild(
                    createNoteCard(note)
                );
            }
        );

    } else {

        otherNotesSection.classList.add(
            "hidden"
        );
    }
}


function updateNoteCount(
    count
) {

    noteCount.textContent =
        `${count} ${
            count === 1
                ? "note"
                : "notes"
        }`;
}


// =========================
// EMPTY STATES
// =========================

function showGlobalEmptyState() {

    emptyStateTitle.textContent =
        "Your space for ideas";

    emptyStateDescription.textContent =
        "Create your first note and keep your thoughts in one place.";

    emptyStateCreateButton.textContent =
        "Create your first note";

    emptyState.classList.remove(
        "hidden"
    );
}


function showSearchEmptyState() {

    emptyStateTitle.textContent =
        "No notes found";

    emptyStateDescription.textContent =
        "Try a different search term.";

    emptyStateCreateButton.textContent =
        "Create a new note";

    emptyState.classList.remove(
        "hidden"
    );
}


// =========================
// NOTE CARD
// =========================

function createNoteCard(note) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "note-card";

    if (note.is_pinned) {

        card.classList.add(
            "pinned"
        );
    }

    const title =
        document.createElement(
            "h3"
        );

    title.className =
        "note-card-title";

    title.textContent =
        note.title?.trim() ||
        "Untitled note";

    const content =
        document.createElement(
            "p"
        );

    content.className =
        "note-card-content";

    content.textContent =
        note.content?.trim() ||
        "Empty note";

    const footer =
        document.createElement(
            "div"
        );

    footer.className =
        "note-card-footer";

    const date =
        document.createElement(
            "span"
        );

    date.className =
        "note-card-date";

    date.textContent =
        formatNoteDate(
            note.updated_at
        );

    footer.appendChild(
        date
    );

    card.appendChild(
        title
    );

    card.appendChild(
        content
    );

    card.appendChild(
        footer
    );

    card.addEventListener(
        "click",
        () => {

            openNoteEditor(note);
        }
    );

    return card;
}


// =========================
// CREATE NOTE
// =========================

async function createNote() {

    if (!currentUser) {
        return;
    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("notes")
                .insert({
                    user_id:
                        currentUser.id,
                    title: "",
                    content: "",
                    is_pinned: false
                })
                .select()
                .single();

        if (error) {
            throw error;
        }

        notes.unshift(
            data
        );

        renderNotes();

        openNoteEditor(
            data
        );

    } catch (error) {

        console.error(
            "Create note error:",
            error
        );

        alert(
            "Unable to create note."
        );
    }
}


// =========================
// OPEN NOTE EDITOR
// =========================

function openNoteEditor(note) {

    currentNote =
        note;

    editorTitleInput.value =
        note.title || "";

    editorContentInput.value =
        note.content || "";

    editorStatus.textContent =
        "Saved";

    editorPinButton.textContent =
        note.is_pinned
            ? "Unpin"
            : "Pin";

    editorDeleteButton.disabled =
        false;

    clearAISummary();

    updateEditorCount();

    resizeEditor();

    editorOverlay.classList.remove(
        "hidden"
    );

    document.body.classList.add(
        "editor-open"
    );

    setTimeout(
        () => {

            editorTitleInput.focus();

        },
        0
    );
}


// =========================
// CLOSE NOTE EDITOR
// =========================

function closeNoteEditor() {

    if (
        !editorOverlay ||
        editorOverlay.classList.contains(
            "hidden"
        )
    ) {
        return;
    }

    clearTimeout(
        saveTimeout
    );

    if (
        currentNote &&
        hasUnsavedEditorChanges()
    ) {

        saveCurrentNote();
    }

    editorOverlay.classList.add(
        "hidden"
    );

    document.body.classList.remove(
        "editor-open"
    );

    currentNote =
        null;

    currentAISummary =
        "";
}


// =========================
// OVERLAY CLICK
// =========================

function handleOverlayClick(
    event
) {

    if (
        event.target ===
        editorOverlay
    ) {

        closeNoteEditor();
    }
}


// =========================
// EDITOR INPUT
// =========================

function handleEditorInput() {

    updateEditorCount();

    resizeEditor();

    if (!currentNote) {
        return;
    }

    editorStatus.textContent =
        "Saving...";

    clearTimeout(
        saveTimeout
    );

    saveTimeout =
        setTimeout(
            saveCurrentNote,
            700
        );
}


// =========================
// SAVE NOTE
// =========================

async function saveCurrentNote() {

    if (
        !currentNote ||
        !currentUser
    ) {
        return;
    }

    const title =
        editorTitleInput.value.trim();

    const content =
        editorContentInput.value;

    if (isSaving) {

        pendingSave = true;

        return;
    }

    isSaving = true;

    editorStatus.textContent =
        "Saving...";

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("notes")
                .update({
                    title,
                    content,
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    currentNote.id
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .select()
                .single();

        if (error) {
            throw error;
        }

        currentNote =
            data;

        const noteIndex =
            notes.findIndex(
                note =>
                    note.id ===
                    data.id
            );

        if (
            noteIndex !== -1
        ) {

            notes[noteIndex] =
                data;
        }

        editorStatus.textContent =
            "Saved";

        renderNotes();

    } catch (error) {

        console.error(
            "Save note error:",
            error
        );

        editorStatus.textContent =
            "Unable to save";

    } finally {

        isSaving = false;

        if (pendingSave) {

            pendingSave = false;

            saveCurrentNote();
        }
    }
}


// =========================
// CHECK EDITOR CHANGES
// =========================

function hasUnsavedEditorChanges() {

    if (!currentNote) {
        return false;
    }

    return (
        editorTitleInput.value.trim() !==
            (currentNote.title || "").trim() ||
        editorContentInput.value !==
            (currentNote.content || "")
    );
}


// =========================
// PIN CURRENT NOTE
// =========================

async function toggleCurrentNotePin() {

    if (
        !currentNote ||
        !currentUser
    ) {
        return;
    }

    const newPinnedState =
        !currentNote.is_pinned;

    editorPinButton.disabled =
        true;

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("notes")
                .update({
                    is_pinned:
                        newPinnedState,
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    currentNote.id
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .select()
                .single();

        if (error) {
            throw error;
        }

        currentNote =
            data;

        const noteIndex =
            notes.findIndex(
                note =>
                    note.id ===
                    data.id
            );

        if (
            noteIndex !== -1
        ) {

            notes[noteIndex] =
                data;
        }

        editorPinButton.textContent =
            data.is_pinned
                ? "Unpin"
                : "Pin";

        renderNotes();

    } catch (error) {

        console.error(
            "Pin note error:",
            error
        );

        alert(
            "Unable to update pin status."
        );

    } finally {

        editorPinButton.disabled =
            false;
    }
}


// =========================
// DELETE CURRENT NOTE
// =========================

async function deleteCurrentNote() {

    if (
        !currentNote ||
        !currentUser
    ) {
        return;
    }

    const confirmed =
        confirm(
            "Delete this note?"
        );

    if (!confirmed) {
        return;
    }

    const noteId =
        currentNote.id;

    editorDeleteButton.disabled =
        true;

    try {

        const {
            error
        } =
            await supabaseClient
                .from("notes")
                .delete()
                .eq(
                    "id",
                    noteId
                )
                .eq(
                    "user_id",
                    currentUser.id
                );

        if (error) {
            throw error;
        }

        notes =
            notes.filter(
                note =>
                    note.id !==
                    noteId
            );

        currentNote =
            null;

        clearTimeout(
            saveTimeout
        );

        closeNoteEditor();

        renderNotes();

    } catch (error) {

        console.error(
            "Delete note error:",
            error
        );

        editorDeleteButton.disabled =
            false;

        alert(
            "Unable to delete note."
        );
    }
}


// =========================
// EDITOR WORD / CHARACTER COUNT
// =========================

function updateEditorCount() {

    const text =
        editorContentInput.value;

    const characters =
        text.length;

    const trimmedText =
        text.trim();

    const words =
        trimmedText
            ? trimmedText.split(/\s+/).length
            : 0;

    editorCount.textContent =
        `${words} ${
            words === 1
                ? "word"
                : "words"
        } · ${characters} ${
            characters === 1
                ? "character"
                : "characters"
        }`;
}


// =========================
// EDITOR AUTO-RESIZE
// =========================

function resizeEditor() {

    editorContentInput.style.height =
        "auto";

    editorContentInput.style.height =
        `${editorContentInput.scrollHeight}px`;
}


// =========================
// AI SUMMARY
// =========================

async function summarizeCurrentNote() {

    if (!currentNote) {
        return;
    }

    const title =
        editorTitleInput.value.trim();

    const content =
        editorContentInput.value.trim();

    if (!content) {

        showAISummaryMessage(
            "Add some text to your note before summarizing it.",
            true
        );

        return;
    }

    clearAISummaryMessage();

    summarizeButton.disabled =
        true;

    summarizeButton.textContent =
        "Summarizing...";

    aiSummaryResult.classList.add(
        "hidden"
    );

    try {

        const {
            data,
            error
        } =
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

        if (
            !data ||
            !data.summary
        ) {

            throw new Error(
                "The AI did not return a summary."
            );
        }

        currentAISummary =
            data.summary.trim();

        aiSummaryText.innerHTML =
            formatAISummary(
                currentAISummary
            );

        aiSummaryResult.classList.remove(
            "hidden"
        );

    } catch (error) {

        console.error(
            "AI summary error:",
            error
        );

        showAISummaryMessage(
            error.message ||
            "Unable to summarize this note right now. Please try again.",
            true
        );

    } finally {

        summarizeButton.disabled =
            false;

        summarizeButton.textContent =
            "Summarize with AI";
    }
}


// =========================
// AI SUMMARY FORMATTING
// =========================

function formatAISummary(
    summary
) {

    const escaped =
        escapeHTML(
            summary
        );

    const lines =
        escaped
            .split(/\r?\n/)
            .map(
                line =>
                    line.trim()
            )
            .filter(
                line =>
                    line.length > 0
            );

    if (
        lines.length === 0
    ) {
        return "";
    }

    const bulletLines =
        lines.filter(
            line =>
                /^[-*•]\s+/.test(
                    line
                )
        );

    if (
        bulletLines.length ===
        lines.length
    ) {

        const items =
            bulletLines
                .map(
                    line =>
                        line.replace(
                            /^[-*•]\s+/,
                            ""
                        )
                )
                .map(
                    item =>
                        `<li>${item}</li>`
                )
                .join("");

        return `<ul>${items}</ul>`;
    }

    return lines
        .map(
            line =>
                `<p>${line}</p>`
        )
        .join("");
}


// =========================
// HTML ESCAPING
// =========================

function escapeHTML(
    value
) {

    return value
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// =========================
// COPY AI SUMMARY
// =========================

async function copyAISummary() {

    if (!currentAISummary) {
        return;
    }

    try {

        await navigator.clipboard.writeText(
            currentAISummary
        );

        const originalText =
            aiCopyButton.textContent;

        aiCopyButton.textContent =
            "Copied!";

        setTimeout(
            () => {

                aiCopyButton.textContent =
                    originalText;

            },
            1500
        );

    } catch (error) {

        console.error(
            "Copy summary error:",
            error
        );

        showAISummaryMessage(
            "Unable to copy the summary.",
            true
        );
    }
}


// =========================
// USE AI SUMMARY IN NOTE
// =========================

function useAISummaryInNote() {

    if (!currentAISummary) {
        return;
    }

    editorContentInput.value =
        currentAISummary;

    updateEditorCount();

    resizeEditor();

    editorStatus.textContent =
        "Saving...";

    clearTimeout(
        saveTimeout
    );

    saveTimeout =
        setTimeout(
            saveCurrentNote,
            300
        );
}


// =========================
// AI SUMMARY MESSAGES
// =========================

function showAISummaryMessage(
    message,
    isError = false
) {

    aiSummaryMessage.textContent =
        message;

    aiSummaryMessage.classList.remove(
        "hidden"
    );

    aiSummaryMessage.classList.toggle(
        "error",
        isError
    );
}


function clearAISummaryMessage() {

    aiSummaryMessage.textContent = "";

    aiSummaryMessage.classList.add(
        "hidden"
    );

    aiSummaryMessage.classList.remove(
        "error"
    );
}


function clearAISummary() {

    currentAISummary =
        "";

    aiSummaryText.innerHTML =
        "";

    aiSummaryResult.classList.add(
        "hidden"
    );

    clearAISummaryMessage();
}


// =========================
// DATE FORMATTING
// =========================

function formatNoteDate(
    dateString
) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            dateString
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    const now =
        new Date();

    const difference =
        now.getTime() -
        date.getTime();

    const minute =
        60 * 1000;

    const hour =
        60 * minute;

    const day =
        24 * hour;

    if (
        difference >= 0 &&
        difference < minute
    ) {

        return "Just now";
    }

    if (
        difference >= minute &&
        difference < hour
    ) {

        const minutes =
            Math.floor(
                difference / minute
            );

        return `${minutes}m ago`;
    }

    if (
        difference >= hour &&
        difference < day
    ) {

        const hours =
            Math.floor(
                difference / hour
            );

        return `${hours}h ago`;
    }

    if (
        difference >= day &&
        difference < 7 * day
    ) {

        const days =
            Math.floor(
                difference / day
            );

        return `${days}d ago`;
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


// =========================
// KEYBOARD SHORTCUTS
// =========================

function handleKeyboardShortcuts(
    event
) {

    if (
        event.key === "Escape" &&
        !editorOverlay.classList.contains(
            "hidden"
        )
    ) {

        closeNoteEditor();
    }
}
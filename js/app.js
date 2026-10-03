// ==============================
// DOM ELEMENTS
// ==============================

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

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const logoutButton =
    document.getElementById("logoutButton");

const homeButton =
    document.getElementById("homeButton");

const searchInput =
    document.getElementById("searchInput");

const addNoteButton =
    document.getElementById("addNoteButton");

const emptyStateCreateButton =
    document.getElementById("emptyStateCreateButton");

const noteCount =
    document.getElementById("noteCount");

const emptyState =
    document.getElementById("emptyState");

const emptyStateTitle =
    document.getElementById("emptyStateTitle");

const emptyStateDescription =
    document.getElementById("emptyStateDescription");

const pinnedSection =
    document.getElementById("pinnedSection");

const pinnedGrid =
    document.getElementById("pinnedGrid");

const pinnedCount =
    document.getElementById("pinnedCount");

const otherNotesSection =
    document.getElementById("otherNotesSection");

const otherNotesHeading =
    document.getElementById("otherNotesHeading");

const otherNotesCount =
    document.getElementById("otherNotesCount");

const notesGrid =
    document.getElementById("notesGrid");

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

const editorDeleteButton =
    document.getElementById("editorDeleteButton");

const editorDoneButton =
    document.getElementById("editorDoneButton");

const editorCount =
    document.getElementById("editorCount");

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


// ==============================
// STATE
// ==============================

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


// ==============================
// AUTH MODE
// ==============================

function updateAuthMode() {

    if (isSignUpMode) {

        authTitle.textContent =
            "Create your account";

        authSubtitle.textContent =
            "Start organizing your notes with Notebook.";

        authSwitchText.textContent =
            "Already have an account?";

        authSwitchButton.textContent =
            "Sign in";

    } else {

        authTitle.textContent =
            "Welcome back";

        authSubtitle.textContent =
            "Sign in to continue to Notebook.";

        authSwitchText.textContent =
            "Don't have an account?";

        authSwitchButton.textContent =
            "Create account";
    }
}


authSwitchButton.addEventListener(
    "click",
    () => {

        isSignUpMode = !isSignUpMode;

        authForm.reset();

        updateAuthMode();
    }
);


// ==============================
// AUTH FORM
// ==============================

authForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        if (!email || !password) {
            return;
        }

        const submitButton =
            authForm.querySelector(
                "button[type='submit']"
            );

        submitButton.disabled = true;

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

                    alert(
                        "Account created. Please check your email to confirm your account."
                    );

                } else {

                    await showNotesPage();
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

                await showNotesPage();
            }

        } catch (error) {

            console.error(
                "Authentication error:",
                error
            );

            alert(
                error.message ||
                "Unable to complete authentication."
            );

        } finally {

            submitButton.disabled = false;
        }
    }
);


// ==============================
// SHOW / HIDE PAGES
// ==============================

function showAuthPage() {

    authPage.classList.remove(
        "hidden"
    );

    notesPage.classList.add(
        "hidden"
    );
}


async function showNotesPage() {

    authPage.classList.add(
        "hidden"
    );

    notesPage.classList.remove(
        "hidden"
    );

    await loadNotes();
}


// ==============================
// LOAD NOTES
// ==============================

async function loadNotes() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("notes")
            .select("*")
            .order(
                "is_pinned",
                {
                    ascending: false
                }
            )
            .order(
                "updated_at",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            "Load notes error:",
            error
        );

        return;
    }

    notes = data || [];

    renderNotes();
}


// ==============================
// SORT NOTES
// ==============================

function sortNotes(noteList) {

    return [...noteList].sort(
        (a, b) => {

            if (
                Boolean(a.is_pinned) !==
                Boolean(b.is_pinned)
            ) {

                return a.is_pinned
                    ? -1
                    : 1;
            }

            return (
                new Date(b.updated_at) -
                new Date(a.updated_at)
            );
        }
    );
}


// ==============================
// FILTER NOTES
// ==============================

function getFilteredNotes() {

    const query =
        searchInput.value
            .trim()
            .toLowerCase();

    if (!query) {

        return sortNotes(notes);
    }

    return sortNotes(
        notes.filter(
            (note) => {

                const title =
                    note.title || "";

                const content =
                    note.content || "";

                return (
                    title
                        .toLowerCase()
                        .includes(query) ||
                    content
                        .toLowerCase()
                        .includes(query)
                );
            }
        )
    );
}


// ==============================
// RENDER NOTES
// ==============================

function renderNotes() {

    const filteredNotes =
        getFilteredNotes();

    const pinnedNotes =
        filteredNotes.filter(
            (note) => note.is_pinned
        );

    const otherNotes =
        filteredNotes.filter(
            (note) => !note.is_pinned
        );

    noteCount.textContent =
        `${filteredNotes.length} ${
            filteredNotes.length === 1
                ? "note"
                : "notes"
        }`;

    pinnedCount.textContent =
        pinnedNotes.length;

    otherNotesCount.textContent =
        otherNotes.length;

    pinnedGrid.innerHTML = "";

    notesGrid.innerHTML = "";

    pinnedNotes.forEach(
        (note) => {

            pinnedGrid.appendChild(
                createNoteCard(note)
            );
        }
    );

    otherNotes.forEach(
        (note) => {

            notesGrid.appendChild(
                createNoteCard(note)
            );
        }
    );

    pinnedSection.classList.toggle(
        "hidden",
        pinnedNotes.length === 0
    );

    otherNotesSection.classList.toggle(
        "hidden",
        otherNotes.length === 0
    );

    if (filteredNotes.length === 0) {

        emptyState.classList.remove(
            "hidden"
        );

        if (notes.length === 0) {

            emptyStateTitle.textContent =
                "No notes yet";

            emptyStateDescription.textContent =
                "Create your first note to get started.";

        } else {

            emptyStateTitle.textContent =
                "No notes found";

            emptyStateDescription.textContent =
                "Try a different search.";
        }

    } else {

        emptyState.classList.add(
            "hidden"
        );
    }
}


// ==============================
// CREATE NOTE CARD
// ==============================

function createNoteCard(note) {

    const card =
        document.createElement("article");

    card.className =
        "note-card";

    if (note.is_pinned) {

        card.classList.add(
            "pinned"
        );
    }

    const title =
        document.createElement("h3");

    title.className =
        "note-card-title";

    title.textContent =
        note.title?.trim() ||
        "Untitled note";

    const content =
        document.createElement("p");

    content.className =
        "note-card-content";

    content.textContent =
        note.content?.trim() ||
        "Empty note";

    const footer =
        document.createElement("div");

    footer.className =
        "note-card-footer";

    const date =
        document.createElement("span");

    date.className =
        "note-card-date";

    date.textContent =
        formatNoteDate(
            note.updated_at
        );

    footer.appendChild(date);

    card.appendChild(title);

    card.appendChild(content);

    card.appendChild(footer);

    card.addEventListener(
        "click",
        () => {

            openNoteEditor(note);
        }
    );

    return card;
}


// ==============================
// DATE FORMAT
// ==============================

function formatNoteDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


// ==============================
// CREATE NOTE
// ==============================

async function createNote() {

    if (isCreatingNote) {
        return;
    }

    isCreatingNote = true;

    addNoteButton.disabled = true;

    try {

        const {
            data: {
                user
            },
            error: userError
        } =
            await supabaseClient.auth.getUser();

        if (
            userError ||
            !user
        ) {
            return;
        }

        const {
            data,
            error
        } =
            await supabaseClient
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

        renderNotes();

        openNoteEditor(data);

    } catch (error) {

        console.error(
            "Create note error:",
            error
        );

        alert(
            "Unable to create note."
        );

    } finally {

        isCreatingNote = false;

        addNoteButton.disabled = false;
    }
}


addNoteButton.addEventListener(
    "click",
    createNote
);


emptyStateCreateButton.addEventListener(
    "click",
    createNote
);


// ==============================
// AUTO-RESIZE EDITOR
// ==============================

function autoResizeEditor() {

    editorContentInput.style.height =
        "auto";

    editorContentInput.style.height =
        `${editorContentInput.scrollHeight}px`;
}


// ==============================
// WORD & CHARACTER COUNT
// ==============================

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


// ==============================
// OPEN NOTE EDITOR
// ==============================

function openNoteEditor(note) {

    currentNote = note;

    editorTitleInput.value =
        note.title || "";

    editorContentInput.value =
        note.content || "";

    autoResizeEditor();

    updateEditorCount();

    updateEditorPinButton();

    isEditorDirty = false;

    editRevision += 1;

    editorOverlay.classList.remove(
        "hidden"
    );

    setEditorStatus(
        "Saved"
    );

    clearAISummary();

    setTimeout(
        () => {

            editorTitleInput.focus();

        },
        50
    );
}


// ==============================
// CLOSE EDITOR
// ==============================

async function closeNoteEditor() {

    if (
        isClosingEditor ||
        !currentNote
    ) {
        return;
    }

    isClosingEditor = true;

    try {

        if (isEditorDirty) {

            await saveCurrentNote();
        }

        editorOverlay.classList.add(
            "hidden"
        );

        currentNote = null;

        clearAISummary();

    } finally {

        isClosingEditor = false;
    }
}


closeEditorButton.addEventListener(
    "click",
    closeNoteEditor
);


editorDoneButton.addEventListener(
    "click",
    closeNoteEditor
);


// ==============================
// EDITOR INPUT
// ==============================

function handleEditorInput() {

    if (!currentNote) {
        return;
    }

    currentNote.title =
        editorTitleInput.value;

    currentNote.content =
        editorContentInput.value;

    autoResizeEditor();

    updateEditorCount();

    editRevision += 1;

    isEditorDirty = true;

    setEditorStatus(
        "Unsaved changes"
    );

    clearAISummary();

    clearTimeout(saveTimer);

    saveTimer = setTimeout(
        () => {

            saveCurrentNote();

        },
        700
    );
}


editorTitleInput.addEventListener(
    "input",
    handleEditorInput
);


editorContentInput.addEventListener(
    "input",
    handleEditorInput
);


// ==============================
// EDITOR STATUS
// ==============================

function setEditorStatus(
    message
) {

    editorStatus.textContent =
        message;
}


// ==============================
// SAVE NOTE
// ==============================

async function saveCurrentNote() {

    if (
        !currentNote ||
        !isEditorDirty
    ) {
        return;
    }

    const revisionAtStart =
        editRevision;

    const noteId =
        currentNote.id;

    const title =
        editorTitleInput.value;

    const content =
        editorContentInput.value;

    savePromise =
        supabaseClient
            .from("notes")
            .update({
                title,
                content,
                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                noteId
            );

    try {

        const {
            data,
            error
        } =
            await savePromise
                .select()
                .single();

        if (error) {
            throw error;
        }

        const noteIndex =
            notes.findIndex(
                (note) =>
                    note.id ===
                    noteId
            );

        if (
            noteIndex !== -1
        ) {

            notes[noteIndex] =
                data;
        }

        if (
            currentNote &&
            currentNote.id === noteId
        ) {

            currentNote =
                data;
        }

        if (
            editRevision ===
            revisionAtStart
        ) {

            isEditorDirty = false;

            setEditorStatus(
                "Saved"
            );
        }

        renderNotes();

    } catch (error) {

        console.error(
            "Save note error:",
            error
        );

        setEditorStatus(
            "Unable to save"
        );

    } finally {

        savePromise = null;
    }
}


// ==============================
// PIN / UNPIN
// ==============================

async function togglePin() {

    if (!currentNote) {
        return;
    }

    const newPinnedState =
        !currentNote.is_pinned;

    currentNote.is_pinned =
        newPinnedState;

    updateEditorPinButton();

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
                .select()
                .single();

        if (error) {
            throw error;
        }

        const noteIndex =
            notes.findIndex(
                (note) =>
                    note.id ===
                    currentNote.id
            );

        if (
            noteIndex !== -1
        ) {

            notes[noteIndex] =
                data;
        }

        currentNote =
            data;

        renderNotes();

    } catch (error) {

        console.error(
            "Toggle pin error:",
            error
        );

        currentNote.is_pinned =
            !newPinnedState;

        updateEditorPinButton();

        alert(
            "Unable to update pin status."
        );
    }
}


function updateEditorPinButton() {

    if (!currentNote) {
        return;
    }

    editorPinButton.textContent =
        currentNote.is_pinned
            ? "Unpin"
            : "Pin";
}


editorPinButton.addEventListener(
    "click",
    togglePin
);


// ==============================
// DELETE NOTE
// ==============================

async function deleteCurrentNote() {

    if (
        !currentNote ||
        isDeletingNote
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

    isDeletingNote = true;

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
                    currentNote.id
                );

        if (error) {
            throw error;
        }

        notes =
            notes.filter(
                (note) =>
                    note.id !==
                    currentNote.id
            );

        currentNote = null;

        editorOverlay.classList.add(
            "hidden"
        );

        clearAISummary();

        renderNotes();

    } catch (error) {

        console.error(
            "Delete note error:",
            error
        );

        alert(
            "Unable to delete note."
        );

    } finally {

        isDeletingNote = false;

        editorDeleteButton.disabled =
            false;
    }
}


editorDeleteButton.addEventListener(
    "click",
    deleteCurrentNote
);


// ==============================
// AI SUMMARY
// ==============================

function clearAISummary() {

    aiSummaryResult.classList.add(
        "hidden"
    );

    aiSummaryText.innerHTML =
        "";

    aiSummaryMessage.classList.add(
        "hidden"
    );

    aiSummaryMessage.textContent =
        "";

    summarizeButton.disabled =
        false;

    summarizeButton.textContent =
        "Summarize with AI";

    aiCopyButton.textContent =
        "Copy summary";

    aiUseButton.disabled =
        false;

    isSummarizing = false;
}


function showAISummaryMessage(
    message
) {

    aiSummaryMessage.textContent =
        message;

    aiSummaryMessage.classList.remove(
        "hidden"
    );
}


// ==============================
// FORMAT AI SUMMARY
// ==============================

function escapeHTML(text) {

    return text
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;",
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


function formatAISummary(
    summary
) {

    const lines =
        summary
            .split(/\r?\n/)
            .map(
                (line) =>
                    line.trim()
            )
            .filter(
                (line) =>
                    line.length > 0
            );

    let html = "";

    let bulletItems = [];

    function flushBullets() {

        if (
            bulletItems.length === 0
        ) {
            return;
        }

        html += "<ul>";

        bulletItems.forEach(
            (item) => {

                html +=
                    `<li>${escapeHTML(
                        item
                    )}</li>`;
            }
        );

        html += "</ul>";

        bulletItems = [];
    }

    lines.forEach(
        (line) => {

            const bulletMatch =
                line.match(
                    /^[-*•]\s+(.*)$/
                );

            if (bulletMatch) {

                bulletItems.push(
                    bulletMatch[1]
                );

                return;
            }

            flushBullets();

            html +=
                `<p>${escapeHTML(
                    line
                )}</p>`;
        }
    );

    flushBullets();

    return html;
}


// ==============================
// SUMMARIZE CURRENT NOTE
// ==============================

async function summarizeCurrentNote() {

    if (
        !currentNote ||
        isSummarizing
    ) {
        return;
    }

    const title =
        editorTitleInput.value.trim();

    const content =
        editorContentInput.value.trim();

    if (!content) {

        showAISummaryMessage(
            "Add some text to your note before summarizing it."
        );

        return;
    }

    isSummarizing = true;

    summarizeButton.disabled =
        true;

    summarizeButton.textContent =
        "Summarizing...";

    aiSummaryMessage.classList.add(
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
                "No summary was returned."
            );
        }

        const summary =
            data.summary.trim();

        aiSummaryText.innerHTML =
            formatAISummary(
                summary
            );

        aiSummaryResult.classList.remove(
            "hidden"
        );

        summarizeButton.textContent =
            "Summarize again";

    } catch (error) {

        console.error(
            "AI summarization error:",
            error
        );

        showAISummaryMessage(
            "Unable to summarize this note right now. Please try again."
        );

        summarizeButton.textContent =
            "Try again";

    } finally {

        isSummarizing = false;

        summarizeButton.disabled =
            false;
    }
}


summarizeButton.addEventListener(
    "click",
    summarizeCurrentNote
);


// ==============================
// COPY AI SUMMARY
// ==============================

async function copyAISummary() {

    const summary =
        aiSummaryText.innerText.trim();

    if (!summary) {
        return;
    }

    try {

        await navigator.clipboard.writeText(
            summary
        );

        aiCopyButton.textContent =
            "Copied!";

        setTimeout(
            () => {

                aiCopyButton.textContent =
                    "Copy summary";

            },
            1500
        );

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


aiCopyButton.addEventListener(
    "click",
    copyAISummary
);


// ==============================
// USE AI SUMMARY IN NOTE
// ==============================

function useAISummaryInNote() {

    if (!currentNote) {
        return;
    }

    const summary =
        aiSummaryText.innerText.trim();

    if (!summary) {
        return;
    }

    editorContentInput.value =
        summary;

    currentNote.content =
        summary;

    autoResizeEditor();

    updateEditorCount();

    editRevision += 1;

    isEditorDirty = true;

    clearAISummary();

    setEditorStatus(
        "Unsaved changes"
    );

    clearTimeout(saveTimer);

    saveTimer = setTimeout(
        () => {

            saveCurrentNote();

        },
        700
    );

    editorContentInput.focus();
}


aiUseButton.addEventListener(
    "click",
    useAISummaryInNote
);


// ==============================
// SEARCH
// ==============================

searchInput.addEventListener(
    "input",
    renderNotes
);


// ==============================
// HOME
// ==============================

homeButton.addEventListener(
    "click",
    async () => {

        if (currentNote) {

            await closeNoteEditor();
        }

        renderNotes();
    }
);


// ==============================
// LOGOUT
// ==============================

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient.auth.signOut();

        notes = [];

        currentNote = null;

        editorOverlay.classList.add(
            "hidden"
        );

        showAuthPage();
    }
);


// ==============================
// ESCAPE KEY
// ==============================

document.addEventListener(
    "keydown",
    async (event) => {

        if (
            event.key === "Escape" &&
            !editorOverlay.classList.contains(
                "hidden"
            )
        ) {

            await closeNoteEditor();
        }
    }
);


// ==============================
// AUTH STATE
// ==============================

supabaseClient.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        if (session) {

            if (
                authPage.classList.contains(
                    "hidden"
                )
            ) {

                return;
            }

            await showNotesPage();

        } else {

            notes = [];

            currentNote = null;

            editorOverlay.classList.add(
                "hidden"
            );

            showAuthPage();
        }
    }
);


// ==============================
// INITIAL SESSION
// ==============================

async function initializeApp() {

    updateAuthMode();

    const {
        data: {
            session
        }
    } =
        await supabaseClient.auth.getSession();

    if (session) {

        await showNotesPage();

    } else {

        showAuthPage();
    }
}


initializeApp();
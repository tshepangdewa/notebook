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

const logoutButton =
    document.getElementById("logoutButton");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const notesGrid =
    document.getElementById("notesGrid");

const searchInput =
    document.getElementById("searchInput");

const addNoteButton =
    document.getElementById("addNoteButton");


/* =========================
   EDITOR ELEMENTS
========================= */

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


/* =========================
   APPLICATION STATE
========================= */

let isSignUpMode = false;

let notes = [];

let currentNote = null;

let saveTimer = null;

let isSaving = false;

let isEditorDirty = false;


/* =========================
   AUTH MODE
========================= */

authSwitchButton.addEventListener(
    "click",
    () => {

        isSignUpMode =
            !isSignUpMode;

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

            authForm
                .querySelector(".primary-button")
                .textContent =
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

            authForm
                .querySelector(".primary-button")
                .textContent =
                    "Sign in";
        }


        passwordInput.value = "";
    }
);


/* =========================
   AUTH MESSAGE
========================= */

function showAuthMessage(
    message,
    type = "error"
) {

    const messageElement =
        document.getElementById(
            "authMessage"
        );


    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        message;


    messageElement.className =
        `auth-message ${type}`;
}


function clearAuthMessage() {

    const messageElement =
        document.getElementById(
            "authMessage"
        );


    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        "";


    messageElement.className =
        "auth-message hidden";
}


/* =========================
   AUTH BUTTON LOADING
========================= */

function setAuthLoading(
    isLoading
) {

    const button =
        authForm.querySelector(
            ".primary-button"
        );


    button.disabled =
        isLoading;


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

authForm.addEventListener(
    "submit",
    async (event) => {

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
            ========================== */

            if (isSignUpMode) {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signUp({
                        email: email,
                        password: password
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


            /* =========================
               SIGN IN
            ========================== */

            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });


            if (error) {
                throw error;
            }


            if (data.session) {

                await showNotesPage();
            }


        } catch (error) {

            console.error(
                "Authentication error:",
                error
            );


            showAuthMessage(
                getFriendlyAuthError(error)
            );

        } finally {

            setAuthLoading(false);
        }
    }
);


/* =========================
   AUTH ERRORS
========================= */

function getFriendlyAuthError(
    error
) {

    const message =
        error?.message?.toLowerCase() || "";


    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return "Incorrect email or password.";
    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return "Please confirm your email before signing in.";
    }


    if (
        message.includes("password")
    ) {

        return error.message;
    }


    if (
        message.includes("email")
    ) {

        return error.message;
    }


    return "Something went wrong. Please try again.";
}


/* =========================
   SHOW NOTES PAGE
========================= */

async function showNotesPage() {

    authPage.classList.add(
        "hidden"
    );

    notesPage.classList.remove(
        "hidden"
    );


    await loadNotes();
}


/* =========================
   SHOW AUTH PAGE
========================= */

function showAuthPage() {

    notesPage.classList.add(
        "hidden"
    );

    authPage.classList.remove(
        "hidden"
    );


    closeEditor();
}


/* =========================
   LOAD NOTES
========================= */

async function loadNotes() {

    notesGrid.innerHTML =
        `<p class="notes-status">
            Loading notes...
        </p>`;


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


        notesGrid.innerHTML =
            `<p class="notes-status error">
                Unable to load your notes.
            </p>`;


        return;
    }


    notes =
        data || [];


    renderNotes(notes);
}


/* =========================
   RENDER NOTES
========================= */

function renderNotes(
    notesToRender
) {

    notesGrid.innerHTML = "";


    if (
        notesToRender.length === 0
    ) {

        notesGrid.innerHTML =
            `<p class="notes-status">
                No notes yet. Create your first note.
            </p>`;


        return;
    }


    notesToRender.forEach(
        (note) => {

            const noteCard =
                document.createElement(
                    "article"
                );


            noteCard.className =
                "note-card";


            if (note.is_pinned) {

                noteCard.classList.add(
                    "pinned"
                );
            }


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                note.title ||
                "Untitled note";


            const content =
                document.createElement(
                    "p"
                );


            content.textContent =
                note.content ||
                "Empty note";


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "note-actions";


            const pinButton =
                document.createElement(
                    "button"
                );


            pinButton.type =
                "button";


            pinButton.className =
                "note-action-button";


            pinButton.textContent =
                note.is_pinned
                    ? "Unpin"
                    : "Pin";


            pinButton.addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();

                    togglePin(note);
                }
            );


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "note-action-button delete";


            deleteButton.textContent =
                "Delete";


            deleteButton.addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();

                    deleteNote(note.id);
                }
            );


            actions.appendChild(
                pinButton
            );

            actions.appendChild(
                deleteButton
            );


            noteCard.appendChild(
                title
            );

            noteCard.appendChild(
                content
            );

            noteCard.appendChild(
                actions
            );


            noteCard.addEventListener(
                "click",
                () => {

                    openNoteEditor(note);
                }
            );


            notesGrid.appendChild(
                noteCard
            );
        }
    );
}


/* =========================
   CREATE NOTE
========================= */

addNoteButton.addEventListener(
    "click",
    createEmptyNote
);


async function createEmptyNote() {

    addNoteButton.disabled =
        true;


    try {

        const {
            data: {
                user
            }
        } =
            await supabaseClient
                .auth
                .getUser();


        if (!user) {

            showAuthPage();

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


        renderNotes(notes);


        openNoteEditor(data);


    } catch (error) {

        console.error(
            "Create note error:",
            error
        );

    } finally {

        addNoteButton.disabled =
            false;
    }
}


/* =========================
   OPEN NOTE EDITOR
========================= */

function openNoteEditor(note) {

    currentNote = {
        ...note
    };


    isEditorDirty =
        false;


    editorTitleInput.value =
        note.title || "";


    editorContentInput.value =
        note.content || "";


    updateEditorPinButton();


    setEditorStatus(
        "Saved"
    );


    editorOverlay.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";


    editorTitleInput.focus();
}


/* =========================
   CLOSE NOTE EDITOR
========================= */

async function closeEditor() {

    if (!currentNote) {
        return;
    }


    if (isEditorDirty) {

        await saveCurrentNote();
    }


    clearTimeout(saveTimer);


    currentNote =
        null;


    isEditorDirty =
        false;


    editorOverlay.classList.add(
        "hidden"
    );


    document.body.style.overflow =
        "";


    searchInput.focus();


    renderNotes(
        getFilteredNotes()
    );
}


closeEditorButton.addEventListener(
    "click",
    closeEditor
);


editorDoneButton.addEventListener(
    "click",
    closeEditor
);


/* =========================
   EDITOR INPUT
========================= */

editorTitleInput.addEventListener(
    "input",
    handleEditorInput
);


editorContentInput.addEventListener(
    "input",
    handleEditorInput
);


function handleEditorInput() {

    if (!currentNote) {
        return;
    }


    currentNote.title =
        editorTitleInput.value;


    currentNote.content =
        editorContentInput.value;


    isEditorDirty =
        true;


    setEditorStatus(
        "Unsaved changes"
    );


    clearTimeout(saveTimer);


    saveTimer =
        setTimeout(
            saveCurrentNote,
            700
        );
}


/* =========================
   SAVE CURRENT NOTE
========================= */

async function saveCurrentNote() {

    if (
        !currentNote ||
        isSaving
    ) {

        return;
    }


    isSaving =
        true;


    setEditorStatus(
        "Saving..."
    );


    const title =
        editorTitleInput.value.trim();


    const content =
        editorContentInput.value;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("notes")
            .update({
                title:
                    title || "Untitled note",

                content:
                    content,

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

        console.error(
            "Save note error:",
            error
        );


        setEditorStatus(
            "Unable to save"
        );


        isSaving =
            false;


        return;
    }


    currentNote =
        data;


    notes =
        notes.map(
            (note) =>
                note.id === data.id
                    ? data
                    : note
        );


    isEditorDirty =
        false;


    isSaving =
        false;


    setEditorStatus(
        "Saved"
    );
}


/* =========================
   EDITOR STATUS
========================= */

function setEditorStatus(
    message
) {

    editorStatus.textContent =
        message;
}


/* =========================
   PIN / UNPIN
========================= */

editorPinButton.addEventListener(
    "click",
    toggleCurrentNotePin
);


async function toggleCurrentNotePin() {

    if (!currentNote) {
        return;
    }


    const newPinnedState =
        !currentNote.is_pinned;


    editorPinButton.disabled =
        true;


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

        console.error(
            "Pin update error:",
            error
        );


        editorPinButton.disabled =
            false;


        return;
    }


    currentNote =
        data;


    notes =
        notes.map(
            (note) =>
                note.id === data.id
                    ? data
                    : note
        );


    updateEditorPinButton();


    renderNotes(
        getFilteredNotes()
    );


    editorPinButton.disabled =
        false;
}


/* =========================
   UPDATE PIN BUTTON
========================= */

function updateEditorPinButton() {

    if (!currentNote) {
        return;
    }


    if (currentNote.is_pinned) {

        editorPinButton.textContent =
            "Pinned";

        editorPinButton.classList.add(
            "active"
        );

    } else {

        editorPinButton.textContent =
            "Pin";

        editorPinButton.classList.remove(
            "active"
        );
    }
}


/* =========================
   DELETE CURRENT NOTE
========================= */

editorDeleteButton.addEventListener(
    "click",
    async () => {

        if (!currentNote) {
            return;
        }


        await deleteNote(
            currentNote.id,
            true
        );
    }
);


/* =========================
   DELETE NOTE
========================= */

async function deleteNote(
    noteId,
    closeEditorAfterDelete = false
) {

    const {
        error
    } =
        await supabaseClient
            .from("notes")
            .delete()
            .eq(
                "id",
                noteId
            );


    if (error) {

        console.error(
            "Delete note error:",
            error
        );


        return;
    }


    notes =
        notes.filter(
            (note) =>
                note.id !== noteId
        );


    if (
        closeEditorAfterDelete
    ) {

        clearTimeout(saveTimer);


        currentNote =
            null;


        isEditorDirty =
            false;


        editorOverlay.classList.add(
            "hidden"
        );


        document.body.style.overflow =
            "";


        renderNotes(
            getFilteredNotes()
        );


        return;
    }


    renderNotes(
        getFilteredNotes()
    );
}


/* =========================
   SEARCH NOTES
========================= */

searchInput.addEventListener(
    "input",
    () => {

        renderNotes(
            getFilteredNotes()
        );
    }
);


/* =========================
   FILTER NOTES
========================= */

function getFilteredNotes() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!searchTerm) {

        return notes;
    }


    return notes.filter(
        (note) => {

            const title =
                note.title
                    ?.toLowerCase() ||
                "";


            const content =
                note.content
                    ?.toLowerCase() ||
                "";


            return (
                title.includes(
                    searchTerm
                ) ||
                content.includes(
                    searchTerm
                )
            );
        }
    );
}


/* =========================
   PIN / UNPIN FROM CARD
========================= */

async function togglePin(note) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("notes")
            .update({
                is_pinned:
                    !note.is_pinned,

                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                note.id
            )
            .select()
            .single();


    if (error) {

        console.error(
            "Pin update error:",
            error
        );


        return;
    }


    notes =
        notes.map(
            (item) =>
                item.id === note.id
                    ? data
                    : item
        );


    sortNotes();


    renderNotes(
        getFilteredNotes()
    );
}


/* =========================
   SORT NOTES
========================= */

function sortNotes() {

    notes.sort(
        (a, b) => {

            if (
                a.is_pinned !==
                b.is_pinned
            ) {

                return a.is_pinned
                    ? -1
                    : 1;
            }


            return (
                new Date(
                    b.updated_at
                ) -
                new Date(
                    a.updated_at
                )
            );
        }
    );
}


/* =========================
   LOGOUT
========================= */

logoutButton.addEventListener(
    "click",
    async () => {

        clearTimeout(saveTimer);


        if (
            currentNote &&
            isEditorDirty
        ) {

            await saveCurrentNote();
        }


        const {
            error
        } =
            await supabaseClient
                .auth
                .signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );


            return;
        }


        notes = [];

        notesGrid.innerHTML = "";

        searchInput.value = "";


        currentNote =
            null;


        isEditorDirty =
            false;


        showAuthPage();


        authForm.reset();


        isSignUpMode =
            false;


        authTitle.textContent =
            "Your notes, understood by AI";


        authSubtitle.textContent =
            "Sign in to access your notes.";


        authSwitchText.textContent =
            "Don't have an account?";


        authSwitchButton.textContent =
            "Sign up";


        authForm
            .querySelector(
                ".primary-button"
            )
            .textContent =
                "Sign in";
    }
);


/* =========================
   ESCAPE KEY
========================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            !editorOverlay.classList.contains(
                "hidden"
            )
        ) {

            closeEditor();
        }
    }
);


/* =========================
   CHECK SESSION
========================= */

async function checkSession() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );


        showAuthPage();


        return;
    }


    if (data.session) {

        await showNotesPage();

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
            event === "SIGNED_OUT"
        ) {

            notes = [];

            showAuthPage();

            return;
        }


        /*
         * SIGNED_IN does not call
         * showNotesPage here.
         *
         * The sign-in form already
         * handles the transition.
         *
         * This prevents duplicate
         * note loading.
         */
    }
);


/* =========================
   INITIALIZE
========================= */

checkSession();
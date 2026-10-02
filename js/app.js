const authPage = document.getElementById("authPage");
const notesPage = document.getElementById("notesPage");

const authForm = document.getElementById("authForm");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");

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


let isSignUpMode = false;

let notes = [];


/* =========================
   AUTH MODE
========================= */

authSwitchButton.addEventListener("click", () => {

    isSignUpMode = !isSignUpMode;

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

        authForm.querySelector(".primary-button").textContent =
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

        authForm.querySelector(".primary-button").textContent =
            "Sign in";
    }

    passwordInput.value = "";
});


/* =========================
   AUTH MESSAGE
========================= */

function showAuthMessage(message, type = "error") {

    const messageElement =
        document.getElementById("authMessage");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;

    messageElement.className =
        `auth-message ${type}`;
}


function clearAuthMessage() {

    const messageElement =
        document.getElementById("authMessage");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = "";

    messageElement.className =
        "auth-message hidden";
}


/* =========================
   BUTTON LOADING
========================= */

function setAuthLoading(isLoading) {

    const button =
        authForm.querySelector(".primary-button");

    button.disabled = isLoading;

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

authForm.addEventListener("submit", async (event) => {

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
        ========================= */

        if (isSignUpMode) {

            const { data, error } =
                await supabaseClient.auth.signUp({
                    email: email,
                    password: password
                });


            if (error) {
                throw error;
            }


            if (data.session) {

                showNotesPage();

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
        ========================= */

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) {
            throw error;
        }


        if (data.session) {

            showNotesPage();
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
});


/* =========================
   AUTH ERRORS
========================= */

function getFriendlyAuthError(error) {

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

    authPage.classList.add("hidden");

    notesPage.classList.remove("hidden");

    await loadNotes();
}


/* =========================
   SHOW AUTH PAGE
========================= */

function showAuthPage() {

    notesPage.classList.add("hidden");

    authPage.classList.remove("hidden");
}


/* =========================
   LOAD NOTES
========================= */

async function loadNotes() {

    notesGrid.innerHTML =
        `<p class="notes-status">Loading notes...</p>`;


    const {
        data,
        error
    } = await supabaseClient
        .from("notes")
        .select("*")
        .order("is_pinned", {
            ascending: false
        })
        .order("updated_at", {
            ascending: false
        });


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


    notes = data || [];

    renderNotes(notes);
}


/* =========================
   RENDER NOTES
========================= */

function renderNotes(notesToRender) {

    notesGrid.innerHTML = "";


    if (notesToRender.length === 0) {

        notesGrid.innerHTML =
            `<p class="notes-status">
                No notes yet. Create your first note.
            </p>`;

        return;
    }


    notesToRender.forEach((note) => {

        const noteCard =
            document.createElement("article");

        noteCard.className = "note-card";


        if (note.is_pinned) {

            noteCard.classList.add("pinned");
        }


        const title =
            document.createElement("h3");

        title.textContent =
            note.title || "Untitled note";


        const content =
            document.createElement("p");

        content.textContent =
            note.content || "Empty note";


        const actions =
            document.createElement("div");

        actions.className =
            "note-actions";


        const pinButton =
            document.createElement("button");

        pinButton.className =
            "note-action-button";

        pinButton.textContent =
            note.is_pinned
                ? "Unpin"
                : "Pin";


        pinButton.addEventListener(
            "click",
            () => togglePin(note)
        );


        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "note-action-button delete";

        deleteButton.textContent =
            "Delete";


        deleteButton.addEventListener(
            "click",
            () => deleteNote(note.id)
        );


        actions.appendChild(pinButton);

        actions.appendChild(deleteButton);


        noteCard.appendChild(title);

        noteCard.appendChild(content);

        noteCard.appendChild(actions);


        notesGrid.appendChild(noteCard);
    });
}


/* =========================
   CREATE NOTE
========================= */

addNoteButton.addEventListener(
    "click",
    createEmptyNote
);


async function createEmptyNote() {

    addNoteButton.disabled = true;


    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();


    if (!user) {

        addNoteButton.disabled = false;

        showAuthPage();

        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("notes")
        .insert({
            user_id: user.id,
            title: "New note",
            content: ""
        })
        .select()
        .single();


    if (error) {

        console.error(
            "Create note error:",
            error
        );

        addNoteButton.disabled = false;

        return;
    }


    notes.unshift(data);

    renderNotes(notes);

    addNoteButton.disabled = false;
}


/* =========================
   PIN / UNPIN
========================= */

async function togglePin(note) {

    const {
        data,
        error
    } = await supabaseClient
        .from("notes")
        .update({
            is_pinned: !note.is_pinned,
            updated_at: new Date().toISOString()
        })
        .eq("id", note.id)
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
        notes.map((item) =>
            item.id === note.id
                ? data
                : item
        );


    notes.sort((a, b) => {

        if (a.is_pinned !== b.is_pinned) {

            return a.is_pinned
                ? -1
                : 1;
        }

        return new Date(b.updated_at)
            - new Date(a.updated_at);
    });


    renderNotes(notes);
}


/* =========================
   DELETE NOTE
========================= */

async function deleteNote(noteId) {

    const {
        error
    } = await supabaseClient
        .from("notes")
        .delete()
        .eq("id", noteId);


    if (error) {

        console.error(
            "Delete note error:",
            error
        );

        return;
    }


    notes =
        notes.filter(
            (note) => note.id !== noteId
        );


    renderNotes(notes);
}


/* =========================
   SEARCH NOTES
========================= */

searchInput.addEventListener(
    "input",
    () => {

        const searchTerm =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!searchTerm) {

            renderNotes(notes);

            return;
        }


        const filteredNotes =
            notes.filter((note) => {

                const title =
                    note.title
                        ?.toLowerCase() || "";

                const content =
                    note.content
                        ?.toLowerCase() || "";


                return (
                    title.includes(searchTerm) ||
                    content.includes(searchTerm)
                );
            });


        renderNotes(filteredNotes);
    }
);


/* =========================
   LOGOUT
========================= */

logoutButton.addEventListener(
    "click",
    async () => {

        const {
            error
        } = await supabaseClient.auth.signOut();


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

        showAuthPage();

        authForm.reset();

        isSignUpMode = false;


        authTitle.textContent =
            "Your notes, understood by AI";

        authSubtitle.textContent =
            "Sign in to access your notes.";

        authSwitchText.textContent =
            "Don't have an account?";

        authSwitchButton.textContent =
            "Sign up";

        authForm.querySelector(
            ".primary-button"
        ).textContent =
            "Sign in";
    }
);


/* =========================
   CHECK SESSION
========================= */

async function checkSession() {

    const {
        data,
        error
    } = await supabaseClient.auth.getSession();


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
    async (event, session) => {

        if (
            event === "SIGNED_IN" &&
            session
        ) {

            await showNotesPage();
        }


        if (
            event === "SIGNED_OUT"
        ) {

            showAuthPage();
        }
    }
);


/* =========================
   INITIALIZE
========================= */

checkSession();
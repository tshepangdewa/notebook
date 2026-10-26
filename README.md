Notebook is a lightweight web-based note-taking application that allows users to create, manage, search, and summarise their notes. The main goal of the project is to provide a simple place where users can store their thoughts and use artificial intelligence to make long notes easier to understand. Users can create an account, sign in, write notes, edit existing notes, delete notes, pin important notes, and search through their saved information. The application also includes an AI summarisation feature that produces a shorter version of a note while preserving its main ideas.

The frontend is built using HTML, CSS, and JavaScript. HTML provides the structure of the application, including the login and registration form, notes page, search bar, sorting controls, note editor, AI summary section, and footer. CSS controls the appearance and layout of the application. The design uses a light background, dark text, and green as the main colour. The Geist font is used for most text, while Caveat is used for the handwritten-style heading. The layout is designed to work on desktop computers and smaller mobile screens.

JavaScript controls how the application behaves. The app.js file handles actions such as signing in, registering an account, loading notes, creating new notes, updating existing notes, deleting notes, pinning notes, searching, sorting, and saving changes. It also manages the note editor and AI summarisation interface. When a user opens a note, they can change its title or content. The application automatically saves changes to the database. Users can also view the word and character count while writing. The search feature helps users find notes by their titles or content, while the sorting controls allow them to organise notes according to the available options.

Supabase is used for authentication and database storage. Authentication allows users to create accounts and sign in. Each user's notes are stored in a PostgreSQL database table called notes. The table contains fields for the note ID, user ID, title, content, pinned status, creation time, and last update time. The user ID connects each note to its owner. Row Level Security (RLS) is enabled on the notes table so database policies can control which records each user is allowed to access. This is important because users should only be able to manage their own notes.

The AI summarisation feature uses a Supabase Edge Function and Google's Gemini model. When a user requests a summary, the frontend sends the note's title and content to the `summarize-note` function. The function checks that the request comes from a signed-in user, validates the submitted text, and sends it to Gemini for summarisation. The model returns a shorter version of the note. The application displays the result in the editor, where the user can copy the summary or insert it into the note. The Gemini API key is stored as a server-side environment secret rather than being placed in the frontend code. This helps protect the key from being exposed to website visitors.

The project uses a simple folder structure that separates the main page, styling, JavaScript, and supporting assets. The structure is shown below.

```
notebook/
│
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── app.js
│   └── supabase.js
│
├── assets/
│   ├── notebook-logo.svg
│   └── pin.svg
│
└── public/
    └── icons/
        ├── github.svg
        ├── instagram.svg
        └── linkedin.svg
```

The index.html file contains the structure of the website. The css/style.css file contains the application's visual styles and responsive layout rules. The js/app.js file contains the main application logic, including note management and the AI summarisation interface. The js/supabase.js file connects the frontend to the Supabase project using its project URL and publishable key. The assets folder stores the Notebook logo and pin icon. The public/icons folder contains the social media icons used in the footer. The Supabase Edge Function is maintained separately in the Supabase project and is deployed through Supabase tools. Its source code is not included in the frontend folder structure shown above.

Vercel is the planned hosting platform for the frontend. The project can be connected to its GitHub repository and deployed as a static website. Since the frontend uses HTML, CSS, and JavaScript, it does not require a traditional application server or a frontend build process. Supabase continues to provide authentication, database services, and the Edge Function, while Gemini provides the AI summarisation capability. The frontend, database, authentication, and AI service therefore work together as separate parts of the system.

Overall, Notebook combines basic note-taking tools with AI summarisation in a simple web application. Its main strengths are its straightforward interface, automatic saving, account-based storage, search and organisation features, and ability to summarise written information. The use of Vercel and Supabase also makes the project relatively easy to deploy and maintain without managing a dedicated server.

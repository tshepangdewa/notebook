// Supabase Configuration
const SUPABASE_URL = "https://wakpgpjpbzdstjbtholy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_twZvBM0zNzmbTvz44wnUBA_eXnSJkED";

// Initialize the Supabase Client
// Attached to window object so all JS modules (auth.js, notes.js, ai.js) can access it
if (typeof supabase === "undefined") {
    console.error("Supabase SDK failed to load. Check script CDN in index.html.");
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

window.supabaseClient = supabaseClient;
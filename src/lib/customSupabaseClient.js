import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Hybrid storage: writes to both localStorage (persistent) and sessionStorage (tab-scoped).
// On mobile, cross-origin OAuth redirects can sometimes cause localStorage to be inaccessible
// when the page reloads after Google auth. sessionStorage always survives same-tab redirects,
// so the PKCE code_verifier is always findable on return from OAuth.
const hybridStorage = {
  getItem(key) {
    try { const v = localStorage.getItem(key); if (v !== null) return v; } catch {}
    try { return sessionStorage.getItem(key); } catch {}
    return null;
  },
  setItem(key, value) {
    try { localStorage.setItem(key, value); } catch {}
    try { sessionStorage.setItem(key, value); } catch {}
  },
  removeItem(key) {
    try { localStorage.removeItem(key); } catch {}
    try { sessionStorage.removeItem(key); } catch {}
  },
};

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',    // PKCE: returns ?code= (query param) not #access_token= (hash)
                         // Safari ITP strips hash fragments from cross-site redirects → breaks implicit flow
    storage: hybridStorage,
  },
});

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};

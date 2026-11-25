import { createClient } from '@supabase/supabase-js';

let client = null;

/* Returns the browser Supabase client, or null when the env vars are not set
   (so the public pages still build and render without a database). */
export function getSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || typeof window === 'undefined') return null;
  client = createClient(url, key);
  return client;
}

let viewer = null;

/* The Maverick team's "view as" client (app/view/*): the team member's own access token,
   handed over in the link's #t= by the admin space, kept for this tab only. Read only. */
export function getViewerSupabase() {
  if (viewer) return viewer;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || typeof window === 'undefined') return null;
  let token = '';
  const m = /[#&]t=([^&]+)/.exec(window.location.hash || '');
  if (m) {
    token = decodeURIComponent(m[1]);
    try { sessionStorage.setItem('mx-view-token', token); } catch {}
    history.replaceState(history.state, '', window.location.pathname + window.location.search);   /* the token leaves the address bar */
  } else {
    try { token = sessionStorage.getItem('mx-view-token') || ''; } catch {}
  }
  if (!token) return null;
  viewer = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'mx-viewer' },
  });
  return viewer;
}

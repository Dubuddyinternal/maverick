/* SERVER ONLY. Phone login through DuBuddy Auth (the platform team's phone
   verification), then a Supabase session for that number.

   DuBuddy Auth only proves a number is someone's; it never signs anyone in.
   So once it says "verified", the server finds or creates that Supabase user,
   gives them a fresh random password nobody ever sees, signs in with it and
   hands the session to the browser. The password changes on every login.

   Settings (Vercel → maverick → Environment Variables, none of them NEXT_PUBLIC):
     DUBUDDY_AUTH_SECRET        the server tool's secret (dvs_…) from the platform team
     DUBUDDY_AUTH_PURPOSE       the purpose key they registered, e.g. maverick.login
     DUBUDDY_AUTH_URL           optional, default https://prod-api.dubuddy.in
     SUPABASE_SERVICE_ROLE_KEY  Supabase → Project Settings → API keys (secret) */
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const AUTH = process.env.DUBUDDY_AUTH_URL || 'https://prod-api.dubuddy.in';

/* what the creator sees for each DuBuddy Auth refusal */
const SAY = {
  INVALID_CODE: "That code isn't right.",
  TOO_MANY_ATTEMPTS: 'Too many tries. Get a new code.',
  EXPIRED: 'The code expired. Get a new one.',
  REPLACED: 'A newer code was sent. Use the latest one.',
  LIMIT_REACHED: 'Too many requests. Try again in a while.',
  BUDGET_SPENT: "We can't send more codes today. Try again tomorrow.",
  INVALID_IDENTIFIER: 'Check the number. It should be an Indian mobile number.',
  CHANNEL_FAILED: "Couldn't send the code. Try again.",
  NOT_FOUND: 'That code has run out. Get a new one.',
  /* set-up problems: the creator can't fix these, so name the cause for the team */
  UNAUTHENTICATED: 'Login is not connected yet (the code service did not accept our key).',
  UNKNOWN_PURPOSE: 'Login is not connected yet (the code service does not know maverick.login).',
  CLIENT_PAUSED: 'Login is paused right now. Please try again later.',
  MEDIUM_NOT_ALLOWED: 'Login is not connected yet (SMS is not allowed for this purpose).',
};
export function sayFor(reason, fallback) {
  return SAY[reason] || fallback || 'Something went wrong' + (reason ? ' (' + reason + ')' : '') + '. Please try again.';
}

/* "9876543210" or "+91 98765 43210" → "919876543210" (how Supabase stores phones) */
export function normalPhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) return '91' + d;
  if (d.length === 12 && d.startsWith('91')) return d;
  return null;
}

async function call(path, body) {
  const secret = process.env.DUBUDDY_AUTH_SECRET;
  if (!secret) return { ok: false, reason: 'NOT_SET_UP', message: 'Login is not connected yet (DUBUDDY_AUTH_SECRET is missing).' };
  let status = 0, text = '';
  try {
    const r = await fetch(AUTH + '/auth/v2/verify/' + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + secret },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    status = r.status;
    text = await r.text();
    const j = JSON.parse(text);
    if (j && typeof j === 'object') {
      if (!j.ok) console.error('[login] DuBuddy Auth ' + path + ' refused:', status, j.reason, j.message);
      return j;
    }
  } catch (e) {
    /* not the JSON the guide promises: say what came back, never the secret */
    console.error('[login] DuBuddy Auth ' + path + ' failed:', status || (e && e.message), text.slice(0, 300));
    return { ok: false, reason: status ? 'HTTP_' + status : 'NO_CONNECTION',
      message: status ? "Couldn't reach the code service (it answered " + status + '). Please try again soon.' : "Couldn't reach the code service. Please try again." };
  }
  return { ok: false };
}

export function purpose() {
  return process.env.DUBUDDY_AUTH_PURPOSE || 'maverick.login';
}
export const startVerification = (phone) => call('start', { purpose: purpose(), identifier: '+' + phone });
export const checkVerification = (verificationId, code) => call('check', { verificationId, code });
export const confirmVerification = (verificationId) => call('confirm', { verificationId });

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/* the number is verified: find or create its Supabase user and sign them in */
export async function sessionFor(phone) {
  const sb = admin();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sb || !anonKey) return { error: 'Login is not connected yet. Please try again soon.' };
  const password = crypto.randomBytes(24).toString('base64url');

  const found = await sb.rpc('maverick_auth_user_by_phone', { p_phone: phone });
  if (found.error) return { error: 'Login is not set up yet (' + found.error.message + ').' };
  let id = found.data;
  if (id) {
    const u = await sb.auth.admin.updateUserById(id, { password, phone_confirm: true });
    if (u.error) return { error: u.error.message };
  } else {
    const c = await sb.auth.admin.createUser({ phone, password, phone_confirm: true, app_metadata: { maverick: true } });
    if (c.error) return { error: c.error.message };
    id = c.data.user.id;
  }

  const pub = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const s = await pub.auth.signInWithPassword({ phone, password });
  if (s.error || !s.data.session) return { error: "Couldn't sign you in. Please try again." };
  return { session: { access_token: s.data.session.access_token, refresh_token: s.data.session.refresh_token } };
}

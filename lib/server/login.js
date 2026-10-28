/* SERVER ONLY. The second half of phone login.

   The login page talks to DuBuddy Auth itself (a "public tool": it sends the
   code and checks it, see app/login/page.js) and gets back a proof token, a
   JWT signed by DuBuddy Auth saying "+91… is verified". The page hands that
   token here. We check it (signature, issuer, our tool id, type, purpose,
   expiry) and only then sign that number into Supabase: find or create the
   user, give them a fresh random password nobody ever sees, sign in with it
   and return the session. The password changes on every login.

   Settings (Vercel → maverick → Environment Variables):
     DUBUDDY_AUTH_TOOL_ID               our tool's id, from the platform team (the token's "aud")
     NEXT_PUBLIC_DUBUDDY_AUTH_PURPOSE   the purpose key, e.g. maverick.login
     DUBUDDY_AUTH_JWKS                  optional: the JSON at …/auth/v2/.well-known/jwks.json, pasted in.
                                        Without it the keys are fetched from DuBuddy Auth, which
                                        Cloudflare may block for servers.
     DUBUDDY_AUTH_URL                   optional, default https://prod-api.dubuddy.in
     SUPABASE_SERVICE_ROLE_KEY          Supabase → Project Settings → API keys (secret) */
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createLocalJWKSet, createRemoteJWKSet, jwtVerify } from 'jose';

const AUTH = process.env.DUBUDDY_AUTH_URL || 'https://prod-api.dubuddy.in';

export function purpose() {
  return process.env.NEXT_PUBLIC_DUBUDDY_AUTH_PURPOSE || process.env.DUBUDDY_AUTH_PURPOSE || 'maverick.login';
}

/* "9876543210" or "+91 98765 43210" → "919876543210" (how Supabase stores phones) */
export function normalPhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) return '91' + d;
  if (d.length === 12 && d.startsWith('91')) return d;
  return null;
}

let KEYS = null;
function keys() {
  if (KEYS) return KEYS;
  const pasted = process.env.DUBUDDY_AUTH_JWKS;
  KEYS = pasted ? createLocalJWKSet(JSON.parse(pasted)) : createRemoteJWKSet(new URL(AUTH + '/auth/v2/.well-known/jwks.json'));
  return KEYS;
}

/* the proof token → the verified number ("919876543210"), or an error to show */
export async function verifiedPhone(token) {
  const aud = process.env.DUBUDDY_AUTH_TOOL_ID;
  if (!aud) return { error: 'Login is not connected yet (DUBUDDY_AUTH_TOOL_ID is missing).' };
  try {
    const { payload } = await jwtVerify(String(token || ''), keys(), { algorithms: ['ES256'], issuer: 'dubuddy-auth', audience: aud });
    if (payload.typ !== 'phone-verification' || payload.purpose !== purpose()) return { error: "That code wasn't for Maverick. Get a new one." };
    const phone = normalPhone(payload.sub);
    return phone ? { phone } : { error: 'Check the number. It should be an Indian mobile number.' };
  } catch (e) {
    console.error('[login] proof token refused:', (e && (e.code || e.message)) || e);
    if (e && e.code === 'ERR_JWT_EXPIRED') return { error: 'That took too long. Get a new code.' };
    if (e && /fetch|network|JWKS/i.test(String(e.code || e.message))) return { error: "Couldn't check the code (the key service didn't answer). Please try again soon." };
    /* name the cause: the creator can't fix these, the team can (see README) */
    const why = e && e.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED' ? 'tool id doesn\'t match, check DUBUDDY_AUTH_TOOL_ID'
      : e && (e.code === 'ERR_JWKS_NO_MATCHING_KEY' || e.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') ? 'signing key doesn\'t match, check DUBUDDY_AUTH_JWKS'
      : e instanceof SyntaxError ? 'DUBUDDY_AUTH_JWKS is not valid JSON'
      : (e && e.code) || 'unknown';
    return { error: "Couldn't check the code (" + why + '). Get a new one and try again.' };
  }
}

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

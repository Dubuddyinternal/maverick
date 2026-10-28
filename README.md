# Maverick by Dubuddy

The creator site at **maverick.dubuddy.in**. Built with Next.js (App Router, plain JavaScript) and Supabase.

## Pages

| URL | What it is |
|---|---|
| `/` | Home: hero, the two paths, earnings calculator, slabs |
| `/how-it-works` | Six steps + the Maverick Playbook |
| `/help` | Help tiles, status meanings, contact |
| `/login` | Mobile number + OTP (DuBuddy Auth, then a Supabase session) |
| `/signup` | "About you" form, first time only |
| `/dashboard` | Creator overview and My videos (empty for new users) |
| `/dashboard/submit` | Submit a Drive link |
| `/dashboard/videos/[id]` | Status of one video (in review / needs info / approved / rejected / published) |
| `/dashboard/payouts` | UPI ID, payout totals, payment history |

Every number (₹ per video, slabs, days) lives in `lib/config.js`.
The design is in `app/prototype.css` (the original prototype's styles) plus `app/globals.css` (fonts and the phone layout).

## Environment variables

Set these in Vercel → Project → Settings → Environment Variables (and in `.env.local` for local work):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>

# phone login through DuBuddy Auth (public tool), all from the platform team
NEXT_PUBLIC_DUBUDDY_AUTH_CLIENT_ID=dvp_…        # public id, not a secret
NEXT_PUBLIC_DUBUDDY_AUTH_PURPOSE=maverick.login
NEXT_PUBLIC_TURNSTILE_SITE_KEY=…                # only if they turned Turnstile on for us
DUBUDDY_AUTH_TOOL_ID=…                          # our tool id: the proof token's "aud"
DUBUDDY_AUTH_JWKS={"keys":[…]}                  # optional: paste of https://prod-api.dubuddy.in/auth/v2/.well-known/jwks.json

# server only, never NEXT_PUBLIC
SUPABASE_SERVICE_ROLE_KEY=<Supabase → Project Settings → API keys → secret / service_role>
```

Without them the public pages still work; login and the dashboard show "not connected yet".

## Database

`supabase/maverick_schema.sql` creates the `maverick_creators`, `maverick_submissions` and `maverick_payouts` tables with row-level security. Creators only ever see their own rows. Reviewers are whoever `maverick_is_reviewer()` allows (it returns false until it is wired to the team permission system used by tools.dubuddy.in).

Login codes are sent and checked by **DuBuddy Auth** (the platform team's phone verification), registered for Maverick as a *public tool*: `app/login/page.js` calls it straight from the browser with the public id, so `https://maverick.dubuddy.in` must be in the tool's allowed origins. DuBuddy Auth returns a signed proof token; `app/api/login/session` checks it (`lib/server/login.js`: signature, issuer, our tool id, type, purpose, expiry), finds or creates that Supabase user (`maverick_auth_user_by_phone`), signs in with a fresh random password and hands the session to the page. Supabase sends no SMS itself; its Phone provider only has to stay switched on.

## Run locally

```
npm install
npm run dev
```

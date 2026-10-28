import { NextResponse } from 'next/server';
import { verifiedPhone, sessionFor } from '@/lib/server/login';

export const dynamic = 'force-dynamic';

/* { token: DuBuddy Auth's proof token } → { session: { access_token, refresh_token } }.
   The number signed in is the one inside the signed token, never one the browser names. */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const v = await verifiedPhone(body.token);
    if (v.error) return NextResponse.json({ ok: false, message: v.error }, { status: 400 });
    const s = await sessionFor(v.phone);
    if (s.error) return NextResponse.json({ ok: false, message: s.error }, { status: 500 });
    return NextResponse.json({ ok: true, session: s.session });
  } catch (e) {
    console.error('[login] session crashed:', e);
    return NextResponse.json({ ok: false, message: 'Something went wrong on our side (' + ((e && e.message) || 'unknown') + '). Please try again.' }, { status: 500 });
  }
}

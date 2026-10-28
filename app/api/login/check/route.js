import { NextResponse } from 'next/server';
import { normalPhone, checkVerification, confirmVerification, purpose, sessionFor, sayFor } from '@/lib/server/login';

export const dynamic = 'force-dynamic';

/* Check the code: { verificationId, code } → { session: { access_token, refresh_token } }.
   The number signed in is the one DuBuddy Auth confirms, never one the browser names. */
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const vid = String(body.verificationId || ''), code = String(body.code || '').replace(/\D/g, '');
  if (!vid || code.length < 4) return NextResponse.json({ ok: false, message: 'Enter all 6 digits.' }, { status: 400 });

  const c = await checkVerification(vid, code);
  if (!c.ok || !c.verified) return NextResponse.json({ ok: false, reason: c.reason, message: sayFor(c.reason, c.message) }, { status: 400 });
  const f = await confirmVerification(vid);
  if (!f.ok || !f.verified || f.purpose !== purpose()) return NextResponse.json({ ok: false, message: sayFor(f.reason) }, { status: 400 });
  const phone = normalPhone(f.identifier);
  if (!phone) return NextResponse.json({ ok: false, message: sayFor('INVALID_IDENTIFIER') }, { status: 400 });

  const s = await sessionFor(phone);
  if (s.error) return NextResponse.json({ ok: false, message: s.error }, { status: 500 });
  return NextResponse.json({ ok: true, session: s.session });
}

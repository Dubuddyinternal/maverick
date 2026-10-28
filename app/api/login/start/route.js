import { NextResponse } from 'next/server';
import { normalPhone, testCodeFor, startVerification, sayFor } from '@/lib/server/login';

export const dynamic = 'force-dynamic';

/* Send a login code: { phone } → { verificationId, resendAfter } */
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const phone = normalPhone(body.phone);
  if (!phone) return NextResponse.json({ ok: false, message: "That's not 10 digits yet, check and try again." }, { status: 400 });

  if (testCodeFor(phone)) return NextResponse.json({ ok: true, verificationId: 'test:' + phone, resendAfter: Date.now() + 30000 });

  const r = await startVerification(phone);
  if (!r.ok) {
    const msg = r.reason === 'RESEND_TOO_SOON' && r.secondsLeft ? 'Wait ' + r.secondsLeft + ' seconds to resend.' : sayFor(r.reason, r.message);
    return NextResponse.json({ ok: false, reason: r.reason, message: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true, verificationId: r.verificationId, resendAfter: r.resendAfter });
}

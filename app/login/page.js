'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import SiteNav from '@/components/SiteNav';
import { getSupabase } from '@/lib/supabase';
import { T } from '@/lib/config';
import { sayFor } from '@/lib/authMessages';

/* Phone + OTP login through DuBuddy Auth, as a "public tool": this page asks
   DuBuddy Auth itself to text the code and to check it (sending our public id,
   which is not a secret). DuBuddy Auth answers with a signed proof token; our
   server (app/api/login/session) checks it and signs the creator into Supabase.
   Settings (Vercel, all public): NEXT_PUBLIC_DUBUDDY_AUTH_CLIENT_ID (dvp_…),
   NEXT_PUBLIC_DUBUDDY_AUTH_PURPOSE, and NEXT_PUBLIC_TURNSTILE_SITE_KEY if the
   platform team turned Turnstile on for us. */
const AUTH = process.env.NEXT_PUBLIC_DUBUDDY_AUTH_URL || 'https://prod-api.dubuddy.in';
const CLIENT_ID = process.env.NEXT_PUBLIC_DUBUDDY_AUTH_CLIENT_ID;
const PURPOSE = process.env.NEXT_PUBLIC_DUBUDDY_AUTH_PURPOSE || 'maverick.login';
const TURNSTILE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [mob, setMob] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const [vid, setVid] = useState('');
  const [guard, setGuard] = useState('');
  const boxes = useRef([]);
  const tsBox = useRef(null);
  const tsId = useRef(null);

  const phone = '+91' + mob.replace(/\D/g, '');

  /* already signed in: go straight to the dashboard */
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [router]);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  /* Cloudflare Turnstile, only if DuBuddy Auth asks us for it: one fresh token per code sent */
  useEffect(() => {
    if (!TURNSTILE) return;
    const draw = () => {
      if (!window.turnstile || !tsBox.current || tsId.current !== null) return;
      tsId.current = window.turnstile.render(tsBox.current, {
        sitekey: TURNSTILE,
        callback: (t) => setGuard(t),
        'expired-callback': () => setGuard(''),
        'error-callback': () => setGuard(''),
      });
    };
    if (window.turnstile) return draw();
    const sc = document.createElement('script');
    sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    sc.async = true;
    sc.onload = draw;
    document.head.appendChild(sc);
  }, []);

  function freshGuard() {
    setGuard('');
    if (TURNSTILE && window.turnstile && tsId.current !== null) window.turnstile.reset(tsId.current);
  }

  /* one call to DuBuddy Auth, straight from this page */
  async function auth(path, body) {
    try {
      const res = await fetch(AUTH + '/auth/v2/verify/' + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-client-id': CLIENT_ID },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return { ok: false, message: "Couldn't reach the code service (it answered " + res.status + '). Please try again soon.' };
      }
    } catch {
      return { ok: false, message: "Couldn't reach the code service. Check your internet and try again." };
    }
  }

  async function sendCode() {
    if (mob.replace(/\D/g, '').length !== 10) {
      setErr("That's not 10 digits yet, check and try again.");
      return;
    }
    const sb = getSupabase();
    if (!sb || !CLIENT_ID) {
      setErr('Login is not connected yet. Please try again soon.');
      return;
    }
    if (TURNSTILE && !guard) {
      setErr('One moment: finish the quick security check below, then try again.');
      return;
    }
    setBusy(true);
    setErr('');
    const r = await auth('start', { purpose: PURPOSE, identifier: phone, ...(TURNSTILE ? { guardToken: guard } : {}) });
    freshGuard();
    setBusy(false);
    if (!r.ok) {
      setErr(
        r.reason === 'RESEND_TOO_SOON' && r.secondsLeft
          ? 'Wait ' + r.secondsLeft + ' seconds to resend.'
          : r.reason === 'GUARD_REFUSED' && r.rule === 'allowed-origins'
            ? "Login is not connected yet (this site isn't on the code service's allowed list)."
            : sayFor(r.reason, r.message),
      );
      return;
    }
    setVid(r.verificationId);
    setStep(2);
    setOtp(['', '', '', '', '', '']);
    setLeft(r.resendAfter ? Math.max(0, Math.ceil((r.resendAfter - Date.now()) / 1000)) : 30);
    setTimeout(() => boxes.current[0] && boxes.current[0].focus(), 50);
  }

  async function verify() {
    const token = otp.join('');
    if (token.length !== 6) {
      setErr('Enter all 6 digits.');
      return;
    }
    setBusy(true);
    setErr('');
    const sb = getSupabase();
    const c = await auth('check', { verificationId: vid, code: token });
    if (!c.ok || !c.verified) {
      setBusy(false);
      setErr(sayFor(c.reason, c.message));
      return;
    }
    if (!c.proof || !c.proof.token) {
      setBusy(false);
      setErr('Login is not connected yet (the code service sent no proof). Please tell the Maverick team.');
      return;
    }
    const r = await post('/api/login/session', { token: c.proof.token });
    if (!r.ok) {
      setBusy(false);
      setErr(r.message);
      return;
    }
    const { data, error } = await sb.auth.setSession(r.session);
    if (error) {
      setBusy(false);
      setErr("Couldn't sign you in. Please try again.");
      return;
    }
    const { data: creator } = await sb.from('maverick_creators').select('id').eq('id', data.user.id).maybeSingle();
    router.replace(creator ? '/dashboard' : '/signup');
  }

  async function post(url, body) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      return j.ok ? j : { ok: false, message: j.message || 'Something went wrong. Please try again.' };
    } catch {
      return { ok: false, message: 'No connection. Check your internet and try again.' };
    }
  }

  function typeDigit(i, v) {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = d;
    setOtp(next);
    if (d && boxes.current[i + 1]) boxes.current[i + 1].focus();
  }

  return (
    <div className="page rel" style={{ minHeight: '840px' }}>
      <SiteNav />
      <div className="hero" style={{ filter: 'blur(2px)', opacity: 0.5 }} aria-hidden="true">
        <div>
          <h1>Be the real Maverick.</h1>
          <p className="sub">Get paid for the videos you already make.</p>
        </div>
        <div className="rel" style={{ height: '430px' }}>
          <div className="sticker" style={{ position: 'absolute', right: '60px', top: '60px' }}>
            <div>
              <b>{T.base}</b>
              <span>PER VIDEO</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overlay">
        <div className="modal rel">
          <Link href="/" className="x" aria-label="Close">
            {'✕'}
          </Link>
          <div className="side">
            <div>
              <h3>
                Welcome,
                <br />
                Maverick.
              </h3>
              <p className="md" style={{ opacity: 0.85, marginTop: '12px' }}>
                No password. About 20 seconds.
              </p>
              <div className="stack" style={{ gap: '10px', marginTop: '26px', fontSize: '15px', opacity: 0.9 }}>
                <div className="row">
                  <Icon name="d-check" style={{ width: '22px', height: '22px', flex: 'none' }} />
                  Your number is only for the OTP and payout alerts
                </div>
                <div className="row">
                  <Icon name="d-check" style={{ width: '22px', height: '22px', flex: 'none' }} />
                  We never post anything from your account
                </div>
              </div>
            </div>
            <Icon name="d-rocket" className="rocket" style={{ width: '130px', height: '130px', color: '#fff', alignSelf: 'center' }} />
          </div>

          <div className="form">
            {step === 1 ? (
              <div>
                <label className="field">
                  <span className="lbl">Mobile number</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="inp" style={{ width: '84px', textAlign: 'center' }}>
                      +91
                    </div>
                    <input
                      className={`inp tnum${err ? ' bad' : ''}`}
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="98765 43210"
                      value={mob}
                      onChange={(e) => setMob(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                    />
                  </div>
                </label>
                {!err && <p className="helptext">We&apos;ll text you a 6-digit code. Standard SMS rates may apply.</p>}
                {err && (
                  <p className="errtext">
                    <Icon name="d-alert" />
                    {err}
                  </p>
                )}
                <button className="btn" style={{ width: '100%', marginTop: '22px' }} onClick={sendCode} disabled={busy}>
                  {busy ? 'Sending…' : 'Send me the code'}
                </button>
              </div>
            ) : (
              <div>
                <span className="lbl">6 digit OTP</span>
                <div className="otpwrap">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        boxes.current[i] = el;
                      }}
                      className="inp tnum otp"
                      maxLength={1}
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      value={d}
                      onChange={(e) => typeDigit(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[i] && boxes.current[i - 1]) boxes.current[i - 1].focus();
                        if (e.key === 'Enter') verify();
                      }}
                    />
                  ))}
                </div>
                <p className="helptext">
                  Sent to <b>+91 {mob}</b> ·{' '}
                  <span
                    className="linkbtn"
                    role="button"
                    style={{ color: 'var(--coral)', fontSize: '14px' }}
                    onClick={() => {
                      setStep(1);
                      setErr('');
                    }}
                  >
                    change number
                  </span>
                </p>
                {err && (
                  <p className="errtext">
                    <Icon name="d-alert" />
                    {err}
                  </p>
                )}
                <div className="row" style={{ margin: '16px 0 22px' }}>
                  <span className="timer">
                    {left > 0 ? (
                      <>
                        Resend in <b>00:{String(left).padStart(2, '0')}</b>
                      </>
                    ) : (
                      "Didn't arrive?"
                    )}
                  </span>
                  <span
                    className="linkbtn"
                    role="button"
                    style={{ marginLeft: 'auto', fontSize: '14px', color: left > 0 ? '#A9A09B' : 'var(--coral)', cursor: left > 0 ? 'default' : 'pointer' }}
                    onClick={() => left <= 0 && sendCode()}
                  >
                    Resend code
                  </span>
                </div>
                <button className="btn" style={{ width: '100%' }} onClick={verify} disabled={busy}>
                  {busy ? 'Checking…' : 'Verify and continue'}
                </button>
              </div>
            )}
            {TURNSTILE && <div ref={tsBox} style={{ marginTop: '18px' }} />}
            <p className="helptext" style={{ marginTop: '26px' }}>
              The OTP can take up to 30 seconds to arrive on a weak network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icon';
import { ProfileModal, ProfilePrompt, profileMissing } from './ProfileModal';
import SiteNav from './SiteNav';
import SiteFooter from './SiteFooter';
import { getSupabase, getViewerSupabase } from '@/lib/supabase';
import { money } from '@/lib/config';

const DashCtx = createContext(null);

/* { user, creator, submissions, payouts, reload } for the signed-in creator.
   Row-level security in Supabase makes sure these are only their own rows. */
export function useDash() {
  return useContext(DashCtx);
}

const SIDE = [
  { href: '/dashboard', icon: 'd-flag', label: 'Overview' },
  { href: '/dashboard/submit', icon: 'd-send', label: 'Submit a video' },
  { href: '/dashboard/payouts', icon: 'd-coin', label: 'Payouts' },
  { href: '/help', icon: 'd-help', label: 'Help' },
];

function Gate({ notConfigured }) {
  return (
    <div className="page">
      <SiteNav />
      <div className="gatewrap">
        <div className="gatecard">
          <div className="gatering">
            <Icon name="d-lock" className="lockart" />
          </div>
          <h2>Please sign up.</h2>
          <p>
            The dashboard is only visible to signed-up users. It takes about 20 seconds: mobile number, OTP, four
            details, and you are in.
          </p>
          <Link href="/login" className="btn lg">
            Sign up and open my dashboard
          </Link>
          <p className="sm mut" style={{ marginTop: '18px' }}>
            Want to see what&apos;s inside first?{' '}
            <Link href="/how-it-works" className="linkbtn" style={{ color: 'var(--coral)', fontSize: '14px' }}>
              We walk through it in How it works →
            </Link>
          </p>
          {notConfigured && (
            <p className="helptext" style={{ marginTop: '18px' }}>
              Login is not connected yet (Supabase keys are missing).
            </p>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function Bell({ submissions, base }) {
  const [open, setOpen] = useState(false);
  const news = submissions.filter((s) => ['approved', 'rejected', 'needs_info'].includes(s.status)).slice(0, 3);
  const TEXT = {
    approved: ['Your video has been approved for publishing', 'Publish it, then add the published link in My videos.'],
    rejected: ['Your video was not approved', 'Open it to see the reason.'],
    needs_info: ['A reviewer has a question', 'Open the video and reply.'],
  };
  return (
    <div className="bellwrap">
      <button className="bellbtn" aria-label="Notifications" onClick={() => setOpen(!open)}>
        <Icon name="d-bell" className="thin" />
        {news.length > 0 && !open && <i />}
      </button>
      {open && (
        <div className="bellpanel">
          <h5>Notifications</h5>
          {news.length === 0 && <p className="sm mut">Nothing new yet.</p>}
          <div className="stack" style={{ gap: '8px' }}>
            {news.map((s) => (
              <Link key={s.id} href={`${base}/videos/${s.id}`} className="note2" onClick={() => setOpen(false)}>
                <Icon name={s.status === 'approved' ? 'd-check' : 'd-flag'} />
                <div>
                  <b>{TEXT[s.status][0]}</b>
                  <p>
                    {s.title}. {TEXT[s.status][1]}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* shown in "view as" mode when the team link can't be used */
function ViewGate({ reason }) {
  return (
    <div className="page">
      <SiteNav />
      <div className="gatewrap">
        <div className="gatecard">
          <div className="gatering">
            <Icon name="d-lock" className="lockart" />
          </div>
          <h2>{reason === 'denied' ? 'Only for the Maverick team.' : 'Open this from Maverick Admin.'}</h2>
          <p>
            {reason === 'denied'
              ? 'This view is for people with a Maverick permission in tools.dubuddy.in.'
              : reason === 'expired'
                ? 'This view expired after an hour. Open it again from tools.dubuddy.in → Maverick Admin → Creators → Dashboard.'
                : 'Go to tools.dubuddy.in → Maverick Admin → Creators, and click Dashboard next to the creator.'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* viewAs = a creator's id: the Maverick team sees that creator's dashboard, read only,
   with their own tools.dubuddy.in login (handed over by the admin space's Dashboard button) */
export default function DashboardShell({ children, viewAs }) {
  const router = useRouter();
  const path = usePathname();
  const [st, setSt] = useState({ loading: true });
  const [profileOpen, setProfileOpen] = useState(false);

  const base = viewAs ? `/view/${viewAs}` : '/dashboard';

  const load = useCallback(async () => {
    if (viewAs) {
      const sb = getViewerSupabase();
      if (!sb) return setSt({ loading: false, user: null, viewGate: 'token' });
      const staff = await sb.rpc('maverick_is_staff');
      if (staff.error) return setSt({ loading: false, user: null, viewGate: /jwt|expired|401/i.test(staff.error.message || '') ? 'expired' : 'token' });
      if (!staff.data) return setSt({ loading: false, user: null, viewGate: 'denied' });
      const [c, s, p] = await Promise.all([
        sb.from('maverick_creators').select('*').eq('id', viewAs).maybeSingle(),
        sb.from('maverick_submissions').select('*').eq('creator_id', viewAs).order('created_at', { ascending: false }),
        sb.from('maverick_payouts').select('*').eq('creator_id', viewAs).order('created_at', { ascending: false }),
      ]);
      setSt({
        loading: false,
        user: { id: viewAs, phone: c.data && c.data.phone },
        creator: c.data || { id: viewAs },
        submissions: s.data || [],
        payouts: p.data || [],
        error: c.error || s.error || p.error || null,
      });
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setSt({ loading: false, user: null, notConfigured: true });
      return;
    }
    const { data } = await sb.auth.getSession();
    const user = data.session ? data.session.user : null;
    if (!user) {
      setSt({ loading: false, user: null });
      return;
    }
    const [c, s, p] = await Promise.all([
      sb.from('maverick_creators').select('*').eq('id', user.id).maybeSingle(),
      sb.from('maverick_submissions').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
      sb.from('maverick_payouts').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (!c.data && !c.error) {
      router.replace('/signup');
      return;
    }
    setSt({
      loading: false,
      user,
      creator: c.data || {},
      submissions: s.data || [],
      payouts: p.data || [],
      error: c.error || s.error || p.error || null,
    });
  }, [router, viewAs]);

  useEffect(() => {
    load();
  }, [load]);

  if (st.loading) {
    return (
      <div className="gatewrap">
        <p className="lead">Loading your dashboard…</p>
      </div>
    );
  }
  if (st.viewGate) return <ViewGate reason={st.viewGate} />;
  if (!st.user) return <Gate notConfigured={st.notConfigured} />;

  const pending = st.payouts.filter((x) => x.status === 'pending').reduce((a, x) => a + Number(x.amount || 0), 0);
  const name = st.creator.full_name || '';
  const missing = !viewAs && profileMissing(st.creator);
  const side = viewAs
    ? [{ href: base, icon: 'd-flag', label: 'Overview' }, { href: `${base}/payouts`, icon: 'd-coin', label: 'Payouts' }]
    : SIDE;

  async function logout() {
    await getSupabase().auth.signOut();
    router.push('/');
  }

  return (
    <DashCtx.Provider value={{ ...st, reload: load, base, readOnly: !!viewAs, profileMissing: missing, openProfile: () => setProfileOpen(true) }}>
      <div className="page">
        <div className="nav">
          <Link href="/" className="logo">
            <svg className="dblogo" viewBox="0 0 164 40">
              <use href="#dblogo" />
            </svg>
            <b>Maverick</b>
          </Link>
          <div className="links">
            <Link href="/">Home</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/help">Help</Link>
            <Link href={base} style={{ color: 'var(--coral)', fontWeight: 600 }}>
              Dashboard
            </Link>
          </div>
          <div className="right navright">
            <Bell submissions={st.submissions} base={base} />
            <div className="wallet-pill" title="Pending payout">
              <Icon name="d-wallet" style={{ width: '20px', height: '20px', color: 'var(--coral)' }} />
              <span className="tnum">{money(pending)}</span>
              <span className="plab">pending</span>
            </div>
            <button className="avatar" onClick={() => !viewAs && setProfileOpen(true)} aria-label="My profile" title={viewAs ? name : 'My profile'}>
              {(name[0] || 'M').toUpperCase()}
            </button>
          </div>
        </div>
        <div className="dash">
          <aside className="side">
            <nav>
              {side.map((s) => (
                <Link key={s.href} href={s.href} className={path === s.href ? 'on' : ''}>
                  <Icon name={s.icon} className="thin" />
                  {s.label}
                </Link>
              ))}
              {!viewAs && (
                <a onClick={logout} role="button">
                  <Icon name="d-person" className="thin" />
                  Log out
                </a>
              )}
            </nav>
          </aside>
          <div className="dmain">
            {viewAs && (
              <div className="alert" style={{ marginBottom: '24px' }}>
                <Icon name="d-eye" style={{ color: 'var(--coral)' }} />
                <div>
                  <b>You&apos;re viewing {name || 'this creator'}&apos;s dashboard as the Maverick team.</b>
                  <p>Exactly what they see, read only. Nothing here can be changed.</p>
                </div>
              </div>
            )}
            {st.error && (
              <div className="alert err" style={{ marginBottom: '24px' }}>
                <Icon name="d-alert" style={{ color: 'var(--no)' }} />
                <div>
                  <b>We could not load everything.</b>
                  <p>{st.error.message}</p>
                </div>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
      {/* name + email are compulsory: until they're in, this stays up and opens the profile */}
      {missing && !profileOpen && <ProfilePrompt onAdd={() => setProfileOpen(true)} />}
      {profileOpen && (
        <ProfileModal
          creator={st.creator}
          user={st.user}
          onClose={() => setProfileOpen(false)}
          onSaved={async () => {
            await load();
            setProfileOpen(false);
          }}
        />
      )}
    </DashCtx.Provider>
  );
}

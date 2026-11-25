'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { getSupabase } from '@/lib/supabase';

const EMAIL = /^\S+@\S+\.\S+$/;

/* name + email are compulsory before a creator can submit a video */
export function profileMissing(creator) {
  return !String((creator && creator.full_name) || '').trim() || !EMAIL.test(String((creator && creator.email) || '').trim());
}

function phoneOf(creator, user) {
  const p = (creator && creator.phone) || (user && user.phone) || '';
  return p ? '+' + String(p).replace(/^\+/, '') : '';
}

/* "My profile": name and email can be added or changed; the number is the login, so it is shown only */
export function ProfileModal({ creator, user, onClose, onSaved }) {
  const [f, setF] = useState({ full_name: creator.full_name || '', email: creator.email || '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  async function save() {
    if (!f.full_name.trim()) return setErr('Tell us your name.');
    if (!EMAIL.test(f.email.trim())) return setErr('That email does not look right.');
    setBusy(true);
    setErr('');
    const { error } = await getSupabase()
      .from('maverick_creators')
      .update({ full_name: f.full_name.trim(), email: f.email.trim(), updated_at: new Date().toISOString() })
      .eq('id', creator.id);
    setBusy(false);
    if (error) return setErr("Couldn't save: " + error.message);
    onSaved();
  }

  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    setErr('');
  };
  return (
    <div className="pm-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pm" role="dialog" aria-modal="true" aria-labelledby="pm-title">
        <button className="pm-x" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3 id="pm-title">My profile</h3>
        <p className="pm-sub">We email you when your video is approved and when you get paid.</p>
        <label className="field">
          <span className="lbl">Name</span>
          <input className="inp" value={f.full_name} onChange={set('full_name')} placeholder="Your full name" autoFocus />
        </label>
        <label className="field">
          <span className="lbl">Email</span>
          <input className="inp" type="email" value={f.email} onChange={set('email')} placeholder="you@example.com" />
        </label>
        <label className="field">
          <span className="lbl">Mobile number</span>
          <input className="inp tnum" value={phoneOf(creator, user)} readOnly />
          <span className="pm-note">This is your login number, so it can&apos;t be changed here.</span>
        </label>
        {err && (
          <p className="errtext">
            <Icon name="d-alert" />
            {err}
          </p>
        )}
        <button className="btn" style={{ width: '100%', marginTop: '8px' }} onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

/* shown on the dashboard until name + email are in: it can't be skipped */
export function ProfilePrompt({ onAdd }) {
  return (
    <div className="pm-back">
      <div className="pm pm-prompt" role="alertdialog" aria-modal="true" aria-labelledby="pp-title">
        <div className="pm-bell">
          <Icon name="d-bell" style={{ width: '30px', height: '30px', color: 'var(--coral)' }} />
        </div>
        <h3 id="pp-title">Add your name and email</h3>
        <p className="pm-sub">
          You need them before you submit a video. We send your approvals and payment updates to this email.
        </p>
        <button className="btn" style={{ width: '100%' }} onClick={onAdd} autoFocus>
          Add now
        </button>
      </div>
    </div>
  );
}

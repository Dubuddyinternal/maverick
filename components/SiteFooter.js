'use client';

import Link from 'next/link';
import { CFG } from '@/lib/config';
import { useSignedIn } from '@/lib/useSignedIn';

export default function SiteFooter() {
  const signedIn = useSignedIn();
  return (
    <div className="foot orange">
      <div className="fbrand">
        <svg className="dblogo" viewBox="0 0 164 40" style={{ height: '30px' }}>
          <use href="#dblogo" />
        </svg>
        <p>Maverick by Dubuddy. Get paid for the videos you already make.</p>
      </div>
      <div className="fcols">
        <div className="fcol">
          <b>Maverick</b>
          <Link href="/">Home</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/help">Help</Link>
        </div>
        <div className="fcol">
          <b>Creators</b>
          {signedIn === false && <Link href="/login">Log in</Link>}
          <Link href={signedIn ? '/dashboard' : '/login'}>{signedIn ? 'My dashboard' : 'Start earning'}</Link>
          <Link href="/how-it-works#demo-videos">Demo videos</Link>
          <a href={`mailto:${CFG.supportEmail}`}>{CFG.supportEmail}</a>
        </div>
        <div className="fcol">
          <b>Dubuddy</b>
          <a href="https://dubuddy.in/cuet-ug/cuet-previous-year-question-papers" target="_blank" rel="noopener noreferrer">Dubuddy PYQs</a>
          <a href="https://dubuddy.in/cuet-mock-test" target="_blank" rel="noopener noreferrer">Dubuddy Mocks</a>
          <a href="https://www.instagram.com/dubuddy.in" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.youtube.com/@dubuddy" target="_blank" rel="noopener noreferrer">YouTube</a>
        </div>
      </div>
      <div className="fbase">
        <span>{'©'} {new Date().getFullYear()} Dubuddy</span>
        <span>Terms</span>
        <span>Privacy</span>
        <a href={`mailto:${CFG.supportEmail}`}>Contact</a>
        <span style={{ marginLeft: 'auto' }}>Helping Students Since 2020</span>
      </div>
    </div>
  );
}

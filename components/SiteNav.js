'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSignedIn } from '@/lib/useSignedIn';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/help', label: 'Help' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function SiteNav() {
  const path = usePathname();
  const signedIn = useSignedIn();
  return (
    <div className="nav">
      <Link href="/" className="logo">
        <svg className="dblogo" viewBox="0 0 164 40">
          <use href="#dblogo" />
        </svg>
        <b>Maverick</b>
      </Link>
      <div className="links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} style={path === l.href ? { color: 'var(--coral)' } : undefined}>
            {l.label}
          </Link>
        ))}
      </div>
      <div className="right">
        {signedIn === false && (
          <Link href="/login" className="linkbtn">
            Log in
          </Link>
        )}
        <Link href={signedIn ? '/dashboard' : '/login'} className="btn sm">
          {signedIn ? 'My dashboard' : 'Start earning'}
        </Link>
      </div>
    </div>
  );
}

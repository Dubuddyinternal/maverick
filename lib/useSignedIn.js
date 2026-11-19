'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

/* true / false once known, null until then (so "Log in" never flashes for a signed-in creator) */
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState(null);
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return setSignedIn(false);
    sb.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = sb.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

import { Session } from '@supabase/supabase-js';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { getMockAuthenticated } from '@/lib/mock-auth';
import { supabase } from '@/lib/supabase';

export default function Index() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // TODO: replace with real Supabase auth - remove mock check, use only Supabase session
    if (getMockAuthenticated()) {
      setSession({} as Session);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return null;
  }

  if (getMockAuthenticated()) {
    return <Redirect href="/(tabs)/profile" />;
  }
  if (session?.user) {
    const hasCompletedSignup = !!session.user.user_metadata?.first_name;
    return (
      <Redirect href={hasCompletedSignup ? '/(tabs)/profile' : '/finish-signup'} />
    );
  }

  // Logged out: always redirect to login, never allow access to tabs
  return <Redirect href="/login" />;
}

import { useState, useEffect, useCallback } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabase';
import { analytics } from '../utils/analytics';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  // Handle incoming deep links for magic link auth
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      if (!url) return;

      // Extract tokens from URL fragment (Supabase appends #access_token=...&refresh_token=...)
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return;

      const fragment = url.substring(hashIndex + 1);
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    };

    // Handle URL that launched the app (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Handle URLs while app is open (warm start)
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    const redirectTo = Linking.createURL('/auth/callback');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
    analytics.sharingSignInStarted();
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    analytics.sharingSignInCompleted();
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    analytics.sharingSignedOut();
  }, []);

  return { user, loading, signInWithOtp, verifyOtp, signOut };
}

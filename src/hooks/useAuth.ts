import { useState, useEffect, useCallback } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabase';
import { analytics } from '../utils/analytics';
import type { User } from '@supabase/supabase-js';

const redirectTo = Linking.createURL('/');

const createSessionFromUrl = async (url: string) => {
  const parsed = Linking.parse(url);
  const params = parsed.queryParams ?? {};
  const errorCode = params.error_code as string | undefined;
  if (errorCode) throw new Error(errorCode);

  const access_token = params.access_token as string | undefined;
  const refresh_token = params.refresh_token as string | undefined;
  if (!access_token || !refresh_token) return;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
};

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
  const url = Linking.useURL();
  useEffect(() => {
    if (url) {
      createSessionFromUrl(url);
    }
  }, [url]);

  const signInWithOtp = useCallback(async (email: string) => {
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

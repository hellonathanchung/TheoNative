import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase, supabaseUrl } from '../utils/supabase';
import type { User } from '@supabase/supabase-js';

/** Decode the email claim from a JWT payload without signature verification (display-only). */
function getEmailFromJwt(token: string): string | undefined {
  try {
    const [, payloadB64] = token.split('.');
    // Replace URL-safe base64 chars and pad if needed
    const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    const payload = JSON.parse(json);
    return payload.email as string | undefined;
  } catch {
    return undefined;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep a ref so the deep-link handler always sees the latest user without stale closure
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
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

  /** Process a magic-link URL and establish a Supabase session from its tokens. */
  const processDeepLink = useCallback(async (url: string) => {
    const parsed = Linking.parse(url);
    const params = parsed.queryParams ?? {};
    const errorCode = params.error_code as string | undefined;
    if (errorCode) {
      Alert.alert('Sign-In Error', errorCode.replace(/_/g, ' '));
      return;
    }

    const access_token = params.access_token as string | undefined;
    const refresh_token = params.refresh_token as string | undefined;
    if (!access_token || !refresh_token) return;

    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) {
      Alert.alert('Sign-In Error', error.message);
    }
  }, []);

  // Track the last URL we processed to avoid double-handling the same link
  const processedUrlRef = useRef<string | null>(null);
  const url = Linking.useURL();

  useEffect(() => {
    if (!url || url === processedUrlRef.current) return;

    const parsed = Linking.parse(url);
    const params = parsed.queryParams ?? {};
    const access_token = params.access_token as string | undefined;

    // Only act on URLs that carry auth tokens
    if (!access_token) return;

    processedUrlRef.current = url;

    const currentUser = userRef.current;
    const linkEmail = getEmailFromJwt(access_token);

    if (currentUser && linkEmail && currentUser.email !== linkEmail) {
      // Magic link is for a different account — ask before switching
      Alert.alert(
        'Switch Account?',
        `You're signed in as ${currentUser.email}.\n\nThis link signs you in as ${linkEmail}. Switch accounts?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch',
            style: 'destructive',
            onPress: () => processDeepLink(url),
          },
        ],
      );
    } else {
      processDeepLink(url);
    }
  }, [url, processDeepLink]);

  const signInWithOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
    });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase(),
      token,
      type: 'email',
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const deleteAccount = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not signed in');

    const response = await fetch(
      `${supabaseUrl}/functions/v1/delete-account`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to delete account');
    }

    await supabase.auth.signOut();
  }, []);

  return { user, loading, signInWithOtp, verifyOtp, signOut, deleteAccount };
}

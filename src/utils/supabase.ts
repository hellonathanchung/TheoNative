import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { createMMKV } from 'react-native-mmkv';
import Constants from 'expo-constants';

const mmkv = createMMKV();

const SUPABASE_AUTH_KEY = 'theo_supabase_auth';

/**
 * MMKV-backed storage adapter for Supabase Auth.
 * Implements the Supabase `SupportedStorage` interface.
 */
const mmkvStorage = {
  getItem: (key: string): string | null => {
    return mmkv.getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    mmkv.set(key, value);
  },
  removeItem: (key: string): void => {
    mmkv.remove(key);
  },
};

const extra = Constants.expoConfig?.extra ?? {};
// Primary: app.config.ts extra (native builds via EAS)
// Fallback: EXPO_PUBLIC_ env vars (auto-injected by Metro on all platforms, including web)
const supabaseUrl =
  (extra.supabaseUrl as string) ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  '';
const supabaseAnonKey =
  (extra.supabaseAnonKey as string) ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

let supabase: ReturnType<typeof createClient>;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: mmkvStorage,
      storageKey: SUPABASE_AUTH_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} catch (e) {
  console.warn('Supabase init failed (missing env vars?):', e);
  // Placeholder client so the module doesn't crash the import chain.
  // API calls will fail gracefully; all consumers already handle errors.
  supabase = createClient('https://placeholder.supabase.co', 'placeholder', {
    auth: {
      storage: mmkvStorage,
      storageKey: SUPABASE_AUTH_KEY,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
export { supabase };

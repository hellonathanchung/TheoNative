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
// On web dev, Constants.expoConfig.extra may be empty — fall back to process.env
const supabaseUrl =
  (extra.supabaseUrl as string) ||
  process.env.SUPABASE_URL ||
  'https://xmdciilpqxyhfocpntqx.supabase.co';
const supabaseAnonKey =
  (extra.supabaseAnonKey as string) ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZGNpaWxwcXh5aGZvY3BudHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTc2NDUsImV4cCI6MjA4OTE5MzY0NX0.IjxCW625uhIo2P4g3LEUuQA0RNDtwtn8AAwBfnbqpJU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: mmkvStorage,
    storageKey: SUPABASE_AUTH_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

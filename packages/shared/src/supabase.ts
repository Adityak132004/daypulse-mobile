import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Storage interface compatible with AsyncStorage (getItem, setItem, removeItem). */
export type AuthStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export type SupabaseClientOptions = {
  url: string;
  anonKey: string;
  storage?: AuthStorage;
};

export function createSupabaseClient(options: SupabaseClientOptions): SupabaseClient {
  const { url, anonKey, storage } = options;
  if (!url?.trim()) {
    throw new Error(
      'Supabase URL is required. Add a .env file in your app directory (apps/consumer or apps/gym) with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  if (!anonKey?.trim()) {
    throw new Error(
      'Supabase anon key is required. Add a .env file in your app directory with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return createClient(url, anonKey, {
    auth: {
      ...(storage ? { storage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

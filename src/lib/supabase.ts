import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface SavedPosition {
  id: string;
  user_id: string;
  name: string;
  position_data: Json;
  created_at: string;
  updated_at: string;
}

let _client: SupabaseClient | null = null;

/**
 * Returns the Supabase client, or null if:
 *  - running on the server (SSR/prerender) where window is undefined, or
 *  - env vars are not configured yet.
 * This prevents build-time crashes during static prerendering.
 */
export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key);
  return _client;
}

// Convenience alias for hooks — same null-safety, just shorter to import.
// Must only be called from client-side code (inside useEffect, event handlers, etc.)
export { getSupabase as supabase };

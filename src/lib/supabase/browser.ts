import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing.');
  }

  const storage = typeof window === 'undefined' ? undefined : window.localStorage;

  browserClient = createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      storageKey: 'swaply.auth',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage,
    },
    global: {
      headers: {
        'x-application-name': 'swaply-web',
      },
    },
  });

  return browserClient;
}

// Export cu tip pentru utilizare în aplicație
export type BrowserSupabaseClient = ReturnType<typeof getBrowserSupabase>;
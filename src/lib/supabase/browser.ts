import { createClient, SupabaseClient } from '@supabase/supabase-js';
// Use stub types until migrations 014-019 are applied
// TODO: After migrations, regenerate: npx supabase gen types typescript --linked
import type { Database } from './database.types.stub';

// Singleton instance pentru a preveni multiple GoTrueClient instances
let browserClient: SupabaseClient<Database> | null = null;

// Obține clientul Supabase pentru browser (SINGLETON PATTERN)
export function getBrowserSupabase() {
  // Returnează instanța existentă dacă există deja
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  // Crează instanța DOAR o singură dată
  browserClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'swaply-auth', // Consistent storage key
    },
    global: {
      headers: {
        'X-Client-Info': 'swaply-web'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  return browserClient;
}

// Export cu tip pentru utilizare în aplicație
export type BrowserSupabaseClient = ReturnType<typeof getBrowserSupabase>;
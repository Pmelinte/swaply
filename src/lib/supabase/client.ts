import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function getBrowserSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
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
    }
  );
}

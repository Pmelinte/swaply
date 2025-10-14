import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types.stub';

export function getBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Export cu tip pentru utilizare în aplicație
export type BrowserSupabaseClient = ReturnType<typeof getBrowserSupabase>;
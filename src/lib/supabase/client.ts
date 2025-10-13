// DEPRECATED: Use @/lib/supabase/browser.ts instead
// This file exists for backwards compatibility only
// All new code should import from browser.ts

export { getBrowserSupabase, getBrowserSupabase as createClient } from './browser';
export type { BrowserSupabaseClient as SupabaseClient } from './browser';

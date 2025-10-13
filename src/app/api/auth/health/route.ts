import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const startTime = Date.now();
  
  // Create minimal Supabase client for health check
  const response = NextResponse.json({ status: 'checking' });
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')
            ?.split('; ')
            .find((c) => c.startsWith(`${name}=`))
            ?.split('=')[1];
        },
        set() {}, // No-op for health check
        remove() {}, // No-op for health check
      },
    }
  );

  // Check Supabase connection
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  
  // Check environment variables
  const envCheck = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    googleClientId: !!process.env.GOOGLE_CLIENT_ID,
  };

  const responseTime = Date.now() - startTime;

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    auth: {
      supabaseConnected: !sessionError,
      hasSession: !!session,
      sessionError: sessionError?.message,
    },
    environment: envCheck,
    allConfigured: Object.values(envCheck).every(Boolean),
  });
}

export const dynamic = 'force-dynamic';

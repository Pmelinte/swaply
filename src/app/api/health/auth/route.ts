import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Health check endpoint for authentication system
 * Returns configuration and last known auth events
 * 
 * GET /api/health/auth
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Check PKCE configuration
    const pkceConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Check for auth cookies (Supabase session)
    const authCookies = cookieStore.getAll().filter(cookie => 
      cookie.name.startsWith('sb-') || 
      cookie.name.includes('auth-token')
    );

    // Check localStorage configuration (client-side only, so we report config)
    const storageConfig = {
      storageKey: 'swaply.auth',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageType: 'localStorage'
    };

    // Read last auth events from log file (if exists)
    let lastAuthEvents: unknown[] = [];
    try {
      const fs = await import('fs');
      const path = await import('path');
      const logPath = path.join(process.cwd(), '.logs', 'auth-callback.log');
      
      if (fs.existsSync(logPath)) {
        const logContent = fs.readFileSync(logPath, 'utf-8');
        const lines = logContent.trim().split('\n').filter(Boolean);
        lastAuthEvents = lines.slice(-5).map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { raw: line };
          }
        });
      }
      } catch {
        // Log file not accessible or doesn't exist
        lastAuthEvents = [];
      }    // Check environment configuration
    const envConfig = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      supabaseKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      logAuthCallbackEnabled: process.env.NEXT_PUBLIC_LOG_AUTH_CALLBACK === '1',
      cloudinaryConfigured: Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL
    };

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      auth: {
        pkceConfigured,
        storageConfig,
        sessionCookiesCount: authCookies.length,
        lastAuthEvents: lastAuthEvents.length > 0 ? lastAuthEvents : undefined
      },
      environment: envConfig
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

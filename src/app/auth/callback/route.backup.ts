import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

/**
 * Auth Callback Handler - Supports PKCE (OAuth) and Token (Magic Link) flows
 * Handles: Google OAuth, Magic Link, Phone OTP
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") ?? "/";
  const error = url.searchParams.get("error");
  const error_description = url.searchParams.get("error_description");

  console.log('🔍 Auth callback params:', { code: !!code, token_hash: !!token_hash, type });

  // Handle error from Supabase
  if (error) {
    console.error('🔴 Auth callback error:', error, error_description);
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent(error_description || error)}`
    );
  }

  // Handle both PKCE code flow AND magic link token flow
  if (code || token_hash) {
    try {
      // Create response first
      const response = NextResponse.redirect(`${url.origin}${next}`);
      
      // Create Supabase client with cookie handling that uses NextResponse
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.headers.get('cookie')?.split('; ')
                .find(c => c.startsWith(`${name}=`))
                ?.split('=')[1];
            },
            set(name: string, value: string, options: any) {
              response.cookies.set({
                name,
                value,
                ...options,
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              });
            },
            remove(name: string, options: any) {
              response.cookies.set({
                name,
                value: '',
                maxAge: 0,
                ...options,
              });
            },
          },
        }
      );

      const { data, error: exchangeError } = code 
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.verifyOtp({ 
            token_hash: token_hash!, 
            type: type as any 
          });
      
      if (exchangeError) {
        console.error('🔴 Exchange code error:', exchangeError);
        return NextResponse.redirect(
          `${url.origin}/login?error=${encodeURIComponent(exchangeError.message)}`
        );
      }

      if (!data.session) {
        console.error('🔴 No session created');
        return NextResponse.redirect(
          `${url.origin}/login?error=no_session_created`
        );
      }

      console.log('✅ Auth callback successful, user:', data.user?.email);
      
      // Response already created with cookies set by Supabase client
      return response;
    } catch (err) {
      console.error('🔴 Unexpected auth error:', err);
      return NextResponse.redirect(
        `${url.origin}/login?error=unexpected_error`
      );
    }
  }

  // No code or token provided, redirect to login
  console.log('🔴 No code or token in callback URL');
  return NextResponse.redirect(`${url.origin}/login?error=no_auth_data_provided`);
}

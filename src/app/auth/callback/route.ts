import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";

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
      const cookieStore = await cookies();
      
      // Create Supabase client with proper cookie handling for PKCE
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              try {
                cookieStore.set({ name, value, ...options });
              } catch (error) {
                // Cookie is read-only in server components during render
                console.log('Cookie set deferred:', name);
              }
            },
            remove(name: string, options: any) {
              try {
                cookieStore.set({ name, value: "", maxAge: 0, ...options });
              } catch (error) {
                console.log('Cookie remove deferred:', name);
              }
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
      
      // Create response with redirect
      const response = NextResponse.redirect(`${url.origin}${next}`);
      
      // Set all session cookies explicitly
      if (data.session) {
        // Set the session in cookies
        response.cookies.set({
          name: 'sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0] + '-auth-token',
          value: JSON.stringify(data.session),
          httpOnly: false,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        });
      }
      
      // Set flag for just logged in
      response.cookies.set('swaply_just_logged_in', 'true', {
        maxAge: 10,
        path: '/',
        httpOnly: false,
      });
      
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

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const error = url.searchParams.get("error");
  const error_description = url.searchParams.get("error_description");

  // Handle error from Supabase
  if (error) {
    console.error('🔴 Auth callback error:', error, error_description);
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent(error_description || error)}`
    );
  }

  if (code) {
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

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
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
      
      // Set session cookie explicitly
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

  // No code provided, redirect to login
  console.log('🔴 No code in callback URL');
  return NextResponse.redirect(`${url.origin}/login?error=no_code_provided`);
}

import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

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
      const supabase = await getServerSupabase();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('🔴 Exchange code error:', exchangeError);
        return NextResponse.redirect(
          `${url.origin}/login?error=${encodeURIComponent(exchangeError.message)}`
        );
      }

      console.log('✅ Auth callback successful, redirecting to:', next);
      
      // Set flag for successful login
      const response = NextResponse.redirect(`${url.origin}${next}`);
      response.cookies.set('swaply_just_logged_in', 'true', {
        maxAge: 10, // 10 seconds
        path: '/',
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
  return NextResponse.redirect(`${url.origin}/login`);
}

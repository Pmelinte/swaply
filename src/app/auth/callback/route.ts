import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

/**
 * Auth Callback Handler - Supports PKCE (OAuth) and Token (Magic Link) flows
 * Handles: Google OAuth, Magic Link, Phone OTP
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error_description");

  if (error) {
    console.error("🔴 Auth callback error:", error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`
    );
  }

  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  let sessionData;

  if (code) {
    console.log("🔍 Auth callback: Exchanging code for session...");
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );
    if (exchangeError) {
      console.error("🔴 Exchange code error:", exchangeError.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }
    sessionData = data;
  } else if (token_hash && type) {
    console.log(`🔍 Auth callback: Verifying OTP with type "${type}"...`);
    const { data, error: otpError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any, // email or phone
    });
    if (otpError) {
      console.error("🔴 OTP verification error:", otpError.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(otpError.message)}`
      );
    }
    sessionData = data;
  } else {
    console.error("🔴 Auth callback: No code or token_hash provided.");
    return NextResponse.redirect(
      `${origin}/login?error=auth_params_missing`
    );
  }

  if (!sessionData?.session) {
    console.error("🔴 Auth callback: No session created after exchange/verify.");
    return NextResponse.redirect(
      `${origin}/login?error=session_creation_failed`
    );
  }

  console.log(
    "✅ Auth callback successful, user:",
    sessionData.user?.email,
    "Redirecting to:",
    next
  );
  return NextResponse.redirect(`${origin}${next}`);
}

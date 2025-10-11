import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await getServerSupabase();

    // Try to sign out from Supabase - ignore errors if session doesn't exist
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Log but don't fail - session might already be gone
      console.log('Logout note:', error.message || 'Session already cleared');
    }

    // Create response with cache control headers to prevent caching
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}?message=logout_success&t=${Date.now()}`,
      { status: 302 }
    );

    // Clear all auth-related cookies
    response.cookies.set('sb-access-token', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    response.cookies.set('sb-refresh-token', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    return response;
  } catch (error) {
    console.error('Unexpected logout error:', error);
    // Fallback redirect even on error
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}?message=logout_success&t=${Date.now()}`,
      { status: 302 }
    );
    return response;
  }
}

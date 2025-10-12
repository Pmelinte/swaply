import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session for all requests to ensure fresh auth state
  const { data: { session }, error } = await supabase.auth.getSession();

  // Log session refresh for debugging
  if (req.nextUrl.pathname.startsWith('/auth/callback')) {
    console.log('🔄 Middleware: Processing auth callback');
  }

  if (error) {
    console.error('🔴 Middleware auth error:', error);
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/profil', '/obiecte/nou', '/cereri', '/chat', '/match'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Run on all routes to ensure session is always fresh
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

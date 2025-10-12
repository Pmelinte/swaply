import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie in request for current request
          req.cookies.set({
            name,
            value,
            ...options,
          });
          // Set cookie in response for future requests
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie in request
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          // Remove cookie in response
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Skip session check for auth callback to prevent interference
  if (req.nextUrl.pathname === '/auth/callback') {
    console.log('🔄 Middleware: Skipping session check for auth callback');
    return response;
  }

  // Refresh session for all other requests
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('🔴 Middleware auth error:', error);
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/profil', '/obiecte/nou', '/cereri', '/chat', '/match', '/schimb'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

// Run on all routes to ensure session is always fresh
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

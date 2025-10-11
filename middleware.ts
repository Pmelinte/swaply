import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Only refresh session for protected routes or auth-related routes
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth') ||
                     req.nextUrl.pathname.startsWith('/logout') ||
                     req.nextUrl.pathname.includes('/add') ||
                     req.nextUrl.pathname.includes('/my-objects');

  if (isAuthRoute) {
    const supabase = createMiddlewareClient({ req, res });
    await supabase.auth.getSession();
  }

  return res;
}

// Rulează măcar pe rutele noastre
export const config = {
  matcher: ["/", "/login", "/add", "/my-objects", "/auth/:path*", "/logout"]
};

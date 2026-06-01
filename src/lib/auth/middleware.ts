import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

/**
 * Auth gate (MongoDB + JWT edition).
 *
 * Replaces the former Supabase session refresh. Reads the signed session
 * cookie, verifies it with jose (Edge-compatible), and redirects
 * unauthenticated users away from protected routes. Authenticated users are
 * bounced off the login/signup pages.
 *
 * NOTE: admin role enforcement (previously a Supabase `admins` lookup) is not
 * yet reimplemented on MongoDB — /admin is gated as a normal protected route
 * for now. Re-add a role check when an admins collection exists.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const userId = await verifyToken(token);

  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");
  const isProtectedRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/admin") ||
    path.startsWith("/lesson") ||
    path.startsWith("/portfolio") ||
    path.startsWith("/settings") ||
    path.startsWith("/learn") ||
    path.startsWith("/schedule") ||
    path.startsWith("/tutoring") ||
    path.startsWith("/compliance/cnis");

  if (!userId && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (userId && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

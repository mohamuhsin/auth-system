import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ============================================================
   🧩 Shared Cookie + Auth Middleware
   ------------------------------------------------------------
   • Enforces protected routes
   • Persists Firebase session cookie across Iventics subdomains
   • Redirects logged-in users away from auth pages
============================================================ */

const SESSION_COOKIE =
  process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || "__Secure-iventics_session";

/**
 * 🪶 Publicly accessible routes (no session required)
 */
const PUBLIC_PATHS = [
  "/", // Landing page
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

/**
 * 🚦 Core Middleware Logic
 */
export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  const hasSession = req.cookies.has(SESSION_COOKIE);

  // ✅ Allow public, static, and API routes
  const isPublicRoute =
    PUBLIC_PATHS.includes(normalizedPath) ||
    normalizedPath.startsWith("/api") ||
    normalizedPath.startsWith("/_next") ||
    /\.(ico|svg|png|jpg|jpeg|gif|webp|avif)$/.test(normalizedPath);

  if (isPublicRoute) {
    // 🚫 Prevent authenticated users from revisiting auth pages
    if (
      hasSession &&
      ["/login", "/signup", "/forgot-password", "/reset-password"].includes(
        normalizedPath
      )
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  // 🔒 Protect all other routes
  if (!hasSession) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ Session valid → continue
  return NextResponse.next();
}

/**
 * ⚙️ Matcher Config
 * Exclude static assets and Next.js internals
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};

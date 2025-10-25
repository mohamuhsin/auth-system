import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 🧩 Shared Cookie + Routes Config
 * ------------------------------------------------------------
 * Ensures session persistence across Iventics subdomains.
 */
const SESSION_COOKIE = "__Secure-iventics_session";

const PUBLIC_PATHS = [
  "/", // Landing
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

/**
 * 🚦 Middleware Logic
 * ------------------------------------------------------------
 * Handles:
 *  - Allowing public/static routes
 *  - Redirecting authenticated users away from /login, /signup, etc.
 *  - Redirecting unauthenticated users to /login
 */
export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  const hasSession = req.cookies.has(SESSION_COOKIE);

  // ✅ Allow internal/static/API routes
  const isPublicRoute =
    PUBLIC_PATHS.includes(normalizedPath) ||
    normalizedPath.startsWith("/api") ||
    normalizedPath.startsWith("/_next") ||
    /\.(ico|svg|png|jpg|jpeg|gif|webp|avif)$/.test(normalizedPath);

  if (isPublicRoute) {
    // 🚫 If already authenticated, redirect away from auth pages
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
 * ------------------------------------------------------------
 * - Excludes _next, images, and all static assets
 * - Works seamlessly on multi-domain setups
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ============================================================
   🧩 Auth Middleware — Level 2.0 (Cross-domain + Secure)
   ------------------------------------------------------------
   • Enforces protected routes
   • Persists Firebase session cookie across subdomains
   • Redirects logged-in users away from auth pages
============================================================ */

const SESSION_COOKIE =
  process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || "__Secure-iventics_session";

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

  // ✅ Normalize path safely (ensure "/" stays "/")
  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  // 🔐 Check session presence
  const cookieHeader = req.headers.get("cookie") || "";
  const hasSession =
    req.cookies.has(SESSION_COOKIE) || cookieHeader.includes(SESSION_COOKIE);

  // ✅ Public route whitelist + static assets
  const isPublicRoute =
    PUBLIC_PATHS.includes(path) ||
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    /\.(ico|svg|png|jpg|jpeg|gif|webp|avif)$/.test(path);

  if (isPublicRoute) {
    // 🚫 Prevent logged-in users from revisiting auth pages
    if (
      hasSession &&
      ["/login", "/signup", "/forgot-password", "/reset-password"].includes(
        path
      )
    ) {
      if (process.env.NODE_ENV === "development")
        console.log("🔁 Redirecting logged-in user to /dashboard");
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  // 🔒 Require session for all other routes
  if (!hasSession) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("from", pathname);
    if (process.env.NODE_ENV === "development")
      console.log("🚫 No session found → redirecting to login");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * ⚙️ Matcher Config — exclude static assets & Next.js internals
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};

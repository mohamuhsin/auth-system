import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ============================================================
   🧩 Auth Middleware — Level 2.1 (Cross-domain Safe)
   ------------------------------------------------------------
   • Does NOT read HttpOnly Firebase cookies
   • Lets frontend AuthProvider handle validation
   • Redirects logged-in users away from auth pages only
============================================================ */

const SESSION_COOKIE =
  process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || "__Secure-iventics_session";

const AUTH_PAGES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ⛔ Skip Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|avif)$/)
  ) {
    return NextResponse.next();
  }

  // ✅ Normalize path
  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  // ✅ Check only if cookie exists
  const cookieHeader = req.headers.get("cookie") || "";
  const hasSession = cookieHeader.includes(SESSION_COOKIE);

  // 🚫 Redirect logged-in users away from auth pages
  if (hasSession && AUTH_PAGES.includes(path)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

/**
 * ⚙️ Matcher Config
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};

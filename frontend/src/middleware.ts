import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ============================================================
   🧩 Auth Middleware — Level 2.1 (Cross-domain Safe)
   ------------------------------------------------------------
   • Does NOT try to read HttpOnly Firebase cookies (unreadable across subdomains)
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

/**
 * 🚦 Middleware Logic
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Normalize path safely
  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  // ✅ Check only cookie presence (not validity)
  const cookieHeader = req.headers.get("cookie") || "";
  const hasSession = cookieHeader.includes(SESSION_COOKIE);

  // 🚫 Prevent logged-in users from revisiting auth pages
  if (hasSession && AUTH_PAGES.includes(path)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ✅ Let everything else pass (frontend handles protection)
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

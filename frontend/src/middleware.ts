import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ============================================================
   🧩 Auth Middleware — Level 2.2 (Cross-Domain + Session-Aware)
   ------------------------------------------------------------
   • Never attempts to read HttpOnly cookies directly.
   • Allows AuthProvider (client-side) to validate Firebase session.
   • Only redirects logged-in users away from auth pages.
   • Safe across sub-domains (e.g., pay.iventics.com ↔ auth.iventics.com)
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

// Optionally mark dashboard as “private root” (used for quick routing)
const DASHBOARD_PATH = "/dashboard";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ⛔ Ignore Next.js internals, APIs, and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|avif)$/)
  ) {
    return NextResponse.next();
  }

  // ✅ Normalize path (remove trailing slash except root)
  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  // ✅ Detect if session cookie is present
  const cookieHeader = req.headers.get("cookie") || "";
  const hasSession = cookieHeader.includes(`${SESSION_COOKIE}=`);

  /* ============================================================
     🚦 Routing Logic
  ============================================================ */

  // 🚫 Redirect logged-in users away from auth pages
  if (hasSession && AUTH_PAGES.includes(path)) {
    const url = new URL(DASHBOARD_PATH, req.url);
    return NextResponse.redirect(url);
  }

  // (Optional future use)
  // If you later want to *protect private routes* purely server-side,
  // you could check here:
  //
  // if (!hasSession && path.startsWith("/dashboard")) {
  //   return NextResponse.redirect(new URL("/login", req.url));
  // }

  return NextResponse.next();
}

/* ============================================================
   ⚙️ Matcher Config
   ------------------------------------------------------------
   • Matches every page except:
       - Next.js internals
       - Static assets
       - API routes
============================================================ */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};

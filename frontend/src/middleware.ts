import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE =
  process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || "__Secure-iventics_session";

const AUTH_PAGES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const PROTECTED_PATHS = [
  "/dashboard",
  "/account",
  "/settings",
  "/profile",
  "/projects",
]; // add more protected routes as needed

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🧱 Skip static, API, and asset routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|avif|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  const cookieHeader = req.headers.get("cookie") || "";
  const hasSession = cookieHeader.includes(`${SESSION_COOKIE}=`);

  /* ============================================================
     🟢 Authenticated — Redirect away from auth pages
     ------------------------------------------------------------
     e.g. user already logged in → visiting /login → go to /dashboard
  ============================================================ */
  if (hasSession && AUTH_PAGES.includes(path)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  /* ============================================================
     🔒 Unauthenticated — Block protected pages
     ------------------------------------------------------------
     e.g. no cookie → visiting /dashboard → redirect to /login
  ============================================================ */
  if (!hasSession && PROTECTED_PATHS.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

/* ============================================================
   ⚙️ Matcher — Exclude static assets from middleware
============================================================ */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|css|js)$).*)",
  ],
};

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

  // Allow static files and API routes
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

  // 🟢 Authenticated → Redirect away from auth pages
  if (hasSession && AUTH_PAGES.includes(path)) {
    const url = new URL("/dashboard", req.url);
    return NextResponse.redirect(url);
  }

  // 🔒 Unauthenticated → Block protected pages
  if (!hasSession && PROTECTED_PATHS.some((p) => path.startsWith(p))) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|css|js)$).*)",
  ],
};

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

const DASHBOARD_PATH = "/dashboard";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|avif)$/)
  ) {
    return NextResponse.next();
  }

  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  const cookieHeader = req.headers.get("cookie") || "";
  const hasSession = cookieHeader.includes(`${SESSION_COOKIE}=`);

  if (hasSession && AUTH_PAGES.includes(path)) {
    const url = new URL(DASHBOARD_PATH, req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};

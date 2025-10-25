import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 🧩 Shared Cookie + Routes Config
 * ------------------------------------------------------------
 * Ensures session persistence across Iventics subdomains.
 */
const SESSION_COOKIE =
  process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || "__Secure-iventics_session";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

/**
 * 🚦 Middleware Logic
 */
export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  const hasSession = req.cookies.has(SESSION_COOKIE);

  // ✅ Allow public/static/API routes
  const isPublicRoute =
    PUBLIC_PATHS.includes(normalizedPath) ||
    normalizedPath.startsWith("/api") ||
    normalizedPath.startsWith("/_next") ||
    /\.(ico|svg|png|jpg|jpeg|gif|webp|avif)$/.test(normalizedPath);

  if (isPublicRoute) {
    // 🚫 Redirect authenticated users away from auth pages
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

  // 🔒 Protect private routes
  if (!hasSession) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ Session valid
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

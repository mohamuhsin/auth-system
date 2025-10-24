import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "__Secure-iventics_session";

const PUBLIC_PATHS = [
  "/", // landing page
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // 🧩 normalize path but preserve root `/`
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  const hasSession = req.cookies.has(SESSION_COOKIE);

  const isPublicRoute =
    PUBLIC_PATHS.includes(normalizedPath) ||
    normalizedPath.startsWith("/api") ||
    normalizedPath.startsWith("/_next") ||
    /\.(ico|svg|png|jpg|jpeg|gif|webp|avif)$/.test(normalizedPath);

  // 🟢 Allow all public/static routes
  if (isPublicRoute) {
    // 🚫 Redirect logged-in users away from auth pages
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

  // ✅ Authenticated users proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};

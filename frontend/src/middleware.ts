import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ============================================================
   ⚙️ Session + Routing Configuration
============================================================ */
const SESSION_COOKIE = "__Secure-iventics_session";

/**
 * Public pages that do NOT require authentication.
 * All other routes are automatically protected.
 */
const PUBLIC_PATHS = [
  "/", // Landing page
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

/* ============================================================
   🔒 Middleware Logic — Runs Before Rendering
============================================================ */
export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  const normalizedPath = pathname.replace(/\/$/, ""); // normalize trailing slash
  const hasSession = req.cookies.has(SESSION_COOKIE);

  /* ------------------------------------------------------------
     🟢 1. Allow all public + static routes to proceed
  ------------------------------------------------------------ */
  const isPublicRoute =
    PUBLIC_PATHS.some((p) => normalizedPath.startsWith(p)) ||
    normalizedPath.startsWith("/api") ||
    normalizedPath.startsWith("/_next") ||
    normalizedPath.startsWith("/images") ||
    /\.(?:ico|svg|png|jpg|jpeg|gif|webp|avif)$/.test(normalizedPath);

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

  /* ------------------------------------------------------------
     🔒 2. Protect all other routes (require session)
  ------------------------------------------------------------ */
  if (!hasSession) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("from", pathname); // remember intended route
    return NextResponse.redirect(loginUrl);
  }

  /* ------------------------------------------------------------
     ✅ 3. Authenticated — proceed normally
  ------------------------------------------------------------ */
  return NextResponse.next();
}

/* ============================================================
   🧩 Matcher — apply middleware to all non-static routes
============================================================ */
export const config = {
  matcher: [
    // Matches everything EXCEPT static files, Next.js internals, and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};

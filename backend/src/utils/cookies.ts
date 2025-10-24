import cookie from "cookie";
import admin from "../services/firebaseAdmin";

/**
 * 🍪 Cookie Utility (Level 1)
 * ------------------------------------------------------------
 * Handles secure session cookie creation and clearing.
 * Supports cross-domain usage (e.g., auth.iventics.com + subdomains)
 */

const NAME = process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
const DOMAIN = process.env.AUTH_COOKIE_DOMAIN || "localhost";
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);

/**
 * 🔑 makeSessionCookie
 * Exchanges a Firebase ID token for a secure HTTP-only session cookie.
 */
export async function makeSessionCookie(idToken: string) {
  const expiresIn = TTL_DAYS * 24 * 60 * 60 * 1000; // e.g. 7 days
  const sessionCookie = await admin
    .auth()
    .createSessionCookie(idToken, { expiresIn });

  return cookie.serialize(NAME, sessionCookie, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    domain: DOMAIN,
    maxAge: expiresIn / 1000,
  });
}

/**
 * 🚪 clearSessionCookie
 * Clears the session cookie from the browser (used on logout).
 */
export function clearSessionCookie() {
  return cookie.serialize(NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    domain: DOMAIN,
    expires: new Date(0),
  });
}

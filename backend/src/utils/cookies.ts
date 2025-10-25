import * as cookie from "cookie";
import admin from "../services/firebaseAdmin";

/**
 * 🍪 Cookie Utility (Level 1.5 — Hardened)
 * ------------------------------------------------------------
 * Handles secure session cookie creation and clearing.
 * Works seamlessly across all Iventics subdomains:
 *   e.g. auth.iventics.com, pay.iventics.com, api.iventics.com
 *
 * - Uses Firebase Admin session cookies for server-side auth
 * - Proper SameSite / Secure settings for modern browsers
 * - Automatically configures domain for local vs production
 */

const NAME = process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
const DOMAIN =
  process.env.NODE_ENV === "production"
    ? ".iventics.com" // shared across all Iventics subdomains
    : "localhost"; // local dev only
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);

/**
 * 🔑 makeSessionCookie
 * Exchanges a Firebase ID token for a secure, HTTP-only session cookie.
 */
export async function makeSessionCookie(idToken: string) {
  const expiresIn = TTL_DAYS * 24 * 60 * 60 * 1000; // e.g. 7 days
  const sessionCookie = await admin
    .auth()
    .createSessionCookie(idToken, { expiresIn });

  // ✅ Use SameSite=Lax for same-domain/subdomain requests.
  return cookie.serialize(NAME, sessionCookie, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    domain: DOMAIN,
    maxAge: expiresIn / 1000,
  });
}

/**
 * 🚪 clearSessionCookie
 * Clears the session cookie from the browser (logout).
 */
export function clearSessionCookie() {
  return cookie.serialize(NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    domain: DOMAIN,
    expires: new Date(0),
  });
}

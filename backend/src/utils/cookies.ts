import cookie from "cookie";
import admin from "../services/firebaseAdmin";

/**
 * 🍪 Cookie Utility (Level 1.5)
 * ------------------------------------------------------------
 * Handles secure session cookie creation and clearing.
 * Works across all Iventics subdomains (auth, pay, api, etc.)
 */

const NAME = process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
const DOMAIN =
  process.env.NODE_ENV === "production"
    ? ".iventics.com" // shared across subdomains
    : "localhost"; // dev only
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);

/**
 * 🔑 makeSessionCookie
 * Exchanges a Firebase ID token for a secure, HTTP-only session cookie.
 */
export async function makeSessionCookie(idToken: string) {
  const expiresIn = TTL_DAYS * 24 * 60 * 60 * 1000; // e.g. 7 days

  // Create a signed Firebase session cookie
  const sessionCookie = await admin
    .auth()
    .createSessionCookie(idToken, { expiresIn });

  // ✅ Use SameSite=Lax instead of None for same-domain/subdomain requests.
  // Chrome 2024+ blocks SameSite=None cookies without explicit Secure+cross-site context.
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

import cookie from "cookie";
import admin from "../services/firebaseAdmin";
import { logger } from "./logger";

/**
 * 🍪 Cookie Utility — Level 2.0 Hardened
 * ------------------------------------------------------------
 * - Creates & clears secure cross-domain session cookies
 * - Uses Firebase Admin to exchange ID tokens
 * - Designed for multi-subdomain deployments under iventics.com
 */

const NAME = process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
const DOMAIN =
  process.env.NODE_ENV === "production" ? ".iventics.com" : undefined;
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);

/**
 * 🔑 makeSessionCookie
 * Exchanges a Firebase ID token for a secure, HTTP-only session cookie.
 * Returns structured metadata for controllers and DB storage.
 */
export async function makeSessionCookie(idToken: string) {
  const expiresIn = TTL_DAYS * 24 * 60 * 60 * 1000; // 7 days
  try {
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    const cookieHeader = cookie.serialize(NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      domain: DOMAIN,
      maxAge: expiresIn / 1000,
    });

    return {
      cookieHeader, // serialized Set-Cookie header
      rawToken: sessionCookie, // raw Firebase cookie string
      expiresAt: new Date(Date.now() + expiresIn),
      maxAge: expiresIn / 1000,
    };
  } catch (err: any) {
    logger.error({
      msg: "Failed to create session cookie",
      error: err.message,
      code: err.code,
    });
    throw new Error("Session cookie creation failed");
  }
}

/**
 * 🚪 clearSessionCookie
 * Clears the session cookie from the browser (used during logout).
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

import cookie from "cookie";
import admin from "../services/firebaseAdmin";
import { logger } from "./logger";

/**
 * 🍪 Cookie Utility — Level 2.0 (Cross-Domain Safe)
 * ------------------------------------------------------------
 * - Always issues Secure + SameSite=None + .iventics.com domain
 * - Ensures cookies work across auth-api.iventics.com and auth.iventics.com
 */

const NAME = process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
const DOMAIN = ".iventics.com"; // ✅ Always enforce for production-like behavior
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);

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
      domain: DOMAIN, // ✅ explicitly shared between subdomains
      maxAge: expiresIn / 1000,
    });

    return {
      cookieHeader,
      rawToken: sessionCookie,
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
 * 🚪 clearSessionCookie — removes cross-domain cookie
 */
export function clearSessionCookie() {
  return cookie.serialize(NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    domain: DOMAIN, // ✅ must match
    expires: new Date(0),
  });
}

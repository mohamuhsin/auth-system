import cookie from "cookie";
import admin from "../services/firebaseAdmin";
import { logger } from "./logger";

/**
 * 🍪 Cookie Utility — Level 2.0 Hardened
 * ------------------------------------------------------------
 * • Issues Secure + SameSite=None cookies scoped to `.iventics.com`
 * • Works across auth-api.iventics.com ↔ auth.iventics.com
 * • Adds structured debug logging for Firebase errors
 */

const NAME = process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
const DOMAIN =
  process.env.NODE_ENV === "production" ? ".iventics.com" : "localhost";
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);

/* ============================================================
   🔑 makeSessionCookie — exchange ID token for session cookie
============================================================ */
export async function makeSessionCookie(idToken: string) {
  const expiresIn = TTL_DAYS * 24 * 60 * 60 * 1000; // ms

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

    logger.info({
      msg: "✅ Session cookie created successfully",
      domain: DOMAIN,
      name: NAME,
    });

    return {
      cookieHeader,
      rawToken: sessionCookie,
      expiresAt: new Date(Date.now() + expiresIn),
      maxAge: expiresIn / 1000,
    };
  } catch (err: any) {
    // 🔍 Deep debug log — shows the real Firebase error info
    console.error("🔥 Firebase createSessionCookie error:", {
      code: err?.code,
      message: err?.message,
      stack: err?.stack,
    });

    logger.error({
      msg: "❌ Failed to create session cookie",
      code: err?.code,
      error: err?.message,
    });

    throw new Error(`Session cookie creation failed: ${err?.message}`);
  }
}

/* ============================================================
   🚪 clearSessionCookie — delete cross-domain cookie
============================================================ */
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

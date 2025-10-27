import * as cookie from "cookie";
import admin from "../services/firebaseAdmin";
import { logger } from "./logger";

/**
 * 🍪 Cookie Utility — Level 2.5 Hardened (Auth by Iventics)
 * ------------------------------------------------------------
 * • Issues Secure + SameSite=None cookies scoped to `.iventics.com`
 * • Works seamlessly across `auth-api.iventics.com` ↔ `auth.iventics.com`
 * • Gracefully handles local dev and Firebase Admin errors
 */

const NAME = process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
const DOMAIN =
  process.env.NODE_ENV === "production" ? ".iventics.com" : "localhost";
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);

/* ============================================================
   🔑 makeSessionCookie — Exchange Firebase ID token → session
============================================================ */
export async function makeSessionCookie(idToken: string) {
  const expiresIn = TTL_DAYS * 24 * 60 * 60 * 1000; // days → ms

  try {
    // ✅ Create Firebase session cookie
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    // ✅ Serialize secure cookie
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
      name: NAME,
      domain: DOMAIN,
      ttlDays: TTL_DAYS,
    });

    return {
      cookieHeader,
      cookieName: NAME,
      rawToken: sessionCookie,
      expiresAt: new Date(Date.now() + expiresIn),
      maxAge: expiresIn / 1000,
    };
  } catch (err: any) {
    // 🚫 Never swallow admin SDK errors silently
    logger.error({
      msg: "❌ Failed to create Firebase session cookie",
      code: err?.code,
      error: err?.message,
      stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
    });

    throw new Error(`Session cookie creation failed: ${err?.message}`);
  }
}

/* ============================================================
   🚪 clearSessionCookie — Delete cookie across all subdomains
============================================================ */
export function clearSessionCookie() {
  return cookie.serialize(NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    domain: DOMAIN,
    expires: new Date(0), // immediately invalid
  });
}

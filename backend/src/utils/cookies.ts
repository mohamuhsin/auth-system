import * as cookie from "cookie";
import admin from "../services/firebaseAdmin";
import { logger } from "./logger";

const NAME = process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
const DOMAIN =
  process.env.NODE_ENV === "production" ? ".iventics.com" : "localhost";
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);

export async function makeSessionCookie(idToken: string) {
  const expiresIn = TTL_DAYS * 24 * 60 * 60 * 1000;

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
  } catch (err: unknown) {
    const error = err as Error & { code?: string };

    logger.error({
      msg: "Failed to create Firebase session cookie",
      code: error.code,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });

    throw new Error(`Session cookie creation failed: ${error.message}`);
  }
}

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

import cookie from "cookie";
import admin from "../services/firebaseAdmin";

const NAME = process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
const DOMAIN = process.env.AUTH_COOKIE_DOMAIN || "localhost";
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);

export async function makeSessionCookie(idToken: string) {
  const expiresIn = TTL_DAYS * 24 * 60 * 60 * 1000;
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

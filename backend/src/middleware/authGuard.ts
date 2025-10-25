import { Request, Response, NextFunction } from "express";
import admin from "../services/firebaseAdmin";
import prisma from "../prisma/client";

/**
 * Extends Express Request with authenticated user info.
 */
export interface AuthenticatedUser {
  id: string; // Internal UUID (Prisma)
  uid: string; // Firebase UID
  email: string;
  role: string;
  isApproved: boolean;
  name?: string | null;
  photoURL?: string | null;
  avatarUrl?: string | null;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthenticatedUser;
}

/**
 * 🛡️ authGuard(requiredRole?)
 * ------------------------------------------------------------
 * Verifies Firebase session cookie and attaches user to req.authUser.
 * Optionally enforces role-based access control.
 */
export function authGuard(requiredRole?: "USER" | "ADMIN") {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const cookieName =
        process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";

      // 🔎 Retrieve session cookie (support signed + unsigned)
      const sessionCookie =
        req.cookies?.[cookieName] || req.signedCookies?.[cookieName];

      if (!sessionCookie) {
        console.warn("🚫 No session cookie found in request.");
        return res.status(401).json({
          status: "error",
          message: "No session cookie found",
        });
      }

      // ✅ Verify Firebase session cookie
      const decoded = await admin
        .auth()
        .verifySessionCookie(sessionCookie, true); // true = check revocation

      // 🔍 Find corresponding user in your DB
      const dbUser = await prisma.user.findUnique({
        where: { uid: decoded.uid },
      });

      if (!dbUser) {
        console.warn("🚫 User not found in database:", decoded.email);
        return res.status(403).json({
          status: "error",
          message: "User not found in database",
        });
      }

      // 🧩 Attach merged user info (DB + Firebase)
      req.authUser = {
        id: dbUser.id,
        uid: dbUser.uid,
        email: dbUser.email,
        role: dbUser.role,
        isApproved: dbUser.isApproved,
        name: dbUser.name || (decoded as any).name || null,
        photoURL: (decoded as any).picture || null,
        avatarUrl: dbUser.avatarUrl || (decoded as any).picture || null,
      };

      // 🔒 Optional role-based access control
      if (requiredRole && dbUser.role !== requiredRole) {
        return res.status(403).json({
          status: "error",
          message: `Forbidden: requires ${requiredRole} role`,
        });
      }

      return next();
    } catch (err: any) {
      console.error("🔥 AuthGuard error:", err.message);
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired session",
      });
    }
  };
}

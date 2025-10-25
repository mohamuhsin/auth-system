import { Request, Response, NextFunction } from "express";
import admin from "../services/firebaseAdmin";
import prisma from "../prisma/client";

/**
 * Extends Express Request with authenticated user info.
 */
export interface AuthenticatedUser {
  uid: string;
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
 * Verifies Firebase session cookies and attaches the user to req.authUser.
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

      // 🔎 Support both regular and signed cookies
      const sessionCookie =
        req.cookies?.[cookieName] || req.signedCookies?.[cookieName];

      if (!sessionCookie) {
        return res.status(401).json({
          status: "error",
          message: "No session cookie found",
        });
      }

      // ✅ Verify Firebase session cookie
      const decoded = await admin
        .auth()
        .verifySessionCookie(sessionCookie, true);

      // 🔍 Fetch user from your database
      const dbUser = await prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
      });

      if (!dbUser) {
        return res.status(403).json({
          status: "error",
          message: "User not found in database",
        });
      }

      // 🧩 Attach full user info (including optional fields)
      req.authUser = {
        uid: dbUser.id, // use internal UUID for audit consistency
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

      next();
    } catch (err) {
      console.error("AuthGuard error:", (err as Error).message);
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired session",
      });
    }
  };
}

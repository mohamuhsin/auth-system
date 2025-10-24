import { Request, Response, NextFunction } from "express";
import admin from "../services/firebaseAdmin";
import prisma from "../prisma/client";

/**
 * Extends Express Request with authenticated user info.
 */
export interface AuthenticatedRequest extends Request {
  authUser?: {
    uid: string;
    email: string;
    role: string;
    isApproved: boolean;
  };
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

      // 🔎 Check multiple cookie sources just in case
      const sessionCookie =
        req.cookies?.[cookieName] || req.signedCookies?.[cookieName];

      if (!sessionCookie) {
        return res.status(401).json({
          status: "error",
          message: "No session cookie found",
        });
      }

      // ✅ Verify long-lived Firebase session cookie
      const decoded = await admin
        .auth()
        .verifySessionCookie(sessionCookie, true);

      // 🔍 Fetch user from DB
      const dbUser = await prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
      });

      if (!dbUser) {
        return res.status(403).json({
          status: "error",
          message: "User not found in database",
        });
      }

      // Attach user info to request
      req.authUser = {
        uid: dbUser.id, // ✅ use internal user ID for audit consistency
        email: dbUser.email,
        role: dbUser.role,
        isApproved: dbUser.isApproved,
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

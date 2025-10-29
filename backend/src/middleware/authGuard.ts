import { Request, Response, NextFunction } from "express";
import admin from "../services/firebaseAdmin";
import prisma from "../prisma/client";
import { logger } from "../utils/logger";
import { logAudit } from "../utils/audit";
import { AuditAction, Role } from "@prisma/client";

/**
 * 👤 Authenticated User structure (merged Firebase + DB)
 */
export interface AuthenticatedUser {
  id: string;
  uid: string;
  email: string;
  role: Role;
  isApproved: boolean;
  name?: string | null;
  avatarUrl?: string | null;
  photoURL?: string | null;
}

/**
 * ✅ Extended Express Request to include authenticated user
 */
export interface AuthenticatedRequest extends Request {
  authUser?: AuthenticatedUser;
}

/**
 * 🛡️ authGuard(requiredRole?)
 * ------------------------------------------------------------
 * • Validates Firebase session cookie (.iventics.com shared)
 * • Syncs Firebase user data with Prisma user record
 * • Enforces role-based access if `requiredRole` is provided
 * • Logs audit events for transparency & monitoring
 */
export function authGuard(requiredRole?: Role) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const cookieName =
      process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";

    try {
      // 🍪 Extract session cookie (supports signed / raw / forwarded)
      const sessionCookie =
        req.cookies?.[cookieName] ||
        req.signedCookies?.[cookieName] ||
        (req.headers.cookie || "")
          .split("; ")
          .find((c) => c.startsWith(`${cookieName}=`))
          ?.split("=")[1];

      if (!sessionCookie) {
        logger.warn(
          { path: req.path, ip: req.ip },
          "🚫 No session cookie found"
        );

        await logAudit(
          AuditAction.USER_LOGOUT_NO_COOKIE,
          null,
          req.ip,
          req.headers["user-agent"],
          { reason: "NO_SESSION_COOKIE" }
        );

        return res.status(401).json({
          status: "error",
          code: 401,
          message: "Missing or invalid session cookie.",
        });
      }

      // ✅ Verify Firebase session cookie (revocation-aware)
      const decoded = await admin
        .auth()
        .verifySessionCookie(sessionCookie, true);

      // 🔍 Find user in database
      const dbUser = await prisma.user.findUnique({
        where: { uid: decoded.uid },
      });

      if (!dbUser) {
        logger.warn(
          { uid: decoded.uid, email: decoded.email },
          "❌ User not found in database"
        );

        await logAudit(
          AuditAction.USER_LOGIN,
          null,
          req.ip,
          req.headers["user-agent"],
          { reason: "USER_NOT_FOUND", email: decoded.email }
        );

        return res.status(403).json({
          status: "error",
          code: 403,
          message: "User not found in database.",
        });
      }

      // 🚫 Suspended or inactive account
      if (dbUser.status !== "ACTIVE") {
        logger.warn(
          { id: dbUser.id, status: dbUser.status },
          "🚫 Inactive or suspended account"
        );

        await logAudit(
          AuditAction.USER_SUSPEND,
          dbUser.id,
          req.ip,
          req.headers["user-agent"],
          { reason: "ACCOUNT_INACTIVE" }
        );

        return res.status(403).json({
          status: "error",
          code: 403,
          message: "Your account is not active. Contact support.",
        });
      }

      // 🧩 Attach merged user context
      req.authUser = {
        id: dbUser.id,
        uid: dbUser.uid,
        email: dbUser.email,
        role: dbUser.role,
        isApproved: dbUser.isApproved,
        name: dbUser.name ?? (decoded as any).name ?? null,
        avatarUrl: dbUser.avatarUrl ?? (decoded as any).picture ?? null,
        photoURL: (decoded as any).picture ?? null,
      };

      // 🔒 Role enforcement (if required)
      if (requiredRole && dbUser.role !== requiredRole) {
        logger.warn(
          {
            id: dbUser.id,
            requiredRole,
            currentRole: dbUser.role,
          },
          "🚫 Forbidden: insufficient role"
        );

        await logAudit(
          AuditAction.USER_LOGIN,
          dbUser.id,
          req.ip,
          req.headers["user-agent"],
          {
            reason: "ROLE_FORBIDDEN",
            requiredRole,
            currentRole: dbUser.role,
          }
        );

        return res.status(403).json({
          status: "error",
          code: 403,
          message: `Forbidden — requires ${requiredRole} role.`,
        });
      }

      // ✅ Passed authentication & authorization
      next();
    } catch (err: any) {
      logger.error({
        msg: "🔥 AuthGuard error",
        code: err?.code,
        detail: err?.message,
        path: req.path,
      });

      await logAudit(
        AuditAction.USER_LOGIN,
        null,
        req.ip,
        req.headers["user-agent"],
        { reason: "INVALID_SESSION", detail: err?.message }
      );

      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Invalid or expired session. Please log in again.",
      });
    }
  };
}

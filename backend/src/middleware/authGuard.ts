import { Request, Response, NextFunction } from "express";
import admin from "../services/firebaseAdmin";
import prisma from "../prisma/client";

export interface AuthenticatedRequest extends Request {
  authUser?: {
    uid: string;
    email?: string;
    role?: string;
    isApproved?: boolean;
  };
}

export function authGuard(requiredRole?: "USER" | "ADMIN") {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const cookieName =
        process.env.SESSION_COOKIE_NAME || "__Secure-iventics_session";
      const sessionCookie = req.cookies?.[cookieName];
      if (!sessionCookie)
        return res.status(401).json({ message: "Not authenticated" });

      const decoded = await admin
        .auth()
        .verifySessionCookie(sessionCookie, true);
      const dbUser = await prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
      });

      if (!dbUser) return res.status(403).json({ message: "User not found" });

      req.authUser = {
        uid: decoded.uid,
        email: dbUser.email,
        role: dbUser.role,
        isApproved: dbUser.isApproved,
      };

      if (requiredRole && dbUser.role !== requiredRole)
        return res
          .status(403)
          .json({ message: "Forbidden: insufficient permissions" });

      next();
    } catch (err: any) {
      console.error("AuthGuard error:", err.message);
      res.status(401).json({ message: "Invalid or expired session" });
    }
  };
}

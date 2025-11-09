import { Router, Response } from "express";
import prisma from "../prisma/client";
import { authGuard, AuthenticatedRequest } from "../middleware/authGuard";
import { getAuditActionInfo } from "../constants/auditActions";
import { Role } from "@prisma/client";
import { logger } from "../utils/logger";
import { safeError } from "../utils/errors";

const router = Router();

router.get(
  "/",
  authGuard(Role.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        limit = "50",
        offset = "0",
        userId,
        action,
        search,
        start,
        end,
      } = req.query;

      const take = Math.min(Number(limit) || 50, 200);
      const skip = Math.max(Number(offset) || 0, 0);

      const where: Record<string, any> = {};

      if (userId) where.userId = String(userId);
      if (action) where.action = String(action);

      if (start || end) {
        where.createdAt = {};
        if (start && !isNaN(Date.parse(String(start)))) {
          where.createdAt.gte = new Date(String(start));
        }
        if (end && !isNaN(Date.parse(String(end)))) {
          where.createdAt.lte = new Date(String(end));
        }
      }

      if (typeof search === "string" && search.trim()) {
        const term = search.trim();
        where.OR = [
          { ipAddress: { contains: term, mode: "insensitive" } },
          { userAgent: { contains: term, mode: "insensitive" } },
          { user: { email: { contains: term, mode: "insensitive" } } },
          { user: { name: { contains: term, mode: "insensitive" } } },
        ];
      }

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take,
          skip,
          include: {
            user: {
              select: { id: true, email: true, name: true, role: true },
            },
          },
        }),
      ]);

      const data = logs.map((log) => ({
        ...log,
        meta: getAuditActionInfo(log.action),
      }));

      return res.status(200).json({
        status: "success",
        pagination: { total, limit: take, offset: skip },
        data,
      });
    } catch (err: any) {
      logger.error({
        msg: "Failed to fetch audit logs",
        error: safeError(err),
      });

      return res.status(500).json({
        status: "error",
        message: "Failed to fetch audit logs.",
      });
    }
  }
);

export default router;

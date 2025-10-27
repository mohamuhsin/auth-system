import { Router, Response } from "express";
import prisma from "../prisma/client";
import { authGuard, AuthenticatedRequest } from "../middleware/authGuard";
import { getAuditActionInfo } from "../constants/auditActions";
import { Role } from "@prisma/client";
import { logger } from "../utils/logger";
import { safeError } from "../utils/errors";

const router = Router();

/**
 * 🧾 GET /api/audit/logs
 * ------------------------------------------------------------
 * Fetches recent audit logs for admin dashboards.
 *
 * Supports filters:
 *   • ?limit=50
 *   • ?offset=0
 *   • ?userId=<uuid>
 *   • ?action=USER_LOGIN
 *   • ?search=email_or_ip
 *   • ?start=2025-10-01
 *   • ?end=2025-10-31
 */
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

      // ============================================================
      // 🧮 Pagination
      // ============================================================
      const take = Math.min(Number(limit) || 50, 200); // max 200 for safety
      const skip = Math.max(Number(offset) || 0, 0);

      // ============================================================
      // 🧩 Base Filters
      // ============================================================
      const where: any = {};

      if (userId) where.userId = String(userId);
      if (action) where.action = String(action);

      // 📆 Date Range
      if (start || end) {
        where.createdAt = {};
        if (start && !isNaN(Date.parse(String(start)))) {
          where.createdAt.gte = new Date(String(start));
        }
        if (end && !isNaN(Date.parse(String(end)))) {
          where.createdAt.lte = new Date(String(end));
        }
      }

      // 🔍 Search Filter — across IP, email, name, and userAgent
      if (typeof search === "string" && search.trim()) {
        const term = search.trim();
        where.OR = [
          { ipAddress: { contains: term, mode: "insensitive" } },
          { userAgent: { contains: term, mode: "insensitive" } },
          { user: { email: { contains: term, mode: "insensitive" } } },
          { user: { name: { contains: term, mode: "insensitive" } } },
        ];
      }

      // ============================================================
      // 📊 Query Logs
      // ============================================================
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

      // ============================================================
      // 🧠 Enrich with Audit Metadata
      // ============================================================
      const data = logs.map((log) => ({
        ...log,
        meta: getAuditActionInfo(log.action),
      }));

      // ============================================================
      // ✅ Response
      // ============================================================
      return res.status(200).json({
        status: "success",
        pagination: { total, limit: take, offset: skip },
        data,
      });
    } catch (err: any) {
      logger.error({
        msg: "🚨 Failed to fetch audit logs",
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

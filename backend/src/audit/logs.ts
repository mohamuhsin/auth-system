import { Router, Response } from "express";
import prisma from "../prisma/client";
import { authGuard, AuthenticatedRequest } from "../middleware/authGuard";
import { getAuditActionInfo } from "../constants/auditActions";
import { Role } from "@prisma/client";
import { logger } from "../utils/logger";

const router = Router();

/**
 * 🧾 GET /api/audit/logs
 * ------------------------------------------------------------
 * Fetches recent audit logs for admin dashboards.
 *
 * Supports filters:
 *   - ?limit=50
 *   - ?offset=0
 *   - ?userId=<uuid>
 *   - ?action=USER_LOGIN
 *   - ?search=email_or_ip
 *   - ?start=2025-10-01
 *   - ?end=2025-10-31
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

      // ✅ Sanitize pagination numbers
      const take = Math.min(Number(limit) || 50, 200); // cap to 200 for safety
      const skip = Math.max(Number(offset) || 0, 0);

      // 🧩 Base filters
      const where: any = {};

      if (userId) where.userId = String(userId);
      if (action) where.action = String(action);

      // 📆 Date range filter
      if (start || end) {
        where.createdAt = {};
        if (start && !isNaN(Date.parse(String(start))))
          where.createdAt.gte = new Date(String(start));
        if (end && !isNaN(Date.parse(String(end))))
          where.createdAt.lte = new Date(String(end));
      }

      // 🔍 Free-text search (IP, email, name, or userAgent)
      if (typeof search === "string" && search.trim()) {
        const term = search.trim();
        where.OR = [
          { ipAddress: { contains: term, mode: "insensitive" } },
          { userAgent: { contains: term, mode: "insensitive" } },
          { user: { email: { contains: term, mode: "insensitive" } } },
          { user: { name: { contains: term, mode: "insensitive" } } },
        ];
      }

      // 🗂️ Fetch total count
      const total = await prisma.auditLog.count({ where });

      // 📄 Fetch paginated results
      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          user: {
            select: { id: true, email: true, name: true, role: true },
          },
        },
      });

      // 🧠 Enrich with metadata
      const enriched = logs.map((log) => ({
        ...log,
        meta: getAuditActionInfo(log.action),
      }));

      // ✅ Respond success
      return res.status(200).json({
        status: "success",
        pagination: {
          total,
          limit: take,
          offset: skip,
        },
        data: enriched,
      });
    } catch (err: any) {
      logger.error({
        msg: "🚨 Failed to fetch audit logs",
        error: err.message,
      });

      return res.status(500).json({
        status: "error",
        message: "Failed to fetch audit logs",
      });
    }
  }
);

export default router;

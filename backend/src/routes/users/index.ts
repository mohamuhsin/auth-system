import { Router } from "express";
import { logger } from "../../utils/logger";
import me from "./me";
import all from "./all";

const router = Router();

router.use("/me", me);
router.use("/all", all);

router.get("/", (_req, res) =>
  res.status(200).json({
    ok: true,
    service: "auth-api",
    routes: ["/me", "/all"],
  })
);

logger.info({
  msg: "📦 Mounted User Routes",
  basePath: "/api/users",
  endpoints: ["/me", "/all"],
});

export default router;

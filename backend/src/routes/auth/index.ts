import { Router } from "express";
import session from "./session";
import logout from "./logout";

const router = Router();
router.use("/session", session);
router.use("/logout", logout);
export default router;

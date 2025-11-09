import { Router } from "express";
import { authRateLimiter } from "../../middleware/rateLimiter";

import session from "./session";
import logout from "./logout";

import loginWithFirebase from "./login-with-firebase";
import signupWithFirebase from "./signup-with-firebase";

const router = Router();

router.use(authRateLimiter);

router.use("/session", session);

router.use("/logout", logout);

router.use("/login-with-firebase", loginWithFirebase);

router.use("/signup-with-firebase", signupWithFirebase);

export default router;

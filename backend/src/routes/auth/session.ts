import { Router } from "express";
import admin from "../../services/firebaseAdmin";
import prisma from "../../prisma/client";
import { makeSessionCookie } from "../../utils/cookies";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Missing idToken" });

    const decoded = await admin.auth().verifyIdToken(idToken);

    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email || "",
          name: decoded.name || null,
          avatarUrl: decoded.picture || null,
          role: "USER",
        },
      });
    }

    const setCookie = await makeSessionCookie(idToken);
    res.setHeader("Set-Cookie", setCookie);

    res.status(200).json({
      message: "Session created",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err: any) {
    console.error("Session error:", err.message);
    res.status(401).json({ message: "Invalid or expired ID token" });
  }
});

export default router;

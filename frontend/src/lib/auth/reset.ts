/* eslint-disable @typescript-eslint/no-explicit-any */
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/services/firebase";
import { AuthResult } from "./helpers";

/* ============================================================
   🔁 PASSWORD RESET (Final v3.2)
   ------------------------------------------------------------
   • Single responsibility: only send email, no UI toasts here
   • Toasts handled by ForgotPasswordForm for one unified flow
============================================================ */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { ok: true };
  } catch (err: any) {
    const code = err?.code as string;
    switch (code) {
      case "auth/user-not-found":
        return { ok: false, message: "No account found with that email." };
      case "auth/invalid-email":
        return { ok: false, message: "Please enter a valid email." };
      default:
        const msg = err?.message || "Failed to send reset link.";
        return { ok: false, message: msg };
    }
  }
}

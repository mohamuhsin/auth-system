/* eslint-disable @typescript-eslint/no-explicit-any */
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/services/firebase";
import { toast, toastMessage } from "@/lib/toast";
import { AuthResult } from "./helpers";

/* ============================================================
   🔁 PASSWORD RESET
============================================================ */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Sending password reset link...", { type: "loading" });
    await sendPasswordResetEmail(auth, email);
    toast.dismiss();
    toastMessage("Password reset link sent. Check your inbox.", {
      type: "success",
    });
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;
    switch (code) {
      case "auth/user-not-found":
        toastMessage("No account found with that email.", { type: "warning" });
        return { ok: false, message: "User not found." };
      case "auth/invalid-email":
        toastMessage("Please enter a valid email.", { type: "error" });
        return { ok: false, message: "Invalid email." };
      default:
        const msg = err?.message || "Reset failed.";
        toastMessage(msg, { type: "error" });
        return { ok: false, message: msg };
    }
  }
}

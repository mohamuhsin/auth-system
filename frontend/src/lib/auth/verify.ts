/* eslint-disable @typescript-eslint/no-explicit-any */
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/services/firebase";
import { toast, toastMessage } from "@/lib/toast";
import { go, actionCodeSettings, AuthResult } from "./helpers";

export async function resendVerificationEmail(): Promise<AuthResult> {
  const user = auth.currentUser;

  if (!user) {
    toast.dismiss();
    toastMessage("Please log in again first.", { type: "error" });
    go("/login", 1000);
    return { ok: false, message: "No current user." };
  }

  try {
    toast.dismiss();
    toastMessage("Sending verification email...", { type: "loading" });
    await sendEmailVerification(user, actionCodeSettings);
    toast.dismiss();
    toastMessage("Verification link sent successfully.", { type: "success" });
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;

    if (code === "auth/too-many-requests") {
      toastMessage("Too many verification attempts. Try again later.", {
        type: "warning",
      });
      return { ok: false, message: "Too many requests." };
    }

    if (code === "auth/requires-recent-login") {
      toastMessage("Please log in again to resend the email.", {
        type: "warning",
      });
      go("/login", 1200);
      return { ok: false, message: "Requires recent login." };
    }

    const msg = err?.message || "Something went wrong.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  }
}

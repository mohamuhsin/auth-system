/* eslint-disable @typescript-eslint/no-explicit-any */
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toast, toastMessage } from "@/lib/toast";
import { normalizeApi, go, AuthResult } from "./helpers";

export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Signing you in...", { type: "loading" });

    const cred = await signInWithEmailAndPassword(auth, email, password);

    if (!cred.user.emailVerified) {
      await signOut(auth);
      toast.dismiss();
      toastMessage("Please verify your email before signing in.", {
        type: "warning",
      });
      setTimeout(
        () => go(`/verify-email?email=${encodeURIComponent(email)}`),
        900
      );
      return { ok: false, message: "Email not verified." };
    }

    const idToken = await cred.user.getIdToken(true);
    const raw = await apiRequest("/auth/login-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken },
    });
    const res = normalizeApi(raw);

    toast.dismiss();

    if (!res.ok) {
      toastMessage(res.message || "Login failed.", { type: "error" });
      return { ok: false, message: res.message || "Login failed." };
    }

    toastMessage("Welcome back.", { type: "success" });
    setTimeout(() => go("/dashboard"), 700);
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;

    switch (code) {
      case "auth/invalid-email":
        toastMessage("Invalid email format. Please check and try again.", {
          type: "error",
        });
        return { ok: false, message: "Invalid email format." };

      case "auth/user-not-found":
        toastMessage("No account found. Please sign up first.", {
          type: "warning",
        });
        setTimeout(() => go("/signup"), 1200);
        return { ok: false, message: "Account not found." };

      case "auth/wrong-password":
      case "auth/invalid-credential":
        toastMessage("Incorrect password. Please try again.", {
          type: "error",
        });
        return { ok: false, message: "Wrong password." };

      case "auth/too-many-requests":
        toastMessage(
          "Too many failed attempts. Please wait a moment and try again.",
          { type: "warning" }
        );
        return { ok: false, message: "Too many attempts." };

      case "auth/network-request-failed":
        toastMessage("Network error. Please check your connection.", {
          type: "error",
        });
        return { ok: false, message: "Network error." };

      default: {
        const msg =
          err?.data?.message ||
          err?.message ||
          "Unexpected error. Please try again.";
        toastMessage(msg, { type: "error" });
        return { ok: false, message: msg };
      }
    }
  }
}

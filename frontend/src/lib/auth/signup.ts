/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toast, toastMessage } from "@/lib/toast";
import { normalizeApi, go, actionCodeSettings, AuthResult } from "./helpers";

/* ============================================================
   ✳️ SIGNUP — Email + Password (Level 3.1 Final)
   ------------------------------------------------------------
   • Creates Firebase user
   • Sends verification email
   • Exchanges ID token with backend for session cookie
   • Handles 409 (exists), 403/202/pending_verification (verify)
   • Safe redirects handled via go()
============================================================ */
export async function signupWithEmailPassword(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Creating your account...", { type: "loading" });

    // 🔐 Create Firebase account
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // ✉️ Send verification email
    await sendEmailVerification(cred.user, actionCodeSettings);

    // 🔑 Get Firebase ID token
    const idToken = await cred.user.getIdToken(true);

    // 🌐 Exchange token with backend
    const raw = await apiRequest("/auth/signup-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken, name },
    });

    const res = normalizeApi(raw);
    toast.dismiss();

    /* ============================================================
       🔁 Handle Backend Responses
    ============================================================ */
    // 🟡 Existing user
    if (res.status === 409) {
      toastMessage("Account already exists. Redirecting to login...", {
        type: "warning",
      });
      go("/login", 1200);
      return { ok: false, message: "Account already exists." };
    }

    // 🔵 Pending verification (email/password users)
    if (
      res.status === 403 ||
      res.status === 202 ||
      res.statusText === "pending_verification"
    ) {
      toastMessage("Account created. Please verify your email.", {
        type: "info",
      });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 1200);
      return { ok: true, message: "Verification pending." };
    }

    // 🟢 Verified or Google signup
    if (res.ok) {
      toastMessage("Account created successfully.", { type: "success" });
      go("/dashboard", 900);
      return { ok: true };
    }

    // 🔴 Unexpected backend error
    toastMessage(res.message || "Unexpected error occurred.", {
      type: "error",
    });
    return { ok: false, message: res.message || "Signup failed." };
  } catch (err: any) {
    toast.dismiss();

    /* ============================================================
       ⚠️ Handle Firebase Client Errors
    ============================================================ */
    const code = err?.code as string;

    switch (code) {
      case "auth/email-already-in-use":
        toastMessage("Account already exists. Redirecting to login...", {
          type: "warning",
        });
        go("/login", 1200);
        return { ok: false, message: "Account already exists." };

      case "auth/invalid-email":
        toastMessage("Invalid email address.", { type: "error" });
        return { ok: false, message: "Invalid email." };

      case "auth/weak-password":
        toastMessage("Weak password. Try a stronger one.", { type: "warning" });
        return { ok: false, message: "Weak password." };

      default: {
        const msg =
          err?.data?.message || err?.message || "Unexpected error occurred.";
        if (msg.includes("already")) {
          toastMessage("Account already exists. Redirecting to login...", {
            type: "warning",
          });
          go("/login", 1200);
          return { ok: false, message: "Account already exists." };
        }
        toastMessage(msg, { type: "error" });
        return { ok: false, message: msg };
      }
    }
  }
}

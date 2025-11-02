/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  signInWithEmailAndPassword,
  signOut,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toast, toastMessage } from "@/lib/toast";
import { normalizeApi, go, AuthResult } from "./helpers";

/* ============================================================
   🔑 LOGIN — Email + Password (Final v3.8)
   ------------------------------------------------------------
   • Distinguishes:
       - No account
       - Wrong password
       - Unverified email
   • Single toast flow (deduplicated)
============================================================ */
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Signing you in...", { type: "loading" });

    // 🔐 Firebase authentication
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // 📩 Require verified email
    if (!cred.user.emailVerified) {
      await signOut(auth);
      toast.dismiss();
      toastMessage("Please verify your email before signing in.", {
        type: "warning",
      });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 900);
      return { ok: false, message: "Email not verified." };
    }

    // 🔑 Exchange ID token → backend
    const idToken = await cred.user.getIdToken(true);
    const raw = await apiRequest("/auth/login-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken },
    });
    const res = normalizeApi(raw);

    toast.dismiss();

    /* ============================================================
       🔁 Backend Responses
    ============================================================ */
    if (res.status === 403) {
      toastMessage("Please verify your email before logging in.", {
        type: "warning",
      });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 900);
      return { ok: false, message: "Email not verified." };
    }

    if (res.status === 404) {
      toastMessage("Account does not exist. Redirecting to signup...", {
        type: "warning",
      });
      go("/signup", 1200);
      return { ok: false, message: "Account does not exist." };
    }

    if (!res.ok) {
      toastMessage(res.message || "Login failed.", { type: "error" });
      return { ok: false, message: res.message || "Login failed." };
    }

    // ✅ Success
    toastMessage("Welcome back.", { type: "success" });
    go("/dashboard", 700);
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;

    /* ============================================================
       ⚠️ Firebase Client Error Mapping
    ============================================================ */
    switch (code) {
      case "auth/invalid-email":
        toastMessage("Invalid email format. Please check and try again.", {
          type: "error",
        });
        return { ok: false, message: "Invalid email format." };

      case "auth/user-not-found":
        toastMessage("Account does not exist. Redirecting to signup...", {
          type: "warning",
        });
        go("/signup", 1200);
        return { ok: false, message: "Account does not exist." };

      case "auth/invalid-credential":
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (!methods || methods.length === 0) {
            toastMessage("Account does not exist. Redirecting to signup...", {
              type: "warning",
            });
            go("/signup", 1200);
            return { ok: false, message: "Account does not exist." };
          } else {
            toastMessage("Incorrect password. Please try again.", {
              type: "error",
            });
            return { ok: false, message: "Wrong password." };
          }
        } catch {
          toastMessage("Incorrect email or password. Please try again.", {
            type: "error",
          });
          return { ok: false, message: "Invalid credentials." };
        }

      case "auth/wrong-password":
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toast, toastMessage } from "@/lib/toast";

/* ============================================================
   📦 Shared Types & Helpers
============================================================ */
export interface AuthResult {
  ok: boolean;
  message?: string;
}

function normalizeApi(res: any): {
  ok: boolean;
  status?: number;
  message?: string;
} {
  if (res && typeof res === "object" && "ok" in res && "status" in res) {
    return { ok: !!res.ok, status: Number(res.status), message: res.message };
  }
  if (res && typeof res === "object") {
    const statusNum =
      typeof res.code === "number"
        ? res.code
        : typeof res.statusCode === "number"
        ? res.statusCode
        : typeof res.status === "number"
        ? res.status
        : undefined;
    const ok =
      typeof statusNum === "number" && statusNum >= 200 && statusNum < 300;
    return { ok, status: statusNum, message: res.message };
  }
  return { ok: false };
}

function go(path: string, delay = 1000) {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    try {
      window.location.replace(path);
    } catch {
      window.location.href = path;
    }
  }, delay);
}

const actionCodeSettings =
  typeof window !== "undefined"
    ? {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: false,
      }
    : undefined;

/* ============================================================
   ✳️ SIGNUP — Email/Password
============================================================ */
export async function signupWithEmailPassword(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Creating your account...", { type: "loading" });

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken(true);
    const raw = await apiRequest("/auth/signup-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken, name },
    });
    const res = normalizeApi(raw);

    toast.dismiss();

    if (res.status === 409) {
      toastMessage("Account already exists. Redirecting to login...", {
        type: "warning",
      });
      go("/login", 1200);
      return { ok: false };
    }

    // Send verification after backend success
    await sendEmailVerification(cred.user, actionCodeSettings);

    // If verification required
    if (res.status === 403 || res.status === 202 || !cred.user.emailVerified) {
      toastMessage("Check your inbox to verify your email.", { type: "info" });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 1400);
      return { ok: true, message: "Verification pending." };
    }

    // Successful signup (should be rare if email verified)
    toastMessage("Account created successfully.", { type: "success" });
    go("/dashboard", 800);
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;

    switch (code) {
      case "auth/email-already-in-use":
        toastMessage("Account already exists. Redirecting to login...", {
          type: "warning",
        });
        go("/login", 1200);
        return { ok: false };
      case "auth/invalid-email":
        toastMessage("Invalid email address.", { type: "error" });
        return { ok: false };
      case "auth/weak-password":
        toastMessage("Weak password. Try a stronger one.", { type: "warning" });
        return { ok: false };
      default:
        toastMessage(err?.message || "Unexpected signup error.", {
          type: "error",
        });
        return { ok: false, message: err?.message };
    }
  }
}

/* ============================================================
   🔑 LOGIN — Email/Password
============================================================ */
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Signing you in...", { type: "loading" });

    const cred = await signInWithEmailAndPassword(auth, email, password);
    await cred.user.reload();

    // If unverified — resend and redirect
    if (!cred.user.emailVerified) {
      await sendEmailVerification(cred.user, actionCodeSettings);
      await signOut(auth);
      toast.dismiss();
      toastMessage("Check your inbox to verify your email.", { type: "info" });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 1000);
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

    if (res.status === 403 || res.status === 202) {
      await sendEmailVerification(cred.user, actionCodeSettings);
      toastMessage("Please verify your email before continuing.", {
        type: "info",
      });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 1200);
      return { ok: false, message: "Verification pending." };
    }

    if (res.status === 404) {
      toastMessage("No account exists. Redirecting to signup...", {
        type: "warning",
      });
      go("/signup", 1000);
      return { ok: false };
    }

    if (!res.ok) {
      toastMessage(res.message || "Login failed.", { type: "error" });
      return { ok: false, message: res.message };
    }

    toastMessage("Welcome back!", { type: "success" });
    go("/dashboard", 600);
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;
    let msg = "Login failed. Please try again.";

    switch (code) {
      case "auth/invalid-email":
        msg = "Invalid email format.";
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        msg = "Invalid email or password.";
        break;
      case "auth/too-many-requests":
        msg = "Too many attempts. Please wait and try again.";
        break;
      case "auth/network-request-failed":
        msg = "Network error. Please check your connection.";
        break;
      default:
        msg = err?.message || msg;
    }

    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  }
}

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
    let msg = err?.message || "Failed to send reset link.";
    if (code === "auth/user-not-found")
      msg = "No account found with that email.";
    if (code === "auth/invalid-email") msg = "Invalid email format.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  }
}

/* ============================================================
   ✉️ RESEND VERIFICATION
============================================================ */
export async function resendVerificationEmail(): Promise<AuthResult> {
  const user = auth.currentUser;
  if (!user) {
    toastMessage("Session expired. Please sign in again.", { type: "warning" });
    go("/login", 1500);
    return { ok: false };
  }

  try {
    toastMessage("Sending verification email...", { type: "loading" });
    await sendEmailVerification(user, actionCodeSettings);
    toast.dismiss();
    toastMessage("Verification email sent successfully.", { type: "success" });
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;
    if (code === "auth/too-many-requests") {
      toastMessage("Too many attempts. Try again later.", { type: "warning" });
      return { ok: false };
    }
    if (code === "auth/requires-recent-login") {
      toastMessage("Please log in again to resend email.", { type: "warning" });
      go("/login", 1200);
      return { ok: false };
    }
    toastMessage(err?.message || "Failed to send email.", { type: "error" });
    return { ok: false };
  }
}

/* ============================================================
   🌐 GOOGLE SIGN-IN
============================================================ */
export async function loginWithGoogle(): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Signing in with Google...", { type: "loading" });

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();

    const raw = await apiRequest("/auth/login-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken },
    });

    const res = normalizeApi(raw);
    toast.dismiss();

    if (res.ok) {
      toastMessage("Welcome back!", { type: "success" });
      go("/dashboard", 600);
      return { ok: true };
    }

    if (res.status === 404) {
      toastMessage("No account found. Redirecting to signup...", {
        type: "warning",
      });
      const email = encodeURIComponent(result.user.email || "");
      go(`/signup?email=${email}`, 800);
      return { ok: false };
    }

    toastMessage(res.message || "Google sign-in failed.", { type: "error" });
    return { ok: false };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string;
    if (code === "auth/popup-closed-by-user") {
      toastMessage("Google sign-in cancelled.", { type: "info" });
      return { ok: false };
    }
    if (code === "auth/network-request-failed") {
      toastMessage("Network error. Please check your connection.", {
        type: "error",
      });
      return { ok: false };
    }
    toastMessage(err?.message || "Google sign-in failed.", { type: "error" });
    return { ok: false };
  }
}

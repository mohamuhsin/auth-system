/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toastMessage, toast } from "@/lib/toast";

/* ============================================================
   🧩 Shared types & helpers
============================================================ */
export interface AuthResult {
  ok: boolean;
  message?: string;
}

/** Normalize backend responses into a consistent shape */
function normalizeApi(res: any): {
  ok: boolean;
  status?: number;
  message?: string;
} {
  // Case 1: native fetch Response (or a Response-like)
  if (res && typeof res === "object" && "ok" in res && "status" in res) {
    return {
      ok: !!(res as Response).ok,
      status: Number((res as Response).status),
    };
  }

  // Case 2: JSON envelope with code/statusCode/status/message
  if (res && typeof res === "object") {
    const statusNum =
      typeof res.code === "number"
        ? res.code
        : typeof (res as any).statusCode === "number"
        ? (res as any).statusCode
        : typeof (res as any).status === "number"
        ? (res as any).status
        : undefined;

    const statusStr = (res.status ?? res.statusText) as string | undefined;

    const ok =
      statusStr === "success" ||
      (typeof statusNum === "number" && statusNum >= 200 && statusNum < 300);

    return {
      ok: !!ok,
      status: statusNum,
      message: (res as any).message,
    };
  }

  // Fallback
  return { ok: false };
}

/** Safe redirect (history-replacing) */
function go(path: string, delay = 800) {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    try {
      window.location.replace(path); // replace avoids going "Back" into bad states
    } catch {
      window.location.href = path;
    }
  }, delay);
}

/* Optional: configure where the verification link should bounce back to */
const actionCodeSettings =
  typeof window !== "undefined"
    ? {
        url: `${window.location.origin}/verify-email`, // tweak if you prefer a different continue page
        handleCodeInApp: false,
      }
    : undefined;

/* ============================================================
   🆕 Signup — Email + Password (Manual toasts, no toastAsync)
============================================================ */
export async function signupWithEmailPassword(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  try {
    toastMessage("Creating your account...", { type: "loading" });

    // 1) Create Firebase user
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // 2) Send verification email (with optional continueUrl)
    if (actionCodeSettings) {
      await sendEmailVerification(cred.user, actionCodeSettings);
    } else {
      await sendEmailVerification(cred.user);
    }

    // 3) Register on backend (it may return 202 for pending-verification)
    const idToken = await cred.user.getIdToken(true);
    const raw = await apiRequest("/auth/signup-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken, name },
    });
    const res = normalizeApi(raw);

    // 4) Always sign out after signup (email/password) so state is clean
    await signOut(auth);

    toast.dismiss();

    if (res.status === 409) {
      toastMessage("Account already exists. Redirecting to login...", {
        type: "warning",
      });
      go("/login", 1200);
      return { ok: false, message: "Account already exists." };
    }

    if (res.status === 202 || !res.ok) {
      // Pending verification or non-OK: route to verify page
      toastMessage(
        "Account created! Please verify your email before logging in.",
        { type: "success" }
      );
      go(`/verify-email?email=${encodeURIComponent(email)}`, 1200);
      return { ok: true, message: "Verification pending." };
    }

    // If backend decided to auto-create a session for some providers (rare for email/pwd)
    toastMessage("Account created successfully!", { type: "success" });
    go("/dashboard", 900);
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();

    const code = err?.code as string | undefined;
    if (code === "auth/email-already-in-use") {
      toastMessage("Account already exists. Redirecting to login...", {
        type: "warning",
      });
      go("/login", 1200);
      return { ok: false, message: "Account already exists." };
    }
    if (code === "auth/invalid-email") {
      toastMessage("Invalid email address.", { type: "error" });
      return { ok: false, message: "Invalid email." };
    }
    if (code === "auth/weak-password") {
      toastMessage("Weak password. Try a stronger one.", { type: "warning" });
      return { ok: false, message: "Weak password." };
    }

    const msg = err?.message || "Signup failed.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  }
}

/* ============================================================
   🔑 Login — Email + Password (Manual toasts to avoid conflicts)
============================================================ */
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    toastMessage("Signing you in...", { type: "loading" });

    // 1) Firebase login
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // 2) Local guard: must be verified BEFORE we touch the backend
    if (!cred.user.emailVerified) {
      await signOut(auth); // ensure no stale Firebase session
      toast.dismiss();
      toastMessage("Please verify your email before signing in.", {
        type: "warning",
      });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 800);
      return { ok: false, message: "Email not verified." };
    }

    // 3) Exchange ID token with backend → set session cookie
    const idToken = await cred.user.getIdToken(true);
    const raw = await apiRequest("/auth/login-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken },
    });
    const res = normalizeApi(raw);

    // 4) Backend responses
    if (res.status === 403) {
      // Backend signals not verified → route to verify page
      toast.dismiss();
      toastMessage("Please verify your email before logging in.", {
        type: "warning",
      });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 800);
      return { ok: false, message: "Email not verified." };
    }

    if (res.status === 404) {
      toast.dismiss();
      toastMessage("No account found. Redirecting to signup...", {
        type: "warning",
      });
      go("/signup", 1200);
      return { ok: false, message: "User not found." };
    }

    if (!res.ok) {
      toast.dismiss();
      toastMessage(res.message || "Login failed.", { type: "error" });
      return { ok: false, message: res.message || "Login failed." };
    }

    // ✅ Success
    toast.dismiss();
    toastMessage("Welcome back!", { type: "success" });
    go("/dashboard", 500);
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const msg = err?.message || "Login failed.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  }
}

/* ============================================================
   🔁 Password Reset
============================================================ */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    toastMessage("Sending password reset link...", { type: "loading" });
    await sendPasswordResetEmail(auth, email);
    toast.dismiss();
    toastMessage("Password reset link sent! Check your inbox.", {
      type: "success",
    });
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string | undefined;
    if (code === "auth/user-not-found") {
      toastMessage("No account found with that email.", { type: "warning" });
      return { ok: false, message: "User not found." };
    }
    if (code === "auth/invalid-email") {
      toastMessage("Please enter a valid email.", { type: "error" });
      return { ok: false, message: "Invalid email." };
    }
    const msg = err?.message || "Reset failed.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  }
}

/* ============================================================
   ✉️ Resend Verification Email
============================================================ */
export async function resendVerificationEmail(): Promise<AuthResult> {
  const user = auth.currentUser;

  if (!user) {
    toastMessage("Please log in again first.", { type: "error" });
    go("/login", 1000);
    return { ok: false, message: "No current user." };
  }

  try {
    toastMessage("Sending verification email...", { type: "loading" });
    if (actionCodeSettings) {
      await sendEmailVerification(user, actionCodeSettings);
    } else {
      await sendEmailVerification(user);
    }
    toast.dismiss();
    toastMessage("Verification link sent successfully!", {
      type: "success",
    });
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const code = err?.code as string | undefined;

    if (code === "auth/too-many-requests") {
      toastMessage(
        "You’ve requested too many verification emails. Try again later.",
        { type: "warning" }
      );
      return { ok: false, message: "Too many requests." };
    }

    if (code === "auth/requires-recent-login") {
      toastMessage("For security, please log in again to resend the email.", {
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

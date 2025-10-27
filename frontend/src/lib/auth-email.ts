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
  // Case 1: native fetch Response
  if (res && typeof res === "object" && "ok" in res && "status" in res) {
    return { ok: !!res.ok, status: Number(res.status), message: undefined };
  }

  // Case 2: JSON envelope with code/statusCode/statusText/message
  if (res && typeof res === "object") {
    const statusNum =
      typeof res.code === "number"
        ? res.code
        : typeof res.statusCode === "number"
        ? res.statusCode
        : undefined;

    const statusStr = (res.status ?? res.statusText) as string | undefined;

    const ok =
      statusStr === "success" ||
      (typeof statusNum === "number" && statusNum >= 200 && statusNum < 300);

    return {
      ok,
      status: statusNum,
      message: res.message,
    };
  }

  // Fallback
  return { ok: false, status: undefined, message: undefined };
}

/** Safe redirect with delay */
function go(path: string, delay = 800) {
  setTimeout(() => {
    if (typeof window !== "undefined") window.location.href = path;
  }, delay);
}

/* ============================================================
   🆕 Signup — Email + Password (Manual toasts, no toastAsync)
============================================================ */
export async function signupWithEmailPassword(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  try {
    // Loading toast (manual control avoids double-toasts)
    toastMessage("Creating your account...", { type: "loading" });

    // 1) Create Firebase user
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // 2) Send verification email
    await sendEmailVerification(cred.user);

    // 3) Register on backend (sets cookie only for already-verified providers)
    const idToken = await cred.user.getIdToken(true);
    const raw = await apiRequest("/auth/signup-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken, name },
    });
    const res = normalizeApi(raw);

    // 4) Handle backend response
    if (res.status === 202) {
      // Email/password signups: backend expects verification → sign out locally
      await signOut(auth);
      toast.dismiss();
      toastMessage(
        "Account created! Please verify your email before logging in.",
        { type: "success" }
      );
      go(`/verify-email?email=${encodeURIComponent(email)}`, 1200);
      return { ok: true, message: "Verification pending." };
    }

    if (res.ok) {
      toast.dismiss();
      toastMessage("Account created successfully!", { type: "success" });
      go("/dashboard", 900);
      return { ok: true };
    }

    if (res.status === 409) {
      toast.dismiss();
      toastMessage("Account already exists. Redirecting to login...", {
        type: "warning",
      });
      go("/login", 1200);
      return { ok: false, message: "Account already exists." };
    }

    throw new Error(res.message || "Signup failed. Please try again.");
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

    // 2) Local guard: must be verified
    if (!cred.user.emailVerified) {
      await signOut(auth);
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
      // Not verified in backend signals
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
    await sendEmailVerification(user);
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
    const msg = err?.message || "Something went wrong.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  }
}

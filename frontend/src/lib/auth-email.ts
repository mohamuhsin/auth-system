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
import { toast, toastMessage } from "@/lib/toast";

/* SHARED TYPES & HELPERS */
export interface AuthResult {
  ok: boolean;
  message?: string;
}

/* Normalize backend responses into a consistent shape */
function normalizeApi(res: any): {
  ok: boolean;
  status?: number;
  message?: string;
} {
  if (res && typeof res === "object" && "ok" in res && "status" in res) {
    return { ok: !!res.ok, status: Number(res.status) };
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

    const statusStr = res.status ?? res.statusText;

    const ok =
      statusStr === "success" ||
      (typeof statusNum === "number" && statusNum >= 200 && statusNum < 300);

    return { ok, status: statusNum, message: res.message };
  }

  return { ok: false };
}

/* Safe redirect helper */
function go(path: string, delay = 800) {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    try {
      window.location.replace(path);
    } catch {
      window.location.href = path;
    }
  }, delay);
}

/* Firebase email verification redirect settings */
const actionCodeSettings =
  typeof window !== "undefined"
    ? {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: false,
      }
    : undefined;

/* SIGNUP — Email + Password */
export async function signupWithEmailPassword(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Creating your account...", { type: "loading" });

    // Create Firebase user
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Send verification email
    await sendEmailVerification(cred.user, actionCodeSettings);

    // Register on backend
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
      return { ok: false, message: "Account already exists." };
    }

    if (res.status === 202 || !res.ok) {
      toastMessage("Verify your email before logging in.", { type: "success" });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 1200);
      return { ok: true, message: "Verification pending." };
    }

    toastMessage("Account created successfully.", { type: "success" });
    go("/dashboard", 900);
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
        return { ok: false, message: "Account already exists." };

      case "auth/invalid-email":
        toastMessage("Invalid email address.", { type: "error" });
        return { ok: false, message: "Invalid email." };

      case "auth/weak-password":
        toastMessage("Weak password. Try a stronger one.", { type: "warning" });
        return { ok: false, message: "Weak password." };

      default:
        const msg = err?.message || "Signup failed.";
        toastMessage(msg, { type: "error" });
        return { ok: false, message: msg };
    }
  }
}

/* Login — Email + Password */
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    toast.dismiss();
    toastMessage("Signing you in...", { type: "loading" });

    // Firebase login
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Require verified email
    if (!cred.user.emailVerified) {
      await signOut(auth);
      toast.dismiss();
      toastMessage("Please verify your email before signing in.", {
        type: "warning",
      });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 800);
      return { ok: false, message: "Email not verified." };
    }

    // Exchange ID token with backend
    const idToken = await cred.user.getIdToken(true);
    const raw = await apiRequest("/auth/login-with-firebase", {
      method: "POST",
      credentials: "include",
      body: { idToken },
    });
    const res = normalizeApi(raw);

    toast.dismiss();

    if (res.status === 403) {
      toastMessage("Please verify your email before logging in.", {
        type: "warning",
      });
      go(`/verify-email?email=${encodeURIComponent(email)}`, 800);
      return { ok: false, message: "Email not verified." };
    }

    if (res.status === 404) {
      toastMessage("No account found. Redirecting to signup...", {
        type: "warning",
      });
      go("/signup", 1200);
      return { ok: false, message: "User not found." };
    }

    if (!res.ok) {
      toastMessage(res.message || "Login failed.", { type: "error" });
      return { ok: false, message: res.message || "Login failed." };
    }

    toastMessage("Welcome back.", { type: "success" });
    go("/dashboard", 600);
    return { ok: true };
  } catch (err: any) {
    toast.dismiss();
    const msg = err?.message || "Login failed.";
    toastMessage(msg, { type: "error" });
    return { ok: false, message: msg };
  }
}

/* Password Reset */
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

/* Resend Verification Email */
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

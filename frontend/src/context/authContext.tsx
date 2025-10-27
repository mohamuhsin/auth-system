/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  getIdToken,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  type User as FirebaseUser,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toastAsync, toastMessage } from "@/lib/toast";
import type { User } from "@/types/user";

/* ============================================================
   📦 API Response Type
============================================================ */
interface ApiResponse {
  status?: string;
  message?: string;
  email?: string;
  name?: string | null;
  avatarUrl?: string | null;
  role?: string;
  isApproved?: boolean;
  statusCode?: number;
  uid?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  error?: string;
}

/* ============================================================
   🧠 Auth Context Types
============================================================ */
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithFirebase: (firebaseUser: FirebaseUser) => Promise<ApiResponse>;
  signupWithFirebase: (
    firebaseUser: FirebaseUser,
    extra?: { name?: string; avatarUrl?: string }
  ) => Promise<ApiResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ============================================================
   🌍 AuthProvider — Global Auth State Manager
============================================================ */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* ============================================================
     🧩 Fetch Session — Verify Cookie from Backend
  ============================================================ */
  const fetchSession = useCallback(async (retries = 2) => {
    try {
      const res = await apiRequest<ApiResponse>("/users/me");

      if ((res?.status === "success" || res?.email) && !res?.error) {
        const validRoles = ["USER", "ADMIN", "CREATOR", "MERCHANT"] as const;
        const role = validRoles.includes(res.role as any)
          ? (res.role as User["role"])
          : "USER";

        const newUser: User = {
          id: res.id || "unknown",
          firebaseUid: res.uid || "unknown",
          email: res.email ?? "",
          name: res.name || null,
          avatarUrl: res.avatarUrl || null,
          role,
          isApproved: res.isApproved ?? false,
          createdAt: res.createdAt || new Date().toISOString(),
          updatedAt: res.updatedAt || new Date().toISOString(),
        };

        setUser(newUser);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      if (retries > 0) {
        console.warn("Retrying session fetch...");
        return fetchSession(retries - 1);
      }
      console.warn("❌ Session fetch failed:", err.message || err);
      setUser(null);
    } finally {
      setLoading(false);
      console.log("✅ Auth state initialized — session checked");
    }
  }, []);

  /* ============================================================
     🚀 Initialize Session (Firebase + Backend Sync)
     ------------------------------------------------------------
     1️⃣ Listens to Firebase login state (cached users too)
     2️⃣ If Firebase user exists but cookie expired → recreate session
     3️⃣ Always ensures consistent backend + frontend state
  ============================================================ */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // 1️⃣ Refresh Firebase token (force refresh if expired)
          const idToken = await getIdToken(firebaseUser, true);

          // 2️⃣ Sync with backend (creates or refreshes cookie session)
          await apiRequest("/auth/session", {
            method: "POST",
            body: { idToken },
          });

          // 3️⃣ Fetch user details from backend
          await fetchSession();
        } else {
          // No Firebase user → clear session
          setUser(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn("❌ Session restore failed:", err.message);
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchSession]);

  /* ============================================================
     🔑 Login — Firebase → Backend Cookie Session
  ============================================================ */
  const loginWithFirebase = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await getIdToken(firebaseUser, true);
      const res = await apiRequest<ApiResponse>("/auth/login-with-firebase", {
        method: "POST",
        body: { idToken, userAgent: navigator.userAgent },
      });

      if (res?.statusCode === 403) {
        toastMessage("Please verify your email before logging in.", {
          type: "warning",
        });
        router.replace("/verify-email");
        return res;
      }

      if (res?.statusCode === 404) {
        toastMessage("No account found. Redirecting to signup...", {
          type: "warning",
        });
        router.replace("/signup");
        return res;
      }

      // Wait briefly for cookie propagation
      await new Promise((r) => setTimeout(r, 600));
      await fetchSession();

      router.replace("/dashboard");
      return { ...res, status: res.status ?? "success" };
    } catch (err: any) {
      console.error("❌ Login error:", err.message);
      toastMessage(err.message || "Login failed. Please try again.", {
        type: "error",
      });
      return {
        status: "error",
        message: err.message || "Login failed.",
      };
    }
  };

  /* ============================================================
     🆕 Signup — Firebase → Backend Cookie Session
  ============================================================ */
  const signupWithFirebase = async (
    firebaseUser: FirebaseUser,
    extra?: { name?: string; avatarUrl?: string }
  ) => {
    try {
      const idToken = await getIdToken(firebaseUser, true);
      const res = await apiRequest<ApiResponse>("/auth/signup-with-firebase", {
        method: "POST",
        body: { idToken, userAgent: navigator.userAgent, ...extra },
      });

      if (res?.statusCode === 202) {
        // email/password unverified
        try {
          await sendEmailVerification(firebaseUser);
          toastMessage("Verification email sent! Please check your inbox.", {
            type: "success",
          });
        } catch (err: any) {
          console.warn("⚠️ Could not send verification email:", err.message);
        }
        await signOut(auth);
        router.replace("/verify-email");
        return { ...res, status: "pending_verification" };
      }

      if (res?.status === "error" || res?.error) {
        throw new Error(res.message || "Signup failed on server");
      }

      await new Promise((r) => setTimeout(r, 800));
      await fetchSession();
      router.replace("/dashboard");
      return { ...res, status: "success" };
    } catch (err: any) {
      console.error("❌ signupWithFirebase error:", err.message);
      toastMessage(err.message || "Signup failed. Please try again.", {
        type: "error",
      });
      return {
        status: "error",
        message: err.message || "Signup failed.",
      };
    }
  };

  /* ============================================================
     🚪 Logout — Backend + Firebase + Router
  ============================================================ */
  const logout = async () => {
    await toastAsync(
      async () => {
        await apiRequest("/auth/logout", { method: "POST" });
        await signOut(auth);
        setUser(null);
        router.replace("/login");
      },
      {
        loading: "Logging out...",
        success: "Logged out successfully",
        error: "Logout failed. Please try again.",
      }
    );
  };

  /* ============================================================
     🔁 Manual Session Refresh
  ============================================================ */
  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  /* ============================================================
     🌍 Provide Context Globally
  ============================================================ */
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithFirebase,
        signupWithFirebase,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ============================================================
   🪶 useAuth Hook
============================================================ */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

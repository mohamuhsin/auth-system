/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/* ============================================================
   🔒 AuthContext — Level 2.9 (Final Verified)
   ------------------------------------------------------------
   • Unified cookie + Firebase session bridge
   • Handles verification, 401s, and retry loops
   • Safe polling after signup/login
   • Toast-integrated UX
============================================================ */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { getIdToken, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/lib/api";
import { toastAsync, toastMessage } from "@/lib/toast";

export type Role = "USER" | "ADMIN" | "CREATOR" | "MERCHANT";

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: Role;
  isApproved: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse {
  status?: string;
  code?: number;
  message?: string;
  id?: string;
  uid?: string;
  email?: string;
  name?: string | null;
  avatarUrl?: string | null;
  role?: Role;
  isApproved?: boolean;
  user?: User;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  waitForSession: () => Promise<ApiResponse | null>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  loginWithFirebase: (firebaseUser: FirebaseUser) => Promise<ApiResponse>;
  signupWithFirebase: (
    firebaseUser: FirebaseUser,
    extra?: { name?: string; avatarUrl?: string }
  ) => Promise<ApiResponse>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ============================================================
   🧩 AuthProvider
============================================================ */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const toUser = (src: ApiResponse): User | null => {
    const u = src.user ?? src;
    if (!u?.id || !u?.email) return null;
    return {
      id: u.id,
      firebaseUid: (u as any).uid ?? (src as any).uid ?? "unknown",
      email: u.email,
      name: u.name ?? null,
      avatarUrl: u.avatarUrl ?? null,
      role: (u.role as Role) ?? "USER",
      isApproved: !!u.isApproved,
      createdAt: (src as any).createdAt,
      updatedAt: (src as any).updatedAt,
    };
  };

  /* ------------------------------------------------------------
     🧭 Probe /users/me until cookie session becomes valid
  ------------------------------------------------------------ */
  const waitForSession = useCallback(async (): Promise<ApiResponse | null> => {
    const isAborted = false;
    const maxRetries = 5;
    let attempt = 0;

    while (!isAborted && attempt < maxRetries) {
      try {
        const res = await apiRequest<ApiResponse>("/users/me");
        if (res && (res.status === "success" || res.code === 200) && res.email)
          return res;
      } catch {
        /* ignore temporary errors */
      }
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      attempt++;
    }
    return null;
  }, []);

  /* ------------------------------------------------------------
     🚀 Fetch active session (used on mount or manual refresh)
  ------------------------------------------------------------ */
  const fetchSession = useCallback(async () => {
    try {
      const res = await apiRequest<ApiResponse>("/users/me");
      if (res && (res.status === "success" || res.code === 200)) {
        setUser(toUser(res));
      } else {
        setUser(null);
      }
    } catch (err: any) {
      if (err.status === 401) {
        console.info("🔒 No active session — clearing state.");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  /* ------------------------------------------------------------
     🔐 Login with Firebase → Backend Session Cookie
  ------------------------------------------------------------ */
  const loginWithFirebase = useCallback(
    async (firebaseUser: FirebaseUser): Promise<ApiResponse> => {
      try {
        const idToken = await getIdToken(firebaseUser, true);
        const res = await apiRequest<ApiResponse>("/auth/login-with-firebase", {
          method: "POST",
          body: {
            idToken,
            userAgent:
              typeof navigator !== "undefined"
                ? navigator.userAgent
                : "unknown",
          },
        });

        // 🧾 Handle backend codes
        if (res.code === 403) {
          toastMessage("Please verify your email before logging in.", {
            type: "warning",
          });
          await signOut(auth).catch(() => {});
          setUser(null);
          return res;
        }
        if (res.code === 404) {
          toastMessage("No account found. Redirecting to signup...", {
            type: "warning",
          });
          setUser(null);
          return res;
        }

        // 🔄 Wait for cookie-based session to propagate
        const probe = await waitForSession();
        setUser(probe ? toUser(probe) : null);
        setLoading(false);
        return { ...res, status: res.status ?? "success" };
      } catch (err: any) {
        toastMessage(err?.message || "Login failed.", { type: "error" });
        setLoading(false);
        return { status: "error", code: 500, message: err?.message };
      }
    },
    [waitForSession]
  );

  /* ------------------------------------------------------------
     🆕 Signup with Firebase → Backend registration
  ------------------------------------------------------------ */
  const signupWithFirebase = useCallback(
    async (
      firebaseUser: FirebaseUser,
      extra?: { name?: string; avatarUrl?: string }
    ): Promise<ApiResponse> => {
      try {
        const idToken = await getIdToken(firebaseUser, true);
        const res = await apiRequest<ApiResponse>(
          "/auth/signup-with-firebase",
          {
            method: "POST",
            body: {
              idToken,
              userAgent:
                typeof navigator !== "undefined"
                  ? navigator.userAgent
                  : "unknown",
              ...extra,
            },
          }
        );

        if (res.status === "pending_verification" || res.code === 202) {
          await signOut(auth).catch(() => {});
          setUser(null);
          setLoading(false);
          return { ...res, status: "pending_verification" };
        }

        // Wait for backend cookie to exist
        const probe = await waitForSession();
        setUser(probe ? toUser(probe) : null);
        setLoading(false);
        return { ...res, status: "success" };
      } catch (err: any) {
        toastMessage(err?.message || "Signup failed.", { type: "error" });
        setLoading(false);
        return { status: "error", code: 500, message: err?.message };
      }
    },
    [waitForSession]
  );

  /* ------------------------------------------------------------
     🚪 Logout (clear backend + Firebase)
  ------------------------------------------------------------ */
  const logout = useCallback(async () => {
    await toastAsync(
      async () => {
        try {
          await apiRequest("/auth/logout", { method: "POST" });
        } finally {
          await signOut(auth).catch(() => {});
          setUser(null);
          setLoading(false);
        }
      },
      {
        loading: "Logging out...",
        success: "Logged out successfully",
        error: "Logout failed. Please try again.",
      }
    );
  }, []);

  const refreshSession = useCallback(fetchSession, [fetchSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      waitForSession,
      refreshSession,
      logout,
      loginWithFirebase,
      signupWithFirebase,
    }),
    [
      user,
      loading,
      waitForSession,
      refreshSession,
      logout,
      loginWithFirebase,
      signupWithFirebase,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ------------------------------------------------------------
   🪶 useAuth Hook
------------------------------------------------------------ */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

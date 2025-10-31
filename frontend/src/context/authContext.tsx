/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
import { toastAsync, toastMessage, toast } from "@/lib/toast";

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

let isLoggingOut = false;

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

  const waitForSession = useCallback(async (): Promise<ApiResponse | null> => {
    const maxRetries = 5;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await apiRequest<ApiResponse>("/users/me");
        if (res && (res.status === "success" || res.code === 200) && res.email)
          return res;
      } catch {}
      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
    return null;
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const res = await apiRequest<ApiResponse>("/users/me");
      if (res && (res.status === "success" || res.code === 200)) {
        setUser(toUser(res));
      } else {
        setUser(null);
      }
    } catch (err: any) {
      if (err.status === 401 && user) {
        await signOut(auth).catch(() => {});
        toast.dismiss();
        if (!isLoggingOut) {
          toastMessage("Your session has expired. Please sign in again.", {
            type: "warning",
          });
        }
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSession();
    }, 600);
    return () => clearTimeout(timer);
  }, [fetchSession]);

  const loginWithFirebase = useCallback(
    async (firebaseUser: FirebaseUser): Promise<ApiResponse> => {
      try {
        toast.dismiss();
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

        const probe = await waitForSession();
        setUser(probe ? toUser(probe) : null);
        setLoading(false);
        return { ...res, status: res.status ?? "success" };
      } catch (err: any) {
        toast.dismiss();
        toastMessage(err?.message || "Login failed.", { type: "error" });
        setLoading(false);
        return { status: "error", code: 500, message: err?.message };
      }
    },
    [waitForSession]
  );

  const signupWithFirebase = useCallback(
    async (
      firebaseUser: FirebaseUser,
      extra?: { name?: string; avatarUrl?: string }
    ): Promise<ApiResponse> => {
      try {
        toast.dismiss();
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

        const probe = await waitForSession();
        setUser(probe ? toUser(probe) : null);
        setLoading(false);
        return { ...res, status: "success" };
      } catch (err: any) {
        toast.dismiss();
        toastMessage(err?.message || "Signup failed.", { type: "error" });
        setLoading(false);
        return { status: "error", code: 500, message: err?.message };
      }
    },
    [waitForSession]
  );

  const logout = useCallback(async () => {
    isLoggingOut = true;
    await toastAsync(
      async () => {
        try {
          await apiRequest("/auth/logout", { method: "POST" });
        } finally {
          await signOut(auth).catch(() => {});

          // 👇 Immediately clear session state so UI updates instantly
          setUser(null);
          setLoading(false);

          if (typeof window !== "undefined") {
            setTimeout(() => {
              window.location.replace("/login");
            }, 200);
          }
        }
      },
      {
        loading: "Logging out...",
        success: "Logged out successfully.",
        error: "Logout failed. Please try again.",
      }
    );
    setTimeout(() => {
      isLoggingOut = false;
    }, 1200);
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

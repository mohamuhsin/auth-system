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
  // user/me fields
  id?: string;
  uid?: string;
  email?: string;
  name?: string | null;
  avatarUrl?: string | null;
  role?: Role;
  isApproved?: boolean;
  // login/signup response may include nested user
  user?: {
    id: string;
    uid: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: Role;
    isApproved: boolean;
  };
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  loginWithFirebase: (firebaseUser: FirebaseUser) => Promise<ApiResponse>;
  signupWithFirebase: (
    firebaseUser: FirebaseUser,
    extra?: { name?: string; avatarUrl?: string }
  ) => Promise<ApiResponse>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Probe /users/me so we only redirect once the HttpOnly cookie is actually usable */
async function waitForSession(
  retries = 5,
  baseDelayMs = 200
): Promise<ApiResponse | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await apiRequest<ApiResponse>("/users/me");
      if (res && (res.status === "success" || res.code === 200) && res.email)
        return res;
    } catch {}
    await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /** build User from /users/me or nested login response */
  const toUser = (src: ApiResponse): User | null => {
    const u = src.user
      ? src.user
      : {
          id: src.id,
          uid: src.uid,
          email: src.email,
          name: src.name,
          avatarUrl: src.avatarUrl,
          role: src.role,
          isApproved: src.isApproved,
        };

    if (!u || !u.id || !u.email) return null;
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

  const fetchSession = useCallback(async () => {
    try {
      const res = await apiRequest<ApiResponse>("/users/me");
      if (res && (res.status === "success" || res.code === 200)) {
        const u = toUser(res);
        setUser(u);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initialize on mount
    fetchSession();
  }, [fetchSession]);

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

        // handle backend signals
        if ((res as any).code === 403) {
          toastMessage("Please verify your email before logging in.", {
            type: "warning",
          });
          setUser(null);
          return res;
        }
        if ((res as any).code === 404) {
          toastMessage("No account found. Redirecting to signup...", {
            type: "warning",
          });
          setUser(null);
          return res;
        }

        // probe cookie
        const probe = await waitForSession();
        if (probe) {
          const u = toUser(probe);
          setUser(u);
        }

        return { ...res, status: res.status ?? "success" };
      } catch (err: any) {
        toastMessage(err?.message || "Login failed.", { type: "error" });
        return {
          status: "error",
          code: 500,
          message: err?.message || "Login failed",
        };
      }
    },
    []
  );

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

        // password flow pending verification
        if (
          (res as any).status === "pending_verification" ||
          (res as any).code === 202
        ) {
          try {
            // if caller wants to send verify email, do it at the page level;
            // here we just ensure user signs out so cookie won’t be created.
            await signOut(auth);
          } catch {}
          setUser(null);
          return { ...res, status: "pending_verification" };
        }

        if ((res as any).status === "error") {
          throw new Error(res.message || "Signup failed on server");
        }

        // probe cookie (google/verified scenario)
        const probe = await waitForSession();
        if (probe) {
          const u = toUser(probe);
          setUser(u);
        }

        return { ...res, status: "success" };
      } catch (err: any) {
        toastMessage(err?.message || "Signup failed.", { type: "error" });
        return {
          status: "error",
          code: 500,
          message: err?.message || "Signup failed",
        };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await toastAsync(
      async () => {
        try {
          await apiRequest("/auth/logout", { method: "POST" });
        } finally {
          // even if backend fails, make sure firebase state is cleared client-side
          await signOut(auth).catch(() => {});
          setUser(null);
        }
      },
      {
        loading: "Logging out...",
        success: "Logged out successfully",
        error: "Logout failed. Please try again.",
      }
    );
  }, []);

  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      loginWithFirebase,
      signupWithFirebase,
      logout,
      refreshSession,
    }),
    [
      user,
      loading,
      loginWithFirebase,
      signupWithFirebase,
      logout,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

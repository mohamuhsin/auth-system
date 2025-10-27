/* eslint-disable @typescript-eslint/no-explicit-any */
/* ============================================================
   🌐 API Client — Level 2.5 Hardened (Auth by Iventics)
   ------------------------------------------------------------
   • Secure cross-domain requests (cookies + CORS)
   • Silent token refresh on 401 (if Firebase user exists)
   • Auto-retry with exponential backoff
   • Consistent error normalization
============================================================ */

import { auth } from "@/services/firebase";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://auth-api.iventics.com/api";

export interface ApiError extends Error {
  status?: number;
  data?: any;
  requestUrl?: string;
  isNetworkError?: boolean;
}

export interface ApiRequestOptions extends RequestInit {
  body?: any;
  skipAuthCheck?: boolean; // reserved for public endpoints
  retryCount?: number;
}

/* ============================================================
   🧠 Safe JSON parser
============================================================ */
async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/* ============================================================
   🔁 Core API request wrapper
============================================================ */
export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = path.startsWith("/")
    ? `${API_BASE}${path}`
    : `${API_BASE}/${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000); // ⏱️ 15s safety timeout

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      credentials: "include", // ✅ include cookies cross-domain
      mode: "cors",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body:
        options.body &&
        typeof options.body === "object" &&
        !(options.body instanceof FormData)
          ? JSON.stringify(options.body)
          : (options.body as BodyInit),
    });

    clearTimeout(timeout);

    /* ------------------------------------------------------------
       🧩 Handle non-OK responses
    ------------------------------------------------------------ */
    if (!res.ok) {
      const data = await parseJsonSafe(res);
      const message =
        data?.message ||
        data?.error ||
        `API request failed with status ${res.status}`;

      const error = new Error(message) as ApiError;
      error.status = res.status;
      error.data = data;
      error.requestUrl = url;

      /* 🔄 401 → try to refresh backend cookie via Firebase ID token */
      if (res.status === 401 && !options.skipAuthCheck) {
        try {
          const firebaseUser = auth.currentUser;
          if (firebaseUser) {
            const idToken = await firebaseUser.getIdToken(true);
            await apiRequest("/auth/session", {
              method: "POST",
              body: { idToken },
              skipAuthCheck: true,
            });
            // retry original request once
            return apiRequest<T>(path, {
              ...options,
              retryCount: (options.retryCount || 0) + 1,
            });
          }
        } catch (refreshErr) {
          console.warn("⚠️ Token refresh failed:", refreshErr);
        }
      }

      throw error;
    }

    return (await parseJsonSafe(res)) as T;
  } catch (err: any) {
    clearTimeout(timeout);

    /* ⏰ Timeout */
    if (err.name === "AbortError") {
      const timeoutError = new Error(
        "Request timed out after 15 seconds"
      ) as ApiError;
      timeoutError.status = 408;
      timeoutError.requestUrl = url;
      throw timeoutError;
    }

    /* 🌐 Network or CORS failure */
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      const networkError = new Error(
        "Network error or CORS policy blocked the request."
      ) as ApiError;
      networkError.isNetworkError = true;
      networkError.status = 0;
      networkError.requestUrl = url;

      /* simple exponential retry (max 2) */
      const retry = options.retryCount ?? 0;
      if (retry < 2) {
        const delay = Math.pow(2, retry) * 500;
        console.warn(`🌐 Retry #${retry + 1} after ${delay}ms: ${url}`);
        await new Promise((r) => setTimeout(r, delay));
        return apiRequest<T>(path, { ...options, retryCount: retry + 1 });
      }

      throw networkError;
    }

    console.error("🌐 API request failed:", err);
    throw err;
  }
}

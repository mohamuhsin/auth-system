/* eslint-disable @typescript-eslint/no-explicit-any */

import { auth } from "@/services/firebase";
import { toast, toastMessage } from "@/lib/toast";

/* Base URL */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://auth-api.iventics.com/api";

/* Types */
export interface ApiError extends Error {
  status?: number;
  data?: any;
  requestUrl?: string;
  isNetworkError?: boolean;
}

export interface ApiRequestOptions extends RequestInit {
  body?: any;
  skipAuthCheck?: boolean;
  retryCount?: number;
}

/* Safe JSON parser */
async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/* Generate request ID */
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 0x0f;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/*  Core API Request */
export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = path.startsWith("/")
    ? `${API_BASE}${path}`
    : `${API_BASE}/${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const requestId = uuidv4();

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      credentials: "include",
      mode: "cors",
      keepalive: true,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "x-request-id": requestId,
        ...(options.headers || {}),
      },
      body:
        options.body &&
        typeof options.body === "object" &&
        !(options.body instanceof FormData)
          ? JSON.stringify(options.body)
          : (options.body as BodyInit),
    });

    /*  Handle Non-OK Responses */
    if (!res.ok) {
      const data = await parseJsonSafe(res);
      const message =
        data?.message ||
        data?.error ||
        (res.status === 401
          ? ""
          : `API request failed with status ${res.status}`);

      const error = Object.assign(new Error(message), {
        name: "ApiError",
        status: res.status,
        data,
        requestUrl: url,
      }) as ApiError;

      /* Attempt Firebase token refresh once */
      if (
        res.status === 401 &&
        !options.skipAuthCheck &&
        (options.retryCount ?? 0) < 1
      ) {
        try {
          const firebaseUser = auth.currentUser;
          if (firebaseUser) {
            console.info(`401 from ${path} → refreshing Firebase ID token`);
            const idToken = await firebaseUser.getIdToken(true);
            await apiRequest("/auth/session", {
              method: "POST",
              body: { idToken },
              skipAuthCheck: true,
            });
            return apiRequest<T>(path, {
              ...options,
              retryCount: (options.retryCount || 0) + 1,
            });
          }
        } catch (refreshErr) {
          console.warn("Token refresh failed:", refreshErr);
        }
      }

      /* Silent 401s during cookie probing (/users/me, /auth/session) */
      if (
        res.status === 401 &&
        (path.includes("/users/me") || path.includes("/auth/session"))
      ) {
        console.info(`[auth] Silent 401 during session probe: ${path}`);
        throw Object.assign(error, { silent: true });
      }

      /* Show production-safe toast only for real user errors */
      toast.dismiss();
      if (res.status === 401) {
        toastMessage("Your session has expired. Please sign in again.", {
          type: "warning",
        });
      } else if (res.status >= 500) {
        toastMessage("Server error occurred. Please try again later.", {
          type: "error",
        });
      } else if (res.status >= 400) {
        toastMessage(message || "Request failed. Please try again.", {
          type: "error",
        });
      }

      throw error;
    }

    /* 204 No Content */
    if (res.status === 204) return {} as T;

    /* Return parsed JSON */
    return (await parseJsonSafe(res)) as T;
  } catch (err: any) {
    /* Timeout */
    if (err.name === "AbortError") {
      toast.dismiss();
      toastMessage("Request timed out after 15 seconds.", { type: "warning" });
      throw Object.assign(new Error("Request timed out after 15 seconds."), {
        status: 408,
        requestUrl: url,
      }) as ApiError;
    }

    /* Network / CORS */
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      const retry = options.retryCount ?? 0;
      if (retry < 2) {
        const delay = Math.pow(2, retry) * 500;
        console.warn(`Retry #${retry + 1} after ${delay} ms → ${url}`);
        await new Promise((r) => setTimeout(r, delay));
        return apiRequest<T>(path, { ...options, retryCount: retry + 1 });
      }

      toast.dismiss();
      toastMessage("Network error. Please check your connection.", {
        type: "error",
      });

      throw Object.assign(
        new Error("Network error or CORS policy blocked the request."),
        { isNetworkError: true, status: 0, requestUrl: url }
      ) as ApiError;
    }

    /* Catch-all fallback (only visible if not silent) */
    if (!err?.silent) {
      console.error("API request failed:", err);
      toast.dismiss();
      toastMessage("An unexpected error occurred.", { type: "error" });
    }

    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

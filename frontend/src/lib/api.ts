/* eslint-disable @typescript-eslint/no-explicit-any */

import { auth } from "@/services/firebase";
import { toast, toastMessage } from "@/lib/toast";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://auth-api.iventics.com/api";

export interface ApiError extends Error {
  status?: number;
  data?: any;
  requestUrl?: string;
  isNetworkError?: boolean;
  silent?: boolean;
}

export interface ApiRequestOptions extends RequestInit {
  body?: any;
  skipAuthCheck?: boolean;
  retryCount?: number;
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 0x0f;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = path.startsWith("/")
    ? `${API_BASE}${path}`
    : `${API_BASE}/${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
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

    if (!res.ok) {
      const data = await parseJsonSafe(res);
      const message =
        data?.message ||
        data?.error ||
        (res.status === 401 ? "" : `Request failed with status ${res.status}`);

      const error: ApiError = Object.assign(new Error(message), {
        name: "ApiError",
        status: res.status,
        data,
        requestUrl: url,
      });

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

      if (
        res.status === 403 &&
        (message?.toLowerCase()?.includes("verify your email") ||
          message?.toLowerCase()?.includes("pending verification"))
      ) {
        console.info(`[auth] Skipping toast for pending verification: ${path}`);
        throw Object.assign(new Error(message), {
          name: "ApiError",
          status: res.status,
          data,
          requestUrl: url,
          silent: true,
        });
      }

      if (
        res.status === 401 &&
        (path.includes("/users/me") || path.includes("/auth/session"))
      ) {
        console.info(`[auth] Silent 401 during session probe: ${path}`);
        throw Object.assign(error, { silent: true });
      }

      if (
        res.status === 404 &&
        (path.includes("/auth/login-with-firebase") ||
          path.includes("/auth/signup-with-firebase"))
      ) {
        console.info(
          `[auth] Ignoring 404 (handled via Google auto-create): ${path}`
        );
        throw Object.assign(error, { silent: true });
      }

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

    if (res.status === 204) return {} as T;

    return (await parseJsonSafe(res)) as T;
  } catch (err: any) {
    if (err.name === "AbortError") {
      toast.dismiss();
      toastMessage("Request timed out after 15 seconds.", { type: "warning" });
      throw Object.assign(new Error("Request timed out after 15 seconds."), {
        status: 408,
        requestUrl: url,
      }) as ApiError;
    }

    if (err instanceof TypeError && err.message === "Failed to fetch") {
      const retry = options.retryCount ?? 0;
      if (retry < 2) {
        const delay = Math.pow(2, retry) * 500;
        console.warn(`Retry #${retry + 1} after ${delay} ms → ${url}`);
        await new Promise((r) => setTimeout(r, delay));
        return apiRequest<T>(path, { ...options, retryCount: retry + 1 });
      }

      toast.dismiss();
      toastMessage("Network error or CORS issue. Please try again.", {
        type: "error",
      });

      throw Object.assign(
        new Error("Network error or CORS policy blocked the request."),
        { isNetworkError: true, status: 0, requestUrl: url }
      ) as ApiError;
    }

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

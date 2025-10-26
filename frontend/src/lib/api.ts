/* eslint-disable @typescript-eslint/no-explicit-any */
/* ============================================================
   🌐 API Client — Iventics Auth System (Frontend)
   ------------------------------------------------------------
   Handles secure cross-domain requests with cookies.
   Compatible with Express backend + Firebase sessions.
============================================================ */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://auth-api.iventics.com/api";

export interface ApiError extends Error {
  status?: number;
  data?: any;
  requestUrl?: string;
}

/**
 * Extended fetch options — allows sending JSON objects directly.
 */
export interface ApiRequestOptions extends RequestInit {
  body?: any;
  skipAuthCheck?: boolean; // optional future use (e.g. public endpoints)
}

/**
 * Unified API request wrapper.
 * Automatically:
 *  - Sends secure cookies
 *  - Parses JSON responses
 *  - Handles timeouts & structured errors
 */
export async function apiRequest<T>(
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
      credentials: "include", // ✅ required for cookie-based sessions
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

    // 🧩 Handle non-2xx responses
    if (!res.ok) {
      const contentType = res.headers.get("content-type") || "";
      let data: any = null;

      if (contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      }

      const message =
        data?.message ||
        data?.error ||
        `API request failed with status ${res.status}`;

      const error = new Error(message) as ApiError;
      error.status = res.status;
      error.data = data;
      error.requestUrl = url;
      throw error;
    }

    // 🧠 Gracefully handle empty JSON bodies
    const text = await res.text();
    if (!text) return {} as T;

    try {
      return JSON.parse(text) as T;
    } catch {
      return {} as T;
    }
  } catch (err: any) {
    clearTimeout(timeout);

    // ⏰ Timeout handling
    if (err.name === "AbortError") {
      const timeoutError = new Error(
        "Request timed out after 15 seconds"
      ) as ApiError;
      timeoutError.status = 408;
      timeoutError.requestUrl = path;
      console.error("🌐 Timeout:", timeoutError);
      throw timeoutError;
    }

    console.error("🌐 API request failed:", err);
    throw err;
  }
}

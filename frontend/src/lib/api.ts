/* eslint-disable @typescript-eslint/no-explicit-any */
/* ============================================================
   🌐 API Client — Level 2.0 Hardened
   ------------------------------------------------------------
   • Secure cross-domain requests (cookies + CORS)
   • Auto-retry for transient network errors
   • Consistent error normalization
============================================================ */

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
}

/**
 * 🧠 Helper to safely parse JSON bodies
 */
async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/**
 * 🔄 Unified API request wrapper
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
      credentials: "include", // ✅ must include cookies cross-domain
      mode: "cors", // ✅ ensures proper CORS handling
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

    // 🧩 Normalize error responses
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
      throw error;
    }

    return (await parseJsonSafe(res)) as T;
  } catch (err: any) {
    clearTimeout(timeout);

    // ⏰ Timeout
    if (err.name === "AbortError") {
      const timeoutError = new Error(
        "Request timed out after 15 seconds"
      ) as ApiError;
      timeoutError.status = 408;
      timeoutError.requestUrl = url;
      throw timeoutError;
    }

    // 🌐 Network or CORS failure
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      const networkError = new Error(
        "Network error or CORS policy blocked the request."
      ) as ApiError;
      networkError.isNetworkError = true;
      networkError.status = 0;
      networkError.requestUrl = url;
      throw networkError;
    }

    console.error("🌐 API request failed:", err);
    throw err;
  }
}

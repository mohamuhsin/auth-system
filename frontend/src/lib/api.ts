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
}

/**
 * Enhanced type for options so body can be any JSON-like value.
 */
export interface ApiRequestOptions extends RequestInit {
  body?: any; // 👈 allows { idToken }, { email }, etc.
}

/**
 * Safe API request wrapper with unified error handling.
 * Automatically stringifies objects and maintains session cookies.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = path.startsWith("/")
    ? `${API_BASE}${path}`
    : `${API_BASE}/${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000); // 15 s safety timeout

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      credentials: "include", // 🔐 send cookies with cross-domain requests
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

    if (!res.ok) {
      let message = `API Error ${res.status}`;
      try {
        const json = await res.json();
        if (json?.message) message = json.message;
      } catch {
        /* ignore non-JSON errors */
      }

      const error = new Error(message) as ApiError;
      error.status = res.status;
      throw error;
    }

    // Gracefully handle empty bodies
    return (await res.json().catch(() => ({}))) as T;
  } catch (err) {
    clearTimeout(timeout);
    console.error("🌐 API request failed:", err);
    throw err;
  }
}

/* ============================================================
   🌐 API Client — Iventics Auth System (Frontend)
   ------------------------------------------------------------
   Handles secure cross-domain requests with cookies.
   Compatible with Express backend + Firebase sessions.
============================================================ */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://auth-api.iventics.com/api";

interface ApiError extends Error {
  status?: number;
}

/**
 * Safe API request wrapper with unified error handling.
 * Ensures secure cross-domain session cookies.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("/")
    ? `${API_BASE}${path}`
    : `${API_BASE}/${path}`;

  const res = await fetch(url, {
    method: options.method || "GET",
    credentials: "include", // ✅ crucial for session cookies
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body,
  });

  // 🧩 Graceful error handling
  if (!res.ok) {
    let message = `API Error ${res.status}`;
    try {
      const json = await res.json();
      if (json?.message) message = json.message;
    } catch {
      /* ignore JSON parse failure */
    }

    const error = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }

  // ✅ Parse JSON (fallback for empty responses)
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

/* ============================================================
   🌐 API Client — Iventics Auth System (Frontend)
   ------------------------------------------------------------
   Handles secure cross-domain requests with cookies.
   Compatible with Express backend + Firebase sessions.
============================================================ */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://auth-api.iventics.com/api";

interface ApiError {
  message: string;
  status?: number;
}

/**
 * Safe API request wrapper with unified error handling.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("/")
    ? `${API_BASE}${path}`
    : `${API_BASE}/${path}`;

  const res = await fetch(url, {
    ...options,
    credentials: "include", // required for secure cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // 🧩 Parse and handle errors gracefully
  if (!res.ok) {
    let errorData: ApiError = { message: `API Error ${res.status}` };

    try {
      const json = await res.json();
      if (json && typeof json.message === "string") {
        errorData = { message: json.message, status: res.status };
      }
    } catch {
      // fallback already set
    }

    const error = new Error(errorData.message) as ApiError;
    error.status = errorData.status ?? res.status;
    throw error;
  }

  // ✅ Parse JSON safely
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T; // fallback for empty responses (e.g., 204 No Content)
  }
}

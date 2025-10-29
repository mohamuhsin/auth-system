/**
 * 🧩 safeError — Level 2.5 Hardened (Auth by Iventics)
 * ------------------------------------------------------------
 * Converts any thrown value into a safe, structured, and log-ready string.
 *
 * ✅ Handles:
 *    • Firebase / Prisma / generic Errors
 *    • Circular references
 *    • Sensitive-field redaction
 *    • Non-Error primitives
 *
 * ✅ Never throws — guaranteed safe even inside catch blocks.
 */
export function safeError(err: unknown): string {
  try {
    // ------------------------------------------------------------
    // 🎯 Standard JS Error instance
    // ------------------------------------------------------------
    if (err instanceof Error) {
      const code =
        (err as any).code && typeof (err as any).code === "string"
          ? ` (code: ${(err as any).code})`
          : "";

      const stack =
        process.env.NODE_ENV === "production"
          ? ""
          : err.stack
          ? `\n${err.stack}`
          : "";

      return `[${err.name}] ${err.message}${code}${stack}`.trim();
    }

    // ------------------------------------------------------------
    // 🧱 Non-Error objects (safe JSON, circular-ref protected)
    // ------------------------------------------------------------
    if (typeof err === "object" && err !== null) {
      const cache = new WeakSet<object>();
      const json = JSON.stringify(
        err,
        (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (cache.has(value)) return "[Circular]";
            cache.add(value);
          }

          // 🚫 Redact sensitive fields
          const lowered = key.toLowerCase();
          if (
            ["password", "token", "secret", "privatekey", "apikey"].includes(
              lowered
            )
          ) {
            return "[REDACTED]";
          }

          return value;
        },
        2
      );
      return json;
    }

    // ------------------------------------------------------------
    // 🔡 Primitive fallback (string, number, boolean, etc.)
    // ------------------------------------------------------------
    return String(err);
  } catch (fatal: unknown) {
    const f = fatal as Error;
    return `[safeError failed] ${
      f?.message || String(fatal) || "Unknown error"
    }`;
  }
}

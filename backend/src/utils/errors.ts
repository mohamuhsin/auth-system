/**
 * 🧩 safeError — Level 2.0 Hardened
 * ------------------------------------------------------------
 * Converts any thrown value into a safe, structured, and log-ready string.
 * Handles:
 *   - Firebase / Prisma / generic Errors
 *   - Circular references
 *   - Sensitive data redaction
 *   - Non-Error primitives (string, number, object)
 */

export function safeError(err: unknown): string {
  try {
    // 🎯 Standard JS Error instance
    if (err instanceof Error) {
      const code = (err as any).code ? ` (code: ${(err as any).code})` : "";
      const stack =
        process.env.NODE_ENV === "production" ? "" : `\n${err.stack ?? ""}`;
      return `[${err.name}] ${err.message}${code}${stack}`.trim();
    }

    // 🧱 Handle non-Error objects safely (avoid circular refs)
    if (typeof err === "object" && err !== null) {
      const cache = new Set<any>();
      const json = JSON.stringify(
        err,
        (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (cache.has(value)) return "[Circular]";
            cache.add(value);
          }

          // 🚫 Redact sensitive fields
          if (["password", "token", "secret", "privateKey"].includes(key)) {
            return "[REDACTED]";
          }

          return value;
        },
        2
      );
      return json;
    }

    // 🔡 Handle primitives
    return String(err);
  } catch (fatal) {
    return `[safeError failed] ${(fatal as Error).message || String(fatal)}`;
  }
}

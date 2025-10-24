/**
 * 🧩 safeError
 * ------------------------------------------------------------
 * Converts any unknown error into a safe, readable string.
 * Prevents logging failures caused by circular or non-Error objects.
 *
 * Usage example:
 *   logger.error(safeError(err))
 */
export function safeError(err: unknown): string {
  if (err instanceof Error) return err.message;

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

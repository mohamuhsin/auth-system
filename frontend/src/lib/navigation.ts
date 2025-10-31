/**
 * 🔁 go(path, delay)
 * ------------------------------------------------------------
 * Safe delayed redirect helper (for consistent toast timing)
 * Example:
 *   go("/dashboard", 800);
 */
export function go(path: string, delay = 1000) {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    try {
      window.location.replace(path);
    } catch {
      window.location.href = path;
    }
  }, delay);
}

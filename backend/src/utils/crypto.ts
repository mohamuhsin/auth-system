import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * 🔐 generateToken — Level 2.5 Hardened
 * ------------------------------------------------------------
 * Generates a cryptographically secure random token.
 * Default: 32 bytes → 64-character hex string.
 *
 * ✅ Uses `crypto.randomBytes`
 * ✅ Input validation
 * ✅ Works for session, API, and CSRF tokens
 */
export function generateToken(length = 32): string {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("Invalid token length — must be a positive integer.");
  }
  return randomBytes(length).toString("hex");
}

/**
 * 🧩 hashToken
 * ------------------------------------------------------------
 * One-way SHA-256 hash for session or API tokens.
 * ❗ Not for passwords — use bcrypt or argon2 for password hashing.
 *
 * Example:
 *   const hash = hashToken("my-secret-token");
 */
export function hashToken(token: string): string {
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("Token required for hashing");
  }

  return createHash("sha256").update(token).digest("hex");
}

/**
 * ✅ verifyToken
 * ------------------------------------------------------------
 * Constant-time comparison between a plain token and a stored hash.
 * Prevents timing attacks (avoids early-exit comparisons).
 *
 * Example:
 *   if (verifyToken(input, storedHash)) { ... }
 */
export function verifyToken(token: string, hashed: string): boolean {
  if (typeof token !== "string" || typeof hashed !== "string") {
    throw new Error("Invalid inputs for token verification");
  }

  const computed = hashToken(token);
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(hashed, "hex");

  // Constant-time compare
  return a.length === b.length && timingSafeEqual(a, b);
}

import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * 🔐 generateToken
 * ------------------------------------------------------------
 * Generates a cryptographically secure random token.
 * Default: 32 bytes → 64-character hex string.
 */
export function generateToken(length = 32): string {
  if (!length || length <= 0) throw new Error("Invalid token length");
  return randomBytes(length).toString("hex");
}

/**
 * 🧩 hashToken
 * ------------------------------------------------------------
 * One-way SHA-256 hash for session or API tokens.
 * (⚠️ Not for passwords — use bcrypt/argon2 for those.)
 */
export function hashToken(token: string): string {
  if (!token) throw new Error("Token required for hashing");
  return createHash("sha256").update(token).digest("hex");
}

/**
 * ✅ verifyToken
 * ------------------------------------------------------------
 * Constant-time comparison between a plain token and a stored hash.
 * Prevents timing attacks.
 */
export function verifyToken(token: string, hashed: string): boolean {
  const computed = hashToken(token);
  const a = Buffer.from(computed);
  const b = Buffer.from(hashed);
  return a.length === b.length && timingSafeEqual(a, b);
}

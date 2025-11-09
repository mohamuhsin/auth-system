import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function generateToken(length = 32): string {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("Invalid token length — must be a positive integer.");
  }

  return randomBytes(length).toString("hex");
}

export function hashToken(token: string): string {
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("Token required for hashing.");
  }

  return createHash("sha256").update(token).digest("hex");
}

export function verifyToken(token: string, hashed: string): boolean {
  if (typeof token !== "string" || typeof hashed !== "string") {
    throw new Error("Invalid inputs for token verification.");
  }

  const computed = hashToken(token);
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(hashed, "hex");

  return a.length === b.length && timingSafeEqual(a, b);
}

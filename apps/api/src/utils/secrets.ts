import crypto from "node:crypto";

export function generateSecret(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function secretMatches(expectedHash: string | undefined, candidate: string | undefined): boolean {
  if (!expectedHash || !candidate) return false;
  const actual = Buffer.from(hashSecret(candidate), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time string equality. Both inputs are hashed to a fixed 32-byte
 * digest first, so neither the comparison time nor the early-return leaks the
 * secret's length or contents (a plain `a !== b` compares byte-by-byte and
 * short-circuits, which is timing-observable).
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

/**
 * Whether a cron request carries the correct `Authorization: Bearer <secret>`
 * header, compared in constant time. Callers must have already confirmed the
 * secret is configured.
 */
export function cronAuthorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  return timingSafeEqualStr(header, `Bearer ${secret}`);
}

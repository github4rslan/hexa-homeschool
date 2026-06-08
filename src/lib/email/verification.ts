import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomInt } from "node:crypto";

/**
 * Email-verification tokens — short-lived signed JWTs (separate purpose from
 * session tokens). Reuses AUTH_SECRET so no extra config is needed.
 */

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET is not set.");
  return new TextEncoder().encode(s);
}

export async function createVerificationToken(parentId: string): Promise<string> {
  return new SignJWT({ purpose: "email_verify" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(parentId)
    .setIssuedAt()
    .setExpirationTime("48h")
    .sign(secret());
}

export async function verifyVerificationToken(
  token: string,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== "email_verify" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

// ── 6-digit code verification (stateless) ───────────────────
// The signup flow emails a 6-digit code and issues a short-lived signed token
// (stored in an httpOnly cookie) that carries the parentId + a HASH of the
// code. The code itself is never in the token/cookie. On submit we re-hash the
// typed code and compare. No DB schema change; survives redeploys.

/** Cryptographically-random 6-digit code, e.g. "048213". */
export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashCode(code: string, parentId: string): string {
  return createHash("sha256").update(`${parentId}:${code}`).digest("hex");
}

/** Signed token binding a parentId to a code hash; expires in 15 minutes. */
export async function createCodeToken(
  parentId: string,
  code: string,
): Promise<string> {
  return new SignJWT({ purpose: "email_code", h: hashCode(code, parentId) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(parentId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret());
}

/**
 * Verify a typed code against a code token. Returns the parentId on success,
 * or null if the token is invalid/expired or the code doesn't match.
 */
export async function verifyCodeToken(
  token: string,
  code: string,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== "email_code" || !payload.sub) return null;
    const expected = payload.h;
    if (typeof expected !== "string") return null;
    return expected === hashCode(code.trim(), payload.sub)
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://hexa-homeschool.vercel.app"
  );
}

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
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
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
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
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

// ── Two-factor sign-in codes ─────────────────────────────────
// Same stateless pattern as the signup codes, but a distinct purpose, a
// 10-minute expiry, and an attempt counter signed into the token: each wrong
// guess re-issues the token with `a` incremented (original expiry preserved),
// and after MAX_TWO_FACTOR_ATTEMPTS the token is dead — the parent must sign
// in again for a fresh code. Single use: the cookie is deleted on success.

export const MAX_TWO_FACTOR_ATTEMPTS = 5;

/** Signed token binding a parentId to a 2FA code hash; expires in 10 minutes. */
export async function createTwoFactorToken(
  parentId: string,
  code: string,
): Promise<string> {
  return new SignJWT({ purpose: "twofa_code", h: hashCode(code, parentId), a: 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(parentId)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret());
}

export type TwoFactorCheck =
  | { status: "ok"; parentId: string }
  /** Wrong code with attempts left — set `retryToken` as the new cookie. */
  | { status: "bad_code"; parentId: string; remaining: number; retryToken: string }
  /** Wrong code and the attempt budget is spent — require a fresh sign-in. */
  | { status: "exhausted"; parentId: string }
  /** Missing/garbled/expired token. */
  | { status: "invalid" };

export async function checkTwoFactorToken(
  token: string,
  code: string,
): Promise<TwoFactorCheck> {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] }));
  } catch {
    return { status: "invalid" };
  }
  if (payload.purpose !== "twofa_code" || !payload.sub) return { status: "invalid" };
  const expected = payload.h;
  const attempts = typeof payload.a === "number" ? payload.a : 0;
  if (typeof expected !== "string" || typeof payload.exp !== "number") {
    return { status: "invalid" };
  }

  if (expected === hashCode(code.trim(), payload.sub)) {
    return { status: "ok", parentId: payload.sub };
  }

  const nextAttempts = attempts + 1;
  if (nextAttempts >= MAX_TWO_FACTOR_ATTEMPTS) {
    return { status: "exhausted", parentId: payload.sub };
  }
  const retryToken = await new SignJWT({
    purpose: "twofa_code",
    h: expected,
    a: nextAttempts,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(payload.exp) // keep the ORIGINAL 10-minute window
    .sign(secret());
  return {
    status: "bad_code",
    parentId: payload.sub,
    remaining: MAX_TWO_FACTOR_ATTEMPTS - nextAttempts,
    retryToken,
  };
}

/** ParentId carried by a (possibly attempt-spent) 2FA token, for resends. */
export async function readTwoFactorSubject(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.purpose !== "twofa_code" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://edway.uk"
  );
}

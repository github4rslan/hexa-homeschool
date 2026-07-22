import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * RFC 6238 TOTP (authenticator-app 2FA) implemented on node:crypto — no third
 * party dependency. SHA-1, 6 digits, 30-second step (the universal authenticator
 * default: Google Authenticator, Authy, 1Password, etc.).
 *
 * Pure and deterministic given an explicit `atMs` (injected in tests), so the
 * algorithm is unit-tested against the published RFC vectors. No `server-only`
 * so it can be unit-tested; callers that touch secrets live in server modules.
 */

const DIGITS = 6;
const STEP_MS = 30_000;
const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Encode bytes as (unpadded) RFC 4648 base32 — the authenticator secret format. */
export function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

/** Decode a base32 string (padding/whitespace/case tolerant) to bytes. */
export function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) continue; // skip stray chars
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Generate a fresh random base32 secret (20 bytes = 160 bits, RFC-recommended). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** The 6-digit code for a given counter value. */
function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  // 64-bit big-endian counter (safe for JS-range counters).
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const digest = createHmac("sha1", secret).update(buf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

/** The TOTP code for a base32 secret at a given time (defaults to now). */
export function totpCode(secretBase32: string, atMs: number = Date.now()): string {
  return hotp(base32Decode(secretBase32), Math.floor(atMs / STEP_MS));
}

/**
 * Verify a submitted code against the secret, allowing ±`window` steps of clock
 * skew (default ±1 = ±30s). Constant-time per-candidate comparison.
 */
export function verifyTotp(
  secretBase32: string,
  submitted: string,
  atMs: number = Date.now(),
  window = 1,
): boolean {
  const code = submitted.replace(/\D/g, "");
  if (code.length !== DIGITS) return false;
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(atMs / STEP_MS);
  for (let i = -window; i <= window; i++) {
    const candidate = hotp(secret, counter + i);
    const a = Buffer.from(candidate);
    const b = Buffer.from(code);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

/** Build the `otpauth://` URI an authenticator app scans / imports. */
export function otpauthUri(opts: {
  secretBase32: string;
  accountName: string;
  issuer?: string;
}): string {
  const issuer = opts.issuer ?? "Edway";
  const label = encodeURIComponent(`${issuer}:${opts.accountName}`);
  const params = new URLSearchParams({
    secret: opts.secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_MS / 1000),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Human-friendly recovery codes (single-use backup if the phone is lost). */
export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // 10 hex chars, grouped as xxxxx-xxxxx for readability.
    const raw = randomBytes(5).toString("hex");
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`);
  }
  return codes;
}

/** Normalise a recovery code for hashing/compare (strip dashes/space, lowercase). */
export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[\s-]/g, "").toLowerCase();
}

/**
 * SHA-256 hash of a normalised recovery code — the only form persisted (in
 * `ParentDoc.totp_recovery_hashes`). Enrolment stores these; sign-in hashes the
 * submitted code the same way and atomically consumes the match. Recovery codes
 * are high-entropy (40 bits each), so a plain salt-free hash is appropriate here
 * (unlike passwords).
 */
export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(normalizeRecoveryCode(code)).digest("hex");
}

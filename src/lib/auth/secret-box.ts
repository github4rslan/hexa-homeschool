import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

/**
 * Authenticated symmetric encryption (AES-256-GCM) for small secrets stored at
 * rest in Mongo — specifically the TOTP shared secret (F4). The key is derived
 * from AUTH_SECRET via scrypt with a fixed application salt, so no extra env var
 * is needed and rotating AUTH_SECRET invalidates stored boxes (which is the safe
 * failure mode — a parent just re-enrols their authenticator).
 *
 * Format: base64( iv(12) | authTag(16) | ciphertext ). Never store a raw secret.
 */

const SALT = "edway.totp.v1";

function key(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is not set — cannot encrypt secrets.");
  }
  return scryptSync(secret, SALT, 32);
}

export function sealSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

/** Returns the plaintext, or null if the box is malformed / can't be decrypted. */
export function openSecret(box: string): string | null {
  try {
    const raw = Buffer.from(box, "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

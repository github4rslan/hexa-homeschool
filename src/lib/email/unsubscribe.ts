import "server-only";
import { SignJWT, jwtVerify } from "jose";

/**
 * One-click unsubscribe tokens for MARKETING email (re-engagement series).
 *
 * A signed JWT (same `jose` HS256 pattern as verification.ts, reusing
 * AUTH_SECRET) binds a parentId to the single purpose "email_unsub". The
 * `/unsubscribe` route verifies it and sets `marketing_emails_opt_out = true`
 * WITHOUT requiring a login — as UK PECR/GDPR one-click unsubscribe requires.
 * Long-lived (a year) because an unsubscribe link must keep working long after
 * the email was sent; it grants nothing but opting THIS parent out of marketing.
 */

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET is not set.");
  return new TextEncoder().encode(s);
}

export async function createUnsubscribeToken(parentId: string): Promise<string> {
  return new SignJWT({ purpose: "email_unsub" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(parentId)
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(secret());
}

/** Returns the parentId to opt out, or null if the token is invalid/expired. */
export async function verifyUnsubscribeToken(
  token: string,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
    });
    if (payload.purpose !== "email_unsub" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

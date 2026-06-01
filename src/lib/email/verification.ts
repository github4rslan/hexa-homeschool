import "server-only";
import { SignJWT, jwtVerify } from "jose";

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

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://hexa-homeschool.vercel.app"
  );
}

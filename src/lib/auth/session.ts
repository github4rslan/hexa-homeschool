import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Custom auth session layer (replaces Supabase Auth).
 *
 * - Passwords are hashed with bcrypt (see auth/password.ts).
 * - Sessions are stateless signed JWTs stored in an httpOnly cookie.
 * - The JWT subject is the parent's Mongo _id (hex string).
 */

const COOKIE_NAME = "hexa_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is not set (or too short). Set a long random string in .env.local and Vercel.",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: string; // parent _id as hex string
  email: string;
  /**
   * Parent's token_version at issue time. "Sign out everywhere" bumps the
   * version in ParentDoc; repo.currentParentId() rejects sessions whose tv
   * no longer matches. Absent on legacy tokens = 0.
   */
  tokenVersion?: number;
}

/** Issue a signed session cookie for the given user. */
export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ email: user.email, tv: user.tokenVersion ?? 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Read + verify the current session, or null if absent/invalid. */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: String(payload.email ?? ""),
      tokenVersion: typeof payload.tv === "number" ? payload.tv : 0,
    };
  } catch {
    return null; // expired or tampered
  }
}

/** Clear the session cookie (logout). */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

/**
 * Edge-safe verification for middleware (no next/headers cookies()).
 * Returns the subject id if the raw token is valid, else null.
 */
export async function verifyToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

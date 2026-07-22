"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { findParentById, consumeTotpRecoveryCode } from "@/lib/db/repo";
import { createSession } from "@/lib/auth/session";
import { resolveRole } from "@/lib/auth/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { readTotpPendingSubject } from "@/lib/email/verification";
import { verifyTotp, hashRecoveryCode } from "@/lib/auth/totp";
import { openSecret } from "@/lib/auth/secret-box";
import { TOTP_PENDING_COOKIE } from "../twofa-cookie";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * Finish an authenticator (TOTP) sign-in: the caller already passed the password
 * step (proven by the short-lived `TOTP_PENDING_COOKIE`). Accept either a 6-digit
 * authenticator code OR a single-use recovery code; only then is the session
 * issued. Keyed rate-limit per IP (no session yet).
 */
export async function verifyTotpSignIn(formData: FormData) {
  const raw = String(formData.get("code") || "").trim();
  const restart = `/login?error=${encodeURIComponent("Your sign-in session expired. Please sign in again.")}`;
  const back = "/login/totp";

  const limited = await rateLimit(`totp-verify:${await clientIp()}`, 10, 60_000);
  if (limited.ok === false) {
    redirect(`${back}?error=${encodeURIComponent("Too many attempts. Please wait a minute and try again.")}`);
  }

  const jar = await cookies();
  const token = jar.get(TOTP_PENDING_COOKIE)?.value;
  if (!token) redirect(restart);

  const parentId = await readTotpPendingSubject(token!);
  if (!parentId) redirect(restart);

  const parent = await findParentById(parentId);
  if (!parent || !parent._id || !parent.totp_enabled || !parent.totp_secret_enc) {
    redirect(restart);
  }

  const secret = openSecret(parent!.totp_secret_enc!);
  if (!secret) redirect(restart);

  const digits = raw.replace(/\D/g, "");
  // A well-formed 6-digit entry is checked as a TOTP code; anything else (or a
  // failed code) is tried as a single-use recovery code (atomically consumed).
  let ok = digits.length === 6 && verifyTotp(secret!, digits);
  if (!ok && raw.length > 0) {
    ok = await consumeTotpRecoveryCode(parentId!, hashRecoveryCode(raw));
  }
  if (!ok) {
    redirect(`${back}?error=${encodeURIComponent("That code isn't right. Try again, or use a recovery code.")}`);
  }

  jar.delete(TOTP_PENDING_COOKIE); // single use
  await createSession({
    id: parent!._id!.toHexString(),
    email: parent!.email,
    tokenVersion: parent!.token_version ?? 0,
  });
  const role = resolveRole({ role: parent!.role, is_admin: parent!.is_admin });
  redirect(role === "tutor" ? "/tutor" : role ? "/admin" : "/dashboard");
}

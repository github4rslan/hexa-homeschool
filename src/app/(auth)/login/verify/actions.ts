"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { findParentById } from "@/lib/db/repo";
import { createSession } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/rbac";
import { sendEmail } from "@/lib/email/send";
import {
  generateCode,
  createTwoFactorToken,
  checkTwoFactorToken,
  readTwoFactorSubject,
} from "@/lib/email/verification";
import { twoFactorCodeTemplate } from "@/lib/email/templates";
import { rateLimit } from "@/lib/rate-limit";
import { TWOFA_COOKIE } from "../twofa-cookie";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 10,
};

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Check the typed 2FA code; on success issue the session. */
export async function verifyTwoFactor(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const code = String(formData.get("code") || "").replace(/\D/g, "");
  const back = `/login/verify?email=${encodeURIComponent(email)}`;
  const restart = `/login?error=${encodeURIComponent("Your sign-in code expired. Please sign in again.")}`;

  // Brute-force guard on top of the 5-attempt token budget. Keyed per IP —
  // the caller has no session yet.
  const limited = await rateLimit(`2fa-verify:${await clientIp()}`, 10, 60_000);
  if (limited.ok === false) {
    redirect(`${back}&error=${encodeURIComponent("Too many attempts. Please wait a minute and try again.")}`);
  }

  if (code.length !== 6) {
    redirect(`${back}&error=${encodeURIComponent("Enter the 6-digit code.")}`);
  }

  const jar = await cookies();
  const token = jar.get(TWOFA_COOKIE)?.value;
  if (!token) redirect(restart);

  const result = await checkTwoFactorToken(token!, code);

  if (result.status === "ok") {
    jar.delete(TWOFA_COOKIE); // single use
    const parent = await findParentById(result.parentId);
    if (!parent || !parent._id) redirect(restart);
    await createSession({
      id: parent!._id!.toHexString(),
      email: parent!.email,
      tokenVersion: parent!.token_version ?? 0,
    });
    // Staff land on the admin surface; everyone else on the parent dashboard.
    redirect(
      isStaff({ role: parent!.role, is_admin: parent!.is_admin })
        ? "/admin"
        : "/dashboard",
    );
  }

  if (result.status === "bad_code") {
    // Persist the incremented attempt counter.
    jar.set(TWOFA_COOKIE, result.retryToken, COOKIE_OPTS);
    const left = result.remaining === 1 ? "1 attempt" : `${result.remaining} attempts`;
    redirect(`${back}&error=${encodeURIComponent(`That code is incorrect — ${left} left.`)}`);
  }

  if (result.status === "exhausted") {
    jar.delete(TWOFA_COOKIE);
    redirect(
      `/login?error=${encodeURIComponent("Too many incorrect codes. Sign in again to get a fresh code.")}`,
    );
  }

  // invalid / expired
  jar.delete(TWOFA_COOKIE);
  redirect(restart);
}

/** Email a fresh code to the parent identified by the current 2FA cookie. */
export async function resendTwoFactorCode(email: string) {
  const restart = `/login?error=${encodeURIComponent("Your sign-in session expired. Please sign in again.")}`;

  const limited = await rateLimit(`2fa-resend:${await clientIp()}`, 3, 5 * 60_000);
  if (limited.ok === false) {
    redirect(
      `/login/verify?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Too many resends. Please wait a few minutes.")}`,
    );
  }

  const jar = await cookies();
  const token = jar.get(TWOFA_COOKIE)?.value;
  const parentId = token ? await readTwoFactorSubject(token) : null;
  if (!parentId) redirect(restart);

  const parent = await findParentById(parentId!);
  if (!parent || !parent._id) redirect(restart);

  const code = generateCode();
  const tmpl = twoFactorCodeTemplate({ name: parent!.full_name, code });
  const sent = await sendEmail({ to: parent!.email, subject: tmpl.subject, html: tmpl.html });
  if (sent.ok) {
    jar.set(TWOFA_COOKIE, await createTwoFactorToken(parentId!, code), COOKIE_OPTS);
  }
  redirect(`/login/verify?email=${encodeURIComponent(parent!.email)}&resent=1`);
}

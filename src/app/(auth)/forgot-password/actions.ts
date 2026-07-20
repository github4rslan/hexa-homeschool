"use server";

import { redirect } from "next/navigation";
import {
  findParentByEmail,
  findParentById,
  resetParentPassword,
} from "@/lib/db/repo";
import { hashPassword } from "@/lib/auth/password";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { passwordResetTemplate } from "@/lib/email/templates";
import {
  appUrl,
  createPasswordResetToken,
  verifyPasswordResetToken,
  resetSnapshot,
} from "@/lib/email/verification";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/auth/client-ip";

/**
 * Request a password-reset link. Always ends on the same generic "check your
 * inbox" screen whether or not the email exists (no account enumeration), and
 * degrades gracefully when Brevo is unset (no email, no crash) — consistent with
 * the codebase's "unset provider = no-op" rule. Rate-limited per IP + per email
 * to blunt enumeration/spam, mirroring login/actions.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const done = "/forgot-password?sent=1";

  if (!email || !email.includes("@")) {
    redirect(`/forgot-password?error=${encodeURIComponent("Please enter a valid email address.")}`);
  }

  const ip = await clientIp();
  const [ipGate, emailGate] = await Promise.all([
    rateLimit(`pwreset-ip:${ip}`, 5, 60_000),
    rateLimit(`pwreset-email:${email}`, 5, 15 * 60_000),
  ]);
  if (!ipGate.ok || !emailGate.ok) {
    // Same generic destination — never reveal the throttle discloses account state.
    redirect(done);
  }

  const parent = await findParentByEmail(email);
  // Only send when the account exists AND email is actually configured. Either
  // way we fall through to the identical success screen.
  if (parent?._id && emailConfigured()) {
    const snapshot = resetSnapshot(parent.password_hash, parent.token_version ?? 0);
    const token = await createPasswordResetToken(parent._id.toHexString(), snapshot);
    const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    const tmpl = passwordResetTemplate({ name: parent.full_name, resetUrl });
    // Best-effort: a send failure still lands on the generic screen (no leak).
    await sendEmail({ to: parent.email, subject: tmpl.subject, html: tmpl.html });
  }

  redirect(done);
}

/**
 * Complete a password reset. Verifies the single-use token snapshot against the
 * live account (so a used/stale link is refused), sets the new hash and bumps
 * token_version (invalidating every existing session and the link itself).
 */
export async function submitPasswordReset(formData: FormData) {
  const token = String(formData.get("token") || "");
  const next = String(formData.get("new_password") || "");
  const confirm = String(formData.get("confirm_password") || "");

  const invalid = `/reset-password?token=${encodeURIComponent(token)}`;

  if (next.length < 8) {
    redirect(`${invalid}&error=${encodeURIComponent("New password must be at least 8 characters.")}`);
  }
  if (next !== confirm) {
    redirect(`${invalid}&error=${encodeURIComponent("Those passwords don't match.")}`);
  }

  // Throttle submits per IP to blunt token-guessing.
  const ip = await clientIp();
  const gate = await rateLimit(`pwreset-submit:${ip}`, 10, 60_000);
  if (!gate.ok) {
    redirect(`${invalid}&error=${encodeURIComponent("Too many attempts. Please wait a moment and try again.")}`);
  }

  const parsed = await verifyPasswordResetToken(token);
  const expired = `/reset-password?expired=1`;
  if (!parsed) {
    redirect(expired);
  }

  const parent = await findParentById(parsed.parentId);
  // Single-use / replay guard: the snapshot must still match the live account.
  // A successful reset (or any later password change) moves password_hash and
  // token_version, so an already-used or stale link no longer validates.
  if (
    !parent ||
    resetSnapshot(parent.password_hash, parent.token_version ?? 0) !== parsed.snapshot
  ) {
    redirect(expired);
  }

  const hash = await hashPassword(next);
  const ok = await resetParentPassword(parsed.parentId, hash);
  if (!ok) {
    redirect(expired);
  }

  // Password changed — every session is invalidated; the parent signs in fresh.
  redirect(`/login?reset=1`);
}

"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { findParentByEmail } from "@/lib/db/repo";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import {
  generateCode,
  createCodeToken,
  createTwoFactorToken,
} from "@/lib/email/verification";
import { verifyCodeTemplate, twoFactorCodeTemplate } from "@/lib/email/templates";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/auth/client-ip";
import { isStaff } from "@/lib/auth/rbac";
import { TWOFA_COOKIE } from "./twofa-cookie";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email and password are required.")}`);
  }

  // Throttle credential verification: unbounded POSTs here are a
  // credential-stuffing + bcrypt-CPU-DoS surface on the accounts that gate
  // children's data. Per-IP is the primary control; a looser per-email bucket
  // (short window, so it self-heals) blunts single-account brute force. Trip →
  // the same generic message, so nothing about account existence leaks.
  const ip = await clientIp();
  const [ipGate, emailGate] = await Promise.all([
    rateLimit(`login-ip:${ip}`, 10, 60_000),
    rateLimit(`login-email:${email}`, 10, 15 * 60_000),
  ]);
  if (!ipGate.ok || !emailGate.ok) {
    redirect(
      `/login?error=${encodeURIComponent("Too many attempts. Please wait a moment and try again.")}`,
    );
  }

  const parent = await findParentByEmail(email);
  // Generic message either way — don't reveal whether the email exists.
  const invalid = `/login?error=${encodeURIComponent("Invalid email or password.")}`;

  if (!parent || !parent._id) {
    redirect(invalid);
  }

  const ok = await verifyPassword(password, parent.password_hash);
  if (!ok) {
    redirect(invalid);
  }

  // Require a verified email — but only when email sending is actually
  // configured, and only for accounts explicitly marked unverified. Legacy
  // rows (email_verified === undefined) are treated as verified. Send a fresh
  // code and route to the code-entry screen.
  if (emailConfigured() && parent.email_verified === false) {
    const code = generateCode();
    const tmpl = verifyCodeTemplate({ name: parent.full_name, code });
    const sent = await sendEmail({ to: parent.email, subject: tmpl.subject, html: tmpl.html });
    if (sent.ok) {
      const token = await createCodeToken(parent._id.toHexString(), code);
      const jar = await cookies();
      jar.set("hexa_verify", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15,
      });
    }
    redirect(`/signup/verify?email=${encodeURIComponent(parent.email)}`);
  }

  // Two-factor sign-in (opt-in). Only enforceable while email sending is
  // configured — if Brevo is unset, skip rather than lock the parent out.
  if (parent.two_factor_enabled && emailConfigured()) {
    const code = generateCode();
    const tmpl = twoFactorCodeTemplate({ name: parent.full_name, code });
    const sent = await sendEmail({ to: parent.email, subject: tmpl.subject, html: tmpl.html });
    if (!sent.ok) {
      redirect(
        `/login?error=${encodeURIComponent("We couldn't send your sign-in code. Please try again in a moment.")}`,
      );
    }
    const token = await createTwoFactorToken(parent._id.toHexString(), code);
    const jar = await cookies();
    jar.set(TWOFA_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
    redirect(`/login/verify?email=${encodeURIComponent(parent.email)}`);
  }

  await createSession({
    id: parent._id.toHexString(),
    email: parent.email,
    tokenVersion: parent.token_version ?? 0,
  });
  // Staff land on the admin surface; everyone else on the parent dashboard.
  redirect(
    isStaff({ role: parent.role, is_admin: parent.is_admin })
      ? "/admin"
      : "/dashboard",
  );
}

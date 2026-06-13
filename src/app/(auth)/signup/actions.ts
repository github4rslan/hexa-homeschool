"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { findParentByEmail, createParent, markEmailVerified } from "@/lib/db/repo";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { generateCode, createCodeToken } from "@/lib/email/verification";
import { verifyCodeTemplate } from "@/lib/email/templates";
import { captureServer } from "@/lib/analytics/server";
import { CODE_COOKIE } from "./verify-cookie";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();

  if (!email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Email and password are required.")}`);
  }
  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  }

  const existing = await findParentByEmail(email);
  if (existing) {
    redirect(`/signup?error=${encodeURIComponent("An account with this email already exists.")}`);
  }

  const passwordHash = await hashPassword(password);

  // If email isn't configured, auto-verify so no one is locked out before the
  // email provider is set up. Once BREVO_API_KEY exists, real verification runs.
  const autoVerify = !emailConfigured();

  const parentId = await createParent({
    email,
    fullName: fullName || null,
    passwordHash,
    emailVerified: autoVerify,
  });

  if (autoVerify) {
    captureServer(parentId, "signup_completed", { verification: "auto" });
    await createSession({ id: parentId, email });
    redirect("/onboarding");
  }

  // Email a 6-digit code; stash the signed code token in an httpOnly cookie.
  const code = generateCode();
  const tmpl = verifyCodeTemplate({ name: fullName || null, code });
  const res = await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html });

  // If the send failed (provider/sender error), don't strand the user waiting
  // for a code that will never arrive — verify them and sign them straight in.
  if (!res.ok) {
    await markEmailVerified(parentId);
    captureServer(parentId, "signup_completed", { verification: "send-failed" });
    await createSession({ id: parentId, email });
    redirect("/onboarding");
  }

  const token = await createCodeToken(parentId, code);
  const jar = await cookies();
  jar.set(CODE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 minutes, matches token expiry
  });

  redirect(`/signup/verify?email=${encodeURIComponent(email)}`);
}

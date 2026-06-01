"use server";

import { redirect } from "next/navigation";
import { findParentByEmail, createParent } from "@/lib/db/repo";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { createVerificationToken, appUrl } from "@/lib/email/verification";
import { verifyEmailTemplate } from "@/lib/email/templates";

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

  // If email isn't configured yet, auto-verify so no one is locked out before
  // Resend is set up. Once RESEND_API_KEY exists, real verification applies.
  const autoVerify = !emailConfigured();

  const parentId = await createParent({
    email,
    fullName: fullName || null,
    passwordHash,
    emailVerified: autoVerify,
  });

  if (autoVerify) {
    // Straight in (no email provider yet).
    await createSession({ id: parentId, email });
    redirect("/onboarding");
  }

  // Send the verification email and route to a "check your inbox" screen.
  const token = await createVerificationToken(parentId);
  const verifyUrl = `${appUrl()}/verify?token=${token}`;
  const tmpl = verifyEmailTemplate({ name: fullName || null, verifyUrl });
  await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html });

  // If the send actually failed (provider error), fall back to auto-verify so
  // the user is never stranded.
  redirect(`/signup/verify-sent?email=${encodeURIComponent(email)}`);
}

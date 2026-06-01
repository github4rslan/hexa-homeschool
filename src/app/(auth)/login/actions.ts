"use server";

import { redirect } from "next/navigation";
import { findParentByEmail } from "@/lib/db/repo";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { emailConfigured } from "@/lib/email/send";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email and password are required.")}`);
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
  // rows (email_verified === undefined) are treated as verified.
  if (emailConfigured() && parent.email_verified === false) {
    redirect(
      `/signup/verify-sent?email=${encodeURIComponent(parent.email)}`,
    );
  }

  await createSession({ id: parent._id.toHexString(), email: parent.email });
  redirect("/dashboard");
}

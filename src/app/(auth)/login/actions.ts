"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { findParentByEmail } from "@/lib/db/repo";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { generateCode, createCodeToken } from "@/lib/email/verification";
import { verifyCodeTemplate } from "@/lib/email/templates";

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

  await createSession({ id: parent._id.toHexString(), email: parent.email });
  redirect("/dashboard");
}

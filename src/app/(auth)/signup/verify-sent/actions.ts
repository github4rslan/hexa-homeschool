"use server";

import { redirect } from "next/navigation";
import { findParentByEmail } from "@/lib/db/repo";
import { sendEmail } from "@/lib/email/send";
import { createVerificationToken, appUrl } from "@/lib/email/verification";
import { verifyEmailTemplate } from "@/lib/email/templates";

export async function resendVerification(email: string) {
  const clean = email.trim().toLowerCase();
  if (!clean) redirect("/signup");

  const parent = await findParentByEmail(clean);
  // Don't reveal whether the account exists; just bounce back either way.
  if (parent?._id && !parent.email_verified) {
    const token = await createVerificationToken(parent._id.toHexString());
    const verifyUrl = `${appUrl()}/verify?token=${token}`;
    const tmpl = verifyEmailTemplate({ name: parent.full_name, verifyUrl });
    await sendEmail({ to: clean, subject: tmpl.subject, html: tmpl.html });
  }
  redirect(`/signup/verify-sent?email=${encodeURIComponent(clean)}&resent=1`);
}

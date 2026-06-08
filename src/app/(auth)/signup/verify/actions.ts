"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { findParentByEmail, markEmailVerified } from "@/lib/db/repo";
import { createSession } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/send";
import {
  generateCode,
  createCodeToken,
  verifyCodeToken,
} from "@/lib/email/verification";
import { verifyCodeTemplate } from "@/lib/email/templates";
import { CODE_COOKIE } from "../verify-cookie";

/** Check the typed code; on success verify the account and sign in. */
export async function verifyCode(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const code = String(formData.get("code") || "").replace(/\D/g, "");
  const back = `/signup/verify?email=${encodeURIComponent(email)}`;

  if (code.length !== 6) {
    redirect(`${back}&error=${encodeURIComponent("Enter the 6-digit code.")}`);
  }

  const jar = await cookies();
  const token = jar.get(CODE_COOKIE)?.value;
  if (!token) {
    redirect(`${back}&error=${encodeURIComponent("Your code expired. Request a new one.")}`);
  }

  const parentId = await verifyCodeToken(token!, code);
  if (!parentId) {
    redirect(`${back}&error=${encodeURIComponent("That code is incorrect or expired.")}`);
  }

  await markEmailVerified(parentId!);
  jar.delete(CODE_COOKIE);
  await createSession({ id: parentId!, email });
  redirect("/onboarding");
}

/** Re-issue a fresh code to the same email. */
export async function resendCode(email: string) {
  const clean = email.trim().toLowerCase();
  if (!clean) redirect("/signup");

  const parent = await findParentByEmail(clean);
  if (parent?._id && !parent.email_verified) {
    const code = generateCode();
    const tmpl = verifyCodeTemplate({ name: parent.full_name, code });
    const res = await sendEmail({ to: clean, subject: tmpl.subject, html: tmpl.html });
    if (res.ok) {
      const token = await createCodeToken(parent._id.toHexString(), code);
      const jar = await cookies();
      jar.set(CODE_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15,
      });
    }
  }
  redirect(`/signup/verify?email=${encodeURIComponent(clean)}&resent=1`);
}

"use server";

import { redirect } from "next/navigation";
import { findParentByEmail } from "@/lib/db/repo";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

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

  await createSession({ id: parent._id.toHexString(), email: parent.email });
  redirect("/dashboard");
}

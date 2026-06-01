"use server";

import { redirect } from "next/navigation";
import { findParentByEmail, createParent } from "@/lib/db/repo";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();

  if (!email || !password) {
    redirect(
      `/signup?error=${encodeURIComponent("Email and password are required.")}`,
    );
  }
  if (password.length < 8) {
    redirect(
      `/signup?error=${encodeURIComponent("Password must be at least 8 characters.")}`,
    );
  }

  const existing = await findParentByEmail(email);
  if (existing) {
    redirect(
      `/signup?error=${encodeURIComponent("An account with this email already exists.")}`,
    );
  }

  const passwordHash = await hashPassword(password);
  const parentId = await createParent({
    email,
    fullName: fullName || null,
    passwordHash,
  });

  await createSession({ id: parentId, email });
  redirect("/onboarding");
}

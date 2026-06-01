"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getCollection, Collections } from "@/lib/mongodb";
import { currentParentId, findParentById } from "@/lib/db/repo";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { ParentDoc } from "@/lib/db/types";

export async function updateAccount(formData: FormData) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");

  const fullName = String(formData.get("full_name") || "").trim();
  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne(
    { _id: new ObjectId(parentId) },
    { $set: { full_name: fullName || null, updated_at: new Date() } },
  );
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function changePassword(formData: FormData) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");

  const current = String(formData.get("current_password") || "");
  const next = String(formData.get("new_password") || "");

  if (next.length < 8) {
    redirect(`/settings?error=${encodeURIComponent("New password must be at least 8 characters.")}`);
  }

  const parent = await findParentById(parentId);
  if (!parent) redirect("/login?redirect=/settings");

  const ok = await verifyPassword(current, parent.password_hash);
  if (!ok) {
    redirect(`/settings?error=${encodeURIComponent("Your current password is incorrect.")}`);
  }

  const hash = await hashPassword(next);
  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne(
    { _id: new ObjectId(parentId) },
    { $set: { password_hash: hash, updated_at: new Date() } },
  );
  redirect("/settings?saved=1");
}

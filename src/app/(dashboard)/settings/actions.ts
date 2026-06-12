"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getCollection, Collections } from "@/lib/mongodb";
import {
  currentParentId,
  findParentById,
  setParentPinHash,
  setWeeklyDigestOptOut,
  setWeeklyPlanEmailOptOut,
} from "@/lib/db/repo";
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

export async function updateEmailPreferences(formData: FormData) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");

  // Checkbox present = email on; absent = opted out.
  const digestOn = formData.get("weekly_digest") === "on";
  const planOn = formData.get("weekly_plan_email") === "on";
  await setWeeklyDigestOptOut(parentId, !digestOn);
  await setWeeklyPlanEmailOptOut(parentId, !planOn);
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

export async function updateParentPin(formData: FormData) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");

  const current = String(formData.get("current_password") || "");
  const pin = String(formData.get("parent_pin") || "").trim();
  const confirm = String(formData.get("confirm_parent_pin") || "").trim();

  if (!/^\d{4}$/.test(pin)) {
    redirect(`/settings?error=${encodeURIComponent("Parent PIN must be exactly 4 digits.")}`);
  }

  if (pin !== confirm) {
    redirect(`/settings?error=${encodeURIComponent("Parent PIN confirmation does not match.")}`);
  }

  const parent = await findParentById(parentId);
  if (!parent) redirect("/login?redirect=/settings");

  const ok = await verifyPassword(current, parent.password_hash);
  if (!ok) {
    redirect(`/settings?error=${encodeURIComponent("Your current password is incorrect.")}`);
  }

  await setParentPinHash(parentId, await hashPassword(pin));
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

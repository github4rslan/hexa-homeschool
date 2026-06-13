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
  setEscalationAlertOptOut,
  setTwoFactorEnabled,
  bumpTokenVersion,
  deleteFamilyData,
} from "@/lib/db/repo";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { emailConfigured } from "@/lib/email/send";
import { createSession, destroySession } from "@/lib/auth/session";
import { getStripe } from "@/lib/billing/stripe";
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
  const alertsOn = formData.get("escalation_alerts") === "on";
  await setWeeklyDigestOptOut(parentId, !digestOn);
  await setWeeklyPlanEmailOptOut(parentId, !planOn);
  await setEscalationAlertOptOut(parentId, !alertsOn);
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

  // A changed password invalidates every existing session, then re-issues
  // this one so the parent stays signed in here.
  const newVersion = await bumpTokenVersion(parentId);
  await createSession({
    id: parentId!,
    email: parent!.email,
    tokenVersion: newVersion ?? 0,
  });
  redirect("/settings?saved=1");
}

/** Sign out everywhere: kill all sessions, keep only this one alive. */
export async function signOutEverywhere() {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");

  const parent = await findParentById(parentId!);
  if (!parent) redirect("/login?redirect=/settings");

  const newVersion = await bumpTokenVersion(parentId!);
  await createSession({
    id: parentId!,
    email: parent!.email,
    tokenVersion: newVersion ?? 0,
  });
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

/**
 * Right to erasure. Type-to-confirm guards against slips; the cascade itself
 * lives in repo.deleteFamilyData (parent-scoped end to end). Cancels the
 * Stripe subscription first when one exists, best-effort.
 */
export async function deleteAccount(formData: FormData) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");

  const confirmation = String(formData.get("confirm_delete") || "").trim();
  if (confirmation !== "DELETE") {
    redirect(
      `/settings?error=${encodeURIComponent('Type DELETE (in capitals) to confirm account deletion.')}`,
    );
  }

  const parent = await findParentById(parentId!);
  if (!parent) redirect("/login?redirect=/settings");

  if (parent!.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(parent!.stripe_subscription_id);
    } catch (err) {
      // Billing unconfigured or already-canceled must not block erasure.
      console.error("[delete account] Stripe cancel failed (continuing):", err);
    }
  }

  const deleted = await deleteFamilyData(parentId!);
  if (!deleted) {
    redirect(`/settings?error=${encodeURIComponent("Deletion failed. Please contact support.")}`);
  }
  console.log("[delete account] erased family", parentId, deleted);

  await destroySession();
  redirect("/?deleted=1");
}

export async function updateTwoFactor(formData: FormData) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");

  const enabled = formData.get("two_factor") === "on";
  // 2FA delivers codes by email; without Brevo it would lock parents out.
  if (enabled && !emailConfigured()) {
    redirect(
      `/settings?error=${encodeURIComponent("Two-factor sign-in needs email delivery, which isn't set up on this deployment yet. Please try again later.")}`,
    );
  }

  await setTwoFactorEnabled(parentId!, enabled);
  revalidatePath("/settings");
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

"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActor } from "@/lib/admin/actor";
import {
  findParentById,
  setAccountSuspended,
  adminSetBilling,
  adminDeleteFamily,
  adminAddChild,
  adminUpdateChild,
  adminDeleteChild,
  recordStaffAction,
} from "@/lib/db/repo";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import { createVerificationToken, appUrl } from "@/lib/email/verification";
import { verifyEmailTemplate } from "@/lib/email/templates";
import type { BillingStatus, SubscriptionTier } from "@/lib/metrics/finance";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

const TIERS: SubscriptionTier[] = ["diagnostic", "standard", "family"];
const STATUSES: BillingStatus[] = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "paused",
];

/** Resend the email-verification link to an unverified parent. Audited. */
export async function resendVerificationAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { ok: false, error: actor.error };
  const parentId = String(formData.get("parentId") || "");
  const parent = await findParentById(parentId);
  if (!parent?._id) return { ok: false, error: "Account not found." };
  if (parent.email_verified) {
    return { ok: false, error: "This account is already verified." };
  }
  if (!emailConfigured()) {
    return { ok: false, error: "Email is not configured on this environment." };
  }
  const token = await createVerificationToken(parent._id.toHexString());
  const verifyUrl = `${appUrl()}/verify?token=${token}`;
  const tmpl = verifyEmailTemplate({ name: parent.full_name, verifyUrl });
  const sent = await sendEmail({ to: parent.email, subject: tmpl.subject, html: tmpl.html });
  if (!sent.ok) return { ok: false, error: "Could not send the email." };

  await recordStaffAction({
    staffId: actor.id,
    staffEmail: actor.email,
    action: "account.resend_verification",
    targetCollection: "parents",
    targetId: parentId,
    reason: "Verification email re-sent",
    ip: actor.ip,
  });
  revalidatePath(`/admin/users/${parentId}`);
  return { ok: true, message: "Verification email sent." };
}

/** Suspend / unsuspend an account (reversible). Guarded + audited. */
export async function toggleSuspendAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { ok: false, error: actor.error };
  const parentId = String(formData.get("parentId") || "");
  const suspend = String(formData.get("suspend") || "") === "true";
  const reason = String(formData.get("reason") || "");

  const res = await setAccountSuspended({
    actorId: actor.id,
    actorEmail: actor.email,
    targetId: parentId,
    suspend,
    reason,
    ip: actor.ip,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(`/admin/users/${parentId}`);
  return { ok: true, message: suspend ? "Account suspended." : "Account restored." };
}

/** Apply a manual plan override (comp/downgrade/cancel). Never touches Stripe. */
export async function setPlanAction(formData: FormData): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { ok: false, error: actor.error };
  const parentId = String(formData.get("parentId") || "");
  const tier = String(formData.get("tier") || "") as SubscriptionTier;
  const status = String(formData.get("status") || "") as BillingStatus;
  const reason = String(formData.get("reason") || "");
  if (!TIERS.includes(tier)) return { ok: false, error: "Invalid tier." };
  if (!STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  const res = await adminSetBilling({
    actorId: actor.id,
    actorEmail: actor.email,
    targetId: parentId,
    tier,
    status,
    reason,
    ip: actor.ip,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(`/admin/users/${parentId}`);
  return { ok: true, message: "Plan updated (manual — not Stripe-synced)." };
}

/** GDPR erasure of a whole family via the existing deleteFamilyData path. */
export async function deleteFamilyAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { ok: false, error: actor.error };
  const parentId = String(formData.get("parentId") || "");
  const confirmEmail = String(formData.get("confirmEmail") || "");
  const reason = String(formData.get("reason") || "");

  const res = await adminDeleteFamily({
    actorId: actor.id,
    actorEmail: actor.email,
    targetId: parentId,
    confirmEmail,
    reason,
    ip: actor.ip,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/admin/users");
  return { ok: true, message: "Family deleted." };
}

/** Add a child to this parent (admin override). Audited. */
export async function addChildAction(formData: FormData): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { ok: false, error: actor.error };
  const parentId = String(formData.get("parentId") || "");
  const res = await adminAddChild({
    actorId: actor.id,
    actorEmail: actor.email,
    parentId,
    fullName: String(formData.get("fullName") || ""),
    dateOfBirth: String(formData.get("dateOfBirth") || ""),
    targetExamWindow: String(formData.get("targetExamWindow") || "") || null,
    sendIndicators: [],
    reason: String(formData.get("reason") || ""),
    ip: actor.ip,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(`/admin/users/${parentId}`);
  return { ok: true, message: "Child added." };
}

/** Edit a child (name / DOB / exam window). Audited. */
export async function editChildAction(formData: FormData): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { ok: false, error: actor.error };
  const parentId = String(formData.get("parentId") || "");
  const childId = String(formData.get("childId") || "");
  const patch: {
    full_name?: string;
    date_of_birth?: string;
    target_exam_window?: string | null;
  } = {};
  const name = String(formData.get("fullName") || "").trim();
  const dob = String(formData.get("dateOfBirth") || "");
  const exam = String(formData.get("targetExamWindow") || "");
  if (name) patch.full_name = name;
  if (dob) patch.date_of_birth = dob;
  patch.target_exam_window = exam || null;

  const res = await adminUpdateChild({
    actorId: actor.id,
    actorEmail: actor.email,
    parentId,
    childId,
    patch,
    reason: String(formData.get("reason") || ""),
    ip: actor.ip,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(`/admin/users/${parentId}`);
  return { ok: true, message: "Child updated." };
}

/** Delete a child = GDPR erasure of that child's record. Typed confirmation. */
export async function deleteChildAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { ok: false, error: actor.error };
  const parentId = String(formData.get("parentId") || "");
  const res = await adminDeleteChild({
    actorId: actor.id,
    actorEmail: actor.email,
    parentId,
    childId: String(formData.get("childId") || ""),
    confirmName: String(formData.get("confirmName") || ""),
    reason: String(formData.get("reason") || ""),
    ip: actor.ip,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(`/admin/users/${parentId}`);
  return { ok: true, message: "Child deleted." };
}

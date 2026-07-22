"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getCollection, Collections } from "@/lib/mongodb";
import {
  currentParentId,
  findParentById,
  setParentPinHash,
  setWeeklyDigestOptOut,
  setWeeklyPlanEmailOptOut,
  setDailySummaryOptOut,
  setEscalationAlertOptOut,
  setEventNotificationsOptOut,
  setMarketingEmailsOptOut,
  setParentPhone,
  setTwoFactorEnabled,
  stageTotpSecret,
  activateTotp,
  disableTotp,
  bumpTokenVersion,
  deleteFamilyData,
} from "@/lib/db/repo";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  generateTotpSecret,
  verifyTotp,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "@/lib/auth/totp";
import { sealSecret, openSecret } from "@/lib/auth/secret-box";
import { emailConfigured } from "@/lib/email/send";
import { validatePhone } from "@/lib/sms/phone";
import { createSession, destroySession } from "@/lib/auth/session";
import { getStripe } from "@/lib/billing/stripe";
import { TOTP_RECOVERY_COOKIE } from "./totp-cookie";
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
  const dailyOn = formData.get("daily_summary") === "on";
  const eventsOn = formData.get("event_notifications") === "on";
  const alertsOn = formData.get("escalation_alerts") === "on";
  const onboardingOn = formData.get("onboarding_emails") === "on";
  await setWeeklyDigestOptOut(parentId, !digestOn);
  await setWeeklyPlanEmailOptOut(parentId, !planOn);
  await setDailySummaryOptOut(parentId, !dailyOn);
  await setEventNotificationsOptOut(parentId, !eventsOn);
  await setEscalationAlertOptOut(parentId, !alertsOn);
  await setMarketingEmailsOptOut(parentId, !onboardingOn);
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

export async function updatePhone(formData: FormData) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");

  const raw = String(formData.get("phone") || "").trim();
  // Empty = clear the number (parent opts out of SMS).
  if (raw === "") {
    await setParentPhone(parentId!, null);
    revalidatePath("/settings");
    redirect("/settings?saved=1");
  }

  const valid = validatePhone(raw);
  if (!valid.ok) {
    redirect(`/settings?error=${encodeURIComponent(valid.error!)}`);
  }
  await setParentPhone(parentId!, valid.value!);
  revalidatePath("/settings");
  redirect("/settings?saved=1");
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

// ── Authenticator-app (TOTP) 2FA (F4) ────────────────────────
// Enrolment is a two-step commit: `startTotpSetup` stages a sealed secret
// (disabled), then `confirmTotpSetup` verifies a live code before switching it
// on and revealing single-use recovery codes exactly once.

/** Stage a fresh sealed secret, then show the setup panel (secret + code entry). */
export async function startTotpSetup() {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");

  await stageTotpSecret(parentId!, sealSecret(generateTotpSecret()));
  revalidatePath("/settings");
  redirect("/settings?totp=setup#security");
}

/** Verify the first code against the staged secret; on success turn TOTP on. */
export async function confirmTotpSetup(formData: FormData) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");

  const code = String(formData.get("code") || "").replace(/\D/g, "");
  const parent = await findParentById(parentId!);
  if (!parent?.totp_secret_enc) {
    redirect(`/settings?error=${encodeURIComponent("Start the authenticator setup again.")}#security`);
  }

  const secret = openSecret(parent!.totp_secret_enc!);
  if (!secret || !verifyTotp(secret, code)) {
    redirect(
      `/settings?totp=setup&error=${encodeURIComponent("That code didn't match — enter the current 6-digit code from your app.")}#security`,
    );
  }

  const codes = generateRecoveryCodes();
  const activated = await activateTotp(parentId!, codes.map(hashRecoveryCode));
  if (!activated) {
    redirect(`/settings?error=${encodeURIComponent("Couldn't enable two-factor. Please try again.")}#security`);
  }

  // Show the plaintext codes exactly once via a short-lived cookie (only hashes
  // are stored). The page renders then clears it.
  const jar = await cookies();
  jar.set(TOTP_RECOVERY_COOKIE, codes.join(","), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5,
  });
  revalidatePath("/settings");
  redirect("/settings?totp=recovery#security");
}

/** Discard an un-activated staged secret (parent cancelled setup). */
export async function cancelTotpSetup() {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");
  await disableTotp(parentId!);
  revalidatePath("/settings");
  redirect("/settings#security");
}

/** Turn TOTP off — password-gated (it's a security downgrade). */
export async function disableTotpAction(formData: FormData) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");

  const password = String(formData.get("current_password") || "");
  const parent = await findParentById(parentId!);
  if (!parent) redirect("/login?redirect=/settings");

  const ok = await verifyPassword(password, parent!.password_hash);
  if (!ok) {
    redirect(`/settings?error=${encodeURIComponent("Your current password is incorrect.")}#security`);
  }

  await disableTotp(parentId!);
  revalidatePath("/settings");
  redirect("/settings?saved=1#security");
}

/** Clear the one-time recovery-code display once the parent has saved them. */
export async function dismissTotpRecovery() {
  const jar = await cookies();
  jar.delete(TOTP_RECOVERY_COOKIE);
  redirect("/settings?saved=1#security");
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

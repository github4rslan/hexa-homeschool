import "server-only";
import { claimLifecycleEmail, releaseLifecycleEmail } from "@/lib/db/repo";
import { sendEmail, emailConfigured } from "@/lib/email/send";

/** Lifecycle email keys — one per distinct onboarding email, sent at most once. */
export type LifecycleKey = "welcome" | "diagnostic_nudge" | "first_plan";

export interface LifecycleSendResult {
  sent: boolean;
  reason?: "not-configured" | "already-sent" | "send-failed";
}

/**
 * Send a one-time lifecycle email idempotently. Claims the key in Mongo FIRST
 * (so two overlapping runs can't both send), then sends; if the send fails the
 * claim is released so a later run can retry. No-ops cleanly when Brevo is
 * unset.
 *
 * Fire-and-forget friendly: callers in transactional paths (verification,
 * schedule approval) should not await-block the user on this — but awaiting is
 * safe and keeps tests deterministic.
 */
export async function sendLifecycleEmail(
  parentId: string,
  key: LifecycleKey,
  build: () => { to: string; subject: string; html: string },
): Promise<LifecycleSendResult> {
  if (!emailConfigured()) return { sent: false, reason: "not-configured" };

  const claimed = await claimLifecycleEmail(parentId, key);
  if (!claimed) return { sent: false, reason: "already-sent" };

  const msg = build();
  const res = await sendEmail(msg);
  if (!res.ok) {
    // Roll the claim back so a future run can retry this email.
    await releaseLifecycleEmail(parentId, key);
    return { sent: false, reason: "send-failed" };
  }
  return { sent: true };
}

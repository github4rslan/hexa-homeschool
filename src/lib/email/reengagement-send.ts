import "server-only";
import {
  claimReengagementStage,
  releaseReengagementStage,
  recordReengagementEvent,
} from "@/lib/db/repo";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import { reengagementTemplate } from "@/lib/email/templates";
import { createUnsubscribeToken } from "@/lib/email/unsubscribe";
import { appUrl } from "@/lib/email/verification";
import { REACTIVATION_WINDOW_DAYS } from "@/lib/engine/reengagement";
import type { ParentDoc } from "@/lib/db/types";
import type { ReengStage, ReengTrack } from "@/lib/engine/reengagement";

export interface ReengSendResult {
  sent: boolean;
  reason?: "not-configured" | "already-sent" | "send-failed";
}

/**
 * Send ONE re-engagement email idempotently, mirroring lib/email/lifecycle.ts:
 * claim the (cycle, stage) key in Mongo FIRST so overlapping cron runs can never
 * double-send, then send; roll the claim back if the send fails so a later run
 * retries. No-ops cleanly when Brevo is unset. A working one-click unsubscribe
 * link + List-Unsubscribe headers are attached (marketing compliance). On a real
 * send, a measurement event is recorded (best-effort). Never throws to the cron.
 */
export async function sendReengagementEmail(params: {
  parent: ParentDoc;
  childFirstName: string;
  stage: ReengStage;
  track: ReengTrack;
  claimKey: string;
  /** The parent's last_active — the idle cycle this send targets (for metrics). */
  idleSince: Date;
}): Promise<ReengSendResult> {
  if (!emailConfigured()) return { sent: false, reason: "not-configured" };
  const parentId = params.parent._id?.toHexString();
  if (!parentId) return { sent: false, reason: "send-failed" };

  // Claim-first: only the winner proceeds to send.
  const claimed = await claimReengagementStage(parentId, params.claimKey);
  if (!claimed) return { sent: false, reason: "already-sent" };

  try {
    const token = await createUnsubscribeToken(parentId);
    const base = appUrl();
    const unsubscribeUrl = `${base}/unsubscribe?token=${encodeURIComponent(token)}`;

    const tmpl = reengagementTemplate({
      name: params.parent.full_name,
      childFirstName: params.childFirstName,
      stage: params.stage,
      track: params.track,
      loginUrl: `${base}/login?redirect=/dashboard`,
      subscribeUrl: `${base}/pricing`,
      settingsUrl: `${base}/settings`,
      unsubscribeUrl,
    });

    const res = await sendEmail({
      to: params.parent.email,
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (!res.ok) {
      await releaseReengagementStage(parentId, params.claimKey);
      return { sent: false, reason: "send-failed" };
    }

    // Best-effort measurement row — never blocks or fails the send.
    await recordReengagementEvent({
      parentId,
      stage: params.stage,
      track: params.track,
      tier: params.parent.subscription_tier,
      billingStatus: params.parent.billing_status,
      idleSince: params.idleSince,
      reactivationWindowMs: REACTIVATION_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    }).catch((err) => {
      console.error("[reengagement] event record failed (non-fatal):", err);
    });

    return { sent: true };
  } catch (err) {
    // Any unexpected failure: roll back the claim so a later run can retry.
    await releaseReengagementStage(parentId, params.claimKey).catch(() => {});
    console.error("[reengagement] send failed for parent", parentId, err);
    return { sent: false, reason: "send-failed" };
  }
}

import "server-only";
import {
  findParentById,
  recordParentEvent,
  masteryAttemptCount,
  removePushSubscription,
} from "@/lib/db/repo";
import type { ChildDoc, Subject } from "@/lib/db/types";
import { buildParentEventCopy } from "@/lib/engine/parent-events";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import { parentEventTemplate } from "@/lib/email/templates";
import { appUrl } from "@/lib/email/verification";
import { sendSms, smsConfigured } from "@/lib/sms/twilio";
import { sendWebPush, webPushConfigured } from "@/lib/notify/web-push";

/**
 * Event-driven parent notifications (Wave 7, Phase 5).
 *
 * Each `emit*` function records a milestone into the activity feed (deduped by
 * key) AND — for mastery / inactivity — pushes a warm, specific email (+ SMS
 * where enabled). Everything here is BEST-EFFORT and non-blocking: it never
 * throws, and every unconfigured/opted-out path is a silent no-op, so the
 * child's lesson flow is never affected. The feed record is written even when a
 * channel is off — the dashboard always reflects the moment.
 *
 * The struggle/handoff event is fed to `recordHandoffEvent` for the feed ONLY:
 * its email/SMS push is already sent by `lib/email/remediation-handoff.ts`
 * (which follows `escalation_alert_opt_out`), so we never double-notify.
 */

const UTC_DAY = () => new Date().toISOString().slice(0, 10);

/** Notify the parent that a child certified a topic (once per topic, ever). */
export async function emitMasteryEvent(params: {
  parentId: string;
  child: ChildDoc;
  topicTag: string;
  topicTitle: string;
  subject: Subject | null;
}): Promise<void> {
  try {
    if (!params.child._id) return;
    const attempts = await masteryAttemptCount(
      params.child._id,
      params.topicTag,
    );
    const { created } = await recordParentEvent(params.parentId, params.child, {
      type: "mastery",
      topicTitle: params.topicTitle,
      subject: params.subject,
      attempts,
      dedupeKey: `mastery:${params.child._id.toHexString()}:${params.topicTag}`,
    });
    if (!created) return; // already celebrated — feed + push both fire once

    await pushEventNotification({
      parentId: params.parentId,
      childName: params.child.full_name,
      kind: "mastery",
      topicTitle: params.topicTitle,
      attempts,
      ctaPath: `/dashboard/children/${params.child._id.toHexString()}`,
    });
  } catch (err) {
    console.error("[parent-event mastery] failed (non-fatal):", err);
  }
}

/** Gentle, parent-facing "hasn't logged in today" reminder (once per day). */
export async function emitInactivityEvent(params: {
  parentId: string;
  child: ChildDoc;
}): Promise<void> {
  try {
    if (!params.child._id) return;
    const { created } = await recordParentEvent(params.parentId, params.child, {
      type: "inactivity",
      dedupeKey: `inactivity:${params.child._id.toHexString()}:${UTC_DAY()}`,
    });
    if (!created) return;

    await pushEventNotification({
      parentId: params.parentId,
      childName: params.child.full_name,
      kind: "inactivity",
      topicTitle: null,
      attempts: null,
      ctaPath: "/dashboard",
    });
  } catch (err) {
    console.error("[parent-event inactivity] failed (non-fatal):", err);
  }
}

/**
 * Record a handoff/struggle event for the activity feed only. The parent
 * email/SMS is dispatched separately by the remediation-handoff notifier, so
 * this never sends a second message. Deduped per child+topic per active pause.
 */
export async function recordHandoffEvent(params: {
  parentId: string;
  child: ChildDoc;
  topicTag: string;
  topicTitle: string;
  subject: Subject | null;
  /** Distinguishes one active struggle from a later one on the same topic. */
  pausedAtKey: string;
}): Promise<void> {
  try {
    if (!params.child._id) return;
    await recordParentEvent(params.parentId, params.child, {
      type: "handoff",
      topicTitle: params.topicTitle,
      subject: params.subject,
      dedupeKey: `handoff:${params.child._id.toHexString()}:${params.topicTag}:${params.pausedAtKey}`,
    });
  } catch (err) {
    console.error("[parent-event handoff] failed (non-fatal):", err);
  }
}

/** Shared push path for mastery + inactivity: email (+ SMS), opt-out aware. */
async function pushEventNotification(params: {
  parentId: string;
  childName: string;
  kind: "mastery" | "inactivity";
  topicTitle: string | null;
  attempts: number | null;
  ctaPath: string;
}): Promise<void> {
  const parent = await findParentById(params.parentId);
  if (!parent) return;
  if (parent.event_notifications_opt_out) return;
  if (parent.email_verified === false) return;
  if (parent.is_smoke_account) return;

  const copy = buildParentEventCopy({
    type: params.kind,
    childFirstName: params.childName.split(" ")[0],
    topicTitle: params.topicTitle,
    attempts: params.attempts,
  });

  if (emailConfigured()) {
    const tmpl = parentEventTemplate({
      parentName: parent.full_name,
      kind: params.kind,
      subject: copy.emailSubject,
      headline: copy.emailHeadline,
      body: copy.emailBody,
      ctaLabel: copy.emailCta,
      ctaUrl: `${appUrl()}${params.ctaPath}`,
      settingsUrl: `${appUrl()}/settings`,
    });
    await sendEmail({
      to: parent.email,
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
    });
  }

  if (smsConfigured() && parent.phone) {
    await sendSms(parent.phone, copy.smsBody);
  }

  // Web Push (F4): the most immediate, free channel for a parent who installed
  // the PWA + opted in. Same opt-out gate as email/SMS above. Best-effort per
  // device; an expired (404/410) subscription is pruned so the store self-heals.
  const subs = parent.push_subscriptions ?? [];
  if (webPushConfigured() && subs.length > 0) {
    await Promise.all(
      subs.map(async (sub) => {
        const result = await sendWebPush(sub, {
          title: copy.emailSubject,
          body: copy.feedDetail,
          url: params.ctaPath,
        });
        if (result.expired) {
          await removePushSubscription(params.parentId, sub.endpoint).catch(() => {});
        }
      }),
    );
  }
}

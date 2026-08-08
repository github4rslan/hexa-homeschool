"use server";

import { revalidatePath } from "next/cache";
import {
  currentParentId,
  getActiveChild,
  insertLessonLog,
  upsertCompetence,
  familyLessonCount,
  saveLessonProgress,
  clearLessonProgress,
  setChildPreferences,
  todayCard,
  getTopic,
  createRemediationTutorHandoff,
  pauseTopicForTutor,
  currentBandForSubject,
  childFloorBand,
  KEY_STAGE_LABEL,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { captureServer } from "@/lib/analytics/server";
import { sendDailySummaryEmail } from "@/lib/email/daily-summary";
import { notifyRemediationHandoff } from "@/lib/email/remediation-handoff";
import {
  emitMasteryEvent,
  emitBandPromotionEvent,
  recordHandoffEvent,
} from "@/lib/notify/parent-event";
import type { Subject } from "@/lib/db/types";

/**
 * Warm, child-SAFE subject labels. The key-stage band is parent-only (never
 * shown to a child), but the subject name itself is fine in child copy.
 */
const CHILD_SUBJECT_LABEL: Record<Subject, string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};

export interface LessonLogInput {
  topicTag: string;
  score: number;
  total: number;
  timeSpentSeconds: number;
  hintsUsed: number;
}

export interface LessonLogResult {
  persisted: boolean;
  competenceState?: "locked" | "training" | "certified";
  reason?: string;
  /**
   * Set only when this certification advanced the child's whole key-stage band
   * for the subject (F2). Child-SAFE: carries the warm subject label only, never
   * the key-stage band (banding is parent-only). Drives the child-mode
   * "new adventures unlocked" celebration on the certified screen.
   */
  bandPromotion?: { subjectLabel: string } | null;
}

/**
 * Persist a completed lesson to the lesson-logs collection and update the
 * child's competence (mastery) for the topic. No-ops gracefully when there's
 * no session or no child. Ownership enforced in the repo layer.
 */
export async function logLessonCompletion(
  input: LessonLogInput,
): Promise<LessonLogResult> {
  const { topicTag, score, total, timeSpentSeconds, hintsUsed } = input;
  if (total <= 0) return { persisted: false, reason: "Invalid mastery total." };

  const parentId = await currentParentId();
  if (!parentId) return { persisted: false, reason: "Not signed in." };

  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return { persisted: false, reason: "No child profile yet." };

  const endedAt = new Date();
  const startedAt = new Date(
    endedAt.getTime() - Math.max(0, timeSpentSeconds) * 1000,
  );
  const masteryPct = (score / total) * 100;

  const logged = await insertLessonLog(parentId, child._id, {
    topic_tag: topicTag,
    status: "completed",
    timestamp_start: startedAt,
    timestamp_end: endedAt,
    count_attempts: total,
    hints_counter: hintsUsed,
    mastery_score: Number(masteryPct.toFixed(2)),
  });
  if (!logged) return { persisted: false, reason: "Log write rejected." };

  // Activation milestone: the family's FIRST completed lesson. Server-side,
  // attributed to the parent account only — no child id, no lesson detail
  // (Children's Code: children are never tracked or profiled).
  if ((await familyLessonCount(parentId)) === 1) {
    captureServer(parentId, "first_lesson_run");
  }

  const state: "locked" | "training" | "certified" =
    masteryPct >= 100 ? "certified" : masteryPct >= 50 ? "training" : "locked";

  // F2: capture the child's band for this subject BEFORE the certifying write,
  // so we can detect a whole-band promotion (KS2 -> KS3 -> KS4) that this exact
  // certification triggers. Deterministic (reads certified rows), no AI.
  const floor = childFloorBand(child.date_of_birth);
  let promoSubject: Subject | null = null;
  let bandBefore: number | null = null;
  if (state === "certified") {
    const topic = await getTopic(topicTag);
    if (topic?.subject) {
      promoSubject = topic.subject;
      bandBefore = await currentBandForSubject(child._id, topic.subject, floor);
    }
  }

  await upsertCompetence(parentId, child._id, topicTag, state);

  // Event-driven parent notification: a topic reaching certification is a warm,
  // specific moment worth surfacing (feed + email/SMS, deduped once per topic,
  // opt-out aware). Best-effort — never blocks or slows the child's flow.
  if (state === "certified") {
    try {
      const topic = await getTopic(topicTag);
      await emitMasteryEvent({
        parentId,
        child,
        topicTag,
        topicTitle: topic?.title ?? topicTag,
        subject: topic?.subject ?? null,
      });
    } catch (err) {
      console.error("[mastery event] trigger failed (non-fatal):", err);
    }
  }

  // F2: band-promotion milestone — the single biggest, previously-silent
  // progression event. If this certification advanced the child's whole band
  // for the subject, record a deduped parent event (feed + email/SMS/push) and
  // flag the child screen for a warm, band-label-free celebration.
  let bandPromotion: { subjectLabel: string } | null = null;
  if (state === "certified" && promoSubject && bandBefore != null) {
    try {
      const bandAfter = await currentBandForSubject(
        child._id,
        promoSubject,
        floor,
      );
      if (bandAfter > bandBefore) {
        await emitBandPromotionEvent({
          parentId,
          child,
          subject: promoSubject,
          newBand: bandAfter,
          subjectLabel: CHILD_SUBJECT_LABEL[promoSubject],
          bandLabel: KEY_STAGE_LABEL[bandAfter],
        });
        bandPromotion = { subjectLabel: CHILD_SUBJECT_LABEL[promoSubject] };
      }
    } catch (err) {
      console.error("[band promotion] trigger failed (non-fatal):", err);
    }
  }

  // The lesson is finished — drop any mid-lesson resume row so it never resumes.
  await clearLessonProgress(parentId, child._id, topicTag);

  // When this completion clears ALL of today's planned quests, send the parent
  // a warm daily summary — once per child per day (idempotent + opt-out aware).
  // Best-effort: never throws and is a no-op without Brevo, so the child's
  // lesson flow is never blocked or slowed.
  try {
    const card = await todayCard(parentId, child);
    if (card.allDone) {
      await sendDailySummaryEmail(parentId, child);
    }
  } catch (err) {
    console.error("[daily-summary] trigger failed (non-fatal):", err);
  }

  // A completed lesson changes data shown on the child hub + progress map
  // (quest done-state, certified nodes) and the parent dashboard (activity,
  // week stats, getting-started checklist). Refresh them so none goes stale.
  revalidatePath("/learn");
  revalidatePath("/learn/map");
  revalidatePath("/dashboard");

  return { persisted: true, competenceState: state, bandPromotion };
}

/**
 * Autosave the child's mid-lesson position (interactive daily flow). Fire-and-
 * forget from the client on each step; no-ops gracefully without a session/child.
 * Pedagogical state only — never analytics.
 */
export async function saveLessonProgressAction(input: {
  topicTag: string;
  step: number;
  score: number;
  total: number;
}): Promise<{ saved: boolean }> {
  if (input.total <= 0 || input.step < 0) return { saved: false };
  const parentId = await currentParentId();
  if (!parentId) return { saved: false };
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return { saved: false };
  const saved = await saveLessonProgress(parentId, child._id, input.topicTag, {
    step: input.step,
    score: input.score,
    total: input.total,
  });
  return { saved };
}

/**
 * Persist the child's "read questions to me" preference (the in-lesson mute
 * toggle). Fire-and-forget from the client; no-ops without a session/child.
 */
export async function setNarrationAutoplayAction(
  enabled: boolean,
): Promise<{ ok: boolean }> {
  const parentId = await currentParentId();
  if (!parentId) return { ok: false };
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return { ok: false };
  const ok = await setChildPreferences(parentId, child._id, {
    narrationAutoplay: enabled,
  });
  return { ok };
}

/** Clear saved mid-lesson progress (e.g. when a child restarts a topic). */
export async function clearLessonProgressAction(
  topicTag: string,
): Promise<{ cleared: boolean }> {
  const parentId = await currentParentId();
  if (!parentId) return { cleared: false };
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return { cleared: false };
  await clearLessonProgress(parentId, child._id, topicTag);
  return { cleared: true };
}

export async function triggerRemediationHandoffAction(input: {
  topicTag: string;
  attempts: number;
  missedPrompts: string[];
}): Promise<{ ok: boolean; created?: boolean; reason?: string }> {
  const parentId = await currentParentId();
  if (!parentId) return { ok: false, reason: "Not signed in." };
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return { ok: false, reason: "No child profile yet." };

  const topic = await getTopic(input.topicTag);
  const topicTitle = topic?.title ?? input.topicTag;
  const missed = input.missedPrompts.slice(0, 3).join("; ");
  const res = await createRemediationTutorHandoff(parentId, child._id, {
    subject: topic?.subject ?? null,
    topicTag: input.topicTag,
    topicTitle,
    note: `${child.full_name.split(" ")[0]} found ${topicTitle} tricky after ${input.attempts} mastery attempts.${missed ? ` Missed concepts: ${missed}` : ""}`,
  });
  if (!res.ok) return res;

  // Pause the topic in the syllabus (set aside without shame). Done on every
  // trigger so a re-entry stays resting; never demotes competence state.
  await pauseTopicForTutor(parentId, child._id, input.topicTag);

  // Notify the parent only on a freshly-created request — one per struggle.
  if (res.created) {
    await notifyRemediationHandoff({
      parentId,
      childName: child.full_name,
      topicTitle,
    });
    // Mirror the struggle onto the parent activity feed (feed only — the
    // email/SMS above already pushed it). Deduped per active pause via a day key.
    await recordHandoffEvent({
      parentId,
      child,
      topicTag: input.topicTag,
      topicTitle,
      subject: topic?.subject ?? null,
      pausedAtKey: new Date().toISOString().slice(0, 10),
    });
  }

  await clearLessonProgress(parentId, child._id, input.topicTag);
  revalidatePath("/tutoring");
  revalidatePath("/learn");
  return res;
}

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
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { captureServer } from "@/lib/analytics/server";
import { sendDailySummaryEmail } from "@/lib/email/daily-summary";
import { notifyRemediationHandoff } from "@/lib/email/remediation-handoff";

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

  await upsertCompetence(parentId, child._id, topicTag, state);

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

  return { persisted: true, competenceState: state };
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

  if (res.created) {
    await notifyRemediationHandoff({
      parentId,
      childName: child.full_name,
      topicTitle,
    });
  }

  await clearLessonProgress(parentId, child._id, input.topicTag);
  revalidatePath("/tutoring");
  revalidatePath("/learn");
  return res;
}

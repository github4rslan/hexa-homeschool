"use server";

import {
  currentParentId,
  latestChild,
  insertLessonLog,
  upsertCompetence,
} from "@/lib/db/repo";

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

  const child = await latestChild(parentId);
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

  const state: "locked" | "training" | "certified" =
    masteryPct >= 100 ? "certified" : masteryPct >= 50 ? "training" : "locked";

  await upsertCompetence(parentId, child._id, topicTag, state);

  return { persisted: true, competenceState: state };
}

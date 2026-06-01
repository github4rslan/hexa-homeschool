"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureParentId } from "@/lib/supabase/parent";

export interface LessonLogInput {
  /** Curriculum topic tag this lesson maps to (e.g. "algebra_linear"). */
  topicTag: string;
  /** Questions answered correctly in the mastery check. */
  score: number;
  /** Total questions in the mastery check. */
  total: number;
  /** Seconds the learner spent on the lesson. */
  timeSpentSeconds: number;
  /** Hints used during the lesson. */
  hintsUsed: number;
}

export interface LessonLogResult {
  persisted: boolean;
  /** Mastery state derived + written, when persisted. */
  competenceState?: "locked" | "training" | "certified";
  reason?: string;
}

/**
 * Persist a completed lesson to instructional_logs and update the child's
 * competence_matrix (mastery) for the matched topic.
 *
 * Resolves a real academic_lessons row for the topic (creating a minimal one
 * if the curriculum hasn't been authored yet) so the NOT NULL lesson_id FK is
 * satisfied. Gracefully no-ops — never throws — when there is no session, no
 * child, or the curriculum topic isn't seeded.
 *
 * RLS ensures a parent only ever writes rows for their own child.
 */
export async function logLessonCompletion(
  input: LessonLogInput,
): Promise<LessonLogResult> {
  const { topicTag, score, total, timeSpentSeconds, hintsUsed } = input;
  if (total <= 0) return { persisted: false, reason: "Invalid mastery total." };

  // instructional_logs records duration via timestamp_start → timestamp_end
  // rather than a seconds column, so derive a real start time from the elapsed
  // span the client measured.
  const endedAt = new Date();
  const startedAt = new Date(
    endedAt.getTime() - Math.max(0, timeSpentSeconds) * 1000,
  );

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { persisted: false, reason: "Not signed in." };

  // Resolve parent → most-recent child.
  const parentId = await ensureParentId(supabase, user);
  if (!parentId) return { persisted: false, reason: "No parent profile." };

  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!child) return { persisted: false, reason: "No child profile yet." };
  const childId = (child as { id: string }).id;

  // Resolve the curriculum topic by tag.
  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("topic_tag", topicTag)
    .limit(1)
    .maybeSingle();
  if (!topic) {
    return { persisted: false, reason: `Topic '${topicTag}' not seeded.` };
  }
  const topicId = (topic as { id: string }).id;

  // Find (or lazily create) a lesson for this topic to satisfy the FK.
  const lessonId = await resolveLessonId(supabase, topicId);
  if (!lessonId) {
    return { persisted: false, reason: "Could not resolve a lesson." };
  }

  const masteryPct = (score / total) * 100;

  // 1. Log the attempt.
  const { error: logError } = await supabase
    .from("instructional_logs")
    .insert({
      child_id: childId,
      lesson_id: lessonId,
      status: "completed",
      timestamp_start: startedAt.toISOString(),
      timestamp_end: endedAt.toISOString(),
      count_attempts: total,
      hints_counter: hintsUsed,
      mastery_score: Number(masteryPct.toFixed(2)),
    } as never);
  if (logError) return { persisted: false, reason: logError.message };

  // 2. Update mastery. Brief: 100% → mastered/certified; else keep training.
  //    Map to competence_state: certified (100%), training (≥50%), locked (<50%).
  const state: "locked" | "training" | "certified" =
    masteryPct >= 100 ? "certified" : masteryPct >= 50 ? "training" : "locked";

  // Upsert on the (child_id, topic_id) unique constraint.
  const { error: compError } = await supabase
    .from("competence_matrix")
    .upsert(
      {
        child_id: childId,
        topic_id: topicId,
        state,
        certified_at: state === "certified" ? new Date().toISOString() : null,
      } as never,
      { onConflict: "child_id,topic_id" },
    );
  if (compError) return { persisted: false, reason: compError.message };

  return { persisted: true, competenceState: state };
}

/**
 * Return an academic_lessons id for the topic, creating a placeholder lesson
 * if none exists yet (Phase-1 curriculum is not fully authored).
 */
async function resolveLessonId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  topicId: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("academic_lessons")
    .select("id")
    .eq("topic_id", topicId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;

  // Lazily create a minimal lesson row (service-role/authenticated insert).
  const { data: created, error } = await supabase
    .from("academic_lessons")
    .insert({
      topic_id: topicId,
      sort_order: 1,
      target_duration: 45,
      instructional_payload_json: { source: "phase1_lesson_player" },
    } as never)
    .select("id")
    .maybeSingle();
  if (error || !created) return null;
  return (created as { id: string }).id;
}

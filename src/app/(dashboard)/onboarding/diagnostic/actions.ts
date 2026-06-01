"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureParentId } from "@/lib/supabase/parent";
import type { Database } from "@/lib/supabase/types";

type EvaluationInsert =
  Database["public"]["Tables"]["evaluation_records"]["Insert"];

export interface DiagnosticSubjectOutcome {
  subject: "mathematics" | "english" | "science";
  /** 0–100 readiness estimate. */
  readiness: number;
  /** Predicted working grade band, e.g. "Grade 4–5". */
  workingGrade: string;
}

export interface PersistResult {
  persisted: boolean;
  reason?: string;
}

/**
 * Persist diagnostic outcomes to evaluation_records for the parent's first
 * child. Gracefully no-ops (rather than throwing) when there's no session or
 * no child yet — the diagnostic is reachable before full onboarding completes.
 *
 * RLS guarantees a parent can only ever write rows for their own child.
 */
export async function saveDiagnosticResults(
  outcomes: DiagnosticSubjectOutcome[],
): Promise<PersistResult> {
  if (!outcomes.length) return { persisted: false, reason: "No outcomes." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { persisted: false, reason: "Not signed in." };

  const parentId = await ensureParentId(supabase, user);
  if (!parentId) return { persisted: false, reason: "No parent profile." };

  // Most-recently-added child for this parent.
  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!child) return { persisted: false, reason: "No child profile yet." };

  const childId = (child as { id: string }).id;

  // Map the band ("Grade 4–5") to a single predicted grade for the record.
  const rows: EvaluationInsert[] = outcomes.map((o) => ({
    child_id: childId,
    raw_score: o.readiness,
    model_predicted_grade: gradeFromBand(o.workingGrade),
    confidence_interval: Math.min(0.99, Math.max(0.5, o.readiness / 100)),
  }));

  const { error } = await supabase
    .from("evaluation_records")
    .insert(rows as never);

  if (error) return { persisted: false, reason: error.message };
  return { persisted: true };
}

/** "Grade 4–5" → "5" (upper bound of the band, as a single GCSE grade). */
function gradeFromBand(band: string): string {
  const matches = band.match(/\d+/g);
  if (!matches?.length) return "4";
  return matches[matches.length - 1];
}

"use server";

import { currentParentId, latestChild, insertEvaluations } from "@/lib/db/repo";

export interface DiagnosticSubjectOutcome {
  subject: "mathematics" | "english" | "science";
  readiness: number; // 0–100
  workingGrade: string; // e.g. "Grade 4–5"
}

export interface PersistResult {
  persisted: boolean;
  reason?: string;
}

/**
 * Persist diagnostic outcomes to the evaluations collection for the parent's
 * most-recent child. No-ops gracefully if not signed in or no child yet.
 * Ownership is enforced in the repo layer.
 */
export async function saveDiagnosticResults(
  outcomes: DiagnosticSubjectOutcome[],
): Promise<PersistResult> {
  if (!outcomes.length) return { persisted: false, reason: "No outcomes." };

  const parentId = await currentParentId();
  if (!parentId) return { persisted: false, reason: "Not signed in." };

  const child = await latestChild(parentId);
  if (!child?._id) return { persisted: false, reason: "No child profile yet." };

  const ok = await insertEvaluations(
    parentId,
    child._id,
    outcomes.map((o) => ({
      raw_score: o.readiness,
      model_predicted_grade: gradeFromBand(o.workingGrade),
      confidence_interval: Math.min(0.99, Math.max(0.5, o.readiness / 100)),
      mock_exam: false,
    })),
  );

  return ok
    ? { persisted: true }
    : { persisted: false, reason: "Write was rejected." };
}

function gradeFromBand(band: string): string {
  const matches = band.match(/\d+/g);
  if (!matches?.length) return "4";
  return matches[matches.length - 1];
}

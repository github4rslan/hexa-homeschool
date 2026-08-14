"use server";

import { currentParentId, getActiveChild, recordMockResult } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { scoreMock, type MockAnswerKey } from "@/lib/engine/mock-exam";
import { gradeForMarks, type PaperTier } from "@/lib/engine/mock-paper";
import type { Subject } from "@/lib/db/types";

export interface MockSubmitResult {
  ok: boolean;
  scorePct: number;
  correct: number;
  total: number;
  indicativeGrade: string;
}

/**
 * Deterministically score a completed mock from its per-question
 * (tier, correct, marks) key and persist it as an EvaluationDoc (mock_exam:
 * true). The grade comes from the human-authored canonical answers only — no AI
 * scoring. The mark-weighted score is mapped to an approximate GCSE boundary
 * grade (F7) that is stored for the PARENT view only; the child result stays the
 * calm, unlabelled indicative-grade reveal (never a pass/fail). No-ops
 * gracefully without a session/child. Ownership enforced in the repo.
 */
export async function submitMock(
  subject: Subject,
  answers: MockAnswerKey[],
  paperTier?: PaperTier,
): Promise<MockSubmitResult> {
  const result = scoreMock(answers);
  // Approximate, parent-only boundary grade from the mark-weighted score.
  const boundary = gradeForMarks(subject, paperTier ?? "Foundation", result.marksPct);

  const parentId = await currentParentId();
  if (parentId) {
    const child = await getActiveChild(parentId, await readActiveChildId());
    if (child?._id) {
      await recordMockResult(parentId, child._id, {
        subject,
        scorePct: result.scorePct,
        estimatedTier: result.estimatedTier,
        indicativeGrade: result.indicativeGrade,
        marksPct: result.marksPct,
        boundaryGrade: boundary.grade,
      });
    }
  }

  return {
    ok: true,
    scorePct: result.scorePct,
    correct: result.correct,
    total: result.total,
    indicativeGrade: result.indicativeGrade,
  };
}

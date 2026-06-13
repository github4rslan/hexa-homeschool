"use server";

import { currentParentId, getActiveChild, recordMockResult } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { scoreMock, type MockAnswerKey } from "@/lib/engine/mock-exam";
import type { Subject } from "@/lib/db/types";

export interface MockSubmitResult {
  ok: boolean;
  scorePct: number;
  correct: number;
  total: number;
  indicativeGrade: string;
}

/**
 * Deterministically score a completed mock from its per-question (tier, correct)
 * key and persist it as an EvaluationDoc (mock_exam: true). The grade comes from
 * the canonical answers only — no AI scoring. No-ops gracefully without a
 * session/child. Ownership enforced in the repo.
 */
export async function submitMock(
  subject: Subject,
  answers: MockAnswerKey[],
): Promise<MockSubmitResult> {
  const result = scoreMock(answers);

  const parentId = await currentParentId();
  if (parentId) {
    const child = await getActiveChild(parentId, await readActiveChildId());
    if (child?._id) {
      await recordMockResult(parentId, child._id, {
        subject,
        scorePct: result.scorePct,
        estimatedTier: result.estimatedTier,
        indicativeGrade: result.indicativeGrade,
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

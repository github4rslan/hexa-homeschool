"use server";

import { currentParentId, getActiveChild, recordReviewResult } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";

export interface ReviewResult {
  ok: boolean;
}

/**
 * Record a single warm-up review outcome for a topic. Advances or resets the
 * spaced-repetition schedule only — never changes the certification state.
 * No-ops gracefully without a session or child. Ownership enforced in the repo.
 */
export async function submitReviewResult(
  topicTag: string,
  correct: boolean,
): Promise<ReviewResult> {
  const parentId = await currentParentId();
  if (!parentId) return { ok: false };
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return { ok: false };
  const ok = await recordReviewResult(parentId, child._id, topicTag, correct);
  return { ok };
}

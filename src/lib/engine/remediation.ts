export const MASTERY_CHECK_SIZE = 3;
export const MAX_REMEDIATION_ATTEMPTS = 5;

export type RemediationDecision = "certified" | "remediate" | "handoff";

export interface MasteryLikeQuestion {
  id: string;
}

export function masteryScore(score: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((score / total) * 100);
}

export function decideRemediation(input: {
  score: number;
  total: number;
  attempt: number;
}): RemediationDecision {
  if (input.total > 0 && input.score === input.total) return "certified";
  return input.attempt >= MAX_REMEDIATION_ATTEMPTS ? "handoff" : "remediate";
}

/** True when the loop has reached the five-attempt human handoff. */
export function isHandoff(decision: RemediationDecision): boolean {
  return decision === "handoff";
}

/**
 * Tutor-request statuses that count as an already-active handoff for a topic.
 * A request that's still `requested` or `scheduled` means a human is already
 * lined up — re-triggering must not queue a duplicate.
 */
export const ACTIVE_HANDOFF_STATUSES = ["requested", "scheduled"] as const;

/**
 * Idempotency guard for the five-attempt handoff: queue a new tutor request
 * ONLY when the child has no active (`requested`/`scheduled`) remediation
 * request for this topic. One handoff per child+topic per active struggle —
 * never spam the parent or the tutor queue. Pure, so it's unit-tested.
 */
export function shouldQueueHandoff(existingStatuses: string[]): boolean {
  const active = new Set<string>(ACTIVE_HANDOFF_STATUSES);
  return !existingStatuses.some((s) => active.has(s));
}

export function selectMasteryAttempt<T extends MasteryLikeQuestion>(
  bank: T[],
  attempt: number,
  usedIds: string[] = [],
  size = MASTERY_CHECK_SIZE,
): T[] {
  if (bank.length <= size) {
    if (bank.length === 0) return [];
    const offset = Math.max(0, attempt - 1) % bank.length;
    return [...bank.slice(offset), ...bank.slice(0, offset)].slice(0, size);
  }

  const used = new Set(usedIds);
  const fresh = bank.filter((q) => !used.has(q.id));
  const pool =
    fresh.length >= size
      ? fresh
      : [...fresh, ...bank.filter((q) => used.has(q.id))];
  const offset = fresh.length >= size ? Math.max(0, attempt - 1) % pool.length : 0;
  return [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, size);
}

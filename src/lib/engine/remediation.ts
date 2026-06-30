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

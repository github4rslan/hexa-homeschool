/**
 * Mock-exam unlock gate — pure, count-aware.
 *
 * The mock for a subject unlocks after the child has certified enough topics.
 * This used to be a magic `10` copied across four call sites, which coupled the
 * gate to the exact GCSE topic count: adding a topic (F8 mensuration) risked
 * silently pushing the unlock out of reach if a naive "certify all topics" rule
 * were ever introduced.
 *
 * The gate is a reachable FLOOR that never exceeds the number of authored GCSE
 * topics for the subject, so adding a new topic can only ever keep the unlock
 * reachable (min of the two).
 *
 * B1 (2026-09-12): the certified count compared against this floor MUST be
 * `certifiedGcseBySubject` (GCSE-only, `key_stage: 4`), the same convention the
 * compliance portfolio already uses. It must never be the all-band
 * `certifiedBySubject`, which folds in pre-GCSE KS2/KS3 prerequisite
 * certifications, letting a child unlock a real GCSE mock exam while only
 * genuinely covering half the subject's GCSE spec.
 */

import type { Subject } from "@/lib/db/types";
import { SEED_TOPICS } from "@/lib/data/curriculum.seed";

/** The most topics a child must certify to unlock a subject's mock. */
export const MOCK_UNLOCK_FLOOR = 10;

/** Number of authored GCSE (key_stage 4) topics for a subject. */
export function gcseTopicCount(subject: Subject): number {
  return SEED_TOPICS.filter(
    (t) => t.subject === subject && t.key_stage === 4,
  ).length;
}

const ALL_SUBJECTS: Subject[] = ["mathematics", "english", "science"];

/**
 * Total authored GCSE (key_stage 4) topics across every subject: the live,
 * curriculum-size-aware replacement for a hardcoded total (B2). Used wherever
 * the dashboard/portfolio need "how many GCSE topics exist in total" so this
 * number can never go stale as the curriculum grows.
 */
export function totalGcseTopicCount(): number {
  return ALL_SUBJECTS.reduce((sum, subject) => sum + gcseTopicCount(subject), 0);
}

/**
 * Certified-topic count that unlocks the subject's mock: a floor of
 * `MOCK_UNLOCK_FLOOR`, never more than the number of GCSE topics that exist, so
 * the unlock is always reachable regardless of how many topics are added.
 */
export function mockUnlockCount(subject: Subject): number {
  return Math.min(gcseTopicCount(subject), MOCK_UNLOCK_FLOOR);
}

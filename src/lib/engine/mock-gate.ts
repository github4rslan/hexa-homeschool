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
 * reachable (min of the two). `certifiedBySubject` counts certified topics
 * across every band, so the floor stays comfortably reachable.
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

/**
 * Certified-topic count that unlocks the subject's mock: a floor of
 * `MOCK_UNLOCK_FLOOR`, never more than the number of GCSE topics that exist, so
 * the unlock is always reachable regardless of how many topics are added.
 */
export function mockUnlockCount(subject: Subject): number {
  return Math.min(gcseTopicCount(subject), MOCK_UNLOCK_FLOOR);
}

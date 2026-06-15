/**
 * Diagnostic placement (Brief: Agent 1 — "starts processing exactly at
 * age-expected GCSE benchmarks").
 *
 * Pure, deterministic policy that maps a child's age to the UK key stage their
 * diagnostic should START in, plus a modest in-band entry tier. The adaptive
 * IRT engine (`lib/data/diagnostic.ts`) climbs or steps down from there.
 *
 * HARD INVARIANT: this selects which band of HUMAN-AUTHORED items a child sees.
 * It never generates questions. This module is the SINGLE place the age→band
 * policy lives — no key-stage magic numbers elsewhere.
 */

import { ageFromDob } from "@/lib/engine/exam-decision";

export { ageFromDob };

/** UK key stage HEXA covers: 2 (KS2, ages 7–10), 3 (KS3, 11–13), 4 (GCSE, 14–16). */
export type KeyStage = 2 | 3 | 4;

export interface Placement {
  keyStage: KeyStage;
  /** Modest in-band entry tier (1–5). NOT the middle — an age-expected benchmark. */
  startTier: number;
}

/**
 * The age-expected entry tier within a band. Deliberately modest (2 of 1–5),
 * not the middle: the brief wants an age-expected benchmark that the IRT loop
 * climbs from, not an assumption that every child is mid-band.
 */
export const START_TIER = 2;

/**
 * Map a child's age to their starting key-stage band and entry tier.
 *
 * - age ≤ 10 → KS2; 11–13 → KS3; 14+ → KS4.
 * - Out-of-range ages are clamped, never thrown: < 7 falls to KS2, > 16 to KS4.
 */
export function placeChild(age: number): Placement {
  let keyStage: KeyStage;
  if (age <= 10) keyStage = 2; // includes the < 7 clamp
  else if (age <= 13) keyStage = 3;
  else keyStage = 4; // 14+ , includes the > 16 clamp

  return { keyStage, startTier: START_TIER };
}

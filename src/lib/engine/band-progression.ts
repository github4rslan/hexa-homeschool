/**
 * Cross-band progression rule (Wave 3, Phase 2 — single source of truth).
 *
 * A child works WITHIN their current key-stage band for a subject. Once every
 * topic in that band is certified (or the band has no authored topics), the
 * plan advances them to the next band — KS2 → KS3 → KS4 — and never past KS4.
 * Their age-expected band (placeChild) is the FLOOR: progression only ever
 * moves a child up, never below their age band.
 *
 * Pure + deterministic so it can be unit-tested and reused identically by the
 * weekly plan, the daily lesson fetch, the monthly next-focus, and the parent's
 * stage label. The DB-backed wrapper lives in repo.ts (`currentBandForSubject`).
 */

import type { KeyStage } from "@/lib/engine/diagnostic-placement";

/**
 * Walk up from the child's floor band while each band is "exhausted" (the
 * predicate returns true), stopping at the first band with work left or at KS4.
 *
 * @param floor the child's age-expected band — the lowest band they can be in
 * @param isBandExhausted band → true when that band has no uncertified topics
 *   left for the subject (all certified, or none authored)
 */
export function currentBandFrom(
  floor: KeyStage,
  isBandExhausted: (band: KeyStage) => boolean,
): KeyStage {
  let band: KeyStage = floor;
  while (band < 4 && isBandExhausted(band)) {
    band = (band + 1) as KeyStage;
  }
  return band;
}

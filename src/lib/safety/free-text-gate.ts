/**
 * Pure decision logic for the client-side free-text distress gate (fill_blank
 * answers in the practice player). Kept free of React/fetch so it is unit
 * testable and the fail-safe policy is enforced in one place.
 *
 * Child-safety rule 2: missing real distress is not acceptable. If we cannot
 * CONFIRM a free-text answer is clear (non-OK HTTP, malformed body, network
 * error), the outcome is "unavailable" and the caller MUST NOT advance — it
 * fails safe by blocking, never open by proceeding.
 */

export type GuardOutcome = "frozen" | "clear" | "unavailable";

/**
 * Map a /api/safety-check response to a gate outcome.
 * - frozen === true                    → "frozen" (freeze the session)
 * - HTTP ok and frozen absent/false    → "clear"  (safe to score/advance)
 * - anything else (non-ok, malformed)  → "unavailable" (block, do not advance)
 */
export function interpretSafetyResponse(ok: boolean, body: unknown): GuardOutcome {
  if (!ok) return "unavailable";
  if (typeof body !== "object" || body === null) return "unavailable";
  const frozen = (body as { frozen?: unknown }).frozen;
  if (frozen === true) return "frozen";
  if (frozen === false || frozen === undefined) return "clear";
  return "unavailable";
}

/** True when the outcome must block scoring/advancing (everything but "clear"). */
export function guardBlocksAdvance(outcome: GuardOutcome): boolean {
  return outcome !== "clear";
}

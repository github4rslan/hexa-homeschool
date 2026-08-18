/**
 * F7 (2026-08-18) — pure decision for the phase-bar "settle pulse". A segment
 * should pulse exactly once when the child's progress crosses INTO it (never
 * on a wrong answer, never on a re-render at the same phase, never backward).
 * Kept pure + unit-tested so the one-shot rule is provable without mounting
 * the component; `daily-flow.tsx` calls this from a `useEffect` keyed on
 * `phaseIndex` and stores the result in local state.
 */
export function pulseTargetOnCrossing(
  prevPhaseIndex: number,
  nextPhaseIndex: number,
): number | null {
  return nextPhaseIndex > prevPhaseIndex ? nextPhaseIndex : null;
}

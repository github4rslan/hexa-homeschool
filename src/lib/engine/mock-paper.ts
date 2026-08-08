/**
 * Mock-exam paper shaping — pure, deterministic (no AI, no network).
 *
 * Two exam-day fidelity upgrades:
 *  - Per-subject framing (calculator vs non-calculator + a calm condition line)
 *    mirroring real board conditions (Edexcel 1MA1 Paper 1 is non-calculator;
 *    AQA science is a calculator paper; AQA English needs no calculator).
 *  - A tier window derived from readiness so a paper clusters around the child's
 *    recommended tier (Foundation 1 to 3, Higher 3 to 5) instead of the full
 *    spread, while always filling the paper via a nearest-tier fallback.
 */

import type { Subject } from "@/lib/db/types";

export interface MockPaperFraming {
  /** Whether a calculator would be permitted in the real paper. Guidance only. */
  calculatorAllowed: boolean;
  /** Short badge label, e.g. "Non-calculator". */
  paperLabel: string;
  /** One calm line shown before the paper starts (never an alarm). */
  conditionLine: string;
}

/** Deterministic exam-day framing per subject. */
export function mockPaperFraming(subject: Subject): MockPaperFraming {
  switch (subject) {
    case "mathematics":
      return {
        calculatorAllowed: false,
        paperLabel: "Non-calculator",
        conditionLine:
          "Non-calculator paper: work these out on paper, no calculator, just like Paper 1.",
      };
    case "science":
      return {
        calculatorAllowed: true,
        paperLabel: "Calculator allowed",
        conditionLine:
          "Calculator paper: you may use a calculator, like a real science exam.",
      };
    case "english":
    default:
      return {
        calculatorAllowed: false,
        paperLabel: "Reading and writing",
        conditionLine: "A reading and writing paper: no calculator needed.",
      };
  }
}

export interface TierWindow {
  min: number;
  max: number;
  label: "Foundation" | "Higher";
}

/**
 * Map a subject readiness (0 to 100, or null when unassessed) to the tier window
 * a tier-targeted paper should cluster around. Higher tier once readiness is
 * strong (>= 85, matching the exam-decision "Push for Higher" recommendation);
 * Foundation otherwise (the safe default for an unassessed or building child).
 */
export function mockTierWindow(readiness: number | null): TierWindow {
  if (readiness !== null && readiness >= 85) {
    return { min: 3, max: 5, label: "Higher" };
  }
  return { min: 1, max: 3, label: "Foundation" };
}

function tierDistance(tier: number, min: number, max: number): number {
  if (tier < min) return min - tier;
  if (tier > max) return tier - max;
  return 0;
}

/**
 * Choose `count` questions from a pool, spread across difficulty. When a
 * `targetTier` window is given, prefer questions inside it (spread across the
 * window's tiers); if the window is thin, top up with the nearest-tier questions
 * so the paper always fills. Deterministic: same inputs, same paper.
 */
export function selectMockPaper<T extends { tier: number }>(
  pool: T[],
  count: number,
  targetTier?: { min: number; max: number },
): T[] {
  const sorted = [...pool].sort((a, b) => a.tier - b.tier);

  const spread = (list: T[], n: number): T[] => {
    if (list.length <= n) return list;
    const out: T[] = [];
    const step = list.length / n;
    for (let i = 0; i < n; i++) out.push(list[Math.floor(i * step)]);
    return out;
  };

  if (!targetTier) return spread(sorted, count);

  const { min, max } = targetTier;
  const inWindow = sorted.filter((q) => q.tier >= min && q.tier <= max);
  if (inWindow.length >= count) return spread(inWindow, count);

  // Not enough inside the window: keep every in-window item, then top up with the
  // nearest tiers (stable so the fill is deterministic).
  const rest = sorted
    .filter((q) => q.tier < min || q.tier > max)
    .sort((a, b) => tierDistance(a.tier, min, max) - tierDistance(b.tier, min, max));
  return [...inWindow, ...rest].slice(0, count);
}

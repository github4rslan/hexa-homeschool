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

/**
 * Deterministic mark weight for a question of a given difficulty tier. Real
 * papers weight harder, multi-step items more heavily than single-mark recall,
 * so a tier-5 "solve / show that" item is worth more than a tier-1 recall item.
 * Kept small and whole so a 10-question paper lands around 20 marks. Guidance
 * only: nothing here changes which questions are human-authored or their answers.
 */
export function marksForTier(tier: number): number {
  const t = Math.max(1, Math.min(5, Math.round(tier)));
  // tier 1,2 → 1 mark · tier 3 → 2 · tier 4 → 3 · tier 5 → 4.
  if (t <= 2) return 1;
  if (t === 3) return 2;
  if (t === 4) return 3;
  return 4;
}

export type PaperTier = "Foundation" | "Higher";

export interface BoundaryGrade {
  /** The indicative numeric grade, e.g. "5", or "U" below grade 1. */
  grade: string;
  /** Always true: these boundaries are approximate and shift every year. */
  approximate: true;
}

interface Boundary {
  /** Minimum mark percentage (inclusive) to reach `grade`. */
  minPct: number;
  grade: string;
}

/**
 * Approximate, clearly-indicative GCSE grade boundaries as a percentage of the
 * total marks. These are NOT the exact published boundaries (which shift every
 * series); they are a defensible, honest approximation for the parent's
 * readiness read, always surfaced with an "approximate" label and never shown to
 * the child as a pass/fail. Sources approximated: Edexcel 1MA1 (maths), AQA 8700
 * (English Language, single tier), AQA 8464 (combined science).
 *
 * Each list is ordered high → low; the first threshold the mark percentage meets
 * wins. English is single-tier, so both windows share one table.
 */
const BOUNDARIES: Record<Subject, Record<PaperTier, Boundary[]>> = {
  mathematics: {
    // Edexcel 1MA1 Foundation caps at grade 5.
    Foundation: [
      { minPct: 70, grade: "5" },
      { minPct: 55, grade: "4" },
      { minPct: 40, grade: "3" },
      { minPct: 25, grade: "2" },
      { minPct: 12, grade: "1" },
    ],
    // Edexcel 1MA1 Higher spans grades 4 to 9.
    Higher: [
      { minPct: 80, grade: "9" },
      { minPct: 70, grade: "8" },
      { minPct: 58, grade: "7" },
      { minPct: 46, grade: "6" },
      { minPct: 34, grade: "5" },
      { minPct: 22, grade: "4" },
    ],
  },
  english: {
    // AQA 8700 is single tier (grades 1 to 9); both windows use the same table.
    Foundation: [
      { minPct: 82, grade: "9" },
      { minPct: 72, grade: "8" },
      { minPct: 62, grade: "7" },
      { minPct: 52, grade: "6" },
      { minPct: 42, grade: "5" },
      { minPct: 32, grade: "4" },
      { minPct: 24, grade: "3" },
      { minPct: 16, grade: "2" },
      { minPct: 8, grade: "1" },
    ],
    Higher: [
      { minPct: 82, grade: "9" },
      { minPct: 72, grade: "8" },
      { minPct: 62, grade: "7" },
      { minPct: 52, grade: "6" },
      { minPct: 42, grade: "5" },
      { minPct: 32, grade: "4" },
      { minPct: 24, grade: "3" },
      { minPct: 16, grade: "2" },
      { minPct: 8, grade: "1" },
    ],
  },
  science: {
    // AQA 8464 Foundation caps at grade 5.
    Foundation: [
      { minPct: 68, grade: "5" },
      { minPct: 54, grade: "4" },
      { minPct: 40, grade: "3" },
      { minPct: 26, grade: "2" },
      { minPct: 14, grade: "1" },
    ],
    // AQA 8464 Higher spans grades 4 to 9.
    Higher: [
      { minPct: 78, grade: "9" },
      { minPct: 68, grade: "8" },
      { minPct: 57, grade: "7" },
      { minPct: 45, grade: "6" },
      { minPct: 33, grade: "5" },
      { minPct: 20, grade: "4" },
    ],
  },
};

/**
 * Map a mark percentage to an approximate GCSE grade for a subject + paper tier.
 * Deterministic and pure. Parent-facing only: the return is always flagged
 * approximate, and callers must never render it to a child as a pass/fail.
 */
export function gradeForMarks(
  subject: Subject,
  tier: PaperTier,
  marksPct: number,
): BoundaryGrade {
  const table = BOUNDARIES[subject][tier];
  const pct = Math.max(0, Math.min(100, marksPct));
  for (const b of table) {
    if (pct >= b.minPct) return { grade: b.grade, approximate: true };
  }
  // Below the lowest published boundary: honestly "U" (below grade 1).
  return { grade: "U", approximate: true };
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

import { tierToGrade } from "@/lib/data/diagnostic";

/**
 * Mock-exam scoring — pure, deterministic. Grading uses the human-authored
 * canonical answers only; AI is never involved in producing a score or grade
 * (it is used elsewhere, post-exam, solely to explain wrong answers).
 *
 * Score → indicative grade uses the SAME tier→grade family as the diagnostic
 * (`tierToGrade`), so a mock and a diagnostic speak the same language to
 * parents. Each question carries a difficulty tier (1–5); a child's estimated
 * tier is the average tier of the questions they got right, nudged by their
 * overall accuracy so that getting easy questions right doesn't over-state a
 * grade and a strong pass on hard questions is rewarded.
 */

export interface MockAnswerKey {
  /** Question difficulty tier, 1 (easiest) … 5 (hardest). */
  tier: number;
  correct: boolean;
  /**
   * Mark weight of this item (default 1). Real papers weight a multi-step or
   * "show that" item more heavily than a single-mark recall item, so an honest
   * grade should reward the harder marks. Absent ⇒ 1 (backward compatible).
   */
  marks?: number;
}

export interface MockResult {
  total: number;
  correct: number;
  /** 0–100 accuracy (questions right ÷ questions). */
  scorePct: number;
  /** Total marks available across the paper (sum of every item's marks). */
  marksTotal: number;
  /** Marks earned (sum of marks on correctly answered items). */
  marksEarned: number;
  /** 0–100 mark-weighted score (marksEarned ÷ marksTotal). Drives the grade. */
  marksPct: number;
  /** Estimated working tier (1–5). */
  estimatedTier: number;
  /** Indicative GCSE working-grade band, e.g. "Grade 5". */
  indicativeGrade: string;
}

/** A single mark weight, clamped to a sensible whole number (1–6). */
function itemMarks(a: MockAnswerKey): number {
  const m = typeof a.marks === "number" && Number.isFinite(a.marks) ? a.marks : 1;
  return Math.max(1, Math.min(6, Math.round(m)));
}

export function scoreMock(answers: MockAnswerKey[]): MockResult {
  const total = answers.length;
  if (total === 0) {
    return {
      total: 0,
      correct: 0,
      scorePct: 0,
      marksTotal: 0,
      marksEarned: 0,
      marksPct: 0,
      estimatedTier: 1,
      indicativeGrade: tierToGrade(1),
    };
  }

  const correctAnswers = answers.filter((a) => a.correct);
  const correct = correctAnswers.length;
  const scorePct = Math.round((correct / total) * 100);

  // Mark-weighted totals: harder items carry more marks, so the mark score can
  // differ from raw accuracy (getting the heavy multi-step items right counts
  // for more). This is what the honest boundary grade is derived from.
  const marksTotal = answers.reduce((s, a) => s + itemMarks(a), 0);
  const marksEarned = correctAnswers.reduce((s, a) => s + itemMarks(a), 0);
  const marksPct =
    marksTotal > 0 ? Math.round((marksEarned / marksTotal) * 100) : 0;

  // Average tier of the questions answered correctly (the demonstrated ceiling).
  const avgCorrectTier =
    correctAnswers.length > 0
      ? correctAnswers.reduce((s, a) => s + a.tier, 0) / correctAnswers.length
      : 1;

  // Average tier of the whole paper (its overall difficulty).
  const avgPaperTier = answers.reduce((s, a) => s + a.tier, 0) / total;

  // Blend: demonstrated ceiling scaled by overall accuracy, with the paper's
  // difficulty as a floor influence so a near-perfect hard paper grades high.
  const accuracy = correct / total;
  const blended = avgCorrectTier * accuracy + avgPaperTier * (1 - accuracy) * 0.5;
  const estimatedTier = Math.max(1, Math.min(5, Math.round(blended * 10) / 10));

  return {
    total,
    correct,
    scorePct,
    marksTotal,
    marksEarned,
    marksPct,
    estimatedTier,
    indicativeGrade: tierToGrade(estimatedTier),
  };
}

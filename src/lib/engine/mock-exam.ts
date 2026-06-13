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
}

export interface MockResult {
  total: number;
  correct: number;
  /** 0–100 accuracy. */
  scorePct: number;
  /** Estimated working tier (1–5). */
  estimatedTier: number;
  /** Indicative GCSE working-grade band, e.g. "Grade 5". */
  indicativeGrade: string;
}

export function scoreMock(answers: MockAnswerKey[]): MockResult {
  const total = answers.length;
  if (total === 0) {
    return {
      total: 0,
      correct: 0,
      scorePct: 0,
      estimatedTier: 1,
      indicativeGrade: tierToGrade(1),
    };
  }

  const correctAnswers = answers.filter((a) => a.correct);
  const correct = correctAnswers.length;
  const scorePct = Math.round((correct / total) * 100);

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
    estimatedTier,
    indicativeGrade: tierToGrade(estimatedTier),
  };
}

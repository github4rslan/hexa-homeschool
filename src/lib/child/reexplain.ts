/**
 * "Explain it another way" (F4) — pure helpers that turn the human-authored
 * explainer content (a worked example, or a summary + points) into a request
 * for the checker-gated `/api/tutor` pipeline, plus the human-authored fallback
 * to show when AI is unavailable or the Checker rejects the re-teach.
 *
 * No AI, no network, no new curriculum: this only reshapes existing
 * human-authored prose. The Checker still gates any AI text; on any failure the
 * caller renders `fallback` — a re-presentation of the SAME canonical content.
 */

import type { WorkedExample } from "./worked-examples";

export interface ReexplainContext {
  /** What to re-teach, framed as the "question" for the Teaching Agent. */
  prompt: string;
  /** Canonical human-authored ground truth the agent must stay within. */
  correctAnswer: string;
  /** Human-authored fallback shown when AI is unavailable / Checker rejects. */
  fallback: string;
}

/** Build a re-explain context from a worked example. */
export function reexplainFromWorkedExample(ex: WorkedExample): ReexplainContext {
  const steps = ex.steps.map((s) => s.line.trim()).filter(Boolean);
  const last = steps.length ? steps[steps.length - 1] : ex.title;
  const scenario = ex.scenario?.trim();
  const prompt = scenario ? `${ex.title} — ${scenario}` : ex.title;
  const fallback = steps.length
    ? `Here's the same idea, step by step: ${steps.join(" ")}`
    : ex.title;
  return { prompt, correctAnswer: last, fallback };
}

/** Build a re-explain context from a summary-and-points explainer. */
export function reexplainFromSummary(
  title: string,
  summary: string,
  points: string[],
): ReexplainContext {
  const cleanSummary = summary.trim();
  const cleanPoints = points.map((p) => p.trim()).filter(Boolean);
  const prompt = cleanSummary ? `${title} — ${cleanSummary}` : title;
  const fallback = cleanPoints.length
    ? `Here's another way to see it: ${[cleanSummary, ...cleanPoints]
        .filter(Boolean)
        .join(" ")}`
    : cleanSummary || title;
  return {
    prompt,
    correctAnswer: cleanSummary || title,
    fallback,
  };
}

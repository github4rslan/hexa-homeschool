/**
 * Exam "command word" coaching chip (F2 — exam-readiness).
 *
 * A child who doesn't yet distinguish "Explain" (give a reason/mechanism) from
 * "Describe" (state what happens, no reason needed) loses marks on the real
 * paper regardless of subject knowledge. This is a small, human-authored
 * dictionary of what each command word is asking the child to DO, matched
 * deterministically against the START of a question's prompt text — no AI, no
 * new schema field, degrades to nothing (no badge) when no command word
 * matches. Pure + deterministic, mirrors the existing glossary matcher
 * (`lib/child/glossary.ts`).
 */

export interface CommandWordMatch {
  /** Canonical display form, e.g. "Calculate". */
  word: string;
  definition: string;
}

/** Human-authored: what each exam command word asks the child to actually DO. */
export const COMMAND_WORDS: Record<string, string> = {
  Calculate: "work out a numerical answer, usually showing your method",
  Explain: "give a reason or mechanism, not just what happens",
  Describe: "say what happens, in order, without needing to say why",
  Evaluate: "weigh up strengths and weaknesses to reach a judgement",
  Compare: "say what is the same and what is different between two things",
  Estimate: "give an approximate answer using rounding",
  "Show that": "prove a given result using working, not just state it",
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Longest phrase first so "Show that" is checked before a lone "Show" would be
// (there is no bare "Show" entry today, but this keeps future entries safe).
const ENTRIES = Object.entries(COMMAND_WORDS).sort(
  (a, b) => b[0].length - a[0].length,
);

/**
 * Detect the command word a question prompt OPENS with (case-insensitive,
 * whole-word), or `null` when the prompt doesn't start with one — never a
 * mid-sentence match, so an unrelated later use of the same word never wrongly
 * tags a question.
 */
export function detectCommandWord(prompt: string): CommandWordMatch | null {
  const trimmed = prompt.trim();
  for (const [word, definition] of ENTRIES) {
    const re = new RegExp(`^${escapeRegExp(word)}\\b`, "i");
    if (re.test(trimmed)) return { word, definition };
  }
  return null;
}

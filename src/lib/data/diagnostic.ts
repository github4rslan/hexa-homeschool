/**
 * Diagnostic Agent item bank + adaptive engine (rule-based, Phase-1).
 *
 * Per HEXA Technical Brief v2.0 (Agent 1): the Diagnostic Agent is a
 * RULE-BASED Item Response Theory (IRT) engine — NOT generative AI. It starts
 * at age-expected GCSE benchmarks and adapts difficulty based on responses:
 * consistent correct answers step difficulty up; errors step it down.
 *
 * Items here are human-authored and tagged by subject + difficulty tier (1–5,
 * loosely mapping to working grades). This is illustrative content for a
 * functional diagnostic — production would draw from the vetted item bank.
 */

export type DiagnosticSubject = "mathematics" | "english" | "science";

export interface DiagnosticItem {
  id: string;
  subject: DiagnosticSubject;
  /** 1 (easiest) … 5 (hardest), maps loosely to working grade. */
  tier: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  topic: string;
}

export const DIAGNOSTIC_SUBJECTS: { id: DiagnosticSubject; label: string }[] = [
  { id: "mathematics", label: "Mathematics" },
  { id: "english", label: "English" },
  { id: "science", label: "Science" },
];

export const DIAGNOSTIC_ITEMS: DiagnosticItem[] = [
  // ── Mathematics ──────────────────────────────────────────────
  { id: "m1", subject: "mathematics", tier: 1, topic: "Arithmetic", prompt: "What is 7 × 8?", options: ["54", "56", "63", "48"], correctIndex: 1 },
  { id: "m2", subject: "mathematics", tier: 2, topic: "Fractions", prompt: "What is 3/4 + 1/8?", options: ["7/8", "4/12", "1/2", "5/8"], correctIndex: 0 },
  { id: "m3", subject: "mathematics", tier: 3, topic: "Linear equations", prompt: "Solve 3x + 7 = 22.", options: ["x = 3", "x = 5", "x = 7", "x = 15"], correctIndex: 1 },
  { id: "m4", subject: "mathematics", tier: 4, topic: "Quadratics", prompt: "Solve x² − 5x + 6 = 0.", options: ["x = 2 or 3", "x = 1 or 6", "x = −2 or −3", "x = 0 or 5"], correctIndex: 0 },
  { id: "m5", subject: "mathematics", tier: 5, topic: "Trigonometry", prompt: "In a right triangle, if the opposite is 3 and hypotenuse is 5, what is sin θ?", options: ["0.6", "0.8", "0.75", "1.67"], correctIndex: 0 },

  // ── English ──────────────────────────────────────────────────
  { id: "e1", subject: "english", tier: 1, topic: "Spelling", prompt: "Which word is spelled correctly?", options: ["definately", "definitely", "definatly", "definitley"], correctIndex: 1 },
  { id: "e2", subject: "english", tier: 2, topic: "Grammar", prompt: "Choose the correct sentence.", options: ["She don't like it.", "She doesn't likes it.", "She doesn't like it.", "She not like it."], correctIndex: 2 },
  { id: "e3", subject: "english", tier: 3, topic: "Punctuation", prompt: "Which uses the apostrophe correctly?", options: ["The dog's bone", "The dogs' bone (one dog)", "The dogs bone", "The dog's are barking"], correctIndex: 0 },
  { id: "e4", subject: "english", tier: 4, topic: "Literary devices", prompt: "“The wind whispered through the trees” is an example of:", options: ["Simile", "Personification", "Hyperbole", "Onomatopoeia"], correctIndex: 1 },
  { id: "e5", subject: "english", tier: 5, topic: "Analysis", prompt: "A writer uses short, fragmented sentences in a tense scene mainly to:", options: ["Slow the pace", "Build tension and urgency", "Add humour", "Describe setting"], correctIndex: 1 },

  // ── Science ──────────────────────────────────────────────────
  { id: "s1", subject: "science", tier: 1, topic: "Biology basics", prompt: "Which organ pumps blood around the body?", options: ["Lungs", "Liver", "Heart", "Kidney"], correctIndex: 2 },
  { id: "s2", subject: "science", tier: 2, topic: "States of matter", prompt: "What is the process of a liquid turning into a gas called?", options: ["Condensation", "Evaporation", "Freezing", "Sublimation"], correctIndex: 1 },
  { id: "s3", subject: "science", tier: 3, topic: "Chemistry", prompt: "What is the chemical symbol for sodium?", options: ["So", "Sd", "Na", "S"], correctIndex: 2 },
  { id: "s4", subject: "science", tier: 4, topic: "Physics", prompt: "What is the unit of electrical resistance?", options: ["Volt", "Ampere", "Ohm", "Watt"], correctIndex: 2 },
  { id: "s5", subject: "science", tier: 5, topic: "Cell biology", prompt: "During which process do cells produce ATP using oxygen?", options: ["Photosynthesis", "Aerobic respiration", "Fermentation", "Osmosis"], correctIndex: 1 },
];

/** Tier (1–5) → approximate GCSE working-grade band shown to parents. */
export function tierToGrade(tier: number): string {
  const map: Record<number, string> = {
    1: "Grade 1–2",
    2: "Grade 3",
    3: "Grade 4–5",
    4: "Grade 6–7",
    5: "Grade 8–9",
  };
  return map[Math.max(1, Math.min(5, Math.round(tier)))] ?? "Grade 4–5";
}

export interface SubjectResult {
  subject: DiagnosticSubject;
  label: string;
  /** Estimated working tier (1–5), the IRT-style ability estimate. */
  estimatedTier: number;
  workingGrade: string;
  correct: number;
  answered: number;
  /** 0–100: readiness estimate. */
  readiness: number;
}

/**
 * Adaptive item picker. Returns the next unseen item at (or nearest to) the
 * target tier for a subject.
 */
export function pickNextItem(
  subject: DiagnosticSubject,
  targetTier: number,
  seenIds: Set<string>,
): DiagnosticItem | null {
  const pool = DIAGNOSTIC_ITEMS.filter(
    (it) => it.subject === subject && !seenIds.has(it.id),
  );
  if (pool.length === 0) return null;

  pool.sort(
    (a, b) =>
      Math.abs(a.tier - targetTier) - Math.abs(b.tier - targetTier) ||
      a.tier - b.tier,
  );
  return pool[0];
}

/**
 * Update the ability estimate after a response.
 * Correct → nudge up; incorrect → nudge down. Clamped to [1, 5].
 */
export function updateTier(currentTier: number, wasCorrect: boolean): number {
  const delta = wasCorrect ? 0.8 : -0.8;
  return Math.max(1, Math.min(5, currentTier + delta));
}

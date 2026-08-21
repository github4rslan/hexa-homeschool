/**
 * Interactive problem schema (Feature 1) + pure answer-checking logic.
 *
 * A small, typed discriminated union so the content team authors interactive
 * steps as DATA — no per-problem dev work. A question carries an optional
 * `interaction` (see QuestionDoc); when absent it renders as `mcq` using the
 * question's own options/correct_index, so legacy rows are untouched.
 *
 * HARD INVARIANTS (mirrors .claude/rules/child-safety.md):
 *  - ALL content here is human-authored. The Teaching Agent only ever EXPLAINS;
 *    it never authors questions, answers, hints, or grading truth.
 *  - Answer checking is pure + deterministic (no AI, no network) so feedback is
 *    instant (<200ms) and identical on every device.
 *
 * This module is framework-free and import-safe from both client components and
 * Vitest (no "server-only", no React) — keep it that way.
 */

export type InteractionType = "mcq" | "tap_reveal" | "fill_blank" | "drag_drop";

/** Default. Renders the question's options/correct_index as choice cards. */
export interface McqInteraction {
  type: "mcq";
}

/**
 * Tap face-down cards to uncover a hidden face, then choose the one that answers
 * the prompt. `correctCard` indexes into `cards`. Tactile and curious.
 */
export interface TapRevealInteraction {
  type: "tap_reveal";
  /** Short instruction shown above the cards. */
  instruction: string;
  cards: { label: string; reveal: string }[];
  correctCard: number;
}

/**
 * Fill the blanks inline in a sentence. `parts` is the plain text split around
 * the blanks, so there is exactly one blank between each consecutive pair —
 * `blanks.length === parts.length - 1`. Accepted answers are matched
 * case-insensitively, whitespace-normalised.
 */
export interface FillBlankInteraction {
  type: "fill_blank";
  parts: string[];
  blanks: { answers: string[]; numeric?: boolean; placeholder?: string }[];
}

/**
 * Drag — or tap-to-place / keyboard-select — chips into target slots. Each
 * slot's `correctChip` indexes into `chips`. Tap-to-place + keyboard are
 * mandatory; drag is a mouse-only enhancement, never the only way in.
 */
export interface DragDropInteraction {
  type: "drag_drop";
  chips: string[];
  slots: { label: string; correctChip: number }[];
}

export type Interaction =
  | McqInteraction
  | TapRevealInteraction
  | FillBlankInteraction
  | DragDropInteraction;

// ── Normalisation (legacy-safe) ──────────────────────────────

/** Case/whitespace-insensitive comparison key for free-text answers. */
function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Validate a raw interaction value (e.g. from MongoDB) against the schema and
 * the question's option count. Returns a safe `mcq` for anything malformed or
 * absent, so a bad authoring row can never crash a child's lesson.
 */
export function normalizeInteraction(raw: unknown): Interaction {
  if (!raw || typeof raw !== "object") return { type: "mcq" };
  const it = raw as Partial<Interaction> & { type?: string };

  switch (it.type) {
    case "tap_reveal": {
      const t = raw as Partial<TapRevealInteraction>;
      if (
        Array.isArray(t.cards) &&
        t.cards.length >= 2 &&
        t.cards.every(
          (c) =>
            c && typeof c.label === "string" && typeof c.reveal === "string",
        ) &&
        typeof t.correctCard === "number" &&
        t.correctCard >= 0 &&
        t.correctCard < t.cards.length
      ) {
        return {
          type: "tap_reveal",
          instruction:
            typeof t.instruction === "string" && t.instruction.trim()
              ? t.instruction
              : "Tap the cards, then choose the right one.",
          cards: t.cards.map((c) => ({ label: c.label, reveal: c.reveal })),
          correctCard: t.correctCard,
        };
      }
      return { type: "mcq" };
    }
    case "fill_blank": {
      const t = raw as Partial<FillBlankInteraction>;
      if (
        Array.isArray(t.parts) &&
        Array.isArray(t.blanks) &&
        t.parts.length === t.blanks.length + 1 &&
        t.blanks.length >= 1 &&
        t.parts.every((p) => typeof p === "string") &&
        t.blanks.every(
          (b) =>
            b &&
            Array.isArray(b.answers) &&
            b.answers.length >= 1 &&
            b.answers.every((a) => typeof a === "string"),
        )
      ) {
        return {
          type: "fill_blank",
          parts: t.parts,
          blanks: t.blanks.map((b) => ({
            answers: b.answers,
            numeric: b.numeric === true,
            placeholder:
              typeof b.placeholder === "string" ? b.placeholder : undefined,
          })),
        };
      }
      return { type: "mcq" };
    }
    case "drag_drop": {
      const t = raw as Partial<DragDropInteraction>;
      if (
        Array.isArray(t.chips) &&
        Array.isArray(t.slots) &&
        t.chips.length >= 2 &&
        t.slots.length >= 1 &&
        t.chips.every((c) => typeof c === "string") &&
        t.slots.every(
          (s) =>
            s &&
            typeof s.label === "string" &&
            typeof s.correctChip === "number" &&
            s.correctChip >= 0 &&
            s.correctChip < (t.chips as string[]).length,
        )
      ) {
        return {
          type: "drag_drop",
          chips: t.chips,
          slots: t.slots.map((s) => ({
            label: s.label,
            correctChip: s.correctChip,
          })),
        };
      }
      return { type: "mcq" };
    }
    case "mcq":
    default:
      // mcq needs the question's own options; anything else is a bad row → mcq.
      return { type: "mcq" };
  }
}

// ── Pure answer checking (instant, deterministic) ────────────

export function checkMcq(selected: number | null, correctIndex: number): boolean {
  return selected !== null && selected === correctIndex;
}

export function checkTapReveal(
  it: TapRevealInteraction,
  chosen: number | null,
): boolean {
  return chosen !== null && chosen === it.correctCard;
}

export interface TapRevealTapResult {
  /** The flipped-card set after this tap (reveal never un-reveals). */
  flipped: Set<number>;
  /** The chosen answer after this tap, or null if nothing is chosen yet. */
  selected: number | null;
}

/**
 * B4 fix: "reveal a card to read it" and "choose it as your final answer" are
 * two different actions, not one. A tap on a card that ISN'T flipped yet only
 * reveals it — reading a second or third card can never silently overwrite an
 * earlier choice. A tap on a card that's ALREADY flipped (the same one again,
 * or a different already-read one) commits it as the chosen answer. Pure +
 * deterministic so it's unit-testable without mounting the component.
 */
export function tapRevealTap(
  flipped: ReadonlySet<number>,
  selected: number | null,
  i: number,
): TapRevealTapResult {
  if (!flipped.has(i)) {
    const next = new Set(flipped);
    next.add(i);
    return { flipped: next, selected };
  }
  return { flipped: new Set(flipped), selected: i };
}

export function checkFillBlank(
  it: FillBlankInteraction,
  values: string[],
): boolean {
  if (values.length !== it.blanks.length) return false;
  return it.blanks.every((blank, i) => {
    const v = norm(values[i] ?? "");
    if (!v) return false;
    return blank.answers.some((a) => norm(a) === v);
  });
}

export function checkDragDrop(
  it: DragDropInteraction,
  placement: (number | null)[],
): boolean {
  if (placement.length !== it.slots.length) return false;
  return it.slots.every((slot, i) => placement[i] === slot.correctChip);
}

// ── Spoken answers beyond mcq (Wave 8, Phase 3 Feature 6) ────

/** Small spoken-number vocabulary for numeric blanks ("three" → "3"). */
const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

/**
 * Turn a speech transcript into a fill-blank value — forgiving, never a hard
 * fail. Numeric blanks pull the first number ("it's minus 3!" → "-3",
 * "three" → "3"); text blanks pass the cleaned words through (the checker is
 * already case/whitespace-insensitive). Null = couldn't hear an answer →
 * the caller shows a calm retry nudge. Pure + testable.
 */
export function spokenBlankValue(
  transcript: string,
  numeric?: boolean,
): string | null {
  const text = transcript.replace(/\s+/g, " ").trim();
  if (!text) return null;

  if (!numeric) {
    const cleaned = text.replace(/[.?!]+$/, "").trim();
    return cleaned || null;
  }

  // Spoken negatives come through as words: "minus 3" / "negative three".
  const negativeDigits = text.match(/(?:minus|negative)\s+(\d+(?:\.\d+)?)/i);
  if (negativeDigits) return `-${negativeDigits[1]}`;
  const digits = text.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (digits) return digits[0];

  const lower = text.toLowerCase();
  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) {
      const negative = new RegExp(
        `\\b(?:minus|negative)\\s+${word}\\b`,
      ).test(lower);
      return String(negative ? -value : value);
    }
  }
  return null;
}

// ── Graduated help spine (Wave 8 — one ladder, least help first) ──

export interface HintLadderInput {
  /** Optional human-authored hints, shortest/gentlest first. */
  hints?: string[] | null;
  /** The human-authored canonical explanation (method-rung fallback source). */
  explanation: string;
}

/**
 * Build the TEXT rungs of the help spine: nudge → method. The rung that used to
 * spell out the full answer in text is deliberately GONE — the answer is
 * delivered by the reveal (the "See it" animation + the calm worked
 * walkthrough), so the animation is the payoff, not a repeat. Uses authored
 * hints where present and falls back deterministically. Pure + testable.
 */
export function buildHintLadder({ hints, explanation }: HintLadderInput): string[] {
  const authored = (hints ?? []).map((h) => h.trim()).filter(Boolean);
  const explain = explanation.trim();

  // Nudge — a gentle re-read prompt that never gives the answer away.
  const nudge =
    authored[0] ??
    "Read it through once more — what is the question really asking?";

  // Method — the key step, short of the answer. Prefer an authored hint;
  // otherwise the explanation's first sentence, but never the whole thing
  // (a single-sentence explanation usually states the answer outright).
  let method = authored[1];
  if (!method) {
    const firstSentence = explain.split(/(?<=[.!?])\s+/)[0] ?? explain;
    method =
      firstSentence && firstSentence !== explain
        ? firstSentence
        : "Focus on the key step — you're closer than you think.";
  }

  return [nudge, method];
}

export interface HelpSpineInput {
  /** Wrong attempts on this question INCLUDING the miss being handled (>= 1). */
  attempts: number;
  /** The attempt cap — at the cap the spine ends in the reveal. */
  maxAttempts: number;
  /**
   * Whether the targeted misconception line is carrying rung 1 for this
   * question (decided on the FIRST miss and held constant after that).
   */
  hasMisconception: boolean;
  /** Text rungs available (nudge, method). */
  ladderLength: number;
}

export interface HelpSpineDecision {
  /**
   * First text rung to display (0-based). When the misconception line carries
   * rung 1, the generic nudge is skipped — the method is the next new help.
   */
  showFrom: number;
  /** Display ladder rungs [showFrom, showTo); 0 = no text rung yet. */
  showTo: number;
  /** Open the reveal: the See-it animation + the calm worked walkthrough. */
  reveal: boolean;
}

/**
 * One graduated help spine — least help first, escalating, nothing stacked
 * redundantly (EDWAY §2.2/§3):
 *
 *   attempt 1 wrong → misconception line (why THAT answer; the nudge substitutes
 *                     when no targeted line is authored)
 *   attempt 2 wrong → method hint (the key step — never the answer)
 *   attempt cap     → the reveal ("See it" animation + calm worked walkthrough)
 *
 * Each attempt surfaces at most ONE new piece of help. Pure + testable.
 */
export function decideHelpSpine(input: HelpSpineInput): HelpSpineDecision {
  const { attempts, maxAttempts, hasMisconception, ladderLength } = input;
  const reveal = attempts >= maxAttempts;

  if (attempts <= 1) {
    // Rung 1 — the misconception panel is the help; otherwise show the nudge.
    return hasMisconception
      ? { showFrom: 0, showTo: 0, reveal }
      : { showFrom: 0, showTo: Math.min(1, ladderLength), reveal };
  }

  // Rung 2 — the method hint. When the misconception carried rung 1 the
  // generic nudge is skipped so exactly one new line appears.
  return hasMisconception
    ? {
        showFrom: Math.min(1, ladderLength),
        showTo: Math.min(2, ladderLength),
        reveal,
      }
    : { showFrom: 0, showTo: Math.min(2, ladderLength), reveal };
}

// ── Misconception-targeted feedback (Wave 7, Phase 3) ────────

export interface MisconceptionInput {
  /** Per-option, index-aligned human-authored misconception lines (sparse OK). */
  misconceptions?: string[] | null;
  /** The wrong option the child actually chose (mcq), or null for other types. */
  selectedIndex: number | null;
  /** The canonical correct option index (never returns its slot). */
  correctIndex: number;
}

/**
 * Pick the human-authored misconception line for the specific wrong option a
 * child chose, or null when there isn't a targeted one. Pure + deterministic —
 * this never invents text (AI never authors curriculum), it only looks up an
 * authored line. Guards the correct slot, out-of-range/blank entries, and the
 * non-mcq case (selectedIndex null) so a bad authoring row can't mislead.
 */
export function pickMisconception({
  misconceptions,
  selectedIndex,
  correctIndex,
}: MisconceptionInput): string | null {
  if (selectedIndex === null || selectedIndex === correctIndex) return null;
  if (!Array.isArray(misconceptions)) return null;
  const line = misconceptions[selectedIndex];
  if (typeof line !== "string") return null;
  const trimmed = line.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// ── Distractor-aware "Why isn't that right?" (F2) ────────────

export interface DistractorExplanationInput {
  /** The Checker-gated AI explanation, only present when it PASSED (≥95%). */
  aiExplanation?: string | null;
  /** True only when the Teaching Checker verified the AI text. */
  aiVerified?: boolean;
  /** Human-authored misconception line for the chosen wrong option, if any. */
  misconception?: string | null;
  /** Human-authored worked explanation for the question (always available). */
  workedExplanation: string;
}

/**
 * Resolve the text shown when a child taps "Why isn't that right?" on a wrong
 * answer. Child-safety: AI text is used ONLY when the Teaching Checker passed it
 * (`aiVerified` + non-empty `aiExplanation`); otherwise we fall back to the
 * human-authored misconception line (targeted at the exact distractor) and then
 * to the worked explanation. Pure + deterministic — the model never authors the
 * canonical answer, and unverified model output can never reach the child.
 */
export function distractorExplanation({
  aiExplanation,
  aiVerified,
  misconception,
  workedExplanation,
}: DistractorExplanationInput): string {
  const ai = typeof aiExplanation === "string" ? aiExplanation.trim() : "";
  if (aiVerified && ai.length > 0) return ai;

  const human = typeof misconception === "string" ? misconception.trim() : "";
  if (human.length > 0) {
    return `Let's look at that choice. ${human}`;
  }
  return `Let's look at this another way. ${workedExplanation}`;
}

// ── Resume math (Feature 3) ──────────────────────────────────

export interface SavedProgress {
  /** Index of the step the child was on (0-based). */
  step: number;
  /** Questions answered correctly so far. */
  score: number;
  /** Total questions when this progress was saved (content-change guard). */
  total: number;
}

/**
 * Decide whether and where to resume. Returns the step to resume at, or null to
 * start fresh. Guards against: no save, a content change (different total), a
 * save at the very start (nothing to resume), and an already-finished lesson.
 * Pure + testable.
 */
export function resolveResumeStep(
  saved: SavedProgress | null | undefined,
  total: number,
): number | null {
  if (!saved || total <= 0) return null;
  if (!Number.isFinite(saved.step) || !Number.isFinite(saved.total)) return null;
  if (saved.total !== total) return null; // questions changed → start fresh
  if (saved.step <= 0) return null; // at the start already
  if (saved.step >= total) return null; // already finished
  return saved.step;
}

/** Clamp a resumed score so it can never exceed the steps already passed. */
export function clampResumeScore(saved: SavedProgress, resumeStep: number): number {
  return Math.min(Math.max(0, saved.score), resumeStep);
}

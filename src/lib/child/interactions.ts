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

// ── Progressive hint ladder (Feature 2) ──────────────────────

export interface HintLadderInput {
  /** Optional human-authored hints, shortest/gentlest first. */
  hints?: string[] | null;
  /** The human-authored canonical explanation (the final rung). */
  explanation: string;
}

/**
 * Build a 3-rung hint ladder: nudge → specific → full worked explanation.
 * Uses authored hints where present and falls back deterministically so every
 * question always has a complete, escalating ladder. Pure + testable.
 */
export function buildHintLadder({ hints, explanation }: HintLadderInput): string[] {
  const authored = (hints ?? []).map((h) => h.trim()).filter(Boolean);
  const explain = explanation.trim();

  // Rung 1 — a gentle nudge that never gives the answer away.
  const nudge =
    authored[0] ??
    "Read it through once more — what is the question really asking?";

  // Rung 2 — something specific. Prefer an authored hint; otherwise lean on the
  // first sentence of the explanation (still short of the full working).
  let specific = authored[1];
  if (!specific) {
    const firstSentence = explain.split(/(?<=[.!?])\s+/)[0] ?? explain;
    specific =
      firstSentence && firstSentence !== explain
        ? firstSentence
        : "Focus on the key step — you're closer than you think.";
  }

  // Rung 3 — the full human-authored worked explanation.
  const full = authored[2] ?? explain;

  return [nudge, specific, full];
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

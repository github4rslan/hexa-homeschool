/**
 * Edway interactive practice steps — human-authored (Feature 1).
 *
 * A small, vetted set of interactive questions (tap_reveal / fill_blank /
 * drag_drop) across Maths, English and Science, attached to existing topics so
 * the daily flow gains active steps without any AI-generated content. Each item
 * still carries plain `options` + `correct_index` so it stays legacy-safe and
 * renders as mcq if the `interaction` is ever stripped.
 *
 * Interaction shapes match the discriminated union in
 * `src/lib/child/interactions.ts`. Run `npm run seed` to upsert (idempotent on
 * topic_tag + prompt).
 */

import type { SeedQuestion } from "./curriculum.seed";

export const SEED_QUESTIONS_INTERACTIVE: SeedQuestion[] = [
  // ── Maths: fill in the blank (linear algebra) ──
  {
    topic_tag: "maths_algebra_linear",
    subject: "mathematics",
    tier: 3,
    key_stage: 4,
    kind: "practice",
    prompt: "Solve the equation by filling in the answer.",
    options: ["x = 3", "x = 4", "x = 5", "x = 6"],
    correct_index: 1,
    explanation:
      "Subtract 3 from both sides: 2x = 8. Then divide by 2: x = 4.",
    hints: [
      "Get the 'x' term on its own first.",
      "Take 3 away from both sides, then halve what's left.",
    ],
    interaction: {
      type: "fill_blank",
      parts: ["2x + 3 = 11,  so  x = ", ""],
      blanks: [{ answers: ["4"], numeric: true, placeholder: "?" }],
    },
  },

  // ── Maths: drag & drop (shapes → number of sides) ──
  {
    topic_tag: "maths_geometry",
    subject: "mathematics",
    tier: 2,
    key_stage: 4,
    kind: "practice",
    prompt: "Match each shape to its number of sides.",
    options: ["Triangle = 3, Square = 4, Pentagon = 5", "All have 4", "Triangle = 4", "Pentagon = 6"],
    correct_index: 0,
    explanation:
      "A triangle has 3 sides, a square has 4, and a pentagon has 5.",
    hints: [
      "Count the straight edges of each shape.",
      "‘Penta’ means five — so a pentagon has five sides.",
    ],
    interaction: {
      type: "drag_drop",
      chips: ["3", "4", "5"],
      slots: [
        { label: "Triangle", correctChip: 0 },
        { label: "Square", correctChip: 1 },
        { label: "Pentagon", correctChip: 2 },
      ],
    },
  },

  // ── English: tap to reveal (spot the simile) ──
  {
    topic_tag: "eng_devices",
    subject: "english",
    tier: 4,
    key_stage: 4,
    kind: "practice",
    prompt: "Which phrase is a simile?",
    options: [
      "The classroom was a zoo",
      "As brave as a lion",
      "The wind whispered",
    ],
    correct_index: 1,
    explanation:
      "A simile compares using 'as' or 'like'. 'As brave as a lion' is the simile.",
    hints: [
      "A simile always uses the words 'as' or 'like'.",
      "Look for the phrase that compares two things using 'as'.",
    ],
    interaction: {
      type: "tap_reveal",
      instruction: "Tap each card to read it, then choose the simile.",
      cards: [
        { label: "Card A", reveal: "The classroom was a zoo" },
        { label: "Card B", reveal: "As brave as a lion" },
        { label: "Card C", reveal: "The wind whispered" },
      ],
      correctCard: 1,
    },
  },

  // ── English: fill in the blank (spelling rule) ──
  {
    topic_tag: "eng_spelling",
    subject: "english",
    tier: 2,
    key_stage: 4,
    kind: "practice",
    prompt: "Complete the well-known spelling rule.",
    options: ["c", "s", "t", "k"],
    correct_index: 0,
    explanation:
      "The rule is 'I before E except after C' — so the missing letter is C.",
    hints: [
      "Think of the words 'receive' and 'ceiling'.",
      "Which letter comes just before 'EI' in those words?",
    ],
    interaction: {
      type: "fill_blank",
      parts: ["I before E, except after ", "."],
      blanks: [{ answers: ["c"], placeholder: "?" }],
    },
  },

  // ── Science: drag & drop (states of matter) ──
  {
    topic_tag: "sci_states",
    subject: "science",
    tier: 2,
    key_stage: 4,
    kind: "practice",
    prompt: "Match each state of matter to how its particles behave.",
    options: [
      "Solid = packed, Liquid = close & flowing, Gas = far apart",
      "All the same",
      "Gas = packed tightly",
      "Solid = far apart",
    ],
    correct_index: 0,
    explanation:
      "Solid particles are packed in a fixed pattern; liquid particles are close but can flow; gas particles are far apart and move fast.",
    hints: [
      "Think about which state keeps its shape and which spreads out.",
      "Gas particles have the most room to move; solids have the least.",
    ],
    interaction: {
      type: "drag_drop",
      chips: ["Solid", "Liquid", "Gas"],
      slots: [
        { label: "Packed, fixed pattern", correctChip: 0 },
        { label: "Close together, can flow", correctChip: 1 },
        { label: "Far apart, moving fast", correctChip: 2 },
      ],
    },
  },

  // ── Science: tap to reveal (cell parts) ──
  {
    topic_tag: "sci_cells",
    subject: "science",
    tier: 2,
    key_stage: 4,
    kind: "practice",
    prompt: "Which part controls what enters and leaves the cell?",
    options: ["Nucleus", "Cell membrane", "Mitochondria"],
    correct_index: 1,
    explanation:
      "The cell membrane controls what moves in and out of the cell.",
    hints: [
      "It's the part on the very edge of the cell.",
      "Think of the 'gatekeeper' at the cell's boundary.",
    ],
    interaction: {
      type: "tap_reveal",
      instruction: "Tap each card to reveal the part, then pick the gatekeeper.",
      cards: [
        { label: "Card A", reveal: "Nucleus" },
        { label: "Card B", reveal: "Cell membrane" },
        { label: "Card C", reveal: "Mitochondria" },
      ],
      correctCard: 1,
    },
  },
];

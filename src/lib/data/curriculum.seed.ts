/**
 * Edway curriculum + question bank — human-authored seed content.
 *
 * Source of truth for the `curriculum_topics` and `questions` collections.
 * Mapped to UK GCSE specifications (Pearson Edexcel Maths 1MA1, AQA English
 * 8700, AQA Combined Science Trilogy 8464). This is a strong bounded Phase-1
 * set (10 topics/subject, KS3→KS4 progression, with diagnostic/practice/mastery
 * items per topic). It replaces the previously hardcoded TS arrays.
 *
 * Authoring rules (Brief: "Honesty over hype", zero wrong teaching):
 *  - Every question has exactly one correct option and a plain explanation.
 *  - tier 1 (easiest) … 5 (hardest), loosely mapping to working grade.
 *  - kind: diagnostic (entry mapping) | practice (daily) | mastery (3-Q check).
 *
 * Run `npm run seed` to upsert this into MongoDB.
 */

import type { Subject } from "../db/types";

export interface SeedTopic {
  subject: Subject;
  topic_tag: string;
  title: string;
  summary: string;
  key_stage: number;
  working_grade_band: string;
  order: number;
  prerequisite_tags: string[];
  worked_example?: unknown;
  /** Optional human-authored tap-to-define glossary (F9). */
  glossary?: { term: string; definition: string }[];
}

export interface SeedQuestion {
  topic_tag: string;
  subject: Subject;
  tier: number;
  /** UK key stage band: 2 (KS2), 3 (KS3), 4 (GCSE). This bank is all GCSE. */
  key_stage: number;
  kind: "diagnostic" | "practice" | "mastery" | "stretch";
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  /**
   * Optional interactive step definition (Feature 1). Absent ⇒ renders as mcq.
   * Shape is the discriminated union in `lib/child/interactions.ts`; typed as
   * `unknown` here to keep that schema out of the data layer.
   */
  interaction?: unknown;
  /** Optional human-authored progressive hints (nudge → specific). */
  hints?: string[];
  /**
   * Optional per-option misconception lines, index-aligned with `options`
   * (Wave 7, Phase 3). Each entry targets the WRONG option at that index; the
   * correct slot is ignored. Sparse arrays are fine.
   */
  misconceptions?: string[];
  worked_solution?: unknown;
}

// ════════════════════════════════════════════════════════════
//  TOPICS
// ════════════════════════════════════════════════════════════

const BASE_SEED_TOPICS: SeedTopic[] = [
  // ── Mathematics (Pearson Edexcel 1MA1) ──
  { subject: "mathematics", topic_tag: "maths_number", title: "Number & Place Value", summary: "Place value, ordering, rounding, estimation and standard form.", key_stage: 4, working_grade_band: "Grade 1–3", order: 1, prerequisite_tags: [] },
  { subject: "mathematics", topic_tag: "maths_fractions", title: "Fractions, Decimals & Percentages", summary: "Converting and calculating with fractions, decimals and percentages.", key_stage: 4, working_grade_band: "Grade 2–4", order: 2, prerequisite_tags: ["maths_number"] },
  { subject: "mathematics", topic_tag: "maths_ratio", title: "Ratio & Proportion", summary: "Sharing in a ratio, direct and inverse proportion.", key_stage: 4, working_grade_band: "Grade 3–5", order: 3, prerequisite_tags: ["maths_fractions"] },
  { subject: "mathematics", topic_tag: "maths_algebra_linear", title: "Linear Algebra", summary: "Expressions, linear equations and rearranging formulae.", key_stage: 4, working_grade_band: "Grade 4–5", order: 4, prerequisite_tags: ["maths_number"] },
  { subject: "mathematics", topic_tag: "maths_sequences", title: "Sequences", summary: "Term-to-term and nth-term rules for linear sequences.", key_stage: 4, working_grade_band: "Grade 4–5", order: 5, prerequisite_tags: ["maths_algebra_linear"] },
  { subject: "mathematics", topic_tag: "maths_graphs", title: "Coordinates & Linear Graphs", summary: "Plotting lines, gradient and y = mx + c.", key_stage: 4, working_grade_band: "Grade 4–6", order: 6, prerequisite_tags: ["maths_algebra_linear"] },
  { subject: "mathematics", topic_tag: "maths_quadratics", title: "Quadratics", summary: "Expanding, factorising and solving quadratic equations.", key_stage: 4, working_grade_band: "Grade 5–7", order: 7, prerequisite_tags: ["maths_algebra_linear"] },
  { subject: "mathematics", topic_tag: "maths_geometry", title: "Geometry & Angles", summary: "Angle rules, polygons and properties of shapes.", key_stage: 4, working_grade_band: "Grade 3–5", order: 8, prerequisite_tags: ["maths_number"] },
  { subject: "mathematics", topic_tag: "maths_pythagoras", title: "Pythagoras & Trigonometry", summary: "Right-angled triangles, Pythagoras and basic trig ratios.", key_stage: 4, working_grade_band: "Grade 5–7", order: 9, prerequisite_tags: ["maths_geometry"] },
  { subject: "mathematics", topic_tag: "maths_statistics", title: "Statistics & Probability", summary: "Averages, data handling and probability fundamentals.", key_stage: 4, working_grade_band: "Grade 3–6", order: 10, prerequisite_tags: ["maths_fractions"] },
  // F8 — mensuration strand (area / perimeter / volume / circles), a high-frequency
  // Edexcel 1MA1 Geometry & Measures area that the bank was missing entirely.
  { subject: "mathematics", topic_tag: "maths_mensuration", title: "Area, Perimeter & Volume", summary: "Area and perimeter of rectangles, circumference of circles, and volume of solids.", key_stage: 4, working_grade_band: "Grade 2–5", order: 11, prerequisite_tags: ["maths_geometry"] },
  // F2 (2026-08-09) — inequalities strand (Edexcel 1MA1 A22), a high-frequency
  // Foundation + Higher topic the bank was missing entirely.
  { subject: "mathematics", topic_tag: "maths_inequalities", title: "Inequalities", summary: "Solving linear inequalities and representing solutions on a number line.", key_stage: 4, working_grade_band: "Grade 3–5", order: 12, prerequisite_tags: ["maths_algebra_linear"], glossary: [{ term: "inequality", definition: "A statement that one amount is less than or greater than another, using signs like <, >, ≤ or ≥ instead of an equals sign." }, { term: "number line", definition: "A straight line with numbers marked in order, used to show where a solution lies." }] },

  // ── English (AQA 8700) ──
  { subject: "english", topic_tag: "eng_spelling", title: "Spelling & Vocabulary", summary: "Common spelling patterns and precise word choice.", key_stage: 4, working_grade_band: "Grade 1–3", order: 1, prerequisite_tags: [] },
  { subject: "english", topic_tag: "eng_grammar", title: "Grammar & Sentence Structure", summary: "Subject–verb agreement, tenses and clauses.", key_stage: 4, working_grade_band: "Grade 2–4", order: 2, prerequisite_tags: ["eng_spelling"] },
  { subject: "english", topic_tag: "eng_punctuation", title: "Punctuation", summary: "Apostrophes, commas, colons and speech punctuation.", key_stage: 4, working_grade_band: "Grade 2–4", order: 3, prerequisite_tags: ["eng_grammar"] },
  { subject: "english", topic_tag: "eng_comprehension", title: "Reading Comprehension", summary: "Retrieving and inferring meaning from texts.", key_stage: 4, working_grade_band: "Grade 3–5", order: 4, prerequisite_tags: ["eng_grammar"] },
  { subject: "english", topic_tag: "eng_devices", title: "Language Devices", summary: "Identifying simile, metaphor, personification and more.", key_stage: 4, working_grade_band: "Grade 4–6", order: 5, prerequisite_tags: ["eng_comprehension"] },
  { subject: "english", topic_tag: "eng_analysis", title: "Language Analysis", summary: "Analysing how writers create effect through word and structure.", key_stage: 4, working_grade_band: "Grade 5–7", order: 6, prerequisite_tags: ["eng_devices"] },
  { subject: "english", topic_tag: "eng_creative", title: "Creative Writing", summary: "Narrative and descriptive writing techniques.", key_stage: 4, working_grade_band: "Grade 4–6", order: 7, prerequisite_tags: ["eng_grammar"] },
  { subject: "english", topic_tag: "eng_persuasive", title: "Persuasive & Transactional Writing", summary: "Argument, rhetoric and writing for a purpose.", key_stage: 4, working_grade_band: "Grade 4–6", order: 8, prerequisite_tags: ["eng_creative"] },
  { subject: "english", topic_tag: "eng_poetry", title: "Poetry & Structure", summary: "Form, rhyme, rhythm and structural features.", key_stage: 4, working_grade_band: "Grade 5–7", order: 9, prerequisite_tags: ["eng_analysis"] },
  { subject: "english", topic_tag: "eng_shakespeare", title: "Shakespeare & Context", summary: "Reading Shakespeare and using contextual knowledge.", key_stage: 4, working_grade_band: "Grade 5–8", order: 10, prerequisite_tags: ["eng_analysis"] },

  // ── Science (AQA Combined Science Trilogy 8464) ──
  { subject: "science", topic_tag: "sci_cells", title: "Cell Biology", summary: "Cell structure, transport and division.", key_stage: 4, working_grade_band: "Grade 2–4", order: 1, prerequisite_tags: [] },
  { subject: "science", topic_tag: "sci_body", title: "Human Body Systems", summary: "Organisation, digestion and the circulatory system.", key_stage: 4, working_grade_band: "Grade 3–5", order: 2, prerequisite_tags: ["sci_cells"] },
  { subject: "science", topic_tag: "sci_states", title: "States of Matter", summary: "Solids, liquids, gases and changes of state.", key_stage: 4, working_grade_band: "Grade 1–3", order: 3, prerequisite_tags: [] },
  { subject: "science", topic_tag: "sci_atoms", title: "Atomic Structure", summary: "Atoms, elements and the periodic table.", key_stage: 4, working_grade_band: "Grade 3–5", order: 4, prerequisite_tags: ["sci_states"] },
  { subject: "science", topic_tag: "sci_reactions", title: "Chemical Reactions", summary: "Equations, acids, bases and reaction types.", key_stage: 4, working_grade_band: "Grade 4–6", order: 5, prerequisite_tags: ["sci_atoms"] },
  { subject: "science", topic_tag: "sci_forces", title: "Forces & Motion", summary: "Speed, acceleration and Newton's laws.", key_stage: 4, working_grade_band: "Grade 4–6", order: 6, prerequisite_tags: ["sci_states"] },
  { subject: "science", topic_tag: "sci_energy", title: "Energy", summary: "Energy stores, transfers and conservation.", key_stage: 4, working_grade_band: "Grade 3–5", order: 7, prerequisite_tags: ["sci_forces"] },
  { subject: "science", topic_tag: "sci_electricity", title: "Electricity", summary: "Current, voltage, resistance and circuits.", key_stage: 4, working_grade_band: "Grade 4–6", order: 8, prerequisite_tags: ["sci_energy"] },
  { subject: "science", topic_tag: "sci_genetics", title: "Inheritance & Genetics", summary: "DNA, genes, variation and inheritance.", key_stage: 4, working_grade_band: "Grade 5–7", order: 9, prerequisite_tags: ["sci_cells"] },
  { subject: "science", topic_tag: "sci_ecology", title: "Ecology", summary: "Ecosystems, food chains and the carbon cycle.", key_stage: 4, working_grade_band: "Grade 3–5", order: 10, prerequisite_tags: ["sci_body"] },
];

const WORKED_EXAMPLES_BY_TOPIC: Record<string, SeedTopic["worked_example"]> = {
  maths_inequalities: {
    title: "Solve the inequality x + 3 < 7",
    scenario: "We want every value of x that makes x + 3 less than 7.",
    steps: [
      { line: "An inequality is kept balanced just like an equation, so subtract 3 from both sides.", visual: { label: "Both sides", value: "x + 3 − 3 < 7 − 3" } },
      { line: "That leaves x < 4, so any number below 4 works.", visual: { label: "Solution", value: "x < 4" } },
      { line: "On a number line, put an open circle at 4 and shade to the left, because 4 itself is not included.", visual: { label: "Number line", value: "◦—— 4" } },
    ],
    yourTurn: "Try solving x + 2 < 9. Subtract 2 from both sides first.",
  },
  maths_number: {
    title: "Round 3,748 to the nearest hundred",
    scenario: "A shop counted 3,748 items and wants a quick estimate.",
    steps: [
      { line: "Find the hundreds digit: in 3,748, the hundreds digit is 7.", visual: { label: "Hundreds", value: "7" } },
      { line: "Look at the next digit, the tens digit. It is 4.", visual: { label: "Tens", value: "4" } },
      { line: "Because 4 is less than 5, keep the hundreds digit the same and change tens and ones to zero.", visual: { label: "Rounded", value: "3,700" } },
    ],
    yourTurn: "Try rounding 6,382 to the nearest hundred. Check the tens digit.",
  },
  eng_spelling: {
    title: "Choose a precise spelling",
    scenario: "A sentence needs the word necessary.",
    steps: [
      { line: "Break the word into chunks: ne-ces-sar-y.", visual: { label: "Chunks", value: "ne / ces / sar / y" } },
      { line: "Remember the pattern: one c and two s letters.", visual: { label: "Pattern", value: "1 c, 2 s" } },
      { line: "So the spelling is necessary.", visual: { label: "Word", value: "necessary" } },
    ],
    yourTurn: "Try definitely. Break it into chunks before choosing.",
  },
  sci_cells: {
    title: "Animal cell parts",
    scenario: "A diagram labels the nucleus, cytoplasm and cell membrane.",
    steps: [
      { line: "The nucleus contains genetic information and controls the cell.", visual: { label: "Nucleus", value: "control" } },
      { line: "The cytoplasm is where many chemical reactions happen.", visual: { label: "Cytoplasm", value: "reactions" } },
      { line: "The cell membrane controls what enters and leaves.", visual: { label: "Membrane", value: "in and out" } },
    ],
    yourTurn: "Try naming the part that controls the cell.",
  },
};

export const SEED_TOPICS: SeedTopic[] = BASE_SEED_TOPICS.map((topic) => ({
  ...topic,
  ...(WORKED_EXAMPLES_BY_TOPIC[topic.topic_tag]
    ? { worked_example: WORKED_EXAMPLES_BY_TOPIC[topic.topic_tag] }
    : {}),
}));

// ════════════════════════════════════════════════════════════
//  QUESTIONS
//  Compact tuple format expanded into QuestionDoc below:
//  [tier, kind, prompt, options[], correctIndex, explanation]
// ════════════════════════════════════════════════════════════

type QTuple = [
  number,
  "diagnostic" | "practice" | "mastery",
  string,
  string[],
  number,
  string,
];

const QUESTIONS_BY_TOPIC: Record<string, QTuple[]> = {
  // ── Maths ──
  maths_number: [
    [1, "diagnostic", "What is the value of the 7 in 4,732?", ["7", "70", "700", "7,000"], 2, "The 7 is in the hundreds column, so its value is 700."],
    [1, "practice", "Round 486 to the nearest 100.", ["400", "480", "500", "490"], 2, "486 is closer to 500 than 400, so it rounds to 500."],
    [2, "practice", "Write 0.0045 in standard form.", ["4.5 × 10³", "4.5 × 10⁻³", "45 × 10⁻³", "4.5 × 10⁻²"], 1, "Move the point 3 places right to get 4.5, so the power is −3."],
    [2, "mastery", "Which number is largest?", ["0.9", "0.85", "0.099", "0.901"], 3, "0.901 is the largest — compare digits place by place after the point."],
    [3, "mastery", "Estimate 39 × 21 by rounding.", ["600", "800", "1,000", "400"], 1, "Round to 40 × 20 = 800."],
    [3, "mastery", "What is 5³?", ["15", "125", "25", "8"], 1, "5 × 5 × 5 = 125."],
  ],
  maths_fractions: [
    [1, "diagnostic", "What is ½ of 18?", ["6", "9", "12", "8"], 1, "Half of 18 is 18 ÷ 2 = 9."],
    [2, "practice", "What is ¾ + ⅛?", ["7/8", "4/12", "1/2", "5/8"], 0, "Convert ¾ to 6/8, then 6/8 + 1/8 = 7/8."],
    [2, "practice", "Write 0.25 as a fraction in simplest form.", ["1/2", "1/4", "2/5", "1/5"], 1, "0.25 = 25/100 = 1/4."],
    [3, "mastery", "What is 20% of 150?", ["20", "30", "15", "25"], 1, "10% of 150 is 15, so 20% is 30."],
    [3, "mastery", "What is ⅔ × ¾?", ["1/2", "5/7", "7/12", "5/8"], 0, "Multiply tops and bottoms: 6/12 = 1/2."],
    [4, "mastery", "Increase £80 by 15%.", ["£92", "£95", "£88", "£90"], 0, "15% of 80 is 12, so 80 + 12 = £92."],
  ],
  maths_ratio: [
    [2, "diagnostic", "Share £20 in the ratio 1:3.", ["£5 and £15", "£10 and £10", "£4 and £16", "£8 and £12"], 0, "There are 4 parts; each part is £5, so 1:3 = £5 and £15."],
    [3, "practice", "Simplify the ratio 12:18.", ["2:3", "3:4", "6:9", "1:2"], 0, "Divide both by 6 to get 2:3."],
    [3, "practice", "If 5 pens cost £2, how much do 15 pens cost?", ["£4", "£6", "£8", "£5"], 1, "15 is 3 × 5, so the cost is 3 × £2 = £6."],
    [4, "mastery", "Share 35 sweets in the ratio 2:5.", ["10 and 25", "15 and 20", "7 and 28", "5 and 30"], 0, "7 parts of 5 each: 2 parts = 10, 5 parts = 25."],
    [4, "mastery", "A map scale is 1:50,000. 2 cm represents how many metres?", ["100 m", "500 m", "1,000 m", "5,000 m"], 2, "2 cm × 50,000 = 100,000 cm = 1,000 m."],
  ],
  maths_algebra_linear: [
    [2, "diagnostic", "Simplify 3a + 4a.", ["7a", "12a", "7", "a7"], 0, "Add like terms: 3a + 4a = 7a."],
    [3, "practice", "Solve 3x + 7 = 22.", ["x = 3", "x = 5", "x = 7", "x = 15"], 1, "Subtract 7: 3x = 15. Divide by 3: x = 5."],
    [3, "practice", "Expand 2(x + 3).", ["2x + 3", "2x + 6", "x + 6", "2x + 5"], 1, "Multiply both terms by 2: 2x + 6."],
    [4, "mastery", "Solve 5x − 4 = 2x + 11.", ["x = 3", "x = 5", "x = 7", "x = 15"], 1, "5x − 2x = 11 + 4 → 3x = 15 → x = 5."],
    [4, "mastery", "Make y the subject: 2y + 6 = 10.", ["y = 2", "y = 4", "y = 8", "y = 16"], 0, "2y = 4 → y = 2."],
    [5, "mastery", "Expand (x + 2)(x + 3).", ["x² + 5x + 6", "x² + 6x + 5", "x² + 5x + 5", "x² + 6"], 0, "x² + 3x + 2x + 6 = x² + 5x + 6."],
  ],
  maths_sequences: [
    [3, "diagnostic", "Find the next term: 4, 7, 10, 13, …", ["15", "16", "17", "14"], 1, "The rule is +3, so 13 + 3 = 16."],
    [4, "practice", "What is the nth term of 5, 8, 11, 14, …?", ["3n + 2", "3n + 5", "5n + 3", "2n + 3"], 0, "Common difference 3 gives 3n; 3(1)+2 = 5, so 3n + 2."],
    [4, "mastery", "Find the 10th term of 2, 5, 8, …", ["29", "30", "32", "27"], 0, "nth term 3n − 1; 3(10) − 1 = 29."],
    [5, "mastery", "Which term of 3n + 1 equals 31?", ["n = 9", "n = 10", "n = 11", "n = 8"], 1, "3n + 1 = 31 → 3n = 30 → n = 10."],
  ],
  maths_graphs: [
    [4, "diagnostic", "In y = mx + c, what does m represent?", ["The y-intercept", "The gradient", "The x value", "The origin"], 1, "m is the gradient (steepness) of the line."],
    [4, "practice", "What is the gradient of y = 3x + 2?", ["2", "3", "5", "1"], 1, "The coefficient of x is the gradient, so 3."],
    [5, "mastery", "Where does y = 2x − 4 cross the y-axis?", ["(0, −4)", "(0, 2)", "(−4, 0)", "(2, 0)"], 0, "At x = 0, y = −4, so it crosses at (0, −4)."],
    [5, "mastery", "A line passes through (0,1) with gradient 2. Its equation is:", ["y = 2x + 1", "y = x + 2", "y = 2x − 1", "y = x + 1"], 0, "Gradient 2 and intercept 1 give y = 2x + 1."],
  ],
  maths_quadratics: [
    [5, "diagnostic", "Factorise x² + 5x + 6.", ["(x+2)(x+3)", "(x+1)(x+6)", "(x+2)(x+4)", "(x−2)(x−3)"], 0, "2 and 3 multiply to 6 and add to 5."],
    [5, "practice", "Solve x² − 9 = 0.", ["x = ±3", "x = 9", "x = ±9", "x = 3"], 0, "x² = 9, so x = 3 or x = −3."],
    [5, "mastery", "Solve x² − 5x + 6 = 0.", ["x = 2 or 3", "x = 1 or 6", "x = −2 or −3", "x = 0 or 5"], 0, "Factorises to (x−2)(x−3) = 0."],
    [5, "mastery", "Expand (x − 4)².", ["x² − 8x + 16", "x² + 16", "x² − 16", "x² − 8x − 16"], 0, "(x−4)(x−4) = x² − 8x + 16."],
  ],
  maths_geometry: [
    [2, "diagnostic", "Angles on a straight line add up to:", ["90°", "180°", "360°", "270°"], 1, "Angles on a straight line always sum to 180°."],
    [3, "practice", "What is the sum of the interior angles of a triangle?", ["180°", "360°", "90°", "270°"], 0, "The interior angles of any triangle sum to 180°."],
    [4, "mastery", "Interior angles of a quadrilateral sum to:", ["180°", "360°", "540°", "720°"], 1, "A quadrilateral's interior angles sum to 360°."],
    [4, "mastery", "Each interior angle of a regular hexagon is:", ["108°", "120°", "135°", "144°"], 1, "Sum 720° ÷ 6 = 120°."],
  ],
  maths_pythagoras: [
    [5, "diagnostic", "In a right triangle, a² + b² = ?", ["c", "c²", "2c", "ab"], 1, "Pythagoras: the squares of the two shorter sides sum to the square of the hypotenuse."],
    [5, "practice", "Legs 3 and 4. Find the hypotenuse.", ["5", "7", "6", "12"], 0, "3² + 4² = 25, so the hypotenuse is √25 = 5."],
    [5, "mastery", "If opposite = 3 and hypotenuse = 5, sin θ = ?", ["0.6", "0.8", "0.75", "1.67"], 0, "sin θ = opposite ÷ hypotenuse = 3/5 = 0.6."],
    [5, "mastery", "Legs 6 and 8. Find the hypotenuse.", ["10", "12", "14", "48"], 0, "6² + 8² = 100, so √100 = 10."],
  ],
  maths_statistics: [
    [2, "diagnostic", "Find the mean of 2, 4, 6.", ["3", "4", "6", "12"], 1, "(2 + 4 + 6) ÷ 3 = 12 ÷ 3 = 4."],
    [3, "practice", "Find the median of 3, 7, 4, 1, 9.", ["3", "4", "7", "1"], 1, "Ordered: 1,3,4,7,9 — the middle value is 4."],
    [3, "mastery", "The probability of an impossible event is:", ["0", "0.5", "1", "−1"], 0, "Impossible events have probability 0."],
    [4, "mastery", "A fair die is rolled. P(even number) = ?", ["1/6", "1/3", "1/2", "2/3"], 2, "Even outcomes 2,4,6 out of 6 = 3/6 = 1/2."],
  ],
  // F8 — mensuration starter set (authored by Scout 2026-08-08, owner-approved).
  // Three checked starters (the owner extends this bank over time). Each has a
  // classic exam trap as a distractor. All re-derived below.
  maths_mensuration: [
    // 1MA1 G16 — 26 cm² is the perimeter trap, 13 cm² is half the perimeter.
    [2, "practice", "Work out the area of a rectangle 8 cm long and 5 cm wide.", ["13 cm²", "40 cm²", "26 cm²", "20 cm²"], 1, "Area of a rectangle is length times width: 8 times 5 is 40 cm²."],
    // 1MA1 G17 — 78.5 cm² is the area πr² trap (the classic circumference/area mix-up).
    [3, "mastery", "A circle has radius 5 cm. Work out its circumference. Use π = 3.14.", ["15.7 cm", "31.4 cm", "78.5 cm", "10 cm"], 1, "Circumference is 2 times π times radius: 2 times 3.14 times 5 is 31.4 cm."],
    // 1MA1 G17 — 9 cm³ is the 3² area-not-volume trap.
    [3, "mastery", "Work out the volume of a cube with sides of 3 cm.", ["9 cm³", "27 cm³", "18 cm³", "12 cm³"], 1, "Volume of a cube is side cubed: 3 times 3 times 3 is 27 cm³."],
  ],
  // F2 (2026-08-09) — maths_inequalities (Edexcel 1MA1 A22)
  maths_inequalities: [
    [3, "practice", "Solve the inequality x + 3 < 7.", ["x < 4", "x < 10", "x > 4", "x < 21"], 0, "Subtract 3 from both sides: x < 4."],
    [4, "mastery", "Solve 2x ≥ 10.", ["x ≥ 5", "x ≥ 20", "x ≥ 8", "x ≤ 5"], 0, "Divide both sides by 2: x ≥ 5. The sign does not flip when dividing by a positive number."],
    [4, "mastery", "Which integers satisfy −2 < x ≤ 1?", ["−1, 0, 1", "−2, −1, 0, 1", "0, 1", "−2, −1, 0"], 0, "−2 is excluded (strict <) and 1 is included (≤), so the integers are −1, 0 and 1."],
  ],

  // ── English ──
  eng_spelling: [
    [1, "diagnostic", "Which word is spelled correctly?", ["definately", "definitely", "definatly", "definitley"], 1, "The correct spelling is 'definitely' — note 'finite' inside it."],
    [1, "practice", "Choose the correct spelling.", ["seperate", "seperete", "separate", "saparate"], 2, "'Separate' has 'a rat' in the middle: sep-a-rat-e."],
    [2, "practice", "Which is correct?", ["recieve", "receive", "receeve", "receve"], 1, "'i before e except after c' → receive."],
    [2, "mastery", "Choose the correct spelling.", ["necessary", "neccessary", "necesary", "neccesary"], 0, "'Necessary' — one collar (c) and two sleeves (ss)."],
    [3, "mastery", "Which word means 'happening every year'?", ["annual", "anual", "annural", "anuel"], 0, "'Annual' is the correct spelling."],
  ],
  eng_grammar: [
    [1, "diagnostic", "Choose the correct sentence.", ["She don't like it.", "She doesn't likes it.", "She doesn't like it.", "She not like it."], 2, "'Doesn't' is followed by the base verb 'like'."],
    [2, "practice", "Which sentence uses the past tense correctly?", ["I goed home.", "I went home.", "I gone home.", "I going home."], 1, "The past tense of 'go' is the irregular form 'went'."],
    [2, "practice", "Identify the verb: 'The dog barked loudly.'", ["dog", "barked", "loudly", "the"], 1, "'Barked' is the action word (verb)."],
    [3, "mastery", "Which sentence is grammatically correct?", ["Me and him went.", "Him and I went.", "He and I went.", "I and he went."], 2, "Use subject pronouns 'He and I' as the subject."],
    [3, "mastery", "Choose the correct word: 'There are fewer ___ today.'", ["traffic", "cars", "water", "money"], 1, "'Fewer' is used with countable nouns like 'cars'."],
  ],
  eng_punctuation: [
    [2, "diagnostic", "Which uses the apostrophe correctly?", ["The dog's bone", "The dogs' bone (one dog)", "The dogs bone", "The dog's are barking"], 0, "'The dog's bone' shows possession by one dog."],
    [2, "practice", "Where does the comma go? 'After lunch we played.'", ["After, lunch we played.", "After lunch, we played.", "After lunch we, played.", "No comma needed"], 1, "A comma follows the introductory phrase 'After lunch'."],
    [3, "mastery", "Which sentence is punctuated correctly?", ["Its raining outside.", "It's raining outside.", "Its' raining outside.", "Its raining, outside"], 1, "'It's' = 'it is', which needs an apostrophe."],
    [3, "mastery", "Choose the correct use of a colon.", ["I need: eggs, milk and bread.", "I need eggs: milk and bread.", "I need three things: eggs, milk and bread.", "I: need three things."], 2, "A colon introduces a list after a complete clause."],
  ],
  eng_comprehension: [
    [3, "diagnostic", "'The sky darkened and people hurried home.' What can you infer?", ["It is morning", "A storm is coming", "It is sunny", "People are happy"], 1, "Darkening sky and hurrying suggest bad weather approaching."],
    [4, "practice", "Reading for the writer's main idea is called:", ["skimming", "scanning", "inference", "retrieval"], 0, "Skimming gives you the overall gist/main idea quickly."],
    [4, "mastery", "Finding a specific fact in a text is called:", ["skimming", "scanning", "predicting", "summarising"], 1, "Scanning means searching for specific information."],
    [4, "mastery", "An inference is:", ["a direct quote", "a conclusion from clues", "the title", "a spelling rule"], 1, "An inference is a conclusion drawn from evidence in the text."],
  ],
  eng_devices: [
    [4, "diagnostic", "'The wind whispered through the trees' is an example of:", ["Simile", "Personification", "Hyperbole", "Onomatopoeia"], 1, "Giving the wind the human ability to whisper is personification."],
    [4, "practice", "'As brave as a lion' is a:", ["Metaphor", "Simile", "Alliteration", "Pun"], 1, "A simile compares using 'as' or 'like'."],
    [5, "mastery", "'The classroom was a zoo' is a:", ["Simile", "Metaphor", "Onomatopoeia", "Rhyme"], 1, "A metaphor states one thing IS another for effect."],
    [5, "mastery", "'Buzz', 'crash' and 'splash' are examples of:", ["Simile", "Metaphor", "Onomatopoeia", "Personification"], 2, "Onomatopoeia are words that imitate sounds."],
  ],
  eng_analysis: [
    [5, "diagnostic", "A writer uses short, fragmented sentences in a tense scene mainly to:", ["Slow the pace", "Build tension and urgency", "Add humour", "Describe setting"], 1, "Short sentences quicken pace and heighten tension."],
    [5, "practice", "Repeating a word for emphasis is called:", ["repetition", "rhyme", "simile", "caesura"], 0, "Deliberate repetition emphasises an idea or feeling."],
    [5, "mastery", "Analysing 'word choice' means looking at the writer's:", ["punctuation", "diction", "page numbers", "font"], 1, "Diction is the writer's specific choice of words."],
    [5, "mastery", "A 'semantic field' of war might include:", ["battle, weapon, soldier", "love, heart, kiss", "rain, cloud, sun", "happy, joy, smile"], 0, "A semantic field is a group of words linked by theme — here, war."],
  ],
  eng_creative: [
    [4, "diagnostic", "Describing using the five senses is called:", ["dialogue", "sensory description", "summary", "rhyme"], 1, "Sensory description appeals to sight, sound, touch, taste and smell."],
    [4, "practice", "The best opening to grab a reader is often:", ["a definition", "a list of facts", "an intriguing hook", "the conclusion"], 2, "A hook creates curiosity and pulls the reader in."],
    [5, "mastery", "Showing a character is scared without saying 'scared' is:", ["telling", "showing", "summarising", "rhyming"], 1, "'Show, don't tell' conveys emotion through action and detail."],
    [5, "mastery", "Varying sentence length in writing helps to:", ["confuse the reader", "control pace and rhythm", "fill space", "avoid punctuation"], 1, "Sentence variety controls the pace and rhythm of writing."],
  ],
  eng_persuasive: [
    [4, "diagnostic", "Rhetorical questions are used to:", ["confuse readers", "engage and persuade", "end an essay", "spell words"], 1, "Rhetorical questions make the reader think and engage with the argument."],
    [4, "practice", "'Act now before it's too late!' uses:", ["statistics", "a call to action", "a simile", "a fact"], 1, "A call to action urges the reader to do something."],
    [5, "mastery", "AFOREST is a checklist for:", ["spelling", "persuasive techniques", "punctuation", "poetry forms"], 1, "AFOREST lists persuasive devices (Alliteration, Facts, Opinion, etc.)."],
    [5, "mastery", "Using 'we' and 'you' in persuasion creates:", ["distance", "a personal connection", "confusion", "rhyme"], 1, "Direct address builds a personal connection with the reader."],
  ],
  eng_poetry: [
    [5, "diagnostic", "A 14-line poem is traditionally called a:", ["haiku", "sonnet", "ballad", "limerick"], 1, "A sonnet has 14 lines."],
    [5, "practice", "The rhythm/beat of a poem is its:", ["metre", "stanza", "rhyme", "theme"], 0, "Metre is the pattern of stressed and unstressed beats."],
    [5, "mastery", "A group of lines in a poem is a:", ["verse foot", "stanza", "couplet only", "metre"], 1, "A stanza is a grouped set of lines, like a paragraph in poetry."],
    [5, "mastery", "Two consecutive rhyming lines form a:", ["stanza", "couplet", "sonnet", "refrain"], 1, "A couplet is a pair of rhyming lines."],
  ],
  eng_shakespeare: [
    [5, "diagnostic", "Shakespeare often wrote his plays in:", ["free verse", "iambic pentameter", "haiku", "prose only"], 1, "Iambic pentameter is his characteristic ten-syllable rhythm."],
    [5, "practice", "'Romeo and Juliet' is a:", ["comedy", "tragedy", "history", "sonnet"], 1, "It ends in the lovers' deaths, making it a tragedy."],
    [5, "mastery", "An 'aside' in a play is when a character:", ["leaves the stage", "speaks to the audience unheard by others", "sings", "fights"], 1, "An aside is spoken to the audience, unheard by other characters."],
    [5, "mastery", "Context means:", ["the plot only", "the historical and social background", "the cast list", "the rhyme scheme"], 1, "Context is the background that shaped and surrounds the text."],
  ],

  // ── Science ──
  sci_cells: [
    [1, "diagnostic", "Which part controls what enters and leaves an animal cell?", ["Nucleus", "Cell membrane", "Cytoplasm", "Mitochondria"], 1, "The cell membrane controls movement of substances in and out."],
    [2, "practice", "Where is genetic material found in a cell?", ["Cytoplasm", "Nucleus", "Membrane", "Ribosome"], 1, "The nucleus contains the DNA (genetic material)."],
    [2, "practice", "Which structure do plant cells have that animal cells do NOT?", ["Nucleus", "Cell wall", "Membrane", "Cytoplasm"], 1, "Plant cells have a rigid cell wall for support."],
    [3, "mastery", "Mitochondria are the site of:", ["photosynthesis", "respiration", "digestion", "excretion"], 1, "Aerobic respiration releases energy in the mitochondria."],
    [4, "mastery", "During which process do cells produce ATP using oxygen?", ["Photosynthesis", "Aerobic respiration", "Fermentation", "Osmosis"], 1, "Aerobic respiration uses oxygen to release energy as ATP."],
  ],
  sci_body: [
    [2, "diagnostic", "Which organ pumps blood around the body?", ["Lungs", "Liver", "Heart", "Kidney"], 2, "The heart pumps blood through the circulatory system."],
    [3, "practice", "Where does gas exchange happen in the lungs?", ["Trachea", "Alveoli", "Bronchi", "Diaphragm"], 1, "Alveoli are tiny air sacs where oxygen and CO₂ are exchanged."],
    [3, "mastery", "Which blood vessel carries blood away from the heart?", ["Vein", "Artery", "Capillary", "Valve"], 1, "Arteries carry blood away from the heart."],
    [4, "mastery", "Which enzyme breaks down starch?", ["Protease", "Amylase", "Lipase", "Catalase"], 1, "Amylase digests starch into sugars."],
  ],
  sci_states: [
    [1, "diagnostic", "What is the process of a liquid turning into a gas called?", ["Condensation", "Evaporation", "Freezing", "Sublimation"], 1, "Evaporation is liquid → gas."],
    [1, "practice", "Particles in a solid are:", ["far apart and fast", "closely packed in a fixed pattern", "randomly spread out", "non-existent"], 1, "Solid particles are tightly packed and vibrate in fixed positions."],
    [2, "mastery", "Gas turning straight to solid is called:", ["melting", "deposition", "boiling", "condensation"], 1, "Deposition is gas → solid without becoming liquid."],
    [2, "mastery", "What happens to particles when a solid is heated and melts?", ["They gain energy and move more", "They stop moving", "They disappear", "They get smaller"], 0, "Heating gives particles energy so they move more and break their fixed positions."],
  ],
  sci_atoms: [
    [3, "diagnostic", "What is the chemical symbol for sodium?", ["So", "Sd", "Na", "S"], 2, "Sodium's symbol is Na (from Latin 'natrium')."],
    [3, "practice", "The centre of an atom is called the:", ["electron", "nucleus", "shell", "ion"], 1, "The nucleus contains protons and neutrons."],
    [4, "mastery", "Which particle has a negative charge?", ["Proton", "Neutron", "Electron", "Nucleus"], 2, "Electrons carry a negative charge."],
    [4, "mastery", "The rows of the periodic table are called:", ["groups", "periods", "shells", "blocks"], 1, "Horizontal rows are periods; vertical columns are groups."],
  ],
  sci_reactions: [
    [4, "diagnostic", "What gas is produced when an acid reacts with a metal?", ["Oxygen", "Hydrogen", "Carbon dioxide", "Nitrogen"], 1, "Acid + metal → salt + hydrogen."],
    [4, "practice", "The pH of a neutral solution is:", ["0", "7", "14", "1"], 1, "Neutral solutions, like pure water, have pH 7."],
    [5, "mastery", "An acid reacts with a base to produce a salt and:", ["hydrogen", "water", "oxygen", "carbon"], 1, "Neutralisation: acid + base → salt + water."],
    [5, "mastery", "What does a catalyst do in a reaction?", ["Slows it down", "Speeds it up without being used up", "Stops it", "Changes the product"], 1, "A catalyst speeds up a reaction and is not used up."],
  ],
  sci_forces: [
    [4, "diagnostic", "The unit of force is the:", ["watt", "newton", "joule", "ohm"], 1, "Force is measured in newtons (N)."],
    [4, "practice", "Speed is calculated as:", ["distance × time", "distance ÷ time", "time ÷ distance", "distance + time"], 1, "Speed = distance ÷ time."],
    [5, "mastery", "Newton's third law states forces come in:", ["single pushes", "equal and opposite pairs", "threes", "random sizes"], 1, "Every action has an equal and opposite reaction."],
    [5, "mastery", "An object with balanced forces will:", ["accelerate", "stay at constant velocity or rest", "always stop", "speed up"], 1, "Balanced forces mean no change in motion."],
  ],
  sci_energy: [
    [3, "diagnostic", "Energy cannot be created or destroyed, only:", ["lost", "transferred", "made", "deleted"], 1, "The conservation of energy: it is transferred between stores."],
    [4, "practice", "A moving car mainly has which energy store?", ["thermal", "kinetic", "chemical", "nuclear"], 1, "Movement is kinetic energy."],
    [4, "mastery", "A stretched spring stores which type of energy?", ["kinetic", "elastic potential", "thermal", "sound"], 1, "A stretched or compressed spring stores elastic potential energy."],
    [5, "mastery", "The unit of energy is the:", ["newton", "joule", "watt", "volt"], 1, "Energy is measured in joules (J)."],
  ],
  sci_electricity: [
    [4, "diagnostic", "What is the unit of electrical resistance?", ["Volt", "Ampere", "Ohm", "Watt"], 2, "Resistance is measured in ohms (Ω)."],
    [4, "practice", "Current is measured in:", ["volts", "amperes", "ohms", "joules"], 1, "Current is measured in amperes (amps, A)."],
    [5, "mastery", "In a series circuit, the current is:", ["different everywhere", "the same everywhere", "zero", "doubled each component"], 1, "Current is the same at every point in a series circuit."],
    [5, "mastery", "V = I × R. If I = 2 A and R = 3 Ω, V = ?", ["1.5 V", "5 V", "6 V", "0.67 V"], 2, "V = 2 × 3 = 6 volts."],
  ],
  sci_genetics: [
    [5, "diagnostic", "DNA is found in the cell's:", ["membrane", "nucleus", "cytoplasm", "wall"], 1, "Chromosomes made of DNA are in the nucleus."],
    [5, "practice", "A section of DNA that codes for a characteristic is a:", ["cell", "gene", "protein", "ribosome"], 1, "A gene is a length of DNA coding for a trait."],
    [5, "mastery", "Humans have how many pairs of chromosomes?", ["23", "46", "12", "20"], 0, "Humans have 23 pairs (46 chromosomes total)."],
    [5, "mastery", "Differences between individuals of a species are called:", ["mutation only", "variation", "evolution", "inheritance"], 1, "Variation describes differences within a species."],
  ],
  sci_ecology: [
    [3, "diagnostic", "In a food chain, the arrow points in the direction of:", ["who is eaten", "energy flow", "time", "size"], 1, "Arrows show energy flowing from prey to predator."],
    [3, "practice", "Plants that make their own food are called:", ["consumers", "producers", "predators", "decomposers"], 1, "Producers make food by photosynthesis."],
    [4, "mastery", "Organisms that break down dead material are:", ["producers", "decomposers", "herbivores", "carnivores"], 1, "Decomposers (e.g. bacteria, fungi) recycle nutrients."],
    [4, "mastery", "Which gas do plants remove from the air during photosynthesis?", ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], 1, "Plants take in carbon dioxide and release oxygen."],
  ],
};

// ════════════════════════════════════════════════════════════
//  MISCONCEPTION HINTS (Wave 7, Phase 3 — specific feedback)
//  Per-option, human-authored lines keyed by `${topic_tag}::${prompt}`.
//  Each array is index-aligned with the question's `options`; the WRONG
//  option's slot names the likely mistake warmly ("looks like you…"), and the
//  correct slot is left as "" (ignored at render time). These are the cheap,
//  deterministic layer that replaces a generic "try again" — AI never writes
//  them. Sparse/empty entries simply fall back to the adaptive feedback line.
// ════════════════════════════════════════════════════════════

const MISCONCEPTIONS_BY_PROMPT: Record<string, string[]> = {
  // ── Maths ──
  "maths_number::Round 486 to the nearest 100.": [
    "Looks like you rounded down — but 486 is past halfway (450), so it rounds up to 500.",
    "That's 486 to the nearest ten. We want the nearest hundred, so check the tens digit instead.",
    "",
    "Nearly! That's the nearest ten. For the nearest hundred, look at whether the tens digit reaches 50.",
  ],
  "maths_number::Estimate 39 × 21 by rounding.": [
    "Looks like you rounded 39 down to 30. It's closer to 40 — round it up.",
    "",
    "A little high — round 21 down to 20, not up. Then 40 × 20.",
    "Looks like you used 40 × 10. Round 21 to 20, not to 10.",
  ],
  "maths_fractions::What is 20% of 150?": [
    "Looks like that's a rough guess — find 10% first (15), then double it for 20%.",
    "",
    "That's 10% of 150. We want 20%, so double it.",
    "Close — but find 10% (15) and double it to get 20%.",
  ],
  "maths_fractions::Increase £80 by 15%.": [
    "",
    "Looks like you added a bit too much — 15% of 80 is £12, so the total is £92.",
    "Looks like you only added 10% (£8). We need 15%, which is £12.",
    "Looks like you added 12.5%. 15% of 80 is £12, giving £92.",
  ],
  "maths_algebra_linear::Solve 3x + 7 = 22.": [
    "Looks like a slip in the subtraction — 22 − 7 is 15, then 15 ÷ 3 = 5.",
    "",
    "Looks like you divided before subtracting the 7. Take 7 off first, then ÷ 3.",
    "Looks like you stopped at 3x = 15. One more step: divide by 3 to get x = 5.",
  ],
  "maths_algebra_linear::Expand 2(x + 3).": [
    "Looks like only the x was multiplied. The 2 multiplies BOTH terms, so 3 becomes 6 too.",
    "",
    "Looks like the 2 was dropped from the x. Multiply each term inside by 2.",
    "Close — multiply the 3 by 2 as well: 2 × 3 = 6, not 5.",
  ],
  // ── English ──
  "eng_spelling::Choose the correct spelling.": [
    "A common slip! Remember there's 'a rat' in the middle: sep-a-rat-e.",
    "Not quite — say it in chunks: sep-a-rat-e.",
    "",
    "Close — the start is 'sep', not 'sap': sep-a-rat-e.",
  ],
  "eng_grammar::Which sentence uses the past tense correctly?": [
    "Looks like a regular '-ed' ending — but 'go' is irregular: it becomes 'went'.",
    "",
    "'Gone' needs a helper word (have gone). On its own, the past tense is 'went'.",
    "That's the present continuous. The simple past of 'go' is 'went'.",
  ],
  // ── Science ──
  "sci_cells::Where is genetic material found in a cell?": [
    "The cytoplasm is where reactions happen — the DNA is kept in the nucleus.",
    "",
    "The membrane is the cell's gatekeeper — the genetic material sits in the nucleus.",
    "Ribosomes build proteins. The genetic instructions are stored in the nucleus.",
  ],
  "sci_forces::Speed is calculated as:": [
    "Looks like the operation is flipped — speed is distance ÷ time, not multiplied.",
    "",
    "That's time ÷ distance, which is upside down. Speed = distance ÷ time.",
    "Looks like a mix-up — we divide distance by time, not add them.",
  ],
};

const GENERATED_QUESTIONS: SeedQuestion[] = Object.entries(
  QUESTIONS_BY_TOPIC,
).flatMap(([topicTag, tuples]) => {
  const topic = SEED_TOPICS.find((t) => t.topic_tag === topicTag);
  if (!topic) throw new Error(`Seed question references unknown topic: ${topicTag}`);
  return tuples.map(
    ([tier, kind, prompt, options, correct_index, explanation]): SeedQuestion => {
      const misconceptions = MISCONCEPTIONS_BY_PROMPT[`${topicTag}::${prompt}`];
      return {
        topic_tag: topicTag,
        subject: topic.subject,
        tier,
        key_stage: 4, // existing bank is GCSE; backfilled so legacy rows are explicit
        kind,
        prompt,
        options,
        correct_index,
        explanation,
        ...(misconceptions ? { misconceptions } : {}),
      };
    },
  );
});

// ════════════════════════════════════════════════════════════
//  F7 — Exam-style, command-word question pack
//  Human-authored (Scout 2026-08-08, owner-approved via the DECISION line),
//  spec-mapped and transcribed verbatim. Real GCSE papers use command words
//  ("work out", "calculate", "name") and multi-step reasoning; the recall-MCQ
//  bank never rehearses that phrasing. Each item has exactly one defensible
//  answer, is fully computable, and renders through the existing mcq +
//  misconception path (no engine change). Natural key = topic_tag + prompt, all
//  prompts new, so seeding is a clean insert.
// ════════════════════════════════════════════════════════════

const EXAM_STYLE_QUESTIONS: SeedQuestion[] = [
  // Edexcel 1MA1 R9/N12 — reverse percentage.
  {
    topic_tag: "maths_fractions",
    subject: "mathematics",
    tier: 4,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "In a sale, a coat is reduced by 20% to £60. Work out the original price before the sale.",
    options: ["£72", "£75", "£48", "£80"],
    correct_index: 1,
    explanation:
      "£60 is 80% of the original price (100% minus 20%), so 1% is £60 divided by 80, which is £0.75, and 100% is £75.",
    hints: [
      "The £60 sale price is not 100% of the original: it is 100% minus 20%, so 80%.",
      "Find 1% by dividing £60 by 80, then multiply by 100.",
    ],
    misconceptions: [
      "Looks like you added 20% back onto £60. A reverse percentage divides, it does not add the same percent back.",
      "",
      "That takes 20% off £60, but £60 is already the reduced price, so work backwards instead.",
      "Close, but £60 divided by 0.8 is £75, not £80.",
    ],
  },
  // Edexcel 1MA1 R1/N — proportion (recipe scaling).
  {
    topic_tag: "maths_ratio",
    subject: "mathematics",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "A recipe for 4 people needs 240 g of rice. Work out how much rice is needed for 10 people.",
    options: ["500 g", "600 g", "540 g", "960 g"],
    correct_index: 1,
    explanation:
      "240 g divided by 4 is 60 g per person. For 10 people: 60 times 10 is 600 g.",
    hints: [
      "First find the amount for one person by dividing 240 by 4.",
      "Then multiply the one-person amount by 10.",
    ],
    misconceptions: [
      "Looks like an estimate. Find the exact per-person amount (60 g) first.",
      "",
      "Looks like you added 300 g for 5 extra people. Scale by multiplying, not adding.",
      "That is the amount for 16 people (240 times 4). We need 10 people, so 60 times 10.",
    ],
  },
  // Edexcel 1MA1 N9 — standard form arithmetic.
  {
    topic_tag: "maths_number",
    subject: "mathematics",
    tier: 4,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "Work out (3 × 10⁴) × (2 × 10³). Give your answer in standard form.",
    options: ["6 × 10⁷", "6 × 10¹²", "5 × 10⁷", "6 × 10⁵"],
    correct_index: 0,
    explanation:
      "Multiply the front numbers: 3 times 2 is 6. Add the powers of 10: 4 plus 3 is 7. So the answer is 6 × 10⁷.",
    hints: [
      "Multiply the front numbers, then handle the powers of 10 separately.",
      "When multiplying powers of 10, add the indices: 10⁴ times 10³ is 10⁷.",
    ],
    misconceptions: [
      "",
      "Looks like you multiplied the powers (4 times 3). When multiplying, add the indices instead.",
      "Looks like you added 3 plus 2 for the front number. Multiply them: 3 times 2 is 6.",
      "The front number is right, but 4 plus 3 is 7, not 5.",
    ],
  },
  // AQA 8464 Physics 4.5 — speed = distance / time.
  {
    topic_tag: "sci_forces",
    subject: "science",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt: "A car travels 150 m in 10 s at a steady speed. Calculate its speed.",
    options: ["1500 m/s", "15 m/s", "160 m/s", "0.07 m/s"],
    correct_index: 1,
    explanation:
      "Speed equals distance divided by time: 150 divided by 10 is 15 m/s.",
    hints: ["Use speed = distance divided by time.", "Divide 150 by 10."],
    misconceptions: [
      "Looks like you multiplied distance by time. Speed divides distance by time.",
      "",
      "Looks like you added distance and time. Use division: 150 divided by 10.",
      "Looks like you divided time by distance. It is distance divided by time, so 150 divided by 10.",
    ],
  },
  // AQA 8464 Chemistry 5.4 — neutralisation products.
  {
    topic_tag: "sci_reactions",
    subject: "science",
    tier: 4,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "Hydrochloric acid reacts with sodium hydroxide solution. Name the TWO products of this neutralisation.",
    options: [
      "Sodium chloride and water",
      "Hydrogen and water",
      "Sodium chloride and hydrogen",
      "Carbon dioxide and water",
    ],
    correct_index: 0,
    explanation:
      "Neutralisation follows acid plus alkali makes salt plus water. Hydrochloric acid plus sodium hydroxide makes sodium chloride plus water.",
    hints: [
      "Acid plus alkali always makes a salt plus water.",
      "The salt made from hydrochloric acid is a chloride.",
    ],
    misconceptions: [
      "",
      "Hydrogen forms when an acid reacts with a metal, not with an alkali. An alkali gives a salt plus water.",
      "The salt is right, but neutralisation makes water, not hydrogen.",
      "Carbon dioxide forms with an acid plus a carbonate. This is acid plus alkali, so salt plus water.",
    ],
  },
  // AQA 8700 Paper 1 Q2 — identify language technique and effect.
  {
    topic_tag: "eng_devices",
    subject: "english",
    tier: 4,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "'The waves clawed hungrily at the shore.' Which technique does the writer use, and what is its main effect?",
    options: [
      "Personification, making the sea feel threatening",
      "Simile, comparing the waves to claws using 'like'",
      "Alliteration, creating a soft, calm sound",
      "A rhetorical question that engages the reader",
    ],
    correct_index: 0,
    explanation:
      "Giving the waves the living action 'clawed hungrily' is personification, and it makes the sea feel alive and threatening.",
    hints: [
      "There is no 'like' or 'as', so it is not a simile.",
      "A non-living thing is given an aggressive, living action: what is that technique called?",
    ],
    misconceptions: [
      "",
      "A simile needs 'like' or 'as', and this sentence has neither.",
      "There is no repeated initial sound, and the effect is menacing, not calm.",
      "No question is being asked: look at how the waves are described.",
    ],
  },
  // ── F1 (2026-08-09): 5 authored command-word items for topics that had none ──
  // Edexcel 1MA1 A17 — solve a linear equation ("Solve").
  {
    topic_tag: "maths_algebra_linear",
    subject: "mathematics",
    tier: 4,
    key_stage: 4,
    kind: "mastery",
    prompt: "Solve 4x + 5 = 29.",
    options: ["x = 6", "x = 8.5", "x = 24", "x = 34"],
    correct_index: 0,
    explanation: "Subtract 5 from both sides: 4x = 24. Divide both sides by 4: x = 6.",
    hints: [
      "Subtract 5 from both sides first.",
      "Then divide both sides by 4: 24 divided by 4.",
    ],
    misconceptions: [
      "",
      "Looks like you added 5 instead of subtracting: (29 + 5) ÷ 4. Subtract 5 first, then divide.",
      "Looks like you subtracted 5 but did not divide by 4. 24 ÷ 4 is 6.",
      "Looks like you added 5 and did not divide. Subtract 5, then divide by 4.",
    ],
  },
  // Edexcel 1MA1 G20 — Pythagoras ("Calculate").
  {
    topic_tag: "maths_pythagoras",
    subject: "mathematics",
    tier: 5,
    key_stage: 4,
    kind: "mastery",
    prompt: "A right-angled triangle has its two shorter sides 6 cm and 8 cm. Calculate the length of the hypotenuse.",
    options: ["10 cm", "14 cm", "48 cm", "100 cm"],
    correct_index: 0,
    explanation: "By Pythagoras, the hypotenuse squared is 6² + 8² = 36 + 64 = 100. The square root of 100 is 10 cm.",
    hints: [
      "Square both shorter sides and add them: 6² + 8².",
      "Then take the square root of the total.",
    ],
    misconceptions: [
      "",
      "Looks like you added the two sides (6 + 8). Pythagoras squares them first: 6² + 8².",
      "Looks like you multiplied 6 × 8. Square each side and add, then square root.",
      "That is 6² + 8² before the square root. Take the square root of 100.",
    ],
  },
  // Edexcel 1MA1 P7 — single-event probability ("Work out").
  {
    topic_tag: "maths_statistics",
    subject: "mathematics",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt: "A bag has 3 red, 5 blue and 2 green counters. One counter is taken at random. Work out the probability that it is blue.",
    options: ["1/2", "1/5", "3/10", "5/3"],
    correct_index: 0,
    explanation: "There are 3 + 5 + 2 = 10 counters. 5 of them are blue, so the probability is 5/10, which simplifies to 1/2.",
    hints: [
      "Count the total number of counters first: 3 + 5 + 2.",
      "Probability is the number of blue over the total, then simplify.",
    ],
    misconceptions: [
      "",
      "Looks like the green count over the total (2/10). Blue is 5 out of 10.",
      "That is the probability of red (3 out of 10). Blue is 5 out of 10.",
      "That compares blue to green, not blue to the whole bag. Use blue over the total of 10.",
    ],
  },
  // AQA 8464 Physics 4.2.1 — V = I × R ("Calculate").
  {
    topic_tag: "sci_electricity",
    subject: "science",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt: "A current of 2 A flows through a resistor of 5 Ω. Calculate the potential difference across the resistor.",
    options: ["10 V", "2.5 V", "7 V", "0.4 V"],
    correct_index: 0,
    explanation: "Using V = I × R: potential difference = 2 A × 5 Ω = 10 V.",
    hints: [
      "Use the equation potential difference = current × resistance (V = I × R).",
      "Multiply 2 A by 5 Ω.",
    ],
    misconceptions: [
      "",
      "Looks like you divided 5 by 2. Potential difference is current times resistance: 2 × 5.",
      "Looks like you added 2 and 5. Use V = I × R, so multiply.",
      "Looks like you divided current by resistance. V = I × R, so 2 × 5.",
    ],
  },
  // AQA 8700 Paper 1 Q3-style — effect of a simile ("Explain").
  {
    topic_tag: "eng_analysis",
    subject: "english",
    tier: 4,
    key_stage: 4,
    kind: "mastery",
    prompt: "'The old house sagged, its windows like tired eyes.' Explain the main effect of the simile 'like tired eyes'.",
    options: [
      "It makes the house feel weary and neglected",
      "It shows the house is brand new",
      "It creates a fast, exciting pace",
      "It just lists factual details about the windows",
    ],
    correct_index: 0,
    explanation: "The simile compares the windows to 'tired eyes', which — with 'old' and 'sagged' — makes the house feel worn out, weary and neglected.",
    hints: [
      "'Tired eyes' compares the windows to something weary — what mood does that create?",
      "Link the words 'old', 'sagged' and 'tired' to how the house feels.",
    ],
    misconceptions: [
      "",
      "A sagging house with 'tired' eyes suggests age and neglect, not newness.",
      "A simile about tiredness slows the mood; it does not speed the pace.",
      "'Like tired eyes' is a comparison for effect, not a factual list.",
    ],
  },
  // ── F3 (2026-08-11): 3 command-word Maths items for uncovered topics ──
  // Edexcel 1MA1 A23 — nth term of a linear sequence ("Work out an expression").
  {
    topic_tag: "maths_sequences",
    subject: "mathematics",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt: "Work out an expression for the nth term of the sequence 5, 8, 11, 14, …",
    options: ["3n + 2", "3n + 5", "5n + 3", "n + 3"],
    correct_index: 0,
    explanation:
      "The terms go up by 3 each time, so the expression starts with 3n. When n = 1, 3n = 3, but the first term is 5, so add 2: the nth term is 3n + 2.",
    hints: [
      "Find the common difference between the terms — that becomes the number in front of n.",
      "The sequence goes up by 3, so it starts 3n; then choose the constant so that n = 1 gives 5.",
    ],
    misconceptions: [
      "",
      "You used the first term (5) as the constant. The constant is first term minus the common difference: 5 − 3 = 2.",
      "You put the first term in front of n. The number in front of n is the common difference (3), not the first term.",
      "Going up by 3 each time means the coefficient of n is 3, giving 3n, not n.",
    ],
  },
  // Edexcel 1MA1 G3 — interior angle of a regular polygon ("Calculate").
  {
    topic_tag: "maths_geometry",
    subject: "mathematics",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt: "Calculate the size of each interior angle of a regular hexagon.",
    options: ["120°", "108°", "135°", "720°"],
    correct_index: 0,
    explanation:
      "The interior angles of a hexagon add to (6 − 2) × 180 = 720°. A regular hexagon has 6 equal angles, so each is 720 ÷ 6 = 120°.",
    hints: [
      "Sum of interior angles = (number of sides − 2) × 180.",
      "For a regular polygon, divide the total by the number of sides.",
    ],
    misconceptions: [
      "",
      "108° is each interior angle of a regular pentagon (5 sides), not a hexagon.",
      "135° is each interior angle of a regular octagon (8 sides).",
      "720° is the total of all the interior angles. Divide by 6 to get one angle.",
    ],
  },
  // Edexcel 1MA1 A10 — gradient of a line through two points ("Work out").
  {
    topic_tag: "maths_graphs",
    subject: "mathematics",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt: "A straight line passes through the points (0, 1) and (2, 7). Work out the gradient of the line.",
    options: ["3", "1/3", "4", "6"],
    correct_index: 0,
    explanation:
      "Gradient = change in y ÷ change in x = (7 − 1) ÷ (2 − 0) = 6 ÷ 2 = 3.",
    hints: [
      "Gradient = (difference in y) ÷ (difference in x).",
      "The y values change by 6 while the x values change by 2.",
    ],
    misconceptions: [
      "",
      "You divided the x-change by the y-change. Gradient is y-change over x-change: 6 ÷ 2.",
      "You found the change in x plus something. Use rise ÷ run = 6 ÷ 2 = 3.",
      "6 is the change in y only. Divide it by the change in x (2) to get the gradient.",
    ],
  },
  // ── F4 (2026-08-11): 3 command-word Science + English items ──
  // AQA 8464 Physics 6.5.4 — acceleration from change in velocity ("Calculate").
  {
    topic_tag: "sci_forces",
    subject: "science",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt: "A car speeds up from 0 to 20 m/s in 4 seconds. Calculate its acceleration.",
    options: ["5 m/s²", "80 m/s²", "16 m/s²", "0.2 m/s²"],
    correct_index: 0,
    explanation:
      "Acceleration = change in velocity ÷ time = (20 − 0) ÷ 4 = 5 m/s².",
    hints: [
      "Acceleration = change in velocity ÷ time taken.",
      "The velocity changes by 20 m/s over 4 seconds.",
    ],
    misconceptions: [
      "",
      "You multiplied velocity by time (20 × 4). Acceleration divides the change in velocity by the time.",
      "You subtracted 4 from 20. Divide the change in velocity by the time instead.",
      "You divided time by velocity (4 ÷ 20). Divide the change in velocity by the time: 20 ÷ 4.",
    ],
  },
  // AQA 8464 Chemistry 5.3.1 — relative formula mass ("Calculate the Mr").
  {
    topic_tag: "sci_reactions",
    subject: "science",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt: "Calculate the relative formula mass (Mr) of water, H₂O. (Relative atomic masses: H = 1, O = 16.)",
    options: ["18", "17", "34", "9"],
    correct_index: 0,
    explanation:
      "Water has two hydrogen atoms and one oxygen atom: (2 × 1) + 16 = 2 + 16 = 18.",
    hints: [
      "Add the relative atomic mass of every atom in the formula.",
      "There are TWO hydrogen atoms (H₂) and one oxygen atom.",
    ],
    misconceptions: [
      "",
      "You counted only one hydrogen. H₂ means two hydrogen atoms: (2 × 1) + 16 = 18.",
      "You doubled the whole thing. Only the hydrogen is doubled: (2 × 1) + 16 = 18.",
      "You added 1 + 16 then halved, or used only part of the formula. Use (2 × 1) + 16 = 18.",
    ],
  },
  // AQA 8700 Paper 1 — analysing the effect of a metaphor ("Explain what it suggests").
  {
    topic_tag: "eng_analysis",
    subject: "english",
    tier: 4,
    key_stage: 4,
    kind: "mastery",
    prompt: "A writer describes a schoolroom with the metaphor: 'The classroom was a prison.' What does this most strongly suggest about how the narrator feels?",
    options: [
      "Trapped and unhappy in the room",
      "Safe and comforted by the room",
      "Excited and eager to learn",
      "Proud of how tidy the room is",
    ],
    correct_index: 0,
    explanation:
      "A prison is a place where people are locked in against their will, so comparing the classroom to a prison suggests the narrator feels trapped and unhappy there.",
    hints: [
      "Think about what a prison is like and how someone inside one would feel.",
      "A metaphor carries the feelings of the thing it compares to — what feelings come with 'prison'?",
    ],
    misconceptions: [
      "",
      "A prison is not safe or comforting; it suggests being trapped, so the feeling is negative.",
      "'Prison' is a negative image — it points to reluctance, not excitement.",
      "The metaphor is about how the narrator feels, not about how tidy the room is.",
    ],
  },
  // AQA 8464 Biology 4.1.1.5 — microscopy magnification ("Calculate the magnification").
  {
    topic_tag: "sci_cells",
    subject: "science",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "A cell has a real width of 0.05 mm. Under a microscope its image measures 10 mm across. Calculate the magnification.",
    options: ["×200", "×20", "×0.005", "×10"],
    correct_index: 0,
    explanation:
      "Magnification = size of image ÷ size of real object = 10 mm ÷ 0.05 mm = 200. Both lengths are in the same unit, so the magnification has no units and is written ×200.",
    hints: [
      "Use the equation magnification = size of image ÷ size of real object.",
      "Divide 10 mm by 0.05 mm, keeping both lengths in the same unit.",
    ],
    misconceptions: [
      "",
      "Looks like you divided 10 by 0.5. The real width is 0.05 mm, so divide 10 by 0.05.",
      "That is the real size ÷ the image size (0.05 ÷ 10). Magnification is image ÷ real, so 10 ÷ 0.05.",
      "That is only the image size in mm. Divide the image size by the real size to get the magnification.",
    ],
  },
  // AQA 8464 Biology 4.2.2.2 — artery structure ("Explain why arteries have thick walls").
  {
    topic_tag: "sci_body",
    subject: "science",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "Explain why arteries have thick, muscular and elastic walls.",
    options: [
      "To withstand the high pressure of blood pumped from the heart",
      "To store the body's supply of oxygen",
      "To slow the blood down for gas exchange with cells",
      "To stop blood flowing backwards using valves",
    ],
    correct_index: 0,
    explanation:
      "Arteries carry blood away from the heart at high pressure, so their walls are thick, muscular and elastic to withstand and keep up that pressure without bursting.",
    hints: [
      "Think about how hard the heart pushes blood into the arteries.",
      "Arteries carry blood away from the heart, so what does that mean for the pressure inside them?",
    ],
    misconceptions: [
      "",
      "Arteries carry oxygen-rich blood but do not store oxygen; the thick walls are about coping with pressure.",
      "Blood is slowed for gas exchange in the capillaries, not the arteries.",
      "Valves that prevent backflow are found in veins, where the pressure is low.",
    ],
  },
  // ── F1 (2026-08-18): sci_atoms neutrons calculation ("Calculate") ──
  // AQA 8464 Chemistry 4.1.1.2 — neutrons = mass number − atomic number.
  {
    topic_tag: "sci_atoms",
    subject: "science",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "A fluorine atom has an atomic number of 9 and a mass number of 19. Calculate the number of neutrons in this atom.",
    options: ["10", "9", "19", "28"],
    correct_index: 0,
    explanation:
      "The mass number 19 counts protons plus neutrons, and the atomic number 9 is the number of protons. Neutrons equals mass number minus atomic number, so 19 minus 9 is 10.",
    hints: [
      "The atomic number tells you the protons; the mass number counts protons and neutrons together.",
      "Subtract the atomic number from the mass number: 19 minus 9.",
    ],
    misconceptions: [
      "",
      "9 is the number of protons (the atomic number), not the neutrons. Take it away from the mass number instead.",
      "19 is the mass number, which counts protons and neutrons together. Subtract the 9 protons to get the neutrons.",
      "Looks like you added 19 and 9. Neutrons come from subtracting: 19 minus 9.",
    ],
  },
  // ── F2 (2026-08-18): sci_energy kinetic energy calculation ("Calculate") ──
  // AQA 8464 Physics 4.1.1.2, Ek = ½mv².
  {
    topic_tag: "sci_energy",
    subject: "science",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "A ball of mass 2 kg moves at a speed of 3 m/s. Using kinetic energy = a half times mass times speed squared, calculate its kinetic energy.",
    options: ["9 J", "6 J", "18 J", "3 J"],
    correct_index: 0,
    explanation:
      "Kinetic energy is a half times mass times speed squared. Speed squared is 3 times 3, which is 9. So a half times 2 times 9 is 9 joules.",
    hints: [
      "Square the speed first: 3 times 3.",
      "Then multiply by the mass and by a half: a half times 2 times 9.",
    ],
    misconceptions: [
      "",
      "6 is 2 times 3 on its own. You still need to square the speed and take a half: a half times 2 times 9.",
      "18 is 2 times 9, but the equation also has a half: a half times 2 times 9 is 9.",
      "3 is a half times 2 times 3, but the speed must be squared first: 3 times 3 is 9.",
    ],
  },
  // ── F3 (2026-08-18): eng_comprehension retrieval item ──
  // AQA 8700 Paper 1 Section A, Q1 style — retrieve explicit information.
  {
    topic_tag: "eng_comprehension",
    subject: "english",
    tier: 2,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "Read this sentence from a story: 'The old lighthouse stood alone on the rocky cliff, its white paint peeling in the salty wind.' Which detail about the lighthouse is actually stated in the text?",
    options: [
      "Its white paint was peeling",
      "It had a bright lamp",
      "It was newly built",
      "It stood beside a forest",
    ],
    correct_index: 0,
    explanation:
      "The sentence directly says the lighthouse's white paint was peeling. The other options are never stated, so only the peeling paint can be retrieved from the text.",
    hints: [
      "Look only for what the words actually say, not what you picture in your head.",
      "Find the part of the sentence that describes the paint.",
    ],
    misconceptions: [
      "",
      "The text does not mention a lamp. Choose only what the words actually state.",
      "The lighthouse is described as old, not newly built. Read the exact wording.",
      "It stands on a rocky cliff, not beside a forest. Match the detail to the text.",
    ],
  },
  // ── F4 (2026-08-18): eng_persuasive "identify the technique" item ──
  // AQA 8700 Paper 2 Section B style.
  {
    topic_tag: "eng_persuasive",
    subject: "english",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "'Imagine a town where every child walks safely to school.' Which persuasive technique does the writer use to draw the reader in?",
    options: [
      "A direct appeal to the reader's imagination",
      "A statistic",
      "A rhetorical question",
      "A counter-argument",
    ],
    correct_index: 0,
    explanation:
      "The word 'Imagine' is a direct instruction asking the reader to picture a scene, which is a direct appeal to the imagination. There are no numbers, so it is not a statistic; it is a command, not a question; and it raises no opposing view, so it is not a counter-argument.",
    hints: [
      "Look at the first word: what is it asking the reader to do?",
      "The writer invites you to picture something, rather than giving numbers or asking a question.",
    ],
    misconceptions: [
      "",
      "There are no numbers or data here, so it is not a statistic. The writer asks you to picture a scene.",
      "This is a command ('Imagine'), not a question, so it is not a rhetorical question.",
      "The writer does not raise an opposing viewpoint, so there is no counter-argument here.",
    ],
  },
  // ── F9 (2026-08-18): sci_states "Calculate the density" item ──
  // AQA 8464 Physics 4.5.1, density = mass / volume.
  {
    topic_tag: "sci_states",
    subject: "science",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "A block of metal has a mass of 54 g and a volume of 20 cm3. Calculate its density using density = mass divided by volume.",
    options: ["2.7 g/cm3", "34 g/cm3", "1080 g/cm3", "0.37 g/cm3"],
    correct_index: 0,
    explanation:
      "Density equals mass divided by volume. 54 divided by 20 is 2.7, so the density is 2.7 g/cm3.",
    hints: [
      "Density is mass divided by volume, not mass minus volume.",
      "Divide 54 by 20.",
    ],
    misconceptions: [
      "",
      "34 is 54 minus 20, but density comes from dividing, not subtracting.",
      "1080 is 54 times 20, but density comes from dividing mass by volume, not multiplying.",
      "0.37 flips the calculation round: that is volume divided by mass. Density is mass divided by volume, 54 divided by 20.",
    ],
  },
  // ── F10 (2026-08-18): eng_grammar subject-verb agreement item ──
  // AQA 8700 AO6 technical accuracy, "neither" as a singular subject.
  {
    topic_tag: "eng_grammar",
    subject: "english",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt: "Identify the sentence that uses correct subject-verb agreement.",
    options: [
      "Neither of the students have finished their essay.",
      "Neither of the students has finished their essay.",
      "Neither of the students finish their essay.",
      "Neither of the students finishing their essay.",
    ],
    correct_index: 1,
    explanation:
      "'Neither' is a singular subject, so it needs the singular verb 'has', not the plural 'have'. 'Neither of the students has finished' is grammatically correct.",
    hints: [
      "Look at the subject 'neither': is it singular or plural on its own?",
      "A singular subject like 'neither' pairs with 'has', not 'have'.",
    ],
    misconceptions: [
      "The plural word 'students' after 'of' can trick you, but 'neither' itself is singular, so it needs 'has' not 'have'.",
      "",
      "'Finish' alone is not a complete verb form here; the sentence needs 'has finished' to show the action is complete.",
      "'Finishing' alone, with no helping verb like 'is' or 'has been', leaves the sentence without a proper main verb.",
    ],
  },
  // Edexcel 1MA1 A18 — factorising quadratic with a mixed-sign trap ("Solve").
  {
    topic_tag: "maths_quadratics",
    subject: "mathematics",
    tier: 5,
    key_stage: 4,
    kind: "mastery",
    prompt: "Solve x² + 2x − 15 = 0.",
    options: [
      "x = −5 or x = 3",
      "x = 5 or x = −3",
      "x = 3 or x = 5",
      "x = −5 or x = −3",
    ],
    correct_index: 0,
    explanation:
      "Find two numbers that multiply to −15 and add to +2: those are +5 and −3. So x² + 2x − 15 = (x + 5)(x − 3) = 0, giving x = −5 or x = 3.",
    hints: [
      "Find two numbers that multiply to −15 and add to +2.",
      "Set each bracket equal to 0: x + 5 = 0 and x − 3 = 0.",
    ],
    misconceptions: [
      "",
      "Check the signs: the brackets are (x + 5)(x − 3), so the roots are −5 and 3, not 5 and −3.",
      "Each root has the opposite sign to the number in its bracket: (x + 5) gives −5, (x − 3) gives +3.",
      "The +2x means the two numbers add to +2, so one must be positive: +5 and −3.",
    ],
  },
  // ── F1 (2026-08-19): sci_genetics Punnett-square probability item ──
  // AQA 8464 Biology 4.6.1.2/4.6.2, closing a zero-coverage topic.
  {
    topic_tag: "sci_genetics",
    subject: "science",
    tier: 4,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "In pea plants, tall (T) is dominant over short (t). Two heterozygous tall plants (Tt) are crossed. Calculate the probability that an offspring will be short.",
    options: ["1/4", "1/2", "3/4", "0"],
    correct_index: 0,
    explanation:
      "Crossing Tt with Tt gives offspring genotypes TT, Tt, Tt and tt in equal proportions. Only tt is short, and that is 1 out of the 4 combinations, so the probability is 1/4.",
    hints: [
      "Draw out all four combinations from crossing Tt with Tt: TT, Tt, Tt, tt.",
      "Only the tt combination is short. How many of the 4 combinations is that?",
    ],
    misconceptions: [
      "",
      "1/2 is the probability of an offspring being Tt (heterozygous tall), not short. Only tt is short.",
      "3/4 is the probability of an offspring being TALL (TT or Tt), which is the opposite of what's being asked.",
      "Tall is dominant, but that doesn't mean short can never appear — two Tt parents can still produce a tt (short) offspring, with probability 1/4.",
    ],
  },
  // ── F2 (2026-08-19): sci_ecology percentage energy transfer item ──
  // AQA 8464 Biology 4.7.3 trophic levels, closing a zero-coverage topic.
  {
    topic_tag: "sci_ecology",
    subject: "science",
    tier: 3,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "In a food chain, producers store 2000 kJ of energy. The primary consumers that eat them store 200 kJ. Calculate the percentage of energy transferred from producers to primary consumers.",
    options: ["10%", "90%", "0.1%", "20%"],
    correct_index: 0,
    explanation:
      "Percentage transferred is (energy received divided by energy available) times 100. That's 200 divided by 2000, times 100, which is 10%.",
    hints: [
      "Divide the energy the consumers stored by the energy the producers stored.",
      "200 divided by 2000 gives a fraction — multiply by 100 to turn it into a percentage.",
    ],
    misconceptions: [
      "",
      "90% is the energy that is LOST between the levels (100% minus 10%), not the energy that is transferred. The question asks for the energy transferred.",
      "200 divided by 2000 is correct as a fraction (0.1), but you still need to multiply by 100 to turn it into a percentage: 10%.",
      "Double-check the division: 200 divided by 2000, times 100, is 10%, not 20%.",
    ],
  },
  // ── F3 (2026-08-19): eng_punctuation apostrophe use item (it's vs its) ──
  // AQA 8700 AO6, closing a zero-coverage topic.
  {
    topic_tag: "eng_punctuation",
    subject: "english",
    tier: 2,
    key_stage: 4,
    kind: "mastery",
    prompt: "Identify the sentence that uses the apostrophe correctly.",
    options: [
      "Its a lovely day today.",
      "It's a lovely day today.",
      "The cat licked it's paw.",
      "The dog chased it,s tail.",
    ],
    correct_index: 1,
    explanation:
      "'It's' (with an apostrophe) is the contraction of 'it is' or 'it has'. Here the sentence means 'It is a lovely day today', so it needs the apostrophe: it's.",
    hints: [
      "Ask yourself: does the sentence mean 'it is' or 'it has'? If yes, use it's with an apostrophe.",
      "'Its' (no apostrophe) shows something belongs to it, like 'its paw' or 'its tail'.",
    ],
    misconceptions: [
      "'Its' with no apostrophe means belonging to it. This sentence means 'It is a lovely day', so it needs the apostrophe: it's.",
      "",
      "'It's' with an apostrophe means 'it is' or 'it has'. Here the sentence means the paw belongs to the cat, so no apostrophe is needed: its paw.",
      "An apostrophe never comes before an 's' like this just to show possession — 'its' (no apostrophe, no comma) is correct here.",
    ],
  },
  // ── F4 (2026-08-19): eng_spelling homophone item (their/there/they're) ──
  // AQA 8700 AO6, closing a zero-coverage topic.
  {
    topic_tag: "eng_spelling",
    subject: "english",
    tier: 1,
    key_stage: 4,
    kind: "mastery",
    prompt: "Identify the sentence that uses the correct word.",
    options: [
      "Their going to the shop later.",
      "They're going to the shop later.",
      "There going to the shop later.",
      "Theyre going to the shop later.",
    ],
    correct_index: 1,
    explanation:
      "'They're' is a contraction of 'they are'. 'Their' shows possession and 'there' refers to a place. Since the sentence means 'they are going', it needs the apostrophe: they're.",
    hints: [
      "Ask: does the sentence mean 'they are'? If so, use they're.",
      "'Their' shows something belongs to them; 'there' refers to a place.",
    ],
    misconceptions: [
      "'Their' shows possession (something belonging to them). This sentence means 'they are going', so it needs they're.",
      "",
      "'There' refers to a place, not a contraction of 'they are'. This sentence needs they're.",
      "This is missing the apostrophe. 'They're' (with an apostrophe) is the contraction of 'they are'.",
    ],
  },
  // ── F2 (2026-08-20): eng_poetry caesura item ──
  // AQA 8700 AO2, closing a zero-coverage topic.
  {
    topic_tag: "eng_poetry",
    subject: "english",
    tier: 5,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "A line of poetry is broken by a comma or full stop halfway through, for example: 'She waited. The room stayed silent.' This kind of mid-line pause is called a caesura. Explain its main effect here.",
    options: [
      "It creates a sudden pause that draws attention to what follows",
      "It speeds up the whole poem's rhythm",
      "It forces the poem to rhyme",
      "It removes all punctuation from the line",
    ],
    correct_index: 0,
    explanation:
      "A caesura is a deliberate pause inside a line, often shown by punctuation. It interrupts the rhythm, slowing the reader down and drawing extra attention to the words that follow the pause.",
    hints: [
      "Think about what happens to your reading speed when you hit a comma or full stop mid-line.",
      "A caesura is a PAUSE — what does a pause usually do to the reader's attention?",
    ],
    misconceptions: [
      "",
      "A pause slows a line down; it does not speed the rhythm up.",
      "A caesura is about rhythm and pause, not about making lines rhyme.",
      "A caesura is punctuation used deliberately mid-line, not the absence of punctuation.",
    ],
  },
  // ── F3 (2026-08-20): eng_shakespeare soliloquy item ──
  // AQA 8700 AO2, closing a zero-coverage topic.
  {
    topic_tag: "eng_shakespeare",
    subject: "english",
    tier: 5,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "In a play, a character sometimes speaks alone on stage, sharing their private thoughts directly with the audience. This is called a soliloquy. Explain why a playwright like Shakespeare uses one instead of dialogue.",
    options: [
      "To let a character share private thoughts directly with the audience",
      "To move the plot forward through conversation between characters",
      "To introduce a brand new character to the story",
      "To signal that the play has ended",
    ],
    correct_index: 0,
    explanation:
      "A soliloquy is spoken by a character alone, giving the audience direct access to their private thoughts and feelings in a way ordinary dialogue between characters cannot.",
    hints: [
      "Notice the character is ALONE on stage when they say it — who are they really talking to?",
      "Compare this to dialogue, which is spoken between two or more characters.",
    ],
    misconceptions: [
      "",
      "That describes dialogue between characters, not a soliloquy spoken alone.",
      "A soliloquy reveals an existing character's thoughts; it does not introduce someone new.",
      "A soliloquy can happen at any point in a play, not only at the end.",
    ],
  },
  // ── F4 (2026-08-20): eng_creative narrative viewpoint item ──
  // AQA 8700 AO5, closing the last zero-coverage EPIC 2 topic.
  {
    topic_tag: "eng_creative",
    subject: "english",
    tier: 4,
    key_stage: 4,
    kind: "mastery",
    prompt:
      "A story opens: 'I walked into the empty house and felt my chest tighten.' Identify the narrative viewpoint being used.",
    options: [
      "First person",
      "Second person",
      "Third person omniscient",
      "Third person limited",
    ],
    correct_index: 0,
    explanation:
      "The narrator uses 'I' throughout, telling the story from inside their own experience — this is first-person narrative viewpoint.",
    hints: [
      "Look at the pronoun the narrator uses to refer to themselves: 'I'.",
      "First person uses 'I/we', second person uses 'you', third person uses 'he/she/they'.",
    ],
    misconceptions: [
      "",
      "Second person would use 'you', not 'I'.",
      "Third person omniscient uses 'he/she/they' and knows every character's thoughts — this uses 'I'.",
      "Third person limited also uses 'he/she/they', following one character from outside — this uses 'I'.",
    ],
  },
];

/** Flattened question list ready to seed. */
export const SEED_QUESTIONS: SeedQuestion[] = [
  ...GENERATED_QUESTIONS,
  ...EXAM_STYLE_QUESTIONS,
];

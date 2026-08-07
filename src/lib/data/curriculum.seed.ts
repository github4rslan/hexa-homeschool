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

/** Flattened question list ready to seed. */
export const SEED_QUESTIONS: SeedQuestion[] = Object.entries(
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

/**
 * Age-banded curriculum — human-authored KS2 (ages 7–10) and KS3 (ages 11–13)
 * TOPICS plus their daily practice + mastery questions.
 *
 * Why this file exists: the original `curriculum.seed*.ts` bank is GCSE/KS4
 * content (and the few topics once tagged KS3 are reclassified to KS4 — their
 * working grades are GCSE bands and their questions are GCSE-level). Edway serves
 * ages 7–16, so the weekly plan and daily lessons need genuine KS2 and KS3
 * topics with in-band lesson questions. These fill those bands so a young child
 * works at their level, never on GCSE material.
 *
 * Authoring rules (identical to curriculum.seed.ts — Brief: "Honesty over
 * hype", zero wrong teaching):
 *  - HUMAN-AUTHORED. No model generated any of these — the engine only SELECTS.
 *  - Each `CurriculumTopicDoc` carries its band in `key_stage` (2 or 3) and a
 *    `working_grade_band` that reads as the stage in plain English ("Year 4").
 *  - Topic `order` is sequenced WITHIN the band (selection is band-filtered);
 *    values sit above the GCSE range so global helpers still default to GCSE.
 *  - Each topic has ≥3 `practice` and ≥3 `mastery` questions (with `key_stage`,
 *    one `correct_index`, a plain `explanation`) so a daily lesson and the
 *    3-question mastery check never run dry.
 *
 * Seeded idempotently by scripts/seed.ts (upsert on topic_tag / topic_tag+prompt).
 */

import type { Subject } from "../db/types";
import type { SeedTopic, SeedQuestion } from "./curriculum.seed";

// ── Topics ───────────────────────────────────────────────────
// order values sit above the GCSE range (1–10) so the band filter sequences
// them while global `firstTopic`/`nextTopicAfter` keep returning GCSE topics.

const BASE_SEED_TOPICS_BANDS: SeedTopic[] = [
  // ── Mathematics ──
  { subject: "mathematics", topic_tag: "maths_ks2_arithmetic", title: "Arithmetic", summary: "Times tables, addition and subtraction you can rely on.", key_stage: 2, working_grade_band: "Year 4", order: 101, prerequisite_tags: [] },
  { subject: "mathematics", topic_tag: "maths_ks2_fractions", title: "Fractions & Measures", summary: "Simple fractions of amounts, and everyday measures.", key_stage: 2, working_grade_band: "Year 5", order: 102, prerequisite_tags: ["maths_ks2_arithmetic"] },
  { subject: "mathematics", topic_tag: "maths_ks3_negatives", title: "Negative Numbers & Powers", summary: "Working with negatives and square/cube numbers.", key_stage: 3, working_grade_band: "Year 7", order: 111, prerequisite_tags: ["maths_ks2_fractions"] },
  { subject: "mathematics", topic_tag: "maths_ks3_expressions", title: "Algebraic Expressions", summary: "Simplifying and expanding simple algebra.", key_stage: 3, working_grade_band: "Year 8", order: 112, prerequisite_tags: ["maths_ks3_negatives"] },

  // ── English ──
  { subject: "english", topic_tag: "eng_ks2_reading", title: "Reading & Spelling", summary: "Common spellings, plurals and reading for meaning.", key_stage: 2, working_grade_band: "Year 4", order: 101, prerequisite_tags: [] },
  { subject: "english", topic_tag: "eng_ks2_writing", title: "Sentences & Punctuation", summary: "Building correct sentences with capitals and full stops.", key_stage: 2, working_grade_band: "Year 5", order: 102, prerequisite_tags: ["eng_ks2_reading"] },
  { subject: "english", topic_tag: "eng_ks3_grammar", title: "Grammar & Clauses", summary: "Verbs, tenses, word classes and clauses.", key_stage: 3, working_grade_band: "Year 7", order: 111, prerequisite_tags: ["eng_ks2_writing"] },
  { subject: "english", topic_tag: "eng_ks3_reading", title: "Inference & Language", summary: "Inferring meaning and spotting language devices.", key_stage: 3, working_grade_band: "Year 8", order: 112, prerequisite_tags: ["eng_ks3_grammar"] },

  // ── Science ──
  { subject: "science", topic_tag: "sci_ks2_living", title: "Living Things", summary: "Plants, animals and what living things need.", key_stage: 2, working_grade_band: "Year 4", order: 101, prerequisite_tags: [] },
  { subject: "science", topic_tag: "sci_ks2_materials", title: "Materials & Their Properties", summary: "Everyday materials, states and simple forces.", key_stage: 2, working_grade_band: "Year 5", order: 102, prerequisite_tags: ["sci_ks2_living"] },
  { subject: "science", topic_tag: "sci_ks3_cells", title: "Cells & Organisms", summary: "Cells, their parts and how living things are organised.", key_stage: 3, working_grade_band: "Year 7", order: 111, prerequisite_tags: ["sci_ks2_materials"] },
  { subject: "science", topic_tag: "sci_ks3_forces", title: "Forces & Energy", summary: "Forces, motion and energy stores.", key_stage: 3, working_grade_band: "Year 8", order: 112, prerequisite_tags: ["sci_ks3_cells"] },
];

const WORKED_EXAMPLES_BY_TOPIC: Record<string, SeedTopic["worked_example"]> = {
  maths_ks2_arithmetic: {
    title: "Add 45 and 38",
    scenario: "You have 45 stickers, then a friend gives you 38 more.",
    steps: [
      { line: "Split 38 into 30 and 8.", visual: { label: "Break apart", value: "38 = 30 + 8" } },
      { line: "Add the tens first: 45 + 30 = 75.", visual: { label: "Tens", value: "75" } },
      { line: "Add the ones: 75 + 8 = 83.", visual: { label: "Total", value: "83" } },
    ],
    yourTurn: "Try 52 + 27. Split 27 into tens and ones first.",
  },
  maths_ks2_fractions: {
    title: "Find one quarter of 40",
    scenario: "A tray has 40 grapes shared equally between 4 bowls.",
    steps: [
      { line: "One quarter means one of 4 equal parts.", visual: { label: "Parts", value: "4 equal bowls" } },
      { line: "Share 40 into 4 equal groups: 40 divided by 4.", visual: { label: "Calculation", value: "40 / 4" } },
      { line: "Each group has 10, so one quarter of 40 is 10.", visual: { label: "Answer", value: "10" } },
    ],
    yourTurn: "Try one quarter of 28. Share 28 into 4 equal parts.",
  },
  maths_ks3_negatives: {
    title: "Work out -3 + 7",
    scenario: "Start at -3 on a number line and move 7 places to the right.",
    steps: [
      { line: "Moving right means the number gets bigger.", visual: { label: "Direction", value: "right = add" } },
      { line: "From -3, move 3 places to reach 0.", visual: { label: "To zero", value: "-3 + 3 = 0" } },
      { line: "There are 4 moves left, so land on 4.", visual: { label: "Landing point", value: "4" } },
    ],
    yourTurn: "Try -5 + 8. Count to zero first, then use the moves left.",
  },
  maths_ks3_expressions: {
    title: "Simplify 4x + 2x",
    scenario: "Think of x as the same unknown tile each time.",
    steps: [
      { line: "Both terms are x terms, so they are like terms.", visual: { label: "Like terms", value: "x and x" } },
      { line: "Add the coefficients: 4 + 2 = 6.", visual: { label: "Coefficients", value: "6" } },
      { line: "Keep the x: 4x + 2x = 6x.", visual: { label: "Simplified", value: "6x" } },
    ],
    yourTurn: "Try 3a + 5a. Add the numbers in front and keep the letter.",
  },
  eng_ks2_reading: {
    title: "Choose the correct spelling",
    scenario: "You need the word because in a sentence.",
    steps: [
      { line: "Say the word slowly: be-cause.", visual: { label: "Sound it out", value: "be + cause" } },
      { line: "Look for the spelling with 'cause' at the end.", visual: { label: "Check", value: "because" } },
      { line: "The correct spelling is because.", visual: { label: "Word", value: "because" } },
    ],
    yourTurn: "Try happiness. Listen for the base word happy, then the ending ness.",
  },
  eng_ks2_writing: {
    title: "Build a complete sentence",
    scenario: "We want to write: We went to the park.",
    steps: [
      { line: "Start the sentence with a capital letter.", visual: { label: "Start", value: "We" } },
      { line: "Make sure it tells a complete idea: who did what.", visual: { label: "Idea", value: "We went" } },
      { line: "End with a full stop.", visual: { label: "End", value: "." } },
    ],
    yourTurn: "Try writing: My dog barked. Check the capital letter and full stop.",
  },
  eng_ks3_grammar: {
    title: "Find the verb",
    scenario: "In 'The athlete sprinted quickly', we need the action word.",
    steps: [
      { line: "Ask: what did someone do?", visual: { label: "Question", value: "did what?" } },
      { line: "The athlete sprinted; sprinted is the action.", visual: { label: "Action", value: "sprinted" } },
      { line: "So sprinted is the verb.", visual: { label: "Verb", value: "sprinted" } },
    ],
    yourTurn: "Try 'The dog barked loudly.' Ask what the dog did.",
  },
  eng_ks3_reading: {
    title: "Spot personification",
    scenario: "The sentence says: The sun smiled down on us.",
    steps: [
      { line: "Ask whether a non-human thing is doing a human action.", visual: { label: "Thing", value: "sun" } },
      { line: "Smiling is something a person does.", visual: { label: "Human action", value: "smiled" } },
      { line: "Giving the sun a human action is personification.", visual: { label: "Device", value: "personification" } },
    ],
    yourTurn: "Try 'The wind whispered.' Look for the human action.",
  },
  sci_ks2_living: {
    title: "What plants need",
    scenario: "A bean seed is planted in soil and needs to grow.",
    steps: [
      { line: "Plants make their own food using light.", visual: { label: "Need", value: "sunlight" } },
      { line: "They also need water and air, but plastic and metal do not help them grow.", visual: { label: "Not needed", value: "plastic, metal" } },
      { line: "So sunlight is the best choice here.", visual: { label: "Choice", value: "sunlight" } },
    ],
    yourTurn: "Try asking what roots take in from soil.",
  },
  sci_ks2_materials: {
    title: "Choose a waterproof material",
    scenario: "You need a cover that keeps rain away from a notebook.",
    steps: [
      { line: "Waterproof means water cannot pass through easily.", visual: { label: "Meaning", value: "keeps water out" } },
      { line: "Paper, card and cotton soak up water.", visual: { label: "Soak up", value: "paper, card, cotton" } },
      { line: "Plastic keeps water out, so plastic is waterproof.", visual: { label: "Material", value: "plastic" } },
    ],
    yourTurn: "Try choosing a transparent material. Ask what light passes through.",
  },
  sci_ks3_cells: {
    title: "Name the basic unit of life",
    scenario: "We are looking at what all living things are made from.",
    steps: [
      { line: "Organs and tissues are made from smaller living units.", visual: { label: "Smaller unit", value: "cell" } },
      { line: "Atoms and molecules are not living on their own.", visual: { label: "Not alive", value: "atom, molecule" } },
      { line: "The basic building block of living things is the cell.", visual: { label: "Answer", value: "cell" } },
    ],
    yourTurn: "Try naming the cell part that controls the cell.",
  },
  sci_ks3_forces: {
    title: "Identify gravity",
    scenario: "A ball is dropped and falls towards the ground.",
    steps: [
      { line: "Look for the force pulling objects towards Earth.", visual: { label: "Pull", value: "towards Earth" } },
      { line: "Friction slows motion, but it does not pull everything down.", visual: { label: "Compare", value: "friction slows" } },
      { line: "The pull towards Earth is gravity.", visual: { label: "Force", value: "gravity" } },
    ],
    yourTurn: "Try naming the unit of force. Remember: force is measured in newtons.",
  },
};

// Human-authored tap-to-define glossary (F9 — SEND / EAL comprehension). Each
// term appears in the topic's explainer prose above; definitions are written in
// a calm child voice. The model NEVER authors these (same rule as questions).
const GLOSSARY_BY_TOPIC: Record<string, { term: string; definition: string }[]> = {
  maths_ks3_negatives: [
    { term: "number line", definition: "A straight line with numbers marked in order. You can count along it to add (move right) or take away (move left)." },
  ],
  maths_ks3_expressions: [
    { term: "like terms", definition: "Parts of an expression that use the same letter, such as 4x and 2x. Only like terms can be added together." },
    { term: "coefficients", definition: "The number in front of a letter. In 4x the coefficient is 4 — it tells you how many x you have." },
  ],
  maths_ks2_fractions: [
    { term: "quarter", definition: "One of four equal parts of something. Four quarters make a whole." },
  ],
  sci_ks3_cells: [
    { term: "tissues", definition: "Groups of similar cells working together, like muscle tissue or leaf tissue." },
  ],
  maths_ks2_arithmetic: [
    { term: "tens", definition: "The tens tell you how many groups of ten a number has. In 45 the 4 means four tens, which is 40." },
    { term: "ones", definition: "The ones are the single units in a number. In 45 the 5 means five ones." },
  ],
  eng_ks2_reading: [
    { term: "spelling", definition: "The way the letters of a word are put in the right order to make the word correct." },
  ],
  eng_ks2_writing: [
    { term: "capital letter", definition: "A big letter like A or B. We use one to start a sentence and for people's names." },
    { term: "full stop", definition: "The small dot we put at the end of a sentence to show it has finished." },
  ],
  eng_ks3_grammar: [
    { term: "verb", definition: "A doing word — it tells you the action, like run, jump or sprinted." },
    { term: "action word", definition: "Another name for a verb — the word that tells you what someone or something does." },
  ],
  eng_ks3_reading: [
    { term: "personification", definition: "A way of writing that gives a thing or animal a human action, like 'the sun smiled'." },
    { term: "human action", definition: "Something only a person can really do, like smiling, talking or whispering." },
  ],
  sci_ks2_living: [
    { term: "soil", definition: "The top layer of earth that plants grow in. Roots take in water from the soil." },
    { term: "seed", definition: "A tiny part a new plant grows from when it has water, warmth and light." },
  ],
  sci_ks2_materials: [
    { term: "waterproof", definition: "Something that keeps water out so it cannot soak through, like plastic." },
  ],
  sci_ks3_forces: [
    { term: "gravity", definition: "The pulling force that brings everything down towards the Earth." },
    { term: "friction", definition: "A force that slows things down when two surfaces rub together." },
  ],
};

export const SEED_TOPICS_BANDS: SeedTopic[] = BASE_SEED_TOPICS_BANDS.map((topic) => ({
  ...topic,
  ...(WORKED_EXAMPLES_BY_TOPIC[topic.topic_tag]
    ? { worked_example: WORKED_EXAMPLES_BY_TOPIC[topic.topic_tag] }
    : {}),
  ...(GLOSSARY_BY_TOPIC[topic.topic_tag]
    ? { glossary: GLOSSARY_BY_TOPIC[topic.topic_tag] }
    : {}),
}));

// ── Questions ────────────────────────────────────────────────
// [tier, kind, prompt, options, correctIndex, explanation]
type BTuple = [
  number,
  "practice" | "mastery",
  string,
  string[],
  number,
  string,
];

const QUESTIONS_BY_TOPIC: Record<string, BTuple[]> = {
  // ════════════ MATHS · KS2 ════════════
  maths_ks2_arithmetic: [
    [1, "practice", "What is 7 × 8?", ["54", "56", "49", "63"], 1, "Seven groups of 8 make 56."],
    [1, "practice", "What is 45 + 38?", ["83", "73", "85", "82"], 0, "Add 30 to 45 to get 75. Then add 8 more to get 83."],
    [2, "practice", "What is 90 − 27?", ["63", "73", "67", "53"], 0, "Take away 20 from 90 to get 70. Then take away 7 more to get 63."],
    [1, "mastery", "What is 6 × 9?", ["54", "56", "63", "48"], 0, "Six groups of 9 make 54."],
    [2, "mastery", "What is 124 + 59?", ["183", "173", "184", "193"], 0, "Add 60 to 124 to get 184. Then take away 1, so the answer is 183."],
    [2, "mastery", "What is 100 − 64?", ["36", "46", "34", "44"], 0, "Let's take away 64 from 100, step by step. Take away 60 to get 40, then take away 4 more to get 36."],
  ],
  maths_ks2_fractions: [
    [1, "practice", "What is ½ of 16?", ["8", "6", "4", "12"], 0, "Half of 16 is 8."],
    [1, "practice", "What is ⅓ of 12?", ["4", "3", "6", "5"], 0, "12 ÷ 3 = 4."],
    [2, "practice", "How many centimetres are in 1 metre?", ["100", "10", "1,000", "50"], 0, "There are 100 cm in a metre."],
    [2, "mastery", "What is ¼ of 40?", ["10", "8", "5", "20"], 0, "40 ÷ 4 = 10."],
    [2, "mastery", "Which is larger, ½ or ¼?", ["½", "¼", "They are equal", "You can't tell"], 0, "A half is bigger than a quarter."],
    [2, "mastery", "How many minutes are in 2 hours?", ["120", "60", "100", "90"], 0, "2 × 60 = 120 minutes."],
  ],

  // ════════════ MATHS · KS3 ════════════
  maths_ks3_negatives: [
    [2, "practice", "What is −3 + 7?", ["4", "−4", "10", "−10"], 0, "Counting up 7 from −3 gives 4."],
    [2, "practice", "What is 5 − 8?", ["−3", "3", "13", "−13"], 0, "5 − 8 = −3."],
    [2, "practice", "What is 4²?", ["16", "8", "12", "6"], 0, "4 × 4 = 16."],
    [3, "mastery", "What is −6 + (−4)?", ["−10", "−2", "10", "2"], 0, "Adding two negatives: −6 + −4 = −10."],
    [3, "mastery", "What is 2³?", ["8", "6", "9", "12"], 0, "2 × 2 × 2 = 8."],
    [3, "mastery", "What is −2 × 3?", ["−6", "6", "−5", "5"], 0, "A negative times a positive is negative: −6."],
  ],
  maths_ks3_expressions: [
    [2, "practice", "Simplify 4x + 2x.", ["6x", "8x", "6", "42x"], 0, "Add the like terms: 4x + 2x = 6x."],
    [2, "practice", "Simplify 5a − 2a.", ["3a", "7a", "3", "10a"], 0, "5a − 2a = 3a."],
    [2, "practice", "Write 3 × n as simply as possible.", ["3n", "n3", "3 + n", "n³"], 0, "Three lots of n is written 3n."],
    [3, "mastery", "Expand 2(x + 5).", ["2x + 10", "2x + 5", "x + 10", "2x + 7"], 0, "Multiply both terms by 2: 2x + 10."],
    [3, "mastery", "If n = 4, what is 3n?", ["12", "7", "34", "1"], 0, "3 × 4 = 12."],
    [3, "mastery", "Simplify 7y + y.", ["8y", "7y", "7y²", "8"], 0, "y is 1y, so 7y + 1y = 8y."],
  ],

  // ════════════ ENGLISH · KS2 ════════════
  eng_ks2_reading: [
    [1, "practice", "Which word is spelled correctly?", ["becuase", "because", "becase", "becouse"], 1, "'Because' is the correct spelling."],
    [1, "practice", "What is the plural of 'box'?", ["boxs", "boxes", "boxies", "box's"], 1, "Words ending in 'x' add 'es': boxes."],
    [2, "practice", "'The puppy wagged its tail happily.' How does the puppy feel?", ["Scared", "Happy", "Angry", "Hungry"], 1, "Wagging its tail happily shows the puppy is happy."],
    [2, "mastery", "Which word is spelled correctly?", ["happyness", "happiness", "happines", "hapiness"], 1, "Change the 'y' to 'i' and add 'ness': happiness."],
    [2, "mastery", "What is the opposite of 'begin'?", ["start", "end", "open", "go"], 1, "The opposite of begin is end."],
    [2, "mastery", "What is the plural of 'church'?", ["churchs", "churches", "churchies", "church's"], 1, "Words ending in 'ch' add 'es': churches."],
  ],
  eng_ks2_writing: [
    [1, "practice", "Which sentence is written correctly?", ["we went to the park", "We went to the park.", "we went to the park.", "We went to the park"], 1, "A sentence starts with a capital letter and ends with a full stop."],
    [1, "practice", "Which word joins two ideas together?", ["and", "cat", "run", "blue"], 0, "'And' is a connective that joins ideas."],
    [2, "practice", "Which punctuation mark ends a question?", ["Full stop", "Question mark", "Comma", "Exclamation mark"], 1, "A question ends with a question mark."],
    [2, "mastery", "Which sentence uses capital letters correctly?", ["my name is sam", "My name is Sam.", "my Name is sam", "MY name is sam"], 1, "Start the sentence and the name with capital letters."],
    [2, "mastery", "Which of these is a complete sentence?", ["The big dog.", "The dog barked.", "Running fast.", "Under the tree."], 1, "'The dog barked.' tells us who did what — it is complete."],
    [2, "mastery", "Choose the correct word: 'I have ___ apples.'", ["two", "too", "to", "tow"], 0, "'Two' is the number 2."],
  ],

  // ════════════ ENGLISH · KS3 ════════════
  eng_ks3_grammar: [
    [2, "practice", "Which word is the verb? 'The athlete sprinted quickly.'", ["athlete", "sprinted", "quickly", "the"], 1, "'Sprinted' is the action word, so it is the verb."],
    [2, "practice", "Which sentence is in the past tense?", ["I walk home", "I walked home", "I will walk home", "I am walking home"], 1, "'Walked' shows it already happened."],
    [2, "practice", "A group of words containing a subject and a verb is a:", ["clause", "noun", "prefix", "syllable"], 0, "A clause contains a subject and a verb."],
    [3, "mastery", "Choose the correct word: 'Each of the boys ___ ready.'", ["is", "are", "were", "be"], 0, "'Each' is singular, so it takes 'is'."],
    [3, "mastery", "Which word is the adjective in 'the ancient castle'?", ["the", "ancient", "castle", "a"], 1, "'Ancient' describes the castle, so it is an adjective."],
    [3, "mastery", "Which word is a conjunction?", ["because", "quickly", "castle", "run"], 0, "'Because' joins two clauses, so it is a conjunction."],
  ],
  eng_ks3_reading: [
    [2, "practice", "'Her hands trembled as she opened the letter.' She most likely feels:", ["calm", "nervous", "bored", "joyful"], 1, "Trembling hands suggest she is nervous."],
    [2, "practice", "'The sun smiled down on us.' This is an example of:", ["simile", "personification", "metaphor", "alliteration"], 1, "Giving the sun a human action is personification."],
    [2, "practice", "'As light as a feather' is a:", ["metaphor", "simile", "pun", "rhyme"], 1, "It compares using 'as', so it is a simile."],
    [3, "mastery", "'The room was an oven.' This is a:", ["simile", "metaphor", "question", "fact"], 1, "It says the room IS an oven, so it is a metaphor."],
    [3, "mastery", "Reading quickly to find one specific fact is called:", ["skimming", "scanning", "editing", "drafting"], 1, "Searching for a specific fact is scanning."],
    [3, "mastery", "'Silently, slowly, secretly she crept.' The repeated 's' sound is:", ["alliteration", "rhyme", "simile", "metaphor"], 0, "Repeating the same starting sound is alliteration."],
  ],

  // ════════════ SCIENCE · KS2 ════════════
  sci_ks2_living: [
    [1, "practice", "Which of these do plants need to grow?", ["Sunlight", "Darkness", "Plastic", "Metal"], 0, "Plants need sunlight to make food and grow."],
    [1, "practice", "Which animal is a mammal?", ["Frog", "Dog", "Snake", "Fish"], 1, "A dog is a mammal — it has fur and feeds its young milk."],
    [2, "practice", "Animals that eat only plants are called:", ["herbivores", "carnivores", "omnivores", "predators"], 0, "Plant-eaters are herbivores."],
    [2, "mastery", "Which part of a plant takes in water?", ["Leaves", "Roots", "Flower", "Petals"], 1, "Roots take in water from the soil."],
    [2, "mastery", "A baby frog is called a:", ["calf", "tadpole", "chick", "cub"], 1, "A baby frog is a tadpole."],
    [2, "mastery", "Which living things make their own food using sunlight?", ["Animals", "Plants", "Rocks", "Metals"], 1, "Plants make their own food using sunlight."],
  ],
  sci_ks2_materials: [
    [1, "practice", "Which material is waterproof?", ["Paper", "Plastic", "Cardboard", "Cotton"], 1, "Plastic keeps water out — it is waterproof."],
    [1, "practice", "When water freezes it becomes:", ["steam", "ice", "gas", "salt"], 1, "Frozen water is ice, a solid."],
    [2, "practice", "Which of these is a metal?", ["Wood", "Iron", "Glass", "Rubber"], 1, "Iron is a metal."],
    [2, "mastery", "Heating ice makes it:", ["melt", "freeze", "vanish", "harden"], 0, "Heating ice melts it into water."],
    [2, "mastery", "Which material lets light through?", ["Wood", "Glass", "Metal", "Brick"], 1, "Glass is transparent — light passes through it."],
    [2, "mastery", "A force that slows a moving object down is:", ["friction", "gravity", "light", "sound"], 0, "Friction slows moving objects down."],
  ],

  // ════════════ SCIENCE · KS3 ════════════
  sci_ks3_cells: [
    [2, "practice", "The basic building block of all living things is the:", ["atom", "cell", "organ", "molecule"], 1, "All living things are made of cells."],
    [2, "practice", "Which part controls the cell?", ["membrane", "nucleus", "cytoplasm", "wall"], 1, "The nucleus controls the cell."],
    [2, "practice", "Which structure do plant cells have that animal cells do not?", ["nucleus", "cell wall", "membrane", "cytoplasm"], 1, "Plant cells have a cell wall for support."],
    [3, "mastery", "Photosynthesis takes place in the:", ["mitochondria", "chloroplasts", "nucleus", "membrane"], 1, "Chloroplasts carry out photosynthesis in plant cells."],
    [3, "mastery", "The jelly-like filling of a cell is the:", ["nucleus", "cytoplasm", "membrane", "wall"], 1, "Cytoplasm is the jelly-like filling where reactions happen."],
    [3, "mastery", "A group of similar cells working together forms a:", ["tissue", "organ", "system", "molecule"], 0, "Similar cells working together form a tissue."],
  ],
  sci_ks3_forces: [
    [2, "practice", "The force that pulls objects towards the Earth is:", ["friction", "gravity", "magnetism", "tension"], 1, "Gravity pulls objects towards the Earth."],
    [2, "practice", "The unit of force is the:", ["metre", "newton", "litre", "second"], 1, "Force is measured in newtons."],
    [2, "practice", "Energy due to movement is called:", ["kinetic", "thermal", "chemical", "nuclear"], 0, "Movement energy is kinetic energy."],
    [3, "mastery", "A moving object keeps a steady speed when the forces on it are:", ["balanced", "unbalanced", "removed", "doubled"], 0, "Balanced forces mean no change in motion."],
    [3, "mastery", "Energy is measured in:", ["newtons", "joules", "watts", "volts"], 1, "Energy is measured in joules."],
    [3, "mastery", "The energy stored in food is mainly:", ["chemical", "kinetic", "sound", "light"], 0, "Food stores chemical energy."],
  ],
};

/** Flattened band questions ready to seed. */
export const SEED_QUESTIONS_BANDS: SeedQuestion[] = Object.entries(
  QUESTIONS_BY_TOPIC,
).flatMap(([topicTag, tuples]) => {
  const topic = SEED_TOPICS_BANDS.find((t) => t.topic_tag === topicTag);
  if (!topic) {
    throw new Error(`Band question references unknown topic: ${topicTag}`);
  }
  return tuples.map(
    ([tier, kind, prompt, options, correct_index, explanation]): SeedQuestion => ({
      topic_tag: topicTag,
      subject: topic.subject as Subject,
      tier,
      key_stage: topic.key_stage,
      kind,
      prompt,
      options,
      correct_index,
      explanation,
    }),
  );
});

/**
 * Additional human-authored questions to deepen each topic's bank.
 *
 * Complements curriculum.seed.ts so every topic has enough practice items and a
 * full 3-question mastery block. Same authoring rules: exactly one correct
 * option, plain explanation, tier 1–5. Seeded idempotently by scripts/seed.ts
 * (natural key = topic_tag + prompt).
 */

import type { SeedQuestion } from "./curriculum.seed";
import { SEED_TOPICS } from "./curriculum.seed";

type QTuple = [
  number,
  "diagnostic" | "practice" | "mastery",
  string,
  string[],
  number,
  string,
];

const EXTRA_BY_TOPIC: Record<string, QTuple[]> = {
  // ── Maths ──
  maths_number: [
    [1, "practice", "What is 9 × 6?", ["54", "56", "45", "63"], 0, "9 × 6 = 54."],
    [2, "practice", "Round 7,482 to the nearest thousand.", ["7,000", "7,400", "7,500", "8,000"], 0, "482 < 500, so it rounds down to 7,000."],
    [3, "diagnostic", "What is 3.2 × 100?", ["32", "320", "3,200", "0.032"], 1, "Multiplying by 100 moves the point two places right: 320."],
    [2, "mastery", "Which is the value of 6 in 3,652?", ["6", "60", "600", "6,000"], 2, "The 6 is in the hundreds column → 600."],
    [3, "mastery", "Estimate 612 ÷ 29.", ["about 20", "about 30", "about 2", "about 60"], 0, "Round to 600 ÷ 30 = 20."],
  ],
  maths_fractions: [
    [2, "practice", "Simplify 6/8.", ["3/4", "2/3", "1/2", "4/6"], 0, "Divide top and bottom by 2 → 3/4."],
    [3, "diagnostic", "What is 0.6 as a percentage?", ["6%", "60%", "0.6%", "600%"], 1, "0.6 = 60/100 = 60%."],
    [4, "practice", "What is 30% of 90?", ["18", "27", "30", "63"], 1, "10% of 90 is 9, so 30% is 27."],
    [3, "mastery", "Which is largest: 1/2, 2/5, 3/8?", ["1/2", "2/5", "3/8", "all equal"], 0, "1/2 = 0.5, 2/5 = 0.4, 3/8 = 0.375 → 1/2."],
  ],
  maths_ratio: [
    [3, "diagnostic", "Simplify the ratio 9:12.", ["3:4", "2:3", "4:5", "1:2"], 0, "Divide both by 3 → 3:4."],
    [4, "practice", "Share 24 in the ratio 1:2:3.", ["4, 8, 12", "6, 8, 10", "2, 8, 14", "8, 8, 8"], 0, "6 parts of 4 each → 4, 8, 12."],
    [3, "mastery", "3 apples cost 90p. How much for 5?", ["£1.20", "£1.50", "£1.35", "£1.80"], 1, "Each apple is 30p, so 5 cost £1.50."],
    [4, "mastery", "If 2:5 = 8:x, what is x?", ["10", "20", "16", "40"], 1, "2 × 4 = 8, so x = 5 × 4 = 20."],
  ],
  maths_algebra_linear: [
    [3, "practice", "Simplify 5x + 2 − 3x.", ["2x + 2", "8x", "2x − 2", "5x"], 0, "5x − 3x = 2x, then + 2 → 2x + 2."],
    [4, "diagnostic", "Solve 4(x − 1) = 12.", ["x = 2", "x = 3", "x = 4", "x = 5"], 2, "Divide by 4: x − 1 = 3, so x = 4."],
    [3, "practice", "If x = 4, what is 3x − 5?", ["7", "12", "17", "2"], 0, "3 × 4 − 5 = 12 − 5 = 7."],
  ],
  maths_sequences: [
    [3, "practice", "Next term: 2, 6, 10, 14, …", ["16", "18", "20", "12"], 1, "The rule is +4, so 14 + 4 = 18."],
    [4, "diagnostic", "nth term of 7, 9, 11, 13, …?", ["2n + 5", "2n + 7", "n + 6", "7n"], 0, "Difference 2 gives 2n; 2(1)+5 = 7 → 2n + 5."],
    [4, "mastery", "Find the 6th term of 4n − 2.", ["20", "22", "24", "18"], 1, "4(6) − 2 = 24 − 2 = 22."],
  ],
  maths_graphs: [
    [4, "practice", "What is the y-intercept of y = 5x − 3?", ["5", "−3", "3", "0"], 1, "The constant term is the y-intercept: −3."],
    [5, "diagnostic", "A line has gradient 0. It is:", ["vertical", "horizontal", "diagonal up", "diagonal down"], 1, "Gradient 0 means a flat, horizontal line."],
    [5, "mastery", "Point (2, y) is on y = 3x + 1. Find y.", ["5", "7", "6", "4"], 1, "y = 3(2) + 1 = 7."],
  ],
  maths_quadratics: [
    [5, "practice", "Expand (x + 5)(x − 2).", ["x² + 3x − 10", "x² − 3x − 10", "x² + 7x − 10", "x² + 3x + 10"], 0, "x² − 2x + 5x − 10 = x² + 3x − 10."],
    [5, "diagnostic", "Factorise x² + 7x + 12.", ["(x+3)(x+4)", "(x+2)(x+6)", "(x+1)(x+12)", "(x+5)(x+2)"], 0, "3 and 4 multiply to 12 and add to 7."],
    [5, "mastery", "Solve x² = 16.", ["x = ±4", "x = 4", "x = 8", "x = ±8"], 0, "x = 4 or x = −4."],
  ],
  maths_geometry: [
    [3, "practice", "Angles in a full turn add to:", ["180°", "270°", "360°", "90°"], 2, "A full turn is 360°."],
    [4, "diagnostic", "One angle of an equilateral triangle is:", ["45°", "60°", "90°", "120°"], 1, "All three equal angles sum to 180°, so each is 60°."],
    [4, "mastery", "Opposite angles in a parallelogram are:", ["equal", "supplementary only", "right angles", "different"], 0, "Opposite angles of a parallelogram are equal."],
  ],
  maths_pythagoras: [
    [5, "practice", "Legs 5 and 12. Hypotenuse?", ["13", "17", "15", "60"], 0, "5² + 12² = 169, √169 = 13."],
    [5, "diagnostic", "If adjacent = 4, hypotenuse = 5, cos θ = ?", ["0.6", "0.8", "0.75", "1.25"], 1, "cos θ = adjacent ÷ hypotenuse = 4/5 = 0.8."],
    [5, "mastery", "Is a 6, 8, 10 triangle right-angled?", ["Yes", "No", "Only if isosceles", "Cannot tell"], 0, "6² + 8² = 100 = 10², so yes."],
  ],
  maths_statistics: [
    [2, "practice", "Find the mode of 2, 3, 3, 5, 7.", ["3", "5", "2", "7"], 0, "The mode is the most frequent value: 3."],
    [3, "diagnostic", "Find the range of 4, 9, 2, 11.", ["7", "9", "11", "13"], 1, "Range = largest − smallest = 11 − 2 = 9."],
    [4, "mastery", "P(rolling a 7 on one die) = ?", ["0", "1/6", "1/2", "1"], 0, "A die only goes to 6, so 7 is impossible → 0."],
  ],

  // ── English ──
  eng_spelling: [
    [2, "practice", "Which is spelled correctly?", ["embarass", "embarrass", "embarras", "embbarrass"], 1, "'Embarrass' has double r and double s."],
    [2, "diagnostic", "Choose the correct word.", ["definate", "definite", "definnite", "defenite"], 1, "'Definite' is the correct spelling."],
    [3, "mastery", "Which is correct?", ["accommodate", "accomodate", "acommodate", "accommadate"], 0, "'Accommodate' has double c and double m."],
  ],
  eng_grammar: [
    [2, "diagnostic", "Which sentence is in the future tense?", ["I walked home.", "I walk home.", "I will walk home.", "I am walking."], 2, "'Will walk' indicates the future tense."],
    [3, "mastery", "Pick the correct plural of 'child'.", ["childs", "children", "childes", "childrens"], 1, "'Children' is the irregular plural."],
    [3, "practice", "Which word is an adjective in 'the bright sun'?", ["the", "bright", "sun", "none"], 1, "'Bright' describes the noun 'sun'."],
  ],
  eng_punctuation: [
    [2, "practice", "Which mark ends the sentence: 'What time is it'?", ["full stop", "question mark", "comma", "exclamation mark"], 1, "A question ends with a question mark."],
    [3, "diagnostic", "Which sentence is correct?", ["Lets eat, Grandma!", "Let's eat Grandma!", "Let's eat, Grandma!", "Lets eat Grandma"], 2, "Apostrophe in 'Let's' and a comma before direct address."],
    [3, "mastery", "Which uses a semicolon correctly?", ["I came; I saw; I won.", "I came, I saw, I won.", "I; came I saw.", "I came: I saw."], 0, "Semicolons join closely related independent clauses."],
  ],
  eng_comprehension: [
    [4, "practice", "'She clenched her fists and frowned.' She is most likely:", ["happy", "angry", "sleepy", "hungry"], 1, "Clenched fists and a frown suggest anger."],
    [4, "diagnostic", "The main idea of a paragraph is usually found in the:", ["topic sentence", "last word", "title only", "footnote"], 0, "The topic sentence states the main idea."],
    [4, "mastery", "To 'infer' means to:", ["copy text", "work out meaning from clues", "spell aloud", "skip the text"], 1, "Inference is concluding from evidence."],
  ],
  eng_devices: [
    [4, "practice", "'Her smile was sunshine' is a:", ["simile", "metaphor", "onomatopoeia", "rhyme"], 1, "It states one thing IS another — a metaphor."],
    [5, "diagnostic", "'Peter Piper picked' uses:", ["alliteration", "simile", "metaphor", "irony"], 0, "Repeated initial 'p' sounds = alliteration."],
    [5, "mastery", "Exaggeration for effect is called:", ["hyperbole", "simile", "alliteration", "rhyme"], 0, "Hyperbole is deliberate exaggeration."],
  ],
  eng_analysis: [
    [5, "practice", "A writer's choice of a harsh word like 'stabbed' affects the:", ["tone", "page count", "font", "title"], 0, "Word choice shapes the tone."],
    [5, "diagnostic", "Analysing structure means looking at how a text is:", ["spelled", "organised and ordered", "printed", "priced"], 1, "Structure is the organisation/order of a text."],
    [5, "mastery", "A short final sentence after long ones creates:", ["emphasis", "confusion", "a title", "a rhyme"], 0, "The contrast draws emphasis to the short sentence."],
  ],
  eng_creative: [
    [4, "practice", "'The waves crashed like thunder' appeals to which sense?", ["smell", "sound", "taste", "touch"], 1, "'Crashed like thunder' evokes sound."],
    [5, "diagnostic", "A strong narrative usually has a clear:", ["beginning, middle, end", "list of facts", "glossary", "price"], 0, "Narratives follow a beginning–middle–end structure."],
    [5, "mastery", "'Show don't tell' means:", ["state the emotion", "reveal emotion through detail", "use big words", "write less"], 1, "Convey feeling through action and detail, not labels."],
  ],
  eng_persuasive: [
    [4, "practice", "A statistic in persuasion adds:", ["confusion", "credibility", "rhyme", "length"], 1, "Facts and statistics build credibility."],
    [5, "diagnostic", "'Everyone knows that…' is an appeal to:", ["evidence", "the bandwagon", "rhyme", "spelling"], 1, "It pressures agreement by implying everyone agrees."],
    [5, "mastery", "The 'E' in AFOREST stands for:", ["Emotive language", "Ending", "Examples only", "Echo"], 0, "AFOREST: Alliteration, Facts, Opinion, Rhetorical questions, Emotive language, Statistics, Triples."],
  ],
  eng_poetry: [
    [5, "practice", "A poem with no rhyme or regular metre is:", ["a sonnet", "free verse", "a couplet", "a haiku"], 1, "Free verse has no fixed rhyme or metre."],
    [5, "diagnostic", "A haiku traditionally has how many lines?", ["3", "5", "14", "4"], 0, "A haiku has three lines (5-7-5 syllables)."],
    [5, "mastery", "'The rhythm of the falling rain' uses repeated sounds for:", ["effect/musicality", "spelling", "page count", "a title"], 0, "Sound patterning adds musicality and effect."],
  ],
  eng_shakespeare: [
    [5, "practice", "'Macbeth' is mainly a play about:", ["ambition", "farming", "sailing", "cooking"], 0, "Macbeth explores ambition and its consequences."],
    [5, "diagnostic", "A soliloquy is when a character:", ["sings a song", "speaks their thoughts alone on stage", "fights", "exits"], 1, "A soliloquy reveals inner thoughts spoken alone."],
    [5, "mastery", "'Thee' and 'thou' are old words for:", ["you", "me", "they", "it"], 0, "'Thee/thou' are archaic forms of 'you'."],
  ],

  // ── Science ──
  sci_cells: [
    [2, "practice", "Which controls the cell's activities?", ["membrane", "nucleus", "cytoplasm", "wall"], 1, "The nucleus controls the cell's activities."],
    [3, "diagnostic", "Where does photosynthesis occur in a plant cell?", ["nucleus", "chloroplast", "membrane", "vacuole"], 1, "Chloroplasts contain chlorophyll for photosynthesis."],
    [3, "mastery", "Which is NOT found in an animal cell?", ["nucleus", "cell wall", "membrane", "cytoplasm"], 1, "Animal cells have no cell wall."],
  ],
  sci_body: [
    [3, "practice", "Which carries oxygen in the blood?", ["plasma", "red blood cells", "platelets", "white blood cells"], 1, "Red blood cells carry oxygen using haemoglobin."],
    // B3: retired the earlier "Where is most water absorbed in digestion?" item.
    // At GCSE the SMALL intestine absorbs most water, so the old keyed answer
    // ("large intestine") contradicted the word "most". Reworded to test the
    // large intestine's actual role unambiguously. The seed upserts on
    // topic_tag + prompt, so this new prompt is a clean insert; the retired row
    // is deleted from the live bank in the same change (see the run log).
    [3, "diagnostic", "Which organ's main job is to reabsorb water from the material left after digestion?", ["stomach", "large intestine", "mouth", "liver"], 1, "The large intestine (colon) reabsorbs water from the material left after the small intestine has absorbed the digested food."],
    [4, "mastery", "Which vessel returns blood to the heart?", ["artery", "vein", "capillary", "aorta"], 1, "Veins return blood to the heart."],
  ],
  sci_states: [
    [1, "practice", "Gas to liquid is called:", ["melting", "condensation", "freezing", "evaporation"], 1, "Condensation is gas → liquid."],
    [2, "diagnostic", "Particles in a gas are:", ["fixed", "far apart and fast-moving", "packed tightly", "still"], 1, "Gas particles are spread out and move quickly."],
    [2, "mastery", "Solid to liquid is called:", ["melting", "boiling", "condensation", "sublimation"], 0, "Melting is solid → liquid."],
  ],
  sci_atoms: [
    [3, "practice", "What is the symbol for oxygen?", ["O", "Ox", "Og", "Oy"], 0, "Oxygen's symbol is O."],
    [4, "diagnostic", "Protons have which charge?", ["negative", "positive", "neutral", "variable"], 1, "Protons are positively charged."],
    [4, "mastery", "Columns of the periodic table are called:", ["periods", "groups", "rows", "shells"], 1, "Vertical columns are groups."],
  ],
  sci_reactions: [
    [4, "practice", "A substance with pH 2 is:", ["acidic", "neutral", "alkaline", "pure water"], 0, "pH below 7 is acidic."],
    [4, "diagnostic", "What gas turns limewater cloudy?", ["oxygen", "carbon dioxide", "hydrogen", "nitrogen"], 1, "Carbon dioxide turns limewater milky/cloudy."],
    [5, "mastery", "In a reaction, mass is:", ["created", "conserved", "destroyed", "doubled"], 1, "Mass is conserved in chemical reactions."],
  ],
  sci_forces: [
    [4, "practice", "A car travels 100 m in 20 s. Its speed is:", ["2 m/s", "5 m/s", "20 m/s", "120 m/s"], 1, "Speed = 100 ÷ 20 = 5 m/s."],
    [4, "diagnostic", "Gravity on Earth pulls objects:", ["up", "down", "sideways", "in circles"], 1, "Gravity pulls objects toward Earth's centre (down)."],
    [5, "mastery", "Balanced forces on a moving object mean it:", ["speeds up", "keeps constant velocity", "stops instantly", "reverses"], 1, "Balanced forces = no change in motion."],
  ],
  sci_energy: [
    [3, "practice", "Food gives the body which energy store?", ["elastic", "chemical", "nuclear", "sound"], 1, "Food stores chemical energy."],
    [4, "diagnostic", "A lifted object stores which energy?", ["kinetic", "gravitational potential", "thermal", "sound"], 1, "Height gives gravitational potential energy."],
    [5, "mastery", "Energy is measured in:", ["newtons", "joules", "amps", "ohms"], 1, "Energy is measured in joules."],
  ],
  sci_electricity: [
    [4, "practice", "Voltage is measured in:", ["amps", "volts", "ohms", "watts"], 1, "Voltage is measured in volts."],
    [5, "diagnostic", "In a parallel circuit, removing one bulb:", ["turns all off", "leaves others on", "doubles voltage", "stops current"], 1, "Parallel branches are independent, so others stay on."],
    [5, "mastery", "Higher resistance means current is:", ["higher", "lower", "unchanged", "reversed"], 1, "More resistance reduces current (for a fixed voltage)."],
  ],
  sci_genetics: [
    [5, "practice", "Genes are made of:", ["protein", "DNA", "fat", "water"], 1, "Genes are sections of DNA."],
    [5, "diagnostic", "Offspring resemble parents through:", ["inheritance", "evaporation", "friction", "respiration"], 0, "Traits pass on through inheritance of genes."],
    [5, "mastery", "How many chromosomes in a normal human body cell?", ["23", "46", "92", "12"], 1, "Body cells have 46 chromosomes (23 pairs)."],
  ],
  sci_ecology: [
    [3, "practice", "Animals that eat only plants are:", ["carnivores", "herbivores", "omnivores", "decomposers"], 1, "Herbivores eat only plants."],
    [4, "diagnostic", "Energy enters most food chains from the:", ["soil", "Sun", "water", "air"], 1, "The Sun is the original energy source via photosynthesis."],
    [4, "mastery", "Which process returns carbon dioxide to the air?", ["photosynthesis", "respiration", "filtration", "condensation"], 1, "Respiration releases carbon dioxide."],
  ],
};

export const SEED_QUESTIONS_EXTRA: SeedQuestion[] = Object.entries(
  EXTRA_BY_TOPIC,
).flatMap(([topicTag, tuples]) => {
  const topic = SEED_TOPICS.find((t) => t.topic_tag === topicTag);
  if (!topic) throw new Error(`Extra question references unknown topic: ${topicTag}`);
  return tuples.map(
    ([tier, kind, prompt, options, correct_index, explanation]): SeedQuestion => ({
      topic_tag: topicTag,
      subject: topic.subject,
      tier,
      key_stage: 4, // existing bank is GCSE; backfilled so legacy rows are explicit
      kind,
      prompt,
      options,
      correct_index,
      explanation,
    }),
  );
});

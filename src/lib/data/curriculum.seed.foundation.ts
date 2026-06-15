/**
 * Foundation diagnostic bank — human-authored KS2 (ages 7–10) and KS3
 * (ages 11–13) items, so the diagnostic can start at an age-expected level
 * instead of defaulting every child to GCSE.
 *
 * Why this file exists: the original `questions` bank is entirely GCSE
 * (`key_stage: 4`). HEXA serves ages 7–16, so a 7-year-old was being shown
 * GCSE statistics. These items fill the missing KS2/KS3 bands.
 *
 * Authoring rules (identical to curriculum.seed.ts — Brief: "Honesty over
 * hype", zero wrong teaching):
 *  - HUMAN-AUTHORED. No model generated any of these — the engine only SELECTS.
 *  - Exactly one correct option and a plain, encouraging explanation.
 *  - tier 1 (easiest) … 5 (hardest) WITHIN the band; `key_stage` is the band.
 *  - `kind: "diagnostic"` only (these feed the adaptive entry mapping).
 *  - `topic_tag` reuses the existing subject strands (the topic is the subject
 *    area; the question's `key_stage` carries the difficulty band). Prompts are
 *    distinct from the GCSE bank so the (topic_tag + prompt) natural key never
 *    collides on seed.
 *
 * Seeded idempotently by scripts/seed.ts alongside the GCSE bank.
 */

import type { SeedQuestion } from "./curriculum.seed";
import { SEED_TOPICS } from "./curriculum.seed";

/** [key_stage, topic_tag, tier, prompt, options, correctIndex, explanation] */
type FTuple = [number, string, number, string, string[], number, string];

const FOUNDATION: FTuple[] = [
  // ════════════════════ MATHEMATICS ════════════════════
  // ── KS2 (ages 7–10): times tables, basic fractions, shape ──
  [2, "maths_number", 1, "What is 6 × 7?", ["42", "36", "48", "13"], 0, "Six sevens are 42."],
  [2, "maths_number", 2, "What is 9 × 4?", ["36", "32", "45", "27"], 0, "Nine fours are 36."],
  [2, "maths_fractions", 2, "What is ¼ of 20?", ["4", "5", "6", "10"], 1, "¼ means one of four equal parts: 20 ÷ 4 = 5."],
  [2, "maths_number", 3, "What is 156 + 247?", ["403", "393", "413", "303"], 0, "Add the units, tens and hundreds: 156 + 247 = 403."],
  [2, "maths_geometry", 3, "How many sides does a hexagon have?", ["6", "5", "7", "8"], 0, "A hexagon has 6 sides — 'hexa' means six."],
  [2, "maths_fractions", 4, "What is ¾ of 24?", ["18", "16", "20", "12"], 0, "¼ of 24 is 6, so ¾ is 3 × 6 = 18."],

  // ── KS3 (ages 11–13): pre-GCSE foundations ──
  [3, "maths_number", 1, "Round 6,471 to the nearest hundred.", ["6,500", "6,400", "6,470", "6,000"], 0, "71 is 50 or more, so it rounds up to 6,500."],
  [3, "maths_fractions", 2, "Write ½ as a percentage.", ["5%", "50%", "25%", "100%"], 1, "½ is the same as 50 out of 100, which is 50%."],
  [3, "maths_number", 3, "What is −5 + 8?", ["3", "−3", "13", "−13"], 0, "Starting at −5 and counting up 8 lands on 3."],
  [3, "maths_algebra_linear", 3, "Simplify 2a + 3a.", ["5a", "6a", "5", "23a"], 0, "Add the like terms: 2a + 3a = 5a."],
  [3, "maths_geometry", 4, "How many degrees are there in a right angle?", ["45°", "90°", "180°", "360°"], 1, "A right angle is exactly 90°."],
  [3, "maths_ratio", 5, "Share £40 in the ratio 3:5.", ["£15 and £25", "£20 and £20", "£10 and £30", "£12 and £28"], 0, "There are 8 parts of £5 each: 3 parts = £15, 5 parts = £25."],

  // ════════════════════ ENGLISH ════════════════════
  // ── KS2 (ages 7–10): spelling, simple grammar, comprehension ──
  [2, "eng_spelling", 1, "Which spelling is correct?", ["frend", "friend", "freind", "frien"], 1, "'Friend' is the correct spelling — there's an 'i' before the 'e'."],
  [2, "eng_grammar", 1, "Choose the correct word: 'The cats ___ sleeping.'", ["is", "are", "am", "be"], 1, "'Cats' is plural, so it takes 'are'."],
  [2, "eng_punctuation", 2, "Which sentence ends correctly?", ["Where are you", "Where are you?", "Where are you.", "Where are you,"], 1, "A question always ends with a question mark."],
  [2, "eng_comprehension", 2, "'Sam grinned and jumped for joy.' How does Sam feel?", ["Sad", "Happy", "Angry", "Tired"], 1, "Grinning and jumping for joy show that Sam is happy."],
  [2, "eng_spelling", 3, "What is the plural of 'baby'?", ["babys", "babies", "babyes", "baby's"], 1, "When a word ends in a consonant + 'y', change the 'y' to 'ies': babies."],
  [2, "eng_grammar", 3, "Which word is the noun in 'The dog ran fast'?", ["dog", "ran", "fast", "the"], 0, "'Dog' is a naming word, so it is the noun."],

  // ── KS3 (ages 11–13): pre-GCSE foundations ──
  [3, "eng_grammar", 1, "Which sentence is correct?", ["They was late.", "They were late.", "They is late.", "They be late."], 1, "'They' takes the plural verb 'were'."],
  [3, "eng_punctuation", 2, "Where does the apostrophe go in 'the girls bag' (one girl)?", ["girls'", "girl's", "girls", "gir'ls"], 1, "One girl owns the bag, so the apostrophe goes before the 's': girl's."],
  [3, "eng_comprehension", 3, "'The streets were deserted and silent.' This suggests the place is:", ["crowded", "empty", "noisy", "cheerful"], 1, "'Deserted' and 'silent' tell us the place is empty and quiet."],
  [3, "eng_devices", 3, "'The thunder roared' gives the thunder a living action. This is:", ["simile", "personification", "metaphor", "rhyme"], 1, "Giving a non-living thing a human or animal action is personification."],
  [3, "eng_devices", 4, "'As cold as ice' is an example of a:", ["metaphor", "simile", "pun", "rhyme"], 1, "A simile compares two things using 'as' or 'like'."],
  [3, "eng_analysis", 5, "A writer repeats 'never, never, never'. The main effect is to:", ["save words", "emphasise the point", "confuse the reader", "describe the setting"], 1, "Repetition emphasises and strengthens the writer's point."],

  // ════════════════════ SCIENCE ════════════════════
  // ── KS2 (ages 7–10): everyday science ──
  [2, "sci_body", 1, "Which part of your body do you use to see?", ["Ears", "Eyes", "Nose", "Hands"], 1, "You see with your eyes."],
  [2, "sci_states", 1, "Water turns into ice when it gets:", ["hotter", "colder", "lighter", "faster"], 1, "Cooling water down enough makes it freeze into ice."],
  [2, "sci_ecology", 2, "Which of these is a living thing?", ["Rock", "Tree", "Water", "Cloud"], 1, "A tree is alive — it grows and needs water and light."],
  [2, "sci_cells", 2, "Which living things make their own food using sunlight?", ["Animals", "Plants", "Rocks", "Fungi"], 1, "Plants make their own food from sunlight — this is photosynthesis."],
  [2, "sci_body", 3, "Which organ do you use to breathe?", ["Heart", "Lungs", "Stomach", "Brain"], 1, "Your lungs take in air so you can breathe."],
  [2, "sci_states", 3, "Which of these is a gas at room temperature?", ["Ice", "Water", "Air", "Wood"], 2, "Air is a gas; ice and wood are solids and water is a liquid."],

  // ── KS3 (ages 11–13): pre-GCSE foundations ──
  [3, "sci_states", 1, "What is the process of a solid turning into a liquid called?", ["Freezing", "Melting", "Boiling", "Condensing"], 1, "A solid turning into a liquid is melting."],
  [3, "sci_cells", 2, "Which part of a cell contains the genetic material?", ["Membrane", "Nucleus", "Cytoplasm", "Wall"], 1, "The nucleus holds the cell's DNA."],
  [3, "sci_atoms", 3, "What is the centre of an atom called?", ["Electron", "Nucleus", "Shell", "Ion"], 1, "The nucleus sits at the centre of an atom."],
  [3, "sci_forces", 3, "The force that pulls objects towards the Earth is:", ["friction", "gravity", "magnetism", "tension"], 1, "Gravity pulls objects towards the Earth."],
  [3, "sci_atoms", 4, "Vertical columns in the periodic table are called:", ["periods", "groups", "shells", "rows"], 1, "Vertical columns are groups; horizontal rows are periods."],
  [3, "sci_reactions", 5, "On the pH scale, a strong acid has a pH of about:", ["1", "7", "10", "14"], 0, "Strong acids are near pH 1; 7 is neutral and 14 is strongly alkaline."],
];

/** Flattened KS2/KS3 diagnostic questions ready to seed. */
export const SEED_QUESTIONS_FOUNDATION: SeedQuestion[] = FOUNDATION.map(
  ([key_stage, topic_tag, tier, prompt, options, correct_index, explanation]): SeedQuestion => {
    const topic = SEED_TOPICS.find((t) => t.topic_tag === topic_tag);
    if (!topic) {
      throw new Error(`Foundation question references unknown topic: ${topic_tag}`);
    }
    return {
      topic_tag,
      subject: topic.subject,
      tier,
      key_stage,
      kind: "diagnostic",
      prompt,
      options,
      correct_index,
      explanation,
    };
  },
);

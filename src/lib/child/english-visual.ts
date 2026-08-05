/**
 * Deterministic English question-figure visuals (F1 — extends the maths
 * `deriveMathVisual` + science `deriveScienceVisual` chain into English, the
 * last subject that rendered an empty `<figure>`).
 *
 * English practice questions used to fall straight to the generic AI PNG (or a
 * bare, empty figure). For the common KS2 English shapes we can derive a clearer,
 * free, always-present diagram from the topic + prompt — a spelling-rule word
 * build for a "plural of X" question, or plain letter tiles for a word the
 * question is about — each with a real, honest descriptive `alt`. When the prompt
 * isn't a shape we are confident about, this returns `null` and the caller falls
 * back to the existing (decorative) AI image — never a wrong or misleading figure.
 *
 * Human-derived + deterministic: no AI, no Checker path, no DB, no network, no
 * "server-only". The figures are *illustrative context*: the plural build teaches
 * the SPELLING RULE (which the human-authored explanation already states) — it
 * shows the base word and the ending as separate tiles, so the child still has to
 * apply the rule and pick the correctly-spelled option (it never merges into the
 * finished plural word). Pure, so it is unit-tested like the maths/science derivers.
 */

export type EnglishVisualSpec =
  | {
      kind: "plural_rule";
      /** The base (singular) word, lower-cased, as it appears in the prompt. */
      base: string;
      /** The plural ending the rule adds: "s" | "es" | "ies". */
      ending: string;
      /** A short, human rule reminder (never the finished plural word). */
      rule: string;
      alt: string;
    }
  | {
      kind: "letter_tiles";
      /** A single word the question is about, shown as individual letter tiles. */
      word: string;
      alt: string;
    };

/** Straight + curly single/double quote characters used in authored prompts. */
const Q = "['\"‘’“”]";

/**
 * Decide the plural spelling rule for a base word (pure). KS2 rules only:
 * words ending in s/x/z/ch/sh add "es"; consonant + y becomes "ies"; otherwise
 * just add "s". The returned `rule` text never contains the finished plural.
 */
export function pluralRuleFor(base: string): { ending: string; rule: string } {
  const b = base.toLowerCase();
  const esMatch = b.match(/(ch|sh|s|x|z)$/);
  if (esMatch) {
    return { ending: "es", rule: `Words ending in “${esMatch[1]}” add e-s` };
  }
  if (/[^aeiou]y$/.test(b)) {
    return { ending: "ies", rule: "Change the y to i, then add e-s" };
  }
  return { ending: "s", rule: "Most words just add s" };
}

/**
 * Derive a deterministic English figure from a topic + prompt, or `null` when the
 * prompt isn't a shape we can confidently draw. Ordered most-specific first:
 * a plural spelling-rule build ("plural of X") → plain letter tiles for a single
 * quoted word. Only English topics (`eng_*`) are considered.
 */
export function deriveEnglishVisual(
  topicTag: string,
  prompt: string,
): EnglishVisualSpec | null {
  if (!/^eng/i.test(topicTag)) return null;

  // ── plural spelling rule: "What is the plural of 'box'?" ──
  const plural = prompt.match(new RegExp(`plural of\\s*${Q}?([a-z]+)${Q}?`, "i"));
  if (plural) {
    const base = plural[1].toLowerCase();
    const { ending, rule } = pluralRuleFor(base);
    return {
      kind: "plural_rule",
      base,
      ending,
      rule,
      alt: `Word-building tiles for the plural of “${base}”: ${rule}.`,
    };
  }

  // ── plain letter tiles for a single quoted word the question is about ──
  // (e.g. the opposite of 'begin'). Requires the quotes to wrap ONE word with no
  // spaces, so a quoted sentence never triggers a misleading single-word figure.
  const quoted = prompt.match(new RegExp(`${Q}([a-z][a-z]{2,})${Q}`, "i"));
  if (quoted) {
    const word = quoted[1].toLowerCase();
    return {
      kind: "letter_tiles",
      word,
      alt: `The word “${word}” shown as individual letter tiles.`,
    };
  }

  return null;
}

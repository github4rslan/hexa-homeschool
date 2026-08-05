/**
 * Child "Today I learned" one-tap reflection (F5). Pure + deterministic (no DB,
 * no network, no AI, no `server-only`) so it is unit-tested in tests/.
 *
 * After a child finishes today's quests they may optionally tap ONE friendly
 * chip describing how it felt. Selection-only — there is NO free-text surface, so
 * no distress-gate scan is needed (Children's Code): the child can only ever pick
 * from this fixed, human-authored, encouraging set. Each choice maps to a warm
 * line shown on the PARENT activity feed, turning a bare "completed a lesson" into
 * a small human moment. No profiling, no analytics: it's a single date-keyed note.
 */

export interface ReflectionOption {
  /** Stable enum stored on the event (never a free-text value). */
  key: string;
  /** Child-facing chip label (warm, first-person). */
  chip: string;
  /** Parent-feed phrase, third-person (completes "{Name} …"). */
  feed: string;
}

export const REFLECTIONS: readonly ReflectionOption[] = [
  { key: "faster", chip: "I got faster", feed: "felt faster today" },
  {
    key: "tricky_did_it",
    chip: "It was tricky but I did it",
    feed: "found it tricky but stuck with it",
  },
  { key: "liked_pictures", chip: "I liked the pictures", feed: "enjoyed the pictures today" },
  { key: "proud", chip: "I'm proud of my work", feed: "felt proud of their work" },
  { key: "want_more", chip: "I want to do more", feed: "wanted to keep going" },
] as const;

export type ReflectionKey = (typeof REFLECTIONS)[number]["key"];

const BY_KEY = new Map(REFLECTIONS.map((r) => [r.key, r]));

/** Is a value one of the fixed reflection keys? */
export function isReflectionKey(value: unknown): value is ReflectionKey {
  return typeof value === "string" && BY_KEY.has(value);
}

/** The child-facing chip label for a key, or null if unknown. */
export function reflectionChip(key: string): string | null {
  return BY_KEY.get(key)?.chip ?? null;
}

/**
 * The parent-feed line for a reflection key, e.g. "Ada felt faster today".
 * Falls back to a calm generic when the key is unknown (legacy-safe), never a
 * blank line.
 */
export function reflectionFeedLine(firstName: string, key: string): string {
  const phrase = BY_KEY.get(key)?.feed ?? "shared how today felt";
  return `${firstName} ${phrase}`;
}

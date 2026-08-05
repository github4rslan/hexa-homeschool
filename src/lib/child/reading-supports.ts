/**
 * SEND-aware reading supports for child mode (F3). Pure + deterministic (no DB,
 * no network, no `server-only`) so the normalisation is unit-tested in tests/.
 *
 * Three child-controlled, per-child preferences that make the lesson easier to
 * read for dyslexic / low-vision / SEND learners:
 *   - `font`  — a dyslexia-friendly, well-spaced sans-serif treatment.
 *   - `scale` — a larger text size (whole-lesson zoom).
 *   - `ruler` — a line-focus reading ruler overlay.
 *
 * All default OFF and legacy-safe (undefined ⇒ off / normal). Fully
 * Children's-Code aligned: child-controlled, no tracking, no profiling.
 */

/** Allowed text-size multipliers (Normal / Large / Larger). */
export const TEXT_SCALES = [1, 1.15, 1.3] as const;
export type TextScale = (typeof TEXT_SCALES)[number];
export const DEFAULT_TEXT_SCALE: TextScale = 1;

/** Coerce any stored/submitted value to an allowed scale (fallback: normal). */
export function normalizeTextScale(value: unknown): TextScale {
  const n = typeof value === "number" ? value : Number(value);
  return (TEXT_SCALES as readonly number[]).includes(n)
    ? (n as TextScale)
    : DEFAULT_TEXT_SCALE;
}

/** Human label for a scale (used in the My-stuff control). */
export function textScaleLabel(scale: TextScale): string {
  if (scale === 1.15) return "Large";
  if (scale === 1.3) return "Larger";
  return "Normal";
}

export interface ReadingSupports {
  /** Dyslexia-friendly font + spacing treatment. */
  font: boolean;
  /** Whole-lesson text-size multiplier. */
  scale: TextScale;
  /** Line-focus reading ruler overlay. */
  ruler: boolean;
}

export const NO_READING_SUPPORTS: ReadingSupports = {
  font: false,
  scale: DEFAULT_TEXT_SCALE,
  ruler: false,
};

/** True when a child's SEND indicators mention dyslexia (case-insensitive). */
export function hasDyslexiaIndicator(indicators?: string[] | null): boolean {
  if (!Array.isArray(indicators)) return false;
  return indicators.some((s) => /dyslex/i.test(String(s)));
}

/**
 * Effective dyslexia-friendly-font default for a child (F2).
 *
 * The font is child-controlled, but for a child flagged dyslexic in
 * `send_indicators` we turn it ON *by default* — so the SEND promise is visible
 * without anyone hunting through My-stuff. This only changes the INITIAL default:
 * once the child (or parent) sets the toggle, that explicit choice always wins.
 *   - `reading_font === true`  → on (explicit choice)
 *   - `reading_font === false` → off (explicit choice — beats the SEND default)
 *   - never set (undefined/null) → on iff a dyslexia indicator is present
 */
export function resolveReadingFont(child: {
  reading_font?: boolean | null;
  send_indicators?: string[] | null;
}): boolean {
  if (child.reading_font === true) return true;
  if (child.reading_font === false) return false;
  return hasDyslexiaIndicator(child.send_indicators);
}

/** Build the effective supports from a child doc's (legacy-safe) fields. */
export function readingSupportsFromChild(child: {
  reading_font?: boolean | null;
  text_scale?: number;
  reading_ruler?: boolean;
  send_indicators?: string[] | null;
}): ReadingSupports {
  return {
    font: resolveReadingFont(child),
    scale: normalizeTextScale(child.text_scale),
    ruler: child.reading_ruler === true,
  };
}

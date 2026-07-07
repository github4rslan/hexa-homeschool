/**
 * Karaoke caption timing (Wave 8, Feature 5 — shared Read-Along alignment).
 *
 * ElevenLabs' with-timestamps endpoint returns CHARACTER-level alignment; the
 * captions need WORD-level timings. These pure helpers do that mapping (and
 * pick the word to highlight for a playback time) so both the `/api/tts` route
 * and the client agree on one format, and it's all unit-testable.
 *
 * Framework-free and import-safe from server routes, client components and
 * Vitest — keep it that way.
 */

export interface WordTiming {
  word: string;
  /** Seconds from the start of the clip. */
  start: number;
  end: number;
}

export interface CharAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

/** Collapse character-level alignment into per-word start/end times. */
export function charAlignmentToWords(alignment: CharAlignment): WordTiming[] {
  const words: WordTiming[] = [];
  let current = "";
  let start = 0;
  let end = 0;

  for (let i = 0; i < alignment.characters.length; i++) {
    const ch = alignment.characters[i] ?? "";
    const s = alignment.character_start_times_seconds[i] ?? end;
    const e = alignment.character_end_times_seconds[i] ?? s;
    if (/\s/.test(ch) || ch === "") {
      if (current) {
        words.push({ word: current, start, end });
        current = "";
      }
      continue;
    }
    if (!current) start = s;
    current += ch;
    end = e;
  }
  if (current) words.push({ word: current, start, end });
  return words;
}

/**
 * The word to highlight at playback time `t`: the last word that has started.
 * −1 before the first word. Monotonic in `t`, so the highlight only ever moves
 * forward with the voice (calm, never flickering back).
 */
export function currentWordIndex(words: WordTiming[], t: number): number {
  let index = -1;
  for (let i = 0; i < words.length; i++) {
    if (words[i].start <= t) index = i;
    else break;
  }
  return index;
}

/**
 * Validate word timings that crossed a network/storage boundary (API JSON,
 * `meta.words` on a media record). Anything malformed → null, so a bad payload
 * degrades to the plain per-step caption instead of a broken highlight.
 */
export function normalizeWordTimings(raw: unknown): WordTiming[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const words: WordTiming[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const w = item as Partial<WordTiming>;
    if (
      typeof w.word !== "string" ||
      typeof w.start !== "number" ||
      typeof w.end !== "number" ||
      !Number.isFinite(w.start) ||
      !Number.isFinite(w.end)
    ) {
      return null;
    }
    words.push({ word: w.word, start: w.start, end: w.end });
  }
  return words;
}

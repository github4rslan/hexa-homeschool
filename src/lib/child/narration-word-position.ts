/**
 * Narration word position (F4, Wave 8 follow-up): a tiny module-singleton
 * store publishing the on-screen Y position of the word currently lit by a
 * karaoke caption, so `ReadingRuler` (mounted separately in `FocusFrame`, a
 * different part of the tree) can follow the narrated word instead of only
 * the pointer, without prop-drilling across unrelated component subtrees.
 *
 * Mirrors the existing `NarrationController` module-singleton pattern
 * (`use-narration.ts`): one shared store, `useSyncExternalStore`-friendly,
 * degrades to `null` (pure pointer-follow, today's behaviour) whenever no
 * caption is actively narrating a word. Position-only: no word text, no
 * timing, no event is ever recorded, this purely mirrors where the child's
 * eyes are already being drawn by the audio.
 */

let activeWordY: number | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

/** Called by the karaoke caption renderer as its lit word changes (or clears). */
export function reportNarratedWordY(y: number | null): void {
  if (activeWordY === y) return;
  activeWordY = y;
  emit();
}

export function getNarratedWordY(): number | null {
  return activeWordY;
}

export function subscribeNarratedWordY(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

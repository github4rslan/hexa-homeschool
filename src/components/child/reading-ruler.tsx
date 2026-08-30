"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getNarratedWordY,
  subscribeNarratedWordY,
} from "@/lib/child/narration-word-position";

/**
 * Line-focus reading ruler (F3, SEND support). A soft translucent strip that
 * follows the pointer / finger vertically, gently dimming the lines above and
 * below so a child can keep their place while reading. Opt-in (child-controlled
 * in "My stuff"); rendered over the lesson only when enabled.
 *
 * Pointer-following is not vestibular motion, but we still honour
 * `prefers-reduced-motion` by dropping the smoothing transition and never
 * animating opacity — the band simply tracks position with no easing. The
 * overlay is `pointer-events-none` so it never blocks taps on the lesson.
 *
 * F4 (2026-08-30): while a karaoke caption is actively narrating a word (see
 * `narration-word-position.ts`) and the child hasn't touched the screen in
 * the last second, the ruler follows the narrated word instead of requiring
 * a manual finger-drag. The instant the child touches or drags, pointer-follow
 * takes back over immediately, so a deliberate re-read is never fought.
 */
const BAND_HEIGHT = 64; // px — comfortably taller than a line of child-mode text
/** How long after the last pointer move before narration may take over. */
const POINTER_IDLE_MS = 1000;

export function ReadingRuler() {
  const [y, setY] = useState<number | null>(null);
  const frame = useRef<number | null>(null);
  const lastPointerMoveAt = useRef<number>(0);
  const narratedY = useSyncExternalStore(
    subscribeNarratedWordY,
    getNarratedWordY,
    () => null,
  );

  useEffect(() => {
    const onMove = (clientY: number) => {
      lastPointerMoveAt.current = Date.now();
      if (frame.current != null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        setY(clientY);
      });
    };
    const handlePointer = (e: PointerEvent) => onMove(e.clientY);
    const handleTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) onMove(t.clientY);
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("touchmove", handleTouch, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("touchmove", handleTouch);
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, []);

  // Narration only takes over once the child has been hands-off for a beat,
  // and only while there is a genuinely narrated word position to follow.
  const pointerIdle = Date.now() - lastPointerMoveAt.current >= POINTER_IDLE_MS;
  const effectiveY = narratedY != null && pointerIdle ? narratedY : y;

  // Before the first move (and no narration to follow) there's nothing to
  // focus on, so render nothing.
  if (effectiveY == null) return null;

  const top = Math.max(0, effectiveY - BAND_HEIGHT / 2);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40"
      // Clear reading band via a mask: dim everything except a horizontal strip.
      style={{
        background: "rgba(10, 14, 20, 0.28)",
        WebkitMaskImage: `linear-gradient(to bottom, black 0, black ${top}px, transparent ${top}px, transparent ${top + BAND_HEIGHT}px, black ${top + BAND_HEIGHT}px, black 100%)`,
        maskImage: `linear-gradient(to bottom, black 0, black ${top}px, transparent ${top}px, transparent ${top + BAND_HEIGHT}px, black ${top + BAND_HEIGHT}px, black 100%)`,
      }}
    />
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

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
 */
const BAND_HEIGHT = 64; // px — comfortably taller than a line of child-mode text

export function ReadingRuler() {
  const [y, setY] = useState<number | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const onMove = (clientY: number) => {
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

  // Before the first move there's nothing to focus — render nothing.
  if (y == null) return null;

  const top = Math.max(0, y - BAND_HEIGHT / 2);

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

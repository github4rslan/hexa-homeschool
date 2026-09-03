"use client";

import { useEffect } from "react";
import { useReducedMotion } from "motion/react";

/**
 * F3 — a short, self-contained confetti pop for the single biggest child
 * moments (a topic certified, the certificate screen). Delight is ADDITIVE and
 * never a checkpoint:
 *
 *  - Fully neutralised under prefers-reduced-motion (no burst at all) — gated
 *    twice: the effect early-returns AND canvas-confetti's own
 *    `disableForReducedMotion` is set, so nothing moves.
 *  - Never blocks or delays input — canvas-confetti renders a fixed,
 *    pointer-events-none overlay canvas, so a tap always lands on the UI
 *    beneath; the child is never gated behind the animation.
 *  - Never tracks, times, profiles or records the child (Children's Code):
 *    it is purely visual, with no event or timing sent anywhere.
 *  - Self-hosted: canvas-confetti is bundled from node_modules and imported
 *    dynamically — there is NO CDN or network fetch in the (child) route.
 *
 * Fires once per mount. The dynamic import keeps the ~2KB library out of the
 * initial bundle and off the server render.
 */
export function ConfettiBurst() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const fire = (particleRatio: number, opts: Record<string, unknown>) =>
        confetti({
          origin: { y: 0.62 },
          disableForReducedMotion: true,
          colors: ["#A78BFA", "#FBBF24", "#67E8F9", "#6EFFC6"],
          particleCount: Math.floor(120 * particleRatio),
          ...opts,
        });

      // A single warm pop in a few overlapping bursts (no looping, ~1s).
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    });

    return () => {
      cancelled = true;
    };
  }, [reduced]);

  return null;
}

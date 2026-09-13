"use client";

import { MotionConfig } from "motion/react";
import { useHydrationSafeReducedMotion } from "@/components/fx/use-hydration-safe-reduced-motion";

/**
 * Global reduced-motion honouring for framer-motion.
 *
 * framer-motion's JS-driven transitions are NOT neutralised by the globals.css
 * `animation-duration: 0.01ms` rule (that only affects CSS animations), so
 * without this a `prefers-reduced-motion` user still receives every blur / slide
 * / parallax entrance across the ~16 marketing components. WCAG 2.3.3 +
 * Children's Code.
 *
 * B1 (2026-09-13): `reducedMotion="user"` makes every nested `m`/`motion`
 * component defer to framer-motion's OWN `useReducedMotion`, which resolves
 * the real `prefers-reduced-motion` media query synchronously during the
 * client render that hydrates, while the server always renders as unset. For
 * any real visitor with reduced motion enabled, every animated homepage
 * component (Hero, StatsStrip, Problem, ...) hydrated to different markup
 * than the server sent, a sitewide-under-the-provider source of React's
 * hydration-mismatch error (#418), not a per-component one. Resolving the
 * preference ourselves via a hydration-safe hook and passing an explicit
 * "always"/"never" removes framer-motion's own synchronous, render-phase
 * detection from the equation entirely.
 */
export function ReducedMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced = useHydrationSafeReducedMotion();
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
}

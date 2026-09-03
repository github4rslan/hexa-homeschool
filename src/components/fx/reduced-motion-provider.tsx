"use client";

import { MotionConfig } from "motion/react";

/**
 * Global reduced-motion honouring for framer-motion.
 *
 * framer-motion's JS-driven transitions are NOT neutralised by the globals.css
 * `animation-duration: 0.01ms` rule (that only affects CSS animations), so
 * without this a `prefers-reduced-motion` user still receives every blur / slide
 * / parallax entrance across the ~16 marketing components. `reducedMotion="user"`
 * defers to the OS setting: motion-OK users see no change, and reduce-motion
 * users get transform/layout animations dropped automatically everywhere inside.
 * WCAG 2.3.3 + Children's Code.
 */
export function ReducedMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

"use client";

import { useEffect, useState } from "react";
import { useReducedMotion as useFramerReducedMotion } from "motion/react";

/**
 * Framer Motion's own `useReducedMotion` resolves the real
 * `prefers-reduced-motion` media query synchronously during the render that
 * hydrates on the client (not inside an effect), while the server always
 * renders as if the preference were unset (`null`, coerced falsy). A
 * component that branches its rendered output (text, inline style, initial
 * animation state) directly on that value can therefore hydrate to a
 * different result than the server sent whenever a real visitor's OS/browser
 * has reduced motion enabled, which React reports as a hydration error.
 *
 * This wrapper keeps the server-safe default (`false`) for the render that
 * hydrates, then applies the real preference one effect later, the same
 * "move the non-deterministic value into useEffect plus state" pattern used
 * for every other client-only value in this codebase.
 */
export function useHydrationSafeReducedMotion(): boolean {
  const prefersReduced = useFramerReducedMotion();
  const [safeValue, setSafeValue] = useState(false);

  useEffect(() => {
    setSafeValue(!!prefersReduced);
  }, [prefersReduced]);

  return safeValue;
}

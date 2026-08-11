"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/**
 * Loads only the DOM animation feature set (animations + variants + exit +
 * hover/tap/focus/inView gestures) for framer-motion's lightweight `m`
 * components used across the marketing group. No marketing component uses
 * layout or drag, so `domAnimation` is sufficient and we avoid shipping the
 * full feature bundle for the `m.*` surfaces.
 *
 * Non-strict on purpose: shared fx components rendered inside the marketing
 * tree still use the full `motion.*` API, and strict mode would throw on those.
 */
export function LazyMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}

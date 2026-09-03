"use client";

import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";

/**
 * F8 — a felt confirmation flourish when a weekly plan is approved. Before
 * this, "Approve this week" just disappeared and a static badge took its
 * place; this is the one primary, once-a-week family action that had no
 * micro-interaction at all. The badge only mounts once `approved_by_parent`
 * flips true (a different element replaces the "Approve" form at that exact
 * position), so a plain framer-motion mount entrance — a checkmark draw-in
 * plus a soft one-shot scale pulse — fires exactly once, never on every
 * re-render. `useReducedMotion` collapses it to the finished, static badge.
 */
export function ApprovedBadge() {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <Badge variant="neon" size="lg">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <motion.path
            d="M5 13l4 4L19 7"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
          />
        </svg>
        Approved
      </Badge>
    </motion.div>
  );
}

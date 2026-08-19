"use client";

import { motion, type Transition, type TargetAndTransition } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AccentPreset } from "@/lib/child/accents";

/**
 * F7 — a lightweight, self-hosted reactive face for Eddie (previously a name
 * and a caption everywhere, never a face). v1 is plain inline SVG/CSS, not a
 * Lottie asset: zero network dependency in `(child)`, cheap on the bundle,
 * and every state is a simple geometric curve framer-motion can animate.
 *
 * Four moods, tied to the same signals the surrounding copy already reacts
 * to (`isCorrect`, a miss, mastery):
 *  - "neutral"     — idle, gentle breathing bob.
 *  - "warm-nod"    — a per-question correct answer: a quick approving nod.
 *  - "encouraging" — a miss: a soft reassuring sway. Calm-wrong law: the
 *    mouth NEVER inverts into a frown and there is no red/shake — this reads
 *    as "have another go", never as disappointment or distress.
 *  - "celebrating" — mastery: a bigger bounce + tilt flourish.
 *
 * Fully neutralised under `prefers-reduced-motion` (both the global provider
 * and this local `reduced` guard collapse it to a single static face) and
 * `pointer-events-none` + `aria-hidden` — purely decorative, it never blocks,
 * gates or delays the child's input, and the adjacent text always carries the
 * actual meaning.
 */

export type EddieMood = "neutral" | "warm-nod" | "encouraging" | "celebrating";

const MOTION: Record<EddieMood, { animate: TargetAndTransition; transition: Transition }> = {
  neutral: {
    animate: { scale: [1, 1.03, 1], y: 0, rotate: 0 },
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
  "warm-nod": {
    animate: { y: [0, -3, 0], rotate: [0, 4, -4, 0], scale: 1 },
    transition: { duration: 0.7, ease: "easeInOut" },
  },
  encouraging: {
    animate: { rotate: [0, -6, 6, 0], scale: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  celebrating: {
    animate: { rotate: [0, 9, -9, 5, 0], scale: [1, 1.16, 1], y: [0, -7, 0] },
    transition: { duration: 1, ease: "easeInOut" },
  },
};

// A simple upward-curving mouth per mood — deliberately never inverted into a
// frown, even for "encouraging", per the calm-wrong law (no sad/disappointed
// face is ever shown to a child on a miss).
const MOUTH: Record<EddieMood, string> = {
  neutral: "M9 15 Q12 17 15 15",
  "warm-nod": "M9 14.5 Q12 18 15 14.5",
  encouraging: "M9 15.5 Q12 17 15 15.5",
  celebrating: "M8 14 Q12 19.5 16 14",
};

const EYE_RADIUS: Record<EddieMood, number> = {
  neutral: 1.4,
  "warm-nod": 1.4,
  encouraging: 1.3,
  celebrating: 1.6,
};

export function EddieAvatar({
  mood,
  accent,
  reduced,
  className,
}: {
  mood: EddieMood;
  accent: AccentPreset;
  /** `useReducedMotion()` return value — collapses to a static face. */
  reduced: boolean | null;
  className?: string;
}) {
  const { animate, transition } = MOTION[mood];
  const r = EYE_RADIUS[mood];
  return (
    <motion.div
      aria-hidden
      animate={reduced ? undefined : animate}
      transition={reduced ? undefined : transition}
      className={cn(
        "pointer-events-none flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
        accent.bg,
        accent.border,
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className={cn("h-6 w-6", accent.text)} fill="none">
        <circle cx="8.5" cy="10" r={r} fill="currentColor" />
        <circle cx="15.5" cy="10" r={r} fill="currentColor" />
        <path
          d={MOUTH[mood]}
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </motion.div>
  );
}

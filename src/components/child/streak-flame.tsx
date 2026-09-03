"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Flame } from "lucide-react";

/**
 * Streak flame + count for the child header. Animates a gentle +1 pop the first
 * time it renders on a day the child has already completed a lesson (so the
 * day's first completion feels celebrated). No pressure copy, ever — this only
 * shows presence, never warns about loss. Respects prefers-reduced-motion.
 */
export function StreakFlame({
  count,
  completedToday,
}: {
  count: number;
  completedToday: boolean;
}) {
  const reduce = useReducedMotion();
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (completedToday && !reduce) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 700);
      return () => clearTimeout(t);
    }
  }, [completedToday, reduce]);

  if (count <= 0) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5"
      title={`${count}-day streak`}
    >
      <motion.span
        animate={pop ? { scale: [1, 1.35, 1] } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-amber-300"
      >
        <Flame className="h-5 w-5" fill="currentColor" />
      </motion.span>
      <span className="text-base font-semibold text-amber-200">{count}</span>
    </div>
  );
}

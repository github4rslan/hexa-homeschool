"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { REFLECTIONS } from "@/lib/child/reflection";
import { submitReflection } from "@/app/(child)/learn/actions";

/**
 * "Today I learned" one-tap reflection (F5). Appears calmly once the child has
 * finished today's quests. Fully optional and skippable — never a gate to
 * finishing. Selection-only chips (no free text ⇒ no distress-gate surface); the
 * choice becomes a warm line on the PARENT activity feed. One write per child per
 * day; a re-tap simply updates the choice. Human-authored copy, no AI, no
 * tracking.
 */
export function TodayReflection({
  accentText,
  initialKey = null,
}: {
  accentText: string;
  initialKey?: string | null;
}) {
  const [picked, setPicked] = useState<string | null>(initialKey);
  const [pending, startTransition] = useTransition();

  function choose(key: string) {
    setPicked(key);
    startTransition(async () => {
      await submitReflection(key);
    });
  }

  return (
    <div className="child-panel mt-5 p-6 text-center">
      <h2 className="text-2xl font-semibold text-fog-50">
        Nice work today! 🌟
      </h2>
      <p className="mt-1 text-fog-300">
        Want to share how it felt? Tap one — or skip, that&apos;s okay too.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {REFLECTIONS.map((r) => {
          const isPicked = picked === r.key;
          return (
            <motion.button
              key={r.key}
              type="button"
              onClick={() => choose(r.key)}
              disabled={pending}
              whileTap={{ scale: 0.94 }}
              className={`child-touch rounded-2xl border px-4 py-2.5 text-base font-medium transition-all disabled:opacity-70 ${
                isPicked
                  ? "border-rose-400/60 bg-rose-500/15 text-fog-50"
                  : "border-white/10 bg-white/[0.03] text-fog-200 hover:border-white/30 hover:bg-white/5"
              }`}
            >
              {r.chip}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {picked && (
          <motion.p
            key="reflection-thanks"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`mt-4 text-sm font-medium ${accentText}`}
          >
            Thanks for sharing! 💛
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

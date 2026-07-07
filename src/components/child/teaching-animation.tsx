"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccentPreset } from "@/lib/child/accents";
import type { TeachingAnimation as TeachingAnimationData } from "@/lib/child/teaching-animations";

export function TeachingAnimation({
  animation,
  accent,
}: {
  animation: TeachingAnimationData;
  accent: AccentPreset;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "mt-6 overflow-hidden rounded-3xl border p-5",
        accent.softBg,
        accent.softBorder,
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
            accent.bg,
            accent.border,
          )}
        >
          <Sparkles className={cn("h-5 w-5", accent.text)} aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-fog-50">
            {animation.title}
          </h2>
          <p className="mt-1 text-base leading-relaxed text-fog-300">
            {animation.intro}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {animation.steps.map((step, index) => (
          <motion.div
            key={`${step.label}-${index}`}
            initial={reduced ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.28,
              delay: reduced ? 0 : index * 0.16,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-[9rem_1fr]"
          >
            <div className="flex items-center gap-3">
              <motion.span
                initial={reduced ? false : { scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 18,
                  delay: reduced ? 0 : index * 0.16,
                }}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold",
                  accent.bg,
                  accent.text,
                )}
              >
                {index + 1}
              </motion.span>
              <span className="text-sm font-semibold uppercase tracking-wider text-fog-400">
                {step.label}
              </span>
            </div>
            <div>
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.28,
                  delay: reduced ? 0 : index * 0.16 + 0.08,
                }}
                className="font-mono text-2xl font-semibold text-fog-50"
              >
                {step.expression}
              </motion.div>
              <p className="mt-1 text-base leading-relaxed text-fog-300">
                {step.note}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

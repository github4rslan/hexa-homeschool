"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calculator,
  BookText,
  FlaskConical,
  ArrowRight,
  Check,
  HeartHandshake,
} from "lucide-react";
import { Celebration } from "@/components/fx/celebration";

/**
 * Today's quests — the day's subjects as 2–3 cards that show a checkmark once
 * the child has completed a lesson in that subject today. When every quest is
 * done, a single calm celebration plays once (reduced-motion → static star).
 *
 * No pressure mechanics: no timers, no "don't lose your streak", no guilt copy.
 * Quests reward presence only.
 */

const ICONS = {
  mathematics: Calculator,
  english: BookText,
  science: FlaskConical,
} as const;

export interface Quest {
  id: "mathematics" | "english" | "science";
  label: string;
  accent: string; // tailwind gradient classes
  ring: string;
  href: string;
  done: boolean;
  /** Resting for a five-attempt tutor handoff — shown calmly, never as failure. */
  resting?: boolean;
  progressLabel: string;
  progressPct: number;
}

export function QuestCards({ quests }: { quests: Quest[] }) {
  const reduce = useReducedMotion();
  const allDone = quests.length > 0 && quests.every((q) => q.done);
  // Only celebrate when arriving with everything already done for the day.
  const [showCelebration] = useState(allDone);

  return (
    <div className="relative grid gap-5">
      {allDone && showCelebration && (
        <div className="pointer-events-none absolute inset-x-0 -top-4 flex justify-center">
          <Celebration big variant={2} />
        </div>
      )}

      {allDone && (
        <p className="text-center text-lg font-semibold text-neon-300">
          All of today&apos;s quests done — brilliant. 🎉
        </p>
      )}

      {quests.map((q) => {
        const Icon = ICONS[q.id];
        return (
          <Link
            key={q.id}
            href={q.href}
            className={[
              "child-touch child-panel group flex items-center gap-5 p-6 transition-all hover:scale-[1.01]",
              q.done ? "opacity-90" : "",
            ].join(" ")}
          >
            <div
              className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${q.accent} text-white`}
            >
              <Icon className="h-9 w-9" />
              {q.done && !q.resting && (
                <motion.span
                  initial={reduce ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-void bg-neon-500 text-void"
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </motion.span>
              )}
              {q.resting && (
                <span className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-void bg-amber-400 text-void">
                  <HeartHandshake className="h-4 w-4" strokeWidth={2.5} />
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-2xl font-semibold text-fog-50">
                {q.label}
                {q.resting ? (
                  <span className="text-sm font-medium text-amber-300">
                    resting
                  </span>
                ) : (
                  q.done && (
                    <span className="text-sm font-medium text-neon-300">
                      done today
                    </span>
                  )
                )}
              </div>
              {q.resting ? (
                <p className="mt-2 text-base text-fog-300">
                  A tutor is coming to help — pick this back up soon. 💛
                </p>
              ) : (
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-neon-400"
                      style={{ width: `${q.progressPct}%` }}
                    />
                  </div>
                  <span className={`text-sm font-semibold ${q.ring}`}>
                    {q.progressLabel}
                  </span>
                </div>
              )}
            </div>
            <ArrowRight className="h-7 w-7 text-fog-400 transition-transform group-hover:translate-x-1" />
          </Link>
        );
      })}
    </div>
  );
}

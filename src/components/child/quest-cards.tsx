"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

// Active quest cards are tapped on touch, where :hover never fires. A
// motion-wrapped Link lets the card press down under the finger so a tap feels
// alive before navigation. Reduced-motion collapses whileTap to nothing.
const MotionLink = motion(Link);
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
  /** Optional extra-practice route used after a subject is certified. */
  practiceHref?: string;
  done: boolean;
  /** All 10 course topics are certified; the subject mock is the next step. */
  certified?: boolean;
  /** Resting for a five-attempt tutor handoff — shown calmly, never as failure. */
  resting?: boolean;
  /** No in-band lesson seeded yet — a calm "coming soon" card, never a dead link. */
  comingSoon?: boolean;
  /** This subject is the parent's planned focus for today — a gentle "start here"
   *  nudge + lead position. Advisory only: the child can still pick any subject. */
  todaysPlan?: boolean;
  progressLabel: string;
  progressPct: number;
}

export function QuestCards({ quests }: { quests: Quest[] }) {
  const reduce = useReducedMotion();
  const allDone = quests.length > 0 && quests.every((q) => q.done);
  // Only celebrate when arriving with everything already done for the day.
  const [showCelebration] = useState(allDone);

  return (
    <div className="relative grid min-w-0 gap-5">
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
        // A resting topic has nothing to do — tapping it only bounced the child
        // into a "nothing here right now" pause and back. Render it as a calm,
        // non-interactive card (no link, no arrow, no hover) instead of a
        // dead-end. Active quests stay full links.
        const inner = (
          <>
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
              <div className="flex flex-wrap items-center gap-2 text-2xl font-semibold text-fog-50">
                {q.label}
                {q.todaysPlan && (
                  <span className="rounded-full bg-neon-500/15 px-2.5 py-0.5 text-sm font-semibold text-neon-200">
                    Start here · today&apos;s plan
                  </span>
                )}
                {q.resting ? (
                  <span className="text-sm font-medium text-amber-300">
                    resting
                  </span>
                ) : q.comingSoon ? (
                  <span className="text-sm font-medium text-fog-400">
                    coming soon
                  </span>
                ) : (
                  q.certified ? (
                    <span className="text-sm font-medium text-neon-300">
                      certified
                    </span>
                  ) : (
                    q.done && (
                      <span className="text-sm font-medium text-neon-300">
                        done today
                      </span>
                    )
                  )
                )}
              </div>
              {q.certified && !q.resting ? (
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="flex-1 text-base text-fog-300">
                    You completed 10/10 certified topics. Your {q.label} mock exam is unlocked.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={q.href}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-neon-400/30 bg-neon-500/10 px-4 text-base font-semibold text-neon-200 hover:border-neon-300/60"
                    >
                      Go to mock
                    </Link>
                    <Link
                      href={q.practiceHref ?? q.href}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base font-semibold text-fog-100 hover:border-white/25 hover:bg-white/[0.06]"
                    >
                      Practice more
                    </Link>
                  </div>
                </div>
              ) : q.resting ? (
                <p className="mt-2 text-base text-fog-300">
                  A tutor is coming to help — pick this back up soon. 💛
                </p>
              ) : q.comingSoon ? (
                <p className="mt-2 text-base text-fog-300">
                  New {q.label} quests are on their way — try another subject
                  today. ✨
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
              {!q.certified && q.resting ? null : q.certified ? (
                <div className="mt-3 flex items-center gap-3">
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
              ) : null}
            </div>
            {!q.resting && !q.certified && !q.comingSoon && (
              <ArrowRight className="h-7 w-7 text-fog-400 transition-transform group-hover:translate-x-1" />
            )}
          </>
        );

        if (q.resting) {
          return (
            <div
              key={q.id}
              className="child-panel flex items-center gap-5 p-6 opacity-90"
              aria-label={`${q.label} is resting while a tutor is lined up`}
            >
              {inner}
            </div>
          );
        }

        if (q.comingSoon) {
          return (
            <div
              key={q.id}
              className="child-panel flex items-center gap-5 p-6 opacity-90"
              aria-label={`${q.label} quests are coming soon`}
            >
              {inner}
            </div>
          );
        }

        if (q.certified) {
          return (
            <div
              key={q.id}
              className="child-panel flex items-center gap-5 p-6 opacity-90"
            >
              {inner}
            </div>
          );
        }

        return (
          <MotionLink
            key={q.id}
            href={q.href}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            className={[
              "child-touch child-panel group flex items-center gap-5 p-6 transition-all hover:scale-[1.01]",
              q.done ? "opacity-90" : "",
              q.todaysPlan ? "ring-2 ring-neon-400/50" : "",
            ].join(" ")}
          >
            {inner}
          </MotionLink>
        );
      })}
    </div>
  );
}

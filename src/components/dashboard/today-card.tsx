"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Circle,
  Flame,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { TodayCard as TodayCardData } from "@/lib/db/repo";

const SUBJECT_LABEL: Record<string, string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};

/**
 * Per-child "today" card for the dashboard command center. Shows today's
 * plan-mirrored quests with live done-state, the streak, reviews due, and any
 * open escalation (calm phrasing) — each row deep-links. When everything is
 * done it celebrates quietly. Respects prefers-reduced-motion (no entrance
 * motion, no flashing) and never tracks the child (parent surface only).
 */
export function TodayCard({ card, index }: { card: TodayCardData; index: number }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: reduce ? 0 : index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-fog-50">{card.childName}</h3>
        <div className="flex items-center gap-3 text-xs text-fog-400">
          {card.streak > 0 && (
            <span className="inline-flex items-center gap-1">
              <Flame
                className={card.completedToday ? "h-3.5 w-3.5 text-amber-400" : "h-3.5 w-3.5 text-fog-500"}
              />
              {card.streak}-day streak
            </span>
          )}
          {card.reviewsDue > 0 && (
            <Link
              href="/learn/warmup"
              className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {card.reviewsDue} review{card.reviewsDue === 1 ? "" : "s"} due
            </Link>
          )}
        </div>
      </div>

      {card.openEscalations > 0 && (
        <Link
          href="/tutoring#escalations"
          className="mb-4 flex items-center gap-2 rounded-xl border border-crimson-400/30 bg-crimson-500/10 px-3 py-2 text-xs text-crimson-300 hover:border-crimson-400/50"
        >
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          A lesson was paused — check in and message the team
          <ArrowRight className="ml-auto h-3.5 w-3.5" />
        </Link>
      )}

      {card.allDone ? (
        <div className="flex items-center gap-3 rounded-xl border border-neon-400/20 bg-neon-500/[0.05] px-4 py-4">
          <Sparkles className="h-5 w-5 text-neon-400" />
          <p className="text-sm text-fog-200">
            All done for today
            {card.certifiedToday ? (
              <>
                {" "}
                — {card.childName.split(" ")[0]} certified{" "}
                <span className="font-semibold text-neon-300">{card.certifiedToday}</span> ✨
              </>
            ) : (
              <> — lovely work ✨</>
            )}
          </p>
        </div>
      ) : card.quests.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {card.quests.map((q) => (
            <li key={q.topicTag}>
              <Link
                href={`/learn/lesson?topic=${encodeURIComponent(q.topicTag)}`}
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 transition-colors hover:border-violet-400/40"
              >
                <span
                  className={
                    q.done
                      ? "flex h-5 w-5 items-center justify-center rounded-full border border-neon-400/50 bg-neon-500/15 text-neon-400"
                      : "flex h-5 w-5 items-center justify-center rounded-full border border-white/15 text-fog-500"
                  }
                >
                  {q.done ? <Check className="h-3 w-3" /> : <Circle className="h-1.5 w-1.5 fill-current" />}
                </span>
                <span className={q.done ? "flex-1 text-sm text-fog-400 line-through decoration-fog-600" : "flex-1 text-sm text-fog-100"}>
                  {q.topicTitle}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-fog-500">
                  {SUBJECT_LABEL[q.subject] ?? q.subject}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-fog-600 transition-colors group-hover:text-violet-300" />
              </Link>
            </li>
          ))}
        </ul>
      ) : card.hasApprovedWeek ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-4">
          <p className="text-sm text-fog-200">
            Nothing scheduled for {card.childName.split(" ")[0]} today, this
            week&apos;s plan is already set.
          </p>
          <Link
            href={`/schedule?child=${encodeURIComponent(card.childId)}`}
            className="group mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-fog-300 transition-colors hover:text-fog-100"
          >
            View the week
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.06] px-4 py-4">
          <p className="text-sm text-fog-200">
            {card.childName.split(" ")[0]} doesn&apos;t have a plan yet — set up
            this week in one tap.
          </p>
          <Link
            href={`/schedule?child=${encodeURIComponent(card.childId)}`}
            className="group mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-200 transition-colors hover:border-violet-300/60 hover:bg-violet-500/25"
          >
            <Sparkles className="h-4 w-4" />
            Generate {card.childName.split(" ")[0]}&apos;s week
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </motion.div>
  );
}

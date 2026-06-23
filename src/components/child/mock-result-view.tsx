"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Celebration } from "@/components/fx/celebration";

/**
 * Shared, encouraging mock grade reveal (Assessment lock). Used by the in-run
 * results screen (mock-exam-player) AND the read-only "already done this period"
 * view, so the considered reveal is never forked. Effort-framed, calm,
 * non-comparative; reduced-motion safe (no burst, static when reduced).
 */
export function MockGradeReveal({
  subjectLabel,
  indicativeGrade,
  detail,
  reduce,
}: {
  subjectLabel: string;
  indicativeGrade: string;
  /** Optional sub-line, e.g. "You got 7 of 10 right." */
  detail?: string;
  reduce: boolean;
}) {
  const grade = indicativeGrade.toLowerCase();
  return (
    <div className="relative py-8 text-center">
      {!reduce && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <Celebration big variant={3} />
        </div>
      )}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="text-lg text-fog-300">Your work is paying off —</p>
        <p className="mt-1 text-3xl font-semibold text-fog-50">
          {subjectLabel} is at a{" "}
          <span className="text-neon-300">{grade}</span> level today.
        </p>
        {detail && <p className="mt-3 text-xl text-fog-300">{detail}</p>}
      </motion.div>
    </div>
  );
}

/**
 * Read-only result for a subject's mock already sat THIS period. Shows the
 * stored indicative grade (never recomputed), when the next mock unlocks, and
 * forward CTAs only — no "try again". Rendered by the run page when locked.
 */
export function MockResultView({
  subjectLabel,
  indicativeGrade,
  scorePct,
  nextAvailableLabel,
}: {
  subjectLabel: string;
  indicativeGrade: string;
  scorePct: number;
  nextAvailableLabel: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/learn/mock"
        className="child-touch mb-6 inline-flex items-center gap-2 text-base text-fog-300 hover:text-fog-100"
      >
        <ArrowLeft className="h-5 w-5" /> Back
      </Link>

      <div className="child-panel p-6 sm:p-8">
        <MockGradeReveal
          subjectLabel={subjectLabel}
          indicativeGrade={indicativeGrade}
          detail={`You scored ${Math.round(scorePct)}% this week.`}
          reduce={!!reduce}
        />

        <p className="mt-2 text-center text-base text-fog-400">
          You&apos;ve done your {subjectLabel} mock for this week — lovely work.
          Your next one unlocks on {nextAvailableLabel}.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/learn/map"
            className="child-touch inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-lg font-semibold text-fog-100 hover:border-white/30"
          >
            See my journey
          </Link>
          <Link
            href="/learn"
            className="child-touch inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 px-8 py-4 text-lg font-semibold text-white"
          >
            Back to learning <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

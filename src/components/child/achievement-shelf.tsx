"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Trophy, Star, Lock } from "lucide-react";
import Link from "next/link";
import type { EarnedBadge } from "@/lib/engine/achievements";
import { cn } from "@/lib/utils";

/**
 * F10 — a warm "shelf" of earned topic badges on My journey. Each certified
 * topic is a collectible badge (subject accent + earned date); the remaining
 * slots show as calm "not yet" placeholders so the child sees what's still to
 * collect — never punitive, never red. Read-only over the competence map (no
 * analytics, no profiling). A badge links to its saveable certificate (F5).
 */

const ACCENT: Record<string, { ring: string; text: string; glow: string }> = {
  violet: {
    ring: "border-violet-400/50 bg-violet-500/15",
    text: "text-violet-200",
    glow: "shadow-[0_0_20px_-6px_rgba(139,92,246,0.7)]",
  },
  cyan: {
    ring: "border-cyan-400/50 bg-cyan-500/15",
    text: "text-cyan-200",
    glow: "shadow-[0_0_20px_-6px_rgba(34,211,238,0.7)]",
  },
  neon: {
    ring: "border-neon-400/50 bg-neon-500/15",
    text: "text-neon-200",
    glow: "shadow-[0_0_20px_-6px_rgba(132,204,22,0.7)]",
  },
};

function earnedDate(d: Date | null): string {
  if (!d) return "";
  // B2: pin an explicit timeZone so this renders the SAME string on the server
  // (SSR, UTC on Vercel) and the client (hydration, the child's local timezone).
  // Without it, `toLocaleDateString` falls back to each environment's system
  // timezone, and a badge earned within an hour of midnight UTC can format to
  // a different calendar day on each side, which is exactly the kind of
  // server/client text mismatch that trips React's hydration error #418.
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function AchievementShelf({
  badges,
  earnedCount,
  totalCount,
}: {
  badges: EarnedBadge[];
  earnedCount: number;
  totalCount: number;
}) {
  const reduce = useReducedMotion();
  // Show a few empty "not yet" slots so the shelf reads as collectible, capped
  // so a big syllabus doesn't flood the view.
  const lockedToShow = Math.min(Math.max(totalCount - earnedCount, 0), 6);

  return (
    <section className="child-panel mb-10 p-6 sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-200">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-fog-50">Your badge shelf</h2>
          <p className="text-sm text-fog-400">
            {earnedCount === 0
              ? "Master a topic to earn your first badge."
              : `${earnedCount} badge${earnedCount === 1 ? "" : "s"} earned so far — keep collecting!`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {badges.map((b, i) => {
          const palette = ACCENT[b.accent] ?? ACCENT.violet;
          return (
            <motion.div
              key={b.topicTag}
              initial={reduce ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduce ? { duration: 0 } : { delay: i * 0.04, type: "spring", stiffness: 300, damping: 20 }}
            >
              <Link
                href={`/learn/certificate?topic=${encodeURIComponent(b.topicTag)}`}
                className={cn(
                  "child-touch flex w-28 flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-transform hover:scale-[1.03]",
                  palette.ring,
                  palette.glow,
                )}
                title={`${b.title} — tap to save your certificate`}
              >
                <Star className={cn("h-7 w-7", palette.text)} />
                <span className={cn("line-clamp-2 text-xs font-semibold leading-tight", palette.text)}>
                  {b.title}
                </span>
                {b.certifiedAt && (
                  <span className="text-[10px] text-fog-500">{earnedDate(b.certifiedAt)}</span>
                )}
              </Link>
            </motion.div>
          );
        })}

        {Array.from({ length: lockedToShow }).map((_, i) => (
          <div
            key={`locked-${i}`}
            className="flex w-28 flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/8 bg-white/[0.02] p-3 text-center"
            aria-hidden
          >
            <Lock className="h-6 w-6 text-fog-600" />
            <span className="text-xs font-medium text-fog-600">Not yet</span>
          </div>
        ))}
      </div>
    </section>
  );
}

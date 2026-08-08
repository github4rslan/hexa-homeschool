"use client";

import type { ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Heart,
  LifeBuoy,
  Moon,
  PlayCircle,
  Rocket,
  type LucideProps,
} from "lucide-react";
import { attemptsPhrase } from "@/lib/engine/parent-events";

/** One feed row — a plain, serialisable shape from listActivityFeed + a
 * pre-computed relative time (formatted server-side). */
export interface ActivityFeedRow {
  kind:
    | "mastery"
    | "handoff"
    | "inactivity"
    | "reflection"
    | "band_promotion"
    | "lesson_completed"
    | "lesson_started";
  childName: string;
  topicTitle: string | null;
  attempts: number | null;
  time: string;
}

interface Style {
  Icon: ComponentType<LucideProps>;
  /** Icon + chip colour classes (dashboard dark palette tokens). */
  ring: string;
  icon: string;
}

const STYLES: Record<ActivityFeedRow["kind"], Style> = {
  mastery: {
    Icon: Award,
    ring: "bg-neon-500/10 border-neon-400/25",
    icon: "text-neon-300",
  },
  handoff: {
    Icon: LifeBuoy,
    ring: "bg-amber-500/10 border-amber-400/25",
    icon: "text-amber-300",
  },
  inactivity: {
    Icon: Moon,
    ring: "bg-white/[0.04] border-white/10",
    icon: "text-fog-400",
  },
  reflection: {
    Icon: Heart,
    ring: "bg-rose-500/10 border-rose-400/25",
    icon: "text-rose-300",
  },
  band_promotion: {
    Icon: Rocket,
    ring: "bg-neon-500/10 border-neon-400/30",
    icon: "text-neon-300",
  },
  lesson_completed: {
    Icon: CheckCircle2,
    ring: "bg-violet-500/10 border-violet-400/20",
    icon: "text-violet-300",
  },
  lesson_started: {
    Icon: PlayCircle,
    ring: "bg-cyan-500/10 border-cyan-400/20",
    icon: "text-cyan-300",
  },
};

/** Warm, first-name presentation for one row. Titles are milestone-led; the
 * detail carries the child + specifics. */
function present(row: ActivityFeedRow): { title: string; detail: string } {
  const first = row.childName.split(" ")[0];
  const topic = row.topicTitle?.trim() || "a topic";
  switch (row.kind) {
    case "mastery":
      return {
        title: `Mastered ${topic}`,
        detail: `${first} · ${attemptsPhrase(row.attempts)} 🎉`,
      };
    case "handoff":
      return {
        title: `Extra help lined up`,
        detail: `${first} · ${topic} — a tutor is coming`,
      };
    case "inactivity":
      return {
        title: "No lesson yet today",
        detail: `${first} · a gentle reminder`,
      };
    case "reflection":
      // topicTitle already carries the warm, first-name feed line ("Ada felt
      // faster today"); fall back gently if it's somehow missing.
      return {
        title: "How today felt",
        detail: row.topicTitle?.trim() || `${first} · shared a reflection`,
      };
    case "band_promotion":
      // topicTitle carries the warm parent-facing subject+stage phrase, e.g.
      // "Science, now at lower-secondary level".
      return {
        title: "Moved up a stage 🚀",
        detail: `${first} · ${row.topicTitle?.trim() || "a new stage unlocked"}`,
      };
    case "lesson_completed":
      return { title: "Completed a lesson", detail: `${first} · ${topic}` };
    case "lesson_started":
      return { title: "Started a lesson", detail: `${first} · ${topic}` };
  }
}

/**
 * Parent dashboard activity feed (Wave 7, Phase 5). Mirrors the milestone
 * events that drive notifications — mastery, struggle/handoff, inactivity —
 * merged with recent lesson activity, newest first. Each kind has its own calm
 * accent + icon. Entrances are gentle and collapse under prefers-reduced-motion;
 * nothing flashes. Parent surface only — no child is tracked here.
 */
export function ActivityFeed({ rows }: { rows: ActivityFeedRow[] }) {
  const reduce = useReducedMotion();

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row, i) => {
        const s = STYLES[row.kind];
        const { title, detail } = present(row);
        return (
          <motion.li
            key={i}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: reduce ? 0 : Math.min(i, 6) * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex items-start gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${s.ring}`}
            >
              <s.Icon className={`h-4 w-4 ${s.icon}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fog-100">{title}</p>
              <p className="truncate text-xs text-fog-400">{detail}</p>
            </div>
            <span className="whitespace-nowrap text-xs text-fog-500">
              {row.time}
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}

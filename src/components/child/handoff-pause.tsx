"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HeartHandshake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { accentPreset } from "@/lib/child/accents";
import { cn } from "@/lib/utils";

/**
 * Five-attempt human handoff — the child's calm, never-punitive pause (Wave 7,
 * Phase 4). Shown after the mastery loop hits the attempt cap on a concept, and
 * again if the child re-opens a topic that's resting while a tutor is lined up.
 *
 * There is NO "failed", no red, no buzzer: just warm reassurance that a real
 * teacher is coming and that this one topic can rest while everything else stays
 * open. Accent-driven, WCAG AA, and fully collapses under reduced-motion.
 */
export function HandoffPause({
  topicTitle,
  firstName,
  accent: accentId,
  variant = "queued",
}: {
  /** The topic being set aside, named warmly (optional). */
  topicTitle?: string;
  /** Child's first name, for a personal line (optional). */
  firstName?: string;
  /** Child-chosen accent preset id — threads colour through the surface. */
  accent?: string | null;
  /**
   * `queued` — the moment the handoff fires at the end of a tricky check.
   * `resting` — re-entering a topic that's already paused for a tutor.
   */
  variant?: "queued" | "resting";
}) {
  const reduce = useReducedMotion();
  const accent = accentPreset(accentId);
  const topic = topicTitle?.trim();

  const heading =
    variant === "resting"
      ? topic
        ? `${topic} is resting`
        : "This topic is resting"
      : "Let's get you some extra help";

  const body =
    variant === "resting"
      ? "A real teacher is being lined up to go through this with you. There's nothing to do here right now — pick another subject and come back when your tutor's had a look."
      : `You've worked really hard on ${
          topic ? topic : "this"
        }. A real teacher is being lined up to go through it with you${
          firstName ? `, ${firstName}` : ""
        } — so this one can rest for now while you keep going on everything else.`;

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="child-panel p-8 text-center sm:p-12"
      >
        <motion.div
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2",
            accent.bg,
            accent.border,
          )}
        >
          <HeartHandshake className={cn("h-11 w-11", accent.text)} aria-hidden />
        </motion.div>

        <h1 className="mb-4 text-4xl font-semibold text-fog-50">{heading}</h1>

        <p className="mx-auto mb-6 max-w-md text-xl leading-relaxed text-fog-200">
          {body}
        </p>

        <div
          className={cn(
            "mx-auto mb-8 inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-base text-fog-200",
            accent.softBg,
            accent.softBorder,
          )}
        >
          <Sparkles className={cn("h-5 w-5 shrink-0", accent.text)} aria-hidden />
          We&apos;ve let a grown-up know — they&apos;ll help sort it out.
        </div>

        <div className="flex justify-center">
          <Button href="/learn" variant="child" size="child">
            Back to my subjects
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

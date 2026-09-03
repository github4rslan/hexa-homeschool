"use client";

import { motion, useReducedMotion } from "motion/react";
import { Sparkles, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { accentPreset } from "@/lib/child/accents";
import { cn } from "@/lib/utils";

/**
 * Calm "this quest isn't ready yet" screen — shown instead of a silent bounce
 * back to /learn when a planned topic has no playable questions (or resolves to
 * no topic at all). A child is never dead-ended without a word: warm reassurance
 * plus a single, obvious way back to the other quests.
 *
 * Static, human-authored copy — no AI, so no checker/distress implications.
 * Accent-driven, WCAG AA, fully collapses under reduced-motion.
 */
export function QuestNotReady({
  topicTitle,
  firstName,
  accent: accentId,
}: {
  /** The quest that isn't ready, named warmly (optional). */
  topicTitle?: string;
  /** Child's first name, for a personal line (optional). */
  firstName?: string;
  /** Child-chosen accent preset id — threads colour through the surface. */
  accent?: string | null;
}) {
  const reduce = useReducedMotion();
  const accent = accentPreset(accentId);
  const topic = topicTitle?.trim();

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
          <Compass className={cn("h-11 w-11", accent.text)} aria-hidden />
        </motion.div>

        <h1 className="mb-4 text-4xl font-semibold text-fog-50">
          {topic ? `${topic} isn't ready yet` : "This quest isn't ready yet"}
        </h1>

        <p className="mx-auto mb-6 max-w-md text-xl leading-relaxed text-fog-200">
          {firstName ? `No worries, ${firstName} — ` : "No worries — "}
          this one is still being set up. Pick another quest and this will be
          ready for you soon.
        </p>

        <div
          className={cn(
            "mx-auto mb-8 inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-base text-fog-200",
            accent.softBg,
            accent.softBorder,
          )}
        >
          <Sparkles className={cn("h-5 w-5 shrink-0", accent.text)} aria-hidden />
          There&apos;s plenty more to explore right now.
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

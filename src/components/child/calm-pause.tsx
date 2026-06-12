"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Full calm-pause screen shown when the safety gate freezes a session
 * (child-safety rule 2). It REPLACES the lesson UI entirely — no answers,
 * hints or "next" remain reachable. The only way out is leaving the lesson;
 * the escalation has already been recorded server-side and the parent will
 * see it on their dashboard.
 */
export function CalmPause({
  message,
  exitHref,
  exitLabel,
}: {
  message?: string | null;
  exitHref: string;
  exitLabel: string;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="child-panel p-8 sm:p-12 text-center animate-child-pop">
        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-2 bg-violet-500/10 border-violet-400/40">
          <Heart className="h-12 w-12 text-violet-300" aria-hidden />
        </div>
        <h1 className="text-4xl font-semibold text-fog-50 mb-4">
          Let&apos;s take a break
        </h1>
        <p className="text-xl text-fog-200 leading-relaxed mb-3">
          {message ||
            "This looks like a good moment to pause. You're doing better than you think — learning is hard work."}
        </p>
        <p className="text-lg text-fog-400 mb-8">
          We&apos;ve let your grown-up know it&apos;s a good time to check in
          with you. The lesson will be here whenever you&apos;re ready.
        </p>
        <Button href={exitHref} variant="child" size="child">
          {exitLabel}
        </Button>
      </div>
    </div>
  );
}

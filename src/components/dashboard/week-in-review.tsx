"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { WeekInReview as WeekInReviewData } from "@/lib/db/repo";

// The slideshow + framer-motion + canvas save logic load only when opened —
// they're not on the dashboard's / child hub's initial JS (perf pass).
const WeekInReviewModal = dynamic(
  () => import("./week-in-review-modal").then((m) => m.WeekInReviewModal),
  { ssr: false },
);

/**
 * "HEXA Wrapped" trigger card. Lightweight (no framer in the initial bundle);
 * tapping it lazy-loads the full-screen recap. Derived entirely from existing
 * data via repo.weekInReview.
 */
export function WeekInReview({
  review,
  variant = "parent",
}: {
  review: WeekInReviewData;
  variant?: "parent" | "child";
}) {
  const [open, setOpen] = useState(false);
  const first = review.childName.split(" ")[0];

  return (
    <>
      <Card
        variant="glass-strong"
        padding="lg"
        interactive
        className="mb-10 cursor-pointer"
      >
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-4 text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/10">
            <Sparkles className="h-5 w-5 text-violet-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-fog-50">
              {first}&apos;s week in review
            </h3>
            <p className="mt-0.5 text-sm text-fog-400">
              {review.quiet
                ? "A quiet week — open for a gentle recap."
                : `${review.lessonsCompleted} lessons · ${review.topicsCertified.length} certified · ${review.weekLabel}`}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-fog-500" />
        </button>
      </Card>

      {open && (
        <WeekInReviewModal
          review={review}
          variant={variant}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

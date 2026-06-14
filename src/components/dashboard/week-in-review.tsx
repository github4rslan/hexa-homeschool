"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Clock,
  Download,
  Flame,
  Sparkles,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WeekInReview as WeekInReviewData } from "@/lib/db/repo";

interface Slide {
  icon: React.ReactNode;
  value: string;
  caption: string;
}

/**
 * "HEXA Wrapped" — a celebratory recap of the child's week. Renders a compact
 * dashboard trigger card; tapping opens a full-screen, skippable slideshow
 * (3–4 framer slides). A "Save picture" button rasterises the ownership-checked
 * server SVG to a 1080×1080 PNG (first name + achievements only) for sharing.
 * Reduced-motion users get instant transitions and no looping animation.
 */
export function WeekInReview({
  review,
  variant = "parent",
}: {
  review: WeekInReviewData;
  variant?: "parent" | "child";
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [saving, setSaving] = useState(false);

  const first = review.childName.split(" ")[0];

  const slides: Slide[] = review.quiet
    ? [
        {
          icon: <Sparkles className="h-10 w-10 text-neon-400" />,
          value: "A fresh week",
          caption: `A quiet week for ${first} — a gentle start is a fine place to begin again.`,
        },
      ]
    : [
        {
          icon: <Sparkles className="h-10 w-10 text-violet-300" />,
          value: `${review.lessonsCompleted}`,
          caption: `${review.lessonsCompleted === 1 ? "lesson" : "lessons"} completed this week`,
        },
        {
          icon: <Award className="h-10 w-10 text-neon-400" />,
          value: `${review.topicsCertified.length}`,
          caption: `${review.topicsCertified.length === 1 ? "topic" : "topics"} certified${review.bestSubject ? ` · strongest in ${review.bestSubject}` : ""}`,
        },
        {
          icon: <Flame className="h-10 w-10 text-amber-400" />,
          value: `${review.streak}`,
          caption: `day streak — ${first} keeps showing up`,
        },
        {
          icon: <Clock className="h-10 w-10 text-cyan-300" />,
          value: `${review.totalMinutes}`,
          caption: `minutes of focused learning`,
        },
      ];

  const last = slide >= slides.length - 1;

  const savePicture = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/week-review/image?child=${encodeURIComponent(review.childId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("fetch failed");
      const svgText = await res.text();
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      const urlObj = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("img load failed"));
        img.src = urlObj;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas ctx");
      ctx.drawImage(img, 0, 0, 1080, 1080);
      URL.revokeObjectURL(urlObj);
      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = png;
      a.download = `hexa-week-${first.toLowerCase()}.png`;
      a.click();
    } catch {
      // Best-effort: a failed save should never break the celebration.
    } finally {
      setSaving(false);
    }
  }, [review.childId, first]);

  return (
    <>
      <Card
        variant="glass-strong"
        padding="lg"
        interactive
        className="mb-10 cursor-pointer"
      >
        <button
          onClick={() => {
            setSlide(0);
            setOpen(true);
          }}
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-void/95 backdrop-blur-xl p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`${first}'s week in review`}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-6 top-6 rounded-lg p-2 text-fog-400 hover:bg-white/5 hover:text-fog-100"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="w-full max-w-md text-center">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-violet-300">
                HEXA · Week in review
              </span>

              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="my-12"
                >
                  <div className="mb-6 flex justify-center">{slides[slide].icon}</div>
                  <div className="text-6xl font-semibold text-fog-50">
                    {slides[slide].value}
                  </div>
                  <p className="mt-4 text-lg text-fog-300">{slides[slide].caption}</p>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="mb-8 flex justify-center gap-2">
                {slides.map((_, i) => (
                  <span
                    key={i}
                    className={
                      i === slide
                        ? "h-2 w-6 rounded-full bg-violet-400"
                        : "h-2 w-2 rounded-full bg-white/15"
                    }
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-3">
                {slide > 0 && (
                  <Button
                    onClick={() => setSlide((s) => s - 1)}
                    variant="ghost"
                    size="md"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                )}
                {!last ? (
                  <Button
                    onClick={() => setSlide((s) => s + 1)}
                    variant="primary"
                    size="md"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    {variant === "parent" && !review.quiet && (
                      <Button
                        onClick={savePicture}
                        variant="primary"
                        size="md"
                        disabled={saving}
                      >
                        <Download className="h-4 w-4" />
                        {saving ? "Saving…" : "Save picture"}
                      </Button>
                    )}
                    <Button onClick={() => setOpen(false)} variant="secondary" size="md">
                      Done
                    </Button>
                  </>
                )}
              </div>

              {variant === "parent" && !review.quiet && (
                <p className="mt-6 text-xs text-fog-500">
                  The picture shows {first}&apos;s first name and achievements only —
                  no photos, no other detail. Sharing is your choice.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MessageSquareHeart, Star, X } from "lucide-react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { FEEDBACK_COMMENT_MAX, type FeedbackTrigger } from "@/lib/engine/feedback-eligibility";
import { cn } from "@/lib/utils";

/**
 * Parent sentiment widget — a small, calm, dismissible card with exactly two
 * fields (a required 1–5 star rating + an optional comment). PARENT-SIDE ONLY;
 * it is never rendered in a (child) route or a component a child route mounts.
 *
 * Two entry points, one shared card:
 *   <FeedbackPrompt trigger>   – auto-opens after a milestone (bottom-corner
 *                                 toast). Dismiss/opt-out write prompt state so
 *                                 it can never re-nag; close is always reachable
 *                                 (X + Esc) and the page stays interactive.
 *   <FeedbackButton />          – a proactive "Give feedback" button parents can
 *                                 use any time (trigger "manual").
 *
 * Accessible: role dialog, focus trap, Esc-to-close, reduced-motion safe, tap
 * targets ≥ 44px. Never blocking — no page-dimming backdrop.
 */

type SubmitState = "idle" | "saving" | "done" | "error";

interface FeedbackCardProps {
  trigger: FeedbackTrigger;
  /** Heading + sub copy tuned to how the card was surfaced. */
  title: string;
  subtitle: string;
  /** Show the durable "Don't ask again" affordance (milestone prompt only). */
  showOptOut?: boolean;
  onClose: () => void;
  onOptOut?: () => void;
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Star rating, 1 to 5"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-fog-500 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              n <= active ? "fill-amber-400 text-amber-400" : "text-fog-600",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function FeedbackCard({
  trigger,
  title,
  subtitle,
  showOptOut,
  onClose,
  onOptOut,
}: FeedbackCardProps) {
  const reduce = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  useFocusTrap(cardRef, true, onClose);

  const submit = useCallback(async () => {
    if (stars < 1 || state === "saving") return;
    setState("saving");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stars,
          comment: comment.trim() || null,
          trigger,
          context:
            typeof window !== "undefined" ? window.location.pathname : null,
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      setState("done");
      // Let the thank-you land, then close.
      setTimeout(onClose, 1600);
    } catch {
      setState("error");
    }
  }, [stars, comment, trigger, state, onClose]);

  return (
    <motion.div
      ref={cardRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Share your feedback"
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong pointer-events-auto w-[calc(100vw-1.5rem)] max-w-sm rounded-2xl border border-white/10 p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] outline-none"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-fog-400 transition-colors hover:bg-white/5 hover:text-fog-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        <X className="h-5 w-5" />
      </button>

      {state === "done" ? (
        <div className="py-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-neon-400/30 bg-neon-500/10">
            <MessageSquareHeart className="h-6 w-6 text-neon-400" />
          </div>
          <p className="text-base font-semibold text-fog-50">Thank you</p>
          <p className="mt-1 text-sm text-fog-400">
            Your feedback goes straight to the team.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 pr-8">
            <div className="mb-1 flex items-center gap-2">
              <MessageSquareHeart className="h-4 w-4 text-violet-300" />
              <h2 className="text-base font-semibold text-fog-50">{title}</h2>
            </div>
            <p className="text-sm text-fog-400">{subtitle}</p>
          </div>

          <div className="mb-4">
            <StarPicker value={stars} onChange={setStars} />
          </div>

          <label className="sr-only" htmlFor="feedback-comment">
            Optional comment
          </label>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={FEEDBACK_COMMENT_MAX}
            rows={3}
            placeholder="Anything you'd like to add? (optional)"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-100 placeholder:text-fog-600 focus:border-violet-400/50 focus:outline-none focus:ring-1 focus:ring-violet-400/50"
          />
          <div className="mb-3 mt-1 text-right text-[11px] text-fog-600">
            {comment.length}/{FEEDBACK_COMMENT_MAX}
          </div>

          {state === "error" && (
            <p className="mb-3 text-sm text-crimson-300" role="alert">
              Something went wrong — please try again.
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            {showOptOut ? (
              <button
                type="button"
                onClick={onOptOut}
                className="text-xs text-fog-500 underline-offset-2 transition-colors hover:text-fog-300 hover:underline"
              >
                Don&apos;t ask again
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={submit}
              disabled={stars < 1 || state === "saving"}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-5 text-sm font-medium text-white shadow-[0_0_30px_-10px_rgba(124,58,237,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 motion-reduce:hover:scale-100"
            >
              {state === "saving" ? "Sending…" : "Send feedback"}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

/** Fixed bottom-corner shell (non-blocking; page stays interactive behind it). */
function CornerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-3 pb-3 sm:inset-x-auto sm:right-4 sm:justify-end sm:px-0 [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}

const TRIGGER_COPY: Record<
  Exclude<FeedbackTrigger, "manual">,
  { title: string; subtitle: string }
> = {
  first_week: {
    title: "How's Edway going so far?",
    subtitle: "You've settled in — we'd love a quick star rating.",
  },
  mastery: {
    title: "A topic just got mastered! 🎉",
    subtitle: "How are we doing? A quick star rating helps a lot.",
  },
};

export function FeedbackPrompt({
  trigger,
}: {
  trigger: Exclude<FeedbackTrigger, "manual">;
}) {
  const [open, setOpen] = useState(true);

  // Best-effort: record that the prompt was shown (audit only).
  useEffect(() => {
    void fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "shown" }),
    }).catch(() => {});
  }, []);

  const patch = useCallback((action: "dismissed" | "opt_out") => {
    void fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => {});
  }, []);

  const dismiss = useCallback(() => {
    patch("dismissed");
    setOpen(false);
  }, [patch]);

  const optOut = useCallback(() => {
    patch("opt_out");
    setOpen(false);
  }, [patch]);

  const copy = TRIGGER_COPY[trigger];

  return (
    <AnimatePresence>
      {open && (
        <CornerShell>
          <FeedbackCard
            trigger={trigger}
            title={copy.title}
            subtitle={copy.subtitle}
            showOptOut
            onClose={dismiss}
            onOptOut={optOut}
          />
        </CornerShell>
      )}
    </AnimatePresence>
  );
}

export function FeedbackButton({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-fog-200 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-fog-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
          className,
        )}
      >
        <MessageSquareHeart className="h-4 w-4 text-violet-300" />
        Give feedback
      </button>

      <AnimatePresence>
        {open && (
          <CornerShell>
            <FeedbackCard
              trigger="manual"
              title="Share your feedback"
              subtitle="How's Edway working for your family? A quick rating helps."
              onClose={() => setOpen(false)}
            />
          </CornerShell>
        )}
      </AnimatePresence>
    </>
  );
}

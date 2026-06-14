"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Child-mode error boundary. Calm and warm — no scary language, no error codes,
 * big friendly touch targets (Children's Code). Mirrors the dashboard boundary
 * but speaks to a child. Sentry capture uses the shared scrubber (no PII).
 */
export default function LearnError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <div className="child-panel p-8 sm:p-12">
        <div className="mb-6 text-6xl" aria-hidden>
          🌱
        </div>
        <h1 className="mb-3 text-3xl font-semibold text-fog-50">
          Let&apos;s try that again
        </h1>
        <p className="mb-8 text-lg text-fog-300">
          Something needed a moment to catch up. Nothing you did was wrong — your
          progress is safe.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="child-touch inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 px-8 py-4 text-lg font-semibold text-white"
          >
            Try again
          </button>
          <a
            href="/learn"
            className="child-touch inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-lg font-semibold text-fog-100 hover:border-white/30"
          >
            Back to my subjects
          </a>
        </div>
      </div>
    </div>
  );
}

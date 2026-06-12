"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

/**
 * Child-facing error screen: calm and blame-free — the problem is ours,
 * never the child's. Still and quiet by design (no animation).
 */
export default function ChildError({
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
    <div className="relative min-h-screen theme-child">
      <div className="fixed inset-0 bg-void -z-20" />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="child-panel p-8 sm:p-12 text-center">
          <span className="block text-6xl mb-6" aria-hidden>
            🔧
          </span>
          <h1 className="text-4xl font-semibold text-fog-50 mb-4">
            Oops — that&rsquo;s our fault!
          </h1>
          <p className="text-xl text-fog-300 leading-relaxed mb-8">
            Something on our side got muddled. You didn&rsquo;t do anything
            wrong — your work is saved. Let&rsquo;s try that again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} variant="child" size="child">
              Try again
            </Button>
            <Button href="/learn" variant="secondary" size="lg">
              Back to my subjects
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

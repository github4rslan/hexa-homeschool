"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardError({
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
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <main className="mx-auto max-w-2xl px-6 py-20">
        <Card variant="glass-strong" padding="xl" className="text-center">
          <h1 className="text-2xl font-semibold text-fog-50 mb-3">
            That didn&rsquo;t load properly
          </h1>
          <p className="text-sm text-fog-400 mb-2 leading-relaxed">
            Something went wrong on our side — your family&rsquo;s data is safe
            and nothing was lost. It&rsquo;s usually a momentary blip.
          </p>
          {error.digest && (
            <p className="mb-6 font-mono text-xs text-fog-600">
              Reference: {error.digest}
            </p>
          )}
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} variant="primary" size="md">
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
            <Button href="/dashboard" variant="secondary" size="md">
              <Home className="h-4 w-4" /> Back to dashboard
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

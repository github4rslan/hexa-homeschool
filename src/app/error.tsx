"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HexaLogo } from "@/components/ui/hexa-logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-mesh-hero opacity-50 -z-10 pointer-events-none" />

      <header className="p-6 lg:p-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <HexaLogo size={28} withText />
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-crimson-400 mb-4">
          Checker triggered · Halt issued
        </div>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-fog-50 mb-6">
          Something went sideways.
        </h1>
        <p className="text-base text-fog-400 max-w-md mb-10">
          Our system halted to keep things safe. We've logged this and our team
          has been notified. You can try again, or head back to a known-good page.
        </p>

        {error.digest && (
          <div className="mb-8 inline-block rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-fog-500">
            Trace · {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={reset} variant="primary" size="lg">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button href="/" variant="secondary" size="lg">
            <Home className="h-4 w-4" />
            Back to home
          </Button>
        </div>
      </main>
    </div>
  );
}

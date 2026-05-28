import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HexaLogo } from "@/components/ui/hexa-logo";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-mesh-hero opacity-50 -z-10 pointer-events-none" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-30 -z-10 pointer-events-none" />

      <header className="p-6 lg:p-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <HexaLogo size={28} withText />
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-fog-500 mb-4">
          Error 404 · Not found
        </div>
        <h1 className="text-7xl md:text-9xl font-semibold tracking-tight text-gradient-aurora mb-6">
          404
        </h1>
        <p className="text-xl text-fog-200 mb-2">
          This page wandered off the curriculum.
        </p>
        <p className="text-base text-fog-400 max-w-md mb-10">
          The link may have moved, expired, or never existed. Let's get you
          back to somewhere useful.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button href="/" variant="primary" size="lg">
            <Home className="h-4 w-4" />
            Back to home
          </Button>
          <Button href="/contact" variant="secondary" size="lg">
            <ArrowLeft className="h-4 w-4" />
            Tell us what broke
          </Button>
        </div>
      </main>
    </div>
  );
}

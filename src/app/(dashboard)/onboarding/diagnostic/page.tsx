import type { Metadata } from "next";
import Link from "next/link";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { DiagnosticRunner } from "@/components/diagnostic/diagnostic-runner";

export const metadata: Metadata = {
  title: "Diagnostic",
  description:
    "The HEXA adaptive diagnostic — map your child's current level against GCSE standards.",
};

export default function DiagnosticPage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-mesh-hero opacity-50 -z-10 pointer-events-none" />

      <header className="p-6 lg:p-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2.5">
          <HexaLogo size={28} withText />
        </Link>
      </header>

      <main className="px-6 py-8 lg:py-16">
        <DiagnosticRunner />
      </main>
    </div>
  );
}

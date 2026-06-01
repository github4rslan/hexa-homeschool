import type { Metadata } from "next";
import Link from "next/link";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { DiagnosticRunner } from "@/components/diagnostic/diagnostic-runner";
import { getDiagnosticPool } from "@/lib/db/repo";
import { DIAGNOSTIC_SUBJECTS, type DiagnosticItem } from "@/lib/data/diagnostic";

export const metadata: Metadata = {
  title: "Diagnostic",
  description:
    "The HEXA adaptive diagnostic — map your child's current level against GCSE standards.",
};

export const dynamic = "force-dynamic";

export default async function DiagnosticPage() {
  // Load the diagnostic item pool from the real question bank (kind=diagnostic).
  const pools = await Promise.all(
    DIAGNOSTIC_SUBJECTS.map((s) => getDiagnosticPool(s.id)),
  );
  const pool: DiagnosticItem[] = pools.flat().map((q) => ({
    id: q._id!.toHexString(),
    subject: q.subject,
    tier: q.tier,
    prompt: q.prompt,
    options: q.options,
    correctIndex: q.correct_index,
    topic: q.topic_tag,
  }));

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
        <DiagnosticRunner pool={pool} />
      </main>
    </div>
  );
}

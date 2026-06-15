import type { Metadata } from "next";
import Link from "next/link";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { BackButton } from "@/components/ui/back-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DiagnosticRunner } from "@/components/diagnostic/diagnostic-runner";
import { currentParentId, getActiveChild, getDiagnosticPool } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { DIAGNOSTIC_SUBJECTS, type DiagnosticItem } from "@/lib/data/diagnostic";
import { ageFromDob, placeChild } from "@/lib/engine/diagnostic-placement";

export const metadata: Metadata = {
  title: "Diagnostic",
  description:
    "The HEXA adaptive diagnostic — map your child's current level against GCSE standards.",
};

export const dynamic = "force-dynamic";

export default async function DiagnosticPage() {
  // Place the diagnostic at the active child's age-expected band. Ownership is
  // enforced in the repo layer (parent-scoped read). With no active child
  // (e.g. signed-out preview) we fall back to GCSE so the page never crashes.
  const parentId = await currentParentId();
  const child = parentId
    ? await getActiveChild(parentId, await readActiveChildId())
    : null;
  const placement = child?.date_of_birth
    ? placeChild(ageFromDob(child.date_of_birth))
    : { keyStage: 4 as const, startTier: 3 };

  // Load the band-scoped diagnostic item pool (kind=diagnostic).
  const pools = await Promise.all(
    DIAGNOSTIC_SUBJECTS.map((s) => getDiagnosticPool(s.id, placement.keyStage)),
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

      <header className="p-6 lg:p-10 flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-2.5">
          <HexaLogo size={28} withText />
        </Link>
        <BackButton fallback="/dashboard" label="Exit" />
      </header>

      <main className="px-6 py-8 lg:py-16">
        <div className="mx-auto mb-6 max-w-5xl">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Onboarding", href: "/onboarding" },
              { label: "Diagnostic" },
            ]}
          />
        </div>
        <DiagnosticRunner
          pool={pool}
          startTier={placement.startTier}
          keyStage={placement.keyStage}
          childName={child?.full_name?.trim().split(/\s+/)[0]}
        />
      </main>
    </div>
  );
}

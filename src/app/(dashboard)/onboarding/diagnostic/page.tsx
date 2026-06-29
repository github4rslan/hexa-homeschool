import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { BackButton } from "@/components/ui/back-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DiagnosticRunner } from "@/components/diagnostic/diagnostic-runner";
import { DiagnosticCompleted } from "@/components/diagnostic/diagnostic-completed";
import {
  currentParentId,
  getActiveChild,
  getDiagnosticPool,
  getDiagnosticCompletion,
  latestEvaluationsBySubject,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { DIAGNOSTIC_SUBJECTS, type DiagnosticItem } from "@/lib/data/diagnostic";
import { ageFromDob, placeChild } from "@/lib/engine/diagnostic-placement";
import { diagnosticPageState } from "@/lib/diagnostic/page-state";

export const metadata: Metadata = {
  title: "Diagnostic",
  description:
    "The Edway adaptive diagnostic — map your child's current level against GCSE standards.",
};

export const dynamic = "force-dynamic";

export default async function DiagnosticPage() {
  // Place the diagnostic at the active child's age-expected band. Ownership is
  // enforced in the repo layer (parent-scoped read). With no active child we
  // redirect to profile creation rather than showing a non-persistable runner.
  const parentId = await currentParentId();
  if (!parentId) redirect("/login");
  const child = parentId
    ? await getActiveChild(parentId, await readActiveChildId())
    : null;
  if (!child?._id) redirect("/dashboard/children/new");

  // The diagnostic is a ONE-TIME learning check. If the active child has already
  // completed it, show the stable read-only baseline — never a fresh run.
  const completion = await getDiagnosticCompletion(parentId, child._id);
  const pageState = diagnosticPageState(completion.completed);

  const placement = child?.date_of_birth
    ? placeChild(ageFromDob(child.date_of_birth))
    : { keyStage: 4 as const, startTier: 3 };

  // Saved baseline for the completed view (read-only — never a recomputation).
  const standings =
    pageState === "completed"
      ? await latestEvaluationsBySubject(child._id)
      : [];

  // Load the band-scoped diagnostic item pool (kind=diagnostic) — only needed
  // when the child still has the diagnostic to take.
  const pools = pageState === "completed"
    ? []
    : await Promise.all(
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
        {pageState === "completed" ? (
          <DiagnosticCompleted
            childName={child?.full_name?.trim().split(/\s+/)[0]}
            childId={child._id.toHexString()}
            completedAt={completion.at}
            standings={standings}
          />
        ) : (
          <DiagnosticRunner
            pool={pool}
            startTier={placement.startTier}
            keyStage={placement.keyStage}
            childName={child?.full_name?.trim().split(/\s+/)[0]}
          />
        )}
      </main>
    </div>
  );
}

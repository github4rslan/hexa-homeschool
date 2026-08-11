import type { Metadata } from "next";
import Link from "next/link";
import { Award, FileText } from "lucide-react";
import { PortfolioGenerator } from "@/components/compliance/portfolio-generator";
import { BackButton } from "@/components/ui/back-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  currentParentId,
  listChildren,
  subjectMilestones,
} from "@/lib/db/repo";

export const metadata: Metadata = {
  title: "Compliance portfolio",
  description:
    "Generate a verified, tamper-evident Local Authority portfolio with an SHA-256 verification hash.",
};

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const parentId = await currentParentId();
  const children = parentId ? await listChildren(parentId) : [];

  // Earned mastery certificates: fully-certified subjects, per child.
  const certificates = parentId
    ? (
        await Promise.all(
          children.map(async (c) => {
            const milestones = await subjectMilestones(parentId, c._id!);
            return milestones
              .filter((m) => m.complete)
              .map((m) => ({
                childId: c._id!.toHexString(),
                childName: c.full_name,
                subject: m.subject,
                label: m.label,
              }));
          }),
        )
      ).flat()
    : [];

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-mesh-violet opacity-20 -z-10 pointer-events-none" />
      <main id="main-content" className="px-6 py-10 lg:px-10 lg:py-16">
        <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between print:hidden">
          <BackButton fallback="/dashboard" label="Back to dashboard" className="-ml-3" />
          <a
            href="/compliance/cnis"
            className="text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            Registration pre-fill →
          </a>
        </div>
        <div className="max-w-3xl mx-auto mb-4 print:hidden">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Portfolio" },
            ]}
          />
        </div>
        <PortfolioGenerator
          childList={children.map((c) => ({
            id: c._id!.toHexString(),
            name: c.full_name,
          }))}
        />

        {certificates.length > 0 && (
          <div className="mx-auto mt-8 max-w-3xl print:hidden">
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.04] p-6">
              <div className="mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-300" />
                <h2 className="text-sm font-semibold text-fog-50">
                  Mastery certificates
                </h2>
              </div>
              <p className="mb-4 text-sm text-fog-400">
                A print-beautiful certificate for every subject fully mastered —
                carrying a tamper-evident verification reference.
              </p>
              <div className="flex flex-wrap gap-2">
                {certificates.map((cert) => (
                  <Link
                    key={`${cert.childId}-${cert.subject}`}
                    href={`/dashboard/children/${cert.childId}/certificate?subject=${cert.subject}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/[0.06] px-4 text-sm text-fog-100 hover:border-amber-400/40"
                  >
                    <Award className="h-3.5 w-3.5 text-amber-300" />
                    {cert.childName.split(" ")[0]} · {cert.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {children.length > 0 && (
          <div className="mx-auto mt-8 max-w-3xl print:hidden">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-300" />
                <h2 className="text-sm font-semibold text-fog-50">
                  Monthly progress reports
                </h2>
              </div>
              <p className="mb-4 text-sm text-fog-400">
                A printable month-by-month summary for each child — additional
                local-authority evidence alongside the verified portfolio.
              </p>
              <div className="flex flex-wrap gap-2">
                {children.map((c) => (
                  <Link
                    key={c._id?.toHexString()}
                    href={`/dashboard/children/${c._id?.toHexString()}/report`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm text-fog-100 hover:border-white/25 hover:bg-white/[0.06]"
                  >
                    {c.full_name}&apos;s report
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

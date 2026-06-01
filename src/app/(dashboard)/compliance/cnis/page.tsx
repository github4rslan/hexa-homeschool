import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { PrintButton } from "@/components/ui/print-button";
import {
  currentParentId,
  findParentById,
  getActiveChild,
  latestEvaluationsBySubject,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";

export const metadata: Metadata = { title: "Registration pre-fill" };
export const dynamic = "force-dynamic";

const SUBJECT_LABEL: Record<string, string> = {
  mathematics: "Mathematics",
  english: "English",
  science: "Science",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/5 py-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-fog-100">{value || "—"}</div>
    </div>
  );
}

export default async function CnisPrefillPage() {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/compliance/cnis");
  const parent = await findParentById(parentId);
  const child = await getActiveChild(parentId, await readActiveChildId());

  if (!parent || !child?._id) {
    redirect("/dashboard");
  }

  const standings = await latestEvaluationsBySubject(child._id);
  const subjectsLine = standings
    .map(
      (s) =>
        `${SUBJECT_LABEL[s.subject]}${s.grade ? ` (working Grade ${s.grade})` : ""}`,
    )
    .join(", ");

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-30 -z-10 pointer-events-none print:hidden" />

      <main className="mx-auto max-w-3xl px-6 py-10 lg:py-16">
        <div className="print:hidden">
          <PageHeader
            title="Registration pre-fill"
            description="Children Not in School (CNIS) registration details, pre-filled from your account. Review, print, and submit to your Local Authority."
            breadcrumbs={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Registration" },
            ]}
            backFallback="/dashboard"
            action={<PrintButton />}
          />
        </div>

        <Card variant="glass-strong" padding="xl">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5 text-violet-300" />
            <h2 className="text-lg font-semibold text-fog-50">
              Child Not in School — registration details
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-8">
            <Field label="Child's full name" value={child.full_name} />
            <Field label="Date of birth" value={child.date_of_birth} />
            <Field label="Parent / carer name" value={parent.full_name ?? ""} />
            <Field label="Contact email" value={parent.email} />
            <Field
              label="Education setting"
              value="Elective home education (EHE)"
            />
            <Field
              label="Target exam window"
              value={child.target_exam_window ?? "Flexible — when ready"}
            />
          </div>

          <div className="mt-2">
            <Field label="Core subjects & current standing" value={subjectsLine} />
            <Field
              label="Provision"
              value="Structured daily lessons (explainer, adaptive practice, mastery checks) mapped to GCSE specifications, with monthly assessment and quarterly verified portfolios via HEXA."
            />
            {child.send_indicators && child.send_indicators.length > 0 && (
              <Field
                label="Additional needs (SEND)"
                value={child.send_indicators.join(", ")}
              />
            )}
          </div>

          <p className="mt-6 text-xs text-fog-500 leading-relaxed">
            This is a convenience pre-fill drawn from your HEXA account to speed
            up your Local Authority registration under the Children&apos;s
            Wellbeing and Schools Act 2026. Always check your council&apos;s
            specific form and requirements before submitting. HEXA never submits
            anything on your behalf — you remain in full control.
          </p>
        </Card>
      </main>
    </div>
  );
}

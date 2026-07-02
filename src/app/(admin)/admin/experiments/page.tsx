import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { IllustrativeNote } from "@/components/admin/illustrative";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin · Experiments" };

export default function ExperimentsPage() {
  return (
    <>
      <AdminTopbar
        title="A/B Experiments"
        subtitle="Live tests and hypotheses across the platform"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <IllustrativeNote className="mb-8">
          There is no experiment framework wired up yet — no exposure/conversion
          events are recorded, so this page shows no experiments rather than
          fabricated results. When parent-side A/B testing is built (parent
          surfaces only — never a child experiment), real exposure and conversion
          counts will appear here. See docs/METRICS.md.
        </IllustrativeNote>

        <Card variant="glass" padding="lg">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30 mb-4">
              <FlaskConical className="h-5 w-5 text-violet-300" />
            </div>
            <h2 className="text-base font-semibold text-fog-100">No experiments running</h2>
            <p className="text-sm text-fog-500 mt-1 max-w-md">
              Once the exposure/conversion instrumentation lands, running and
              completed experiments will be listed here with real significance.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}

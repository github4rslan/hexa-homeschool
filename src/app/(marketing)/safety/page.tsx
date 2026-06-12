import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { SafetyPreview } from "@/components/marketing/safety-preview";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Users, Activity, GitBranch } from "lucide-react";
import { CTA } from "@/components/marketing/cta";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-jsonld";

export const metadata: Metadata = {
  title: "Safety & escalation",
  description:
    "Human safety net with seven SLA-bound escalation gateways. AI never overrides safeguarding.",
};

const PRINCIPLES = [
  {
    icon: ShieldAlert,
    title: "Safeguarding always wins",
    description:
      "Risk vectors, self-harm indicators and abuse markers trigger immediate emergency workflows. The system reports directly to relevant statutory bodies — no model in the loop.",
  },
  {
    icon: Users,
    title: "Human marketplace tutors on call",
    description:
      "Persistent concept blocks (3 sequential failures) automatically dispatch a verified marketplace tutor within 15 minutes — matched to the academic domain.",
  },
  {
    icon: Activity,
    title: "Checker cascade quarantine",
    description:
      "If any agent's checker blocks output three times in one session, the system quarantines model weights and falls back to static human-authored content.",
  },
  {
    icon: GitBranch,
    title: "Drift detection rollback",
    description:
      "The Meta Checker continuously samples 5% of all transactions. Detected drift triggers a 24-hour architectural review and rollback to stable prompt releases.",
  },
];

export default function SafetyPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Safety", path: "/safety" }]} />
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="The Safety Net"
          title={
            <>
              Automation, with
              <br />
              <span className="text-gradient-aurora">structural humility.</span>
            </>
          }
          description="HEXA is designed around the assumption that AI will eventually be wrong. Every workflow has a defined point at which it hands operational control to a human — and every gateway carries a published SLA."
        />
      </Section>

      <Section padded={false} className="pb-20">
        <div className="grid md:grid-cols-2 gap-5">
          {PRINCIPLES.map((p) => (
            <Card key={p.title} variant="glass" padding="lg" interactive>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30">
                  <p.icon className="h-5 w-5 text-violet-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-fog-50 mb-2">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-fog-300">
                    {p.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <SafetyPreview />
      <CTA />
    </>
  );
}

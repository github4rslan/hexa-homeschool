import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { CompliancePreview } from "@/components/marketing/compliance-preview";
import { Card } from "@/components/ui/card";
import { CTA } from "@/components/marketing/cta";
import { Check, FileText } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-jsonld";

export const metadata: Metadata = {
  title: "Compliance & data protection",
  description:
    "UK GDPR. ICO Children's Code. AES-256 encryption. SHA-256 verifiable Local Authority portfolios.",
};

const PORTFOLIO_FEATURES = [
  "Statutory category grouping (Breadth, Balance, Progression)",
  "Linguistic smoothing for professional educational language",
  "Every claim backed by an immutable database reference",
  "Strict data minimisation — no sensitive personal or health data",
  "SHA-256 cryptographic signature on every dossier",
  "External audit tracking with timestamped access logs",
];

const DATA_RIGHTS = [
  { right: "Right of access", description: "Download every byte of your child's data at any time." },
  { right: "Right to rectification", description: "Correct any inaccurate or incomplete data." },
  { right: "Right to erasure", description: "Full record destruction triggered automatically after 24 months post-cancellation." },
  { right: "Right to data portability", description: "Export your data in a structured, machine-readable format." },
  { right: "Right to restrict processing", description: "Pause AI processing while retaining your records." },
];

export default function CompliancePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Compliance", path: "/compliance" }]} />
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="Trust & Compliance"
          title={
            <>
              Built for the
              <br />
              <span className="text-gradient-violet">UK regulatory frontier.</span>
            </>
          }
          description="Edway is engineered to satisfy UK GDPR, the ICO Age-Appropriate Design Code (Children's Code), and Local Authority elective home education monitoring requirements — without compromise."
        />
      </Section>

      <CompliancePreview />

      <Section>
        <SectionHeader
          eyebrow="Statutory Portfolios"
          title={
            <>
              Defensible by design.
              <br />
              <span className="text-gradient-aurora">Cryptographically signed.</span>
            </>
          }
          description="The Compliance Agent assembles authoritative progress dossiers tailored for unprompted Local Authority presentation."
          align="left"
        />

        <div className="mt-12 grid lg:grid-cols-2 gap-8">
          <Card variant="glass-strong" padding="xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neon-500/10 border border-neon-400/30">
                <FileText className="h-5 w-5 text-neon-400" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-fog-50">
                What's inside every dossier
              </h3>
            </div>
            <ul className="flex flex-col gap-3">
              {PORTFOLIO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-fog-200">
                  <Check className="h-4 w-4 text-neon-400 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card variant="glass-strong" padding="xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                <FileText className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-fog-50">
                Your data rights, by default
              </h3>
            </div>
            <ul className="flex flex-col gap-4">
              {DATA_RIGHTS.map((r) => (
                <li key={r.right} className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-fog-100">{r.right}</span>
                  <span className="text-xs text-fog-400 leading-relaxed">{r.description}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <CTA />
    </>
  );
}

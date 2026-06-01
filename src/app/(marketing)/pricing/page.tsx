import type { Metadata } from "next";
import { Check, Plus, Sparkles } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { CTA } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "HEXA Complete £49/mo, HEXA Partner £99/mo. Additional subjects £15/mo each. Annual payment saves 17%. 14-day free trial. Cancel anytime.",
};

interface Tier {
  name: string;
  description: string;
  price: { monthly: number; annual: number }; // annual = total billed per year
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    name: "HEXA Complete",
    description:
      "For homeschooling families who want robust educational structure and compliance protection.",
    price: { monthly: 49, annual: 490 },
    features: [
      "Core subjects: Maths, English & Science",
      "60-minute adaptive GCSE-mapped diagnostic",
      "Personalised, adjustable two-year syllabus",
      "Daily flow: explainer + practice + mastery check",
      "Monthly mock examinations with predictive grading",
      "Quarterly Local Authority portfolio engine (PDF)",
      "Registration form pre-fill for CNIS readiness",
      "1 complimentary on-demand tutor session / month",
    ],
    cta: "Start free trial",
  },
  {
    name: "HEXA Partner",
    description:
      "For families managing SEND requirements, navigating LA disputes, or seeking teacher validation.",
    price: { monthly: 99, annual: 990 },
    features: [
      "Everything in HEXA Complete",
      "3 dedicated live human tutor sessions / month",
      "Monthly written review by a qualified British teacher",
      "Quarterly strategy alignment: parent, child & teacher",
      "LA Defence Framework: vetted response templates",
      "Professional solicitor guidance routing",
      "Priority engineering & support (same-day SLA)",
    ],
    cta: "Start free trial",
    highlighted: true,
    badge: "Most support",
  },
];

const ADDITIONAL_SUBJECTS = [
  "History",
  "Geography",
  "French",
  "Spanish",
  "Computer Science",
  "Art",
];

/** Annual saving as a whole percentage vs. paying monthly for 12 months. */
function annualSaving(monthly: number, annual: number): number {
  return Math.round(((monthly * 12 - annual) / (monthly * 12)) * 100);
}

export default function PricingPage() {
  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="Pricing"
          title={
            <>
              Honest pricing.
              <br />
              <span className="text-gradient-violet">No surprises.</span>
            </>
          }
          description="14-day free trial — no card required. Cancel anytime. Annual payment saves 17%. All prices in GBP and include UK VAT."
        />

        <div className="mt-20 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {TIERS.map((tier) => (
            <Card
              key={tier.name}
              variant={tier.highlighted ? "glass-strong" : "glass"}
              padding="xl"
              className={
                tier.highlighted
                  ? "relative border-violet-400/40 glow-violet"
                  : "relative"
              }
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="violet" size="md">
                    <Sparkles className="h-3 w-3" />
                    {tier.badge}
                  </Badge>
                </div>
              )}

              <h3 className="text-2xl font-semibold tracking-tight text-fog-50">
                {tier.name}
              </h3>
              <p className="mt-2 text-sm text-fog-400">{tier.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight text-fog-50">
                  £{tier.price.monthly}
                </span>
                <span className="text-sm text-fog-400">/ month</span>
              </div>
              <p className="mt-1 text-xs text-fog-500">
                or £{tier.price.annual}/year (save{" "}
                {annualSaving(tier.price.monthly, tier.price.annual)}%)
              </p>

              <Button
                href="/signup"
                variant={tier.highlighted ? "primary" : "secondary"}
                size="md"
                className="mt-8 w-full"
              >
                {tier.cta}
              </Button>

              <ul className="mt-8 flex flex-col gap-3">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-fog-200"
                  >
                    <Check className="h-4 w-4 text-neon-400 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      {/* Additional subjects */}
      <Section padded={false} className="pb-8">
        <Container size="md">
          <Card variant="glass" padding="xl">
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:justify-between">
              <div className="max-w-md">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-400/30">
                    <Plus className="h-4 w-4 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-fog-50">
                    Additional subjects
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-fog-400">
                  Optional non-core modules that leverage the same infrastructure,
                  separated from the core compliance engine metrics.
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-fog-50">
                    £15
                  </span>
                  <span className="text-sm text-fog-400">/ month each</span>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {ADDITIONAL_SUBJECTS.map((s) => (
                    <Badge key={s} variant="outline" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      <p className="mt-4 text-center text-xs text-fog-500 px-6">
        14-day free trial · No card required · Cancel anytime · Invoices available for record-keeping
      </p>

      <CTA />
    </>
  );
}

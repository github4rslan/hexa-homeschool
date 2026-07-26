import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { CTA } from "@/components/marketing/cta";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-jsonld";
import { TrackOnMount } from "@/components/analytics/analytics-provider";
import { PricingPlans, type PricingTier } from "@/components/marketing/pricing-plans";
import { annualBillingConfigured } from "@/lib/billing/stripe";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Edway Complete £49/mo, Edway Partner £99/mo. Additional subjects £15/mo each. 14-day free trial. Cancel anytime.",
};

const TIERS: PricingTier[] = [
  {
    name: "Edway Complete",
    tier: "standard",
    price: 49,
    features: [
      "Maths. English. Science.",
      "Full diagnostic and syllabus.",
      "Daily lessons and monthly mocks.",
      "Quarterly Local Authority portfolio.",
      "One tutor session per month.",
    ],
  },
  {
    name: "Edway Partner",
    tier: "family",
    price: 99,
    features: [
      "Everything in Complete.",
      "Three tutor sessions per month.",
      "Monthly teacher review.",
      "Local Authority defence support.",
    ],
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

export default function PricingPage() {
  const annualEnabled = annualBillingConfigured();
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Pricing", path: "/pricing" }]} />
      <TrackOnMount event="pricing_viewed" />
      <Section padded className="pt-16">
        <SectionHeader
          as="h1"
          eyebrow="Pricing"
          title={
            <>
              Honest pricing.{" "}
              <span className="text-gradient-forest">No surprises.</span>
            </>
          }
          description={`${
            annualEnabled ? "Save 17% when you pay annually. " : ""
          }14-day free trial. Cancel anytime. All prices in GBP and include UK VAT.`}
        />

        <PricingPlans tiers={TIERS} annualEnabled={annualEnabled} />
      </Section>

      {/* Additional subjects */}
      <Section padded={false} className="pb-8">
        <Container size="md">
          <div className="card-warm rounded-3xl p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:justify-between">
              <div className="max-w-md">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-clay-50 border border-clay-200">
                    <Plus className="h-4 w-4 text-clay-600" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-forest-900">
                    Additional Subjects
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-ink-600">
                  History. Geography. French. Spanish. Computer Science. Art.
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="font-editorial text-3xl font-semibold tracking-tight text-forest-900">
                    £15
                  </span>
                  <span className="text-sm text-ink-600">/ month each</span>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {ADDITIONAL_SUBJECTS.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-forest-600/20 bg-linen-50 px-3 py-1 text-xs font-medium text-forest-800"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <p className="mt-4 text-center text-sm text-ink-600 px-6">
        {annualEnabled ? "Annual payment saves 17%. " : ""}14-day free trial.
        Cancel anytime.
      </p>

      <CTA />
    </>
  );
}

import type { Metadata } from "next";
import { Check, Plus, Star } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { CTA } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "HEXA Complete £49/mo, HEXA Partner £99/mo. Additional subjects £15/mo each. Annual payment saves 17%. 14-day free trial. Cancel anytime.",
};

interface Tier {
  name: string;
  /** ParentDoc.subscription_tier value this plan checks out as. */
  tier: "standard" | "family";
  price: number;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    name: "HEXA Complete",
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
    name: "HEXA Partner",
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
  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="Pricing"
          title={
            <>
              Honest pricing.{" "}
              <span className="text-gradient-forest">No surprises.</span>
            </>
          }
          description="Annual payment saves 17%. 14-day free trial. Cancel anytime. All prices in GBP and include UK VAT."
        />

        <div className="mt-16 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-3xl p-8 md:p-10 ${
                tier.highlighted
                  ? "card-warm-tint ring-forest border-2 border-forest-600/30"
                  : "card-warm"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-clay-500 px-3 py-1 text-xs font-semibold text-linen-50">
                    <Star className="h-3 w-3 fill-linen-50" />
                    {tier.badge}
                  </span>
                </div>
              )}

              <h3 className="font-editorial text-2xl font-semibold tracking-tight text-forest-900">
                {tier.name}
              </h3>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-editorial text-5xl font-semibold tracking-tight text-forest-900">
                  £{tier.price}
                </span>
                <span className="text-sm text-ink-600">/ month</span>
              </div>

              {/* Signed-in parents go straight to Stripe Checkout; visitors
                  are bounced to /signup by the route. */}
              <Button
                href={`/api/billing/checkout?tier=${tier.tier}`}
                variant={tier.highlighted ? "forest" : "warm-outline"}
                size="md"
                className="mt-7 w-full"
              >
                Start free trial
              </Button>

              <ul className="mt-8 flex flex-col gap-3">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-ink-700"
                  >
                    <Check className="h-4 w-4 text-forest-600 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
        Annual payment saves 17%. 14-day free trial. Cancel anytime.
      </p>

      <CTA />
    </>
  );
}

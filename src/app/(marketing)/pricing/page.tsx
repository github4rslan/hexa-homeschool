import type { Metadata } from "next";
import { Check, Sparkles } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CTA } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent monthly pricing. No long-term lock-in. Cancel any time.",
};

interface Tier {
  name: string;
  description: string;
  price: { monthly: number; annual: number };
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    name: "Diagnostic",
    description: "Just the entry assessment — see where your child stands.",
    price: { monthly: 0, annual: 0 },
    features: [
      "60-minute diagnostic assessment",
      "Base grade estimation",
      "Core gap topography report",
      "Two-year projected path-to-ready",
      "No subscription required",
    ],
    cta: "Start diagnostic",
  },
  {
    name: "Standard",
    description: "Full HEXA platform for one student.",
    price: { monthly: 89, annual: 79 },
    features: [
      "Everything in Diagnostic",
      "Daily AI-driven lessons (Mathematics, English, Science)",
      "Monthly simulated mock exams",
      "Predictive grade tracking",
      "Parent monitoring dashboard",
      "Automated Local Authority portfolios",
      "Email + chat support",
    ],
    cta: "Start free trial",
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Family",
    description: "Two or more students under one account.",
    price: { monthly: 149, annual: 129 },
    features: [
      "Everything in Standard, per child",
      "Up to 4 students",
      "Multi-child parent dashboard",
      "Sibling-aware curriculum pacing",
      "Marketplace tutor priority queue",
      "Dedicated onboarding session",
    ],
    cta: "Start free trial",
  },
];

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
              <span className="text-gradient-violet">Compounding outcome.</span>
            </>
          }
          description="No surprise fees. No long-term contracts. Cancel any time. 14-day free trial on every paid tier — no card required to start."
        />

        <div className="mt-20 grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <Card
              key={tier.name}
              variant={tier.highlighted ? "glass-strong" : "glass"}
              padding="xl"
              className={
                tier.highlighted
                  ? "relative border-violet-400/40 glow-violet"
                  : ""
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
              {tier.price.annual > 0 && (
                <p className="mt-1 text-xs text-fog-500">
                  or £{tier.price.annual}/month billed annually (save{" "}
                  {Math.round(
                    ((tier.price.monthly - tier.price.annual) /
                      tier.price.monthly) *
                      100,
                  )}
                  %)
                </p>
              )}

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

        <p className="mt-12 text-center text-xs text-fog-500">
          All prices in GBP and include UK VAT. Invoices available for record-keeping.
        </p>
      </Section>

      <CTA />
    </>
  );
}

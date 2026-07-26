"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PricingTier {
  name: string;
  /** ParentDoc.subscription_tier value this plan checks out as. */
  tier: "standard" | "family";
  /** Headline monthly price in GBP. */
  price: number;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

/**
 * The annual price is deliberately two months free (pay for 10) — a clean 17%
 * saving that matches the copy. The authoritative amount charged is the Stripe
 * annual Price; this display just needs to agree with it.
 */
function annualTotal(monthly: number): number {
  return monthly * 10;
}

/**
 * Monthly/annual segmented toggle + tier cards. The annual side is only offered
 * when the server confirmed both annual Stripe price ids are provisioned
 * (`annualEnabled`); otherwise it degrades to the monthly-only layout with no
 * broken "save 17%" promise.
 */
export function PricingPlans({
  tiers,
  annualEnabled,
}: {
  tiers: PricingTier[];
  annualEnabled: boolean;
}) {
  const [annual, setAnnual] = useState(false);
  // Defensive: never let the annual view show if it isn't actually configured.
  const showAnnual = annualEnabled && annual;

  return (
    <>
      {annualEnabled && (
        <div className="mt-10 flex justify-center">
          <div
            role="tablist"
            aria-label="Billing cadence"
            className="inline-flex items-center gap-1 rounded-full border border-forest-600/20 bg-linen-50 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!annual}
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !annual
                  ? "bg-forest-700 text-linen-50"
                  : "text-ink-600 hover:text-forest-900"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={annual}
              onClick={() => setAnnual(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                annual
                  ? "bg-forest-700 text-linen-50"
                  : "text-ink-600 hover:text-forest-900"
              }`}
            >
              Annual
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  annual
                    ? "bg-linen-50/20 text-linen-50"
                    : "bg-clay-100 text-clay-700"
                }`}
              >
                Save 17%
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-start">
        {tiers.map((tier) => (
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
                £{showAnnual ? annualTotal(tier.price) : tier.price}
              </span>
              <span className="text-sm text-ink-600">
                {showAnnual ? "/ year" : "/ month"}
              </span>
            </div>

            {showAnnual && (
              <p className="mt-1.5 text-sm text-forest-700">
                Two months free — save 17%.
              </p>
            )}

            {/* Signed-in parents go straight to Stripe Checkout; visitors
                are bounced to /signup by the route. */}
            <Button
              href={`/api/billing/checkout?tier=${tier.tier}${
                showAnnual ? "&interval=annual" : ""
              }`}
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
    </>
  );
}

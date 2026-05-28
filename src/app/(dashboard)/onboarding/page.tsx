import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, Calendar, Sparkles, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HexaLogo } from "@/components/ui/hexa-logo";

export const metadata: Metadata = {
  title: "Welcome to HEXA",
};

const STEPS = [
  {
    number: "01",
    icon: User,
    title: "Tell us about your child",
    description:
      "Name, age, any documented SEND designations, and current academic year. Takes 2 minutes.",
    href: "/onboarding/child",
  },
  {
    number: "02",
    icon: Calendar,
    title: "Choose your target window",
    description:
      "Pick your GCSE entry season. We'll build a plan that hits it without compromising depth.",
    href: "/onboarding/target",
  },
  {
    number: "03",
    icon: Activity,
    title: "Run the diagnostic",
    description:
      "A 60-minute adaptive assessment establishes your child's baseline across all three subjects.",
    href: "/onboarding/diagnostic",
  },
];

export default function OnboardingPage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-mesh-hero opacity-60 -z-10 pointer-events-none" />

      <header className="p-6 lg:p-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2.5">
          <HexaLogo size={28} withText />
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/5 px-4 py-1.5 text-xs font-medium text-violet-300 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Three quick steps to your child's GCSE plan
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-fog-50 mb-4">
            Welcome to <span className="text-gradient-aurora">HEXA</span>
          </h1>
          <p className="text-lg text-fog-300 max-w-xl mx-auto">
            Set up takes about 8 minutes. Then HEXA does the rest — daily lessons,
            monthly mocks, and Local Authority paperwork on autopilot.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {STEPS.map((step) => (
            <Card key={step.number} variant="glass-strong" padding="lg" interactive>
              <Link href={step.href} className="flex items-center gap-6">
                <span className="font-mono text-3xl font-light text-fog-600 w-12 shrink-0">
                  {step.number}
                </span>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30">
                  <step.icon className="h-5 w-5 text-violet-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-fog-50">
                    {step.title}
                  </h3>
                  <p className="text-sm text-fog-400 mt-1">
                    {step.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-fog-400 shrink-0" />
              </Link>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button href="/onboarding/child" variant="primary" size="lg">
            Get started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, Calendar, Check, Sparkles, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HexaLogo } from "@/components/ui/hexa-logo";
import {
  currentParentId,
  getActiveChild,
  getDiagnosticCompletion,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";

export const metadata: Metadata = {
  title: "Welcome to Edway",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  // Reflect the active child's diagnostic completion so this overview never
  // invites starting a learning check that's already done (per-child).
  const parentId = await currentParentId();
  const child = parentId
    ? await getActiveChild(parentId, await readActiveChildId())
    : null;
  const diagnosticDone =
    parentId && child?._id
      ? (await getDiagnosticCompletion(parentId, child._id)).completed
      : false;

  const STEPS = [
    {
      number: "01",
      icon: User,
      title: "Tell us about your child",
      description:
        "Name, date of birth, any documented SEND designations, and an optional target exam window. Takes 2 minutes.",
      href: "/dashboard/children/new",
      done: !!child,
    },
    {
      number: "02",
      icon: Activity,
      title: diagnosticDone ? "Learning check complete" : "Run the diagnostic",
      description: diagnosticDone
        ? "Your child's baseline is saved. View their results any time."
        : "An adaptive assessment establishes your child's baseline across Maths, English and Science.",
      href: "/onboarding/diagnostic",
      done: diagnosticDone,
    },
    {
      number: "03",
      icon: Calendar,
      title: "Review & approve the plan",
      description:
        "The Planning Agent proposes a tailored weekly plan. You review, adjust, and approve before lessons begin.",
      href: "/schedule",
      done: false,
    },
  ];

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
            Three quick steps to your child's learning plan
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-fog-50 mb-4">
            Welcome to <span className="text-gradient-aurora">Edway</span>
          </h1>
          <p className="text-lg text-fog-300 max-w-xl mx-auto">
            Setup takes about 10 minutes. Then Edway does the rest — daily lessons,
            monthly mocks, and Local Authority paperwork on autopilot. Sit when ready.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {STEPS.map((step) => (
            <Card key={step.number} variant="glass-strong" padding="lg" interactive>
              <Link href={step.href} className="flex items-center gap-6">
                <span className="font-mono text-3xl font-light text-fog-600 w-12 shrink-0">
                  {step.number}
                </span>
                <div
                  className={
                    step.done
                      ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neon-400/40 bg-neon-500/10"
                      : "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/10"
                  }
                >
                  {step.done ? (
                    <Check className="h-5 w-5 text-neon-400" />
                  ) : (
                    <step.icon className="h-5 w-5 text-violet-300" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-fog-50">
                    {step.title}
                    {step.done && (
                      <Check className="h-4 w-4 text-neon-400" aria-label="Complete" />
                    )}
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
          <Button href="/dashboard/children/new" variant="primary" size="lg">
            Get started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

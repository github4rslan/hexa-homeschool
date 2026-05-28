import type { Metadata } from "next";
import { CheckCircle2, Circle, Loader2, Lock, Target, Users } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/fx/reveal";
import { ROADMAP, type PhaseStatus } from "@/lib/data/roadmap";
import { CTA } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "The four-phase HEXA roadmap — from internal trial to £2.5M+ ARR.",
};

const statusMap: Record<
  PhaseStatus,
  { icon: typeof CheckCircle2; label: string; classes: string }
> = {
  complete: {
    icon: CheckCircle2,
    label: "Complete",
    classes: "border-neon-400/40 bg-neon-500/10 text-neon-400",
  },
  in_progress: {
    icon: Loader2,
    label: "In progress",
    classes: "border-violet-400/40 bg-violet-500/10 text-violet-300",
  },
  upcoming: {
    icon: Circle,
    label: "Upcoming",
    classes: "border-white/10 bg-white/[0.02] text-fog-400",
  },
};

export default function RoadmapPage() {
  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="Roadmap"
          title={
            <>
              From internal trial
              <br />
              <span className="text-gradient-violet">to industry standard.</span>
            </>
          }
          description="Four phases. Twenty-four months. Public progress against published targets."
        />
      </Section>

      <Section padded={false} className="pb-32">
        <Container size="lg">
          <div className="flex flex-col gap-6">
            {ROADMAP.map((phase, i) => {
              const status = statusMap[phase.status];
              const StatusIcon = status.icon;
              return (
                <Reveal key={phase.id} delay={i * 0.08}>
                  <Card variant="glass-strong" padding="xl">
                    <div className="flex items-start justify-between flex-wrap gap-4 mb-8 pb-8 border-b border-white/5">
                      <div className="flex items-center gap-5">
                        <span className="font-mono text-5xl font-light text-fog-600">
                          {phase.number}
                        </span>
                        <div>
                          <h3 className="text-2xl md:text-3xl font-semibold text-fog-50">
                            {phase.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-3">
                            <span className="text-sm font-mono uppercase tracking-widest text-fog-500">
                              {phase.window}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${status.classes}`}
                      >
                        <StatusIcon
                          className={`h-3.5 w-3.5 ${phase.status === "in_progress" ? "animate-spin" : ""}`}
                        />
                        {status.label}
                      </div>
                    </div>

                    <p className="text-base text-fog-300 leading-relaxed mb-8 max-w-3xl">
                      {phase.objective}
                    </p>

                    <div className="grid lg:grid-cols-3 gap-8">
                      {/* Deliverables */}
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-widest text-fog-200 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-neon-400" />
                          Deliverables
                        </h4>
                        <ul className="flex flex-col gap-2">
                          {phase.deliverables.map((d) => (
                            <li
                              key={d}
                              className="flex items-start gap-2 text-sm text-fog-200"
                            >
                              <span className="h-1 w-1 rounded-full bg-neon-400 mt-2 shrink-0" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Excluded (if any) */}
                      {phase.excluded && (
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-widest text-fog-200 mb-3 flex items-center gap-2">
                            <Lock className="h-3.5 w-3.5 text-fog-500" />
                            Out of scope
                          </h4>
                          <ul className="flex flex-col gap-2">
                            {phase.excluded.map((e) => (
                              <li
                                key={e}
                                className="flex items-start gap-2 text-sm text-fog-500"
                              >
                                <span className="h-1 w-1 rounded-full bg-fog-600 mt-2 shrink-0" />
                                {e}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Team + cap */}
                      <div className="flex flex-col gap-6">
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-widest text-fog-200 mb-3 flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-violet-300" />
                            Team
                          </h4>
                          <ul className="flex flex-col gap-1.5">
                            {phase.team.map((t) => (
                              <li
                                key={t}
                                className="text-sm text-fog-300"
                              >
                                {t}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-mono uppercase tracking-widest text-fog-500">
                            Financial cap
                          </span>
                          <span className="text-2xl font-semibold text-fog-50 font-mono">
                            {phase.cap}
                          </span>
                        </div>

                        {phase.target && (
                          <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                            <span className="text-xs font-mono uppercase tracking-widest text-fog-500 flex items-center gap-1.5">
                              <Target className="h-3 w-3" />
                              Target
                            </span>
                            <Badge variant="violet" size="md" className="self-start">
                              {phase.target}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      <CTA />
    </>
  );
}

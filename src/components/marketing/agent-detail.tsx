"use client";

import { m } from "motion/react";
import { useState } from "react";
import { ChevronRight, ShieldCheck, Cpu, Inbox, Workflow, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AGENTS, type Agent } from "@/lib/data/agents";
import { cn } from "@/lib/utils";

const colorMap = {
  violet: "violet" as const,
  neon: "neon" as const,
  cyan: "cyan" as const,
  amber: "amber" as const,
  crimson: "crimson" as const,
  fog: "default" as const,
};

export function AgentDetails() {
  const [active, setActive] = useState<Agent>(AGENTS[0]);

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-8">
      {/* Sidebar — agent list */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500 mb-3 px-2">
          Multi-Agent Architecture
        </span>
        {AGENTS.map((agent) => {
          const isActive = active.id === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => setActive(agent)}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                isActive
                  ? "border-violet-400/40 bg-violet-500/10"
                  : "border-white/5 hover:border-white/15 hover:bg-white/[0.02]",
              )}
            >
              <span className={cn(
                "font-mono text-xs px-2 py-0.5 rounded-md",
                isActive ? "bg-violet-500/20 text-violet-300" : "bg-white/5 text-fog-400",
              )}>
                {agent.number}
              </span>
              <span className={cn(
                "flex-1 text-sm font-medium",
                isActive ? "text-fog-50" : "text-fog-200",
              )}>
                {agent.shortName}
              </span>
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                isActive ? "text-violet-300 translate-x-0.5" : "text-fog-600 group-hover:translate-x-0.5",
              )} />
            </button>
          );
        })}
      </div>

      {/* Active agent detail */}
      <m.div
        key={active.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card variant="glass-strong" padding="xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-8 border-b border-white/5">
            <div className="flex flex-col gap-3">
              <Badge variant={colorMap[active.color]} size="md">
                Agent {active.number}
              </Badge>
              <h2 className="text-4xl font-semibold tracking-tight text-fog-50">
                {active.name}
              </h2>
              <p className="text-base text-fog-300 leading-relaxed max-w-2xl">
                {active.tagline}.
              </p>
            </div>
          </div>

          {/* Function purpose */}
          <DetailBlock icon={Workflow} title="Functional purpose">
            <p>{active.purpose}</p>
          </DetailBlock>

          {/* Ingested parameters */}
          <DetailBlock icon={Inbox} title="Ingested parameters">
            <ul className="flex flex-wrap gap-2">
              {active.ingests.map((param) => (
                <Badge key={param} variant="outline" size="md">
                  {param}
                </Badge>
              ))}
            </ul>
          </DetailBlock>

          {/* Internal logic */}
          <DetailBlock icon={Cpu} title="Internal logic loop">
            <p className="font-mono text-sm leading-relaxed">{active.logic}</p>
          </DetailBlock>

          {/* Deliverables (if any) */}
          {active.deliverables && (
            <DetailBlock icon={Package} title="System deliverables">
              <ul className="grid grid-cols-2 gap-2">
                {active.deliverables.map((d) => (
                  <li
                    key={d}
                    className="flex items-center gap-2 text-sm text-fog-200"
                  >
                    <span className="h-1 w-1 rounded-full bg-neon-400" />
                    {d}
                  </li>
                ))}
              </ul>
            </DetailBlock>
          )}

          {/* Checker */}
          <div className="mt-8 p-6 rounded-2xl border border-amber-400/20 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">
                {active.checker.name}
              </span>
            </div>
            <p className="text-sm text-fog-200 leading-relaxed">
              {active.checker.role}
            </p>
          </div>

          {/* Tech */}
          <div className="mt-6 flex flex-wrap gap-2">
            {active.tech.map((t) => (
              <Badge key={t} variant="violet" size="sm">
                {t}
              </Badge>
            ))}
          </div>
        </Card>
      </m.div>
    </div>
  );
}

function DetailBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 first:mt-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-violet-300" />
        <h4 className="text-xs font-semibold uppercase tracking-widest text-fog-200">
          {title}
        </h4>
      </div>
      <div className="text-sm text-fog-300 leading-relaxed">{children}</div>
    </div>
  );
}

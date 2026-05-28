import type { Metadata } from "next";
import {
  AlertTriangle,
  ShieldAlert,
  Activity,
  Brain,
  AlertOctagon,
  Phone,
  Network,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { SlaTimer } from "@/components/admin/sla-timer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Escalations" };

interface Escalation {
  id: string;
  type: "safeguarding" | "distress" | "concept_block" | "checker_cascade" | "manual_request" | "statutory_audit" | "systemic_drift";
  child: { name: string; age: number };
  parent: string;
  trigger: string;
  createdAt: Date;
  slaMinutes: number;
  status: "open" | "acknowledged" | "assigned" | "resolved";
  assignedTo?: string;
}

// Demo data — replace with Supabase query
const now = Date.now();
const ESCALATIONS: Escalation[] = [
  {
    id: "esc_001",
    type: "distress",
    child: { name: "Theo K.", age: 12 },
    parent: "Sarah K.",
    trigger: "Input string matched despair vector: 'I want to give up'",
    createdAt: new Date(now - 2 * 60_000),
    slaMinutes: 5,
    status: "open",
  },
  {
    id: "esc_002",
    type: "concept_block",
    child: { name: "Amara T.", age: 13 },
    parent: "James T.",
    trigger: "3 sequential failures on chemistry · atomic structure sub-topic",
    createdAt: new Date(now - 11 * 60_000),
    slaMinutes: 15,
    status: "assigned",
    assignedTo: "Dr. Patel",
  },
  {
    id: "esc_003",
    type: "manual_request",
    child: { name: "Mia R.", age: 11 },
    parent: "Olivia R.",
    trigger: "Parent requested intervention via dashboard",
    createdAt: new Date(now - 24 * 60_000),
    slaMinutes: 60,
    status: "acknowledged",
  },
  {
    id: "esc_004",
    type: "checker_cascade",
    child: { name: "Luca M.", age: 12 },
    parent: "Priya M.",
    trigger: "Teaching Checker blocked 3 times in single session loop",
    createdAt: new Date(now - 8 * 60_000),
    slaMinutes: 15,
    status: "open",
  },
  {
    id: "esc_005",
    type: "statutory_audit",
    child: { name: "Daisy L.", age: 13 },
    parent: "David L.",
    trigger: "Local Authority audit notification — Cardiff Council",
    createdAt: new Date(now - 90 * 60_000),
    slaMinutes: 240,
    status: "assigned",
    assignedTo: "Education Law Team",
  },
  {
    id: "esc_006",
    type: "systemic_drift",
    child: { name: "—", age: 0 },
    parent: "—",
    trigger: "Meta Checker flagged Teaching Agent drift on algebra explanations",
    createdAt: new Date(now - 4 * 60 * 60_000),
    slaMinutes: 1440,
    status: "acknowledged",
  },
  {
    id: "esc_007",
    type: "concept_block",
    child: { name: "Noah F.", age: 12 },
    parent: "Aisha F.",
    trigger: "3 sequential failures on mathematics · simultaneous equations",
    createdAt: new Date(now - 18 * 60_000),
    slaMinutes: 15,
    status: "open",
  },
];

const typeMeta: Record<
  Escalation["type"],
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  safeguarding: { label: "Safeguarding", icon: ShieldAlert, color: "crimson" },
  distress: { label: "Distress vector", icon: Activity, color: "crimson" },
  concept_block: { label: "Concept block", icon: Brain, color: "amber" },
  checker_cascade: { label: "Checker cascade", icon: AlertOctagon, color: "amber" },
  manual_request: { label: "Manual request", icon: Phone, color: "violet" },
  statutory_audit: { label: "Statutory audit", icon: AlertTriangle, color: "violet" },
  systemic_drift: { label: "Systemic drift", icon: Network, color: "cyan" },
};

const statusBadge: Record<Escalation["status"], { label: string; variant: "crimson" | "amber" | "neon" | "violet" }> = {
  open: { label: "Open", variant: "crimson" },
  acknowledged: { label: "Acknowledged", variant: "amber" },
  assigned: { label: "Assigned", variant: "violet" },
  resolved: { label: "Resolved", variant: "neon" },
};

export default function EscalationsPage() {
  const breachAtRisk = ESCALATIONS.filter((e) => {
    const remaining = (e.createdAt.getTime() + e.slaMinutes * 60_000 - Date.now()) / 1000 / 60;
    return remaining < e.slaMinutes * 0.2 && e.status !== "resolved";
  }).length;

  return (
    <>
      <AdminTopbar
        title="Safety Net · Live Escalations"
        subtitle="Every triggered SLA across the HEXA platform"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Open right now"
            value={ESCALATIONS.filter((e) => e.status !== "resolved").length.toString()}
            accent="crimson"
            hint="across all severity tiers"
          />
          <MetricCard
            label="SLA breach risk"
            value={breachAtRisk.toString()}
            delta={{ value: ">80% elapsed", direction: "up", positive: false }}
            accent="amber"
          />
          <MetricCard
            label="Avg acknowledgement"
            value="4m 12s"
            delta={{ value: "−18%", direction: "down", positive: true }}
            hint="vs. last 30 days"
            accent="neon"
          />
          <MetricCard
            label="Resolved today"
            value="23"
            delta={{ value: "+5", direction: "up" }}
            hint="100% within SLA"
            accent="violet"
          />
        </section>

        {/* Active queue */}
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-fog-50">Active queue</h2>
              <p className="text-xs text-fog-500 mt-0.5">
                Sorted by SLA deadline · auto-refreshing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">Filter</Button>
              <Button variant="secondary" size="sm">Export CSV</Button>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {ESCALATIONS.filter((e) => e.status !== "resolved").map((e) => {
              const meta = typeMeta[e.type];
              const Icon = meta.icon;
              const status = statusBadge[e.status];
              const deadline = new Date(e.createdAt.getTime() + e.slaMinutes * 60_000);
              return (
                <div
                  key={e.id}
                  className="px-6 py-4 hover:bg-white/[0.02] transition-colors grid grid-cols-12 gap-4 items-start"
                >
                  {/* Icon + type */}
                  <div className="col-span-12 lg:col-span-3 flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                        meta.color === "crimson" && "bg-crimson-500/10 border-crimson-400/30 text-crimson-400",
                        meta.color === "amber" && "bg-amber-500/10 border-amber-400/30 text-amber-400",
                        meta.color === "violet" && "bg-violet-500/10 border-violet-400/30 text-violet-300",
                        meta.color === "cyan" && "bg-cyan-500/10 border-cyan-400/30 text-cyan-400",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-fog-50">
                        {meta.label}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
                        {e.id}
                      </div>
                    </div>
                  </div>

                  {/* Child + trigger */}
                  <div className="col-span-12 lg:col-span-5">
                    <div className="text-sm text-fog-100">
                      {e.child.name !== "—" ? (
                        <>
                          <span className="font-semibold">{e.child.name}</span>
                          <span className="text-fog-500"> · age {e.child.age} · </span>
                          <span className="text-fog-400">parent {e.parent}</span>
                        </>
                      ) : (
                        <span className="text-fog-500 italic">System-level event</span>
                      )}
                    </div>
                    <div className="text-xs text-fog-400 mt-1">{e.trigger}</div>
                  </div>

                  {/* SLA */}
                  <div className="col-span-6 lg:col-span-2 flex flex-col gap-1.5">
                    <SlaTimer deadline={deadline} slaMinutes={e.slaMinutes} />
                    <Badge variant={status.variant} size="sm" className="self-start">
                      {status.label}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="col-span-6 lg:col-span-2 flex items-center justify-end gap-2">
                    {e.status === "open" && (
                      <Button variant="primary" size="sm">
                        Acknowledge
                      </Button>
                    )}
                    {e.status === "acknowledged" && (
                      <Button variant="primary" size="sm">
                        Assign
                      </Button>
                    )}
                    {e.status === "assigned" && e.assignedTo && (
                      <span className="text-xs text-fog-400 font-mono">
                        → {e.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

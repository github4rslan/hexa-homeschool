import type { Metadata } from "next";
import { Filter, FileText, Search } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin · Audit Log" };

interface AuditEvent {
  id: string;
  timestamp: string;
  admin: string;
  role: string;
  action: string;
  target: string;
  ip: string;
  meta?: string;
}

const EVENTS: AuditEvent[] = [
  { id: "log_2891", timestamp: "2026-05-25 14:23:11", admin: "jane.doe@hexa.education", role: "super_admin", action: "escalation.assign", target: "esc_002", ip: "10.0.4.21", meta: "Assigned to Dr. K. Patel" },
  { id: "log_2890", timestamp: "2026-05-25 14:22:04", admin: "michael.b@hexa.education", role: "compliance", action: "dossier.export", target: "dos_001", ip: "10.0.4.18" },
  { id: "log_2889", timestamp: "2026-05-25 14:19:51", admin: "jane.doe@hexa.education", role: "super_admin", action: "parent.impersonate.start", target: "par_004", ip: "10.0.4.21", meta: "Support case #4421" },
  { id: "log_2888", timestamp: "2026-05-25 14:18:22", admin: "k.patel@hexa.education", role: "curriculum", action: "lesson.approve", target: "lesson_qe_v3", ip: "10.0.4.32" },
  { id: "log_2887", timestamp: "2026-05-25 14:15:09", admin: "jane.doe@hexa.education", role: "super_admin", action: "feature_flag.toggle", target: "elevenlabs_voice_v2", ip: "10.0.4.21", meta: "enabled: true" },
  { id: "log_2886", timestamp: "2026-05-25 14:12:48", admin: "michael.b@hexa.education", role: "compliance", action: "dsar.process", target: "dsar_001", ip: "10.0.4.18", meta: "Export generated" },
  { id: "log_2885", timestamp: "2026-05-25 14:10:33", admin: "tutor.ops@hexa.education", role: "tutor_manager", action: "tutor.verify", target: "tut_005", ip: "10.0.4.27" },
  { id: "log_2884", timestamp: "2026-05-25 14:08:17", admin: "jane.doe@hexa.education", role: "super_admin", action: "experiment.start", target: "exp_pricing_v2", ip: "10.0.4.21" },
];

const roleColor = {
  super_admin: "violet",
  operations: "cyan",
  curriculum: "neon",
  compliance: "amber",
  support: "default",
  tutor_manager: "violet",
} as const;

export default function AuditPage() {
  return (
    <>
      <AdminTopbar
        title="Audit Log"
        subtitle="Immutable record of every admin action"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Events · 24h"
            value="487"
            delta={{ value: "+62", direction: "up" }}
            accent="violet"
          />
          <MetricCard
            label="Active admins"
            value="7"
            hint="of 12 provisioned"
            accent="cyan"
          />
          <MetricCard
            label="Impersonations · 24h"
            value="3"
            hint="all logged with case ref"
            accent="amber"
          />
          <MetricCard
            label="Failed auth · 24h"
            value="0"
            accent="neon"
          />
        </section>

        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fog-500" />
              <input
                placeholder="Search by action, admin, target ID…"
                className="w-full h-10 rounded-lg bg-white/[0.03] border border-white/10 pl-10 pr-4 text-sm text-fog-50 placeholder:text-fog-500 focus:outline-none focus:border-violet-400/60"
              />
            </div>
            <Button variant="ghost" size="sm">
              <Filter className="h-3.5 w-3.5" />
              Filters
            </Button>
            <Button variant="secondary" size="sm">
              <FileText className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>

          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.02] text-[10px] font-mono uppercase tracking-widest text-fog-500">
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-3">Admin</div>
            <div className="col-span-3">Action</div>
            <div className="col-span-2">Target</div>
            <div className="col-span-2">Source</div>
          </div>

          <div className="divide-y divide-white/5 font-mono text-xs">
            {EVENTS.map((e) => (
              <div
                key={e.id}
                className="px-6 py-3 hover:bg-white/[0.02] transition-colors grid grid-cols-12 gap-4 items-center"
              >
                <div className="col-span-2 text-fog-500 tabular-nums">{e.timestamp}</div>
                <div className="col-span-3">
                  <div className="text-fog-100 truncate">{e.admin}</div>
                  <Badge variant={roleColor[e.role as keyof typeof roleColor]} size="sm" className="mt-1">
                    {e.role}
                  </Badge>
                </div>
                <div className="col-span-3 text-violet-300">{e.action}</div>
                <div className="col-span-2 text-fog-200">{e.target}</div>
                <div className="col-span-2 text-fog-500">
                  <div>{e.ip}</div>
                  {e.meta && <div className="text-fog-600 mt-0.5 truncate">{e.meta}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { Download, Eye, FileCheck, Hash } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin · Compliance" };

const DOSSIERS = [
  { id: "dos_001", child: "Aisha M.", period: "2026-Q2", generatedAt: "2026-05-24", hash: "0x4a9c…ff21", accessCount: 2, la: "Manchester CC" },
  { id: "dos_002", child: "Theo K.", period: "2026-Q2", generatedAt: "2026-05-22", hash: "0x88d1…3aa9", accessCount: 1, la: "Bristol CC" },
  { id: "dos_003", child: "Daisy L.", period: "2026-Q2", generatedAt: "2026-05-20", hash: "0xc3f1…91e4", accessCount: 0, la: "Edinburgh Council" },
  { id: "dos_004", child: "Mia R.", period: "2026-Q1", generatedAt: "2026-02-28", hash: "0x77b2…8c4d", accessCount: 4, la: "Camden BC" },
];

const DSARS = [
  { id: "dsar_001", parent: "James Kerr", type: "access", status: "in_progress", dueDate: "2026-06-01", daysRemaining: 7, assignedTo: "DPO" },
  { id: "dsar_002", parent: "Olivia Reed", type: "portability", status: "verified", dueDate: "2026-06-10", daysRemaining: 16, assignedTo: "Unassigned" },
];

const LA_ACCESS = [
  { time: "2 hours ago", officer: "M. Bennett", la: "Manchester CC", dossier: "dos_001", action: "Downloaded PDF" },
  { time: "5 hours ago", officer: "P. Singh", la: "Bristol CC", dossier: "dos_002", action: "Viewed" },
  { time: "Yesterday", officer: "M. Bennett", la: "Manchester CC", dossier: "dos_001", action: "Initial access" },
  { time: "3 days ago", officer: "K. Wright", la: "Camden BC", dossier: "dos_004", action: "Verified signature" },
];

export default function CompliancePage() {
  return (
    <>
      <AdminTopbar
        title="Compliance Operations"
        subtitle="LA dossiers, audit access logs, and data subject requests"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Dossiers active"
            value="1,127"
            hint="one per active child"
            accent="violet"
          />
          <MetricCard
            label="LA access this month"
            value="48"
            delta={{ value: "+12", direction: "up" }}
            accent="cyan"
          />
          <MetricCard
            label="DSARs open"
            value="2"
            hint="all within 30-day window"
            accent="amber"
          />
          <MetricCard
            label="Audit signatures"
            value="100%"
            hint="all dossiers SHA-256 verified"
            accent="neon"
          />
        </section>

        {/* DSAR queue */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-fog-50">DSAR queue</h2>
              <p className="text-xs text-fog-500 mt-0.5">
                UK GDPR · 30-day response window enforced
              </p>
            </div>
          </div>

          <Card variant="glass" padding="none" className="overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.02] text-[10px] font-mono uppercase tracking-widest text-fog-500">
              <div className="col-span-3">Request</div>
              <div className="col-span-3">Parent</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Due</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {DSARS.map((d) => (
              <div
                key={d.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
              >
                <div className="col-span-3">
                  <div className="font-mono text-xs text-fog-500">{d.id}</div>
                  <Badge variant={d.status === "in_progress" ? "violet" : "amber"} size="sm" className="mt-1">
                    {d.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="col-span-3 text-sm text-fog-100">{d.parent}</div>
                <div className="col-span-2">
                  <Badge variant="outline" size="sm">
                    {d.type}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-fog-200">{d.dueDate}</div>
                  <div
                    className={`text-[10px] font-mono mt-0.5 ${
                      d.daysRemaining < 7 ? "text-crimson-400" : "text-fog-500"
                    }`}
                  >
                    {d.daysRemaining} days left
                  </div>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button variant="ghost" size="sm">
                    Assign
                  </Button>
                  <Button variant="primary" size="sm">
                    Process
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </section>

        {/* Dossiers + LA access logs */}
        <section className="grid lg:grid-cols-5 gap-5">
          {/* Recent dossiers */}
          <Card variant="glass" padding="lg" className="lg:col-span-3">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">
                Recent dossiers
              </h2>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              {DOSSIERS.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-500/10 border border-neon-400/30">
                    <FileCheck className="h-4 w-4 text-neon-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-fog-50">
                        {d.child}
                      </span>
                      <Badge variant="violet" size="sm">
                        {d.period}
                      </Badge>
                    </div>
                    <div className="text-[10px] font-mono text-fog-500 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {d.hash}
                      </span>
                      <span>·</span>
                      <span>{d.la}</span>
                      <span>·</span>
                      <span>{d.accessCount} LA views</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* LA access log */}
          <Card variant="glass" padding="lg" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">LA access log</h2>
              <Badge variant="cyan" size="sm" pulse>
                Live
              </Badge>
            </div>
            <ul className="flex flex-col gap-3 font-mono text-xs">
              {LA_ACCESS.map((a, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 pb-3 border-b border-white/5 last:border-0 last:pb-0"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-400/30 shrink-0">
                    <Eye className="h-3 w-3 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-fog-200">
                      <span className="font-semibold">{a.officer}</span>
                      <span className="text-fog-500"> · {a.la}</span>
                    </div>
                    <div className="text-fog-500 mt-0.5">
                      {a.action} · {a.dossier}
                    </div>
                    <div className="text-fog-600 mt-0.5">{a.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </>
  );
}

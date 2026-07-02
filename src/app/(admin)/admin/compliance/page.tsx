import type { Metadata } from "next";
import { Download, FileCheck, Hash } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { IllustrativeBadge, IllustrativeNote } from "@/components/admin/illustrative";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminStats } from "@/lib/db/repo";
import { getAdminDossiers } from "@/lib/metrics/server";

export const metadata: Metadata = { title: "Admin · Compliance" };
export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const [stats, dossiers] = await Promise.all([
    getAdminStats(),
    getAdminDossiers(20),
  ]);
  const signedRecent = dossiers.filter((d) => d.hasHash).length;

  return (
    <>
      <AdminTopbar
        title="Compliance Operations"
        subtitle="LA dossiers and audit-signature integrity"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Dossiers generated"
            value={stats.dossiers.toLocaleString()}
            hint="portfolio evidence records"
            accent="violet"
          />
          <MetricCard
            label="Recent signed"
            value={dossiers.length > 0 ? `${signedRecent}/${dossiers.length}` : "—"}
            hint="latest dossiers with SHA-256 hash"
            accent="neon"
          />
          <MetricCard
            label="LA access (30d)"
            value="—"
            hint="not instrumented yet"
            accent="cyan"
          />
          <MetricCard
            label="DSARs open"
            value="—"
            hint="no request queue yet"
            accent="amber"
          />
        </section>

        {/* DSAR queue — no data source yet */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-fog-50">DSAR queue</h2>
              <p className="text-xs text-fog-500 mt-0.5">
                UK GDPR · 30-day response window
              </p>
            </div>
            <IllustrativeBadge />
          </div>
          <IllustrativeNote>
            Data subject access requests are handled over email today — there is
            no request-tracking collection, so no live queue is shown here. A
            structured DSAR workflow is a later-phase item (see docs/METRICS.md).
          </IllustrativeNote>
        </section>

        {/* Dossiers + LA access */}
        <section className="grid lg:grid-cols-5 gap-5">
          {/* Recent dossiers — real */}
          <Card variant="glass" padding="lg" className="lg:col-span-3">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">Recent dossiers</h2>
            </div>
            {dossiers.length === 0 ? (
              <p className="text-sm text-fog-500 py-6 text-center">
                No dossiers generated yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {dossiers.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 transition-all"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-500/10 border border-neon-400/30">
                      <FileCheck className="h-4 w-4 text-neon-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-fog-50">{d.childName}</span>
                        <Badge variant="violet" size="sm">{d.period}</Badge>
                      </div>
                      <div className="text-[10px] font-mono text-fog-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {d.hashShort}
                        </span>
                        <span>·</span>
                        <span>generated {d.generatedAt}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* LA access log — not instrumented */}
          <Card variant="glass" padding="lg" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">LA access log</h2>
              <IllustrativeBadge />
            </div>
            <p className="text-xs text-fog-400 leading-relaxed">
              Local-authority views of shared dossiers are not yet logged as
              discrete access events, so no live access trail is shown. Wiring an
              LA-access audit event is a later-phase item (see docs/METRICS.md).
            </p>
          </Card>
        </section>
      </div>
    </>
  );
}

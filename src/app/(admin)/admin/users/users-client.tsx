"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Eye, MoreHorizontal, Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parentMonthlyMrr } from "@/lib/metrics/finance";
import type { AdminParentRow } from "@/lib/db/repo";

const statusBadge = {
  trialing: { label: "Trialing", variant: "violet" as const },
  active: { label: "Active", variant: "neon" as const },
  past_due: { label: "Past due", variant: "amber" as const },
  canceled: { label: "Canceled", variant: "crimson" as const },
  paused: { label: "Paused", variant: "default" as const },
};

const tierBadge = {
  diagnostic: { label: "Diagnostic", variant: "outline" as const },
  standard: { label: "Standard", variant: "cyan" as const },
  family: { label: "Family", variant: "violet" as const },
};

export function UsersTable({ parents }: { parents: AdminParentRow[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "trialing" | "issues">("all");

  const filtered = useMemo(
    () =>
      parents.filter((p) => {
        const q = search.toLowerCase();
        const matchesSearch =
          q === "" ||
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q);
        const matchesFilter =
          filter === "all" ||
          (filter === "active" && p.status === "active") ||
          (filter === "trialing" && p.status === "trialing") ||
          (filter === "issues" && (p.status === "past_due" || p.status === "paused"));
        return matchesSearch && matchesFilter;
      }),
    [parents, search, filter],
  );

  return (
    <Card variant="glass" padding="none" className="overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fog-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search by name or email…"
            className="w-full h-10 rounded-lg bg-white/[0.03] border border-white/10 pl-10 pr-4 text-sm text-fog-50 placeholder:text-fog-500 focus:outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/20"
          />
        </div>
        <div className="flex gap-1 bg-white/[0.02] rounded-lg p-1">
          {(["all", "active", "trialing", "issues"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === f
                  ? "bg-violet-500/20 text-violet-200"
                  : "text-fog-400 hover:text-fog-100"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {filtered.length === 0 ? (
          <p className="text-sm text-fog-500 text-center py-10">
            {parents.length === 0
              ? "No parent accounts yet."
              : "No accounts match your search."}
          </p>
        ) : (
          filtered.map((p) => {
            const mrr = parentMonthlyMrr(p.tier, p.status);
            return (
              <div
                key={p.id}
                className="px-6 py-4 hover:bg-white/[0.02] transition-colors grid grid-cols-12 gap-4 items-center"
              >
                <div className="col-span-12 lg:col-span-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-sm font-semibold shrink-0">
                    {p.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "—"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-fog-50 truncate">{p.name}</div>
                    <div className="text-xs text-fog-500 font-mono truncate">{p.email}</div>
                  </div>
                </div>

                <div className="col-span-6 lg:col-span-2">
                  <div className="text-[10px] text-fog-600 font-mono">Joined {p.joinedAt}</div>
                </div>

                <div className="col-span-6 lg:col-span-2 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-fog-500" />
                  <span className="text-xs text-fog-300">
                    {p.childCount} {p.childCount === 1 ? "child" : "children"}
                  </span>
                </div>

                <div className="col-span-6 lg:col-span-2 flex items-center gap-2">
                  <Badge variant={tierBadge[p.tier].variant} size="sm">
                    {tierBadge[p.tier].label}
                  </Badge>
                  <Badge variant={statusBadge[p.status].variant} size="sm">
                    {statusBadge[p.status].label}
                  </Badge>
                </div>

                <div className="col-span-3 lg:col-span-1 text-right">
                  <div className="text-sm font-semibold text-fog-100 font-mono tabular-nums">
                    £{mrr}
                  </div>
                  <div className="text-[10px] text-fog-500 uppercase tracking-wider">/mo</div>
                </div>

                <div className="col-span-3 lg:col-span-1 flex items-center justify-end gap-1">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-fog-400 hover:text-fog-100 hover:bg-white/5 transition-colors"
                    aria-label="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-fog-400 hover:text-fog-100 hover:bg-white/5 transition-colors"
                    aria-label="More"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-fog-600 ml-1" />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between text-xs text-fog-500">
        <span>
          Showing {filtered.length} of {parents.length}
        </span>
      </div>
    </Card>
  );
}

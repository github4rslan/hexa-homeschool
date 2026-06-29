"use client";

import { useState } from "react";
import {
  ChevronRight,
  Eye,
  MoreHorizontal,
  Search,
  Users,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Parent {
  id: string;
  name: string;
  email: string;
  location: string;
  children: { name: string; age: number }[];
  tier: "diagnostic" | "standard" | "family";
  status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  joinedAt: string;
  mrr: number;
}

const PARENTS: Parent[] = [
  {
    id: "par_001",
    name: "Priya Mehta",
    email: "priya.m@example.com",
    location: "Manchester",
    children: [{ name: "Aisha", age: 12 }, { name: "Luca", age: 9 }],
    tier: "family",
    status: "active",
    joinedAt: "2026-02-14",
    mrr: 149,
  },
  {
    id: "par_002",
    name: "James Kerr",
    email: "j.kerr@example.com",
    location: "Bristol",
    children: [{ name: "Theo", age: 11 }],
    tier: "standard",
    status: "active",
    joinedAt: "2026-03-02",
    mrr: 89,
  },
  {
    id: "par_003",
    name: "Sarah Thompson",
    email: "sarah.t@example.com",
    location: "Edinburgh",
    children: [{ name: "Daisy", age: 12 }, { name: "Max", age: 10 }, { name: "Ollie", age: 8 }],
    tier: "family",
    status: "active",
    joinedAt: "2025-11-20",
    mrr: 149,
  },
  {
    id: "par_004",
    name: "Olivia Reed",
    email: "olivia.r@example.com",
    location: "London",
    children: [{ name: "Mia", age: 13 }],
    tier: "standard",
    status: "trialing",
    joinedAt: "2026-05-19",
    mrr: 0,
  },
  {
    id: "par_005",
    name: "David Lewis",
    email: "d.lewis@example.com",
    location: "Cardiff",
    children: [{ name: "Noah", age: 11 }],
    tier: "standard",
    status: "past_due",
    joinedAt: "2026-01-08",
    mrr: 89,
  },
  {
    id: "par_006",
    name: "Aisha Nasir",
    email: "a.nasir@example.com",
    location: "Birmingham",
    children: [{ name: "Zara", age: 12 }, { name: "Yusuf", age: 10 }],
    tier: "family",
    status: "active",
    joinedAt: "2026-04-04",
    mrr: 149,
  },
];

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

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "trialing" | "issues">("all");

  const filtered = PARENTS.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && p.status === "active") ||
      (filter === "trialing" && p.status === "trialing") ||
      (filter === "issues" && (p.status === "past_due" || p.status === "paused"));
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <AdminTopbar
        title="Parents & Children"
        subtitle="All Edway accounts with subscription state"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total accounts"
            value="1,284"
            delta={{ value: "+47", direction: "up" }}
            accent="violet"
            sparkline={[1230, 1240, 1252, 1261, 1270, 1278, 1284]}
          />
          <MetricCard
            label="Active subscribers"
            value="1,127"
            delta={{ value: "+38", direction: "up" }}
            accent="neon"
          />
          <MetricCard
            label="In trial"
            value="142"
            delta={{ value: "+12", direction: "up" }}
            accent="cyan"
          />
          <MetricCard
            label="Past due"
            value="15"
            delta={{ value: "+3", direction: "up", positive: false }}
            accent="amber"
          />
        </section>

        {/* Search + filters */}
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fog-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search by name, email, location…"
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
            <Button variant="secondary" size="sm">
              Export
            </Button>
          </div>

          <div className="divide-y divide-white/5">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="px-6 py-4 hover:bg-white/[0.02] transition-colors grid grid-cols-12 gap-4 items-center"
              >
                <div className="col-span-12 lg:col-span-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-sm font-semibold shrink-0">
                    {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-fog-50 truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-fog-500 font-mono truncate">
                      {p.email}
                    </div>
                  </div>
                </div>

                <div className="col-span-6 lg:col-span-2">
                  <div className="text-xs text-fog-400">{p.location}</div>
                  <div className="text-[10px] text-fog-600 font-mono mt-0.5">
                    Joined {p.joinedAt}
                  </div>
                </div>

                <div className="col-span-6 lg:col-span-2 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-fog-500" />
                  <span className="text-xs text-fog-300">
                    {p.children.length} {p.children.length === 1 ? "child" : "children"}
                  </span>
                  <div className="text-[10px] text-fog-500 font-mono">
                    · {p.children.map((c) => `${c.name} (${c.age})`).join(", ")}
                  </div>
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
                    £{p.mrr}
                  </div>
                  <div className="text-[10px] text-fog-500 uppercase tracking-wider">
                    /mo
                  </div>
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
            ))}
          </div>

          <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between text-xs text-fog-500">
            <span>
              Showing {filtered.length} of {PARENTS.length}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                Previous
              </Button>
              <Button variant="ghost" size="sm">
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

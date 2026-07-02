"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LogOut, Settings, Sparkles } from "lucide-react";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { Badge } from "@/components/ui/badge";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { NAV, isAdminNavActive } from "@/components/admin/nav-items";
import { cn } from "@/lib/utils";

type AdminIdentity = {
  name: string;
  role: string;
};

export function AdminSidebar({ identity }: { identity?: AdminIdentity }) {
  const pathname = usePathname();
  const name = identity?.name || "Admin";
  const role = identity?.role || "admin";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "A";

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-white/5 bg-abyss/80 backdrop-blur-xl sticky top-0 h-screen">
      <div className="p-6 border-b border-white/5">
        <Link href="/admin" className="inline-flex items-center gap-2.5">
          <HexaLogo size={28} withText />
          <Badge variant="violet" size="sm" className="ml-auto">
            Admin
          </Badge>
        </Link>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
        {NAV.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-fog-600 px-3 mb-1">
              {group.label}
            </span>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isAdminNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all relative",
                    active
                      ? "bg-violet-500/10 border border-violet-400/30 text-fog-50"
                      : "text-fog-300 hover:bg-white/5 hover:text-fog-50 border border-transparent",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badge.variant} size="sm" pulse>
                      {item.badge.value}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3 w-3 text-neon-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-neon-400">
              System nominal
            </span>
          </div>
          <p className="text-xs text-fog-400 leading-snug">
            All agents operational · No drift detected
          </p>
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-xs font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-fog-100 truncate">
              {name}
            </div>
            <div className="text-[10px] text-fog-500 truncate">
              {role}
            </div>
          </div>
          <button
            className="text-fog-500 hover:text-fog-100 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AdminTopbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="h-16 border-b border-white/5 bg-abyss/70 backdrop-blur-xl flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 sticky top-0 z-30">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <AdminMobileNav />
        <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <h1 className="min-w-0 truncate text-base sm:text-lg font-semibold text-fog-50">{title}</h1>
          {/* Non-essential status pill: hidden below sm so the title never
              competes for width on a phone. */}
          <Badge variant="outline" size="sm" className="hidden shrink-0 sm:inline-flex">
            <span className="relative flex h-1.5 w-1.5 mr-1">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon-400" />
            </span>
            Live
          </Badge>
        </div>
        {subtitle && (
          <span className="block truncate text-xs text-fog-500">{subtitle}</span>
        )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button className="hidden sm:flex h-9 items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-3 text-xs font-mono text-fog-300 transition-all">
          <Activity className="h-3.5 w-3.5" />
          API · 142ms
        </button>
        <Link
          href="/admin/settings"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-fog-300 hover:text-fog-50 transition-all"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

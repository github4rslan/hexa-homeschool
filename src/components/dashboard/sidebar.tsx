"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Activity,
  Sparkles,
  GraduationCap,
  FileCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { ChildSwitcher, type SwitcherChild } from "./child-switcher";
import { cn } from "@/lib/utils";

// Only routes that actually exist — every link here resolves to a real page.
const NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Child mode", href: "/learn", icon: Sparkles },
  { label: "Add child", href: "/dashboard/children/new", icon: UserPlus },
  { label: "Diagnostic", href: "/onboarding/diagnostic", icon: Activity },
  { label: "Lesson", href: "/lesson", icon: GraduationCap },
  { label: "Portfolio", href: "/portfolio", icon: FileCheck },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function DashboardSidebar({
  childList = [],
  activeChildId = null,
}: {
  childList?: SwitcherChild[];
  activeChildId?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-white/5 bg-abyss/70 backdrop-blur-xl">
      <div className="p-6 border-b border-white/5">
        <Link href="/dashboard" className="inline-flex items-center gap-2.5">
          <HexaLogo size={28} withText />
        </Link>
      </div>

      {childList.length > 1 && (
        <div className="pt-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500 px-5 mb-2 block">
            Active child
          </span>
          <ChildSwitcher items={childList} activeId={activeChildId} />
        </div>
      )}

      <nav className="flex-1 p-4 flex flex-col gap-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500 px-3 mb-2 mt-2">
          Workspace
        </span>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-violet-500/10 border border-violet-400/30 text-fog-50"
                  : "text-fog-300 hover:bg-white/5 hover:text-fog-50 border border-transparent",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <form action="/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fog-400 hover:bg-white/5 hover:text-fog-100 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

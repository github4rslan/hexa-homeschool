import {
  LayoutDashboard,
  UserPlus,
  Activity,
  Sparkles,
  GraduationCap,
  CalendarDays,
  Users,
  FileCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Single source of truth for parent-workspace navigation, shared by the
// desktop sidebar and the mobile drawer so the two never drift apart.
// Only routes that actually exist — every link resolves to a real page.
export const DASHBOARD_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Child mode", href: "/learn", icon: Sparkles },
  { label: "Add child", href: "/dashboard/children/new", icon: UserPlus },
  { label: "Diagnostic", href: "/onboarding/diagnostic", icon: Activity },
  { label: "Lesson", href: "/lesson", icon: GraduationCap },
  { label: "Weekly plan", href: "/schedule", icon: CalendarDays },
  { label: "Tutoring", href: "/tutoring", icon: Users },
  { label: "Portfolio", href: "/portfolio", icon: FileCheck },
  { label: "Settings", href: "/settings", icon: Settings },
];

/** Shared active-route test used by both navs. */
export function isNavActive(pathname: string, href: string): boolean {
  return (
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
  );
}

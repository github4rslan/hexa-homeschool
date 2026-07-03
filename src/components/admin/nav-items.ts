import {
  AlertOctagon,
  BookOpen,
  ClipboardList,
  FlaskConical,
  Gauge,
  GraduationCap,
  Mail,
  MessageSquareHeart,
  Network,
  PoundSterling,
  Settings,
  ShieldAlert,
  UserCog,
  Users,
} from "lucide-react";

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: { value: string; variant: "violet" | "neon" | "amber" | "crimson" };
}

// Single source of truth for the admin navigation, shared by the desktop
// sidebar and the mobile drawer so the two can never drift apart.
export const NAV: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { label: "Overview", href: "/admin", icon: Gauge },
      {
        label: "Escalations",
        href: "/admin/escalations",
        icon: ShieldAlert,
      },
      { label: "Agent activity", href: "/admin/agents", icon: Network },
      { label: "Parent feedback", href: "/admin/feedback", icon: MessageSquareHeart },
      { label: "Audit log", href: "/admin/audit", icon: ClipboardList },
    ],
  },
  {
    label: "People",
    items: [
      {
        label: "Parents & children",
        href: "/admin/users",
        icon: Users,
      },
      {
        label: "Staff & access",
        href: "/admin/staff",
        icon: UserCog,
      },
      {
        label: "Tutors",
        href: "/admin/tutors",
        icon: GraduationCap,
      },
    ],
  },
  {
    label: "Compliance",
    items: [
      {
        label: "Dossiers & DSARs",
        href: "/admin/compliance",
        icon: AlertOctagon,
      },
    ],
  },
  {
    label: "Product",
    items: [
      { label: "Curriculum CMS", href: "/admin/curriculum", icon: BookOpen },
      { label: "Experiments", href: "/admin/experiments", icon: FlaskConical },
      { label: "Feature flags", href: "/admin/settings", icon: Settings },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Finance", href: "/admin/finance", icon: PoundSterling },
      { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
    ],
  },
];

/** Shared active-route test used by both admin navs. */
export function isAdminNavActive(pathname: string, href: string): boolean {
  return (
    pathname === href || (href !== "/admin" && pathname.startsWith(href))
  );
}

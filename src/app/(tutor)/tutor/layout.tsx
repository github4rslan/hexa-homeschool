import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Video } from "lucide-react";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth/session";
import { can, resolveRole } from "@/lib/auth/rbac";
import { findParentById } from "@/lib/db/repo";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/tutor");
  const account = await findParentById(session.id);
  const role = account
    ? resolveRole({ role: account.role, is_admin: account.is_admin })
    : null;
  if (!can(role, "tutor.session.read")) redirect("/dashboard");

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-20 -z-10 pointer-events-none" />
      <header className="sticky top-0 z-30 border-b border-white/5 bg-abyss/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link href="/tutor" className="flex items-center gap-2">
            <HexaLogo size={28} withText />
            <Badge variant="neon" size="sm">Tutor</Badge>
          </Link>
          <nav className="flex flex-1 justify-end">
            <Link
              href="/tutor"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-fog-300 hover:bg-white/5 hover:text-fog-50"
            >
              <Video className="h-4 w-4" />
              Sessions
            </Link>
          </nav>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-fog-400 hover:bg-white/5 hover:text-fog-50"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}

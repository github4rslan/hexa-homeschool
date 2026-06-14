import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getSession } from "@/lib/auth/session";
import { findParentById } from "@/lib/db/repo";
import { resolveRole } from "@/lib/auth/rbac";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Role gate: the middleware only guarantees a session; the admin surface
  // shows cross-family data (incl. children's escalation text), so it must be
  // limited to staff. Roles are granted manually in Atlas — never self-serve.
  // Both admin and support may READ the admin surface; write gating is enforced
  // per-action via the rbac permission matrix.
  const session = await getSession();
  if (!session) redirect("/login?redirect=/admin");
  const parent = await findParentById(session.id);
  const role = parent
    ? resolveRole({ role: parent.role, is_admin: parent.is_admin })
    : null;
  if (!role) redirect("/dashboard");

  const displayName = session.email?.split("@")[0] || "Staff";

  return (
    <div className="relative min-h-screen flex">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-20 -z-10 pointer-events-none" />
      <div className="fixed inset-0 noise -z-10" />

      <AdminSidebar
        identity={{
          name: displayName,
          role,
        }}
      />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}

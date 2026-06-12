import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getSession } from "@/lib/auth/session";
import { findParentById } from "@/lib/db/repo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Role gate: the middleware only guarantees a session; the admin surface
  // shows cross-family data (incl. children's escalation text), so it must be
  // limited to staff. is_admin is granted manually in Atlas — never self-serve.
  const session = await getSession();
  if (!session) redirect("/login?redirect=/admin");
  const parent = await findParentById(session.id);
  if (!parent?.is_admin) redirect("/dashboard");

  const displayName = session.email?.split("@")[0] || "Admin";

  return (
    <div className="relative min-h-screen flex">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-20 -z-10 pointer-events-none" />
      <div className="fixed inset-0 noise -z-10" />

      <AdminSidebar
        identity={{
          name: displayName,
          role: "admin",
        }}
      />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}

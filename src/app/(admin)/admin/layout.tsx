import { AdminSidebar } from "@/components/admin/sidebar";
import { getSession } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const displayName = session?.email?.split("@")[0] || "Admin";

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

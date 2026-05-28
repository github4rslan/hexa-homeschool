import { AdminSidebar } from "@/components/admin/sidebar";
import { createClient } from "@/lib/supabase/server";

type AdminProfile = {
  full_name: string;
  role: string;
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let admin: AdminProfile | null = null;
  if (user) {
    const { data } = await supabase
      .from("admins")
      .select("full_name, role")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    admin = data as AdminProfile | null;
  }
  const displayName =
    admin?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Admin";

  return (
    <div className="relative min-h-screen flex">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-20 -z-10 pointer-events-none" />
      <div className="fixed inset-0 noise -z-10" />

      <AdminSidebar
        identity={{
          name: displayName,
          role: admin?.role || "admin",
        }}
      />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}

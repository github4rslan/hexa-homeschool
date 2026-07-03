import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { Card } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { findParentById, listStaff } from "@/lib/db/repo";
import { resolveRole } from "@/lib/auth/rbac";
import { StaffConsole } from "./staff-client";

export const metadata: Metadata = { title: "Admin · Staff & access" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await getSession();
  const parent = session ? await findParentById(session.id) : null;
  const role = parent
    ? resolveRole({ role: parent.role, is_admin: parent.is_admin })
    : null;

  return (
    <>
      <AdminTopbar
        title="Staff & access"
        subtitle="Grant or revoke staff roles — audited, admin-only"
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1100px]">
        {role !== "admin" ? (
          <Card variant="glass" padding="lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-400/30 shrink-0">
                <Lock className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-fog-50">
                  Admin access required
                </h2>
                <p className="text-sm text-fog-400 mt-0.5">
                  Only admins can grant or revoke staff roles. You&apos;re signed
                  in as <span className="font-mono">{role ?? "guest"}</span>.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <StaffConsole
            staff={await listStaff()}
            currentUserId={session!.id}
          />
        )}
      </div>
    </>
  );
}

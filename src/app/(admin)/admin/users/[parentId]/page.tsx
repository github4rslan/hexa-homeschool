import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { Card } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { findParentById, getAdminParentDetail } from "@/lib/db/repo";
import { resolveRole } from "@/lib/auth/rbac";
import { FamilyConsole } from "./family-console";

export const metadata: Metadata = { title: "Admin · Account detail" };
export const dynamic = "force-dynamic";

export default async function ParentDetailPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const session = await getSession();
  const actor = session ? await findParentById(session.id) : null;
  const role = actor
    ? resolveRole({ role: actor.role, is_admin: actor.is_admin })
    : null;

  const detail = role === "admin" ? await getAdminParentDetail(parentId) : null;
  if (role === "admin" && !detail) notFound();

  return (
    <>
      <AdminTopbar title="Account detail" subtitle="Full family control — audited" />
      <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[900px]">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-fog-400 hover:text-fog-100 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> All accounts
        </Link>

        {role !== "admin" ? (
          <Card variant="glass" padding="lg">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-300 shrink-0" />
              <p className="text-sm text-fog-300">
                Full account control is admin-only. You&apos;re signed in as{" "}
                <span className="font-mono">{role ?? "guest"}</span>.
              </p>
            </div>
          </Card>
        ) : (
          detail && <FamilyConsole detail={detail} />
        )}
      </div>
    </>
  );
}

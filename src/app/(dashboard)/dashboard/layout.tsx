import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { currentParentId, listChildren, getActiveChild } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import type { SwitcherChild } from "@/components/dashboard/child-switcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Provide the sidebar with the family's children + the active selection so
  // the multi-child switcher can render. Cheap reads; gracefully empty if new.
  let childList: SwitcherChild[] = [];
  let activeChildId: string | null = null;

  const parentId = await currentParentId();
  if (parentId) {
    const kids = await listChildren(parentId);
    childList = kids.map((c) => ({ id: c._id!.toHexString(), name: c.full_name }));
    const active = await getActiveChild(parentId, await readActiveChildId());
    activeChildId = active?._id?.toHexString() ?? null;
  }

  return (
    <div className="relative min-h-screen flex">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-30 -z-10 pointer-events-none" />

      <DashboardSidebar childList={childList} activeChildId={activeChildId} />

      {/* Mobile-only menu trigger — floats top-right where no sidebar exists. */}
      <div className="lg:hidden fixed top-3 right-3 z-40">
        <MobileNav childList={childList} activeChildId={activeChildId} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}

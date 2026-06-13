import { currentParentId } from "@/lib/db/repo";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

/**
 * Dashboard group layout. Exists to mount parents-only analytics with the
 * parent identified by Mongo id (never email/name). The (child) group must
 * NOT get an equivalent — children are never tracked (Children's Code).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const parentId = await currentParentId();
  return (
    <>
      {children}
      <AnalyticsProvider identifyAs={parentId} />
    </>
  );
}

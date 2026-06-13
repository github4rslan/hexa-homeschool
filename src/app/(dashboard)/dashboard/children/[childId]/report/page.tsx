import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentParentId, getChildById, monthlyReport } from "@/lib/db/repo";
import { MonthlyReportView } from "@/components/dashboard/monthly-report-view";
import type { Subject } from "@/lib/db/types";

export const metadata: Metadata = { title: "Monthly report" };
export const dynamic = "force-dynamic";

const SUBJECT_LABEL: Record<Subject, string> = {
  mathematics: "Mathematics",
  english: "English",
  science: "Science",
};

export default async function MonthlyReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { childId } = await params;
  const { month: monthParam } = await searchParams;

  const parentId = await currentParentId();
  if (!parentId) redirect("/login");
  const child = await getChildById(parentId, childId);
  if (!child?._id) redirect("/dashboard");

  // month param is "YYYY-MM"; default to the current UTC month.
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const report = await monthlyReport(parentId, child._id, year, month);
  if (!report) redirect(`/dashboard/children/${childId}`);

  return (
    <MonthlyReportView
      report={report}
      childId={childId}
      subjectLabels={SUBJECT_LABEL}
    />
  );
}

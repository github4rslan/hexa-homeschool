import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/admin/actor";
import { adminAllNewsletterSubscribers, recordStaffAction } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** RFC-4180 CSV cell: wrap in quotes and double any embedded quote. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Download the full newsletter subscriber list as CSV. ADMIN-only — a bulk
 * PII export is more sensitive than the read-only on-page list (which support
 * may also view), so it takes the stricter gate and is written to the staff
 * audit trail.
 */
export async function GET() {
  const actor = await requireAdminActor();
  if ("error" in actor) {
    return NextResponse.json({ error: actor.error }, { status: 403 });
  }

  const rows = await adminAllNewsletterSubscribers();

  const header = ["email", "source", "subscribed_at"].join(",");
  const lines = rows.map((r) =>
    [csvCell(r.email), csvCell(r.source), csvCell(r.subscribedAt)].join(","),
  );
  // Prepend a UTF-8 BOM so Excel opens non-ASCII emails correctly.
  const csv = `﻿${[header, ...lines].join("\r\n")}\r\n`;

  await recordStaffAction({
    staffId: actor.id,
    staffEmail: actor.email,
    action: "newsletter.export_csv",
    targetCollection: "newsletter",
    reason: `Exported ${rows.length} subscriber(s)`,
    ip: actor.ip,
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="edway-subscribers-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — liveness + DB readiness probe for an external uptime
 * monitor (BetterStack / UptimeRobot). No auth (must be probe-able), no data
 * exposure: returns only { ok, db } and a timestamp. 200 when the MongoDB ping
 * succeeds, 503 when it doesn't. Lightly rate-limited per IP so it can't be
 * abused to hammer the DB ping.
 */
export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await rateLimit(`health:${ip}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return NextResponse.json(
      { ok: true, db: "up", time: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[/api/health] db ping failed:", err);
    return NextResponse.json(
      { ok: false, db: "down", time: new Date().toISOString() },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

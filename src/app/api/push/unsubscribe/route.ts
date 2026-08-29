import { NextResponse } from "next/server";
import { currentParentId, removePushSubscription } from "@/lib/db/repo";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Remove a browser Web Push subscription for the signed-in parent (F4) — the
 * parent turned notifications off (or the browser rotated the endpoint).
 */
export async function POST(request: Request) {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // B4 (2026-08-29) — same generous per-parent limit as /api/push/subscribe.
  const limited = await rateLimit(`push-unsub:${parentId}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  let body: { endpoint?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  }

  const ok = await removePushSubscription(parentId, endpoint);
  return NextResponse.json({ ok });
}

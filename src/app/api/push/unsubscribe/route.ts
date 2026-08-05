import { NextResponse } from "next/server";
import { currentParentId, removePushSubscription } from "@/lib/db/repo";

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

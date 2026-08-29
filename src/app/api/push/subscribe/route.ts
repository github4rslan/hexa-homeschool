import { NextResponse } from "next/server";
import { currentParentId, addPushSubscription } from "@/lib/db/repo";
import { webPushConfigured } from "@/lib/notify/web-push";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Store a browser Web Push subscription for the signed-in parent (F4).
 * Parents-only by construction (session-scoped, never called from child mode).
 * No-op 503 when Web Push is unconfigured. The endpoint + keys come from the
 * browser's PushSubscription — we persist them keyed by endpoint on the parent.
 */
export async function POST(request: Request) {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!webPushConfigured()) {
    return NextResponse.json({ error: "Web Push is not configured." }, { status: 503 });
  }

  // B4 (2026-08-29): generous per-parent limit so a normal "enable
  // notifications" click never trips it, but a compromised session or a
  // buggy client retry-loop can't spam subscription writes.
  const limited = await rateLimit(`push-sub:${parentId}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  let body: {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body.keys?.auth === "string" ? body.keys.auth : "";
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  const ok = await addPushSubscription(parentId, { endpoint, keys: { p256dh, auth } });
  return NextResponse.json({ ok }, { status: ok ? 200 : 500 });
}

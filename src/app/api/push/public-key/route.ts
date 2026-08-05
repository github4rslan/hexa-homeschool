import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/notify/web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The public VAPID key the browser needs to subscribe to Web Push (F4). Returns
 * 503 when Web Push is unconfigured (WEB_PUSH_* unset) so the client cleanly
 * treats push as unavailable and hides the subscribe control — never a crash.
 */
export async function GET() {
  const key = getVapidPublicKey();
  if (!key) {
    return NextResponse.json({ error: "Web Push is not configured." }, { status: 503 });
  }
  return NextResponse.json({ key });
}

import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/notify/web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The public VAPID key the browser needs to subscribe to Web Push (F4). Always
 * responds 200 — `{ key: null }` when Web Push is unconfigured (WEB_PUSH_* unset)
 * so the client cleanly treats push as unavailable and hides the subscribe
 * control WITHOUT the browser logging a failed-resource console error (a plain
 * 503 shows up red in the console on every settings load). The key is public
 * (served to browsers by design), so exposing it carries no secret.
 */
export async function GET() {
  return NextResponse.json({ key: getVapidPublicKey() });
}

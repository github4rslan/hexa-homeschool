import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export const runtime = "nodejs";

/** POST /logout — clear the session cookie and return home. */
export async function POST(request: Request) {
  await destroySession();
  // 303 See Other: force the browser to GET "/". Without an explicit status,
  // NextResponse.redirect defaults to 307, which PRESERVES the POST method —
  // the browser would then POST to "/" and get a 405. 303 switches it to GET.
  return NextResponse.redirect(new URL("/", request.url), 303);
}

import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export const runtime = "nodejs";

/** POST /logout — clear the session cookie and return home. */
export async function POST(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url));
}

import { NextResponse } from "next/server";
import { getCollection, Collections } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubscriberDoc {
  email: string;
  source: string;
  created_at: Date;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public newsletter signup. Idempotent on email (unique index). */
export async function POST(request: Request) {
  // Public + unauthenticated, so key the limit on the caller's IP.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await rateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  let body: { email?: unknown; source?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; source?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const source =
    typeof body.source === "string" ? body.source.slice(0, 60) : "footer";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    const col = await getCollection<SubscriberDoc>(Collections.newsletter);
    await col.updateOne(
      { email },
      { $setOnInsert: { email, source, created_at: new Date() } },
      { upsert: true },
    );
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[/api/newsletter] failed:", err);
    return NextResponse.json(
      { error: "Could not subscribe right now. Please try again." },
      { status: 500 },
    );
  }
}

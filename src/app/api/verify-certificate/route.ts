import { NextResponse } from "next/server";
import { verifyTopicCertificate } from "@/lib/db/repo";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * F5 — public certificate verification. Given a certificate's 64-hex SHA-256
 * hash, confirms authenticity and returns ONLY the facts already printed on the
 * certificate (child first name, topic, subject, date). No auth, no other child
 * data, read-only. Rate-limited per IP to deter probing.
 */
export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await rateLimit(`verify-cert:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limited.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const hash = new URL(request.url).searchParams.get("hash") ?? "";
  if (!/^[a-f0-9]{64}$/i.test(hash.trim())) {
    return NextResponse.json(
      { verified: false, reason: "invalid" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const cert = await verifyTopicCertificate(hash);
    if (!cert) {
      return NextResponse.json(
        { verified: false, reason: "not_found" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      {
        verified: true,
        certificate: {
          childFirstName: cert.childFirstName,
          topicTitle: cert.topicTitle,
          subjectLabel: cert.subjectLabel,
          achievedAt: cert.achievedAt.toISOString().slice(0, 10),
          verificationHash: cert.verificationHash,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[/api/verify-certificate] failed:", err);
    return NextResponse.json(
      { error: "Could not verify right now. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

import { NextResponse } from "next/server";
import {
  currentParentId,
  getActiveChild,
  getChildById,
  weekInReview,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Minimal XML escaping for text rendered into the SVG (covers the quote too). */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Shareable Week-in-Review image (1080×1080 SVG). Ownership-checked: renders
 * only the signed-in parent's own child, by first name + achievements only —
 * never a photo, never identifying detail beyond the first name (Children's
 * Code). Returned as image/svg+xml; the client rasterises to PNG for saving.
 *
 *   GET /api/week-review/image?child=<id>   (falls back to the active child)
 */
export async function GET(request: Request) {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const url = new URL(request.url);
  const childParam = url.searchParams.get("child");
  const child = childParam
    ? await getChildById(parentId, childParam)
    : await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) {
    return NextResponse.json({ error: "No child." }, { status: 404 });
  }

  const review = await weekInReview(parentId, child);
  if (!review) {
    return NextResponse.json({ error: "No data." }, { status: 404 });
  }

  const first = esc(review.childName.split(" ")[0]);
  const stats: { value: string; label: string }[] = [
    { value: String(review.lessonsCompleted), label: "lessons" },
    { value: String(review.topicsCertified.length), label: "topics certified" },
    { value: String(review.streak), label: "day streak" },
    { value: String(review.totalMinutes), label: "minutes learning" },
  ];

  const statBlocks = stats
    .map((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 180 + col * 420;
      const y = 560 + row * 220;
      return `
        <g transform="translate(${x},${y})">
          <text x="0" y="0" font-family="Georgia, serif" font-size="120" font-weight="700" fill="#ECFDF5">${esc(s.value)}</text>
          <text x="0" y="60" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#A7C4B5">${esc(s.label)}</text>
        </g>`;
    })
    .join("");

  const subjectLine = review.bestSubject
    ? `<text x="540" y="1000" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#D6B36A">Strongest this week: ${esc(review.bestSubject)}</text>`
    : "";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0E2A1E"/>
      <stop offset="100%" stop-color="#14110E"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <rect x="40" y="40" width="1000" height="1000" rx="36" fill="none" stroke="#2A4A3A" stroke-width="2"/>
  <text x="540" y="180" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="30" letter-spacing="6" fill="#D6B36A">Edway · WEEK IN REVIEW</text>
  <text x="540" y="320" text-anchor="middle" font-family="Georgia, serif" font-size="96" font-weight="700" fill="#F4F1EA">${first}&#39;s week</text>
  <text x="540" y="400" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="36" fill="#A7C4B5">${esc(review.weekLabel)}</text>
  ${statBlocks}
  ${subjectLine}
  <text x="540" y="1010" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#6E8478">Learning at home, every day · Edway</text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

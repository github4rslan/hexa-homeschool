"use client";

import { useEffect, useState } from "react";

/**
 * Time-aware greeting for the dashboard command center. The greeting word is
 * resolved on the client so it matches the parent's own clock; we render a
 * neutral fallback first to avoid hydration mismatch. The one-line family
 * summary is computed server-side from real data and passed in.
 */
export function TodayBriefingHeader({
  firstName,
  summary,
}: {
  firstName: string | null;
  summary: string;
}) {
  const [part, setPart] = useState<string | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setPart(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  const greeting = part
    ? firstName
      ? `${part}, ${firstName}`
      : part
    : firstName
      ? `Hello, ${firstName}`
      : "Hello";

  return (
    <div>
      <h2 className="text-2xl font-semibold text-fog-50">{greeting}</h2>
      <p className="mt-1 text-sm text-fog-400">{summary}</p>
    </div>
  );
}

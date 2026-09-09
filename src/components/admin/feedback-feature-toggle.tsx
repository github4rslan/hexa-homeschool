"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import { toggleFeedbackFeatured } from "@/app/(admin)/admin/feedback/actions";

/**
 * F5: per-row "feature this on the public site" toggle. Only rendered by the
 * page for a row that already has the parent's own `share_consent` (the
 * caller checks this); `toggleFeedbackFeatured` re-checks server-side too.
 */
export function FeedbackFeatureToggle({
  feedbackId,
  initialFeatured,
}: {
  feedbackId: string;
  initialFeatured: boolean;
}) {
  const [featured, setFeatured] = useState(initialFeatured);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("feedbackId", feedbackId);
    fd.set("featured", String(!featured));
    const res = await toggleFeedbackFeatured(fd);
    setBusy(false);
    if (res.ok) setFeatured(!featured);
    else setError(res.error ?? "Could not update.");
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={
          featured
            ? "inline-flex items-center gap-1.5 rounded-lg border border-neon-400/30 bg-neon-500/10 px-2.5 py-1 text-[11px] font-medium text-neon-300 hover:bg-neon-500/15 disabled:opacity-60"
            : "inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-fog-400 hover:bg-white/5 disabled:opacity-60"
        }
      >
        <Megaphone className="h-3 w-3" />
        {featured ? "Featured" : "Feature"}
      </button>
      {error && <p className="mt-1 text-[10px] text-crimson-300">{error}</p>}
    </div>
  );
}

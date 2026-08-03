"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/components/media/upload-button";

/**
 * Parent-side upload of a photo of the child's handwritten working, optionally
 * attached to a mastered topic (F5). Entirely in the (dashboard) parent surface
 * — never a (child) route, no camera in child mode, no child analytics. When a
 * topic is chosen the photo becomes named LA-portfolio evidence for that topic.
 */
export function WorkEvidenceUploader({
  childId,
  topics,
}: {
  childId: string;
  /** The child's certified topics, to attach a photo to (tag + human title). */
  topics: { tag: string; title: string }[];
}) {
  const router = useRouter();
  const [topicTag, setTopicTag] = useState("");

  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
      {topics.length > 0 && (
        <label className="flex items-center gap-2 text-xs text-fog-400">
          <span className="whitespace-nowrap">Attach to topic</span>
          <select
            value={topicTag}
            onChange={(e) => setTopicTag(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-100 focus:border-violet-400/60 focus:outline-none"
          >
            <option value="">General (no topic)</option>
            {topics.map((t) => (
              <option key={t.tag} value={t.tag}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <UploadButton
        useCase="child_work"
        childId={childId}
        topicTag={topicTag || undefined}
        label="Add work"
        onUploaded={() => router.refresh()}
      />
    </div>
  );
}

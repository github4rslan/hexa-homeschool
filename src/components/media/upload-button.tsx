"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Direct browser → Cloudinary upload, signed by /api/media/sign, then recorded
 * via /api/media. Used for private child-work evidence and (admin) public media.
 * Bytes never pass through our server.
 */
export function UploadButton({
  useCase,
  childId,
  topicTag,
  label = "Upload",
  accept = "image/*",
  onUploaded,
}: {
  useCase: "marketing" | "child_work" | "resource";
  childId?: string;
  /** Optional certified-topic tag to attach to a child_work photo (F5). */
  topicTag?: string;
  label?: string;
  accept?: string;
  onUploaded?: (secureUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setState("uploading");
    setError(null);
    try {
      // 1) Get a signature scoped to the use-case + child.
      const signRes = await fetch("/api/media/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCase, childId }),
      });
      if (!signRes.ok) {
        const d = (await signRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Could not start upload.");
      }
      const { uploadUrl, fields } = (await signRes.json()) as {
        uploadUrl: string;
        fields: Record<string, string>;
      };

      // 2) Upload straight to Cloudinary.
      const form = new FormData();
      Object.entries(fields).forEach(([k, v]) => form.append(k, v));
      form.append("file", file);
      const upRes = await fetch(uploadUrl, { method: "POST", body: form });
      if (!upRes.ok) throw new Error("Upload failed.");
      const up = (await upRes.json()) as {
        public_id: string;
        secure_url: string;
        resource_type: string;
      };

      // 3) Record it in our media registry.
      await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useCase,
          childId,
          topicTag,
          publicId: up.public_id,
          secureUrl: up.secure_url,
          resourceType: up.resource_type === "image" ? "image" : "raw",
        }),
      });

      setState("done");
      onUploaded?.(up.secure_url);
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={() => inputRef.current?.click()}
        disabled={state === "uploading"}
      >
        {state === "uploading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
          </>
        ) : state === "done" ? (
          <>
            <Check className="h-4 w-4 text-neon-400" /> Uploaded
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" /> {label}
          </>
        )}
      </Button>
      {error && <p className="text-xs text-crimson-400">{error}</p>}
    </div>
  );
}

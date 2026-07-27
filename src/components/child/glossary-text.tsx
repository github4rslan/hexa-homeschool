"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { accentPreset } from "@/lib/child/accents";
import { useNarration } from "@/lib/child/use-narration";
import { splitByGlossary, type GlossaryTerm } from "@/lib/child/glossary";
import { cn } from "@/lib/utils";

/**
 * Renders prose with tap-to-define glossary terms (F9). Each authored term
 * becomes an inline, accessible button; activating it (touch, mouse or
 * keyboard) opens a small popover with the human-authored, child-voice
 * definition and an optional "read aloud" using the shared TTS narration.
 * Degrades to plain text when the topic has no glossary. Keyboard-reachable and
 * dismissible with Escape or an outside tap.
 */
export function GlossaryText({
  text,
  glossary,
  voiceId,
  keyStage,
  accent: accentId,
  className,
}: {
  text: string;
  glossary?: GlossaryTerm[];
  voiceId?: string | null;
  keyStage?: number;
  accent?: string | null;
  className?: string;
}) {
  const segments = splitByGlossary(text, glossary ?? []);
  const hasTerms = segments.some((s) => s.kind === "term");
  if (!hasTerms) return <span className={className}>{text}</span>;

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.kind === "term" ? (
          <GlossaryTermChip
            key={i}
            term={seg.text}
            definition={seg.definition}
            voiceId={voiceId}
            keyStage={keyStage}
            accent={accentId}
          />
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  );
}

function GlossaryTermChip({
  term,
  definition,
  voiceId,
  keyStage,
  accent: accentId,
}: {
  term: string;
  definition: string;
  voiceId?: string | null;
  keyStage?: number;
  accent?: string | null;
}) {
  const accent = accentPreset(accentId);
  const narration = useNarration(voiceId, keyStage);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popId = useId();

  // Close on outside tap / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-describedby={open ? popId : undefined}
        className={cn(
          "rounded-[3px] underline decoration-dotted decoration-2 underline-offset-4 transition-colors focus:outline-none focus-visible:ring-2",
          accent.text,
          accent.ring,
        )}
      >
        {term}
      </button>
      {open && (
        <span
          id={popId}
          role="tooltip"
          className={cn(
            "absolute left-0 top-full z-30 mt-2 block w-64 max-w-[80vw] rounded-2xl border bg-abyss p-4 text-left text-base font-normal leading-relaxed text-fog-100 shadow-2xl",
            accent.softBorder,
          )}
        >
          <span className={cn("mb-1 block text-sm font-semibold", accent.text)}>
            {term}
          </span>
          <span className="block text-fog-200">{definition}</span>
          <button
            type="button"
            onClick={() => void narration.playText(`${term}. ${definition}`)}
            className={cn(
              "child-touch mt-3 inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium",
              accent.softBorder,
              accent.text,
            )}
          >
            <Volume2 className="h-4 w-4" /> Read aloud
          </button>
        </span>
      )}
    </span>
  );
}

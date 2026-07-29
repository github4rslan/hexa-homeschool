"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X } from "lucide-react";

/**
 * F1 — a calm, dismissible card carrying a short parent → child encouragement
 * note at the top of the child hub. Human-authored (no AI), React-escaped, and
 * never tracked. Dismissal is remembered per-note in localStorage: once the
 * parent writes a *new* note it gently reappears. Renders nothing until mounted
 * (avoids an SSR flash) and nothing once dismissed.
 */
export function ParentNoteCard({
  note,
  childId,
  accentText,
}: {
  note: string;
  childId: string;
  accentText: string;
}) {
  const storageKey = `hexa_parent_note_seen_${childId}`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!note) {
      setShow(false);
      return;
    }
    let seen: string | null = null;
    try {
      seen = window.localStorage.getItem(storageKey);
    } catch {
      seen = null;
    }
    setShow(seen !== note);
  }, [note, storageKey]);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, note);
    } catch {
      /* ignore — dismissal is best-effort */
    }
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="child-panel mb-5 flex items-start gap-4 p-5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300">
            <Heart className="h-6 w-6" fill="currentColor" />
          </div>
          <div className="flex-1 pt-0.5">
            <div className={`text-sm font-semibold ${accentText}`}>
              A note for you
            </div>
            <p className="mt-1 text-lg leading-snug text-fog-100">{note}</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Hide note"
            className="child-touch -mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-fog-500 transition-colors hover:bg-white/5 hover:text-fog-200"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

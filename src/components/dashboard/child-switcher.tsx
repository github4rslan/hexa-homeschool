"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { setActiveChild } from "@/app/(dashboard)/actions";
import { cn } from "@/lib/utils";

export interface SwitcherChild {
  id: string;
  name: string;
}

/**
 * Active-child selector shown in the dashboard sidebar when a family has more
 * than one child. Persists the choice via the setActiveChild server action.
 */
export function ChildSwitcher({
  items,
  activeId,
}: {
  items: SwitcherChild[];
  activeId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (items.length <= 1) return null;

  const active = items.find((c) => c.id === activeId) ?? items[0];

  function choose(id: string) {
    setOpen(false);
    startTransition(() => setActiveChild(id));
  }

  return (
    <div ref={ref} className="relative px-2 pb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition-all hover:border-white/20 disabled:opacity-60",
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-semibold text-white">
          {active.name.charAt(0)}
        </span>
        <span className="flex-1 text-sm font-medium text-fog-100 truncate">
          {active.name}
        </span>
        <ChevronDown className="h-4 w-4 text-fog-500" />
      </button>

      {open && (
        <div className="absolute left-2 right-2 z-50 mt-1 rounded-xl border border-white/10 bg-abyss/95 backdrop-blur-xl p-1 shadow-xl">
          {items.map((c) => (
            <button
              key={c.id}
              onClick={() => choose(c.id)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-fog-200 hover:bg-white/5"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-cyan-500 text-[10px] font-semibold text-white">
                {c.name.charAt(0)}
              </span>
              <span className="flex-1 truncate">{c.name}</span>
              {c.id === active.id && <Check className="h-4 w-4 text-neon-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

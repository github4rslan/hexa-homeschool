"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import type { ThemePref } from "./theme";

const OPTIONS: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
  { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
  { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
];

/**
 * Segmented theme control for settings. Preference is stored client-side
 * (localStorage) and applied instantly via the provider — no DB round-trip,
 * no flash on the next load (the inline no-flash script reads the same key).
 */
export function ThemeToggle() {
  const { pref, setPref } = useTheme();

  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {OPTIONS.map((opt) => {
        const active = pref === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPref(opt.value)}
            aria-pressed={active}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-violet-500/20 text-fog-50"
                : "text-fog-400 hover:text-fog-100",
            ].join(" ")}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

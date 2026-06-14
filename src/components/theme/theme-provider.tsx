"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { THEME_KEY, isLight, type ThemePref } from "./theme";

interface ThemeCtx {
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

/**
 * Theme provider for the parent workspace. Wraps the dashboard/auth subtree in
 * a `#hexa-workspace` element and toggles `theme-light` on it based on the saved
 * preference (or prefers-color-scheme when "system"). The no-flash inline
 * script sets the class before hydration; this keeps it in sync afterwards and
 * exposes a setter for the settings toggle. Child mode + marketing never mount
 * this — they have fixed themes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>("dark");

  // Hydrate from storage on mount.
  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as ThemePref | null) ?? "dark";
    setPrefState(saved);
  }, []);

  // Apply the resolved theme to the workspace root.
  const apply = useCallback((p: ThemePref) => {
    const el = document.getElementById("hexa-workspace");
    if (!el) return;
    el.classList.toggle("theme-light", isLight(p));
  }, []);

  useEffect(() => {
    apply(pref);
    // Re-resolve on OS change while in "system" mode.
    if (pref !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref, apply]);

  const setPref = useCallback(
    (p: ThemePref) => {
      localStorage.setItem(THEME_KEY, p);
      setPrefState(p);
      apply(p);
    },
    [apply],
  );

  return (
    <Ctx.Provider value={{ pref, setPref }}>
      <div id="hexa-workspace">{children}</div>
    </Ctx.Provider>
  );
}

/** Read/set the theme preference (settings toggle). Safe outside a provider. */
export function useTheme(): ThemeCtx {
  return useContext(Ctx) ?? { pref: "dark", setPref: () => {} };
}

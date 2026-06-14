export type ThemePref = "dark" | "light" | "system";

/** localStorage key for the parent's theme preference. */
export const THEME_KEY = "hexa-theme";

/**
 * Inline no-flash script: runs before paint, resolves the saved preference
 * (defaulting to system → prefers-color-scheme), and toggles `theme-light` on
 * the workspace root so the first paint already matches. Kept dependency-free
 * and tiny because it is inlined into the HTML.
 */
export const THEME_NOFLASH_SCRIPT = `(function(){try{
  var p=localStorage.getItem(${JSON.stringify(THEME_KEY)})||"dark";
  var light=p==="light"||(p==="system"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches);
  var el=document.getElementById("hexa-workspace");
  if(el&&light)el.classList.add("theme-light");
}catch(e){}})();`;

/** Resolve a preference to whether the light skin should be on. */
export function isLight(pref: ThemePref): boolean {
  if (pref === "light") return true;
  if (pref === "dark") return false;
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  );
}

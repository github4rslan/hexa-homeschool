/**
 * Feature-flag registry + resolution. Pure (no DB) so it's unit-tested and can
 * be imported anywhere. The persisted overrides live in the `app_settings` doc
 * (see repo.getFeatureFlags); this module only knows the catalogue of togglable
 * flags and how a persisted override combines with the environment default.
 */

export type FlagCategory = "ai" | "safety" | "ui";

export interface FlagDef {
  key: string;
  label: string;
  description: string;
  category: FlagCategory;
  /** True when a runtime code path actually reads this flag (not decorative). */
  wired: boolean;
}

/**
 * The only flags shown as REAL, toggleable controls. `ai_visuals` is wired to
 * the per-question AI-visual gate (previously env-only via AI_VISUALS_ENABLED).
 * Add a flag here only once a runtime path reads it.
 */
export const FEATURE_FLAGS: FlagDef[] = [
  {
    key: "ai_visuals",
    label: "Per-question AI visuals",
    description:
      "Opt-in generated visuals for questions. Env AI_VISUALS_ENABLED is the default; this override can force it on or off.",
    category: "ai",
    wired: true,
  },
];

/**
 * Resolve a flag's effective value: an explicit persisted override wins;
 * otherwise fall back to the environment/default. Absent override + false
 * default = off (the safe default for opt-in features).
 */
export function effectiveFlag(
  key: string,
  persisted: Record<string, boolean>,
  envDefault: boolean,
): boolean {
  if (Object.prototype.hasOwnProperty.call(persisted, key)) {
    return persisted[key] === true;
  }
  return envDefault;
}

/** Is this key one of the known, wired flags? Guards writes to arbitrary keys. */
export function isKnownFlag(key: string): boolean {
  return FEATURE_FLAGS.some((f) => f.key === key);
}

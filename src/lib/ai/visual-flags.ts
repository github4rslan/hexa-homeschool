export function aiVisualsEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.AI_VISUALS_ENABLED === "true";
}

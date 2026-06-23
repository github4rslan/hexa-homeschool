export type DiagnosticPageState = "completed" | "runner";

/**
 * A completed baseline always wins. Callers resolve a real, owned child before
 * selecting between these two route states.
 */
export function diagnosticPageState(completed: boolean): DiagnosticPageState {
  return completed ? "completed" : "runner";
}

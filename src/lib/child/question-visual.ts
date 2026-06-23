export interface QuestionVisual {
  url: string;
  alt: string;
}

export function visualFromApiPayload(payload: unknown): QuestionVisual | null {
  if (!payload || typeof payload !== "object") return null;
  const visual = (payload as { visual?: unknown }).visual;
  if (!visual || typeof visual !== "object") return null;
  const url = (visual as { url?: unknown }).url;
  const alt = (visual as { alt?: unknown }).alt;
  if (typeof url !== "string" || !url) return null;
  return {
    url,
    alt: typeof alt === "string" && alt ? alt : "Helpful question visual.",
  };
}

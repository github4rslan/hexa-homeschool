/**
 * fetchJsonWithRetry — client-side fetch that tolerates serverless cold starts.
 *
 * The Teaching Agent makes two sequential model calls, so the first request
 * after the function goes idle can take 10–20s. Without this, the UI fell back
 * to human-authored content prematurely. This waits longer and retries once
 * before giving up, so a warm-up delay doesn't look like a failure.
 */
export async function fetchJsonWithRetry<T>(
  url: string,
  body: unknown,
  opts: { timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 25000;
  const retries = opts.retries ?? 1;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      // brief backoff before the retry
      if (attempt < retries) await new Promise((r) => setTimeout(r, 800));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Request failed");
}

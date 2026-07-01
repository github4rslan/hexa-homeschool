import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NarrationController } from "@/lib/child/use-narration";

/**
 * The narration engine's two invariants, proven without a browser:
 *  1. Single clip — a newer play supersedes the previous one; only one element
 *     is ever driven, so two voices can never overlap.
 *  2. Supersede/stop guard — a play whose async fetch resolves AFTER a newer
 *     play (or after stop()) must not start (no clip cut short by a stale race,
 *     no narration resuming over a child who already moved on).
 *
 * We mock the three browser globals the controller touches: fetch (deferred so
 * we control resolution order), URL.createObjectURL (encodes the text into the
 * url), and Audio (records play/pause + src).
 */

/** Resolvers keyed by the narration text, so a test can resolve out of order. */
let resolvers: Map<string, (v: { ok: boolean; blob: () => Promise<string> }) => void>;
let audios: FakeAudio[];

class FakeAudio {
  src = "";
  currentTime = 0;
  paused = true;
  preload = "";
  onplay: (() => void) | null = null;
  onpause: (() => void) | null = null;
  onended: (() => void) | null = null;
  play = vi.fn(async () => {
    this.paused = false;
    this.onplay?.();
  });
  pause = vi.fn(() => {
    this.paused = true;
    this.onpause?.();
  });
  constructor() {
    audios.push(this);
  }
}

beforeEach(() => {
  resolvers = new Map();
  audios = [];

  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init: { body: string }) => {
      const { text } = JSON.parse(init.body) as { text: string };
      return new Promise((resolve) => {
        resolvers.set(text, resolve);
      });
    }),
  );

  vi.stubGlobal("Audio", FakeAudio);

  // The controller never revokes; only createObjectURL is needed. Encode the
  // blob (which is the text) into the url so assertions can read it back.
  const fakeURL = { createObjectURL: (blob: string) => `blob:${blob}` };
  vi.stubGlobal("URL", fakeURL);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Resolve a pending /api/tts call for `text` with a blob carrying that text. */
function resolveTts(text: string) {
  const r = resolvers.get(text);
  if (!r) throw new Error(`no pending fetch for "${text}"`);
  r({ ok: true, blob: async () => text });
}

/** Let queued microtasks (the awaited fetch/play chain) settle. */
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("NarrationController", () => {
  it("creates exactly one <audio> element across many plays", async () => {
    const c = new NarrationController();
    void c.playText("A");
    resolveTts("A");
    await flush();
    void c.playText("B");
    resolveTts("B");
    await flush();

    expect(audios).toHaveLength(1);
    expect(audios[0].src).toBe("blob:B");
  });

  it("supersede: a stale fetch that resolves late never starts playing", async () => {
    const c = new NarrationController();

    // Two plays in flight; B is the newer request.
    void c.playText("A");
    void c.playText("B");

    // B resolves first and plays.
    resolveTts("B");
    await flush();
    expect(audios[0].src).toBe("blob:B");
    expect(audios[0].play).toHaveBeenCalledTimes(1);

    // A resolves LATE — its token is stale, so it must not touch the element.
    resolveTts("A");
    await flush();
    expect(audios[0].src).toBe("blob:B"); // still B, not overwritten by A
    expect(audios[0].play).toHaveBeenCalledTimes(1); // A never played
  });

  it("stop() cancels an in-flight play so it can't resume over the child", async () => {
    const c = new NarrationController();

    void c.playText("A");
    // Child starts answering before the clip loads → stop().
    c.stop();

    // The fetch resolves afterwards; the play is stale and must not start.
    resolveTts("A");
    await flush();

    // Audio may not even have been created; if it was, play was never called.
    if (audios.length > 0) {
      expect(audios[0].play).not.toHaveBeenCalled();
    }
    expect(c.getPlaying()).toBe(false);
  });

  it("dedupes concurrent fetches for the same clip (one /api/tts call)", async () => {
    const c = new NarrationController();
    c.prefetch("A");
    void c.playText("A");
    resolveTts("A");
    await flush();

    expect((fetch as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(1);
    expect(audios[0].src).toBe("blob:A");
  });
});

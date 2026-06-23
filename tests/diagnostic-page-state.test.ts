import { describe, expect, it } from "vitest";
import { diagnosticPageState } from "@/lib/diagnostic/page-state";

describe("diagnostic page state", () => {
  it("never renders a fresh runner for a completed child", () => {
    expect(diagnosticPageState(true)).toBe("completed");
  });

  it("renders the runner only while the owned child's baseline is open", () => {
    expect(diagnosticPageState(false)).toBe("runner");
  });
});

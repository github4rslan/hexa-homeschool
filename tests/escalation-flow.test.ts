import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentParentId: vi.fn(),
  getActiveChild: vi.fn(),
  recordEscalation: vi.fn(),
  readActiveChildId: vi.fn(),
  rateLimit: vi.fn(),
  notifyEscalation: vi.fn(),
  parentCanUseAi: vi.fn(),
  runTeachingAgent: vi.fn(),
}));

vi.mock("@/lib/db/repo", () => ({
  currentParentId: mocks.currentParentId,
  getActiveChild: mocks.getActiveChild,
  recordEscalation: mocks.recordEscalation,
}));

vi.mock("@/lib/active-child", () => ({
  readActiveChildId: mocks.readActiveChildId,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
}));

vi.mock("@/lib/email/escalation-alert", () => ({
  notifyEscalation: mocks.notifyEscalation,
}));

vi.mock("@/lib/billing/entitlement", () => ({
  AI_ENTITLEMENT_ERROR: "AI unavailable on this plan.",
  parentCanUseAi: mocks.parentCanUseAi,
}));

vi.mock("@/lib/ai/teaching-agent", () => ({
  runTeachingAgent: mocks.runTeachingAgent,
}));

function jsonRequest(body: unknown): Request {
  return new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.currentParentId.mockResolvedValue("parent-1");
  mocks.readActiveChildId.mockResolvedValue("child-cookie");
  mocks.getActiveChild.mockResolvedValue({
    _id: new ObjectId("64f100000000000000000001"),
    full_name: "Sam Smoke",
  });
  mocks.recordEscalation.mockResolvedValue(undefined);
  mocks.notifyEscalation.mockResolvedValue(undefined);
  mocks.rateLimit.mockResolvedValue({ ok: true });
  mocks.parentCanUseAi.mockResolvedValue(true);
  mocks.runTeachingAgent.mockResolvedValue({ text: "checked explanation" });
});

describe("/api/safety-check escalation flow", () => {
  it("freezes, records, and notifies on distress before rate limiting", async () => {
    const { POST } = await import("@/app/api/safety-check/route");

    const response = await POST(jsonRequest({ text: "I GIVE UP!" }));
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.frozen).toBe(true);
    expect(mocks.recordEscalation).toHaveBeenCalledWith(
      new ObjectId("64f100000000000000000001"),
      expect.objectContaining({
        trigger: "Child distress keyword",
        severity: "critical",
        matchedText: "I GIVE UP!",
        phrase: "i give up",
      }),
    );
    expect(mocks.notifyEscalation).toHaveBeenCalledWith(
      "parent-1",
      "Sam Smoke",
      "critical",
    );
    expect(mocks.rateLimit).not.toHaveBeenCalled();
  });

  it("still freezes if escalation persistence or notification fails", async () => {
    const { POST } = await import("@/app/api/safety-check/route");
    mocks.recordEscalation.mockRejectedValueOnce(new Error("db unavailable"));

    const response = await POST(jsonRequest({ text: "i hate myself" }));
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.frozen).toBe(true);
  });

  it("returns ok for clean text and then applies the lightweight rate limit", async () => {
    const { POST } = await import("@/app/api/safety-check/route");

    const response = await POST(jsonRequest({ text: "photosynthesis is in leaves" }));
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mocks.recordEscalation).not.toHaveBeenCalled();
    expect(mocks.notifyEscalation).not.toHaveBeenCalled();
    expect(mocks.rateLimit).toHaveBeenCalledWith("safety:parent-1", 60, 60_000);
  });
});

describe("/api/tutor escalation flow", () => {
  it("freezes and escalates distress before entitlement, rate limit, or AI calls", async () => {
    const { POST } = await import("@/app/api/tutor/route");

    const response = await POST(
      jsonRequest({
        prompt: "What is 2 + 2?",
        correctAnswer: "4",
        studentAnswer: "i can't do this",
      }),
    );
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.frozen).toBe(true);
    expect(mocks.recordEscalation).toHaveBeenCalledWith(
      new ObjectId("64f100000000000000000001"),
      expect.objectContaining({
        severity: "critical",
        matchedText: "i can't do this",
        phrase: "i can't do this",
      }),
    );
    expect(mocks.notifyEscalation).toHaveBeenCalledWith(
      "parent-1",
      "Sam Smoke",
      "critical",
    );
    expect(mocks.parentCanUseAi).not.toHaveBeenCalled();
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.runTeachingAgent).not.toHaveBeenCalled();
  });

  it("uses normal tutoring path for clean answers", async () => {
    const { POST } = await import("@/app/api/tutor/route");

    const response = await POST(
      jsonRequest({
        prompt: "What is 2 + 2?",
        correctAnswer: "4",
        studentAnswer: "3",
      }),
    );
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.text).toBe("checked explanation");
    expect(mocks.recordEscalation).not.toHaveBeenCalled();
    expect(mocks.parentCanUseAi).toHaveBeenCalledWith("parent-1");
    expect(mocks.rateLimit).toHaveBeenCalledWith("tutor:parent-1", 20, 60_000);
    expect(mocks.runTeachingAgent).toHaveBeenCalled();
  });
});

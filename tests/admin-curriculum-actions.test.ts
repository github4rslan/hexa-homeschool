import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  getSession: vi.fn(),
  findParentById: vi.fn(),
  createQuestion: vi.fn(),
  recordStaffAction: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/db/repo", () => ({
  createQuestion: mocks.createQuestion,
  findParentById: mocks.findParentById,
  recordStaffAction: mocks.recordStaffAction,
}));

function validForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const values = {
    topicTag: "maths_number",
    subject: "mathematics",
    keyStage: "4",
    kind: "practice",
    tier: "3",
    prompt: "What is 2 + 2?",
    option0: "3",
    option1: "4",
    option2: "5",
    option3: "",
    correctIndex: "1",
    explanation: "2 + 2 = 4.",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.redirect.mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  });
  mocks.getSession.mockResolvedValue({
    id: "staff-1",
    email: "admin@example.test",
  });
  mocks.findParentById.mockResolvedValue({ role: "admin" });
  mocks.createQuestion.mockResolvedValue({
    _id: { toHexString: () => "question-1" },
  });
  mocks.recordStaffAction.mockResolvedValue(undefined);
});

describe("addCurriculumQuestion", () => {
  it("creates a question, audits it, and redirects back to the topic", async () => {
    const { addCurriculumQuestion } = await import(
      "@/app/(admin)/admin/curriculum/actions"
    );

    await expect(addCurriculumQuestion({ ok: false }, validForm())).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(mocks.createQuestion).toHaveBeenCalledWith({
      topicTag: "maths_number",
      subject: "mathematics",
      tier: 3,
      keyStage: 4,
      kind: "practice",
      prompt: "What is 2 + 2?",
      options: ["3", "4", "5"],
      correctIndex: 1,
      explanation: "2 + 2 = 4.",
    });
    expect(mocks.recordStaffAction).toHaveBeenCalledWith(
      expect.objectContaining({
        staffId: "staff-1",
        staffEmail: "admin@example.test",
        action: "curriculum.question.create",
        targetCollection: "questions",
        targetId: "question-1",
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/curriculum");
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/admin/curriculum?added=question-1#maths_number",
    );
  });

  it("blocks support staff from curriculum writes", async () => {
    const { addCurriculumQuestion } = await import(
      "@/app/(admin)/admin/curriculum/actions"
    );
    mocks.findParentById.mockResolvedValueOnce({ role: "support" });

    const res = await addCurriculumQuestion({ ok: false }, validForm());

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/permission/i);
    expect(mocks.createQuestion).not.toHaveBeenCalled();
  });

  it("validates required fields before creating", async () => {
    const { addCurriculumQuestion } = await import(
      "@/app/(admin)/admin/curriculum/actions"
    );

    const res = await addCurriculumQuestion(
      { ok: false },
      validForm({ prompt: " " }),
    );

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/prompt/i);
    expect(mocks.createQuestion).not.toHaveBeenCalled();
  });
});

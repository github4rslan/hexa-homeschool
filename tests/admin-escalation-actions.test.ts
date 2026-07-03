import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  getSession: vi.fn(),
  findParentById: vi.fn(),
  postMessageAsStaff: vi.fn(),
  recordStaffAction: vi.fn(),
  updateEscalationStatus: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/db/repo", () => ({
  findParentById: mocks.findParentById,
  postMessageAsStaff: mocks.postMessageAsStaff,
  recordStaffAction: mocks.recordStaffAction,
  updateEscalationStatus: mocks.updateEscalationStatus,
}));

function messageForm(escalationId: string, body: string): FormData {
  const fd = new FormData();
  fd.set("escalationId", escalationId);
  fd.set("body", body);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({
    id: "staff-1",
    email: "support@example.test",
  });
  mocks.findParentById.mockResolvedValue({ role: "support" });
  mocks.postMessageAsStaff.mockResolvedValue({
    parentId: "parent-1",
    childId: "child-1",
  });
  mocks.recordStaffAction.mockResolvedValue(undefined);
});

describe("sendStaffEscalationMessage", () => {
  it("posts a staff reply, audits it, and revalidates the admin queue", async () => {
    const { sendStaffEscalationMessage } = await import(
      "@/app/(admin)/admin/escalations/actions"
    );

    const res = await sendStaffEscalationMessage(
      messageForm("64f200000000000000000001", " We are looking into this. "),
    );

    expect(res).toEqual({ ok: true });
    expect(mocks.postMessageAsStaff).toHaveBeenCalledWith(
      "escalation",
      "64f200000000000000000001",
      "We are looking into this.",
    );
    expect(mocks.recordStaffAction).toHaveBeenCalledWith({
      staffId: "staff-1",
      staffEmail: "support@example.test",
      action: "escalation.message.reply",
      targetCollection: "escalations",
      targetId: "64f200000000000000000001",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/escalations");
  });

  it("rejects non-staff accounts", async () => {
    const { sendStaffEscalationMessage } = await import(
      "@/app/(admin)/admin/escalations/actions"
    );
    mocks.findParentById.mockResolvedValueOnce({});

    const res = await sendStaffEscalationMessage(
      messageForm("64f200000000000000000001", "Hello"),
    );

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/permission/i);
    expect(mocks.postMessageAsStaff).not.toHaveBeenCalled();
  });

  it("validates message body before posting", async () => {
    const { sendStaffEscalationMessage } = await import(
      "@/app/(admin)/admin/escalations/actions"
    );

    const res = await sendStaffEscalationMessage(
      messageForm("64f200000000000000000001", "   "),
    );

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/empty/i);
    expect(mocks.postMessageAsStaff).not.toHaveBeenCalled();
  });

  it("returns an error when the escalation thread cannot be found", async () => {
    const { sendStaffEscalationMessage } = await import(
      "@/app/(admin)/admin/escalations/actions"
    );
    mocks.postMessageAsStaff.mockResolvedValueOnce(null);

    const res = await sendStaffEscalationMessage(
      messageForm("64f200000000000000000001", "Hello"),
    );

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/thread/i);
    expect(mocks.recordStaffAction).not.toHaveBeenCalled();
  });
});

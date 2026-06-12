import { describe, expect, it } from "vitest";
import {
  routeGroupFromPath,
  scrubAndTag,
} from "@/lib/monitoring/sentry-shared";

describe("routeGroupFromPath", () => {
  it("maps each route group by prefix", () => {
    expect(routeGroupFromPath("/admin/agents")).toBe("admin");
    expect(routeGroupFromPath("/learn/lesson")).toBe("child");
    expect(routeGroupFromPath("/dashboard")).toBe("dashboard");
    expect(routeGroupFromPath("/settings")).toBe("dashboard");
    expect(routeGroupFromPath("/login")).toBe("auth");
    expect(routeGroupFromPath("/signup/verify")).toBe("auth");
    expect(routeGroupFromPath("/pricing")).toBe("marketing");
    expect(routeGroupFromPath("/")).toBe("marketing");
  });

  it("counts the child-facing API routes as child", () => {
    expect(routeGroupFromPath("/api/tutor")).toBe("child");
    expect(routeGroupFromPath("/api/tts")).toBe("child");
    expect(routeGroupFromPath("/api/stt")).toBe("child");
    expect(routeGroupFromPath("/api/newsletter")).toBe("api");
  });

  it("distinguishes the parent CNIS page from the marketing compliance page", () => {
    expect(routeGroupFromPath("/compliance/cnis")).toBe("dashboard");
    expect(routeGroupFromPath("/compliance")).toBe("marketing");
  });
});

describe("scrubAndTag", () => {
  it("removes user identity and request PII, keeps the rest", () => {
    const event = scrubAndTag({
      user: { email: "parent@example.com" },
      request: {
        url: "https://hexa.example/learn/lesson",
        cookies: { hexa_session: "secret" },
        headers: { authorization: "Bearer x" },
        data: { childAnswer: "..." },
        query_string: "topic=algebra",
      },
      breadcrumbs: [{ data: { body: "child text" } }],
      tags: { existing: "kept" },
    });

    expect(event.user).toBeUndefined();
    expect(event.request?.cookies).toBeUndefined();
    expect(event.request?.headers).toBeUndefined();
    expect(event.request?.data).toBeUndefined();
    expect(event.request?.query_string).toBeUndefined();
    expect(event.request?.url).toBe("https://hexa.example/learn/lesson");
    expect(event.breadcrumbs?.[0].data).toBeUndefined();
    expect(event.tags?.existing).toBe("kept");
  });

  it("tags the route group from the request URL", () => {
    const event = scrubAndTag({
      request: { url: "https://hexa.example/api/tutor" },
    });
    expect(event.tags?.route_group).toBe("child");
  });

  it("falls back to the transaction name for the route group", () => {
    const event = scrubAndTag({ transaction: "/admin/users" });
    expect(event.tags?.route_group).toBe("admin");
  });

  it("survives a malformed URL", () => {
    const event = scrubAndTag({ request: { url: "not a url" } });
    expect(event.tags?.route_group).toBe("marketing");
  });
});

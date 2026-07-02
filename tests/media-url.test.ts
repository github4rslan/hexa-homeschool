import { describe, it, expect } from "vitest";
import { isAllowedMediaUrl } from "@/lib/media/media-url";

describe("isAllowedMediaUrl", () => {
  it("allows https Cloudinary URLs", () => {
    expect(
      isAllowedMediaUrl("https://res.cloudinary.com/demo/image/upload/v1/x.png"),
    ).toBe(true);
    expect(isAllowedMediaUrl("https://sub.cloudinary.com/x.png")).toBe(true);
  });

  it("rejects non-Cloudinary hosts", () => {
    expect(isAllowedMediaUrl("https://evil.example.com/x.png")).toBe(false);
    // Not a real Cloudinary subdomain — endsWith guard must not be fooled.
    expect(isAllowedMediaUrl("https://cloudinary.com.evil.com/x.png")).toBe(false);
  });

  it("rejects non-https schemes", () => {
    expect(isAllowedMediaUrl("http://res.cloudinary.com/x.png")).toBe(false);
    expect(
      isAllowedMediaUrl("javascript:alert(1)//res.cloudinary.com"),
    ).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isAllowedMediaUrl("not a url")).toBe(false);
    expect(isAllowedMediaUrl("")).toBe(false);
  });
});

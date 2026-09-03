import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { resolveActiveChild } from "@/lib/db/repo";
import type { ChildDoc } from "@/lib/db/types";

// Minimal fixtures — resolveActiveChild only reads `_id`, but `listChildren`
// (the real caller) sorts by `created_at` ascending, so the LAST array
// element is "latest" by construction; these fixtures mirror that order.
function child(id: string): ChildDoc {
  return { _id: new ObjectId(id) } as ChildDoc;
}

describe("resolveActiveChild (pure, DB-free equivalent of getActiveChild)", () => {
  const a = child("aaaaaaaaaaaaaaaaaaaaaaaa");
  const b = child("bbbbbbbbbbbbbbbbbbbbbbbb");
  const c = child("cccccccccccccccccccccccc");
  const siblings = [a, b, c]; // ascending created_at, c is latest

  it("returns the preferred child when its id is owned (present in the list)", () => {
    expect(resolveActiveChild(siblings, b._id!.toHexString())).toBe(b);
  });

  it("falls back to the latest child (last in the list) when no preferred id is given", () => {
    expect(resolveActiveChild(siblings)).toBe(c);
  });

  it("falls back to the latest child when the preferred id isn't owned/found", () => {
    expect(resolveActiveChild(siblings, new ObjectId().toHexString())).toBe(c);
  });

  it("returns null for an empty list regardless of a preferred id", () => {
    expect(resolveActiveChild([], b._id!.toHexString())).toBeNull();
    expect(resolveActiveChild([])).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { serializeSubtree } from "./serialize";

describe("serializeSubtree", () => {
  it("round trips plain JSON exactly", () => {
    const value = { a: [1, "two", null, true], b: { c: 3 } };
    const { text } = serializeSubtree(value);
    expect(JSON.parse(text)).toEqual(value);
  });

  it("renders a Map as entries that feed straight back into new Map()", () => {
    const { text } = serializeSubtree(new Map([["a", 1]]));
    expect(JSON.parse(text)).toEqual([["a", 1]]);
    expect(new Map(JSON.parse(text)).get("a")).toBe(1);
  });

  it("renders a Set as an array", () => {
    const { text } = serializeSubtree(new Set([1, 2]));
    expect(JSON.parse(text)).toEqual([1, 2]);
  });

  it("renders the kinds JSON.stringify throws on or silently drops", () => {
    const { text } = serializeSubtree({
      big: 1n,
      when: new Date(0),
      gone: undefined,
      fn: function named() {},
      sym: Symbol("s"),
    });
    expect(JSON.parse(text)).toEqual({
      big: "1",
      when: "1970-01-01T00:00:00.000Z",
      gone: null,
      fn: "function named()",
      sym: "Symbol(s)",
    });
  });

  it("marks a cycle instead of throwing", () => {
    const node: Record<string, unknown> = { name: "n" };
    node.self = node;
    const { text } = serializeSubtree(node);
    expect(JSON.parse(text)).toEqual({ name: "n", self: "[Circular]" });
  });

  it("marks a cycle through a Map instead of overflowing the stack", () => {
    // A Map is *substituted* for an entries array, so the array — not the Map —
    // is what arrives as the replacer's `this`. Unwinding the ancestor stack
    // against the originals emptied it, the cycle guard lost its ancestors, and
    // the recursion ran until `RangeError` — which was then reported to the
    // user as "too large to copy".
    const map = new Map<string, unknown>();
    map.set("self", map);
    const result = serializeSubtree({ map });

    expect(result.refused).toBeUndefined();
    expect(JSON.parse(result.text)).toEqual({ map: [["self", "[Circular]"]] });
  });

  it("marks a cycle through a Set", () => {
    const set = new Set<unknown>();
    set.add("first");
    set.add(set);
    const result = serializeSubtree({ set });

    expect(result.refused).toBeUndefined();
    expect(JSON.parse(result.text)).toEqual({ set: ["first", "[Circular]"] });
  });

  it("does not mistake a repeated Map reference for a cycle", () => {
    const shared = new Map([["k", 1]]);
    const { text } = serializeSubtree({ a: shared, b: shared });
    expect(JSON.parse(text)).toEqual({ a: [["k", 1]], b: [["k", 1]] });
  });

  it("does not mistake a repeated reference for a cycle", () => {
    // A DAG is not a cycle. A plain `WeakSet` implementation gets this wrong
    // and reports the second sibling as circular.
    const shared = { id: 1 };
    const { text } = serializeSubtree({ a: shared, b: shared });
    expect(JSON.parse(text)).toEqual({ a: { id: 1 }, b: { id: 1 } });
  });

  it("serialises a bare undefined as null", () => {
    expect(serializeSubtree(undefined).text).toBe("null");
  });

  it("honours the indent option", () => {
    expect(serializeSubtree({ a: 1 }, { indent: 0 }).text).toBe('{"a":1}');
    expect(serializeSubtree({ a: 1 }, { indent: 2 }).text).toContain("\n  ");
  });

  it("refuses a subtree past the byte ceiling, with a reason", () => {
    const wide = Array.from({ length: 5000 }, (_, i) => i);
    const result = serializeSubtree(wide, { maxBytes: 64 });
    expect(result.refused).toEqual({ reason: "too-large", maxBytes: 64 });
    expect(result.text).toBe("");
  });

  it("refuses before allocating — the node walk is the guard", () => {
    // A deep structure would blow the call stack in a recursive counter.
    let deep: unknown = 0;
    for (let i = 0; i < 50_000; i++) deep = { next: deep };
    expect(() => serializeSubtree(deep, { maxBytes: 64 })).not.toThrow();
    expect(serializeSubtree(deep, { maxBytes: 64 }).refused?.reason).toBe("too-large");
  });

  it("allows a subtree that fits", () => {
    const result = serializeSubtree({ a: 1 }, { maxBytes: 1024 });
    expect(result.refused).toBeUndefined();
    expect(JSON.parse(result.text)).toEqual({ a: 1 });
  });
});

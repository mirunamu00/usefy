import { beforeEach, describe, expect, it } from "vitest";
import { cacheSize, clearCache, encodeCached } from "./cache";
import { QRCapacityError } from "./errors";

beforeEach(() => {
  clearCache();
});

describe("encodeCached", () => {
  it("returns the identical matrix for identical inputs", () => {
    const first = encodeCached("https://usefy.dev", { level: "Q" });
    const second = encodeCached("https://usefy.dev", { level: "Q" });
    expect(second).toBe(first);
    expect(cacheSize()).toBe(1);
  });

  it("keys on every encoding option, not just the value", () => {
    const base = encodeCached("USEFY");
    expect(encodeCached("USEFY", { level: "H" })).not.toBe(base);
    expect(encodeCached("USEFY", { version: 5 })).not.toBe(base);
    expect(encodeCached("USEFY", { minVersion: 5 })).not.toBe(base);
    expect(encodeCached("USEFY", { mask: 1 })).not.toBe(base);
    expect(encodeCached("USEFY", { eci: false })).not.toBe(base);
  });

  it("does not confuse a string with the bytes that spell it", () => {
    const text = encodeCached("AB");
    const bytes = encodeCached(Uint8Array.from([0x41, 0x42]));
    expect(bytes).not.toBe(text);
  });

  it("does not let one value's key collide with another", () => {
    // A naive join could make ["a","b"] and ["a b"] share a key.
    expect(encodeCached("a b")).not.toBe(encodeCached("a  b"));
    expect(encodeCached("M 1")).not.toBe(encodeCached("M", { level: "L" }));
  });

  it("evicts the least recently used entry beyond its capacity", () => {
    const first = encodeCached("value-0");
    for (let i = 1; i <= 32; i++) encodeCached(`value-${i}`);
    expect(cacheSize()).toBe(32);
    // "value-0" was pushed out, so it is re-encoded into a new object.
    expect(encodeCached("value-0")).not.toBe(first);
  });

  it("keeps an entry alive when it is used again", () => {
    const kept = encodeCached("keep-me");
    for (let i = 0; i < 20; i++) {
      encodeCached(`filler-${i}`);
      // Touching it refreshes its recency.
      expect(encodeCached("keep-me")).toBe(kept);
    }
    for (let i = 20; i < 31; i++) encodeCached(`filler-${i}`);
    expect(encodeCached("keep-me")).toBe(kept);
  });

  it("never caches a failure", () => {
    expect(() => encodeCached("A".repeat(5000), { level: "H" })).toThrow(QRCapacityError);
    expect(cacheSize()).toBe(0);
    expect(() => encodeCached("A".repeat(5000), { level: "H" })).toThrow(QRCapacityError);
  });

  it("can be emptied", () => {
    encodeCached("USEFY");
    expect(cacheSize()).toBe(1);
    clearCache();
    expect(cacheSize()).toBe(0);
  });
});

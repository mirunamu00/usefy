import { describe, expect, it } from "vitest";

import { canAttemptInline, inlinePair, inlineSegments, similarity } from "./inline";

describe("similarity", () => {
  it("scores identical lines 1", () => {
    expect(similarity("const a = 1;", "const a = 1;")).toBe(1);
  });

  it("scores two empty lines 1 (identical, not undefined)", () => {
    expect(similarity("", "")).toBe(1);
  });

  it("scores an empty line against a non-empty one 0", () => {
    expect(similarity("", "text")).toBe(0);
    expect(similarity("text", "")).toBe(0);
  });

  it("scores completely unrelated lines 0", () => {
    expect(similarity("abc", "xyz")).toBe(0);
  });

  it("uses the documented 2M/(A+B) character formula", () => {
    // "ab cd" vs "ab ef": tokens ["ab"," ","cd"] / ["ab"," ","ef"].
    // Matched characters: "ab" (2) + " " (1) = 3. A = B = 5.
    // 2*3 / (5+5) = 0.6
    expect(similarity("ab cd", "ab ef")).toBeCloseTo(0.6, 10);
  });

  it("weights by characters, not by token count", () => {
    // A long shared identifier outweighs a pile of shared punctuation.
    const long = similarity("veryLongIdentifier(1)", "veryLongIdentifier(2)");
    const short = similarity("a(1)", "b(2)");
    expect(long).toBeGreaterThan(short);
  });

  it("is symmetric", () => {
    const pairs: Array<[string, string]> = [
      ["const a = 1;", "const b = 2;"],
      ["hello world", "goodbye world"],
      ["", "x"],
      ["日本語のテキスト", "日本語のてきすと"],
    ];
    for (const [a, b] of pairs) {
      expect(similarity(a, b)).toBeCloseTo(similarity(b, a), 12);
    }
  });

  it("always lands in [0, 1]", () => {
    const samples = ["", "a", "hello world", "const x = 1;", "你好世界", "   ", "🎉"];
    for (const a of samples) {
      for (const b of samples) {
        const score = similarity(a, b);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });

  it("scores a one-token edit high and a rewrite low", () => {
    expect(similarity("const a = 1;", "const a = 2;")).toBeGreaterThan(0.8);
    expect(similarity("const a = 1;", "throw new Error('boom');")).toBeLessThan(0.5);
  });

  it("scores intra-sentence CJK edits usefully (per-character tokens)", () => {
    // Without per-character CJK tokens this would score 0 and never inline.
    expect(similarity("这是一个测试句子", "这是一个测试例子")).toBeGreaterThan(0.7);
  });
});

describe("inlineSegments", () => {
  it("highlights the changed token on both sides", () => {
    expect(inlineSegments("const a = 1;", "const b = 1;")).toEqual({
      left: [
        { type: "same", text: "const " },
        { type: "change", text: "a" },
        { type: "same", text: " = 1;" },
      ],
      right: [
        { type: "same", text: "const " },
        { type: "change", text: "b" },
        { type: "same", text: " = 1;" },
      ],
    });
  });

  it("puts a pure addition only on the right", () => {
    expect(inlineSegments("call(a)", "call(a, b)")).toEqual({
      left: [{ type: "same", text: "call(a)" }],
      right: [
        { type: "same", text: "call(a" },
        { type: "change", text: ", b" },
        { type: "same", text: ")" },
      ],
    });
  });

  it("puts a pure removal only on the left", () => {
    expect(inlineSegments("call(a, b)", "call(a)")).toEqual({
      left: [
        { type: "same", text: "call(a" },
        { type: "change", text: ", b" },
        { type: "same", text: ")" },
      ],
      right: [{ type: "same", text: "call(a)" }],
    });
  });

  it("merges adjacent same-type segments so output is not fragmented", () => {
    const { left, right } = inlineSegments("let x = 1;", "const value = 1;");
    // Every list must alternate — never two "change" or two "same" in a row.
    for (const segments of [left, right]) {
      for (let i = 1; i < segments.length; i++) {
        expect(segments[i].type).not.toBe(segments[i - 1].type);
      }
    }
  });

  it("reconstructs each side exactly from its segments", () => {
    const pairs: Array<[string, string]> = [
      ["const a = 1;", "const b = 2;"],
      ["  indented", "\tindented"],
      ["你好世界", "你好地球"],
      ["", "added"],
      ["removed", ""],
      ["same", "same"],
      ["a(b)[c]{d}", "a(x)[c]{d}"],
    ];
    for (const [oldLine, newLine] of pairs) {
      const { left, right } = inlineSegments(oldLine, newLine);
      expect(left.map((s) => s.text).join("")).toBe(oldLine);
      expect(right.map((s) => s.text).join("")).toBe(newLine);
    }
  });

  it("returns a single same-segment pair for identical lines", () => {
    expect(inlineSegments("unchanged", "unchanged")).toEqual({
      left: [{ type: "same", text: "unchanged" }],
      right: [{ type: "same", text: "unchanged" }],
    });
  });

  it("returns empty lists for two empty lines", () => {
    expect(inlineSegments("", "")).toEqual({ left: [], right: [] });
  });

  it("marks the whole line changed when nothing matches", () => {
    expect(inlineSegments("abc", "xyz")).toEqual({
      left: [{ type: "change", text: "abc" }],
      right: [{ type: "change", text: "xyz" }],
    });
  });

  it("highlights a whitespace-only (re-indentation) change", () => {
    const { left, right } = inlineSegments("  x = 1", "\t\tx = 1");
    expect(left).toEqual([
      { type: "change", text: "  " },
      { type: "same", text: "x = 1" },
    ]);
    expect(right).toEqual([
      { type: "change", text: "\t\t" },
      { type: "same", text: "x = 1" },
    ]);
  });

  it("highlights per character inside a CJK sentence", () => {
    const { left, right } = inlineSegments("这是测试", "这是实验");
    expect(left).toEqual([
      { type: "same", text: "这是" },
      { type: "change", text: "测试" },
    ]);
    expect(right).toEqual([
      { type: "same", text: "这是" },
      { type: "change", text: "实验" },
    ]);
  });

  it("is deterministic", () => {
    const a = "function getUser(id: string): User | undefined {";
    const b = "function getUserById(id: number): User | null {";
    expect(inlineSegments(a, b)).toEqual(inlineSegments(a, b));
  });
});

describe("canAttemptInline (the O(1) pre-gate)", () => {
  it("rejects a pair longer than maxInlineChars, on either side", () => {
    expect(canAttemptInline(1001, 1000, 0.5, 1000)).toBe(false);
    expect(canAttemptInline(1000, 1001, 0.5, 1000)).toBe(false);
    expect(canAttemptInline(1000, 1000, 0.5, 1000)).toBe(true);
  });

  it("accepts any length when maxInlineChars is Infinity", () => {
    expect(canAttemptInline(500_000, 500_000, 0.5, Infinity)).toBe(true);
  });

  it("rejects a pair whose best possible similarity is below the threshold", () => {
    // ceiling = 2*min/(A+B). 10 vs 10000 ⇒ 2*10/10010 ≈ 0.002.
    expect(canAttemptInline(10, 10_000, 0.5, Infinity)).toBe(false);
    // 50 vs 52 ⇒ 2*50/102 ≈ 0.98 — worth diffing.
    expect(canAttemptInline(50, 52, 0.5, Infinity)).toBe(true);
  });

  it("uses the exact ceiling, inclusive at the boundary", () => {
    // A = 100, B = 300 ⇒ ceiling = 2*100/400 = 0.5 exactly.
    expect(canAttemptInline(100, 300, 0.5, Infinity)).toBe(true);
    expect(canAttemptInline(100, 300, 0.51, Infinity)).toBe(false);
  });

  it("admits two empty lines (they are identical, similarity 1)", () => {
    expect(canAttemptInline(0, 0, 0.5, 1000)).toBe(true);
    expect(canAttemptInline(0, 0, 1, 1000)).toBe(true);
  });

  it("rejects an empty line against a non-empty one", () => {
    expect(canAttemptInline(0, 10, 0.5, 1000)).toBe(false);
    expect(canAttemptInline(10, 0, 0.5, 1000)).toBe(false);
  });

  it("admits everything at threshold 0", () => {
    expect(canAttemptInline(1, 10_000, 0, Infinity)).toBe(true);
  });

  it("never rejects a pair that similarity would have accepted", () => {
    // The gate's contract: false is a PROOF the pair cannot pass. Sweep a
    // grid of real pairs and check the gate never lies.
    const samples = [
      "",
      "a",
      "hello",
      "hello world",
      "const a = 1;",
      "const a = 2;",
      "a much longer line of text that goes on",
      "你好世界",
    ];
    for (const a of samples) {
      for (const b of samples) {
        for (const threshold of [0, 0.25, 0.5, 0.75, 1]) {
          const score = similarity(a, b);
          if (!canAttemptInline(a.length, b.length, threshold, Infinity)) {
            expect(
              score,
              `gate rejected ${JSON.stringify(a)} vs ${JSON.stringify(b)} at ${threshold}`,
            ).toBeLessThan(threshold);
          }
        }
      }
    }
  });
});

describe("inlinePair (internal single-pass helper)", () => {
  it("returns the same score as similarity and the same segments as inlineSegments", () => {
    const pairs: Array<[string, string]> = [
      ["const a = 1;", "const b = 1;"],
      ["", ""],
      ["only old", ""],
      ["", "only new"],
      ["abc", "xyz"],
      ["the quick brown fox", "the quick brown dog"],
    ];
    for (const [a, b] of pairs) {
      const pair = inlinePair(a, b);
      expect(pair.score).toBe(similarity(a, b));
      expect({ left: pair.left, right: pair.right }).toEqual(inlineSegments(a, b));
    }
  });
});

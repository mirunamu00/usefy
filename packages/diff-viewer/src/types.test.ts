import { describe, expect, it } from "vitest";

import {
  DEFAULT_COLLAPSE_THRESHOLD,
  DEFAULT_CONTEXT,
  DEFAULT_EXPAND_STEP,
  DEFAULT_IGNORE_WHITESPACE,
  DEFAULT_INLINE_THRESHOLD,
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_EDIT_DISTANCE,
  DEFAULT_MAX_INLINE_CHARS,
  DEFAULT_MAX_LINES,
  MAX_INLINE_TOTAL_CHARS,
  resolveOptions,
  toExtent,
  toFinite,
} from "./types";

describe("toFinite", () => {
  it("passes finite numbers through", () => {
    expect(toFinite(12, 3)).toBe(12);
    expect(toFinite(0, 3)).toBe(0);
    expect(toFinite(-2.5, 3)).toBe(-2.5);
  });

  it("falls back for NaN and both infinities", () => {
    expect(toFinite(NaN, 3)).toBe(3);
    expect(toFinite(Infinity, 3)).toBe(3);
    expect(toFinite(-Infinity, 3)).toBe(3);
  });

  it("falls back for undefined and non-numbers", () => {
    expect(toFinite(undefined, 3)).toBe(3);
    expect(toFinite("7" as unknown as number, 3)).toBe(3);
    expect(toFinite(null as unknown as number, 3)).toBe(3);
  });
});

describe("toExtent", () => {
  it("passes finite numbers through", () => {
    expect(toExtent(12, 3)).toBe(12);
    expect(toExtent(0, 3)).toBe(0);
  });

  it("deliberately admits +Infinity (whole-file / guard-disabled modes)", () => {
    expect(toExtent(Infinity, 3)).toBe(Infinity);
  });

  it("lets -Infinity through for the caller to clamp", () => {
    expect(toExtent(-Infinity, 3)).toBe(-Infinity);
  });

  it("falls back for NaN, undefined and non-numbers", () => {
    expect(toExtent(NaN, 3)).toBe(3);
    expect(toExtent(undefined, 3)).toBe(3);
    expect(toExtent("7" as unknown as number, 3)).toBe(3);
  });
});

describe("resolveOptions — defaults", () => {
  it("matches the SPEC §4.4 table with no input", () => {
    expect(resolveOptions()).toEqual({
      context: 3,
      collapseThreshold: 4,
      expandStep: 20,
      ignoreWhitespace: "none",
      ignoreCase: false,
      inlineDiff: true,
      inlineThreshold: 0.5,
      maxInlineChars: 1000,
      maxLines: 20000,
      maxBytes: 2_000_000,
      maxEditDistance: 6000,
    });
  });

  it("matches the exported default constants", () => {
    const resolved = resolveOptions({});
    expect(resolved.context).toBe(DEFAULT_CONTEXT);
    expect(resolved.collapseThreshold).toBe(DEFAULT_COLLAPSE_THRESHOLD);
    expect(resolved.expandStep).toBe(DEFAULT_EXPAND_STEP);
    expect(resolved.ignoreWhitespace).toBe(DEFAULT_IGNORE_WHITESPACE);
    expect(resolved.inlineThreshold).toBe(DEFAULT_INLINE_THRESHOLD);
    expect(resolved.maxInlineChars).toBe(DEFAULT_MAX_INLINE_CHARS);
    expect(resolved.maxLines).toBe(DEFAULT_MAX_LINES);
    expect(resolved.maxBytes).toBe(DEFAULT_MAX_BYTES);
    expect(resolved.maxEditDistance).toBe(DEFAULT_MAX_EDIT_DISTANCE);
  });

  it("returns a fresh object every call", () => {
    expect(resolveOptions()).not.toBe(resolveOptions());
  });

  it("does not mutate its input", () => {
    const input = { context: 5 };
    const snapshot = { ...input };
    resolveOptions(input);
    expect(input).toEqual(snapshot);
  });
});

describe("resolveOptions — numeric guards (SPEC decision #8)", () => {
  const numericFields = [
    "context",
    "collapseThreshold",
    "expandStep",
    "inlineThreshold",
    "maxInlineChars",
    "maxLines",
    "maxBytes",
    "maxEditDistance",
  ] as const;

  it.each(numericFields)("falls back to the default when %s is NaN", (field) => {
    expect(resolveOptions({ [field]: NaN })[field]).toBe(resolveOptions()[field]);
  });

  it.each(numericFields)("falls back to the default when %s is undefined", (field) => {
    expect(resolveOptions({ [field]: undefined })[field]).toBe(resolveOptions()[field]);
  });

  it.each(numericFields)("falls back to the default when %s is a string", (field) => {
    expect(resolveOptions({ [field]: "9" as unknown as number })[field]).toBe(
      resolveOptions()[field],
    );
  });

  it.each(numericFields)("never produces a NaN for %s", (field) => {
    for (const value of [NaN, Infinity, -Infinity, -1, 0, 1e9]) {
      expect(Number.isNaN(resolveOptions({ [field]: value })[field])).toBe(false);
    }
  });
});

describe("resolveOptions — Infinity policy", () => {
  it("permits context: Infinity (whole-file mode)", () => {
    expect(resolveOptions({ context: Infinity }).context).toBe(Infinity);
  });

  it("permits maxLines / maxBytes of Infinity (guard disabled)", () => {
    expect(resolveOptions({ maxLines: Infinity }).maxLines).toBe(Infinity);
    expect(resolveOptions({ maxBytes: Infinity }).maxBytes).toBe(Infinity);
  });

  it("permits maxEditDistance / maxInlineChars of Infinity", () => {
    expect(resolveOptions({ maxEditDistance: Infinity }).maxEditDistance).toBe(Infinity);
    expect(resolveOptions({ maxInlineChars: Infinity }).maxInlineChars).toBe(Infinity);
  });

  it("rejects Infinity where it has no meaning", () => {
    expect(resolveOptions({ collapseThreshold: Infinity }).collapseThreshold).toBe(4);
    expect(resolveOptions({ expandStep: Infinity }).expandStep).toBe(20);
    expect(resolveOptions({ inlineThreshold: Infinity }).inlineThreshold).toBe(0.5);
  });

  it("clamps -Infinity to the field's floor", () => {
    expect(resolveOptions({ context: -Infinity }).context).toBe(0);
    expect(resolveOptions({ maxLines: -Infinity }).maxLines).toBe(0);
    expect(resolveOptions({ maxBytes: -Infinity }).maxBytes).toBe(0);
    expect(resolveOptions({ maxEditDistance: -Infinity }).maxEditDistance).toBe(0);
    expect(resolveOptions({ maxInlineChars: -Infinity }).maxInlineChars).toBe(0);
  });
});

describe("guard defaults are internally consistent", () => {
  it("bounds the line diff's worst case as maxLines x maxEditDistance", () => {
    // The pair is the SPEC §4.4 time bound; if either default moves, the
    // documented worst case moves with it.
    expect(DEFAULT_MAX_LINES).toBe(20000);
    expect(DEFAULT_MAX_EDIT_DISTANCE).toBe(6000);
    // ~3000 modified lines: a modification costs 2 (one delete, one insert).
    expect(DEFAULT_MAX_EDIT_DISTANCE / 2).toBe(3000);
  });

  it("bounds the inline diff's worst case as maxInlineChars x the aggregate", () => {
    expect(DEFAULT_MAX_INLINE_CHARS).toBe(1000);
    expect(MAX_INLINE_TOTAL_CHARS).toBe(200_000);
    // The aggregate must be a meaningful multiple of the per-line limit,
    // otherwise it would fire on ordinary diffs.
    expect(MAX_INLINE_TOTAL_CHARS / DEFAULT_MAX_INLINE_CHARS).toBeGreaterThanOrEqual(100);
  });
});

describe("resolveOptions — clamping", () => {
  it("clamps context, collapseThreshold, maxLines and maxBytes to >= 0", () => {
    const resolved = resolveOptions({
      context: -5,
      collapseThreshold: -5,
      maxLines: -5,
      maxBytes: -5,
    });
    expect(resolved.context).toBe(0);
    expect(resolved.collapseThreshold).toBe(0);
    expect(resolved.maxLines).toBe(0);
    expect(resolved.maxBytes).toBe(0);
  });

  it("clamps expandStep to >= 1 (a step of 0 would reveal nothing forever)", () => {
    expect(resolveOptions({ expandStep: 0 }).expandStep).toBe(1);
    expect(resolveOptions({ expandStep: -100 }).expandStep).toBe(1);
    expect(resolveOptions({ expandStep: 50 }).expandStep).toBe(50);
  });

  it("clamps inlineThreshold to [0, 1]", () => {
    expect(resolveOptions({ inlineThreshold: -1 }).inlineThreshold).toBe(0);
    expect(resolveOptions({ inlineThreshold: 9 }).inlineThreshold).toBe(1);
    expect(resolveOptions({ inlineThreshold: 0.75 }).inlineThreshold).toBe(0.75);
  });
});

describe("resolveOptions — non-numeric options", () => {
  it.each(["none", "trailing", "all"] as const)("accepts ignoreWhitespace: %s", (value) => {
    expect(resolveOptions({ ignoreWhitespace: value }).ignoreWhitespace).toBe(value);
  });

  it("falls back to 'none' for an unknown ignoreWhitespace", () => {
    expect(resolveOptions({ ignoreWhitespace: "sometimes" as never }).ignoreWhitespace).toBe(
      "none",
    );
    expect(resolveOptions({ ignoreWhitespace: undefined }).ignoreWhitespace).toBe("none");
  });

  it("accepts only a real boolean for ignoreCase", () => {
    expect(resolveOptions({ ignoreCase: true }).ignoreCase).toBe(true);
    expect(resolveOptions({ ignoreCase: false }).ignoreCase).toBe(false);
    expect(resolveOptions({ ignoreCase: 1 as unknown as boolean }).ignoreCase).toBe(false);
  });

  it("treats inlineDiff as on unless it is exactly false", () => {
    expect(resolveOptions({ inlineDiff: true }).inlineDiff).toBe(true);
    expect(resolveOptions({ inlineDiff: false }).inlineDiff).toBe(false);
    expect(resolveOptions({ inlineDiff: undefined }).inlineDiff).toBe(true);
    expect(resolveOptions({ inlineDiff: 0 as unknown as boolean }).inlineDiff).toBe(true);
  });
});

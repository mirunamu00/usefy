import { describe, expect, it } from "vitest";

import * as headless from "./headless";
import * as main from "./index";

/**
 * The `./headless` entry is a contract: zero React, zero DOM, zero runtime
 * dependencies. These tests guard the *shape* of that contract — the
 * behaviour lives in the `src/diff` suites.
 */
describe("@usefy/diff-viewer/headless — public surface", () => {
  it("exports exactly the documented runtime surface", () => {
    expect(Object.keys(headless).sort()).toEqual(
      [
        "DEFAULT_COLLAPSE_THRESHOLD",
        "DEFAULT_CONTEXT",
        "DEFAULT_EXPAND_STEP",
        "DEFAULT_IGNORE_WHITESPACE",
        "DEFAULT_INLINE_THRESHOLD",
        "DEFAULT_MAX_BYTES",
        "DEFAULT_MAX_EDIT_DISTANCE",
        "DEFAULT_MAX_INLINE_CHARS",
        "DEFAULT_MAX_LINES",
        "buildHunks",
        "computeDiff",
        "inlineSegments",
        "myersDiff",
        "myersDiffBounded",
        "normalizeLine",
        "resolveOptions",
        "similarity",
        "splitLines",
        "tokenizeWords",
      ].sort(),
    );
  });

  it("exports every SPEC §4.2 core function", () => {
    for (const name of [
      "computeDiff",
      "myersDiff",
      "myersDiffBounded",
      "splitLines",
      "tokenizeWords",
      "normalizeLine",
      "similarity",
      "inlineSegments",
      "buildHunks",
      "resolveOptions",
    ] as const) {
      expect(typeof headless[name]).toBe("function");
    }
  });

  it("does not leak internal utilities", () => {
    // Generic helpers must stay private — leaking them causes name
    // collisions for consumers (signature-pad precedent).
    for (const name of [
      "toFinite",
      "toExtent",
      "utf8Length",
      "countLines",
      "inlinePair",
      "canAttemptInline",
      "MAX_INLINE_TOTAL_CHARS",
    ]) {
      expect(name in headless).toBe(false);
    }
  });

  it("exposes the SPEC §4.4 defaults as constants", () => {
    expect(headless.DEFAULT_CONTEXT).toBe(3);
    expect(headless.DEFAULT_COLLAPSE_THRESHOLD).toBe(4);
    expect(headless.DEFAULT_EXPAND_STEP).toBe(20);
    expect(headless.DEFAULT_IGNORE_WHITESPACE).toBe("none");
    expect(headless.DEFAULT_INLINE_THRESHOLD).toBe(0.5);
    expect(headless.DEFAULT_MAX_INLINE_CHARS).toBe(1000);
    expect(headless.DEFAULT_MAX_LINES).toBe(20000);
    expect(headless.DEFAULT_MAX_BYTES).toBe(2_000_000);
    expect(headless.DEFAULT_MAX_EDIT_DISTANCE).toBe(6000);
  });

  it("works end to end through the public entry", () => {
    const result = headless.computeDiff("a\nb\n", "a\nc\n");
    expect(result.stats).toEqual({ added: 1, removed: 1, unchanged: 1 });
    expect(result.hunks[0].lines.map((line) => line.content)).toEqual(["a", "b", "c"]);
  });
});

describe("@usefy/diff-viewer — main entry", () => {
  it("re-exports every headless export", () => {
    for (const name of Object.keys(headless)) {
      expect(name in main, `main entry is missing ${name}`).toBe(true);
    }
  });

  it("re-exports the same function identities", () => {
    expect(main.computeDiff).toBe(headless.computeDiff);
    expect(main.myersDiff).toBe(headless.myersDiff);
  });

  it("adds exactly the React and view-model layer on top", () => {
    const extra = Object.keys(main).filter((name) => !(name in headless));
    expect(extra.sort()).toEqual(
      ["DiffViewer", "alignRows", "toSplitRows", "toUnifiedRows"].sort(),
    );
  });

  it("keeps the React layer OUT of the headless entry", () => {
    // `./headless` is contractually React-free (SPEC §4.6).
    for (const name of ["DiffViewer", "toSplitRows", "toUnifiedRows", "alignRows"]) {
      expect(name in headless).toBe(false);
    }
  });
});

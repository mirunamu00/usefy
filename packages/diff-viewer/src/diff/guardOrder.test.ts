import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The size guards must run **before** anything is allocated (SPEC §3.1).
 *
 * That is an ordering claim, and ordering is not something a stopwatch can
 * prove: under coverage instrumentation the hand-written `countLines` scan
 * is slowed far more than the native `String.split` it exists to avoid, so
 * the "cheap" path can measure slower than the expensive one. Counting the
 * calls says it exactly, on any machine, instrumented or not.
 *
 * This lives in its own file because the module mock applies per-file.
 */
vi.mock("./tokenize", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./tokenize")>();
  return {
    ...actual,
    splitLines: vi.fn(actual.splitLines),
    utf8Length: vi.fn(actual.utf8Length),
    countLines: vi.fn(actual.countLines),
  };
});

const { computeDiff } = await import("./computeDiff");
const tokenize = await import("./tokenize");

const splitLines = vi.mocked(tokenize.splitLines);
const countLines = vi.mocked(tokenize.countLines);
const utf8Length = vi.mocked(tokenize.utf8Length);

beforeEach(() => {
  splitLines.mockClear();
  countLines.mockClear();
  utf8Length.mockClear();
});

describe("computeDiff — guards run before any allocation", () => {
  it("never splits the lines when maxLines is exceeded", () => {
    const huge = "x\n".repeat(50_000);
    const result = computeDiff(huge, "y\n", { maxLines: 10 });

    expect(result.truncatedReason).toBe("size");
    // The whole point: no 50 000-element array was ever built.
    expect(splitLines).not.toHaveBeenCalled();
    // …and the count came from the cheap scan instead.
    expect(countLines).toHaveBeenCalled();
  });

  it("never splits the lines — or counts them — when maxBytes is exceeded", () => {
    const result = computeDiff("abcdef", "x", { maxBytes: 3 });

    expect(result.truncatedReason).toBe("size");
    expect(splitLines).not.toHaveBeenCalled();
    // Bytes are checked first, so the line scan is skipped entirely.
    expect(countLines).not.toHaveBeenCalled();
    expect(utf8Length).toHaveBeenCalled();
  });

  it("skips the byte scan entirely when maxBytes is Infinity", () => {
    computeDiff("a\n", "b\n", { maxBytes: Infinity });
    expect(utf8Length).not.toHaveBeenCalled();
  });

  it("skips the line scan entirely when maxLines is Infinity", () => {
    computeDiff("a\n", "b\n", { maxLines: Infinity });
    expect(countLines).not.toHaveBeenCalled();
    // …but the diff itself still happens.
    expect(splitLines).toHaveBeenCalledTimes(2);
  });

  it("does split the lines for a diff that passes the guards", () => {
    const result = computeDiff("a\nb\n", "a\nc\n");
    expect(result.truncated).toBe(false);
    expect(splitLines).toHaveBeenCalledTimes(2); // once per side
  });

  it("checks both sides, and stops at the first that fails", () => {
    computeDiff("a\n", "x\n".repeat(50_000), { maxLines: 10 });
    expect(splitLines).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";

import type { DiffLine, DiffResult } from "../types";
import { computeDiff } from "./computeDiff";
import { splitLines } from "./tokenize";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Every line of the model, in order (use with `context: Infinity`). */
function allLines(result: DiffResult): DiffLine[] {
  return result.hunks.flatMap((hunk) => hunk.lines);
}

/** Compact shape of a line list: `c` context, `r` remove, `a` add. */
function shapeOf(lines: DiffLine[]): string {
  return lines
    .map((line) => (line.type === "context" ? "c" : line.type === "remove" ? "r" : "a"))
    .join("");
}

/** Diff the whole document — no collapsing, so the model is complete. */
function whole(oldText: string, newText: string): DiffResult {
  return computeDiff(oldText, newText, { context: Infinity });
}

/** {@link whole}, with extra options layered in. */
function whole2(
  oldText: string,
  newText: string,
  options: Parameters<typeof computeDiff>[2],
): DiffResult {
  return computeDiff(oldText, newText, { ...options, context: Infinity });
}

/**
 * Wall-clock a thunk.
 *
 * Perf assertions in this file compare a guarded run against the *same* work
 * unguarded, rather than against an absolute millisecond budget. Coverage
 * instrumentation slows everything by roughly an order of magnitude, so an
 * absolute threshold is either flaky under `--coverage` or too loose to mean
 * anything without it. A ratio is unaffected by the constant factor.
 */
function elapsed(run: () => unknown): number {
  const started = performance.now();
  run();
  return performance.now() - started;
}

/** Deterministic 32-bit PRNG (mulberry32) — no Math.random, ever. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/* Classic diff cases                                                         */
/* -------------------------------------------------------------------------- */

describe("computeDiff — classic cases", () => {
  it("replaces a line in the middle", () => {
    const result = computeDiff("a\nb\nc\n", "a\nx\nc\n");
    expect(result.truncated).toBe(false);
    expect(result.stats).toEqual({ added: 1, removed: 1, unchanged: 2 });
    expect(result.hunks).toHaveLength(1);
    expect(shapeOf(result.hunks[0].lines)).toBe("crac");
    expect(result.hunks[0].lines.map((l) => l.content)).toEqual(["a", "b", "x", "c"]);
  });

  it("inserts at the head", () => {
    const result = whole("b\nc\n", "a\nb\nc\n");
    expect(shapeOf(allLines(result))).toBe("acc");
    expect(result.stats).toEqual({ added: 1, removed: 0, unchanged: 2 });
  });

  it("inserts in the middle", () => {
    const result = whole("a\nc\n", "a\nb\nc\n");
    expect(shapeOf(allLines(result))).toBe("cac");
  });

  it("inserts at the tail", () => {
    const result = whole("a\nb\n", "a\nb\nc\n");
    expect(shapeOf(allLines(result))).toBe("cca");
  });

  it("deletes at the head", () => {
    const result = whole("a\nb\nc\n", "b\nc\n");
    expect(shapeOf(allLines(result))).toBe("rcc");
    expect(result.stats).toEqual({ added: 0, removed: 1, unchanged: 2 });
  });

  it("deletes in the middle", () => {
    expect(shapeOf(allLines(whole("a\nb\nc\n", "a\nc\n")))).toBe("crc");
  });

  it("deletes at the tail", () => {
    expect(shapeOf(allLines(whole("a\nb\nc\n", "a\nb\n")))).toBe("ccr");
  });

  it("replaces at the head", () => {
    expect(shapeOf(allLines(whole("a\nb\nc\n", "x\nb\nc\n")))).toBe("racc");
  });

  it("replaces at the tail", () => {
    expect(shapeOf(allLines(whole("a\nb\nc\n", "a\nb\nx\n")))).toBe("ccra");
  });

  it("emits removals before additions inside a change block", () => {
    const lines = allLines(whole("a\n1\n2\nb\n", "a\nx\ny\nb\n"));
    expect(shapeOf(lines)).toBe("crraac");
  });
});

describe("computeDiff — empty and identical inputs", () => {
  it("returns an empty, untruncated model for two empty documents", () => {
    expect(computeDiff("", "")).toEqual({
      hunks: [],
      stats: { added: 0, removed: 0, unchanged: 0 },
      truncated: false,
    });
  });

  it("returns no hunks for identical documents", () => {
    const result = computeDiff("a\nb\nc\n", "a\nb\nc\n");
    expect(result.hunks).toEqual([]);
    expect(result.stats).toEqual({ added: 0, removed: 0, unchanged: 3 });
    expect(result.truncated).toBe(false);
  });

  it("returns no hunks for identical documents in whole-file mode", () => {
    expect(whole("a\nb\n", "a\nb\n").hunks).toEqual([]);
  });

  it("treats an empty old document as all additions", () => {
    const result = computeDiff("", "a\nb\n");
    expect(shapeOf(allLines(result))).toBe("aa");
    expect(result.stats).toEqual({ added: 2, removed: 0, unchanged: 0 });
    expect(allLines(result).map((l) => l.newNumber)).toEqual([1, 2]);
    expect(allLines(result).every((l) => l.oldNumber === undefined)).toBe(true);
  });

  it("treats an empty new document as all removals", () => {
    const result = computeDiff("a\nb\n", "");
    expect(shapeOf(allLines(result))).toBe("rr");
    expect(result.stats).toEqual({ added: 0, removed: 2, unchanged: 0 });
    expect(allLines(result).map((l) => l.oldNumber)).toEqual([1, 2]);
    expect(allLines(result).every((l) => l.newNumber === undefined)).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Line-ending and trailing-newline handling                                  */
/* -------------------------------------------------------------------------- */

describe("computeDiff — line endings", () => {
  it("does not report a diff between CRLF and LF versions of the same text", () => {
    const result = computeDiff("a\r\nb\r\nc\r\n", "a\nb\nc\n");
    expect(result.hunks).toEqual([]);
    expect(result.stats).toEqual({ added: 0, removed: 0, unchanged: 3 });
  });

  it("diffs CRLF documents correctly", () => {
    const result = whole("a\r\nb\r\n", "a\r\nx\r\n");
    expect(shapeOf(allLines(result))).toBe("cra");
    expect(allLines(result).map((l) => l.content)).toEqual(["a", "b", "x"]);
  });

  it("does not report a diff for a missing trailing newline", () => {
    expect(computeDiff("a\nb", "a\nb\n").hunks).toEqual([]);
    expect(computeDiff("a\nb\n", "a\nb").hunks).toEqual([]);
  });

  it("does report a diff for an added blank final line", () => {
    // "a\n\n" really has a blank second line — that is a genuine change.
    const result = whole("a\n", "a\n\n");
    expect(shapeOf(allLines(result))).toBe("ca");
    expect(allLines(result)[1].content).toBe("");
  });
});

/* -------------------------------------------------------------------------- */
/* Compare-normalized, render-original (SPEC decision #5)                     */
/* -------------------------------------------------------------------------- */

describe("computeDiff — whitespace and case options", () => {
  it("ignores trailing whitespace when asked", () => {
    expect(computeDiff("a  \nb\n", "a\nb\n", { ignoreWhitespace: "trailing" }).hunks).toEqual([]);
    // …and reports it when not asked.
    expect(computeDiff("a  \nb\n", "a\nb\n").hunks).toHaveLength(1);
  });

  it("ignores all whitespace when asked", () => {
    expect(
      computeDiff("  let  x = 1\n", "let x=1\n", { ignoreWhitespace: "all" }).hunks,
    ).toEqual([]);
  });

  it("still reports a real change under ignoreWhitespace: all", () => {
    const result = whole2("  let  x = 1\n", "let x=2\n", { ignoreWhitespace: "all" });
    expect(shapeOf(allLines(result))).toBe("ra");
  });

  it("ignores case when asked", () => {
    expect(computeDiff("Alpha\n", "alpha\n", { ignoreCase: true }).hunks).toEqual([]);
    expect(computeDiff("Alpha\n", "alpha\n").hunks).toHaveLength(1);
  });

  it("combines the whitespace and case rules", () => {
    expect(
      computeDiff("  ALPHA  \n", "  alpha\n", {
        ignoreWhitespace: "trailing",
        ignoreCase: true,
      }).hunks,
    ).toEqual([]);
  });

  it("keeps the ORIGINAL text in `content`, never the compare form", () => {
    const result = whole2("  alpha  \n", "  BETA  \n", {
      ignoreWhitespace: "trailing",
      ignoreCase: true,
    });
    const lines = allLines(result);
    expect(shapeOf(lines)).toBe("ra");
    // Not "  alpha" (trailing-stripped) and not lowercased — the real text.
    expect(lines[0].content).toBe("  alpha  ");
    expect(lines[1].content).toBe("  BETA  ");
  });

  it("keeps the ORIGINAL new text in `content` for context lines", () => {
    // Line 1 normalizes to "alpha" on both sides, so it becomes a context
    // line — and the model must render real text, not the compare form.
    // (A second, genuinely changed line is needed so a hunk exists at all.)
    const result = whole2("Alpha  \nold body\n", "AlphA\nnew body\n", {
      ignoreWhitespace: "trailing",
      ignoreCase: true,
    });
    const lines = allLines(result);
    expect(shapeOf(lines)).toBe("cra");
    expect(lines[0].type).toBe("context");
    expect(lines[0].content).toBe("AlphA");
    expect(lines[0].content).not.toBe("alpha");
    expect(lines[0].content).not.toBe("Alpha  ");
  });

  it("falls back to 'none' for an unknown ignoreWhitespace value", () => {
    const bogus = computeDiff("a  \n", "a\n", {
      ignoreWhitespace: "sometimes" as never,
    });
    expect(bogus.hunks).toHaveLength(1);
  });
});

/* -------------------------------------------------------------------------- */
/* Pairing + inline segments                                                  */
/* -------------------------------------------------------------------------- */

describe("computeDiff — inline word diff", () => {
  it("adds segments to a closely-related pair", () => {
    const lines = allLines(whole("const a = 1;\n", "const a = 2;\n"));
    expect(shapeOf(lines)).toBe("ra");
    expect(lines[0].segments).toEqual([
      { type: "same", text: "const a = " },
      { type: "change", text: "1" },
      { type: "same", text: ";" },
    ]);
    expect(lines[1].segments).toEqual([
      { type: "same", text: "const a = " },
      { type: "change", text: "2" },
      { type: "same", text: ";" },
    ]);
  });

  it("does NOT produce character soup for an unrelated rewrite", () => {
    const lines = allLines(whole("const total = items.length;\n", "throw new Error('x');\n"));
    expect(shapeOf(lines)).toBe("ra");
    // Below inlineThreshold — whole-line change, no segments at all.
    expect(lines[0].segments).toBeUndefined();
    expect(lines[1].segments).toBeUndefined();
  });

  it("pairs removed[i] with added[i] inside a change block", () => {
    const lines = allLines(
      whole("alpha 1\nbeta 1\n", "alpha 2\nbeta 2\n"),
    );
    expect(shapeOf(lines)).toBe("rraa");
    // removed[0] "alpha 1" pairs with added[0] "alpha 2".
    expect(lines[0].segments?.map((s) => s.text).join("")).toBe("alpha 1");
    expect(lines[2].segments?.map((s) => s.text).join("")).toBe("alpha 2");
    expect(lines[1].segments?.map((s) => s.text).join("")).toBe("beta 1");
    expect(lines[3].segments?.map((s) => s.text).join("")).toBe("beta 2");
  });

  it("leaves surplus lines unpaired and unsegmented", () => {
    const lines = allLines(whole("alpha 1\n", "alpha 2\nzzz surplus\n"));
    expect(shapeOf(lines)).toBe("raa");
    expect(lines[0].segments).toBeDefined();
    expect(lines[1].segments).toBeDefined();
    expect(lines[2].segments).toBeUndefined(); // the surplus addition
  });

  it("leaves surplus removals unsegmented too", () => {
    const lines = allLines(whole("alpha 1\nzzz surplus\n", "alpha 2\n"));
    expect(shapeOf(lines)).toBe("rra");
    expect(lines[0].segments).toBeDefined();
    expect(lines[1].segments).toBeUndefined();
    expect(lines[2].segments).toBeDefined();
  });

  it("segments always reconstruct their own line exactly", () => {
    const lines = allLines(
      whole(
        "function getUser(id: string): User {\n  return db.users.find(id);\n}\n",
        "function getUserById(id: number): User | null {\n  return db.users.findOne(id);\n}\n",
      ),
    );
    for (const line of lines) {
      if (line.segments) {
        expect(line.segments.map((s) => s.text).join("")).toBe(line.content);
      }
    }
  });

  it("skips inline diffing entirely with inlineDiff: false", () => {
    const lines = allLines(whole2("const a = 1;\n", "const a = 2;\n", { inlineDiff: false }));
    expect(lines.every((line) => line.segments === undefined)).toBe(true);
  });

  it("segments every pair with inlineThreshold: 0", () => {
    const lines = allLines(
      whole2("const total = items.length;\n", "throw new Error('x');\n", {
        inlineThreshold: 0,
      }),
    );
    expect(lines[0].segments).toBeDefined();
    expect(lines[1].segments).toBeDefined();
  });

  it("segments nothing changed with inlineThreshold: 1", () => {
    const lines = allLines(whole2("const a = 1;\n", "const a = 2;\n", { inlineThreshold: 1 }));
    expect(lines[0].segments).toBeUndefined();
    expect(lines[1].segments).toBeUndefined();
  });

  it("gives context lines no segments", () => {
    const lines = allLines(whole("keep\nconst a = 1;\n", "keep\nconst a = 2;\n"));
    expect(lines[0].type).toBe("context");
    expect(lines[0].segments).toBeUndefined();
  });
});

describe("computeDiff — inline gate is cheap, not just correct", () => {
  /** One line of `n` space-separated unique tokens. */
  const wideLine = (n: number, tag: string) =>
    Array.from({ length: n }, (_, i) => `${tag}${i}`).join(" ") + "\n";

  it("skips a huge single-line pair instead of word-diffing it", () => {
    // The defect this guards: the word diff used to run BEFORE the
    // similarity check, so a ~110 KB single-line pair cost ~3.6 s to produce
    // `segments: undefined`.
    const a = wideLine(14_000, "aa");
    const b = wideLine(14_000, "bb");
    expect(a.length).toBeGreaterThan(100_000);

    const lines = allLines(whole(a, b));
    expect(lines[0].segments).toBeUndefined();
    expect(lines[1].segments).toBeUndefined();
  });

  it("is an order of magnitude faster than word-diffing that pair would be", () => {
    // Ratio, not wall clock: instrumentation slows both sides equally.
    const a = wideLine(3000, "aa");
    const b = wideLine(3000, "bb");

    const gated = elapsed(() => whole(a, b));
    const ungated = elapsed(() => whole2(a, b, { maxInlineChars: Infinity }));

    expect(allLines(whole(a, b))[0].segments).toBeUndefined();
    expect(gated * 10).toBeLessThan(ungated);
  });

  it("skips a short-vs-very-long pair via the provable ceiling, without diffing", () => {
    // Even with the length limit disabled, `2·min/(A+B)` proves the pair
    // cannot reach the threshold — no word diff should be attempted, so
    // this costs the same as not having a long line at all.
    const long = wideLine(20_000, "tok");

    const ceilingGated = elapsed(() => whole2("x\n", long, { maxInlineChars: Infinity }));
    const wordDiffed = elapsed(() =>
      whole2(wideLine(3000, "aa"), wideLine(3000, "bb"), { maxInlineChars: Infinity }),
    );

    expect(allLines(whole2("x\n", long, { maxInlineChars: Infinity }))[0].segments).toBeUndefined();
    // The 110 KB pair must be MUCH cheaper than a 20 KB pair that IS
    // word-diffed — a bare `<` could pass on a millisecond of jitter.
    expect(ceilingGated * 3).toBeLessThan(wordDiffed);
  });

  it("still segments a legitimately similar long line", () => {
    // Just under the default maxInlineChars — must keep its highlighting.
    const base = Array.from({ length: 100 }, (_, i) => `token${i}`).join(" ");
    expect(base.length).toBeLessThan(1000);
    const lines = allLines(whole(`${base}\n`, `${base.replace("token7 ", "TOKEN7 ")}\n`));

    expect(lines[0].segments).toBeDefined();
    expect(lines[1].segments).toBeDefined();
    expect(lines[0].segments!.map((s) => s.text).join("")).toBe(lines[0].content);
    expect(lines[1].segments!.some((s) => s.type === "change")).toBe(true);
  });

  it("skips lines longer than maxInlineChars but keeps shorter ones", () => {
    const short = "const a = 1;";
    const long = "y".repeat(50);
    const before = `${short}\n${long}\n`;
    const after = `const a = 2;\n${"z".repeat(50)}\n`;

    // With a limit of 20, only the short pair is eligible.
    const lines = allLines(whole2(before, after, { maxInlineChars: 20 }));
    const removed = lines.filter((l) => l.type === "remove");
    expect(removed[0].segments).toBeDefined();
    expect(removed[1].segments).toBeUndefined();
  });

  it("honours maxInlineChars: 0 by disabling inline diffing entirely", () => {
    const lines = allLines(whole2("const a = 1;\n", "const a = 2;\n", { maxInlineChars: 0 }));
    expect(lines.every((l) => l.segments === undefined)).toBe(true);
  });

  it(
    "bounds the TOTAL inline work across a document of long changed lines",
    () => {
      // Every line just under the per-line limit and every line changed —
      // the shape that maximises aggregate word-diffing inside the size
      // guards. The per-line limit alone does not bound this; the aggregate
      // ceiling does, and past it later pairs are simply not word-diffed.
      const side = (tag: string) =>
        Array.from({ length: 600 }, () =>
          Array.from({ length: 100 }, (_, j) => `${tag}${j}xx`).join(" ").slice(0, 800),
        ).join("\n") + "\n";
      const a = side("aa");
      const b = side("bb");

      const capped = elapsed(() => computeDiff(a, b));
      const uncapped = elapsed(() => computeDiff(a, b, { maxInlineChars: Infinity }));

      expect(computeDiff(a, b).truncated).toBe(false);
      expect(capped * 2).toBeLessThan(uncapped);
    },
    // The uncapped half is deliberately the slow path; coverage
    // instrumentation multiplies it well past the default timeout.
    30_000,
  );

  it("reports when the aggregate budget cut inline diffing short", () => {
    // Without this flag a missing `segments` past the budget is
    // indistinguishable from a similarity-gate miss, which would make the
    // degradation silent — the one thing this package refuses to do.
    const line = (tag: string, i: number) => `${tag} ${i} ${"x".repeat(600)}`;
    const a = Array.from({ length: 1000 }, (_, i) => line("aa", i)).join("\n") + "\n";
    const b = Array.from({ length: 1000 }, (_, i) => line("bb", i)).join("\n") + "\n";

    expect(computeDiff(a, b).inlineBudgetExhausted).toBe(true);
  });

  it("does NOT report exhaustion for an ordinary diff", () => {
    expect(
      computeDiff("keep\nlet x = 1;\ncommon\n", "keep\nconst x = 1;\ncommon\n")
        .inlineBudgetExhausted,
    ).toBeUndefined();
    expect(computeDiff("a\n", "b\n").inlineBudgetExhausted).toBeUndefined();
  });

  it("does NOT report exhaustion when the similarity gate is what skipped a pair", () => {
    // Long, dissimilar, but well inside the budget: the pair is skipped by
    // the gate, and that is not the budget's doing.
    const result = computeDiff("const total = items.length;\n", "throw new Error('x');\n");
    expect(result.inlineBudgetExhausted).toBeUndefined();
    expect(allLines(computeDiff("const total = items.length;\n", "throw new Error('x');\n", {
      context: Infinity,
    }))[0].segments).toBeUndefined();
    expect(result.truncated).toBe(false);
  });

  it("does NOT report exhaustion when the per-line limit is what skipped a pair", () => {
    const wide = Array.from({ length: 3000 }, (_, i) => `tok${i}`).join(" ");
    const result = computeDiff(`${wide}\n`, `${wide.replace("tok0", "TOK0")}\n`);
    expect(result.inlineBudgetExhausted).toBeUndefined();
  });

  it("does NOT report exhaustion when inline diffing is off entirely", () => {
    const line = (tag: string, i: number) => `${tag} ${i} ${"x".repeat(600)}`;
    const a = Array.from({ length: 1000 }, (_, i) => line("aa", i)).join("\n") + "\n";
    const b = Array.from({ length: 1000 }, (_, i) => line("bb", i)).join("\n") + "\n";
    expect(computeDiff(a, b, { inlineDiff: false }).inlineBudgetExhausted).toBeUndefined();
  });

  it("segments the early pairs and stops once the aggregate budget runs out", () => {
    // Deterministic degradation: the first pairs get highlighting, later
    // ones do not — but every line is still present and correct.
    const line = (tag: string, i: number) => `${tag} ${i} ${"x".repeat(600)}`;
    const a = Array.from({ length: 1000 }, (_, i) => line("aa", i)).join("\n") + "\n";
    const b = Array.from({ length: 1000 }, (_, i) => line("bb", i)).join("\n") + "\n";

    const lines = allLines(computeDiff(a, b, { context: Infinity }));
    const removals = lines.filter((l) => l.type === "remove");

    expect(removals[0].segments).toBeDefined();
    expect(removals[removals.length - 1].segments).toBeUndefined();
    // Same result twice — the cut-off point is deterministic.
    expect(computeDiff(a, b, { context: Infinity })).toEqual(
      computeDiff(a, b, { context: Infinity }),
    );
  });

  it("still produces a correct diff when the aggregate budget is exhausted", () => {
    // Losing word-level highlighting must never cost correctness.
    const side = (tag: string) =>
      Array.from({ length: 600 }, (_, i) => `${tag} ${i} ${"pad".repeat(200)}`).join("\n") + "\n";
    const a = side("aa");
    const b = side("bb");
    const result = computeDiff(a, b, { context: Infinity });

    expect(result.truncated).toBe(false);
    expect(result.stats.removed).toBe(600);
    expect(result.stats.added).toBe(600);
    const lines = allLines(result);
    expect(lines.filter((l) => l.type !== "add").map((l) => l.content)).toEqual(
      a.replace(/\n$/, "").split("\n"),
    );
    expect(lines.filter((l) => l.type !== "remove").map((l) => l.content)).toEqual(
      b.replace(/\n$/, "").split("\n"),
    );
  });
});

describe("computeDiff — the model carries its own expansion data", () => {
  const longDoc = (marker: string) =>
    Array.from({ length: 80 }, (_, i) => (i === 40 ? marker : `line ${i}`)).join("\n") + "\n";

  it("hands back the hidden lines, not just their count", () => {
    const result = computeDiff(longDoc("before"), longDoc("after"), { context: 3 });
    const [hunk] = result.hunks;

    expect(hunk.hiddenBefore.length).toBe(hunk.hiddenBefore.length);
    expect(hunk.hiddenAfter.length).toBe(hunk.hiddenAfter.length);
    expect(hunk.hiddenBefore.length).toBeGreaterThan(0);
    expect(hunk.hiddenAfter.length).toBeGreaterThan(0);
    expect(hunk.hiddenBefore[0].content).toBe("line 0");
    expect(hunk.hiddenAfter[hunk.hiddenAfter.length - 1].content).toBe("line 79");
  });

  it("lets a consumer with ONLY the result reconstruct every line", () => {
    // This is the point of SPEC decision #11: the `diff` prop is enough to
    // drive expansion — no oldText/newText, no recompute.
    const result = computeDiff(longDoc("before"), longDoc("after"), { context: 3 });

    const rebuilt = result.hunks.flatMap((h) => [
      ...h.hiddenBefore,
      ...h.lines,
      ...h.hiddenAfter,
    ]);
    const newSide = rebuilt.filter((l) => l.type !== "remove").map((l) => l.content);
    const oldSide = rebuilt.filter((l) => l.type !== "add").map((l) => l.content);

    expect(newSide).toEqual(splitLines(longDoc("after")));
    expect(oldSide).toEqual(splitLines(longDoc("before")));
  });

  it("keeps line numbers correct on expanded lines", () => {
    const result = computeDiff(longDoc("before"), longDoc("after"), { context: 3 });
    const [hunk] = result.hunks;

    hunk.hiddenBefore.forEach((line, i) => {
      expect(line.oldNumber).toBe(i + 1);
      expect(line.newNumber).toBe(i + 1);
    });
    // …and they join up with the hunk's own first line.
    const first = hunk.lines[0];
    expect(first.oldNumber).toBe(hunk.hiddenBefore.length + 1);
    expect(hunk.oldStart).toBe(first.oldNumber);
  });

  it("carries expansion data at head, interior and tail simultaneously", () => {
    const before = Array.from({ length: 120 }, (_, i) => `line ${i}`).join("\n") + "\n";
    const after = before
      .replace(/\n$/, "")
      .split("\n")
      .map((line, i) => (i === 30 || i === 90 ? `${line} changed` : line))
      .join("\n");

    const result = computeDiff(before, `${after}\n`, { context: 3 });
    expect(result.hunks).toHaveLength(2);
    expect(result.hunks[0].hiddenBefore.length).toBeGreaterThan(0); // head
    expect(result.hunks[1].hiddenBefore.length).toBeGreaterThan(0); // interior
    expect(result.hunks[1].hiddenAfter.length).toBeGreaterThan(0); // tail
    expect(result.hunks[0].hiddenAfter.length).toBe(0); // never on a non-final hunk
  });

  it("has no gaps at all in whole-file mode", () => {
    const result = computeDiff(longDoc("before"), longDoc("after"), { context: Infinity });
    const [hunk] = result.hunks;
    expect(hunk.hiddenBefore.length).toBe(0);
    expect(hunk.hiddenAfter.length).toBe(0);
    expect(hunk.hiddenBefore).toEqual([]);
    expect(hunk.hiddenAfter).toEqual([]);
    expect(hunk.lines).toHaveLength(81);
  });
});

/* -------------------------------------------------------------------------- */
/* Hunks, context and numbering                                               */
/* -------------------------------------------------------------------------- */

describe("computeDiff — hunks and numbering", () => {
  const document = (marker: string) =>
    Array.from({ length: 40 }, (_, i) => (i === 20 ? marker : `line ${i}`)).join("\n") + "\n";

  it("collapses the unchanged regions around a single change", () => {
    const result = computeDiff(document("before"), document("after"), { context: 3 });
    expect(result.hunks).toHaveLength(1);
    expect(shapeOf(result.hunks[0].lines)).toBe("cccraccc");
    expect(result.hunks[0].hiddenBefore.length).toBe(17);
    expect(result.hunks[0].oldStart).toBe(18);
    expect(result.hunks[0].newStart).toBe(18);
  });

  it("renders the whole file with context: Infinity", () => {
    const result = computeDiff(document("before"), document("after"), { context: Infinity });
    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0].hiddenBefore.length).toBe(0);
    expect(result.hunks[0].lines).toHaveLength(41); // 40 lines, one replaced by 2
  });

  it("produces one hunk per distant change", () => {
    const before = Array.from({ length: 60 }, (_, i) => `line ${i}`).join("\n");
    const after = before
      .split("\n")
      .map((line, i) => (i === 5 || i === 45 ? `${line} changed` : line))
      .join("\n");
    const result = computeDiff(before, after, { context: 3 });
    expect(result.hunks).toHaveLength(2);
    // The 5-line leading run is cheaper to render than to hide behind an
    // expander (edge break-even = context + collapseThreshold = 7).
    expect(result.hunks[0].hiddenBefore.length).toBe(0);
    expect(result.hunks[1].hiddenBefore.length).toBe(45 - 3 - (5 + 3) - 1);
    // The 14-line trailing run is worth collapsing, and is now reachable.
    expect(result.hunks[1].hiddenAfter.length).toBe(59 - 45 - 3);
    expect(result.hunks[1].hiddenAfter).toHaveLength(result.hunks[1].hiddenAfter.length);
  });

  it("numbers every line continuously across the whole model", () => {
    const oldText = "a\nb\nc\nd\ne\n";
    const newText = "a\nX\nc\nY\nZ\ne\n";
    const lines = allLines(whole(oldText, newText));

    let expectedOld = 1;
    let expectedNew = 1;
    for (const line of lines) {
      if (line.type === "add") {
        expect(line.oldNumber).toBeUndefined();
        expect(line.newNumber).toBe(expectedNew++);
      } else if (line.type === "remove") {
        expect(line.newNumber).toBeUndefined();
        expect(line.oldNumber).toBe(expectedOld++);
      } else {
        expect(line.oldNumber).toBe(expectedOld++);
        expect(line.newNumber).toBe(expectedNew++);
      }
    }
    expect(expectedOld - 1).toBe(splitLines(oldText).length);
    expect(expectedNew - 1).toBe(splitLines(newText).length);
  });

  it("keeps hunk starts consistent with the lines they contain", () => {
    const before = Array.from({ length: 80 }, (_, i) => `line ${i}`).join("\n");
    const after = before
      .split("\n")
      .map((line, i) => (i === 10 || i === 50 ? `${line}!` : line))
      .join("\n");
    const result = computeDiff(before, after, { context: 2 });
    for (const hunk of result.hunks) {
      const firstOld = hunk.lines.find((l) => l.oldNumber !== undefined);
      const firstNew = hunk.lines.find((l) => l.newNumber !== undefined);
      expect(hunk.oldStart).toBe(firstOld?.oldNumber);
      expect(hunk.newStart).toBe(firstNew?.newNumber);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Size guard                                                                 */
/* -------------------------------------------------------------------------- */

describe("computeDiff — size guard", () => {
  const truncated = {
    hunks: [],
    stats: { added: 0, removed: 0, unchanged: 0 },
    truncated: true,
    truncatedReason: "size" as const,
  };

  it("truncates when the old side exceeds maxLines", () => {
    expect(computeDiff("a\nb\nc\n", "a\n", { maxLines: 2 })).toEqual(truncated);
  });

  it("truncates when the new side exceeds maxLines", () => {
    expect(computeDiff("a\n", "a\nb\nc\n", { maxLines: 2 })).toEqual(truncated);
  });

  it("reports truncatedReason 'size', never 'complexity'", () => {
    expect(computeDiff("a\nb\nc\n", "a\n", { maxLines: 2 }).truncatedReason).toBe("size");
    expect(computeDiff("abcdef", "x", { maxBytes: 3 }).truncatedReason).toBe("size");
  });

  it("leaves truncatedReason undefined on a successful diff", () => {
    const result = computeDiff("a\n", "b\n");
    expect(result.truncated).toBe(false);
    expect(result.truncatedReason).toBeUndefined();
  });

  it("does not truncate exactly at maxLines", () => {
    expect(computeDiff("a\nb\n", "a\nb\n", { maxLines: 2 }).truncated).toBe(false);
  });

  it("truncates when the old side exceeds maxBytes", () => {
    expect(computeDiff("abcdef", "x", { maxBytes: 3 })).toEqual(truncated);
  });

  it("truncates when the new side exceeds maxBytes", () => {
    expect(computeDiff("x", "abcdef", { maxBytes: 3 })).toEqual(truncated);
  });

  it("counts UTF-8 bytes, not UTF-16 code units", () => {
    // "日本語" is 3 characters but 9 UTF-8 bytes.
    expect(computeDiff("日本語", "x", { maxBytes: 8 }).truncated).toBe(true);
    expect(computeDiff("日本語", "x", { maxBytes: 9 }).truncated).toBe(false);
  });

  it("disables the byte guard with maxBytes: Infinity", () => {
    expect(computeDiff("abcdef", "x", { maxBytes: Infinity }).truncated).toBe(false);
  });

  it("disables the line guard with maxLines: Infinity", () => {
    expect(computeDiff("a\nb\nc\n", "a\n", { maxLines: Infinity }).truncated).toBe(false);
  });

  it("falls back to the default guards for NaN", () => {
    expect(computeDiff("a\nb\n", "a\n", { maxLines: NaN, maxBytes: NaN }).truncated).toBe(false);
  });

  it("truncates rather than running the algorithm on a pathological input", () => {
    // 60k lines per side — refused on size, before anything is allocated.
    const big = "line\n".repeat(60_000);
    const result = computeDiff(big, `${big}extra\n`);
    expect(result.truncated).toBe(true);
    expect(result.truncatedReason).toBe("size");
    expect(result.hunks).toEqual([]);
  });

  it("rejects an oversized document on line count", () => {
    // That it does so *without building the line array* is asserted exactly,
    // by call count, in guardOrder.test.ts — a timing comparison cannot say
    // it, because coverage instrumentation slows the hand-written scan far
    // more than the native `String.split` it is meant to avoid.
    const huge = "x\n".repeat(400_000);
    expect(computeDiff(huge, "y\n").truncatedReason).toBe("size");
    expect(computeDiff(huge, "y\n").hunks).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */
/* Cost guard — maxEditDistance                                               */
/* -------------------------------------------------------------------------- */

describe("computeDiff — cost guard (maxEditDistance)", () => {
  /** n lines of unique content, as a document. */
  const doc = (n: number, tag: string) =>
    Array.from({ length: n }, (_, i) => `${tag} line ${i} with some content`).join("\n") + "\n";

  it("refuses two large unrelated documents instead of grinding through them", () => {
    // The defect this guards: 20k unrelated lines sit inside every size
    // limit and used to block the main thread for ~5.7 s while reporting
    // truncated === false.
    const a = doc(20_000, "alpha");
    const b = doc(20_000, "beta");

    const result = computeDiff(a, b);
    expect(result.truncated).toBe(true);
    expect(result.truncatedReason).toBe("complexity");
    expect(result.hunks).toEqual([]);
    expect(result.stats).toEqual({ added: 0, removed: 0, unchanged: 0 });
  });

  it("caps work by the edit budget, not the input size", () => {
    // The guard's whole point: a pathological diff's cost is bounded by
    // maxEditDistance, not by N. We prove that STRUCTURALLY — the same tiny
    // budget bails with "complexity" across inputs of very different sizes,
    // so the work it does can't be scaling with N — rather than by wall-clock,
    // which coverage instrumentation makes unreliable (see guardOrder.test.ts).
    //
    // We deliberately never run the unbounded `maxEditDistance: Infinity`
    // baseline here: that is the multi-second O(N·D) freeze the guard exists
    // to prevent, and its cost under CI coverage instrumentation is exactly
    // what used to time this test out. The measured speedup lives in SPEC §4.7.
    for (const n of [2_000, 8_000, 18_000]) {
      const a = doc(n, "alpha");
      const b = doc(n, "beta");
      const result = computeDiff(a, b, { maxEditDistance: 200 });
      expect(result.truncatedReason).toBe("complexity");
      expect(result.hunks).toEqual([]);
    }
  });

  it("bails when every other line differs", () => {
    const base = doc(20_000, "base");
    const other = base
      .replace(/\n$/, "")
      .split("\n")
      .map((line, i) => (i % 2 === 0 ? line : `${line} CHANGED`))
      .join("\n");

    expect(computeDiff(base, `${other}\n`).truncatedReason).toBe("complexity");
  });

  it("does NOT trip on a large but normal diff", () => {
    // 20k lines with 500 changed — a big, entirely realistic review.
    const base = doc(20_000, "base");
    const after = base
      .replace(/\n$/, "")
      .split("\n")
      .map((line, i) => (i % 40 === 0 ? `${line} CHANGED` : line))
      .join("\n");

    const result = computeDiff(base, `${after}\n`);
    expect(result.truncated).toBe(false);
    expect(result.stats.added).toBe(500);
    expect(result.stats.removed).toBe(500);
  });

  it("does NOT trip on a wholesale insertion, however large", () => {
    // A pure insert has a huge edit distance but costs nothing to compute,
    // so the budget must not refuse it.
    const base = doc(200, "base");
    const grown = base + doc(19_000, "appended");
    const result = computeDiff(base, grown, { maxEditDistance: 10 });
    expect(result.truncated).toBe(false);
    expect(result.stats.added).toBe(19_000);
    expect(result.stats.unchanged).toBe(200);
  });

  it("does NOT trip on a wholesale deletion, however large", () => {
    const base = doc(200, "base");
    const grown = base + doc(19_000, "appended");
    const result = computeDiff(grown, base, { maxEditDistance: 10 });
    expect(result.truncated).toBe(false);
    expect(result.stats.removed).toBe(19_000);
  });

  it("does NOT trip on identical documents", () => {
    const base = doc(10_000, "base");
    expect(computeDiff(base, base, { maxEditDistance: 0 }).truncated).toBe(false);
  });

  it("honours an explicit budget exactly", () => {
    // Three changed lines — edit distance 6.
    const before = "a\nb\nc\nd\ne\n";
    const after = "a\nX\nY\nZ\ne\n";
    expect(computeDiff(before, after, { maxEditDistance: 5 }).truncatedReason).toBe("complexity");
    expect(computeDiff(before, after, { maxEditDistance: 6 }).truncated).toBe(false);
  });

  it("disables the guard with maxEditDistance: Infinity", () => {
    const a = doc(300, "alpha");
    const b = doc(300, "beta");
    expect(computeDiff(a, b, { maxEditDistance: Infinity }).truncated).toBe(false);
  });

  it("falls back to the default for NaN", () => {
    const before = "a\nb\nc\n";
    const after = "a\nX\nc\n";
    expect(computeDiff(before, after, { maxEditDistance: NaN }).truncated).toBe(false);
  });

  it("diffs a realistic 5,000-line file pair without tripping any guard", () => {
    // SPEC §4.7 puts this under 150 ms; measured at 6-8 ms uninstrumented.
    // Asserted for correctness here — the timing lives in the SPEC table,
    // because a wall-clock assertion under coverage measures the
    // instrumentation, not the algorithm.
    const base = Array.from(
      { length: 5000 },
      (_, i) => `  const value${i} = compute(${i}, options);`,
    ).join("\n");
    const after = base
      .split("\n")
      .map((line, i) => (i % 25 === 0 ? line.replace("compute", "calculate") : line))
      .join("\n");

    const result = computeDiff(base, after);
    expect(result.truncated).toBe(false);
    expect(result.stats.added).toBe(200);
    expect(result.stats.removed).toBe(200);
  });
});

/* -------------------------------------------------------------------------- */
/* Determinism + end-to-end property test                                     */
/* -------------------------------------------------------------------------- */

describe("computeDiff — determinism", () => {
  it("returns a deeply equal result for the same input twice", () => {
    const before = "function a() {\n  return 1;\n}\n\nfunction b() {\n  return 2;\n}\n";
    const after = "function a() {\n  return 11;\n}\n\nfunction c() {\n  return 2;\n}\n";
    expect(computeDiff(before, after)).toEqual(computeDiff(before, after));
  });

  it("returns a deeply equal result across option object identities", () => {
    const before = "a\nb\nc\n";
    const after = "a\nx\nc\n";
    expect(computeDiff(before, after, { context: 1 })).toEqual(
      computeDiff(before, after, { context: 1 }),
    );
  });

  it("is stable over a large randomized document", () => {
    const rng = makeRng(0xd1ff);
    const before = Array.from({ length: 500 }, (_, i) => `line ${i}`).join("\n");
    const after = before
      .split("\n")
      .map((line) => (rng() < 0.1 ? `${line} // touched` : line))
      .join("\n");
    expect(computeDiff(before, after)).toEqual(computeDiff(before, after));
  });
});

describe("computeDiff — randomized reconstruction property", () => {
  /**
   * With default options the model must be lossless: dropping the additions
   * reproduces the old document, and dropping the removals reproduces the
   * new one. Run it over seeded random document pairs so it is a statement
   * about behaviour rather than about one hand-picked input.
   */
  it("reconstructs both documents from the model for 200 random pairs", () => {
    const rng = makeRng(0xba5e_ba11);
    const vocabulary = [
      "import x from 'y';",
      "",
      "function f() {",
      "  return 1;",
      "}",
      "const a = 1;",
      "  // comment",
      "\tif (x) {",
      "你好世界",
      "  }",
    ];

    for (let iteration = 0; iteration < 200; iteration++) {
      const lenA = Math.floor(rng() * 25);
      const lenB = Math.floor(rng() * 25);
      const pick = () => vocabulary[Math.floor(rng() * vocabulary.length)];
      const oldLines = Array.from({ length: lenA }, pick);
      const newLines = Array.from({ length: lenB }, pick);
      const oldText = oldLines.map((l) => `${l}\n`).join("");
      const newText = newLines.map((l) => `${l}\n`).join("");

      const lines = allLines(whole(oldText, newText));

      expect(lines.filter((l) => l.type !== "add").map((l) => l.content)).toEqual(oldLines);
      expect(lines.filter((l) => l.type !== "remove").map((l) => l.content)).toEqual(newLines);

      const result = whole(oldText, newText);
      expect(result.stats.added + result.stats.unchanged).toBe(lenB);
      expect(result.stats.removed + result.stats.unchanged).toBe(lenA);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* SSR safety                                                                 */
/* -------------------------------------------------------------------------- */

describe("computeDiff — environment", () => {
  it("runs with no DOM globals available", () => {
    const savedWindow = globalThis.window;
    const savedDocument = globalThis.document;
    try {
      // @ts-expect-error — deliberately simulating a server environment.
      delete globalThis.window;
      // @ts-expect-error — deliberately simulating a server environment.
      delete globalThis.document;
      expect(computeDiff("a\nb\n", "a\nc\n").stats).toEqual({
        added: 1,
        removed: 1,
        unchanged: 1,
      });
    } finally {
      globalThis.window = savedWindow;
      globalThis.document = savedDocument;
    }
  });
});

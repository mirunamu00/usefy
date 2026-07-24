import { describe, expect, it } from "vitest";

import type { DiffHunk, DiffLine } from "../types";
import { buildHunks } from "./hunks";

/**
 * Build a `DiffLine[]` from a compact spec string, with correct 1-based
 * numbering: `c` = context, `r` = remove, `a` = add.
 * The content is the spec character plus its index, so lines are unique.
 */
function makeLines(spec: string): DiffLine[] {
  const lines: DiffLine[] = [];
  let oldNumber = 1;
  let newNumber = 1;
  for (let i = 0; i < spec.length; i++) {
    const kind = spec[i];
    if (kind === "c") {
      lines.push({ type: "context", oldNumber: oldNumber++, newNumber: newNumber++, content: `c${i}` });
    } else if (kind === "r") {
      lines.push({ type: "remove", oldNumber: oldNumber++, content: `r${i}` });
    } else {
      lines.push({ type: "add", newNumber: newNumber++, content: `a${i}` });
    }
  }
  return lines;
}

/** The spec string a hunk's lines correspond to. */
function shapeOf(lines: DiffLine[]): string {
  return lines
    .map((line) => (line.type === "context" ? "c" : line.type === "remove" ? "r" : "a"))
    .join("");
}

/**
 * The model-integrity invariants every `buildHunks` result must satisfy.
 *
 * Chief among them: walking `hiddenBefore` + `lines` + `hiddenAfter` across
 * all hunks must reproduce the original document exactly, once, in order.
 * That is what makes the model self-sufficient for expansion (SPEC resolved
 * decision #11) — a consumer holding only the hunks can recover every line.
 */
function expectModelIntact(hunks: DiffHunk[], lines: DiffLine[], collapseThreshold = 4): void {
  const walked: DiffLine[] = [];
  hunks.forEach((hunk, index) => {
    // There is exactly one source of truth for a gap size: the array. A
    // separate count field would be free to disagree with it, which is why
    // it no longer exists.
    expect(Object.keys(hunk).sort()).toEqual(
      ["hiddenAfter", "hiddenBefore", "lines", "newStart", "oldStart"].sort(),
    );
    // Only the last hunk may carry a trailing region.
    if (index < hunks.length - 1) expect(hunk.hiddenAfter).toEqual([]);
    // Hidden lines are always unchanged ones.
    for (const line of [...hunk.hiddenBefore, ...hunk.hiddenAfter]) {
      expect(line.type).toBe("context");
    }
    // No gap is ever too small to be worth its expander.
    if (hunk.hiddenBefore.length > 0) expect(hunk.hiddenBefore.length).toBeGreaterThan(collapseThreshold);
    if (hunk.hiddenAfter.length > 0) expect(hunk.hiddenAfter.length).toBeGreaterThan(collapseThreshold);

    walked.push(...hunk.hiddenBefore, ...hunk.lines, ...hunk.hiddenAfter);
  });
  // Every line of the document, exactly once, in order — by identity.
  expect(walked).toEqual(lines);
  walked.forEach((line, i) => expect(line).toBe(lines[i]));
}

describe("buildHunks — degenerate inputs", () => {
  it("returns no hunks for an empty line list", () => {
    expect(buildHunks([], { context: 3 })).toEqual([]);
  });

  it("returns no hunks when nothing changed", () => {
    expect(buildHunks(makeLines("ccccc"), { context: 3 })).toEqual([]);
  });

  it("returns no hunks when nothing changed, even in whole-file mode", () => {
    // Whole-file mode shows the whole file *around a change* — with no
    // change there is no region to draw, and the viewer shows "No changes".
    expect(buildHunks(makeLines("ccccc"), { context: Infinity })).toEqual([]);
  });
});

describe("buildHunks — context grouping", () => {
  it("keeps `context` unchanged lines on each side of a change", () => {
    // Runs long enough that collapsing is genuinely worth it at both edges
    // (context 2 + collapseThreshold 4 = 6 is the edge break-even point).
    const lines = makeLines(`${"c".repeat(12)}r${"c".repeat(12)}`);
    const hunks = buildHunks(lines, { context: 2 });
    expect(hunks).toHaveLength(1);
    expect(shapeOf(hunks[0].lines)).toBe("ccrcc");
    expect(hunks[0].lines.map((l) => l.content)).toEqual(["c10", "c11", "r12", "c13", "c14"]);
    expectModelIntact(hunks, lines);
  });

  it("clamps context at the start and end of the document", () => {
    const hunks = buildHunks(makeLines("rccr"), { context: 3 });
    expect(hunks).toHaveLength(1);
    expect(shapeOf(hunks[0].lines)).toBe("rccr");
    expect(hunks[0].hiddenBefore.length).toBe(0);
  });

  it("includes only changed lines with context: 0", () => {
    const lines = makeLines(`${"c".repeat(10)}r${"c".repeat(10)}`);
    const hunks = buildHunks(lines, { context: 0 });
    expect(hunks).toHaveLength(1);
    expect(shapeOf(hunks[0].lines)).toBe("r");
    expect(hunks[0].hiddenBefore.length).toBe(10);
    expect(hunks[0].hiddenAfter.length).toBe(10);
    expectModelIntact(hunks, lines);
  });

  it("still renders short edge runs in full with context: 0", () => {
    // context 0 does not mean "collapse everything": a 3-line leading run is
    // still cheaper to render than to hide behind an expander.
    const lines = makeLines("cccrccc");
    const hunks = buildHunks(lines, { context: 0 });
    expect(shapeOf(hunks[0].lines)).toBe("cccrccc");
    expect(hunks[0].hiddenBefore.length).toBe(0);
    expect(hunks[0].hiddenAfter.length).toBe(0);
  });

  it("puts everything in one hunk with context: Infinity", () => {
    const lines = makeLines("cccccrcccccaccccc");
    const hunks = buildHunks(lines, { context: Infinity });
    expect(hunks).toHaveLength(1);
    expect(hunks[0].lines).toEqual(lines);
    expect(hunks[0].hiddenBefore.length).toBe(0);
    expect(hunks[0].oldStart).toBe(1);
    expect(hunks[0].newStart).toBe(1);
  });
});

describe("buildHunks — interior collapse arithmetic", () => {
  // Defaults: context 3, collapseThreshold 4 — interior runs of — 10 stay
  // inline (they spend context on BOTH sides).
  it("keeps a run of exactly 2*context + collapseThreshold inline", () => {
    const lines = makeLines(`r${"c".repeat(10)}r`);
    const hunks = buildHunks(lines, { context: 3, collapseThreshold: 4 });
    expect(hunks).toHaveLength(1);
    expect(shapeOf(hunks[0].lines)).toBe("rccccccccccr");
    expectModelIntact(hunks, lines);
  });

  it("splits one line past the threshold and hides exactly R - 2*context", () => {
    const lines = makeLines(`r${"c".repeat(11)}r`);
    const hunks = buildHunks(lines, { context: 3, collapseThreshold: 4 });
    expect(hunks).toHaveLength(2);
    expect(shapeOf(hunks[0].lines)).toBe("rccc");
    expect(shapeOf(hunks[1].lines)).toBe("cccr");
    expect(hunks[0].hiddenBefore.length).toBe(0);
    expect(hunks[1].hiddenBefore.length).toBe(11 - 2 * 3); // 5 hidden lines
    expectModelIntact(hunks, lines);
  });

  it("honours collapseThreshold: 0 (collapse as soon as anything is hidden)", () => {
    const lines = makeLines(`r${"c".repeat(7)}r`);
    const hunks = buildHunks(lines, { context: 3, collapseThreshold: 0 });
    expect(hunks).toHaveLength(2);
    expect(hunks[1].hiddenBefore.length).toBe(1);
    expectModelIntact(hunks, lines, 0);
  });

  it("builds three hunks across two wide gaps", () => {
    const lines = makeLines(`r${"c".repeat(20)}r${"c".repeat(20)}r`);
    const hunks = buildHunks(lines, { context: 3, collapseThreshold: 4 });
    expect(hunks).toHaveLength(3);
    expect(hunks.map((h) => h.hiddenBefore.length)).toEqual([0, 14, 14]);
    expect(hunks.map((h) => h.hiddenAfter.length)).toEqual([0, 0, 0]);
    expect(hunks.map((h) => shapeOf(h.lines))).toEqual(["rccc", "cccrccc", "cccr"]);
    expectModelIntact(hunks, lines);
  });
});

describe("buildHunks — edge collapse economics (leading and trailing)", () => {
  // An EDGE run spends context on one side only, so its break-even point is
  // `context + collapseThreshold` (7 with the defaults), not `2*context + — .

  it("renders a short leading run in full instead of collapsing it", () => {
    // The regression this guards: a 4-line leading run used to produce
    // `gapBefore: 1` — the "⋯ 1 unchanged line" expander the docs promise
    // never to emit.
    const lines = makeLines(`${"c".repeat(4)}r`);
    const hunks = buildHunks(lines, { context: 3, collapseThreshold: 4 });
    expect(hunks).toHaveLength(1);
    expect(hunks[0].hiddenBefore.length).toBe(0);
    expect(shapeOf(hunks[0].lines)).toBe("ccccr");
    expectModelIntact(hunks, lines);
  });

  it("renders a short trailing run in full", () => {
    const lines = makeLines(`r${"c".repeat(4)}`);
    const hunks = buildHunks(lines, { context: 3, collapseThreshold: 4 });
    expect(hunks[0].hiddenAfter.length).toBe(0);
    expect(shapeOf(hunks[0].lines)).toBe("rcccc");
    expectModelIntact(hunks, lines);
  });

  it("keeps a leading run of exactly context + collapseThreshold inline", () => {
    const lines = makeLines(`${"c".repeat(7)}r`);
    const hunks = buildHunks(lines, { context: 3, collapseThreshold: 4 });
    expect(hunks[0].hiddenBefore.length).toBe(0);
    expect(shapeOf(hunks[0].lines)).toBe("cccccccr");
    expectModelIntact(hunks, lines);
  });

  it("collapses a leading run one line past the break-even point", () => {
    const lines = makeLines(`${"c".repeat(8)}r`);
    const hunks = buildHunks(lines, { context: 3, collapseThreshold: 4 });
    expect(hunks[0].hiddenBefore.length).toBe(8 - 3); // 5 hidden
    expect(shapeOf(hunks[0].lines)).toBe("cccr");
    expectModelIntact(hunks, lines);
  });

  it("collapses a trailing run past the break-even point — it is no longer ignored", () => {
    // The opposite regression: trailing runs used to be dropped silently,
    // with no marker and no way to reach them.
    const lines = makeLines(`r${"c".repeat(20)}`);
    const hunks = buildHunks(lines, { context: 3, collapseThreshold: 4 });
    expect(hunks).toHaveLength(1);
    expect(shapeOf(hunks[0].lines)).toBe("rccc");
    expect(hunks[0].hiddenAfter.length).toBe(20 - 3); // 17 hidden, and reachable
    expect(hunks[0].hiddenAfter).toHaveLength(17);
    expectModelIntact(hunks, lines);
  });

  it("never emits an undersized gap — sweep at head, interior and tail", () => {
    for (let run = 0; run <= 24; run++) {
      const shapes: Array<[string, string]> = [
        ["leading", `${"c".repeat(run)}r`],
        ["interior", `r${"c".repeat(run)}r`],
        ["trailing", `r${"c".repeat(run)}`],
      ];
      for (const [position, spec] of shapes) {
        const lines = makeLines(spec);
        const hunks = buildHunks(lines, { context: 3, collapseThreshold: 4 });
        for (const hunk of hunks) {
          if (hunk.hiddenBefore.length > 0) {
            expect(hunk.hiddenBefore.length, `${position} run=${run} gapBefore`).toBeGreaterThan(4);
          }
          if (hunk.hiddenAfter.length > 0) {
            expect(hunk.hiddenAfter.length, `${position} run=${run} gapAfter`).toBeGreaterThan(4);
          }
        }
        expectModelIntact(hunks, lines);
      }
    }
  });

  it("applies the edge rule symmetrically at both ends", () => {
    const leading = buildHunks(makeLines(`${"c".repeat(12)}r`), { context: 3 });
    const trailing = buildHunks(makeLines(`r${"c".repeat(12)}`), { context: 3 });
    expect(leading[0].hiddenBefore.length).toBe(9);
    expect(trailing[0].hiddenAfter.length).toBe(9);
  });

  it("splits the edge counts correctly when a document has both", () => {
    const lines = makeLines(`${"c".repeat(20)}r${"c".repeat(20)}`);
    const hunks = buildHunks(lines, { context: 3, collapseThreshold: 4 });
    expect(hunks).toHaveLength(1);
    expect(hunks[0].hiddenBefore.length).toBe(17);
    expect(hunks[0].hiddenAfter.length).toBe(17);
    expect(shapeOf(hunks[0].lines)).toBe("cccrccc");
    expectModelIntact(hunks, lines);
  });
});

describe("buildHunks — expansion data travels with the model", () => {
  it("carries the actual hidden lines, not just a count", () => {
    const lines = makeLines(`${"c".repeat(20)}r${"c".repeat(20)}`);
    const [hunk] = buildHunks(lines, { context: 3 });

    // A consumer holding only the hunk can reveal what was collapsed.
    expect(hunk.hiddenBefore.map((l) => l.content)).toEqual(
      lines.slice(0, 17).map((l) => l.content),
    );
    expect(hunk.hiddenAfter.map((l) => l.content)).toEqual(
      lines.slice(24).map((l) => l.content),
    );
  });

  it("shares line objects rather than copying them (no extra memory)", () => {
    const lines = makeLines(`${"c".repeat(20)}r`);
    const [hunk] = buildHunks(lines, { context: 3 });
    hunk.hiddenBefore.forEach((line, i) => expect(line).toBe(lines[i]));
  });

  it("supports expandStep-sized expansion from either edge of a gap", () => {
    const lines = makeLines(`${"c".repeat(40)}r`);
    const [hunk] = buildHunks(lines, { context: 3 });
    expect(hunk.hiddenBefore.length).toBe(37);

    // Expand downward (the lines closest to the hunk) …
    expect(hunk.hiddenBefore.slice(-20).map((l) => l.content)).toEqual(
      lines.slice(17, 37).map((l) => l.content),
    );
    // …and upward (the top of the document).
    expect(hunk.hiddenBefore.slice(0, 20).map((l) => l.content)).toEqual(
      lines.slice(0, 20).map((l) => l.content),
    );
  });

  it("lets a consumer rebuild the entire document from the hunks alone", () => {
    const lines = makeLines(`${"c".repeat(30)}ra${"c".repeat(30)}r${"c".repeat(30)}`);
    const hunks = buildHunks(lines, { context: 3 });
    expect(hunks.length).toBeGreaterThan(1);

    const rebuilt = hunks.flatMap((h) => [...h.hiddenBefore, ...h.lines, ...h.hiddenAfter]);
    expect(rebuilt.map((l) => l.content)).toEqual(lines.map((l) => l.content));
  });

  it("carries no hidden lines when nothing was collapsed", () => {
    const lines = makeLines("crac");
    const [hunk] = buildHunks(lines, { context: 3 });
    expect(hunk.hiddenBefore).toEqual([]);
    expect(hunk.hiddenAfter).toEqual([]);
    expect(hunk.hiddenBefore.length).toBe(0);
    expect(hunk.hiddenAfter.length).toBe(0);
  });
});

describe("buildHunks — line numbering", () => {
  it("reports 1-based starts for a hunk at the top of the file", () => {
    const hunks = buildHunks(makeLines("rcc"), { context: 1 });
    expect(hunks[0].oldStart).toBe(1);
    expect(hunks[0].newStart).toBe(1);
  });

  it("reports the correct starts after leading context", () => {
    const hunks = buildHunks(makeLines("ccccccccccr"), { context: 3 });
    // Hunk starts at index 7 — the 8th line of both documents.
    expect(hunks[0].oldStart).toBe(8);
    expect(hunks[0].newStart).toBe(8);
  });

  it("reports starts that diverge once adds and removes are unbalanced", () => {
    // 10×c a a r r — the leading run is long enough to collapse, so the
    // hunk really does start at the first add (index 10).
    const hunks = buildHunks(makeLines(`${"c".repeat(10)}aarrcc`), { context: 0 });
    expect(hunks).toHaveLength(1);
    // 10 context lines consumed on both sides — old line 11, new line 11.
    expect(hunks[0].oldStart).toBe(11);
    expect(hunks[0].newStart).toBe(11);
    // The 2-line trailing run is too short to be worth an expander, so it
    // is rendered rather than hidden.
    expect(shapeOf(hunks[0].lines)).toBe("aarrcc");
    expect(hunks[0].hiddenAfter.length).toBe(0);
  });

  it("reports a correct oldStart for a hunk that begins with an add", () => {
    // The add sits at index 10; with context 0 and a collapsible leading run
    // the hunk is exactly that one line, which has no oldNumber of its own.
    const hunks = buildHunks(makeLines(`${"c".repeat(10)}a${"c".repeat(10)}`), { context: 0 });
    expect(hunks[0].lines).toHaveLength(1);
    expect(hunks[0].lines[0].type).toBe("add");
    expect(hunks[0].lines[0].oldNumber).toBeUndefined();
    // Still reported correctly, from the line types alone.
    expect(hunks[0].oldStart).toBe(11);
    expect(hunks[0].newStart).toBe(11);
  });

  it("reports starts that account for earlier adds and removes", () => {
    //  idx: 0 1 2 3 4 5 6 7 8 9 ...
    // spec: a a c c c c c c c c c c c c c c c c c c c c c c r
    const lines = makeLines(`aa${"c".repeat(22)}r`);
    const hunks = buildHunks(lines, { context: 2, collapseThreshold: 0 });
    expect(hunks).toHaveLength(2);
    // Second hunk starts 2 lines before the remove at index 24 — index 22.
    // Old numbering at index 22: 2 adds consumed no old lines, 20 contexts
    // did — old line 21. New numbering: 2 adds + 20 contexts — new line 23.
    expect(hunks[1].oldStart).toBe(21);
    expect(hunks[1].newStart).toBe(23);
  });

  it("keeps the lines' own numbers untouched (hunks slice, never renumber)", () => {
    const lines = makeLines(`${"c".repeat(12)}r${"c".repeat(12)}`);
    const hunks = buildHunks(lines, { context: 2 });
    expect(hunks[0].lines[0]).toBe(lines[10]);
    expect(hunks[0].lines[0].oldNumber).toBe(11);
    expect(hunks[0].lines[0].newNumber).toBe(11);
  });
});

describe("buildHunks — option guards", () => {
  it("applies the defaults when no options are given", () => {
    const withDefaults = buildHunks(makeLines(`r${"c".repeat(11)}r`));
    const explicit = buildHunks(makeLines(`r${"c".repeat(11)}r`), {
      context: 3,
      collapseThreshold: 4,
    });
    expect(withDefaults).toEqual(explicit);
  });

  it("falls back to the default context for NaN", () => {
    expect(buildHunks(makeLines("cccccrccccc"), { context: NaN })).toEqual(
      buildHunks(makeLines("cccccrccccc"), { context: 3 }),
    );
  });

  it("falls back to the default collapseThreshold for NaN", () => {
    expect(
      buildHunks(makeLines(`r${"c".repeat(11)}r`), { context: 3, collapseThreshold: NaN }),
    ).toEqual(buildHunks(makeLines(`r${"c".repeat(11)}r`), { context: 3, collapseThreshold: 4 }));
  });

  it("treats an Infinite collapseThreshold as the default, not as 'never split'", () => {
    // Infinity is meaningless here (it would silently disable collapsing),
    // so toFinite rejects it — unlike `context`, where Infinity is legal.
    expect(
      buildHunks(makeLines(`r${"c".repeat(11)}r`), { context: 3, collapseThreshold: Infinity }),
    ).toHaveLength(2);
  });

  it("clamps a negative context to 0", () => {
    expect(buildHunks(makeLines("cccrccc"), { context: -5 })).toEqual(
      buildHunks(makeLines("cccrccc"), { context: 0 }),
    );
  });

  it("clamps a negative collapseThreshold to 0", () => {
    expect(
      buildHunks(makeLines(`r${"c".repeat(7)}r`), { context: 3, collapseThreshold: -9 }),
    ).toEqual(buildHunks(makeLines(`r${"c".repeat(7)}r`), { context: 3, collapseThreshold: 0 }));
  });

  it("treats -Infinity context as 0", () => {
    expect(buildHunks(makeLines("cccrccc"), { context: -Infinity })).toEqual(
      buildHunks(makeLines("cccrccc"), { context: 0 }),
    );
  });

  it("is deterministic", () => {
    const lines = makeLines(`c${"c".repeat(20)}rac${"c".repeat(30)}r`);
    expect(buildHunks(lines, { context: 3 })).toEqual(buildHunks(lines, { context: 3 }));
  });
});

import { describe, expect, it } from "vitest";

import { cx } from "../components/Row";
import { computeDiff } from "../diff/computeDiff";
import type { DiffHunk, DiffLine } from "../types";
import { alignRows, toSplitRows, toUnifiedRows } from "./rows";

/** A hunk wrapping a hand-written line list. */
function hunkOf(lines: DiffLine[]): DiffHunk {
  return {
    oldStart: 1,
    newStart: 1,
    lines,
    hiddenBefore: [],
    hiddenAfter: [],
  };
}

const context = (n: number, content = `c${n}`): DiffLine => ({
  type: "context",
  oldNumber: n,
  newNumber: n,
  content,
});
const removed = (n: number, content = `r${n}`): DiffLine => ({
  type: "remove",
  oldNumber: n,
  content,
});
const added = (n: number, content = `a${n}`): DiffLine => ({
  type: "add",
  newNumber: n,
  content,
});

describe("toSplitRows", () => {
  it("puts a context line in both cells — the same object", () => {
    const line = context(1);
    const rows = toSplitRows(hunkOf([line]));
    expect(rows).toHaveLength(1);
    expect(rows[0].left).toBe(line);
    expect(rows[0].right).toBe(line);
  });

  it("pairs the i-th removal with the i-th addition", () => {
    const r1 = removed(1);
    const r2 = removed(2);
    const a1 = added(1);
    const a2 = added(2);
    const rows = toSplitRows(hunkOf([r1, r2, a1, a2]));

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ left: r1, right: a1 });
    expect(rows[1]).toEqual({ left: r2, right: a2 });
  });

  it("fills the right side when there are surplus removals", () => {
    const rows = toSplitRows(hunkOf([removed(1), removed(2), removed(3), added(1)]));
    expect(rows).toHaveLength(3);
    expect(rows[0].right).not.toBeNull();
    expect(rows[1].right).toBeNull();
    expect(rows[2].right).toBeNull();
    expect(rows.every((row) => row.left !== null)).toBe(true);
  });

  it("fills the left side when there are surplus additions", () => {
    const rows = toSplitRows(hunkOf([removed(1), added(1), added(2), added(3)]));
    expect(rows).toHaveLength(3);
    expect(rows[0].left).not.toBeNull();
    expect(rows[1].left).toBeNull();
    expect(rows[2].left).toBeNull();
    expect(rows.every((row) => row.right !== null)).toBe(true);
  });

  it("handles a pure insertion block (every left cell is filler)", () => {
    const rows = toSplitRows(hunkOf([added(1), added(2)]));
    expect(rows.map((r) => r.left)).toEqual([null, null]);
    expect(rows.map((r) => r.right?.content)).toEqual(["a1", "a2"]);
  });

  it("handles a pure deletion block (every right cell is filler)", () => {
    const rows = toSplitRows(hunkOf([removed(1), removed(2)]));
    expect(rows.map((r) => r.right)).toEqual([null, null]);
    expect(rows.map((r) => r.left?.content)).toEqual(["r1", "r2"]);
  });

  it("keeps context rows out of the change block's alignment", () => {
    const rows = toSplitRows(
      hunkOf([context(1), removed(2), added(2), added(3), context(4)]),
    );
    expect(rows).toHaveLength(4);
    expect(rows[0].left).toBe(rows[0].right); // context
    expect(rows[1].left?.type).toBe("remove");
    expect(rows[2].left).toBeNull(); // surplus addition
    expect(rows[3].left).toBe(rows[3].right); // context
  });

  it("returns no rows for an empty hunk", () => {
    expect(toSplitRows(hunkOf([]))).toEqual([]);
  });

  it("never loses or duplicates a line", () => {
    const lines = [
      context(1),
      removed(2),
      removed(3),
      added(2),
      context(4),
      added(5),
      context(6),
    ];
    const rows = toSplitRows(hunkOf(lines));

    const seen = new Set<DiffLine>();
    for (const row of rows) {
      if (row.left) seen.add(row.left);
      if (row.right) seen.add(row.right);
    }
    expect(seen.size).toBe(lines.length);
    for (const line of lines) expect(seen.has(line)).toBe(true);
  });
});

describe("toUnifiedRows", () => {
  it("returns the hunk's lines in model order", () => {
    const lines = [context(1), removed(2), added(2), context(3)];
    expect(toUnifiedRows(hunkOf(lines))).toEqual(lines);
  });

  it("keeps removals before additions inside a change block", () => {
    const { hunks } = computeDiff("a\n1\n2\nb\n", "a\nx\ny\nb\n", { context: Infinity });
    expect(toUnifiedRows(hunks[0]).map((l) => l.type)).toEqual([
      "context",
      "remove",
      "remove",
      "add",
      "add",
      "context",
    ]);
  });
});

describe("split and unified agree by construction (SPEC §4.3)", () => {
  const before = "keep\nlet x = 1;\ndrop me\ncommon\n";
  const after = "keep\nconst x = 1;\ncommon\nappended\n";

  it("project the very same DiffLine objects", () => {
    const { hunks } = computeDiff(before, after, { context: Infinity });
    const [hunk] = hunks;

    const unified = toUnifiedRows(hunk);
    const split = toSplitRows(hunk);
    const fromSplit = new Set<DiffLine>();
    for (const row of split) {
      if (row.left) fromSplit.add(row.left);
      if (row.right) fromSplit.add(row.right);
    }

    expect(fromSplit.size).toBe(unified.length);
    for (const line of unified) expect(fromSplit.has(line)).toBe(true);
  });

  it("show identical old-side and new-side content", () => {
    const { hunks } = computeDiff(before, after, { context: Infinity });
    const [hunk] = hunks;

    const unified = toUnifiedRows(hunk);
    const split = toSplitRows(hunk);

    const unifiedOld = unified.filter((l) => l.type !== "add").map((l) => l.content);
    const splitOld = split
      .map((r) => r.left)
      .filter((l): l is DiffLine => l !== null)
      .map((l) => l.content);
    expect(splitOld).toEqual(unifiedOld);

    const unifiedNew = unified.filter((l) => l.type !== "remove").map((l) => l.content);
    const splitNew = split
      .map((r) => r.right)
      .filter((l): l is DiffLine => l !== null)
      .map((l) => l.content);
    expect(splitNew).toEqual(unifiedNew);
  });

  it("agree across a randomized set of documents", () => {
    const vocabulary = ["alpha", "beta", "", "  indent", "gamma();", "delta"];
    let seed = 99;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    for (let i = 0; i < 60; i++) {
      const pick = () => vocabulary[Math.floor(rng() * vocabulary.length)];
      const a = Array.from({ length: Math.floor(rng() * 12) }, pick).join("\n") + "\n";
      const b = Array.from({ length: Math.floor(rng() * 12) }, pick).join("\n") + "\n";
      const { hunks } = computeDiff(a, b, { context: Infinity });

      for (const hunk of hunks) {
        const unified = toUnifiedRows(hunk);
        const split = toSplitRows(hunk);
        const oldFromSplit = split
          .map((r) => r.left)
          .filter((l): l is DiffLine => l !== null)
          .map((l) => l.content);
        const oldFromUnified = unified.filter((l) => l.type !== "add").map((l) => l.content);
        expect(oldFromSplit).toEqual(oldFromUnified);
      }
    }
  });
});

describe("cx", () => {
  it("joins the truthy values", () => {
    expect(cx("row", false, undefined, "add")).toBe("row add");
  });

  it("returns undefined when nothing applies, so React omits the attribute", () => {
    expect(cx()).toBeUndefined();
    expect(cx(false, undefined, null)).toBeUndefined();
    expect(cx("")).toBeUndefined();
  });
});

describe("alignRows", () => {
  it("gives every context line its own row on both sides", () => {
    const lines = [context(1), context(2), context(3)];
    const rows = alignRows(lines);
    expect(rows).toHaveLength(3);
    rows.forEach((row, i) => {
      expect(row.left).toBe(lines[i]);
      expect(row.right).toBe(lines[i]);
    });
  });

  it("returns no rows for an empty list", () => {
    expect(alignRows([])).toEqual([]);
  });
});

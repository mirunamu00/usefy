import { describe, expect, it } from "vitest";
import { createJsonTree } from "./tree";
import { pathToPointer } from "./path";
import { naiveRows, type NaiveRow } from "../__testing__/naive";
import { generateValue, makeRandom } from "../__testing__/generate";
import type { JsonRow, JsonTreeModel } from "../types";

/** The fields both implementations must agree on, row for row. */
function comparable(row: JsonRow | NaiveRow) {
  return {
    path: [...row.path],
    key: row.key,
    label: row.label,
    kind: row.kind,
    depth: row.depth,
    closing: row.closing,
    expanded: row.expanded,
    expandable: row.expandable,
    childCount: row.childCount,
    posInSet: row.posInSet,
    setSize: row.setSize,
    display: row.display,
  };
}

function allRows(model: JsonTreeModel) {
  return Array.from({ length: model.rowCount() }, (_, i) => comparable(model.rowAt(i)));
}

describe("createJsonTree — shape", () => {
  it("renders a leaf as a single row", () => {
    const tree = createJsonTree(42);
    expect(tree.rowCount()).toBe(1);
    expect(tree.rowAt(0)).toMatchObject({
      kind: "number",
      display: "42",
      expandable: false,
      depth: 0,
      path: [],
    });
  });

  it("expands the root one level by default", () => {
    const tree = createJsonTree({ a: 1, b: 2 });
    // {  ·  a: 1  ·  b: 2  ·  }
    expect(tree.rowCount()).toBe(4);
    expect(tree.rowAt(0).display).toBe("{");
    expect(tree.rowAt(1)).toMatchObject({ key: "a", display: "1", depth: 1 });
    expect(tree.rowAt(3)).toMatchObject({ closing: true, display: "}" });
  });

  it("honours defaultExpandDepth: 0", () => {
    const tree = createJsonTree({ a: 1 }, { defaultExpandDepth: 0 });
    expect(tree.rowCount()).toBe(1);
    expect(tree.rowAt(0).display).toBe("{ 1 key }");
  });

  it("treats an empty container as a leaf", () => {
    const tree = createJsonTree({ empty: {}, none: [] });
    expect(tree.rowAt(1)).toMatchObject({ display: "{}", expandable: false });
    expect(tree.rowAt(2)).toMatchObject({ display: "[]", expandable: false });
    expect(tree.expand(["empty"]).refused).toEqual({ reason: "not-expandable" });
  });

  it("rejects an out-of-range row rather than returning nonsense", () => {
    const tree = createJsonTree({ a: 1 });
    expect(() => tree.rowAt(4)).toThrow(RangeError);
    expect(() => tree.rowAt(-1)).toThrow(RangeError);
  });
});

describe("createJsonTree — expansion", () => {
  it("reports the row delta and the pre-change anchor row", () => {
    const tree = createJsonTree({ a: { x: 1, y: 2 }, b: 3 });
    const before = tree.rowCount();
    const result = tree.expand(["a"]);

    expect(result.anchorRow).toBe(1);
    expect(result.delta).toBe(3); // two children plus the closing row
    expect(tree.rowCount()).toBe(before + 3);
  });

  it("refuses to expand a node whose ancestor is collapsed", () => {
    const tree = createJsonTree({ a: { x: 1 } }, { defaultExpandDepth: 0 });
    expect(tree.expand(["a", "x"]).refused).toEqual({ reason: "unreachable" });
  });

  it("expandTo opens every ancestor", () => {
    const tree = createJsonTree({ a: { b: { c: 1 } } }, { defaultExpandDepth: 0 });
    tree.expandTo(["a", "b", "c"]);
    expect(tree.rowIndexOf(["a", "b", "c"])).toBeGreaterThan(0);
    expect(tree.isExpanded(["a", "b"])).toBe(true);
    expect(tree.isExpanded(["a", "b", "c"])).toBe(false); // the target itself stays as it was
  });

  it("remembers what was open inside a collapsed node", () => {
    const tree = createJsonTree({ a: { b: { c: 1 } } }, { defaultExpandDepth: 0 });
    tree.expandTo(["a", "b", "c"]);
    const expanded = tree.rowCount();

    tree.collapse(["a"]);
    tree.expand(["a"]);
    expect(tree.rowCount()).toBe(expanded);
    expect(tree.isExpanded(["a", "b"])).toBe(true);
  });

  it("collapseAll is a reset, not a collapse", () => {
    const tree = createJsonTree({ a: { b: { c: 1 } } });
    tree.expandAll();
    tree.collapseAll();
    expect(tree.rowCount()).toBe(1);

    tree.expand([]);
    // Re-opening the root must NOT silently restore the whole previous state.
    expect(tree.isExpanded(["a"])).toBe(false);
  });

  it("rowIndexOf is the exact inverse of rowAt for every visible row", () => {
    const tree = createJsonTree(generateValue(makeRandom(11), { maxDepth: 4 }));
    tree.expandAll();
    for (let i = 0; i < tree.rowCount(); i++) {
      const row = tree.rowAt(i);
      if (row.closing) continue; // a closing row shares its container's path
      expect(tree.rowIndexOf(row.path)).toBe(i);
    }
  });

  it("reports -1 for a path that is not visible", () => {
    const tree = createJsonTree({ a: { b: 1 } }, { defaultExpandDepth: 1 });
    expect(tree.rowIndexOf(["a", "b"])).toBe(-1);
    expect(tree.rowIndexOf(["nope"])).toBe(-1);
  });
});

describe("createJsonTree — big containers", () => {
  const wide = { items: Array.from({ length: 200_000 }, (_, i) => i) };

  it("expands a 200 000-element array without materialising rows", () => {
    const tree = createJsonTree(wide);
    tree.expand(["items"]);
    expect(tree.rowCount()).toBe(200_000 + 4);
    expect(tree.rowAt(150_000).display).toBe(String(150_000 - 2));
  });

  it("keeps rowAt cheap in the middle of a huge array", () => {
    const tree = createJsonTree(wide);
    tree.expand(["items"]);
    // Not a benchmark — a smoke check that this is not accidentally O(n).
    for (let i = 0; i < 2000; i++) {
      tree.rowAt(2 + ((i * 97) % 200_000));
    }
    expect(tree.rowAt(2).display).toBe("0");
  });

  it("refuses expandAll past the row budget and says so", () => {
    const tree = createJsonTree(wide, { maxExpandedRows: 1000 });
    const result = tree.expandAll();
    expect(result.refused).toEqual({ reason: "row-budget", budget: 1000 });
    expect(tree.rowCount()).toBeLessThanOrEqual(1000);
  });

  it("never collapses what is already open when expandAll refuses", () => {
    // The failure this guards: "expand all" rebuilt the spine from scratch and
    // assigned the result even when the budget stopped it, so pressing the
    // toolbar's most obvious button on an already-expanded huge array threw
    // the whole thing away.
    const records = { items: Array.from({ length: 5000 }, (_, i) => ({ id: i })) };
    const tree = createJsonTree(records, { maxExpandedRows: 1000 });
    tree.expand(["items"]);
    const opened = tree.rowCount();
    expect(opened).toBe(5004);

    const result = tree.expandAll();
    expect(result.refused).toEqual({ reason: "row-budget", budget: 1000 });
    expect(tree.rowCount()).toBe(opened);
    expect(result.delta).toBe(0);
  });

  it("adds nothing and refuses nothing when there is nothing left to open", () => {
    const tree = createJsonTree(wide, { maxExpandedRows: 1000 });
    tree.expand(["items"]);
    const opened = tree.rowCount();

    // Every child of `items` is a leaf, so the budget is never even consulted.
    const result = tree.expandAll();
    expect(result.refused).toBeUndefined();
    expect(tree.rowCount()).toBe(opened);
  });

  it("expands a wide root rather than rendering a single silent row", () => {
    // Opening the root is one container, exactly like any other click, and a
    // single expansion has never been budgeted. Charging it here produced a
    // collapsed root with no explanation.
    const tree = createJsonTree(Array.from({ length: 200_000 }, (_, i) => i));
    expect(tree.rowCount()).toBe(200_002);
  });

  it("expands level by level, not greedily in document order", () => {
    // "The deepest level that fits" means every node at depth d is open before
    // any node at depth d+1 is considered.
    const data = {
      a: { deep: { deeper: [1, 2, 3] } },
      b: { deep: { deeper: [4, 5, 6] } },
      c: { deep: { deeper: [7, 8, 9] } },
    };
    const tree = createJsonTree(data, { maxExpandedRows: 20, defaultExpandDepth: 0 });
    tree.expandAll();

    // Both siblings of `a` must be open too; a greedy walk would have spent
    // the budget going all the way down `a` first.
    expect(tree.isExpanded(["a"])).toBe(true);
    expect(tree.isExpanded(["b"])).toBe(true);
    expect(tree.isExpanded(["c"])).toBe(true);
  });

  it("reports the recursion cap instead of truncating silently", () => {
    let deep: unknown = { leaf: true };
    for (let i = 0; i < 700; i++) deep = { next: deep };

    const tree = createJsonTree(deep, { maxExpandedRows: 10_000 });
    const result = tree.expandAll();
    expect(result.refused?.reason).toBe("depth-cap");
  });
});

describe("createJsonTree — hostile values", () => {
  it("renders a cycle instead of following it", () => {
    const node: Record<string, unknown> = { name: "root" };
    node.self = node;
    const tree = createJsonTree(node);

    const selfRow = tree.rowAt(2);
    expect(selfRow.kind).toBe("circular");
    expect(selfRow.display).toBe("[Circular]");
    expect(selfRow.expandable).toBe(false);
  });

  it("terminates expandAll on a self-referential object", () => {
    const node: Record<string, unknown> = { a: 1 };
    node.loop = node;
    const tree = createJsonTree(node, { maxExpandedRows: 10_000 });
    expect(() => tree.expandAll()).not.toThrow();
    expect(tree.rowCount()).toBeLessThan(10_000);
  });

  it("survives a throwing getter", () => {
    const hostile = {
      ok: 1,
      get boom(): never {
        throw new Error("nope");
      },
    };
    const tree = createJsonTree(hostile);
    expect(tree.rowAt(2).display).toBe("[Threw: nope]");
  });

  it("renders Map, Set, Date, BigInt and undefined", () => {
    const tree = createJsonTree(
      {
        map: new Map([["k", 1]]),
        set: new Set([1, 2]),
        at: new Date(0),
        big: 10n,
        gone: undefined,
      },
      { defaultExpandDepth: 1 },
    );
    const byKey = new Map(
      Array.from({ length: tree.rowCount() }, (_, i) => tree.rowAt(i)).map((r) => [
        r.key,
        r,
      ]),
    );
    expect(byKey.get("map")!.display).toBe("Map(1)");
    expect(byKey.get("set")!.display).toBe("Set(2)");
    expect(byKey.get("at")!.display).toBe("1970-01-01T00:00:00.000Z");
    expect(byKey.get("big")!.display).toBe("10n");
    expect(byKey.get("gone")!.display).toBe("undefined");
  });

  it("addresses Map children positionally but labels them by key", () => {
    const tree = createJsonTree({ m: new Map([["alpha", 1]]) });
    tree.expand(["m"]);
    expect(tree.rowAt(2)).toMatchObject({ key: 0, display: "1" });
  });
});

describe("createJsonTree — expansion state round trip", () => {
  it("restores exactly the rows it exported", () => {
    const data = generateValue(makeRandom(5), { maxDepth: 4 });
    const tree = createJsonTree(data);
    tree.expandAll(3);

    const snapshot = tree.getExpandedPaths();
    const rows = allRows(tree);

    const restored = createJsonTree(data);
    restored.setExpandedPaths(snapshot);
    expect(allRows(restored)).toEqual(rows);
    expect(restored.getExpandedPaths()).toEqual(snapshot);
  });

  it("ignores pointers that no longer resolve", () => {
    const tree = createJsonTree({ a: { b: 1 } });
    expect(() => tree.setExpandedPaths(["", "/a", "/ghost", "/a/b/c"])).not.toThrow();
    expect(tree.isExpanded(["a"])).toBe(true);
  });
});

describe("createJsonTree — the naive oracle", () => {
  // The whole engine exists to avoid building a row array. This is the check
  // that it computes the *same* rows the row array would have contained,
  // after arbitrary expand/collapse sequences.
  for (const seed of [3, 17, 99, 2024, 65535]) {
    for (const denseThreshold of [512, 1]) {
      it(`matches a full flatten (seed ${seed}, denseThreshold ${denseThreshold})`, () => {
        const random = makeRandom(seed);
        const data = generateValue(random, {
          maxDepth: 5,
          maxBreadth: 5,
          exotic: true,
        });

        const tree = createJsonTree(data, { defaultExpandDepth: 0, denseThreshold });
        const expanded = new Set<string>();

        const check = () => {
          expect(allRows(tree)).toEqual(
            naiveRows(data, expanded).map((row) => comparable(row)),
          );
        };
        check();

        for (let step = 0; step < 200; step++) {
          const index = Math.floor(random() * tree.rowCount());
          const row = tree.rowAt(index);
          if (row.closing || !row.expandable) continue;

          const pointer = pathToPointer(row.path);
          if (row.expanded) {
            tree.collapse(row.path);
            expanded.delete(pointer);
          } else {
            tree.expand(row.path);
            expanded.add(pointer);
          }
          check();
        }
      });
    }
  }

  it("agrees after expandAll on a deep tree", () => {
    const data = generateValue(makeRandom(777), { maxDepth: 6, maxBreadth: 4 });
    const tree = createJsonTree(data, { maxExpandedRows: 1_000_000 });
    tree.expandAll();
    expect(allRows(tree)).toEqual(
      naiveRows(data, new Set(tree.getExpandedPaths())).map((row) => comparable(row)),
    );
  });
});

describe("createJsonTree — sortKeys", () => {
  it("orders object children alphabetically without touching the data", () => {
    const data = { zeta: 1, alpha: 2 };
    const tree = createJsonTree(data, { sortKeys: true });
    expect(tree.rowAt(1).key).toBe("alpha");
    expect(Object.keys(data)).toEqual(["zeta", "alpha"]);
  });
});

describe("createJsonTree — version", () => {
  it("bumps only when the expansion state actually changes", () => {
    const tree = createJsonTree({ a: { b: 1 } });
    const start = tree.version();
    tree.expand(["a"]);
    expect(tree.version()).toBe(start + 1);
    tree.expand(["a"]); // already open
    expect(tree.version()).toBe(start + 1);
  });
});

import { describe, expect, it } from "vitest";
import { DenseOrder, SparseOrder, toDense, type OrderIndex } from "./order";
import { makeRandom } from "../__testing__/generate";

/** The obvious O(k) implementation. Both real indexes must agree with it exactly. */
function brute(rows: readonly number[]) {
  return {
    totalRows: () => rows.reduce((sum, n) => sum + n, 0),
    rowStartOf: (child: number) =>
      rows.slice(0, child).reduce((sum, n) => sum + n, 0),
    locate: (localRow: number) => {
      let accumulated = 0;
      for (let child = 0; child < rows.length; child++) {
        if (localRow < accumulated + rows[child]!) {
          return { child, offset: localRow - accumulated };
        }
        accumulated += rows[child]!;
      }
      throw new RangeError(`row ${localRow} past the end`);
    },
  };
}

function checkAgainstBrute(index: OrderIndex, rows: readonly number[]): void {
  const reference = brute(rows);
  expect(index.totalRows()).toBe(reference.totalRows());

  for (let child = 0; child < rows.length; child++) {
    expect(index.rowsOf(child)).toBe(rows[child]);
    expect(index.rowStartOf(child)).toBe(reference.rowStartOf(child));
  }
  for (let row = 0; row < reference.totalRows(); row++) {
    expect(index.locate(row)).toEqual(reference.locate(row));
  }
}

describe("SparseOrder", () => {
  it("is one row per child before anything is expanded", () => {
    const order = new SparseOrder(5);
    expect(order.totalRows()).toBe(5);
    expect(order.expandedCount).toBe(0);
    checkAgainstBrute(order, [1, 1, 1, 1, 1]);
  });

  it("costs nothing per unexpanded child of a huge container", () => {
    // The reason this representation exists: expanding one element inside a
    // million-item array must not allocate a million-entry index.
    const order = new SparseOrder(1_000_000);
    order.set(999_998, 7);
    expect(order.expandedCount).toBe(1);
    expect(order.totalRows()).toBe(1_000_006);
    expect(order.rowStartOf(999_998)).toBe(999_998);
    expect(order.locate(999_999)).toEqual({ child: 999_998, offset: 1 });
    expect(order.locate(1_000_005)).toEqual({ child: 999_999, offset: 0 });
  });

  it("collapses a child back to a single row", () => {
    const order = new SparseOrder(4);
    order.set(1, 5);
    order.set(1, 1);
    expect(order.expandedCount).toBe(0);
    checkAgainstBrute(order, [1, 1, 1, 1]);
  });

  it("builds in one pass with bulk()", () => {
    const order = new SparseOrder(6);
    order.bulk([
      [4, 3],
      [1, 2],
      [2, 1],
    ]);
    expect(order.expandedCount).toBe(2);
    checkAgainstBrute(order, [1, 2, 1, 1, 3, 1]);
  });

  it("bulk() and repeated set() produce the same index", () => {
    const pairs: [number, number][] = [
      [0, 4],
      [3, 2],
      [7, 9],
    ];
    const bulk = new SparseOrder(10);
    bulk.bulk(pairs);
    const incremental = new SparseOrder(10);
    for (const [child, rows] of pairs) incremental.set(child, rows);

    const expected = [4, 1, 1, 2, 1, 1, 1, 9, 1, 1];
    checkAgainstBrute(bulk, expected);
    checkAgainstBrute(incremental, expected);
  });
});

describe("DenseOrder", () => {
  it("matches the reference for a hand-built layout", () => {
    const order = new DenseOrder(6, [
      [1, 2],
      [4, 3],
    ]);
    expect(order.expandedCount).toBe(2);
    checkAgainstBrute(order, [1, 2, 1, 1, 3, 1]);
  });

  it("handles a single child", () => {
    const order = new DenseOrder(1, [[0, 4]]);
    checkAgainstBrute(order, [4]);
  });

  it("updates in place", () => {
    const order = new DenseOrder(5);
    order.set(2, 6);
    order.set(0, 3);
    order.set(2, 1);
    checkAgainstBrute(order, [3, 1, 1, 1, 1]);
    expect(order.expandedCount).toBe(1);
  });
});

describe("promotion", () => {
  it("preserves every row count", () => {
    const sparse = new SparseOrder(50);
    sparse.set(3, 4);
    sparse.set(20, 11);
    sparse.set(49, 2);

    const dense = toDense(sparse);
    const expected = Array.from({ length: 50 }, () => 1);
    expected[3] = 4;
    expected[20] = 11;
    expected[49] = 2;

    checkAgainstBrute(sparse, expected);
    checkAgainstBrute(dense, expected);
  });
});

describe("both representations, seeded random sequences", () => {
  // The tests above check shapes somebody thought of. This one checks the
  // shapes nobody thought of, reproducibly.
  for (const seed of [1, 7, 42, 1337, 90210]) {
    it(`agrees with the reference after random mutations (seed ${seed})`, () => {
      const random = makeRandom(seed);
      const size = 3 + Math.floor(random() * 40);
      const rows = Array.from({ length: size }, () => 1);
      const sparse = new SparseOrder(size);
      const dense = new DenseOrder(size);

      for (let step = 0; step < 120; step++) {
        const child = Math.floor(random() * size);
        const next = random() < 0.35 ? 1 : 2 + Math.floor(random() * 8);
        rows[child] = next;
        sparse.set(child, next);
        dense.set(child, next);

        checkAgainstBrute(sparse, rows);
        checkAgainstBrute(dense, rows);
        expect(sparse.expandedCount).toBe(dense.expandedCount);
      }

      // …and the promotion path must land on exactly the same answers.
      checkAgainstBrute(toDense(sparse), rows);
    });
  }
});

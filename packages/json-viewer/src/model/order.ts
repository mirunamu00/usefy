/**
 * Order-statistic index over one container's children (SPEC.md §4.2).
 *
 * ## The question it answers
 *
 * An expanded container renders as
 *
 * ```text
 *   0        {                      <- the container's own opening row
 *   1..n     …children…             <- this index addresses THIS region
 *   n+1      }                      <- the closing row
 * ```
 *
 * Child `c` occupies `rows(c)` rows — exactly 1 when it is a leaf or a
 * collapsed container, more when it is itself expanded. Given a row offset
 * inside the children region, {@link OrderIndex.locate} must say *which child*
 * that is, and it must do so on every rendered row of every frame.
 *
 * ## Why there are two representations
 *
 * The textbook answer is a Fenwick tree over all `k` children. That is
 * `O(log k)` for both query and update — and `O(k)` **memory**, which is the
 * problem: expanding a single element inside a 1 M-item array would allocate a
 * 4 MB `Int32Array` to record that 999 999 of its entries are `1`.
 *
 * So the default is {@link SparseOrder}, which stores only the children that
 * are actually expanded: `O(e)` memory and `O(log e)` queries, where `e` is
 * what the user has clicked. Its weakness is mutation — an `O(e)` splice — so
 * once `e` grows past `denseThreshold` the container is promoted to
 * {@link DenseOrder}. Both satisfy the same interface and are tested against
 * the same brute-force reference, including across the promotion boundary.
 */

/** Row bookkeeping for the children of one expanded container. */
export interface OrderIndex {
  /** Number of children, `k`. Fixed for the lifetime of the index. */
  readonly size: number;
  /** Children that occupy more than one row. */
  readonly expandedCount: number;
  /** Total rows the children region occupies. */
  totalRows(): number;
  /** Rows occupied by child `c` (always ≥ 1). */
  rowsOf(child: number): number;
  /** Row offset, within the children region, at which child `c` starts. */
  rowStartOf(child: number): number;
  /** Which child contains `localRow`, and how far into it that row is. */
  locate(localRow: number): Located;
  /** Record that child `c` now occupies `rows` rows. */
  set(child: number, rows: number): void;
}

/** The child a row belongs to. `offset` is 0 for the child's own first row. */
export interface Located {
  child: number;
  offset: number;
}

/**
 * Sparse representation: only children with `rows > 1` are stored.
 *
 * Three parallel arrays kept sorted by child index — `idx` the child, `ext`
 * its *extra* rows (`rows - 1`), and `pre` the running sum of `ext` before
 * each position, which is what makes `rowStartOf` a binary search instead of
 * a scan.
 */
export class SparseOrder implements OrderIndex {
  private idx: number[] = [];
  private ext: number[] = [];
  private pre: number[] = [];
  private total = 0;

  constructor(readonly size: number) {}

  get expandedCount(): number {
    return this.idx.length;
  }

  /** The `(child, rows)` pairs currently stored — used to promote to dense. */
  entries(): readonly (readonly [number, number])[] {
    return this.idx.map((child, i) => [child, this.ext[i]! + 1] as const);
  }

  /**
   * Build the whole index in one pass.
   *
   * Bulk expansion must never go through repeated {@link set}: inserting `e`
   * children one at a time is `O(e²)`, which is minutes for a large
   * `expandAll`.
   *
   * @param pairs `(child, rows)` pairs. Sorted here, so callers need not be.
   */
  bulk(pairs: readonly (readonly [number, number])[]): void {
    const sorted = pairs
      .filter(([, rows]) => rows > 1)
      .slice()
      .sort((a, b) => a[0] - b[0]);

    this.idx = sorted.map(([child]) => child);
    this.ext = sorted.map(([, rows]) => rows - 1);
    this.pre = new Array(this.ext.length);

    let running = 0;
    for (let i = 0; i < this.ext.length; i++) {
      this.pre[i] = running;
      running += this.ext[i]!;
    }
    this.total = running;
  }

  totalRows(): number {
    return this.size + this.total;
  }

  rowsOf(child: number): number {
    const p = this.find(child);
    return p >= 0 ? this.ext[p]! + 1 : 1;
  }

  rowStartOf(child: number): number {
    return child + this.extraBefore(child);
  }

  /** Sum of extra rows contributed by children before `child`. */
  private extraBefore(child: number): number {
    const p = this.lowerBound(child);
    return p < this.pre.length ? this.pre[p]! : this.total;
  }

  locate(localRow: number): Located {
    // Find the last expanded child that starts at or before `localRow`.
    let lo = 0;
    let hi = this.idx.length - 1;
    let p = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.idx[mid]! + this.pre[mid]! <= localRow) {
        p = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    // Before every expanded child: the region is one row per child.
    if (p < 0) return { child: localRow, offset: 0 };

    const start = this.idx[p]! + this.pre[p]!;
    const last = start + this.ext[p]!;
    if (localRow <= last) return { child: this.idx[p]!, offset: localRow - start };

    // Past that child, back to one row each until the next expanded sibling.
    return { child: this.idx[p]! + 1 + (localRow - last - 1), offset: 0 };
  }

  set(child: number, rows: number): void {
    const extra = rows - 1;
    const p = this.lowerBound(child);
    const present = p < this.idx.length && this.idx[p] === child;

    if (extra <= 0) {
      if (!present) return;
      this.idx.splice(p, 1);
      this.ext.splice(p, 1);
      this.pre.splice(p, 1);
      this.reprefix(p);
      return;
    }

    if (present) {
      if (this.ext[p] === extra) return;
      this.ext[p] = extra;
      this.reprefix(p);
      return;
    }

    this.idx.splice(p, 0, child);
    this.ext.splice(p, 0, extra);
    this.pre.splice(p, 0, 0);
    this.reprefix(p);
  }

  /** Recompute prefix sums from `from` onward — everything before is unchanged. */
  private reprefix(from: number): void {
    let running = from > 0 ? this.pre[from - 1]! + this.ext[from - 1]! : 0;
    for (let i = from; i < this.ext.length; i++) {
      this.pre[i] = running;
      running += this.ext[i]!;
    }
    this.total = running;
  }

  /** First position whose child index is ≥ `child`. */
  private lowerBound(child: number): number {
    let lo = 0;
    let hi = this.idx.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.idx[mid]! < child) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /** Exact position of `child`, or -1. */
  private find(child: number): number {
    const p = this.lowerBound(child);
    return p < this.idx.length && this.idx[p] === child ? p : -1;
  }
}

/**
 * Dense representation: a Fenwick tree over all `k` children holding `rows(c)`.
 *
 * `O(log k)` for query *and* update, `O(k)` memory. Worth it only once enough
 * children are expanded that {@link SparseOrder}'s `O(e)` splice costs more
 * than the allocation.
 */
export class DenseOrder implements OrderIndex {
  /** 1-indexed Fenwick storage; `tree[0]` is unused. */
  private readonly tree: Int32Array;
  private readonly rows: Int32Array;
  private total: number;
  private expanded = 0;
  /** Highest power of two ≤ size, for the binary-lifting search. */
  private readonly pivot: number;

  constructor(readonly size: number, initial?: readonly (readonly [number, number])[]) {
    this.rows = new Int32Array(size).fill(1);
    if (initial) {
      for (const [child, rows] of initial) {
        if (child >= 0 && child < size && rows > 1) {
          this.rows[child] = rows;
          this.expanded++;
        }
      }
    }

    // Build in O(k) rather than k × O(log k) insertions.
    this.tree = new Int32Array(size + 1);
    for (let i = 0; i < size; i++) this.tree[i + 1] = this.rows[i]!;
    for (let i = 1; i <= size; i++) {
      const parent = i + (i & -i);
      if (parent <= size) this.tree[parent]! += this.tree[i]!;
    }

    let total = 0;
    for (let i = 0; i < size; i++) total += this.rows[i]!;
    this.total = total;

    let pivot = 1;
    while (pivot * 2 <= size) pivot *= 2;
    this.pivot = pivot;
  }

  get expandedCount(): number {
    return this.expanded;
  }

  totalRows(): number {
    return this.total;
  }

  rowsOf(child: number): number {
    return this.rows[child] ?? 1;
  }

  rowStartOf(child: number): number {
    let sum = 0;
    for (let i = child; i > 0; i -= i & -i) sum += this.tree[i]!;
    return sum;
  }

  locate(localRow: number): Located {
    let pos = 0;
    let remaining = localRow;
    for (let step = this.pivot; step > 0; step >>= 1) {
      const next = pos + step;
      if (next <= this.size && this.tree[next]! <= remaining) {
        pos = next;
        remaining -= this.tree[next]!;
      }
    }
    // `rows ≥ 1` makes the prefix strictly increasing, so `pos` lands inside
    // the array for any in-range row; clamp anyway rather than trusting it.
    if (pos >= this.size) {
      const child = this.size - 1;
      return { child, offset: localRow - this.rowStartOf(child) };
    }
    return { child: pos, offset: remaining };
  }

  set(child: number, rows: number): void {
    const next = Math.max(1, rows);
    const current = this.rows[child]!;
    if (current === next) return;

    if (current === 1 && next > 1) this.expanded++;
    else if (current > 1 && next === 1) this.expanded--;

    this.rows[child] = next;
    this.total += next - current;

    const delta = next - current;
    for (let i = child + 1; i <= this.size; i += i & -i) this.tree[i]! += delta;
  }
}

/**
 * Promote a sparse index to a dense one, preserving every row count.
 *
 * @example
 * ```ts
 * let order: OrderIndex = new SparseOrder(1_000_000);
 * order.set(42, 5);
 * if (order.expandedCount > threshold) order = toDense(order as SparseOrder);
 * ```
 */
export function toDense(sparse: SparseOrder): DenseOrder {
  return new DenseOrder(sparse.size, sparse.entries());
}

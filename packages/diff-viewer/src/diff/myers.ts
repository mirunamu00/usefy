/**
 * The Myers difference algorithm — linear-space variant, with an optional
 * edit-distance budget.
 *
 * Reference: Eugene W. Myers, *"An O(ND) Difference Algorithm and Its
 * Variations"*, Algorithmica 1(2), 1986, pp. 251–266.
 *
 * ## What this implements
 *
 * The paper's §4b **linear-space refinement**, not the simpler §2 variant.
 * The simple variant stores the whole "V" trace for every edit distance `d`
 * and walks it backwards, costing O(D²) memory — a 20 000-line file with
 * 10 000 differences would allocate hundreds of megabytes. The refinement
 * instead runs the forward and reverse edit-graph searches *simultaneously*
 * until their furthest-reaching paths overlap. That overlap is the **middle
 * snake** of some optimal path: a (possibly empty) diagonal run that is
 * guaranteed to lie on a shortest edit script. Recursing on the region
 * before it and the region after it, and concatenating, yields the same
 * optimal script using only O(N + M) memory and O(ND) time.
 *
 * The two `Int32Array` frontiers are allocated **once per top-level call**
 * and reused by every level of the recursion — the recursion carries no
 * state of its own beyond the index bounds it is handed.
 *
 * ## Coordinates
 *
 * The edit graph puts `a` on the x-axis and `b` on the y-axis. A move right
 * deletes `a[x]`, a move down inserts `b[y]`, and a diagonal move (a
 * "snake") keeps a matching element. Diagonal `k = x − y` indexes the
 * frontier arrays; the reverse search runs the same recurrence in mirrored
 * coordinates `u = N − x`, `v = M − y`, so its diagonal `k′` relates to the
 * forward one by `k′ = delta − k` where `delta = N − M`.
 *
 * ## Time is O(N·D), not O(N)
 *
 * The algorithm is fast when the inputs are *similar* and slow when they
 * diverge: two unrelated 20 000-line files have D ≈ 40 000 and take seconds.
 * Input **size** limits (`maxLines`, `maxBytes`) do not bound that — only a
 * limit on **D** does. {@link myersDiffBounded} adds one; `computeDiff` uses
 * it so a pathological pair degrades into an honest `truncated` result
 * instead of a frozen tab.
 *
 * ## Output shape
 *
 * Ops are **canonical**: adjacent same-type ops are merged, and inside every
 * maximal run of changes the deletions are emitted before the insertions.
 * Two runs with the same optimal script therefore always produce
 * byte-identical output, which is what makes the model deterministic
 * (SPEC §3.1) and the hand-written tests meaningful.
 *
 * Pure and framework-free: no React, no DOM, no globals, no allocation
 * outside the returned array and the two frontiers.
 */

/** What an op does to the input sequences. */
export type DiffOpType = "equal" | "delete" | "insert";

/**
 * One run of the edit script.
 *
 * Both indices are always meaningful, including for `delete`/`insert`:
 * `aIndex`/`bIndex` are the positions in `a` and `b` at which the op starts,
 * so an op can be applied without replaying the ones before it.
 *
 * - `equal` — `a[aIndex … aIndex+length)` equals `b[bIndex … bIndex+length)`.
 * - `delete` — `a[aIndex … aIndex+length)` is absent from `b`; `bIndex` is
 *   where it *would* have sat.
 * - `insert` — `b[bIndex … bIndex+length)` is absent from `a`; `aIndex` is
 *   where it is inserted.
 *
 * `length` is always `≥ 1` — zero-length ops are never emitted.
 *
 * @example
 * ```ts
 * import { myersDiff, type DiffOp } from "@usefy/diff-viewer/headless";
 *
 * const ops: DiffOp[] = myersDiff(["a", "b", "c"], ["a", "x", "c"]);
 * // [ { type: "equal",  aIndex: 0, bIndex: 0, length: 1 },
 * //   { type: "delete", aIndex: 1, bIndex: 1, length: 1 },
 * //   { type: "insert", aIndex: 2, bIndex: 1, length: 1 },
 * //   { type: "equal",  aIndex: 2, bIndex: 2, length: 1 } ]
 * ```
 */
export interface DiffOp {
  type: DiffOpType;
  /** Start index in `a`. */
  aIndex: number;
  /** Start index in `b`. */
  bIndex: number;
  /** Number of elements covered (always `≥ 1`). */
  length: number;
}

/** The middle snake of an optimal path, in absolute `a`/`b` coordinates. */
interface MiddleSnake {
  /** Snake start (inclusive) — end of the "before" sub-problem. */
  aStart: number;
  bStart: number;
  /** Snake end (exclusive) — start of the "after" sub-problem. */
  aEnd: number;
  bEnd: number;
}

/**
 * Per-call scratch: the two frontiers, reused at every level of the
 * recursion, plus the flag that records a budget bail.
 *
 * The flag lives here rather than in `diffRange`'s return value so there is
 * exactly **one** place a bail can be raised and exactly one place it is
 * observed. Threading it back up through every recursive call would add
 * branches that no input can reach — a sub-problem's edit distance is never
 * greater than its parent's, so once the top-level search fits the budget,
 * every search below it does too.
 */
interface Scratch {
  forward: Int32Array;
  reverse: Int32Array;
  /** Set when a middle-snake search hit the budget; the ops are then void. */
  bailed: boolean;
}

/** Default element comparison. */
function defaultEq<T>(x: T, y: T): boolean {
  return x === y;
}

/**
 * Find the middle snake of an optimal path through the edit graph of
 * `a[aLo…aHi)` vs `b[bLo…bHi)`, searching no deeper than `maxDepth`.
 *
 * Returns `null` when the search reaches `maxDepth` without the two
 * frontiers overlapping — i.e. this sub-problem's edit distance exceeds the
 * budget.
 *
 * Pre-conditions (guaranteed by {@link diffRange}'s prefix/suffix trimming):
 * both sub-ranges are non-empty, their first elements differ and their last
 * elements differ — hence the edit distance is at least 2 and any snake
 * returned always splits the problem into two strictly smaller ones.
 *
 * Only the two seed slots need initialising per call: every other slot read
 * at depth `d` was written by this same call at depth `d − 1`, so the shared
 * frontiers carry no stale state from one call to the next.
 */
function findMiddleSnake<T>(
  a: readonly T[],
  aLo: number,
  aHi: number,
  b: readonly T[],
  bLo: number,
  bHi: number,
  eq: (x: T, y: T) => boolean,
  scratch: Scratch,
  maxEditDistance: number,
): MiddleSnake | null {
  const n = aHi - aLo;
  const m = bHi - bLo;
  const delta = n - m;
  const deltaOdd = (delta & 1) !== 0;
  const max = Math.ceil((n + m) / 2);

  // Translate the edit-distance budget into a search depth. The two are not
  // interchangeable: an overlap found at depth `d` means `D = 2d − 1` when
  // delta is odd and `D = 2d` when it is even (D always has delta's parity).
  // Rounding the wrong way would either refuse a diff that fits the budget
  // or run one that exceeds it, so derive the depth from the parity and the
  // bound holds exactly.
  const maxDepth = deltaOdd
    ? Math.floor((maxEditDistance + 1) / 2)
    : Math.floor(maxEditDistance / 2);
  const limit = Math.min(max, maxDepth);

  // `off` centres diagonal 0; the +1 slack lets the recurrence read `k ± 1`
  // at the edges without a bounds check.
  const off = max + 1;
  const forward = scratch.forward;
  const reverse = scratch.reverse;

  // Seeding k = 1 with 0 makes the d = 0 / k = 0 step start at x = 0.
  forward[off + 1] = 0;
  reverse[off + 1] = 0;

  let snake: MiddleSnake | undefined;

  for (let d = 0; d <= limit && snake === undefined; d++) {
    // --- forward pass ---------------------------------------------------
    for (let k = -d; k <= d && snake === undefined; k += 2) {
      let x =
        k === -d || (k !== d && forward[off + k - 1] < forward[off + k + 1])
          ? forward[off + k + 1] // moved down (insert)
          : forward[off + k - 1] + 1; // moved right (delete)
      let y = x - k;
      const xStart = x;
      const yStart = y;
      while (x < n && y < m && eq(a[aLo + x], b[bLo + y])) {
        x++;
        y++;
      }
      forward[off + k] = x;

      // With an odd delta the overlap can only happen on a forward step,
      // checked against the reverse frontier from depth d − 1.
      if (
        deltaOdd &&
        k >= delta - (d - 1) &&
        k <= delta + (d - 1) &&
        x + reverse[off + delta - k] >= n
      ) {
        snake = {
          aStart: aLo + xStart,
          bStart: bLo + yStart,
          aEnd: aLo + x,
          bEnd: bLo + y,
        };
      }
    }
    if (snake !== undefined) break;

    // --- reverse pass ---------------------------------------------------
    // Mirrored coordinates: u = n − x, v = m − y.
    for (let k = -d; k <= d && snake === undefined; k += 2) {
      let u =
        k === -d || (k !== d && reverse[off + k - 1] < reverse[off + k + 1])
          ? reverse[off + k + 1]
          : reverse[off + k - 1] + 1;
      let v = u - k;
      const uStart = u;
      const vStart = v;
      while (u < n && v < m && eq(a[aLo + n - u - 1], b[bLo + m - v - 1])) {
        u++;
        v++;
      }
      reverse[off + k] = u;

      // With an even delta the overlap can only happen on a reverse step,
      // checked against the forward frontier from depth d.
      if (!deltaOdd && k >= delta - d && k <= delta + d && u + forward[off + delta - k] >= n) {
        snake = {
          aStart: aLo + n - u,
          bStart: bLo + m - v,
          aEnd: aLo + n - uStart,
          bEnd: bLo + m - vStart,
        };
      }
    }
  }

  // Myers' theorem guarantees an overlap by d = ceil((n + m) / 2), so this
  // is `undefined` only when `maxDepth` cut the search short.
  return snake ?? null;
}

/** Append an op, merging it into the previous one when they are contiguous. */
function pushOp(ops: DiffOp[], type: DiffOpType, aIndex: number, bIndex: number, length: number) {
  if (length <= 0) return;
  const last = ops[ops.length - 1];
  if (last !== undefined && last.type === type) {
    last.length += length;
    return;
  }
  ops.push({ type, aIndex, bIndex, length });
}

/**
 * Recursive driver: emit the optimal script for `a[aLo…aHi)` vs `b[bLo…bHi)`
 * into `ops`, in order.
 *
 * On a budget bail it sets `scratch.bailed` and stops; the top-level caller
 * observes the flag and discards `ops` wholesale, so nothing half-done ever
 * escapes.
 */
function diffRange<T>(
  a: readonly T[],
  aLo: number,
  aHi: number,
  b: readonly T[],
  bLo: number,
  bHi: number,
  eq: (x: T, y: T) => boolean,
  ops: DiffOp[],
  scratch: Scratch,
  maxEditDistance: number,
): void {
  // Trim the common prefix. This is not just an optimisation: it is what
  // guarantees the middle-snake pre-conditions (and therefore termination).
  let lo = aLo;
  let blo = bLo;
  while (lo < aHi && blo < bHi && eq(a[lo], b[blo])) {
    lo++;
    blo++;
  }
  if (lo > aLo) pushOp(ops, "equal", aLo, bLo, lo - aLo);

  // Trim the common suffix (recorded, then emitted after the middle).
  let hi = aHi;
  let bhi = bHi;
  while (hi > lo && bhi > blo && eq(a[hi - 1], b[bhi - 1])) {
    hi--;
    bhi--;
  }

  if (lo === hi) {
    // Everything left in `b` is an insertion — no search, no budget cost.
    pushOp(ops, "insert", lo, blo, bhi - blo);
  } else if (blo === bhi) {
    // Everything left in `a` is a deletion — no search, no budget cost.
    pushOp(ops, "delete", lo, blo, hi - lo);
  } else {
    // Both sides non-empty with differing ends ⇒ edit distance ≥ 2 ⇒ the
    // middle snake splits this into two strictly smaller sub-problems.
    const snake = findMiddleSnake(a, lo, hi, b, blo, bhi, eq, scratch, maxEditDistance);
    if (snake === null) {
      scratch.bailed = true;
      return;
    }
    diffRange(a, lo, snake.aStart, b, blo, snake.bStart, eq, ops, scratch, maxEditDistance);
    pushOp(ops, "equal", snake.aStart, snake.bStart, snake.aEnd - snake.aStart);
    diffRange(a, snake.aEnd, hi, b, snake.bEnd, bhi, eq, ops, scratch, maxEditDistance);
  }

  if (hi < aHi) pushOp(ops, "equal", hi, bhi, aHi - hi);
}

/**
 * Rewrite the script so that inside every maximal run of changes the
 * deletions come first, merged, followed by the insertions, merged.
 *
 * Within such a run only deletions advance `a` and only insertions advance
 * `b`, so both groups are already contiguous in their own sequence —
 * reordering them cannot change what the script means, and it makes the
 * output canonical regardless of which order the recursion happened to
 * discover the edits in.
 */
function canonicalize(ops: DiffOp[]): DiffOp[] {
  const out: DiffOp[] = [];
  let i = 0;
  while (i < ops.length) {
    const op = ops[i];
    if (op.type === "equal") {
      out.push(op);
      i++;
      continue;
    }
    // Collect the whole change run.
    let deleted = 0;
    let inserted = 0;
    const aStart = op.aIndex;
    const bStart = op.bIndex;
    let j = i;
    for (; j < ops.length && ops[j].type !== "equal"; j++) {
      if (ops[j].type === "delete") deleted += ops[j].length;
      else inserted += ops[j].length;
    }
    if (deleted > 0) out.push({ type: "delete", aIndex: aStart, bIndex: bStart, length: deleted });
    if (inserted > 0) {
      out.push({ type: "insert", aIndex: aStart + deleted, bIndex: bStart, length: inserted });
    }
    i = j;
  }
  return out;
}

/**
 * Compute the shortest edit script turning `a` into `b`, **giving up** if
 * doing so would cost more than `maxEditDistance`.
 *
 * Returns `null` when the budget is exceeded — nothing half-done is ever
 * returned. The caller decides what to show; `computeDiff` turns it into a
 * `truncated` result so the viewer can offer its "diff anyway" affordance
 * (SPEC resolved decision #10).
 *
 * The bound is **exact**: a pair whose edit distance is at most
 * `maxEditDistance` always diffs, and one whose distance exceeds it always
 * returns `null`.
 *
 * ## What the budget actually counts
 *
 * It caps the edit distance the *search* explores, and the search is the
 * only expensive part. Common prefixes and suffixes are trimmed first, and
 * a range where one side has run out becomes a single insert/delete op — so
 * **a pure insertion or deletion, however large, costs nothing and never
 * trips the budget**. Only genuinely interleaved divergence does.
 *
 * Cost is O((N + M) · D), so capping `D` turns the input-size limits into a
 * real *time* bound: `(2 × maxLines) × maxEditDistance` steps, worst case
 * (SPEC §4.4).
 *
 * @param a Source sequence.
 * @param b Target sequence.
 * @param maxEditDistance Maximum edit distance to search for. `Infinity`
 *   searches without a budget (what {@link myersDiff} does).
 * @param eq Element comparison; defaults to `===`.
 *
 * @example
 * ```ts
 * import { myersDiffBounded } from "@usefy/diff-viewer/headless";
 *
 * const ops = myersDiffBounded(oldLines, newLines, 3000);
 * if (ops === null) {
 *   // The two texts are too different to diff cheaply — tell the user.
 * }
 * ```
 */
export function myersDiffBounded<T>(
  a: readonly T[],
  b: readonly T[],
  maxEditDistance: number,
  eq: (x: T, y: T) => boolean = defaultEq,
): DiffOp[] | null {
  // Trivial cases, handled without touching the frontiers or the budget.
  if (a.length === 0 && b.length === 0) return [];
  if (a.length === 0) return [{ type: "insert", aIndex: 0, bIndex: 0, length: b.length }];
  if (b.length === 0) return [{ type: "delete", aIndex: 0, bIndex: 0, length: a.length }];

  // Sized for the whole problem and reused by every level of the recursion:
  // a sub-problem's `off` is never larger than this one's.
  const size = a.length + b.length + 4;
  const scratch: Scratch = {
    forward: new Int32Array(size),
    reverse: new Int32Array(size),
    bailed: false,
  };
  const ops: DiffOp[] = [];
  diffRange(a, 0, a.length, b, 0, b.length, eq, ops, scratch, maxEditDistance);
  return scratch.bailed ? null : canonicalize(ops);
}

/**
 * Compute the shortest edit script turning `a` into `b`.
 *
 * Runs the Myers O(ND) algorithm with the linear-space middle-snake
 * refinement, so memory stays O(N + M) even for large inputs. Generic over
 * the element type: the diff core uses it over **lines** and again over
 * **word tokens** inside a changed line.
 *
 * Guarantees:
 * - The script is **optimal** — no shorter one exists. The test suite
 *   asserts this against an independent dynamic-programming LCS oracle over
 *   an exhaustive small-alphabet sweep as well as randomized inputs.
 * - Applying the ops to `a` reconstructs `b` exactly.
 * - The op list is canonical — adjacent same-type ops merged, deletions
 *   before insertions inside each change run — so identical inputs always
 *   yield identical output (SPEC §3.1 determinism).
 * - Pure: no globals, no time, no randomness.
 *
 * **Performance:** O((N + M) · D) where `D` is the edit distance, so this is
 * fast for similar inputs and slow for dissimilar ones — two unrelated
 * 20 000-element sequences take seconds. Use {@link myersDiffBounded} when
 * the inputs are untrusted; that is what `computeDiff` does.
 *
 * @param a Source sequence.
 * @param b Target sequence.
 * @param eq Element comparison; defaults to `===`. Use it to diff against a
 *   normalized compare form while keeping the original elements.
 *
 * @example
 * ```ts
 * import { myersDiff } from "@usefy/diff-viewer/headless";
 *
 * const a = "ABCABBA".split("");
 * const b = "CBABAC".split("");
 * const ops = myersDiff(a, b);
 *
 * // Reconstruct b from a — the algorithm's contract:
 * const rebuilt = ops.flatMap((op) =>
 *   op.type === "delete"
 *     ? []
 *     : op.type === "insert"
 *       ? b.slice(op.bIndex, op.bIndex + op.length)
 *       : a.slice(op.aIndex, op.aIndex + op.length),
 * );
 * rebuilt.join(""); // "CBABAC"
 * ```
 */
export function myersDiff<T>(
  a: readonly T[],
  b: readonly T[],
  eq: (x: T, y: T) => boolean = defaultEq,
): DiffOp[] {
  // Unbounded: `myersDiffBounded` only ever returns null via its budget.
  return myersDiffBounded(a, b, Infinity, eq) as DiffOp[];
}

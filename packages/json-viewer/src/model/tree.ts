/**
 * The tree engine (SPEC.md §4.2) — the reason this package exists.
 *
 * ## The idea in one paragraph
 *
 * The parsed value **is** the tree; it is already in memory and nothing is
 * gained by copying it. A collapsed container is exactly **one** row no matter
 * how much it contains. So the only state worth keeping is bookkeeping for the
 * nodes the user actually expanded — an "expanded spine" that is typically a
 * few dozen records deep even when the document has millions of nodes. Row
 * lookup then walks that spine instead of an array: `rowAt(i)` is
 * `O(depth · log e)`, and memory is proportional to what was clicked, not to
 * the size of the data.
 *
 * That is the whole differentiator. Every incumbent renders the entire tree.
 *
 * ## What is *not* stored
 *
 * No row array. No per-node descriptor. No path strings. A {@link JsonRow} is
 * built during descent and handed out; keeping 4.5 M of them is exactly the
 * problem being avoided.
 */

import {
  DenseOrder,
  SparseOrder,
  toDense,
  type OrderIndex,
} from "./order";
import { pathToPointer, pointerToSegments } from "./path";
import {
  bracketsOf,
  childAccessor,
  childCountOf,
  classify,
  displayOf,
  isContainerKind,
  previewOf,
  type ChildAccessor,
} from "./value";
import type {
  ExpandResult,
  JsonKind,
  JsonPath,
  JsonRow,
  JsonTreeModel,
  JsonTreeOptions,
  PathSegment,
} from "../types";

/**
 * Recursion ceiling for *bulk* expansion (`expandAll`, `setExpandedPaths`).
 *
 * Manual expansion is iterative and has no such limit — this only stops a
 * pathologically nested document from overflowing the call stack during a
 * whole-tree walk, and a document nested deeper than this is not one anybody
 * expands in full anyway.
 */
const MAX_BULK_DEPTH = 512;

/** One expanded container. Leaves and collapsed containers have no record. */
interface Node {
  /** The value this node was built over, for cycle checks and re-reads. */
  value: unknown;
  kind: JsonKind;
  accessor: ChildAccessor;
  order: OrderIndex;
  /** Expanded children, by child index. */
  children: Map<number, Node>;
  /**
   * Children that were expanded and then collapsed, kept so re-expanding
   * restores what was inside.
   *
   * Collapsing a big object to scroll past it and losing every expansion under
   * it is the small papercut every viewer that forgets has. The data is
   * read-only by contract, so a retired subtree's row counts stay valid and
   * restoring it is a map move.
   *
   * The cost is honest bookkeeping: memory is proportional to what has *ever*
   * been expanded in this model, not to what is expanded now. `collapseAll`,
   * `expandAll` and `setExpandedPaths` all drop these — the first because it
   * is meant to be a reset, the other two because they rebuild the spine.
   */
  hidden: Map<number, Node>;
  /** Rows this node occupies: opening + children + closing. */
  rows: number;
  /** Lazy key → child-index map; objects only (see {@link childIndexOf}). */
  keyIndex: Map<string, number> | null;
}

/** Where a path lands in the current expansion state. */
interface Located {
  /** Expanded nodes from the root down to the path's parent. */
  chain: Node[];
  /** Child index of each path segment within `chain[i]`. */
  indices: number[];
  value: unknown;
  kind: JsonKind;
  /** The node's own record, when it is expanded. */
  node: Node | null;
}

/**
 * Create a tree model over `data`.
 *
 * The model holds a **live reference**; it never clones or mutates the input,
 * and the caller keeps ownership. Changing `data` means creating a new model.
 *
 * @example
 * ```ts
 * const tree = createJsonTree({ users: [{ id: 1 }] }, { defaultExpandDepth: 2 });
 * tree.rowCount();      // 5  →  {  ·  users: [  ·  { 1 key }  ·  ]  ·  }
 * tree.rowAt(2).display;
 * ```
 */
export function createJsonTree(
  data: unknown,
  options: JsonTreeOptions = {},
): JsonTreeModel {
  const maxValueLength = options.maxValueLength ?? 120;
  const sortKeys = options.sortKeys ?? false;
  const defaultExpandDepth = options.defaultExpandDepth ?? 1;
  const maxExpandedRows = options.maxExpandedRows ?? 100_000;
  // 1024 is where `pnpm bench` measures the crossover — see JsonTreeOptions.
  const denseThreshold = options.denseThreshold ?? 1024;

  const rootKind = classify(data);
  let root: Node | null = null;
  /** The root's retired subtree, when the root itself was collapsed. */
  let hiddenRoot: Node | null = null;
  let ver = 0;

  // ── construction ────────────────────────────────────────────────────────

  function makeNode(value: unknown, kind: JsonKind): Node {
    const accessor = childAccessor(value, kind, sortKeys);
    return {
      value,
      kind,
      accessor,
      order: new SparseOrder(accessor.count),
      children: new Map(),
      hidden: new Map(),
      rows: accessor.count + 2,
      keyIndex: null,
    };
  }

  /**
   * Record a child's row count on its parent, promoting the parent's index to
   * dense once enough siblings are expanded (SPEC.md §4.2).
   */
  function setChildRows(parent: Node, child: number, rows: number): void {
    parent.order.set(child, rows);
    if (
      parent.order instanceof SparseOrder &&
      parent.order.expandedCount > denseThreshold
    ) {
      parent.order = toDense(parent.order);
    }
  }

  /** Push a subtree's new row count back up to the root. */
  function propagate(chain: Node[], indices: number[]): void {
    for (let i = chain.length - 1; i >= 0; i--) {
      const parent = chain[i]!;
      const index = indices[i]!;
      const child = parent.children.get(index);
      setChildRows(parent, index, child ? child.rows : 1);
      parent.rows = parent.order.totalRows() + 2;
    }
  }

  // ── kinds and cycles ────────────────────────────────────────────────────

  /**
   * Classify `value`, reporting `"circular"` when it is one of its own
   * ancestors.
   *
   * A cycle is a property of the path, not of the value, so this cannot live
   * in `classify`. The check is `O(depth)` against a chain that is a couple of
   * dozen entries in any realistic document — and without it, `expandAll` on a
   * self-referential object never terminates.
   */
  function kindOf(value: unknown, ancestors: readonly unknown[]): JsonKind {
    const kind = classify(value);
    if (value !== null && typeof value === "object") {
      for (let i = ancestors.length - 1; i >= 0; i--) {
        if (ancestors[i] === value) return "circular";
      }
    }
    return kind;
  }

  // ── path resolution ─────────────────────────────────────────────────────

  /**
   * Child index for one path segment.
   *
   * Arrays, `Map`s and `Set`s are addressed positionally, so the segment *is*
   * the index. Objects need a key → index lookup, which is built once per
   * expanded node and cached: a linear scan would make `rowIndexOf` `O(k)` on
   * a wide object, and search jumps call it on every match.
   */
  function childIndexOf(node: Node, segment: PathSegment): number {
    if (node.kind === "object") {
      if (!node.keyIndex) {
        const map = new Map<string, number>();
        for (let i = 0; i < node.accessor.count; i++) {
          map.set(String(node.accessor.keyAt(i)), i);
        }
        node.keyIndex = map;
      }
      const index = node.keyIndex.get(String(segment));
      return index === undefined ? -1 : index;
    }

    const index = typeof segment === "number" ? segment : Number(segment);
    return Number.isInteger(index) && index >= 0 && index < node.accessor.count
      ? index
      : -1;
  }

  function locate(path: JsonPath): Located | null {
    let value: unknown = data;
    let kind = rootKind;
    let node: Node | null = root;
    const chain: Node[] = [];
    const indices: number[] = [];
    const ancestors: unknown[] = [];

    for (const segment of path) {
      if (!node) return null; // an ancestor is collapsed
      const index = childIndexOf(node, segment);
      if (index < 0) return null;

      chain.push(node);
      indices.push(index);
      ancestors.push(node.value);

      value = node.accessor.valueAt(index);
      kind = kindOf(value, ancestors);
      node = node.children.get(index) ?? null;
    }

    return { chain, indices, value, kind, node };
  }

  // ── reads ───────────────────────────────────────────────────────────────

  function rowCount(): number {
    return root ? root.rows : 1;
  }

  function makeRow(
    index: number,
    path: PathSegment[],
    key: PathSegment | undefined,
    label: string,
    value: unknown,
    kind: JsonKind,
    depth: number,
    node: Node | null,
    closing: boolean,
    posInSet: number,
    setSize: number,
  ): JsonRow {
    const container = isContainerKind(kind);
    const childCount = node ? node.accessor.count : container ? childCountOf(value, kind) : 0;

    if (closing) {
      return {
        index,
        path,
        key,
        label,
        kind,
        depth,
        closing: true,
        expandable: false,
        expanded: true,
        childCount,
        posInSet,
        setSize,
        display: bracketsOf(kind)[1],
        truncated: false,
        value,
      };
    }

    let display: string;
    let truncated = false;
    if (container) {
      display = node
        ? bracketsOf(kind)[0]
        : previewOf(value, kind, childCount);
    } else {
      const rendered = displayOf(value, kind, maxValueLength);
      display = rendered.text;
      truncated = rendered.truncated;
    }

    return {
      index,
      path,
      key,
      label,
      kind,
      depth,
      closing: false,
      expandable: container && childCount > 0,
      expanded: node !== null,
      childCount,
      posInSet,
      setSize,
      display,
      truncated,
      value,
    };
  }

  function rowAt(index: number): JsonRow {
    const total = rowCount();
    if (!Number.isInteger(index) || index < 0 || index >= total) {
      throw new RangeError(
        `json-viewer: row ${index} is out of range (0…${total - 1})`,
      );
    }

    const path: PathSegment[] = [];
    const ancestors: unknown[] = [];
    let value: unknown = data;
    let kind = rootKind;
    let key: PathSegment | undefined;
    let label = "";
    let node: Node | null = root;
    let depth = 0;
    let local = index;
    // The root is an only child of nothing; 1 of 1 is the honest answer.
    let posInSet = 1;
    let setSize = 1;

    // Descend the expanded spine. Each iteration consumes one level.
    for (;;) {
      if (!node) {
        return makeRow(index, path, key, label, value, kind, depth, null, false, posInSet, setSize);
      }
      if (local === 0) {
        return makeRow(index, path, key, label, value, kind, depth, node, false, posInSet, setSize);
      }
      if (local === node.rows - 1) {
        return makeRow(index, path, key, label, value, kind, depth, node, true, posInSet, setSize);
      }

      const { child, offset } = node.order.locate(local - 1);
      ancestors.push(node.value);
      key = node.accessor.keyAt(child);
      label = node.accessor.labelAt(child);
      path.push(key);
      value = node.accessor.valueAt(child);
      kind = kindOf(value, ancestors);
      posInSet = child + 1;
      setSize = node.accessor.count;
      node = node.children.get(child) ?? null;
      depth++;
      local = offset;
    }
  }

  function rowIndexOf(path: JsonPath): number {
    if (path.length === 0) return 0;
    const found = locate(path);
    if (!found) return -1;

    let row = 0;
    for (let i = 0; i < found.chain.length; i++) {
      row += 1 + found.chain[i]!.order.rowStartOf(found.indices[i]!);
    }
    return row;
  }

  // ── mutations ───────────────────────────────────────────────────────────

  function expand(path: JsonPath): ExpandResult {
    const found = locate(path);
    if (!found) return { delta: 0, anchorRow: -1, refused: { reason: "unreachable" } };

    const anchorRow = rowIndexOf(path);
    if (found.node) return { delta: 0, anchorRow };

    if (!isContainerKind(found.kind) || childCountOf(found.value, found.kind) === 0) {
      return { delta: 0, anchorRow, refused: { reason: "not-expandable" } };
    }

    const before = rowCount();

    if (found.chain.length === 0) {
      // Restore what was inside before, if this node was collapsed rather
      // than never opened.
      root = hiddenRoot && hiddenRoot.value === found.value
        ? hiddenRoot
        : makeNode(found.value, found.kind);
      hiddenRoot = null;
    } else {
      const parent = found.chain[found.chain.length - 1]!;
      const index = found.indices[found.indices.length - 1]!;
      const remembered = parent.hidden.get(index);
      const node =
        remembered && remembered.value === found.value
          ? remembered
          : makeNode(found.value, found.kind);
      parent.hidden.delete(index);
      parent.children.set(index, node);
      propagate(found.chain, found.indices);
    }

    ver++;
    return { delta: rowCount() - before, anchorRow };
  }

  function collapse(path: JsonPath): ExpandResult {
    const found = locate(path);
    if (!found) return { delta: 0, anchorRow: -1, refused: { reason: "unreachable" } };

    const anchorRow = rowIndexOf(path);
    if (!found.node) return { delta: 0, anchorRow };

    const before = rowCount();
    if (found.chain.length === 0) {
      hiddenRoot = root;
      root = null;
    } else {
      const parent = found.chain[found.chain.length - 1]!;
      const index = found.indices[found.indices.length - 1]!;
      parent.hidden.set(index, found.node);
      parent.children.delete(index);
      propagate(found.chain, found.indices);
    }

    ver++;
    return { delta: rowCount() - before, anchorRow };
  }

  function toggle(path: JsonPath): ExpandResult {
    const found = locate(path);
    if (!found) return { delta: 0, anchorRow: -1, refused: { reason: "unreachable" } };
    return found.node ? collapse(path) : expand(path);
  }

  function expandTo(path: JsonPath): ExpandResult {
    const before = rowCount();
    let anchorRow = -1;

    for (let i = 0; i < path.length; i++) {
      const prefix = path.slice(0, i);
      const result = expand(prefix);
      if (result.refused) {
        // A refusal on a proper ancestor means the path is unreachable; a
        // refusal on a leaf ancestor should not happen, but reporting it beats
        // silently expanding half the chain.
        if (result.refused.reason === "unreachable") {
          return { delta: rowCount() - before, anchorRow, refused: result.refused };
        }
      }
      if (anchorRow < 0 && result.delta !== 0) anchorRow = result.anchorRow;
    }

    return { delta: rowCount() - before, anchorRow: anchorRow < 0 ? 0 : anchorRow };
  }

  // ── bulk expansion ──────────────────────────────────────────────────────

  interface Budget {
    rows: number;
    limit: number;
    exceeded: boolean;
    /** True when {@link MAX_BULK_DEPTH} stopped the walk before `maxDepth` did. */
    depthCapped: boolean;
    /**
     * True when this pass's `maxDepth` — not the budget — left an expandable
     * container closed. It is what tells the iterative deepening that another
     * level is worth trying.
     */
    depthBlocked: boolean;
  }

  /**
   * Build a whole expanded subtree in one pass.
   *
   * Bulk expansion must never go through repeated {@link expand}: each call
   * re-walks the spine and each `SparseOrder.set` is an `O(e)` splice, so
   * expanding 100 000 siblings one at a time is quadratic. Here every
   * container's index is constructed once, from the finished child list.
   *
   * Two rules keep the row budget from doing harm:
   *
   *  - **Anything in `keep` is rebuilt regardless of the budget.** A bulk
   *    expansion adds; it must never *remove* what the user already opened.
   *    Without this, "expand all" on a document that is already past the
   *    budget would collapse the whole tree back to the root.
   *  - **Depth 0 is free.** Opening the root is one container, exactly like
   *    the click that opens any other container — and a single expansion has
   *    never been budgeted (SPEC §4.6: the ceiling is `expandAll`'s). Charging
   *    it here meant `createJsonTree(arrayOfTwoHundredThousand)` rendered a
   *    single collapsed row and said nothing about why.
   */
  function build(
    value: unknown,
    kind: JsonKind,
    depth: number,
    maxDepth: number,
    ancestors: unknown[],
    budget: Budget,
    keep: Node | null,
  ): Node | null {
    const keeping = keep !== null && keep.value === value;
    if (depth >= MAX_BULK_DEPTH) {
      // Report it only when there was something down there to expand — a cap
      // that stops at a leaf has not truncated anything.
      if (isContainerKind(kind) && childCountOf(value, kind) > 0) {
        budget.depthCapped = true;
      }
      return null;
    }
    if (!keeping && depth >= maxDepth) {
      if (isContainerKind(kind) && childCountOf(value, kind) > 0) {
        budget.depthBlocked = true;
      }
      return null;
    }
    if (!isContainerKind(kind)) return null;

    const accessor = childAccessor(value, kind, sortKeys);
    if (accessor.count === 0) return null;

    // Children plus the closing row. Checked before any of them is built, so
    // the budget can never be blown by a single wide container.
    const cost = accessor.count + 1;
    if (!keeping && depth > 0 && budget.rows + cost > budget.limit) {
      budget.exceeded = true;
      return null;
    }
    budget.rows += cost;

    const children = new Map<number, Node>();
    const pairs: [number, number][] = [];
    ancestors.push(value);
    for (let i = 0; i < accessor.count; i++) {
      const childValue = accessor.valueAt(i);
      const childKind = kindOf(childValue, ancestors);
      const child = build(
        childValue,
        childKind,
        depth + 1,
        maxDepth,
        ancestors,
        budget,
        keep?.children.get(i) ?? null,
      );
      if (child) {
        children.set(i, child);
        pairs.push([i, child.rows]);
      }
    }
    ancestors.pop();

    let order: OrderIndex;
    if (pairs.length > denseThreshold) {
      order = new DenseOrder(accessor.count, pairs);
    } else {
      const sparse = new SparseOrder(accessor.count);
      sparse.bulk(pairs);
      order = sparse;
    }

    return {
      value,
      kind,
      accessor,
      order,
      children,
      // Retired subtrees do not survive a bulk rebuild; the operation is an
      // explicit, whole-tree state change.
      hidden: new Map(),
      rows: order.totalRows() + 2,
      keyIndex: null,
    };
  }

  /**
   * Expand as deeply as the row budget allows, and say so when it stops.
   *
   * **Iterative deepening**, not one greedy pass: "the deepest level that
   * fits" (SPEC §4.6) means every node at depth *d* is open before any node at
   * depth *d + 1* is considered. A single greedy DFS instead expands whatever
   * it meets first in document order and abandons the rest of the document
   * once the budget runs out, which is arbitrary rather than deep.
   *
   * Each pass unions with the current spine, so the row count can only go up.
   */
  function expandAll(maxDepth = Number.POSITIVE_INFINITY): ExpandResult {
    const before = rowCount();
    const cap = Math.min(
      Number.isFinite(maxDepth) ? maxDepth : MAX_BULK_DEPTH,
      MAX_BULK_DEPTH,
    );

    let committed = root;
    let refused: ExpandResult["refused"];

    for (let depth = 1; depth <= cap; depth++) {
      const budget: Budget = {
        rows: 1,
        limit: maxExpandedRows,
        exceeded: false,
        depthCapped: false,
        depthBlocked: false,
      };
      const candidate = build(data, rootKind, 0, depth, [], budget, root);

      if (budget.exceeded) {
        refused = { reason: "row-budget", budget: maxExpandedRows };
        break;
      }
      if (budget.depthCapped) {
        refused = { reason: "depth-cap", budget: MAX_BULK_DEPTH };
      }

      committed = candidate;
      // Stop on "nothing was held back by the depth limit", not on "the row
      // count did not grow": a subtree the user had already opened is kept
      // regardless of depth, so an early pass can reproduce the current row
      // count exactly while there is still plenty below it to find.
      if (!budget.depthBlocked) break;
    }

    root = committed;
    hiddenRoot = null;
    ver++;

    const result: ExpandResult = { delta: rowCount() - before, anchorRow: 0 };
    if (refused) result.refused = refused;
    return result;
  }

  /**
   * Collapse everything **and forget what was open**.
   *
   * Unlike collapsing one node, this is a reset: keeping the retired subtrees
   * would mean re-opening the root silently restores the whole previous state,
   * which is not what anybody pressing "collapse all" is asking for.
   */
  function collapseAll(): ExpandResult {
    const before = rowCount();
    root = null;
    hiddenRoot = null;
    ver++;
    return { delta: rowCount() - before, anchorRow: 0 };
  }

  // ── expansion state as strings ──────────────────────────────────────────

  /**
   * The expanded set as **JSON Pointers** (RFC 6901).
   *
   * Pointers rather than the `pathFormat` used for copying: they are
   * unambiguous, cheap to parse, and a segment's array-index-vs-object-key
   * meaning is recovered from the container it lands in, so the round trip is
   * exact.
   *
   * Only the *live* spine is reported. Subtrees that were expanded and then
   * collapsed are remembered internally (see `Node.hidden`) but are not part of
   * the expansion state a consumer controls or persists.
   */
  function getExpandedPaths(): string[] {
    const out: string[] = [];
    if (!root) return out;

    const stack: { node: Node; path: PathSegment[] }[] = [{ node: root, path: [] }];
    while (stack.length) {
      const { node, path } = stack.pop()!;
      out.push(pathToPointer(path));
      for (const [index, child] of node.children) {
        stack.push({ node: child, path: [...path, node.accessor.keyAt(index)] });
      }
    }
    return out.sort();
  }

  /** A prefix tree of the pointers to restore. */
  interface Trie {
    children: Map<string, Trie>;
  }

  function setExpandedPaths(paths: readonly string[]): ExpandResult {
    const before = rowCount();
    const trie: Trie = { children: new Map() };
    let wantsRoot = false;

    for (const pointer of paths) {
      const segments = pointerToSegments(pointer);
      if (segments.length === 0) {
        wantsRoot = true;
        continue;
      }
      wantsRoot = true;
      let cursor = trie;
      for (const segment of segments) {
        let next = cursor.children.get(segment);
        if (!next) {
          next = { children: new Map() };
          cursor.children.set(segment, next);
        }
        cursor = next;
      }
    }

    root = wantsRoot ? buildFromTrie(data, rootKind, trie, 0, []) : null;
    hiddenRoot = null;
    ver++;
    return { delta: rowCount() - before, anchorRow: 0 };
  }

  function buildFromTrie(
    value: unknown,
    kind: JsonKind,
    trie: Trie,
    depth: number,
    ancestors: unknown[],
  ): Node | null {
    if (depth >= MAX_BULK_DEPTH) return null;
    if (!isContainerKind(kind)) return null;

    const accessor = childAccessor(value, kind, sortKeys);
    if (accessor.count === 0) return null;

    const node: Node = {
      value,
      kind,
      accessor,
      order: new SparseOrder(accessor.count),
      children: new Map(),
      hidden: new Map(),
      rows: accessor.count + 2,
      keyIndex: null,
    };

    const pairs: [number, number][] = [];
    ancestors.push(value);
    for (const [segment, sub] of trie.children) {
      const index = childIndexOf(node, segment);
      if (index < 0) continue; // the data changed under a stale pointer
      const childValue = accessor.valueAt(index);
      const childKind = kindOf(childValue, ancestors);
      const child = buildFromTrie(childValue, childKind, sub, depth + 1, ancestors);
      if (child) {
        node.children.set(index, child);
        pairs.push([index, child.rows]);
      }
    }
    ancestors.pop();

    if (pairs.length > denseThreshold) {
      node.order = new DenseOrder(accessor.count, pairs);
    } else {
      const sparse = new SparseOrder(accessor.count);
      sparse.bulk(pairs);
      node.order = sparse;
    }
    node.rows = node.order.totalRows() + 2;
    return node;
  }

  // ── initial state ───────────────────────────────────────────────────────

  if (defaultExpandDepth > 0) {
    const budget: Budget = {
      rows: 1,
      limit: maxExpandedRows,
      exceeded: false,
      depthCapped: false,
      depthBlocked: false,
    };
    root = build(data, rootKind, 0, defaultExpandDepth, [], budget, null);
  }

  return {
    data,
    rowCount,
    rowAt,
    rowIndexOf,
    isExpanded(path) {
      const found = locate(path);
      return found?.node != null;
    },
    isExpandable(path) {
      const found = locate(path);
      if (!found) return false;
      return (
        isContainerKind(found.kind) && childCountOf(found.value, found.kind) > 0
      );
    },
    toggle,
    expand,
    collapse,
    expandTo,
    expandAll,
    collapseAll,
    getExpandedPaths,
    setExpandedPaths,
    version: () => ver,
  };
}

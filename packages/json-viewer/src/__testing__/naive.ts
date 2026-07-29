/**
 * The reference model — the internal oracle (SPEC.md §4.2, §7).
 *
 * It does the obvious, unusable thing: flatten the entire tree into an array
 * for a given expansion state. That is precisely what the real engine refuses
 * to do, which is what makes this a useful check — the two implementations
 * share no code and agree only if the index arithmetic is right.
 *
 * Test-only. Never exported from the package.
 */

import {
  bracketsOf,
  childAccessor,
  childCountOf,
  classify,
  displayOf,
  isContainerKind,
  previewOf,
} from "../model/value";
import { pathToPointer } from "../model/path";
import type { JsonKind, PathSegment } from "../types";

/** The subset of a row that both implementations must agree on exactly. */
export interface NaiveRow {
  path: PathSegment[];
  key: PathSegment | undefined;
  label: string;
  kind: JsonKind;
  depth: number;
  closing: boolean;
  expanded: boolean;
  expandable: boolean;
  childCount: number;
  posInSet: number;
  setSize: number;
  display: string;
}

export interface NaiveOptions {
  maxValueLength?: number;
  sortKeys?: boolean;
}

/**
 * Flatten `data` into the row list implied by `expanded`.
 *
 * @param expanded RFC 6901 pointers of the containers that are open.
 *
 * @example
 * ```ts
 * naiveRows({ a: [1, 2] }, new Set(["", "/a"]));
 * // {  ·  a: [  ·  1  ·  2  ·  ]  ·  }   →  6 rows
 * ```
 */
export function naiveRows(
  data: unknown,
  expanded: ReadonlySet<string>,
  options: NaiveOptions = {},
): NaiveRow[] {
  const maxValueLength = options.maxValueLength ?? 120;
  const sortKeys = options.sortKeys ?? false;
  const rows: NaiveRow[] = [];

  function kindOf(value: unknown, ancestors: readonly unknown[]): JsonKind {
    const kind = classify(value);
    if (value !== null && typeof value === "object" && ancestors.includes(value)) {
      return "circular";
    }
    return kind;
  }

  function walk(
    value: unknown,
    key: PathSegment | undefined,
    label: string,
    path: PathSegment[],
    depth: number,
    ancestors: unknown[],
    posInSet: number,
    setSize: number,
  ): void {
    const kind = kindOf(value, ancestors);
    const container = isContainerKind(kind);
    const childCount = container ? childCountOf(value, kind) : 0;
    const isOpen = container && childCount > 0 && expanded.has(pathToPointer(path));

    rows.push({
      path: path.slice(),
      key,
      label,
      kind,
      depth,
      closing: false,
      expanded: isOpen,
      expandable: container && childCount > 0,
      childCount,
      posInSet,
      setSize,
      display: isOpen
        ? bracketsOf(kind)[0]
        : container
          ? previewOf(value, kind, childCount)
          : displayOf(value, kind, maxValueLength).text,
    });

    if (!isOpen) return;

    const accessor = childAccessor(value, kind, sortKeys);
    ancestors.push(value);
    for (let i = 0; i < accessor.count; i++) {
      const childKey = accessor.keyAt(i);
      path.push(childKey);
      walk(
        accessor.valueAt(i),
        childKey,
        accessor.labelAt(i),
        path,
        depth + 1,
        ancestors,
        i + 1,
        accessor.count,
      );
      path.pop();
    }
    ancestors.pop();

    rows.push({
      path: path.slice(),
      key,
      label,
      kind,
      depth,
      closing: true,
      expanded: true,
      expandable: false,
      childCount,
      posInSet,
      setSize,
      display: bracketsOf(kind)[1],
    });
  }

  walk(data, undefined, "", [], 0, [], 1, 1);
  return rows;
}

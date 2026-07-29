/**
 * `@usefy/json-viewer/headless` — the engine with no React and no DOM.
 *
 * This entry carries **no `"use client"` banner** (SPEC.md decision #1): the
 * tree model, the path formatters and the search scan are pure TypeScript and
 * are meant to be importable from a React Server Component, a Node script, or
 * a worker. `src/build.test.ts` asserts the built output stays that way.
 */

export { createJsonTree } from "./model/tree";
export {
  classify,
  isContainerKind,
  childAccessor,
  childCountOf,
  keysOf,
  previewOf,
  displayOf,
  bracketsOf,
  ThrownValue,
  type ChildAccessor,
  type Display,
} from "./model/value";
export {
  SparseOrder,
  DenseOrder,
  toDense,
  type OrderIndex,
  type Located,
} from "./model/order";
export {
  formatPath,
  parsePath,
  pathToAccessor,
  pathToPointer,
  pathToJsonPath,
  pointerToSegments,
  resolvePath,
} from "./model/path";
export {
  serializeSubtree,
  type SerializeOptions,
  type SerializeResult,
} from "./model/serialize";
export { searchJson } from "./search/scan";
export { scheduleYield, now } from "./search/scheduler";

export type {
  JsonKind,
  JsonPath,
  PathSegment,
  PathFormat,
  JsonRow,
  JsonTreeOptions,
  JsonTreeModel,
  ExpandResult,
  ExpandRefusal,
  JsonSearchOptions,
  JsonSearchProgress,
  JsonSearchResult,
} from "./types";

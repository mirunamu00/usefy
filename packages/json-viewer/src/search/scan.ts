/**
 * Chunked, cancelable search over the whole value (SPEC.md §4.4).
 *
 * Three properties that together are the point of this module:
 *
 *  1. **It searches the whole document**, not the visible rows — a match
 *     inside a collapsed subtree is exactly the one you were looking for.
 *  2. **It never holds the main thread.** Work is done in slices of
 *     `budgetMs`, with a real yield between them.
 *  3. **It uses an explicit stack.** A 4.5 M-node document would overflow the
 *     call stack, and a recursive walk cannot be suspended and resumed across
 *     slices anyway.
 */

import {
  childAccessor,
  classify,
  isContainerKind,
  type ChildAccessor,
} from "../model/value";
import { now, scheduleYield } from "./scheduler";
import type {
  JsonKind,
  JsonPath,
  JsonSearchOptions,
  JsonSearchProgress,
  JsonSearchResult,
  PathSegment,
} from "../types";

/** How often the elapsed-time check runs. Checking every node costs more than it saves. */
const CLOCK_INTERVAL = 512;

interface Frame {
  value: unknown;
  kind: JsonKind;
  accessor: ChildAccessor;
  /** Next child to visit. */
  cursor: number;
  /** True when this container's child labels are content (object keys, Map keys). */
  labelsAreKeys: boolean;
}

/** Build the predicate once; a regex compiled per node would dominate the scan. */
function buildMatcher(options: JsonSearchOptions): (text: string) => boolean {
  const { query, caseSensitive = false, regex = false } = options;

  if (regex) {
    const compiled = new RegExp(query, caseSensitive ? "" : "i");
    return (text) => {
      compiled.lastIndex = 0;
      return compiled.test(text);
    };
  }

  if (caseSensitive) {
    return (text) => text.includes(query);
  }
  const needle = query.toLowerCase();
  return (text) => text.toLowerCase().includes(needle);
}

/**
 * The searchable text of a leaf.
 *
 * Containers return `null`: their preview (`{ 3 keys }`) is our rendering, not
 * the user's data, and matching it would produce hits nobody typed.
 */
function contentOf(value: unknown, kind: JsonKind): string | null {
  switch (kind) {
    case "string":
      return value as string;
    case "number":
    case "boolean":
    case "bigint":
      return String(value);
    case "null":
      return "null";
    case "undefined":
      return "undefined";
    case "date": {
      const time = (value as Date).getTime();
      return Number.isNaN(time) ? "Invalid Date" : (value as Date).toISOString();
    }
    default:
      return null;
  }
}

/**
 * Search `data`, yielding to the browser between slices.
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 * const { paths, capped } = await searchJson(
 *   data,
 *   { query: "error", signal: controller.signal },
 *   (p) => setProgress(p),
 * );
 * ```
 */
export async function searchJson(
  data: unknown,
  options: JsonSearchOptions,
  onProgress?: (progress: JsonSearchProgress) => void,
): Promise<JsonSearchResult> {
  const {
    matchKeys = true,
    matchValues = true,
    maxResults = 10_000,
    budgetMs = 8,
    signal,
  } = options;

  const paths: JsonPath[] = [];
  if (options.query === "") {
    onProgress?.({ scanned: 0, matches: 0, done: true, capped: false });
    return { paths, capped: false, aborted: false };
  }

  const matches = buildMatcher(options);
  const rootKind = classify(data);

  // The frame stack and the path stack move together: pushing a frame always
  // follows pushing that child's segment, so the current path is simply the
  // path stack — no per-node path allocation anywhere in the hot loop.
  const frames: Frame[] = [];
  const pathStack: PathSegment[] = [];

  let scanned = 0;
  let capped = false;
  let aborted = false;
  let sliceStart = now();

  const report = (done: boolean) =>
    onProgress?.({ scanned, matches: paths.length, done, capped });

  if (isContainerKind(rootKind)) {
    frames.push(makeFrame(data, rootKind));
  } else {
    scanned = 1;
    const content = contentOf(data, rootKind);
    if (matchValues && content !== null && matches(content)) paths.push([]);
  }

  while (frames.length > 0) {
    if (signal?.aborted) {
      aborted = true;
      break;
    }

    const frame = frames[frames.length - 1]!;

    if (frame.cursor >= frame.accessor.count) {
      frames.pop();
      if (frames.length > 0) pathStack.pop();
      continue;
    }

    const index = frame.cursor++;
    const segment = frame.accessor.keyAt(index);
    const childValue = frame.accessor.valueAt(index);
    const childKind = kindOf(childValue, frames);

    scanned++;
    pathStack.push(segment);

    let hit = false;
    if (matchKeys && frame.labelsAreKeys && matches(frame.accessor.labelAt(index))) {
      hit = true;
    }
    if (!hit && matchValues) {
      const content = contentOf(childValue, childKind);
      if (content !== null && matches(content)) hit = true;
    }
    if (hit) {
      if (paths.length >= maxResults) {
        // Only now is the answer genuinely incomplete. Setting `capped` on the
        // match that *reaches* the limit would report "first 10 000 only" for a
        // document that has exactly 10 000 matches and no more.
        capped = true;
        pathStack.pop();
        break;
      }
      paths.push(pathStack.slice());
    }

    if (childKind !== "circular" && isContainerKind(childKind)) {
      const child = makeFrame(childValue, childKind);
      if (child.accessor.count > 0) {
        frames.push(child);
      } else {
        pathStack.pop();
      }
    } else {
      pathStack.pop();
    }

    if (scanned % CLOCK_INTERVAL === 0 && now() - sliceStart >= budgetMs) {
      report(false);
      await scheduleYield();
      if (signal?.aborted) {
        aborted = true;
        break;
      }
      sliceStart = now();
    }
  }

  report(true);
  return { paths, capped, aborted };
}

function makeFrame(value: unknown, kind: JsonKind): Frame {
  return {
    value,
    kind,
    accessor: childAccessor(value, kind),
    cursor: 0,
    // Array indices and Set positions are our addressing, not the user's
    // content — matching them would make every search for "1" return the
    // entire document.
    labelsAreKeys: kind === "object" || kind === "map",
  };
}

/** Classify, reporting a cycle so the walk terminates on self-referential data. */
function kindOf(value: unknown, frames: readonly Frame[]): JsonKind {
  const kind = classify(value);
  if (value !== null && typeof value === "object") {
    for (let i = frames.length - 1; i >= 0; i--) {
      if (frames[i]!.value === value) return "circular";
    }
  }
  return kind;
}

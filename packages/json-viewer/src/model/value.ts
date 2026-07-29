/**
 * The value model (SPEC.md §3.1, §4.1).
 *
 * Three jobs, all of them read-only against the consumer's data:
 *
 *  1. **Classify** a value into a {@link JsonKind}.
 *  2. **Access children by index** without materialising a child array for
 *     anything the user has not expanded. This is what lets a collapsed
 *     1 M-element array cost exactly one row.
 *  3. **Render** a leaf, or a collapsed container's preview, as text.
 *
 * Nothing here is React-aware and nothing here mutates the input.
 */

import type { JsonKind, PathSegment } from "../types";

/**
 * Wrapper for a property access that threw.
 *
 * A getter or `Proxy` trap on the consumer's data is allowed to throw, and one
 * hostile key must not take down the whole tree — so the throw is caught at the
 * accessor boundary and rendered as its own row (SPEC.md §9).
 */
export class ThrownValue {
  constructor(readonly error: unknown) {}
}

/**
 * Objects with at least this many keys get their key list cached in a
 * `WeakMap`.
 *
 * A *collapsed* object still needs its key count for the `{ 3 keys }` preview,
 * and `Object.keys` is O(k) — so scrolling past a row backed by a huge object
 * would re-pay that cost every frame. Caching fixes it, but caching every
 * two-key object in a 4.5 M-node tree would retain more than it saves. The
 * threshold keeps the cache proportional to the objects that actually hurt.
 */
const KEY_CACHE_MIN = 32;

const keyCache = new WeakMap<object, string[]>();
const sortedKeyCache = new WeakMap<object, string[]>();

/** Cheap own-enumerable key list, cached for objects big enough to matter. */
export function keysOf(value: object, sortKeys = false): string[] {
  const cache = sortKeys ? sortedKeyCache : keyCache;
  const cached = cache.get(value);
  if (cached) return cached;

  let keys: string[];
  try {
    keys = Object.keys(value);
  } catch {
    // A Proxy may throw from ownKeys.
    return [];
  }
  if (sortKeys) keys = keys.slice().sort();

  if (keys.length >= KEY_CACHE_MIN) cache.set(value, keys);
  return keys;
}

/**
 * Classify a value.
 *
 * `"circular"` is never returned from here — a cycle is a property of the
 * *path*, not of the value, so the tree walk detects it during descent
 * (SPEC.md §3.1) and overrides the kind.
 */
export function classify(value: unknown): JsonKind {
  if (value === null) return "null";

  switch (typeof value) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    case "function":
      return "function";
  }

  if (value instanceof ThrownValue) return "unknown";
  if (Array.isArray(value)) return "array";
  if (value instanceof Date) return "date";
  if (value instanceof Map) return "map";
  if (value instanceof Set) return "set";
  if (typeof value === "object") {
    // Boxed primitives, RegExp, Error, typed arrays, class instances… all
    // render usefully as objects; anything without a prototype does too.
    return "object";
  }
  return "unknown";
}

/** True for kinds whose rows can be expanded to reveal children. */
export function isContainerKind(kind: JsonKind): boolean {
  return (
    kind === "object" || kind === "array" || kind === "map" || kind === "set"
  );
}

/**
 * Indexed access to a container's children.
 *
 * `keyAt` returns the **path segment** and `labelAt` the text shown in the
 * row; they differ for `Map` and `Set`, whose children are addressed
 * positionally because their keys need not be strings.
 */
export interface ChildAccessor {
  readonly count: number;
  keyAt(index: number): PathSegment;
  labelAt(index: number): string;
  valueAt(index: number): unknown;
}

const EMPTY_ACCESSOR: ChildAccessor = {
  count: 0,
  keyAt: () => 0,
  labelAt: () => "",
  valueAt: () => undefined,
};

/**
 * Build an accessor for a container.
 *
 * Arrays are O(1) and allocate nothing. Objects pay one (cached) `Object.keys`.
 * `Map`/`Set` must materialise their entries — there is no indexed access to an
 * iterator — which is why that cost is only paid when the node is expanded.
 *
 * @example
 * ```ts
 * const acc = childAccessor({ a: 1, b: 2 }, "object");
 * acc.count;        // 2
 * acc.keyAt(1);     // "b"
 * acc.valueAt(1);   // 2
 * ```
 */
export function childAccessor(
  value: unknown,
  kind: JsonKind,
  sortKeys = false,
): ChildAccessor {
  switch (kind) {
    case "array": {
      const array = value as unknown[];
      return {
        count: array.length,
        keyAt: (i) => i,
        labelAt: (i) => String(i),
        valueAt: (i) => read(() => array[i]),
      };
    }
    case "object": {
      const object = value as Record<string, unknown>;
      const keys = keysOf(object, sortKeys);
      return {
        count: keys.length,
        keyAt: (i) => keys[i]!,
        labelAt: (i) => keys[i]!,
        valueAt: (i) => read(() => object[keys[i]!]),
      };
    }
    case "map": {
      const entries = Array.from((value as Map<unknown, unknown>).entries());
      return {
        count: entries.length,
        keyAt: (i) => i,
        labelAt: (i) => shortLabel(entries[i]![0]),
        valueAt: (i) => entries[i]![1],
      };
    }
    case "set": {
      const items = Array.from((value as Set<unknown>).values());
      return {
        count: items.length,
        keyAt: (i) => i,
        labelAt: (i) => String(i),
        valueAt: (i) => items[i],
      };
    }
    default:
      return EMPTY_ACCESSOR;
  }
}

/** Run a property read, turning a throwing getter into a renderable value. */
function read(get: () => unknown): unknown {
  try {
    return get();
  } catch (error) {
    return new ThrownValue(error);
  }
}

/**
 * Child count without building an accessor.
 *
 * Used for the collapsed preview, which is rendered far more often than any
 * node is expanded — so arrays, `Map`s and `Set`s answer in O(1) and only
 * plain objects touch the (cached) key list.
 */
export function childCountOf(value: unknown, kind: JsonKind): number {
  switch (kind) {
    case "array":
      return (value as unknown[]).length;
    case "object":
      return keysOf(value as object).length;
    case "map":
      return (value as Map<unknown, unknown>).size;
    case "set":
      return (value as Set<unknown>).size;
    default:
      return 0;
  }
}

/** A one-line label for a `Map` key, kept short enough for a row. */
function shortLabel(key: unknown): string {
  const kind = classify(key);
  if (kind === "string") return key as string;
  if (isContainerKind(kind)) return previewOf(key, kind, childCountOf(key, kind));
  return displayOf(key, kind, 32).text;
}

/** The result of rendering a value as row text. */
export interface Display {
  text: string;
  /** True when the value was cut at `maxLength`. */
  truncated: boolean;
}

/**
 * Render a leaf value as the text shown in its row.
 *
 * Strings are sliced **before** they are quoted, so a 10 MB string never
 * produces a second 10 MB string just to be thrown away.
 *
 * @example
 * ```ts
 * displayOf("hello", "string", 120);   // { text: '"hello"', truncated: false }
 * displayOf(12n, "bigint", 120);       // { text: "12n", truncated: false }
 * ```
 */
export function displayOf(
  value: unknown,
  kind: JsonKind,
  maxLength: number,
): Display {
  switch (kind) {
    case "string": {
      const raw = value as string;
      const truncated = raw.length > maxLength;
      const slice = truncated ? raw.slice(0, maxLength) : raw;
      const quoted = JSON.stringify(slice) ?? '""';
      return {
        text: truncated ? `${quoted.slice(0, -1)}…"` : quoted,
        truncated,
      };
    }
    case "number":
      // -0 is a real distinction in a debugger and `String(-0)` hides it.
      return { text: Object.is(value, -0) ? "-0" : String(value), truncated: false };
    case "bigint":
      return { text: `${String(value)}n`, truncated: false };
    case "boolean":
      return { text: String(value), truncated: false };
    case "null":
      return { text: "null", truncated: false };
    case "undefined":
      return { text: "undefined", truncated: false };
    case "date": {
      const date = value as Date;
      const time = date.getTime();
      return {
        text: Number.isNaN(time) ? "Invalid Date" : date.toISOString(),
        truncated: false,
      };
    }
    case "function": {
      const name = (value as { name?: string }).name;
      return { text: name ? `function ${name}()` : "function ()", truncated: false };
    }
    case "symbol":
      return { text: String(value), truncated: false };
    case "circular":
      return { text: "[Circular]", truncated: false };
    case "unknown": {
      if (value instanceof ThrownValue) {
        const message =
          value.error instanceof Error ? value.error.message : String(value.error);
        return { text: `[Threw: ${clip(message, maxLength)}]`, truncated: false };
      }
      return { text: clip(String(value), maxLength), truncated: false };
    }
    default:
      return { text: "", truncated: false };
  }
}

/**
 * The collapsed summary of a container.
 *
 * @example
 * ```ts
 * previewOf({ a: 1 }, "object", 1);   // "{ 1 key }"
 * previewOf([], "array", 0);          // "[]"
 * ```
 */
export function previewOf(
  value: unknown,
  kind: JsonKind,
  count: number,
): string {
  switch (kind) {
    case "object": {
      if (count === 0) return "{}";
      const name = constructorName(value);
      const body = `{ ${count} ${count === 1 ? "key" : "keys"} }`;
      return name ? `${name} ${body}` : body;
    }
    case "array":
      return count === 0 ? "[]" : `[ ${count} ${count === 1 ? "item" : "items"} ]`;
    case "map":
      return `Map(${count})`;
    case "set":
      return `Set(${count})`;
    default:
      return "";
  }
}

/** The bracket pair a container renders around its children. */
export function bracketsOf(kind: JsonKind): readonly [string, string] {
  switch (kind) {
    case "array":
      return ["[", "]"];
    case "set":
      return ["Set {", "}"];
    case "map":
      return ["Map {", "}"];
    default:
      return ["{", "}"];
  }
}

/**
 * A class name worth showing, or `""` for a plain object.
 *
 * `{ 3 keys }` and `Error { 3 keys }` are very different things to find in a
 * payload, and every incumbent renders both as `{...}`.
 */
function constructorName(value: unknown): string {
  const proto = Object.getPrototypeOf(value as object);
  if (proto === null) return "[Object: null prototype]";
  if (proto === Object.prototype) return "";
  const name = proto?.constructor?.name;
  return typeof name === "string" && name && name !== "Object" ? name : "";
}

function clip(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

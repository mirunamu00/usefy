/**
 * Re-serialize a subtree for "copy value" (SPEC.md §4.5, §4.6).
 *
 * `JSON.stringify` alone is not enough for a debugger: it throws on `BigInt`
 * and on cycles, drops `undefined` and functions, and turns a `Map` into `{}`
 * — which is exactly the information someone copying a value out of a state
 * dump needs to see.
 */

/** Options for {@link serializeSubtree}. */
export interface SerializeOptions {
  /** Spaces per level; `0` produces a single line. @defaultValue 2 */
  indent?: number;
  /**
   * Refuse past roughly this many bytes of output.
   *
   * "Roughly": the final length check counts UTF-16 code units, so a document
   * that is mostly non-ASCII is allowed up to about three times this many
   * actual bytes. It is a guard against building a string that would crash the
   * tab, not an exact accounting.
   * @defaultValue 33_554_432 (32 MB)
   */
  maxBytes?: number;
}

/** The outcome of a serialization attempt. */
export interface SerializeResult {
  text: string;
  /** Set when the subtree was too large; `text` is then empty. */
  refused?: { reason: "too-large"; maxBytes: number };
}

const DEFAULT_MAX_BYTES = 32 * 1024 * 1024;

/**
 * Bytes of output a single node costs, at the low end.
 *
 * Used to turn the byte ceiling into a **node** ceiling that can be checked by
 * walking, before the output string is built. Producing a 400 MB string only to
 * measure it and throw it away is the failure this avoids. The walk is not
 * free — it allocates a `Set` of the containers it has seen and an explicit
 * stack — but both are bounded by the node cap and neither approaches the size
 * of the string it replaces.
 */
const MIN_BYTES_PER_NODE = 8;

/**
 * Serialize `value`, rendering the things JSON has no syntax for.
 *
 * | Input | Output |
 * |---|---|
 * | `Map` | array of `[key, value]` pairs — feeds straight back into `new Map()` |
 * | `Set` | array of values |
 * | `Date` | ISO string (via `toJSON`) |
 * | `BigInt` | decimal string |
 * | `undefined` | `null` |
 * | function / symbol | its description, as a string |
 * | a cycle | `"[Circular]"` |
 *
 * @example
 * ```ts
 * serializeSubtree({ id: 1n, at: new Date(0) }).text;
 * // {
 * //   "id": "1",
 * //   "at": "1970-01-01T00:00:00.000Z"
 * // }
 * ```
 */
export function serializeSubtree(
  value: unknown,
  options: SerializeOptions = {},
): SerializeResult {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const indent = options.indent ?? 2;
  const nodeCap = Math.max(1, Math.floor(maxBytes / MIN_BYTES_PER_NODE));

  if (countNodes(value, nodeCap) > nodeCap) {
    return { text: "", refused: { reason: "too-large", maxBytes } };
  }

  // Ancestor stacks for cycle detection, kept in lockstep.
  //
  // `this` inside the replacer is the holder of `key`, which is what lets the
  // stack be unwound correctly for siblings — a plain `WeakSet` would report
  // every repeated (but acyclic) reference as circular.
  //
  // Two stacks rather than one because a `Map` or `Set` is *substituted*: what
  // `JSON.stringify` descends into is a freshly built array, so it is that
  // array that later arrives as `this`, while the thing a cycle points back at
  // is the original container. Matching `this` against the originals unwound
  // the stack to empty and left the cycle guard with nothing to compare — a
  // self-containing `Map` then recursed until the stack overflowed, and the
  // `RangeError` was reported to the user as "too large to copy".
  const emitted: unknown[] = [];
  const sources: unknown[] = [];

  function replacer(this: unknown, _key: string, raw: unknown): unknown {
    while (emitted.length > 0 && emitted[emitted.length - 1] !== this) {
      emitted.pop();
      sources.pop();
    }

    if (typeof raw === "bigint") return String(raw);
    if (typeof raw === "function") {
      const name = (raw as { name?: string }).name;
      return name ? `function ${name}()` : "function ()";
    }
    if (typeof raw === "symbol") return String(raw);
    if (raw === undefined) return null;

    if (raw !== null && typeof raw === "object") {
      if (sources.includes(raw)) return "[Circular]";
      const substitute =
        raw instanceof Map
          ? Array.from(raw.entries())
          : raw instanceof Set
            ? Array.from(raw.values())
            : raw;
      emitted.push(substitute);
      sources.push(raw);
      return substitute;
    }
    return raw;
  }

  try {
    const text = JSON.stringify(value, replacer, indent);
    if (text === undefined) return { text: "null" };
    if (text.length > maxBytes) {
      return { text: "", refused: { reason: "too-large", maxBytes } };
    }
    return { text };
  } catch (error) {
    // `Invalid string length` from V8 when the result passes the 512 MB cap —
    // reachable when the node estimate under-counts long strings.
    if (error instanceof RangeError) {
      return { text: "", refused: { reason: "too-large", maxBytes } };
    }
    throw error;
  }
}

/**
 * Count nodes, stopping as soon as `cap` is passed.
 *
 * Iterative on an explicit stack: a 4.5 M-node document would overflow the
 * call stack long before it overflowed the byte budget.
 */
function countNodes(root: unknown, cap: number): number {
  let count = 0;
  const stack: unknown[] = [root];
  const seen = new Set<unknown>();

  while (stack.length > 0) {
    const value = stack.pop();
    count++;
    if (count > cap) return count;

    if (value === null || typeof value !== "object") continue;
    if (seen.has(value)) continue;
    seen.add(value);

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) stack.push(value[i]);
    } else if (value instanceof Map) {
      for (const [key, entry] of value) {
        stack.push(key);
        stack.push(entry);
      }
    } else if (value instanceof Set) {
      for (const entry of value) stack.push(entry);
    } else if (value instanceof Date) {
      continue;
    } else {
      let keys: string[];
      try {
        keys = Object.keys(value);
      } catch {
        continue;
      }
      for (const key of keys) {
        try {
          stack.push((value as Record<string, unknown>)[key]);
        } catch {
          /* a throwing getter is one node, already counted */
        }
      }
    }
  }
  return count;
}

/**
 * Path formatting and parsing (SPEC.md §4.5).
 *
 * Three formats, all round-trippable, because "copy path" means different
 * things in different places: a JS accessor to paste into a console, an RFC
 * 6901 pointer to paste into a patch or a config, a JSONPath to paste into a
 * query tool.
 *
 * The correctness of this module is checked against an **independent**
 * implementation in the tests (`jsonpath-plus`, plus a resolver written from
 * the RFC text) — our own tree agreeing with our own formatter would only
 * prove the two halves are consistent, not that either is right.
 */

import type { JsonPath, PathFormat, PathSegment } from "../types";

/** A bare `.key` is only legal for an identifier-shaped key. */
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Render a path in one of the supported formats.
 *
 * @example
 * ```ts
 * formatPath(["users", 0, "first name"], "js");        // users[0]["first name"]
 * formatPath(["users", 0, "first name"], "pointer");   // /users/0/first name
 * formatPath(["users", 0, "first name"], "jsonpath");  // $.users[0]['first name']
 * ```
 */
export function formatPath(path: JsonPath, format: PathFormat = "js"): string {
  switch (format) {
    case "pointer":
      return pathToPointer(path);
    case "jsonpath":
      return pathToJsonPath(path);
    default:
      return pathToAccessor(path);
  }
}

/** `users[0]["first name"]` — pasteable into a console against the value. */
export function pathToAccessor(path: JsonPath): string {
  let out = "";
  for (let i = 0; i < path.length; i++) {
    const segment = path[i]!;
    if (typeof segment === "number") {
      out += `[${segment}]`;
    } else if (IDENTIFIER.test(segment)) {
      out += i === 0 ? segment : `.${segment}`;
    } else {
      out += `[${JSON.stringify(segment)}]`;
    }
  }
  return out;
}

/** `/users/0/first name` — RFC 6901. The root is the empty string. */
export function pathToPointer(path: JsonPath): string {
  let out = "";
  for (const segment of path) {
    out += `/${String(segment).replace(/~/g, "~0").replace(/\//g, "~1")}`;
  }
  return out;
}

/**
 * `$.users[0]['first name']` — JSONPath, escaped per RFC 9535 §2.3.1.
 *
 * Single-quoted name selectors escape `\` and `'`, and control characters are
 * not allowed literally. Getting this right matters more than it looks: an
 * unescaped apostrophe silently terminates the selector, so the query still
 * parses and quietly returns the wrong node.
 */
export function pathToJsonPath(path: JsonPath): string {
  let out = "$";
  for (const segment of path) {
    if (typeof segment === "number") {
      out += `[${segment}]`;
    } else if (IDENTIFIER.test(segment)) {
      out += `.${segment}`;
    } else {
      out += `['${escapeJsonPathName(segment)}']`;
    }
  }
  return out;
}

/** RFC 9535 §2.3.1.1 escaping for the contents of a single-quoted name. */
function escapeJsonPathName(name: string): string {
  let out = "";
  for (const char of name) {
    switch (char) {
      case "\\":
        out += "\\\\";
        break;
      case "'":
        out += "\\'";
        break;
      case "\b":
        out += "\\b";
        break;
      case "\f":
        out += "\\f";
        break;
      case "\n":
        out += "\\n";
        break;
      case "\r":
        out += "\\r";
        break;
      case "\t":
        out += "\\t";
        break;
      default: {
        const code = char.codePointAt(0)!;
        out +=
          code < 0x20 || code === 0x7f
            ? `\\u${code.toString(16).padStart(4, "0")}`
            : char;
      }
    }
  }
  return out;
}

/**
 * Split an RFC 6901 pointer into its raw segments.
 *
 * Segments stay strings: whether `"0"` means an array index or an object key
 * is a property of the container it lands in, and only the tree knows that.
 *
 * @example
 * ```ts
 * pointerToSegments("/a~1b/0");   // ["a/b", "0"]
 * pointerToSegments("");          // []
 * ```
 */
export function pointerToSegments(pointer: string): string[] {
  if (pointer === "" || pointer === "#") return [];
  const body = pointer.startsWith("#") ? pointer.slice(1) : pointer;
  if (!body.startsWith("/")) return [];
  return body
    .slice(1)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
}

/**
 * Parse a formatted path back into segments.
 *
 * Numeric bracket subscripts come back as numbers and quoted ones as strings,
 * so `parsePath(formatPath(p)) === p` for every path this package emits.
 * Returns `null` when the text is not a valid path in `format`.
 */
export function parsePath(text: string, format: PathFormat = "js"): PathSegment[] | null {
  if (format === "pointer") {
    if (text !== "" && text !== "#" && !text.replace(/^#/, "").startsWith("/")) {
      return null;
    }
    return pointerToSegments(text);
  }

  let cursor = 0;
  const segments: PathSegment[] = [];

  if (format === "jsonpath") {
    if (text[0] !== "$") return null;
    cursor = 1;
  }

  let first = format !== "jsonpath";

  while (cursor < text.length) {
    const char = text[cursor];

    if (char === ".") {
      cursor++;
      const start = cursor;
      while (cursor < text.length && /[A-Za-z0-9_$]/.test(text[cursor]!)) cursor++;
      if (cursor === start) return null;
      segments.push(text.slice(start, cursor));
      first = false;
      continue;
    }

    if (char === "[") {
      cursor++;
      const quote = text[cursor];
      if (quote === '"' || quote === "'") {
        cursor++;
        let value = "";
        while (cursor < text.length && text[cursor] !== quote) {
          if (text[cursor] !== "\\") {
            value += text[cursor];
            cursor++;
            continue;
          }
          // An escape sequence carries meaning: taking the next character
          // literally turns the key "a\nb" into "anb", which is a different
          // key that happens to look plausible.
          const decoded = decodeEscape(text, cursor);
          if (!decoded) return null;
          value += decoded.char;
          cursor = decoded.next;
        }
        if (text[cursor] !== quote) return null;
        cursor++;
        if (text[cursor] !== "]") return null;
        cursor++;
        segments.push(value);
      } else {
        const start = cursor;
        while (cursor < text.length && text[cursor] !== "]") cursor++;
        if (text[cursor] !== "]") return null;
        const raw = text.slice(start, cursor);
        cursor++;
        if (!/^\d+$/.test(raw)) return null;
        segments.push(Number(raw));
      }
      first = false;
      continue;
    }

    if (first && /[A-Za-z_$]/.test(char!)) {
      const start = cursor;
      while (cursor < text.length && /[A-Za-z0-9_$]/.test(text[cursor]!)) cursor++;
      segments.push(text.slice(start, cursor));
      first = false;
      continue;
    }

    return null;
  }

  return segments;
}

/** The single-character escapes shared by JSON strings and RFC 9535 names. */
const SIMPLE_ESCAPES: Record<string, string> = {
  '"': '"',
  "'": "'",
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

/**
 * Decode the escape sequence starting at `text[at]` (which must be `\`).
 *
 * @returns the decoded character and the index just past the sequence, or
 * `null` when the sequence is malformed.
 */
function decodeEscape(
  text: string,
  at: number,
): { char: string; next: number } | null {
  const marker = text[at + 1];
  if (marker === undefined) return null;

  if (marker === "u") {
    const hex = text.slice(at + 2, at + 6);
    if (!/^[0-9a-fA-F]{4}$/.test(hex)) return null;
    return { char: String.fromCharCode(parseInt(hex, 16)), next: at + 6 };
  }

  const simple = SIMPLE_ESCAPES[marker];
  return simple === undefined ? null : { char: simple, next: at + 2 };
}

/**
 * Resolve a path against a value, for tests and for consumers of `./headless`.
 *
 * Mirrors how the tree addresses children: `Map` and `Set` positionally,
 * everything else by key or index.
 */
export function resolvePath(data: unknown, path: JsonPath): unknown {
  let current: unknown = data;
  for (const segment of path) {
    if (current === null || current === undefined) return undefined;
    if (current instanceof Map) {
      current = Array.from(current.values())[Number(segment)];
    } else if (current instanceof Set) {
      current = Array.from(current.values())[Number(segment)];
    } else if (typeof current === "object") {
      current = (current as Record<PathSegment, unknown>)[segment as never];
    } else {
      return undefined;
    }
  }
  return current;
}

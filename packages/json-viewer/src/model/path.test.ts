import { describe, expect, it } from "vitest";
import { JSONPath } from "jsonpath-plus";
import {
  formatPath,
  parsePath,
  pathToAccessor,
  pathToJsonPath,
  pathToPointer,
  pointerToSegments,
  resolvePath,
} from "./path";
import { createJsonTree } from "./tree";
import { generateValue, makeRandom } from "../__testing__/generate";
import type { JsonPath, PathFormat, PathSegment } from "../types";

/**
 * An RFC 6901 resolver written from the specification text.
 *
 * Deliberately *not* built on `pointerToSegments`: the point of an oracle is
 * that it shares no code with the thing it is checking. Our own tree agreeing
 * with our own formatter would only prove the two halves are consistent.
 */
function rfc6901(document: unknown, pointer: string): unknown {
  if (pointer === "") return document;
  if (pointer[0] !== "/") throw new Error(`not a JSON Pointer: ${pointer}`);

  let current = document;
  for (const rawToken of pointer.substring(1).split("/")) {
    // §4: ~1 is unescaped first, then ~0 — the other order corrupts "~01".
    const token = rawToken.replace(/~1/g, "/").replace(/~0/g, "~");

    if (Array.isArray(current)) {
      if (!/^(0|[1-9][0-9]*)$/.test(token)) throw new Error(`bad index: ${token}`);
      current = current[Number(token)];
    } else if (current !== null && typeof current === "object") {
      if (!Object.prototype.hasOwnProperty.call(current, token)) {
        throw new Error(`no member: ${token}`);
      }
      current = (current as Record<string, unknown>)[token];
    } else {
      throw new Error(`not a container at ${token}`);
    }
  }
  return current;
}

/**
 * Whether `jsonpath-plus` can address a key at all.
 *
 * It takes bracket-quoted names **literally** — there is no escape mechanism
 * inside them — so a key containing `'`, `\` or a control character cannot be
 * expressed through it in any spelling (verified: `$['it\'s']`, `$["it's"]`
 * and `$..['it\'s']` all return `undefined` against `{ "it's": … }`).
 *
 * That is a limitation of the evaluator, not of our formatter, which follows
 * RFC 9535 §2.3.1. Those keys are excluded from the JSONPath leg of the oracle
 * and still covered by the RFC 6901 leg, which has real escaping.
 *
 * **Do not "fix" `pathToJsonPath` to match `jsonpath-plus`** — emitting an
 * unescaped apostrophe yields a query that parses and silently returns the
 * wrong node, which is worse than one that fails.
 */
function expressibleInJsonPathPlus(segment: PathSegment): boolean {
  if (typeof segment === "number") return true;
  for (const char of segment) {
    const code = char.codePointAt(0)!;
    if (char === "'" || char === "\\" || code < 0x20 || code === 0x7f) return false;
  }
  return true;
}

/** Nodes in a generated payload, so a thin draw can be redrawn. */
function nodeCount(value: unknown): number {
  if (value === null || typeof value !== "object") return 1;
  const children = Array.isArray(value) ? value : Object.values(value);
  let total = 1;
  for (const child of children) total += nodeCount(child);
  return total;
}

describe("formatPath", () => {
  const path: JsonPath = ["users", 0, "first name"];

  it("renders a JS accessor", () => {
    expect(pathToAccessor(path)).toBe('users[0]["first name"]');
    expect(formatPath(path)).toBe('users[0]["first name"]');
  });

  it("renders an RFC 6901 pointer", () => {
    expect(pathToPointer(path)).toBe("/users/0/first name");
    expect(pathToPointer(["a/b", "c~d"])).toBe("/a~1b/c~0d");
  });

  it("renders a JSONPath", () => {
    expect(pathToJsonPath(path)).toBe("$.users[0]['first name']");
    expect(pathToJsonPath([])).toBe("$");
  });

  it("escapes a JSONPath name per RFC 9535", () => {
    expect(pathToJsonPath(["it's"])).toBe("$['it\\'s']");
    expect(pathToJsonPath(["back\\slash"])).toBe("$['back\\\\slash']");
    expect(pathToJsonPath(["tab\there"])).toBe("$['tab\\there']");
  });

  it("renders the root as the empty accessor and pointer", () => {
    expect(pathToAccessor([])).toBe("");
    expect(pathToPointer([])).toBe("");
  });

  it("quotes a key that only looks like an identifier", () => {
    expect(pathToAccessor(["0"])).toBe('["0"]');
    expect(pathToAccessor([0])).toBe("[0]");
    expect(pathToAccessor([""])).toBe('[""]');
  });
});

describe("pointerToSegments", () => {
  it("unescapes ~1 before ~0", () => {
    // "~01" must come back as "~1", not as "/".
    expect(pointerToSegments("/~01")).toEqual(["~1"]);
  });

  it("treats the empty pointer as the root", () => {
    expect(pointerToSegments("")).toEqual([]);
    expect(pointerToSegments("#")).toEqual([]);
  });

  it("keeps an empty segment", () => {
    expect(pointerToSegments("/")).toEqual([""]);
  });
});

describe("parsePath", () => {
  const cases: Array<[PathFormat, JsonPath]> = [
    ["js", []],
    ["js", ["a"]],
    ["js", ["a", 0, "b c"]],
    ["js", ["0", "", "x~y", "p/q"]],
    ["pointer", []],
    ["pointer", ["a/b", "c~d", ""]],
    ["jsonpath", []],
    ["jsonpath", ["a", 0, "b c"]],
  ];

  for (const [format, path] of cases) {
    it(`round trips ${format}: ${JSON.stringify(path)}`, () => {
      const parsed = parsePath(formatPath(path, format), format);
      // Pointer segments are always strings — the container decides.
      const expected = format === "pointer" ? path.map(String) : path;
      expect(parsed).toEqual(expected);
    });
  }

  it("round trips a quoted apostrophe in the JS accessor form", () => {
    expect(parsePath(pathToAccessor(["it's"]), "js")).toEqual(["it's"]);
  });

  it("round trips escape sequences rather than eating the backslash", () => {
    // Taking the character after `\` literally turns the key "a\nb" into "anb"
    // — a different key that happens to look plausible.
    for (const key of ["a\nb", "a\tb", "a\rb", "a\bb", "a\fb", "x", "a\\b", 'a"b']) {
      expect(parsePath(pathToAccessor([key]), "js"), `js: ${JSON.stringify(key)}`).toEqual([
        key,
      ]);
      expect(
        parsePath(pathToJsonPath([key]), "jsonpath"),
        `jsonpath: ${JSON.stringify(key)}`,
      ).toEqual([key]);
    }
  });

  it("rejects a malformed escape rather than guessing", () => {
    expect(parsePath('a["x\\', "js")).toBeNull();
    expect(parsePath('a["\\q"]', "js")).toBeNull();
    expect(parsePath('a["\\u12"]', "js")).toBeNull();
  });

  it("rejects malformed input instead of guessing", () => {
    expect(parsePath("a[", "js")).toBeNull();
    expect(parsePath("a.", "js")).toBeNull();
    expect(parsePath('a["x]', "js")).toBeNull();
    expect(parsePath("a[1x]", "js")).toBeNull();
    expect(parsePath("a.b", "jsonpath")).toBeNull();
    expect(parsePath("a/b", "pointer")).toBeNull();
  });
});

describe("the independent oracles", () => {
  // Gate ⑥ (STANDALONE-IDEAS): our naive flatten proves the index agrees with
  // itself. Only a separate implementation can prove the *paths* are right.
  const jsonPathCanExpress = (path: JsonPath) =>
    path.every(expressibleInJsonPathPlus);

  for (const seed of [4, 31, 512, 8191]) {
    it(`every emitted path resolves identically in jsonpath-plus and RFC 6901 (seed ${seed})`, () => {
      // Wrap so the root is always a container, and keep drawing until the
      // payload is one too — a seed that happens to yield `7` would make this
      // test pass by checking nothing (`checked` below is the guard that
      // caught exactly that).
      const random = makeRandom(seed);
      const options = { maxDepth: 5, maxBreadth: 5 };
      let payload = generateValue(random, options);
      for (let tries = 0; tries < 100 && nodeCount(payload) < 30; tries++) {
        payload = generateValue(random, options);
      }
      const data = { payload };
      const tree = createJsonTree(data, { maxExpandedRows: 200_000 });
      tree.expandAll();

      let checked = 0;
      for (let i = 0; i < tree.rowCount(); i++) {
        const row = tree.rowAt(i);
        if (row.closing) continue;

        if (jsonPathCanExpress(row.path)) {
          const jsonPath = pathToJsonPath(row.path);
          expect(
            JSONPath({ path: jsonPath, json: data as never, wrap: false }),
            jsonPath,
          ).toBe(row.value);
        }

        const pointer = pathToPointer(row.path);
        expect(rfc6901(data, pointer), pointer).toBe(row.value);
        expect(resolvePath(data, row.path), pointer).toBe(row.value);

        // Both text formats must survive a round trip for every key the tree
        // can actually emit — including the awkward ones the generator now
        // produces.
        expect(parsePath(pathToAccessor(row.path), "js"), pointer).toEqual([
          ...row.path,
        ]);
        expect(parsePath(pathToJsonPath(row.path), "jsonpath"), pointer).toEqual([
          ...row.path,
        ]);
        checked++;
      }

      expect(checked).toBeGreaterThan(10);
    });
  }

  it("handles the keys that break naive formatters", () => {
    const data = {
      "": "empty key",
      "0": "numeric key",
      "a/b": "slash",
      "c~d": "tilde",
      "it's": "apostrophe",
      "back\\slash": "backslash",
      "π": "unicode",
    };
    const tree = createJsonTree(data);

    for (let i = 1; i < tree.rowCount() - 1; i++) {
      const row = tree.rowAt(i);
      const pointer = pathToPointer(row.path);
      expect(rfc6901(data, pointer), pointer).toBe(row.value);
      expect(parsePath(pathToAccessor(row.path), "js")).toEqual([...row.path]);

      if (jsonPathCanExpress(row.path)) {
        const jsonPath = pathToJsonPath(row.path);
        expect(
          JSONPath({ path: jsonPath, json: data, wrap: false }),
          jsonPath,
        ).toBe(row.value);
      }
    }
  });
});

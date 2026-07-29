import { describe, expect, it } from "vitest";
import {
  ThrownValue,
  bracketsOf,
  childAccessor,
  childCountOf,
  classify,
  displayOf,
  isContainerKind,
  keysOf,
  previewOf,
} from "./value";

describe("classify", () => {
  const cases: Array<[unknown, string]> = [
    [null, "null"],
    [undefined, "undefined"],
    ["x", "string"],
    [1, "number"],
    [Number.NaN, "number"],
    [true, "boolean"],
    [10n, "bigint"],
    [Symbol("s"), "symbol"],
    [() => 1, "function"],
    [[], "array"],
    [{}, "object"],
    [new Date(0), "date"],
    [new Map(), "map"],
    [new Set(), "set"],
    [new ThrownValue(new Error("x")), "unknown"],
    [Object.create(null), "object"],
    [/re/, "object"],
  ];

  for (const [value, expected] of cases) {
    it(`classifies ${String(expected)}`, () => {
      expect(classify(value)).toBe(expected);
    });
  }

  it("never reports a cycle — that is the walker's job, not the value's", () => {
    const node: Record<string, unknown> = {};
    node.self = node;
    expect(classify(node)).toBe("object");
  });
});

describe("isContainerKind", () => {
  it("covers exactly the four expandable kinds", () => {
    const containers = ["object", "array", "map", "set"];
    for (const kind of containers) expect(isContainerKind(kind as never)).toBe(true);
    for (const kind of ["string", "date", "circular", "unknown", "null"]) {
      expect(isContainerKind(kind as never)).toBe(false);
    }
  });
});

describe("keysOf", () => {
  it("returns own enumerable keys in insertion order", () => {
    expect(keysOf({ b: 1, a: 2 })).toEqual(["b", "a"]);
  });

  it("sorts on request without touching the object", () => {
    const object = { b: 1, a: 2 };
    expect(keysOf(object, true)).toEqual(["a", "b"]);
    expect(Object.keys(object)).toEqual(["b", "a"]);
  });

  it("returns the identical array for a large object (the cache)", () => {
    // Collapsed rows re-read the key count on every render; without the cache
    // scrolling past a wide object would re-pay Object.keys every frame.
    const wide: Record<string, number> = {};
    for (let i = 0; i < 64; i++) wide[`k${i}`] = i;
    expect(keysOf(wide)).toBe(keysOf(wide));
  });

  it("survives a Proxy that refuses ownKeys", () => {
    const hostile = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error("no");
        },
      },
    );
    expect(keysOf(hostile)).toEqual([]);
  });
});

describe("childAccessor", () => {
  it("addresses array children by index", () => {
    const accessor = childAccessor(["a", "b"], "array");
    expect(accessor.count).toBe(2);
    expect(accessor.keyAt(1)).toBe(1);
    expect(accessor.labelAt(1)).toBe("1");
    expect(accessor.valueAt(1)).toBe("b");
  });

  it("addresses object children by key", () => {
    const accessor = childAccessor({ x: 1, y: 2 }, "object");
    expect(accessor.keyAt(0)).toBe("x");
    expect(accessor.valueAt(1)).toBe(2);
  });

  it("addresses Map children positionally but labels them by key", () => {
    const accessor = childAccessor(new Map([["alpha", 7]]), "map");
    expect(accessor.keyAt(0)).toBe(0);
    expect(accessor.labelAt(0)).toBe("alpha");
    expect(accessor.valueAt(0)).toBe(7);
  });

  it("summarises a non-string Map key", () => {
    const accessor = childAccessor(new Map([[{ a: 1 }, 7]]), "map");
    expect(accessor.labelAt(0)).toBe("{ 1 key }");
  });

  it("addresses Set children positionally", () => {
    const accessor = childAccessor(new Set(["s"]), "set");
    expect(accessor.labelAt(0)).toBe("0");
    expect(accessor.valueAt(0)).toBe("s");
  });

  it("wraps a throwing getter instead of propagating", () => {
    const accessor = childAccessor(
      {
        get boom(): never {
          throw new Error("kaboom");
        },
      },
      "object",
    );
    const value = accessor.valueAt(0);
    expect(value).toBeInstanceOf(ThrownValue);
    expect(displayOf(value, "unknown", 120).text).toBe("[Threw: kaboom]");
  });

  it("is empty for a non-container", () => {
    expect(childAccessor("text", "string").count).toBe(0);
  });
});

describe("childCountOf", () => {
  it("is O(1) for the kinds that can be huge", () => {
    expect(childCountOf(new Array(1000), "array")).toBe(1000);
    expect(childCountOf(new Set([1, 2]), "set")).toBe(2);
    expect(childCountOf(new Map([["a", 1]]), "map")).toBe(1);
    expect(childCountOf({ a: 1 }, "object")).toBe(1);
    expect(childCountOf("x", "string")).toBe(0);
  });
});

describe("displayOf", () => {
  it("quotes and escapes strings", () => {
    expect(displayOf('a"b', "string", 120).text).toBe('"a\\"b"');
  });

  it("truncates a long string without building a second copy of it", () => {
    const long = "x".repeat(1000);
    const rendered = displayOf(long, "string", 10);
    expect(rendered.truncated).toBe(true);
    expect(rendered.text.length).toBeLessThan(20);
    expect(rendered.text.endsWith('…"')).toBe(true);
  });

  it("keeps -0 distinguishable from 0", () => {
    expect(displayOf(-0, "number", 120).text).toBe("-0");
    expect(displayOf(0, "number", 120).text).toBe("0");
  });

  it("renders the kinds JSON has no syntax for", () => {
    expect(displayOf(10n, "bigint", 120).text).toBe("10n");
    expect(displayOf(undefined, "undefined", 120).text).toBe("undefined");
    expect(displayOf(new Date(0), "date", 120).text).toBe("1970-01-01T00:00:00.000Z");
    expect(displayOf(new Date(Number.NaN), "date", 120).text).toBe("Invalid Date");
    expect(displayOf(function named() {}, "function", 120).text).toBe("function named()");
    expect(displayOf(() => 1, "function", 120).text).toMatch(/^function /);
    expect(displayOf(null, "circular", 120).text).toBe("[Circular]");
  });
});

describe("previewOf", () => {
  it("pluralises and shows the class name when there is one", () => {
    expect(previewOf({}, "object", 0)).toBe("{}");
    expect(previewOf({ a: 1 }, "object", 1)).toBe("{ 1 key }");
    expect(previewOf({ a: 1, b: 2 }, "object", 2)).toBe("{ 2 keys }");
    expect(previewOf([], "array", 0)).toBe("[]");
    expect(previewOf([1], "array", 1)).toBe("[ 1 item ]");
    expect(previewOf(new Map(), "map", 3)).toBe("Map(3)");
    expect(previewOf(new Set(), "set", 3)).toBe("Set(3)");
  });

  it("distinguishes a class instance from a plain object", () => {
    class Session {
      id = 1;
    }
    expect(previewOf(new Session(), "object", 1)).toBe("Session { 1 key }");
    expect(previewOf(Object.create(null), "object", 1)).toBe(
      "[Object: null prototype] { 1 key }",
    );
  });
});

describe("bracketsOf", () => {
  it("names the container in the opening bracket", () => {
    expect(bracketsOf("array")).toEqual(["[", "]"]);
    expect(bracketsOf("object")).toEqual(["{", "}"]);
    expect(bracketsOf("map")).toEqual(["Map {", "}"]);
    expect(bracketsOf("set")).toEqual(["Set {", "}"]);
  });
});

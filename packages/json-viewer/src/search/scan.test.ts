import { describe, expect, it, vi } from "vitest";
import { searchJson } from "./scan";
import * as scheduler from "./scheduler";
import { generateValue, makeRandom } from "../__testing__/generate";
import { pathToPointer } from "../model/path";
import type { JsonPath, PathSegment } from "../types";

/**
 * The reference scan — plain recursion, no slicing, no stack management.
 *
 * The real one is iterative and suspendable; this one is obvious. They must
 * produce the identical ordered list.
 */
function naiveSearch(
  data: unknown,
  query: string,
  options: { matchKeys?: boolean; matchValues?: boolean; caseSensitive?: boolean } = {},
): JsonPath[] {
  const { matchKeys = true, matchValues = true, caseSensitive = false } = options;
  const needle = caseSensitive ? query : query.toLowerCase();
  const hit = (text: string) =>
    (caseSensitive ? text : text.toLowerCase()).includes(needle);

  const out: JsonPath[] = [];

  const content = (value: unknown): string | null => {
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (typeof value === "bigint") return String(value);
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
    }
    return null;
  };

  function walk(value: unknown, path: PathSegment[], ancestors: unknown[]): void {
    if (value === null || typeof value !== "object") return;
    if (ancestors.includes(value)) return;
    ancestors.push(value);

    const entries: Array<[PathSegment, string, unknown, boolean]> = [];
    if (Array.isArray(value)) {
      value.forEach((child, i) => entries.push([i, String(i), child, false]));
    } else if (value instanceof Map) {
      Array.from(value.entries()).forEach(([key, child], i) =>
        entries.push([i, String(key), child, true]),
      );
    } else if (value instanceof Set) {
      Array.from(value.values()).forEach((child, i) =>
        entries.push([i, String(i), child, false]),
      );
    } else {
      for (const key of Object.keys(value)) {
        entries.push([key, key, (value as Record<string, unknown>)[key], true]);
      }
    }

    for (const [segment, label, child, labelIsKey] of entries) {
      path.push(segment);
      const text = content(child);
      if (
        (matchKeys && labelIsKey && hit(label)) ||
        (matchValues && text !== null && hit(text))
      ) {
        out.push(path.slice());
      }
      walk(child, path, ancestors);
      path.pop();
    }

    ancestors.pop();
  }

  walk(data, [], []);
  return out;
}

describe("searchJson", () => {
  it("returns nothing for an empty query", async () => {
    const result = await searchJson({ a: 1 }, { query: "" });
    expect(result.paths).toEqual([]);
    expect(result.capped).toBe(false);
  });

  it("finds matches inside collapsed subtrees", async () => {
    // The whole point: search covers the document, not the visible rows.
    const data = { a: { b: { c: { needle: "yes" } } } };
    const { paths } = await searchJson(data, { query: "needle" });
    expect(paths.map(pathToPointer)).toEqual(["/a/b/c/needle"]);
  });

  it("matches keys and values independently", async () => {
    const data = { alpha: "beta", beta: "gamma" };

    expect(
      (await searchJson(data, { query: "beta", matchValues: false })).paths.map(
        pathToPointer,
      ),
    ).toEqual(["/beta"]);

    expect(
      (await searchJson(data, { query: "beta", matchKeys: false })).paths.map(
        pathToPointer,
      ),
    ).toEqual(["/alpha"]);
  });

  it("never matches an array index as if it were content", async () => {
    // Otherwise searching for "1" returns most of the document.
    const { paths } = await searchJson([10, 20, 30], { query: "1" });
    expect(paths.map(pathToPointer)).toEqual(["/0"]);
  });

  it("honours case sensitivity", async () => {
    const data = { Key: "Value" };
    expect((await searchJson(data, { query: "value" })).paths).toHaveLength(1);
    expect(
      (await searchJson(data, { query: "value", caseSensitive: true })).paths,
    ).toHaveLength(0);
  });

  it("supports regular expressions", async () => {
    const data = { a: "abc123", b: "no digits" };
    const { paths } = await searchJson(data, { query: "\\d{3}", regex: true });
    expect(paths.map(pathToPointer)).toEqual(["/a"]);
  });

  it("matches the root when it is a matching leaf", async () => {
    const { paths } = await searchJson("hello", { query: "ell" });
    expect(paths).toEqual([[]]);
  });

  it("reports the cap instead of silently truncating", async () => {
    const data = Array.from({ length: 100 }, () => "match");
    const result = await searchJson(data, { query: "match", maxResults: 10 });
    expect(result.paths).toHaveLength(10);
    expect(result.capped).toBe(true);
  });

  it("does not claim a cap when the results happen to fill it exactly", async () => {
    // "first 10 of 10" is a false statement about a complete answer.
    const data = Array.from({ length: 10 }, () => "match");
    const result = await searchJson(data, { query: "match", maxResults: 10 });
    expect(result.paths).toHaveLength(10);
    expect(result.capped).toBe(false);
  });

  it("stops when aborted, and says so", async () => {
    const controller = new AbortController();
    const data = Array.from({ length: 50_000 }, (_, i) => `value-${i}`);

    const promise = searchJson(
      data,
      { query: "value", signal: controller.signal, budgetMs: 0, maxResults: 1e9 },
      (progress) => {
        if (progress.scanned > 0) controller.abort();
      },
    );

    const result = await promise;
    expect(result.aborted).toBe(true);
    expect(result.paths.length).toBeLessThan(50_000);
  });

  it("terminates on a self-referential object", async () => {
    const node: Record<string, unknown> = { name: "loop" };
    node.self = node;
    const { paths } = await searchJson(node, { query: "loop" });
    expect(paths.map(pathToPointer)).toEqual(["/name"]);
  });

  it("yields between slices rather than holding the thread", async () => {
    const spy = vi.spyOn(scheduler, "scheduleYield");
    const data = Array.from({ length: 20_000 }, (_, i) => i);
    // A zero budget forces a yield at every clock check.
    await searchJson(data, { query: "7", budgetMs: 0, maxResults: 1e9 });
    expect(spy).toHaveBeenCalled();
  });

  it("reports progress and a final done", async () => {
    const seen: number[] = [];
    let done = false;
    await searchJson(
      Array.from({ length: 5000 }, (_, i) => `v${i}`),
      { query: "v1", budgetMs: 0 },
      (progress) => {
        seen.push(progress.scanned);
        done = progress.done;
      },
    );
    expect(seen.length).toBeGreaterThan(1);
    expect(done).toBe(true);
  });

  describe("against the naive reference", () => {
    for (const seed of [8, 64, 4096]) {
      it(`produces the identical ordered result (seed ${seed})`, async () => {
        const random = makeRandom(seed);
        const data = {
          payload: generateValue(random, { maxDepth: 5, maxBreadth: 5, exotic: true }),
        };

        for (const query of ["a", "e", "1", "value", "π"]) {
          const actual = await searchJson(data, { query, maxResults: 1e9 });
          expect(actual.paths.map(pathToPointer), query).toEqual(
            naiveSearch(data, query).map(pathToPointer),
          );
        }
      });
    }
  });
});

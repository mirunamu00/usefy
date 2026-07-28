import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as headless from "./headless";

declare const process: { env: Record<string, string | undefined> };

const SRC = resolve(__dirname);
const DIST = resolve(__dirname, "../dist");

/**
 * Follow relative imports from an entry file and collect the whole source
 * graph it pulls in.
 */
function sourceGraph(entry: string): string[] {
  const seen = new Set<string>();
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);

    const code = readFileSync(file, "utf8");
    for (const match of code.matchAll(/from\s+"(\.[^"]*)"/g)) {
      const specifier = match[1]!;
      const base = resolve(dirname(file), specifier);
      const candidates = [`${base}.ts`, `${base}.tsx`, resolve(base, "index.ts")];
      const resolved = candidates.find((candidate) => existsSync(candidate));
      if (resolved) queue.push(resolved);
    }
  }

  return Array.from(seen);
}

describe("the ./headless surface", () => {
  it("exports the decoder, the engines and the error types", () => {
    for (const name of [
      "decode",
      "decodeFile",
      "decodeFirst",
      "decodeImageData",
      "decodeMatrix",
      "detectSymbols",
      "findFinderPatterns",
      "groupFinders",
      "sampleGrid",
      "readFormatInfo",
      "readVersion",
      "readCodewords",
      "rsDecode",
      "parseSegments",
      "binarize",
      "toGray",
      "toImageData",
      "isNativeSupported",
      "decodeWithNative",
      "createWorkerDecoder",
      "joinStructuredAppend",
      "mapCorners",
      "BitMatrix",
      "PerspectiveTransform",
      "QRDecodeError",
      "QRCameraError",
      "QRUnsupportedError",
    ]) {
      expect(headless, `missing export: ${name}`).toHaveProperty(name);
    }
  });

  it("exports no React component or hook — that is what the root entry is for", () => {
    expect(headless).not.toHaveProperty("QRScanner");
    expect(headless).not.toHaveProperty("useQRScanner");
    expect(headless).not.toHaveProperty("Viewfinder");
  });

  it("decodes end to end without touching the DOM", async () => {
    const { encodeQR } = await import("@usefy/qr-code/headless");
    const { renderMatrix } = await import("./__testing__/render");

    const value = "headless end to end";
    const image = renderMatrix(encodeQR(value, { level: "M" }), { scale: 6 });
    expect(headless.decodeImageData(image)[0]?.text).toBe(value);
  });
});

describe("the ./headless source graph stays server- and worker-safe", () => {
  const graph = sourceGraph(resolve(SRC, "headless.ts"));

  it("pulls in a real graph, not just the entry", () => {
    expect(graph.length).toBeGreaterThan(10);
  });

  it("imports React nowhere", () => {
    // A React import would make the module unusable from a plain Node script, a
    // Web Worker, or an RSC build.
    for (const file of graph) {
      const code = readFileSync(file, "utf8");
      expect(code, `${file} imports react`).not.toMatch(/from\s+"react/);
      expect(code, `${file} imports a @usefy hook`).not.toMatch(/from\s+"@usefy\/use-/);
    }
  });

  it('carries no "use client" directive', () => {
    // SPEC decision #1: the banner belongs to the React entry only. Stamping it
    // here is the known bug in @usefy/confetti, signature-pad and diff-viewer —
    // and here it would break the worker entry as well as RSC imports.
    for (const file of graph) {
      expect(readFileSync(file, "utf8"), `${file} declares "use client"`).not.toMatch(
        /^\s*["']use client["']/m,
      );
    }
  });

  it("keeps the worker entry free of React too", () => {
    for (const file of sourceGraph(resolve(SRC, "worker.ts"))) {
      const code = readFileSync(file, "utf8");
      expect(code, `${file} imports react`).not.toMatch(/from\s+"react/);
      expect(code, `${file} declares "use client"`).not.toMatch(/^\s*["']use client["']/m);
    }
  });
});

// The built output is the artifact consumers actually resolve, so it gets its
// own assertions. They run whenever `dist/` is present — locally after a build,
// and always in the release pipeline, which builds before publishing.
const built = existsSync(resolve(DIST, "headless.mjs"));

it("has a build to check when running in CI", () => {
  if (!process.env.CI) return;
  expect(built, "run `pnpm build` before `pnpm test` so dist/ can be verified").toBe(true);
});

/**
 * The ESM build code-splits shared modules into a chunk, so checking
 * `headless.mjs` alone would miss anything that reached it indirectly.
 */
function bundleGraph(entry: string): string[] {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    const code = readFileSync(file, "utf8");
    for (const match of code.matchAll(/(?:from\s*|require\()\s*["'](\.[^"']*)["']/g)) {
      queue.push(resolve(dirname(file), match[1]!));
    }
  }
  return Array.from(seen);
}

describe.skipIf(!built)("the built bundles (requires `pnpm build`)", () => {
  const headlessGraph = [
    ...bundleGraph(resolve(DIST, "headless.mjs")),
    ...bundleGraph(resolve(DIST, "headless.js")),
  ];
  const workerGraph = [
    ...bundleGraph(resolve(DIST, "worker.mjs")),
    ...bundleGraph(resolve(DIST, "worker.js")),
  ];

  it("resolves the split chunks, not just the entry files", () => {
    expect(headlessGraph.length).toBeGreaterThan(2);
  });

  it('keeps "use client" out of the headless and worker bundles', () => {
    for (const file of [...headlessGraph, ...workerGraph]) {
      expect(readFileSync(file, "utf8"), `${file} declares "use client"`).not.toContain(
        "use client",
      );
    }
  });

  it("keeps React out of the headless and worker bundles", () => {
    for (const file of [...headlessGraph, ...workerGraph]) {
      const code = readFileSync(file, "utf8");
      expect(code, `${file} imports react`).not.toMatch(/require\("react"\)|from\s*"react"/);
    }
  });

  it('does stamp "use client" on the React entry', () => {
    for (const file of ["index.js", "index.mjs"]) {
      const code = readFileSync(resolve(DIST, file), "utf8");
      expect(code.startsWith('"use client";')).toBe(true);
    }
  });

  it("keeps the sourcemap aligned after the banner was prepended", () => {
    for (const file of ["index.js.map", "index.mjs.map"]) {
      const map = JSON.parse(readFileSync(resolve(DIST, file), "utf8")) as { mappings: string };
      expect(map.mappings.startsWith(";")).toBe(true);
    }
  });
});

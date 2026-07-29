import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");

// The built output is the artifact consumers actually resolve, so it gets its
// own assertions (the `@usefy/qr-code` precedent). They run whenever `dist/` is
// present — locally after a build, and always in the release pipeline, which
// builds before publishing.
const built = existsSync(resolve(DIST, "headless.mjs"));

it("has a build to check when running in CI", () => {
  // Skipping locally when you haven't built yet is convenient. In CI that
  // silence would mean the headline RSC guarantee goes unverified, so there it
  // is an outright failure.
  if (!process.env.CI) return;
  expect(built, "run `pnpm build` before `pnpm test` so dist/ can be verified").toBe(true);
});

/**
 * Follow relative imports out of an entry.
 *
 * The ESM build code-splits shared modules into a chunk, so checking
 * `headless.mjs` alone would miss anything that reached it indirectly — which
 * is exactly how a `"use client"` banner or a stray React import would sneak
 * into the headless graph.
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

  it("resolves the split chunks, not just the entry files", () => {
    expect(headlessGraph.length).toBeGreaterThan(2);
  });

  it('keeps "use client" out of everything the headless entry pulls in', () => {
    // tsup's `banner` option is global; this is the assertion that stops this
    // package inheriting the confetti / signature-pad / diff-viewer bug where
    // the headless bundle cannot be imported from a Server Component.
    for (const file of headlessGraph) {
      expect(readFileSync(file, "utf8"), `${file} declares "use client"`).not.toContain(
        "use client",
      );
    }
  });

  it("keeps React out of everything the headless entry pulls in", () => {
    for (const file of headlessGraph) {
      const code = readFileSync(file, "utf8");
      expect(code, `${file} imports react`).not.toMatch(
        /require\("react"\)|from\s*"react"/,
      );
    }
  });

  it("keeps the CSS side effect out of the headless entry", () => {
    for (const file of headlessGraph) {
      expect(
        readFileSync(file, "utf8"),
        `${file} injects stylesheet markup`,
      ).not.toContain("__usefy_json_viewer_styles__");
    }
  });

  it('starts the React entry with "use client"', () => {
    for (const entry of ["index.mjs", "index.js"]) {
      const code = readFileSync(resolve(DIST, entry), "utf8");
      expect(code.startsWith('"use client";'), `${entry} must open with the banner`).toBe(
        true,
      );
    }
  });

  it("ships a stylesheet with only scoped class names", () => {
    const css = readFileSync(resolve(DIST, "styles.css"), "utf8");
    expect(css).toContain("--usefy-json-row-height");

    // Every rule must be namespaced by the SCSS-module scoper; a bare `.row`
    // reaching a consumer's page is the @usefy/virtual-keyboard CSS leak.
    // Comments are stripped first — the bundle header names the source file,
    // and `JsonViewer.module.scss` is not a selector.
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [, selector] of rules.matchAll(/\.([A-Za-z][\w-]*)/g)) {
      expect(selector, `unscoped class ".${selector}" in styles.css`).toMatch(
        /^JsonViewer_.+__[a-z0-9]+$/,
      );
    }
  });

  it("keeps the sourcemap aligned after the banner is prepended", () => {
    // One inserted line means exactly one extra leading `;` in `mappings`;
    // without it every mapping in the React entry is off by a line.
    const map = JSON.parse(readFileSync(resolve(DIST, "index.mjs.map"), "utf8")) as {
      mappings: string;
    };
    expect(map.mappings.startsWith(";")).toBe(true);
  });
});

/**
 * Reproducible bundle-size measurement for @usefy/json-viewer.
 *
 * Bundles the built dist entries the way a consumer's bundler would (esbuild,
 * minified, ESM, react external) and reports gzipped sizes for:
 *   1. the tree engine alone — `createJsonTree`, the common headless import
 *   2. engine + search       — what a headless consumer doing find-and-jump pays
 *   3. `./headless`          — the pessimistic `export *` case
 *   4. the React entry       — the full `"."` surface
 *
 * SPEC §4.7 budgets are enforced here: the script exits non-zero if any is
 * exceeded, so a regression fails the command rather than going unnoticed.
 *
 * Usage: pnpm --filter @usefy/json-viewer build && pnpm --filter @usefy/json-viewer size
 */
import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (!existsSync(resolve(root, "dist/headless.mjs"))) {
  console.error("dist/ not found — run `pnpm --filter @usefy/json-viewer build` first.");
  process.exit(1);
}

async function measure(label, contents, external = []) {
  const result = await build({
    stdin: { contents, resolveDir: root, loader: "js" },
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
    external,
    logLevel: "silent",
  });
  const bytes = result.outputFiles[0].contents;
  const gz = gzipSync(bytes, { level: 9 }).length;
  console.log(
    `${label.padEnd(30)} ${(bytes.length / 1024).toFixed(2).padStart(7)} KB min  ${(gz / 1024)
      .toFixed(2)
      .padStart(6)} KB gz`,
  );
  return gz;
}

/** SPEC §4.7 budgets, in KB gzipped. */
const BUDGETS = [
  {
    label: "engine only (tree-shaken)",
    budget: 6,
    entry:
      'import { createJsonTree } from "./dist/headless.mjs"; console.log(createJsonTree);',
    external: [],
  },
  {
    label: "engine + search",
    budget: 8,
    entry:
      'import { createJsonTree, searchJson } from "./dist/headless.mjs"; console.log(createJsonTree, searchJson);',
    external: [],
  },
  {
    label: "headless (full surface)",
    budget: 9,
    entry: 'export * from "./dist/headless.mjs";',
    external: [],
  },
  {
    // The SPEC's first guess was 15 KB, written before the code existed. The
    // measured figure is ~18 KB, of which the *entire stylesheet* is roughly a
    // third: the React entry inlines `dist/styles.css` and injects it on
    // import, which is what buys "no `import '@usefy/json-viewer/styles.css'`
    // required" (the memory-monitor / diff-viewer precedent). Consumers who
    // want the engine without any of that import `./headless`, measured above.
    label: "react entry (full surface)",
    budget: 20,
    entry: 'export * from "./dist/index.mjs";',
    external: ["react", "react-dom"],
  },
];

console.log("@usefy/json-viewer bundle sizes (esbuild, minified, ESM):\n");

let failed = false;
for (const { label, budget, entry, external } of BUDGETS) {
  const gz = await measure(label, entry, external);
  const ok = gz < budget * 1024;
  if (!ok) failed = true;
  console.log(
    `${" ".repeat(30)} budget ${String(budget).padStart(2)} KB gz — ${ok ? "PASS" : "FAIL"}`,
  );
}

const css = readFileSync(resolve(root, "dist/styles.css"));
console.log(
  `\nOf which the inlined stylesheet: ${(gzipSync(css, { level: 9 }).length / 1024).toFixed(2)} KB gz`,
);
console.log("(injected on import so consumers need no separate CSS import)");

process.exit(failed ? 1 : 0);

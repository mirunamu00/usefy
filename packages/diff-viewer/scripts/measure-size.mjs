/**
 * Reproducible bundle-size measurement for @usefy/diff-viewer.
 *
 * Bundles the built dist entries the way a consumer's bundler would
 * (esbuild, minified, ESM, react external) and reports gzipped sizes for:
 *   1. computeDiff-only — tree-shaken single-import from `./headless`
 *   2. headless         — the full `./headless` surface (engine + tokenizer
 *                         + hunks + option resolution)
 *   3. react entry      — the full `"."` surface (react/react-dom external)
 *
 * SPEC §4.7 targets: headless < 5 KB gz, React entry < 11 KB gz.
 *
 * Usage: pnpm --filter @usefy/diff-viewer build && pnpm --filter @usefy/diff-viewer size
 */
import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (!existsSync(resolve(root, "dist/headless.mjs"))) {
  console.error("dist/ not found — run `pnpm --filter @usefy/diff-viewer build` first.");
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
    `${label.padEnd(28)} ${(bytes.length / 1024).toFixed(2).padStart(7)} KB min  ${(gz / 1024)
      .toFixed(2)
      .padStart(6)} KB gz`,
  );
  return gz;
}

console.log("@usefy/diff-viewer bundle sizes (esbuild, minified, ESM):\n");
await measure(
  "computeDiff-only (tree-shaken)",
  'import { computeDiff } from "./dist/headless.mjs"; console.log(computeDiff);',
);
const headless = await measure("headless (full surface)", 'export * from "./dist/headless.mjs";');
const react = await measure("react entry (full surface)", 'export * from "./dist/index.mjs";', [
  "react",
  "react-dom",
]);

console.log("\nSPEC §4.7 targets: headless < 5 KB gz, react entry < 11 KB gz");
const headlessOk = headless < 5 * 1024;
const reactOk = react < 11 * 1024;
console.log(`headless: ${headlessOk ? "PASS" : "FAIL"}   react: ${reactOk ? "PASS" : "FAIL"}`);
process.exit(headlessOk && reactOk ? 0 : 1);

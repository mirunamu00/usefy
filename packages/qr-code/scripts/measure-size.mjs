/**
 * Reproducible bundle-size measurement for @usefy/qr-code.
 *
 * Bundles the built dist entries the way a consumer's bundler would (esbuild,
 * minified, ESM, react external) and reports gzipped sizes for:
 *   1. encoder-only — a tree-shaken `encodeQR` import
 *   2. SVG path     — `encodeQR` + `toSVG`, the server-rendering case
 *   3. headless     — the full `./headless` surface
 *   4. react entry  — the full `"."` surface (react/react-dom external)
 *
 * The first two are what real consumers pay: importing `encodeQR` + `toSVG`
 * does not drag in the canvas, PNG or logo code. The last two are the
 * pessimistic `export *` case and exist to catch unexpected growth.
 *
 * SPEC §4.7 budgets are enforced here — the script exits non-zero if any is
 * exceeded, so a regression fails the command rather than going unnoticed.
 *
 * Usage: pnpm --filter @usefy/qr-code build && pnpm --filter @usefy/qr-code size
 */
import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (!existsSync(resolve(root, "dist/headless.mjs"))) {
  console.error("dist/ not found — run `pnpm --filter @usefy/qr-code build` first.");
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

/** SPEC §4.7 budgets, in KB gzipped. */
const BUDGETS = [
  {
    label: "encoder only (tree-shaken)",
    budget: 5,
    entry: 'import { encodeQR } from "./dist/headless.mjs"; console.log(encodeQR);',
    external: [],
  },
  {
    label: "encoder + SVG (RSC path)",
    budget: 7,
    entry:
      'import { encodeQR, toSVGProps } from "./dist/headless.mjs"; console.log(encodeQR, toSVGProps);',
    external: [],
  },
  {
    label: "headless (full surface)",
    budget: 11,
    entry: 'export * from "./dist/headless.mjs";',
    external: [],
  },
  {
    label: "react entry (full surface)",
    budget: 13,
    entry: 'export * from "./dist/index.mjs";',
    external: ["react", "react-dom"],
  },
];

console.log("@usefy/qr-code bundle sizes (esbuild, minified, ESM):\n");

let failed = false;
for (const { label, budget, entry, external } of BUDGETS) {
  const gz = await measure(label, entry, external);
  const ok = gz < budget * 1024;
  if (!ok) failed = true;
  console.log(`${" ".repeat(28)} budget ${String(budget).padStart(2)} KB gz — ${ok ? "PASS" : "FAIL"}`);
}

process.exit(failed ? 1 : 0);

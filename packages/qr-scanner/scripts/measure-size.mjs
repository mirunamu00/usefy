/**
 * Reproducible bundle-size measurement for @usefy/qr-scanner.
 *
 * Bundles the built dist entries the way a consumer's bundler would (esbuild,
 * minified, ESM, react external) and reports gzipped sizes for the paths real
 * consumers actually take:
 *
 *   1. native-only  — the platform detector and nothing else, for an app that
 *                     targets Chrome/Android and accepts no fallback
 *   2. decode-only  — the internal engine via `decodeFile`, no React
 *   3. headless     — the full `./headless` surface (pessimistic `export *`)
 *   4. worker       — the `./worker` entry, which a page loads separately
 *   5. react entry  — the full `"."` surface (react/react-dom external)
 *
 * SPEC §4.8 budgets are enforced here — the script exits non-zero if any is
 * exceeded, so a regression fails the command rather than going unnoticed.
 *
 * Usage: pnpm --filter @usefy/qr-scanner build && pnpm --filter @usefy/qr-scanner size
 */
import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (!existsSync(resolve(root, "dist/headless.mjs"))) {
  console.error("dist/ not found — run `pnpm --filter @usefy/qr-scanner build` first.");
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

/** SPEC §4.8 budgets, in KB gzipped. */
const BUDGETS = [
  {
    label: "native detector only",
    budget: 2,
    entry:
      'import { isNativeSupported, decodeWithNative } from "./dist/headless.mjs";\n' +
      "console.log(isNativeSupported, decodeWithNative);",
    external: [],
  },
  {
    label: "decode a file (no React)",
    budget: 16,
    entry: 'import { decodeFile } from "./dist/headless.mjs"; console.log(decodeFile);',
    external: [],
  },
  {
    label: "headless (full surface)",
    budget: 18,
    entry: 'export * from "./dist/headless.mjs";',
    external: [],
  },
  {
    label: "worker entry",
    budget: 16,
    entry: 'import "./dist/worker.mjs";',
    external: [],
  },
  {
    label: "react entry (full surface)",
    budget: 22,
    entry: 'export * from "./dist/index.mjs";',
    external: ["react", "react-dom"],
  },
];

console.log("@usefy/qr-scanner bundle sizes (esbuild, minified, ESM):\n");

let failed = false;
const measured = new Map();

for (const { label, budget, entry, external } of BUDGETS) {
  const gz = await measure(label, entry, external);
  measured.set(label, gz);
  const ok = gz < budget * 1024;
  if (!ok) failed = true;
  console.log(
    `${" ".repeat(30)} budget ${String(budget).padStart(2)} KB gz — ${ok ? "PASS" : "FAIL"}`,
  );
}

/**
 * A floor as well as a ceiling, for the worker only.
 *
 * The worker entry exports nothing and exists entirely for its side effect —
 * registering a message listener. A `sideEffects: false` manifest therefore
 * gives every bundler permission to delete the whole file, and the symptom is a
 * worker that loads, reports no error, and never answers. It measured 0.02 KB
 * once; this is here so it can never do so again unnoticed.
 */
const workerSize = measured.get("worker entry") ?? 0;
if (workerSize < 4 * 1024) {
  console.error(
    `\nFAIL: the worker entry bundled to ${(workerSize / 1024).toFixed(2)} KB gz, which means it ` +
      "was tree-shaken away. Check `sideEffects` in package.json.",
  );
  failed = true;
}

process.exit(failed ? 1 : 0);

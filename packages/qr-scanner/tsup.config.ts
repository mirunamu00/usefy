import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "tsup";

/**
 * Minimal build — @usefy/qr-scanner has NO CSS pipeline (SPEC.md §4.7): the
 * viewfinder is inline styles + SVG + the Web Animations API, so nothing here
 * needs a stylesheet and `sideEffects` stays `false`.
 *
 * ONE config, THREE entries (qr-code precedent, extended):
 *  - `.`          → src/index.ts    (React layer)
 *  - `./headless` → src/headless.ts (pure TypeScript decoder)
 *  - `./worker`   → src/worker.ts   (Web Worker entry)
 *
 * Build-stability note (inherited from confetti/qr-code): running entries as an
 * ARRAY of parallel configs crashes node natively on Windows rebuilds
 * (STATUS_HEAP_CORRUPTION — racing DTS workers) and can ship stale `.d.ts`. One
 * config builds all three in a single pass. `clean` stays `false`; package.json
 * runs `rimraf dist && tsup` so dist is wiped exactly once, up front.
 *
 * ── The `"use client"` banner is PER ENTRY (SPEC.md decision #1) ──
 * tsup's `banner` option is global, so using it would stamp `"use client"` onto
 * `dist/headless.*` and `dist/worker.*` too — the known bug in @usefy/confetti,
 * @usefy/signature-pad and @usefy/diff-viewer. A worker bundle carrying a React
 * directive is not merely untidy: the headless entry must stay importable from
 * a server component and from a worker, neither of which is React. The banner
 * is applied in `onSuccess` to the `.` entry only, and `src/headless.test.ts`
 * asserts the built output stays clean.
 */

const REACT_ENTRY_OUTPUTS = ["dist/index.js", "dist/index.mjs"];
const BANNER = '"use client";\n';

/**
 * Prepend the banner and keep the sourcemap honest: a source map's `mappings`
 * field is a `;`-separated list of lines, so one extra leading `;` shifts every
 * mapping down by the exactly one line we just inserted.
 */
async function addUseClientBanner(cwd: string): Promise<void> {
  for (const relative of REACT_ENTRY_OUTPUTS) {
    const file = resolve(cwd, relative);
    if (!existsSync(file)) continue;

    const code = await readFile(file, "utf8");
    if (code.startsWith(BANNER)) continue;
    await writeFile(file, BANNER + code, "utf8");

    const mapFile = `${file}.map`;
    if (!existsSync(mapFile)) continue;
    const map = JSON.parse(await readFile(mapFile, "utf8")) as { mappings?: string };
    if (typeof map.mappings === "string") {
      map.mappings = `;${map.mappings}`;
      await writeFile(mapFile, JSON.stringify(map), "utf8");
    }
  }
}

export default defineConfig({
  entry: { index: "src/index.ts", headless: "src/headless.ts", worker: "src/worker.ts" },
  format: ["cjs", "esm"],
  dts: true,
  clean: false,
  sourcemap: true,
  external: ["react", "react-dom"],
  async onSuccess() {
    await addUseClientBanner(process.cwd());
  },
});

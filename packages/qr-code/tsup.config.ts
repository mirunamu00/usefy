import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "tsup";

/**
 * Minimal build — @usefy/qr-code has NO CSS pipeline (SPEC.md §4.6), so this
 * clones the minimal shape of the house configs (confetti / signature-pad
 * precedent) rather than the SCSS pipeline used by virtual-keyboard.
 *
 * ONE config, TWO entries (confetti/spotlight-tour precedent):
 *  - `.`          → src/index.ts    (React layer)
 *  - `./headless` → src/headless.ts (pure TypeScript encoder + renderers)
 *
 * Build-stability note (hard-won on Windows, inherited from confetti):
 * running the two entries as an ARRAY of parallel configs crashes node
 * natively on rebuilds (STATUS_HEAP_CORRUPTION — two racing DTS workers) and
 * can ship stale `.d.ts`. A single config builds both entries in one pass.
 * `clean` stays `false`; package.json runs `rimraf dist && tsup` so dist is
 * wiped exactly once, up front.
 *
 * ── The `"use client"` banner is PER ENTRY (SPEC.md resolved decision #2) ──
 * tsup's `banner` option is global, so using it would stamp `"use client"`
 * onto `dist/headless.*` as well — the known bug in @usefy/confetti,
 * @usefy/signature-pad and @usefy/diff-viewer, which makes those headless
 * bundles unimportable from a React Server Component. Server-rendering a QR
 * with zero client JS is a headline feature of this package, so the banner is
 * applied in `onSuccess` to the `.` entry only, and `src/headless.test.ts`
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
  entry: { index: "src/index.ts", headless: "src/headless.ts" },
  format: ["cjs", "esm"],
  dts: true,
  clean: false,
  sourcemap: true,
  external: ["react", "react-dom"],
  async onSuccess() {
    await addUseClientBanner(process.cwd());
  },
});

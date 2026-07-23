import { defineConfig } from "tsup";

/**
 * Minimal build — @usefy/confetti deliberately has NO CSS pipeline
 * (SPEC.md resolved decision #2: the overlay canvas is styled inline,
 * nothing themeable), so this clones the minimal shape of the house
 * configs rather than the SCSS pipeline used by virtual-keyboard.
 *
 * ONE config, TWO entries (spotlight-tour precedent):
 *  - `.`          → src/index.ts   (React layer)
 *  - `./headless` → src/headless.ts (pure TypeScript engine, zero React)
 *
 * Build-stability notes (hard-won on Windows):
 *  - Running the two entries as an ARRAY of parallel configs crashes node
 *    natively on rebuilds (STATUS_HEAP_CORRUPTION — two racing DTS workers)
 *    and can ship stale `.d.ts`. A single config builds both entries in one
 *    pass and is stable.
 *  - `clean` stays `false`; the package.json build script runs
 *    `rimraf dist && tsup` so dist is wiped exactly once, up front.
 *  - The `"use client"` banner therefore lands on both entries, exactly as
 *    in @usefy/spotlight-tour. It is an inert string literal for
 *    non-React consumers of `./headless`.
 */
export default defineConfig({
  entry: { index: "src/index.ts", headless: "src/headless.ts" },
  format: ["cjs", "esm"],
  dts: true,
  clean: false,
  sourcemap: true,
  external: ["react", "react-dom"],
  banner: { js: '"use client";' },
});

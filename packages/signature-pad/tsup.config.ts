import { defineConfig } from "tsup";

/**
 * Minimal build — @usefy/signature-pad deliberately has NO CSS pipeline
 * (SPEC.md resolved decision #2: canvas-only rendering, the guideline is
 * drawn on-canvas), so this clones the minimal shape of the house configs
 * (confetti precedent) rather than the SCSS pipeline used by
 * virtual-keyboard.
 *
 * ONE config, TWO entries (confetti/spotlight-tour precedent):
 *  - `.`          → src/index.ts    (React layer + headless re-export)
 *  - `./headless` → src/headless.ts (pure TypeScript ink engine, zero React)
 *
 * Build-stability notes (hard-won on Windows, inherited from confetti):
 *  - Running the two entries as an ARRAY of parallel configs crashes node
 *    natively on rebuilds (STATUS_HEAP_CORRUPTION — two racing DTS workers)
 *    and can ship stale `.d.ts`. A single config builds both entries in one
 *    pass and is stable.
 *  - `clean` stays `false`; the package.json build script runs
 *    `rimraf dist && tsup` so dist is wiped exactly once, up front.
 *  - The `"use client"` banner therefore lands on both entries, exactly as
 *    in @usefy/confetti. It is an inert string literal for non-React
 *    consumers of `./headless`.
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

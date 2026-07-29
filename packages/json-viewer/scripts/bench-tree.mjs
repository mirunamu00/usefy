/**
 * Engine benchmarks for @usefy/json-viewer (SPEC §4.7).
 *
 * Two jobs:
 *
 *  1. **Report the numbers SPEC §4.7 claims**, on a ~40 MB / ~4.5 M-node
 *     payload, so the claims are measured rather than asserted.
 *  2. **Choose `denseThreshold`.** The sparse index is O(e) to mutate and O(e)
 *     in memory; the Fenwick tree is O(log k) to mutate and O(k) in memory.
 *     Where the first stops being cheaper is an empirical question, and
 *     `@usefy/qr-scanner` learned the hard way that a constant defended before
 *     it is benchmarked usually costs more than it saves.
 *
 * Usage: pnpm --filter @usefy/json-viewer build && pnpm --filter @usefy/json-viewer bench
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (!existsSync(resolve(root, "dist/headless.mjs"))) {
  console.error("dist/ not found — run `pnpm --filter @usefy/json-viewer build` first.");
  process.exit(1);
}

// A bare Windows path is not a legal ESM specifier ("c:" reads as a protocol).
const { createJsonTree, searchJson, SparseOrder, DenseOrder } = await import(
  pathToFileURL(resolve(root, "dist/headless.mjs")).href
);

const RUNS = 30;

function stats(samples) {
  const sorted = samples.slice().sort((a, b) => a - b);
  return {
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
  };
}

function time(fn) {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

function bench(label, fn, runs = RUNS) {
  fn(); // warm up
  const samples = [];
  for (let i = 0; i < runs; i++) samples.push(time(fn));
  const { median, p95 } = stats(samples);
  console.log(
    `${label.padEnd(42)} ${median.toFixed(2).padStart(9)} ms   p95 ${p95.toFixed(2).padStart(8)} ms`,
  );
  return median;
}

// ── the fixture ───────────────────────────────────────────────────────────

console.log("Building the fixture…");
const RECORDS = 375_000; // ~12 nodes each → ~4.5 M nodes, ~40 MB of JSON
const records = new Array(RECORDS);
for (let i = 0; i < RECORDS; i++) {
  records[i] = {
    id: i,
    name: `user-${i}`,
    email: `user${i}@example.com`,
    active: i % 2 === 0,
    tags: [`tag-${i % 10}`, `tag-${i % 7}`],
    meta: { created: 1_700_000_000 + i, score: (i % 100) / 10 },
  };
}
const payload = { generated: true, count: RECORDS, records };
const text = JSON.stringify(payload);
console.log(`Fixture: ${(text.length / 1024 / 1024).toFixed(1)} MB of JSON\n`);

// ── the numbers SPEC §4.7 claims ──────────────────────────────────────────

console.log("Engine (median of 30 after warm-up):\n");

bench("JSON.parse the fixture", () => JSON.parse(text), 5);

bench("build the model (defaultExpandDepth: 1)", () => {
  createJsonTree(payload, { defaultExpandDepth: 1 });
});

const tree = createJsonTree(payload, { defaultExpandDepth: 1 });
tree.expand(["records"]);
console.log(`   (records expanded → ${tree.rowCount().toLocaleString()} rows)`);

bench("rowAt x 60 (one frame of rows)", () => {
  const base = 3 + Math.floor(RECORDS / 2);
  for (let i = 0; i < 60; i++) tree.rowAt(base + i);
});

bench("toggle a child inside the 375 000-item array", () => {
  tree.expand(["records", 200_000]);
  tree.collapse(["records", 200_000]);
});

// A budget of 100 000 rows refuses the 375 000-item array outright (correct,
// but it benchmarks nothing), so expandAll is measured on a subtree that fits.
{
  const fits = { records: records.slice(0, 8000) };
  bench(
    "expandAll to the 100 000-row budget",
    () => {
      createJsonTree(fits, { maxExpandedRows: 100_000 }).expandAll();
    },
    5,
  );
}

// Search: the number that matters is the longest synchronous slice, since that
// is what a dropped frame is made of. The gaps below include the yield itself
// — in Node that is `setTimeout(0)`, which a browser's `scheduler.postTask`
// beats — so the median is the honest figure and the max is dominated by GC.
{
  // Baseline: what one yield costs here, so the slice figure can be read as
  // work rather than work-plus-timer. Node falls to `setTimeout(0)`; a browser
  // uses `scheduler.postTask`, which is cheaper.
  const yieldStart = performance.now();
  for (let i = 0; i < 50; i++) await new Promise((r) => setTimeout(r, 0));
  const yieldCost = (performance.now() - yieldStart) / 50;

  const gaps = [];
  let last = performance.now();
  const started = performance.now();
  const result = await searchJson(
    payload,
    { query: "user-37400", budgetMs: 8, maxResults: 1e9 },
    (progress) => {
      if (!progress.done) gaps.push(performance.now() - last);
      last = performance.now();
    },
  );
  const total = performance.now() - started;
  const { median, p95 } = stats(gaps);
  console.log(
    `${"full search scan".padEnd(42)} ${total.toFixed(0).padStart(9)} ms total over ${gaps.length} slices`,
  );
  console.log(
    `${"  slice + yield".padEnd(42)} ${median.toFixed(2).padStart(9)} ms   p95 ${p95.toFixed(2).padStart(8)} ms   max ${Math.max(...gaps).toFixed(2)} ms (${result.paths.length} matches)`,
  );
  console.log(
    `${"  one yield (setTimeout 0 baseline)".padEnd(42)} ${yieldCost.toFixed(2).padStart(9)} ms   → slice work ~${(median - yieldCost).toFixed(2)} ms`,
  );
}

// ── choosing denseThreshold ───────────────────────────────────────────────

console.log("\nSparse vs dense index (k = 200 000 children):\n");
console.log(
  "Timed region includes CONSTRUCTION — the dense index allocates two Int32Arrays",
);
console.log(
  "of k entries whether or not anybody expanded anything, and that allocation is",
);
console.log("the cost the sparse representation exists to avoid.\n");
console.log(
  `${"expanded children (e)".padEnd(22)} ${"sparse".padStart(10)} ${"dense".padStart(10)} ${"sparse mem".padStart(12)} ${"dense mem".padStart(11)}   winner`,
);

const K = 200_000;
const OPS = 2000;

/**
 * One realistic lifetime of a container's index: build it, seed `e`
 * expansions, then run a mix of queries and toggles that keeps `e` stable.
 */
function exercise(makeIndex, e) {
  return time(() => {
    const index = makeIndex();
    const stride = Math.max(1, Math.floor(K / Math.max(1, e)));
    for (let i = 0; i < e; i++) index.set(i * stride, 3);

    for (let op = 0; op < OPS; op++) {
      const child = (op * 7919) % K;
      index.set(child, 4);
      index.locate((op * 104729) % index.totalRows());
      index.set(child, 1);
    }
  });
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

/**
 * The recommendation is **not** "the first e where dense is faster".
 *
 * Around the crossover the two are within noise of each other (tenths of a
 * millisecond) while the memory gap is three orders of magnitude, so a
 * coin-flip on timing should not cost 1.5 MB per expanded container. The
 * threshold is placed where sparse *clearly* degrades — the first e at which
 * it costs more than twice dense — and the noisy region is left to sparse.
 */
const CLEAR_LOSS = 2;
let crossover = null;
let clearLoss = null;
for (const e of [1, 16, 64, 128, 256, 512, 1024, 2048, 4096, 16_384]) {
  // Best of three: this is short enough that one GC pause decides it.
  const sparse = Math.min(
    exercise(() => new SparseOrder(K), e),
    exercise(() => new SparseOrder(K), e),
    exercise(() => new SparseOrder(K), e),
  );
  const dense = Math.min(
    exercise(() => new DenseOrder(K), e),
    exercise(() => new DenseOrder(K), e),
    exercise(() => new DenseOrder(K), e),
  );
  const winner = sparse <= dense ? "sparse" : "dense";
  if (crossover === null && winner === "dense") crossover = e;
  if (clearLoss === null && sparse > dense * CLEAR_LOSS) clearLoss = e;
  console.log(
    `${String(e).padEnd(22)} ${sparse.toFixed(2).padStart(10)} ${dense.toFixed(2).padStart(10)} ${kb(e * 3 * 8).padStart(12)} ${kb(K * 8).padStart(11)}   ${winner}`,
  );
}

console.log(
  `\nNoisy crossover (dense first faster): e = ${crossover ?? "never in this range"}`,
);
console.log(
  `Clear degradation (sparse > ${CLEAR_LOSS}x dense): e = ${clearLoss ?? "never in this range"}`,
);
console.log(
  `\n→ denseThreshold should be the largest sampled e BELOW the clear-degradation`,
);
console.log(
  `  point, so the noisy region stays sparse and keeps its memory advantage.\n`,
);

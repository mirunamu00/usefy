# QRCode Component Specification

## Overview

**Package Name:** `@usefy/qr-code` — single package with a `./headless` subpath (house pattern: confetti, virtual-keyboard, spotlight-tour, diff-viewer, signature-pad)
**Version:** `0.1.0`
**Status:** Implemented — all 4 phases complete, browser-QA'd (40/40 rendered
codes decoded by a real decoder; screenshots taken in light and dark)
**Created:** 2026-07-27
**Author:** usefy team

---

## 1. Executive Summary

### 1.1 Purpose

`@usefy/qr-code` generates QR codes in React. The core is a **hand-written
ISO/IEC 18004 encoder** — segment/mode selection → bit stream → Reed–Solomon
error correction over GF(256) → block interleaving → matrix placement → mask
selection by penalty scoring → BCH format/version info. Everything above the
matrix (SVG paths, canvas, PNG export, module/eye shapes, gradients, logo
embedding) is built on that one pure engine, so every output surface renders
the *same* matrix.

### 1.2 The gap this fills (gate ⑤ — verified 2026-07-27, not assumed)

| Incumbent | Weekly DL | Last publish | What it is |
|---|---:|---|---|
| `qrcode` (node-qrcode) | 19.2M | 2025-11 | Vanilla JS, Node-canvas coupled, callback API, not React |
| `qrcode.react` | 7.3M | 2024-12 (19 mo) | React, canvas+svg, no PNG-download helper, no styling, effectively stalled |
| `react-qr-code` | 2.3M | 2026-06 | Actively maintained, but **SVG only**, encoder is a vendored 2013 `qr.js` |
| `qr-code-styling` | 600k | — | The styling/logo niche — imperative, non-React, heavy |

QR *generation* is a healthy, crowded field — this package is **not** justified
by "nobody maintains a QR library." It is justified by the fact that the
capability set is **split across three packages that don't compose**:

> One zero-dependency TS engine + `./headless` + **SVG *and* canvas *and* PNG/Blob**
> + logo embedding **with error-correction safety validation** + module/eye shapes
> and gradients + **RSC-importable** (no `"use client"` on the headless entry) +
> StrictMode/SSR-safe + strict types.

No single package offers that today. If the implementation drifts away from
this combination, it becomes a me-too QR generator and loses its reason to
exist.

### 1.3 Target users

- **Payments / tickets / check-in** — server-rendered QR in a Next.js RSC page
  (the `./headless` `toSVGProps()` path renders with zero client JS).
- **Marketing / branded links** — logo-in-the-middle, brand-gradient QR, PNG
  download for print.
- **Wi-Fi / vCard / OTP setup UIs** — a plain `<QRCode value={uri} />`.
- **Dashboards** — canvas rendering when thousands of codes are on screen.

### 1.4 Key value propositions

1. **A real, hand-written encoder** — full ISO/IEC 18004: 4 modes, versions
   1–40, EC levels L/M/Q/H, Reed–Solomon, interleaving, 8 masks with the four
   penalty rules, BCH format/version info. Pure functions, 100% coverage
   target, validated against ISO test vectors and golden matrices.
2. **One matrix, four renderers** — SVG string, SVG-props (RSC), canvas, PNG
   dataURL/Blob. Parity by construction, not by testing alone.
3. **Styling without a second package** — module shapes, eye shapes, linear /
   radial gradients, quiet-zone control — all in the same engine, no
   imperative side library.
4. **Logo embedding that tells you when it's unsafe** — `logoSafety()` computes
   the fraction of codewords a logo occludes against the chosen EC level's
   budget and reports the minimum level that keeps the code scannable. Dev-mode
   warning when a configuration is likely to fail a scanner.
5. **RSC-first** — `./headless` carries no `"use client"` and no React in its
   graph; the SVG path can be rendered entirely on the server.
6. **Zero runtime dependencies** in the headless graph.

---

## 2. Scope & Non-Goals

### 2.1 In scope (v0.1.0 — full scope, single release)

- Encoder: numeric / alphanumeric / byte (UTF-8 with ECI 26) modes, automatic
  **mixed-segment** mode selection, versions 1–40, EC levels L/M/Q/H,
  min-version auto-selection, explicit `version` / `minVersion` overrides.
- Reed–Solomon EC over GF(256), block splitting + interleaving, remainder bits.
- Matrix: finder patterns + separators, alignment patterns, timing patterns,
  dark module, format info (BCH 15,5), version info (BCH 18,6) for v≥7.
- Mask: all 8 patterns evaluated by the four penalty rules; explicit `mask`
  override for testing/determinism.
- Renderers: `toSVG()` (string), `toSVGProps()` (RSC-safe structured output),
  `drawToCanvas()`, `toPNG()` (dataURL + Blob).
- Styling: `moduleShape` (`square | rounded | dot | classy`), `eyeShape`
  (`square | rounded | circle | leaf`), separate eye colors, solid or
  linear/radial **gradient** foreground, background (or transparent),
  `margin` (quiet zone, in modules), `moduleGap`.
- Logo: image embedded at center with `excavate` (clear the modules under it),
  `size` (fraction of the code), `padding`, `shape`, plus `logoSafety()` and a
  dev-only warning.
- React: `<QRCode />` (SVG or canvas), `useQRCode()`, imperative
  `controllerRef` for `toPNG` / `toSVG` / `download`.
- A11y: `role="img"` + `aria-label` / SVG `<title>`, or fully `aria-hidden`
  when a text alternative sits next to it.
- Dev-mode contrast check (foreground/background below scannable contrast).
- SSR-safe, StrictMode-safe, React 18 & 19, TS strict.

### 2.2 Out of scope for v0.1.0 (possible later)

- **Decoding / scanning** — that is a separate `qr-scanner` package
  (STANDALONE-IDEAS lists it as its own idea).
- Kanji mode (mode `1000`) — rarely worth the table weight; byte+UTF-8 covers
  it correctly, just less densely. Documented as a known limitation.
- Structured Append (multi-symbol QR), Micro QR, rMQR.
- 1D barcodes (Code128 / EAN) — a different engine.
- Animated / video QR, "wifi/vcard builder" helper string formatters (README
  recipes only, not API).

### 2.3 Explicit non-goals

- Not a scanner, not a decoder.
- No network calls, no telemetry, no remote logo fetching on the consumer's
  behalf beyond what the browser does for an `<img>`/`<image>` the consumer
  supplies.

---

## 3. Functional Requirements

### 3.1 Encoder

| Feature | Description | Priority |
|---|---|---|
| Mode selection | Segment the input into numeric / alphanumeric / byte runs and pick the encoding that minimizes total bits (not a single whole-string mode) | P0 |
| UTF-8 / ECI | Non-Latin-1 byte data emits ECI 26 so scanners decode UTF-8 correctly; opt out with `eci: false` | P0 |
| Version selection | Smallest version that fits at the requested EC level; honors `minVersion`; explicit `version` throws if the data doesn't fit | P0 |
| Capacity error | Over-capacity input throws `QRCapacityError` carrying `{ needed, capacity, level, maxVersion }` — never silently truncates | P0 |
| Reed–Solomon | GF(256) log/antilog tables, generator polynomials, per-block EC codewords | P0 |
| Interleaving | Group 1 / group 2 block split, codeword interleaving, remainder bits per version | P0 |
| Matrix placement | Finders + separators, alignment coordinate table, timing, dark module, reserved-area tracking | P0 |
| Masking | 8 mask patterns, four penalty rules (N1=3, N2=3, N3=40, N4=10), lowest score wins; `mask` override | P0 |
| Format / version info | BCH(15,5) format with the 0x5412 mask; BCH(18,6) version info for v≥7 | P0 |
| Binary input | Accepts `string` or `Uint8Array` (byte mode, no ECI added for explicit bytes) | P1 |
| Determinism | Same input + options → byte-identical matrix, every time | P0 |

### 3.2 Rendering

| Feature | Description | Priority |
|---|---|---|
| `toSVG()` | Standalone SVG string; modules coalesced into as few `<path>` commands as possible (horizontal run-merging) — not one `<rect>` per module | P0 |
| `toSVGProps()` | `{ viewBox, width, height, paths: [{ d, fill }], defs }` — lets a **server component** render real JSX with no `dangerouslySetInnerHTML` and no client JS | P0 |
| `drawToCanvas()` | Renders into a supplied 2D context at a given size, DPR-aware | P0 |
| `toPNG()` | `{ dataURL, blob }` at a requested pixel size / scale; offscreen canvas; typed error on a tainted canvas (cross-origin logo) | P0 |
| Render parity | SVG, SVG-props, canvas and PNG all derive from the same matrix + the same shape/geometry functions | P0 |
| Quiet zone | `margin` in **modules** (default 4, the spec minimum); `margin: 0` allowed and documented as scanner-risky | P0 |
| Crispness | Integer-aligned module geometry at the rendered size; canvas backing store at `min(dpr, 2)` (override) | P0 |

### 3.3 Styling

| Feature | Description | Priority |
|---|---|---|
| `moduleShape` | `square` (default) · `rounded` · `dot` · `classy` (rounded with joined neighbors) — neighbor-aware corner joining so shapes don't disconnect the code | P0 |
| `eyeShape` | `square` (default) · `rounded` · `circle` · `leaf`, applied to the three finder patterns independently of module shape | P1 |
| Colors | `fg`, `bg` (nullable = transparent), optional `eyeColor: { outer, inner }` | P0 |
| Gradient | `fg` accepts `{ type: "linear" \| "radial", rotation?, stops }`; emitted as SVG `<defs>` / canvas gradient — identical appearance in both | P1 |
| `moduleGap` | 0–0.3 module inset between modules (the "airy" look); hard-clamped to 0.3, and warned in dev above the **per-shape measured** ceiling (`MAX_SAFE_MODULE_GAP`) | P1 |
| Color safety | Colors pass the `isSafeCssColor` whitelist (signature-pad precedent — charset allowlist + `url()` blocklist); unsafe fg falls back to `#000`, unsafe bg → transparent, sanitized **once** so SVG/canvas/PNG always agree | P0 |
| Contrast warning | Dev-only warn below the scannable floor, judging a gradient by its **worst** stop rather than its first | P1 |
| Polarity warning | Dev-only warn when the foreground is lighter than the background — contrast is symmetric and would pass an inverted code at 21:1 | P1 |
| Quiet-zone warning | Dev-only warn when `margin` drops below the spec's 4 modules | P1 |

### 3.4 Logo

| Feature | Description | Priority |
|---|---|---|
| `logo.src` | Image URL or data URI; rendered centered above the modules | P0 |
| `logo.size` | Fraction of the code's width (default `0.2`, hard-clamped to `0.35`) | P0 |
| `logo.excavate` | Clear the modules underneath (default `true`) — improves scan rate versus overpainting | P0 |
| `logo.padding` / `logo.shape` | Quiet ring around the logo, `square \| circle` mask | P1 |
| `logoSafety(qr, opts)` | Pure: `{ occludedModules, occludedRatio, ecBudget, safe, recommendedLevel }` — exported from `./headless` so consumers can gate a UI on it | P0 |
| Dev warning | Warn once when `occludedRatio` exceeds the EC budget, naming the level that would be safe | P0 |
| Cross-origin honesty | A cross-origin logo taints the canvas → `toPNG()` throws `QRExportError` with the remedy (`crossOrigin`/data URI). Documented, tested. SVG output embeds the URL as given; `toSVG({ inlineImages: false })` is the default and the limitation is documented | P0 |

### 3.5 React layer

| Feature | Description | Priority |
|---|---|---|
| `<QRCode />` | `value`, `size`, `level`, `render="svg" \| "canvas"`, all style/logo options, `controllerRef`, `onError` | P0 |
| Memoization | The matrix is recomputed only when encoding-relevant inputs change; a module-level LRU (32 entries) makes repeat renders of the same value free | P0 |
| `useQRCode()` | `{ matrix, svg, svgProps, canvasRef, toPNG, toSVG, download, error }` — for custom rendering | P0 |
| `download()` | Triggers a file download (`png` or `svg`) with a sensible filename | P1 |
| Error surface | Encoding failure never throws during render — it sets `error` and renders `null` (+ `onError`); `throwOnError` opts into the throwing behavior | P0 |
| StrictMode / SSR | Double mount produces one canvas render, zero leaks; `renderToString` produces the full SVG markup for `render="svg"` | P0 |

### 3.6 Options (shared `QROptions`)

| Option | Default | Description |
|---|---|---|
| `level` | `"M"` | Error correction level `L \| M \| Q \| H` |
| `version` | auto | Force a symbol version 1–40 |
| `minVersion` | `1` | Floor for auto-selection (stable size across varying data) |
| `mask` | auto | Force mask 0–7 (determinism / testing) |
| `eci` | `true` | Emit ECI 26 for non-Latin-1 text |
| `margin` | `4` | Quiet zone, in modules |
| `fg` | `"#000000"` | Foreground color or gradient |
| `bg` | `"#ffffff"` | Background color; `null` = transparent |
| `moduleShape` | `"square"` | Module shape |
| `eyeShape` | `"square"` | Finder-pattern shape |
| `moduleGap` | `0` | Inset between modules (0–0.3) |
| `logo` | `undefined` | Logo options (§3.4) |
| `dpr` | `min(devicePixelRatio, 2)` | Canvas backing-store scale |

---

## 4. Technical Specifications

### 4.1 Data model

```typescript
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type QRSegmentMode = "numeric" | "alphanumeric" | "byte";

/** The encoder's output — a plain, serializable matrix. */
export interface QRMatrix {
  /** Symbol version 1–40. */
  readonly version: number;
  /** Modules per side (4 * version + 17), excluding the quiet zone. */
  readonly size: number;
  readonly level: ErrorCorrectionLevel;
  /** Applied mask pattern 0–7. */
  readonly mask: number;
  /** size*size, row-major, 1 = dark. */
  readonly modules: Uint8Array;
  /** size*size, 1 = function pattern / reserved (finders, timing, format…). */
  readonly reserved: Uint8Array;
  get(x: number, y: number): boolean;
  isReserved(x: number, y: number): boolean;
}
```

### 4.2 Pure encoder pipeline (`src/encode/` — the hand-testable core)

```typescript
/** Split text into the cheapest sequence of mode segments. */
export function segment(text: string): QRSegment[];

/** Segments → the data bit stream (mode indicators, counts, ECI, terminator, padding). */
export function buildBitStream(segments: readonly QRSegment[], version: number, level: ErrorCorrectionLevel): Uint8Array;

/** Smallest version that fits, or null. */
export function chooseVersion(segments: readonly QRSegment[], level: ErrorCorrectionLevel, minVersion: number): number | null;

/** GF(256) Reed–Solomon EC codewords for one block. */
export function rsEncode(data: Uint8Array, ecLength: number): Uint8Array;

/** Data codewords → interleaved final codeword sequence (+ remainder bits). */
export function interleave(data: Uint8Array, version: number, level: ErrorCorrectionLevel): Uint8Array;

/** Place function patterns, reserve areas, zig-zag the codewords in. */
export function buildMatrix(codewords: Uint8Array, version: number, level: ErrorCorrectionLevel): RawMatrix;

/** The four penalty rules; lower is better. */
export function penaltyScore(modules: Uint8Array, size: number): number;

/** Apply every mask, score, keep the best (or the forced one). */
export function applyBestMask(raw: RawMatrix, level: ErrorCorrectionLevel, forced?: number): QRMatrix;

/** The one public entry point. */
export function encodeQR(data: string | Uint8Array, options?: EncodeOptions): QRMatrix;
```

### 4.3 Pure render pipeline (`src/render/`)

```typescript
/** Module runs → fill paths, plus any gradient definitions they reference. */
export function matrixToPaths(matrix: QRMatrix, style: ResolvedStyle): RenderedPaths; // { paths, defs }

/** Structured SVG output — the RSC path (no string injection). */
export function toSVGProps(matrix: QRMatrix, options?: RenderOptions): QRSVGProps;

/** Standalone SVG document string. */
export function toSVG(matrix: QRMatrix, options?: RenderOptions): string;

/** Draw into a 2D context (same geometry functions as the SVG path builder). */
export function drawToCanvas(ctx: CanvasRenderingContext2D, matrix: QRMatrix, options?: CanvasRenderOptions): void;

/**
 * How much of the code a logo would occlude, vs. what the EC level can absorb.
 * Takes the same `QRStyleOptions` every other renderer takes — `margin` shifts
 * the answer, since `logo.size` is a fraction of the padded side.
 */
export function logoSafety(matrix: QRMatrix, options?: QRStyleOptions): LogoSafety;

/** Content-hashed, document-global-safe ids (decision #12). */
export function gradientId(gradient: QRGradient): string;
export function logoClipId(identity: LogoClipIdentity): string;
```

### 4.4 Headless surface (`./headless` — zero React, **no `"use client"`**)

```typescript
export { encodeQR } from "./encode";
export { toSVG, toSVGProps, drawToCanvas, matrixToPaths, logoSafety } from "./render";
export { toPNG } from "./render/png";           // browser-only, guarded
export { QRCapacityError, QRExportError } from "./errors";
export { logoSafety, gradientId, logoClipId } from "./render/ids";
export {
  warnScannability, warnUnsafeLogo, warnLowContrast,
  warnInvertedPolarity, warnQuietZone, warnModuleGap,
} from "./render/warnings";
export { QRCapacityError, QRExportError } from "./errors";
export type {
  QRMatrix, QROptions, EncodeOptions, RenderOptions, CanvasRenderOptions,
  ErrorCorrectionLevel, QRSegmentMode, QRStyleOptions, QRGradient, QRLogoOptions,
  LogoSafety, QRSVGProps, QRPath, RenderedPaths, LogoClipIdentity,
};
```

### 4.5 React surface (`.`)

```typescript
export interface QRCodeController {
  toPNG(opts?: PNGExportOptions): Promise<{ dataURL: string; blob: Blob }>;
  toSVG(opts?: RenderOptions): string;
  getMatrix(): QRMatrix | null;
  download(format?: "png" | "svg", filename?: string): Promise<void>;
}

/**
 * Everything not consumed by the component is forwarded to the rendered
 * element — `id`, `data-*`, handlers, and the whole `aria-*` family, which is
 * how a consumer overrides the `title`-derived accessibility default
 * (decision #16). `color` and `onError` are excluded because they collide with
 * this component's own props.
 */
type PassthroughAttributes = Omit<
  React.HTMLAttributes<SVGSVGElement & HTMLCanvasElement>,
  "color" | "onError" | "children" | "dangerouslySetInnerHTML"
>;

export interface QRCodeProps extends QROptions, PassthroughAttributes {
  value: string | Uint8Array;
  /** Rendered CSS size in px (square). @default 160 */
  size?: number;
  /** @default "svg" */
  render?: "svg" | "canvas";
  controllerRef?: React.Ref<QRCodeController>;
  /** Encoding failures are reported here instead of thrown. */
  onError?: (error: Error) => void;
  /** Opt into throwing during render (error boundaries). @default false */
  throwOnError?: boolean;
  /** Backing-store scale for `render="canvas"`. */
  dpr?: number;
  /** SVG `<title>`; also the default `aria-label`. */
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function QRCode(props: QRCodeProps): React.ReactNode;
export function useQRCode(options: UseQRCodeOptions): UseQRCodeReturn;
```

### 4.6 Dependencies

| Package | Purpose |
|---|---|
| — (headless) | **Zero runtime deps** |
| `@usefy/use-isomorphic-layout-effect` | React: SSR-safe canvas draw |
| `@usefy/use-latest` | React: stable `onError` / controller callbacks |
| `react` / `react-dom` (peer) | ^18 \|\| ^19 |
| `qrcode` (**devDependency only**) | Golden-matrix cross-verification in tests |

Hook reuse is genuinely thin here and that is correct — this package is an
algorithm, not a stateful UI. Composing hooks for their own sake would add
dependencies without removing logic.

No CSS pipeline → `sideEffects: false`, no `./styles.css`.

### 4.7 Performance contract

- `encodeQR` for a typical URL (v5–v8) completes in **< 1 ms**; worst case
  (v40-H, 177×177) **< 15 ms** — benchmarked in tests.
- A 32-entry module-level LRU keyed on the resolved encode inputs makes
  identical re-renders allocation-free.
- SVG output uses horizontal run-merged paths — a v10 code emits tens of path
  commands, not ~3,000 `<rect>`s.
- Bundle budgets, enforced by `scripts/measure-size.mjs` (exits non-zero on a
  regression). Measured 2026-07-27 after the second review round — re-run
  `pnpm --filter @usefy/qr-code size` and update this table whenever the
  surface changes, or it goes stale silently:

  | Import path | Measured (min+gz) | Budget |
  |---|---:|---:|
  | `encodeQR` alone | 4.32 KB | 5 KB |
  | `encodeQR` + `toSVGProps` (the RSC path) | 6.67 KB | 7 KB |
  | `./headless`, full surface | 10.50 KB | 11 KB |
  | `.` React entry, full surface | 12.35 KB | 13 KB |

  **These budgets were revised upward** from the 8 KB / 10 KB written at spec
  time, which were guesses made before the styling and logo work existed. The
  first two rows are what a real consumer pays — canvas, PNG and logo code
  tree-shakes away for anyone rendering SVG — and both came in under the
  original numbers. The full-surface rows are the pessimistic `export *` case
  covering encoder + SVG + canvas + PNG + four module shapes + four eye shapes
  + gradients + logo placement + safety analysis; the capability they
  represent currently needs `qrcode.react` (~5.5 KB) *plus* `qr-code-styling`
  (~13 KB). Zero runtime dependencies in the headless graph.

---

## 5. Architecture

### 5.1 File structure

```
packages/qr-code/
├── src/
│   ├── index.ts                 # "." surface (React)
│   ├── headless.ts              # "./headless" surface (no "use client")
│   ├── types.ts                 # options + resolveOptions (toFinite guards)
│   ├── errors.ts                # QRCapacityError, QRExportError
│   ├── encode/                  # PURE — 100% coverage target
│   │   ├── galois.ts            # GF(256) tables + polynomial math
│   │   ├── reedSolomon.ts
│   │   ├── segment.ts           # mode segmentation + cost model
│   │   ├── bitstream.ts         # BitWriter, mode/count/ECI/terminator/pad
│   │   ├── capacity.ts          # version/EC capacity + block tables
│   │   ├── interleave.ts
│   │   ├── matrix.ts            # function patterns, reserved map, zig-zag
│   │   ├── mask.ts              # 8 masks + 4 penalty rules
│   │   ├── info.ts              # BCH format + version info
│   │   └── encodeQR.ts          # the composed entry point
│   ├── render/                  # PURE (except png.ts / canvas.ts)
│   │   ├── geometry.ts          # module runs, neighbor-aware corners
│   │   ├── shapes.ts            # module + eye shape path builders
│   │   ├── paths.ts             # matrixToPaths
│   │   ├── svg.ts               # toSVG + toSVGProps
│   │   ├── gradient.ts          # shared gradient model (SVG defs ↔ canvas)
│   │   ├── canvas.ts            # drawToCanvas
│   │   ├── png.ts               # toPNG (offscreen, taint-aware)
│   │   └── logo.ts              # placement + logoSafety
│   ├── QRCode.tsx
│   ├── useQRCode.ts
│   ├── cache.ts                 # LRU
│   └── *.test.ts(x)             # co-located
├── scripts/measure-size.mjs
├── package.json                 # ".", "./headless"; sideEffects: false
├── tsup.config.ts               # ONE config, TWO entries, per-entry banner
├── SPEC.md / README.md
└── vitest.config.ts / vitest.setup.ts / tsconfig.json
```

### 5.2 Data flow

```
 value + options
      │  segment() → chooseVersion() → buildBitStream()
      ▼
 data codewords ──► rsEncode() per block ──► interleave()
      │
      ▼
 buildMatrix() (function patterns + zig-zag) ──► applyBestMask() ──► QRMatrix
      │                                                                │
      │                          ┌─────────────────────────────────────┤
      ▼                          ▼                 ▼                   ▼
  matrixToPaths()          drawToCanvas()      toSVGProps()        logoSafety()
      │                          │                 │
      ├─► toSVG() (string)       └─► toPNG()       └─► RSC <svg> JSX
      └─► <QRCode render="svg">
```

One matrix, one geometry layer, four output surfaces.

---

## 6. Development Milestones

> House loop applies: each phase ends green and passes a `usefy-reviewer`
> checkpoint (★) before the next begins. Phase 4 carries the mandatory browser
> QA (CLAUDE.md Quality bar).

### Phase 1 — Encoder core ★ (complete)
- [x] Scaffold (signature-pad parity: single tsup config, two entries, no CSS,
      `rimraf dist && tsup`, measure-size script). **Per-entry banner** so
      `dist/headless.*` ships without `"use client"`.
- [x] Types + `resolveOptions` with `toFinite`/clamp guards from day one
      (confetti Phase-1 lesson, pre-applied).
- [x] `galois` / `reedSolomon` / `capacity` tables with table-integrity tests
      (every version × level cross-checked against the spec's totals).
- [x] `segment` + `bitstream` + `interleave` + `matrix` + `mask` + `info`.
- [x] `encodeQR` composed; `QRCapacityError` on overflow.
- [x] **Tests:** ISO/IEC 18004 reference vectors; golden matrices
      cross-verified against `qrcode` (devDep) across a version/level sweep;
      determinism; mixed-mode segmentation optimality; forced version/mask;
      UTF-8 + ECI. **100% coverage on `src/encode/` (all metrics).**

### Phase 2 — Renderers, styling, logo ★ (complete)
- [x] `geometry` + `shapes` + `paths` (run-merging, neighbor-aware corners);
      golden path-string tests.
- [x] `toSVG` / `toSVGProps` (DOMParser validity, golden strings, props↔string
      parity).
- [x] `drawToCanvas` (mocked 2D context, draw-call parity with the SVG paths).
- [x] `toPNG` (offscreen replay, blob + dataURL, taint error path).
- [x] Gradients shared between SVG `<defs>` and canvas gradients.
- [x] Logo placement + excavation + `logoSafety` + dev warning.
- [x] Color sanitization (signature-pad's `isSafeCssColor`), sanitize-once
      so all surfaces agree; contrast warning.

### Phase 3 — React layer ★ (complete)
- [x] `useQRCode` (LRU-memoized matrix, stable functions, error state).
- [x] `<QRCode />` both render modes, `controllerRef`, `download`, a11y
      (`role="img"` / `<title>` / `aria-hidden` passthrough), `onError` /
      `throwOnError`.
- [x] StrictMode / SSR tests (`renderToString` yields full SVG markup; canvas
      mode draws exactly once per change; zero leaks), render-count tests.
- [x] **RSC test**: `./headless` bundle contains no `"use client"` and no
      `react` import (asserted against the built `dist/`).

### Phase 4 — Ship ★ (complete)
- [x] Storybook (interactive-first, nothing self-runs): Basic, ErrorCorrection
      comparison, StyledShapes, Gradient, WithLogo (+ live safety readout),
      CanvasVsSVG, DownloadAndCopy, WifiRecipe, DarkSurface, and an
      `!autodocs` InteractionTest.
- [x] **Browser QA with screenshots**: every story driven in a real browser,
      light **and** dark themes; **actually scan the rendered codes with a
      phone/decoder** across shapes, gradients, logo sizes and EC levels —
      a QR that renders beautifully but doesn't scan is a defect, and only a
      real decode proves it.
- [x] READMEs (package + root sibling entries), `apps/web` Phase-7 presentation
      (registry, PRODUCTS entry, `--accent-qr-code` in all three theme spots,
      card micro-demo, product-page live demo), changeset
      (`@usefy/qr-code` minor, standalone), bundle sizes recorded in the README.

---

## 7. Testing Strategy

- **Encoder (highest signal):** ISO reference vectors; golden matrices vs.
  `qrcode` across versions 1/2/7/10/25/40 × L/M/Q/H × all three modes;
  GF(256) identities; penalty-rule unit tests with hand-built patterns;
  capacity-table integrity; segmentation cost optimality; capacity overflow.
- **Renderers:** golden path strings, SVG XML validity, `toSVG` ↔ `toSVGProps`
  parity, canvas draw-call parity, PNG size/trim, taint error, gradient
  equivalence, quiet-zone geometry.
- **Logo:** occlusion math against hand-computed module counts, EC budget
  thresholds, excavation clearing exactly the intended modules.
- **React:** StrictMode, SSR markup, error surface, controller stability,
  re-render counting, LRU hit behavior.
- **Build:** assert `dist/headless.mjs` has no `"use client"` and no React.
- **Browser (Phase 4):** visual QA + **real scanner decode** of every styled
  variant.

---

## 8. Accessibility

- Default: `role="img"` with `aria-label` from `title` (or the value when it's
  a short URL); SVG also emits `<title>`.
- `aria-hidden` passthrough for the common case where visible text next to the
  code already conveys the destination — documented as the preferred pattern,
  since a raw URL read aloud is poor UX.
- README documents that a QR code must **never be the only** way to reach a
  destination (WCAG-adjacent guidance: always pair with a link or a code).
- No motion is produced → `prefers-reduced-motion` is not applicable to the
  component (the web/Storybook demos still respect it).
- Contrast: dev warning below the scannable floor; docs state the
  dark-on-light requirement (inverted codes are not reliably scannable).

## 9. Security & privacy

- No network, no telemetry. The consumer's `value` never leaves the component.
- Colors run through a charset allowlist + `url()` blocklist before reaching
  SVG or canvas (signature-pad precedent) — no CSS injection through `fg`/`bg`.
- `toSVG()` escapes `title` and any consumer string embedded in markup; the
  logo `src` is emitted as an attribute value, escaped, and documented as
  consumer-controlled (a data URI is recommended and required for PNG export).
- Cross-origin logos taint the canvas — `toPNG` throws a typed, actionable
  error rather than returning a blank image.

## 10. Success Criteria

### Functional
- [x] Codes decode correctly across the version/level space. All **160**
      combinations (1–40 × L/M/Q/H) were compared module-for-module against an
      independent encoder with zero mismatches, and a representative sweep was
      round-tripped through a real decoder.
- [x] Every styled variant still decodes — all **16** module × eye shape
      combinations, three gradients on both SVG and canvas, and a logo at the
      level's safe size, each rendered in a browser and read back by a decoder
      (40/40 browser-QA checks).
- [x] `toSVG`, `toSVGProps`, canvas and PNG produce the same visible code —
      canvas replays the identical path strings, and the exported PNG's own
      bytes were decoded in the browser.
- [x] Over-capacity input throws `QRCapacityError`; the component surfaces it
      via `onError` (once, even under StrictMode) and leaves the tree intact.
- [x] A server component renders a working QR with zero client JS — proven at
      runtime by a DOM-free (`environment: node`) test as well as by decoding
      the `toSVGProps` story.

### Non-functional
- [x] `src/encode/` 100% coverage on all metrics; `src/render` 99.5% stmts /
      98.5% branch; package 98.8% stmts overall.
- [x] Bundle budgets met — see the measured table in §4.7. Zero runtime
      dependencies in the headless graph.
- [x] `dist/headless.*` and every chunk it pulls in contain no `"use client"`
      banner and no React import (asserted against the built output).
- [x] SSR + StrictMode safe; React 18 & 19 peers; TS strict.
- [x] Browser QA evidence captured — screenshots in light and dark themes plus
      40/40 decode results, re-run green after the review-round fixes.

---

## 11. Resolved Decisions

1. **Packaging** — single package + `./headless` (5th consecutive use of the
   house pattern). No umbrella wiring (components have none). ✅
2. **`"use client"` is per-entry, not global** — the known house bug is that
   confetti / signature-pad / diff-viewer stamp the banner on their `./headless`
   bundle too, which breaks RSC imports. `qr-code` ships the banner **only** on
   the `.` entry, enforced by a build-output test. Server-rendering a QR is a
   headline feature here, so inheriting that bug is not an option. ✅
2b. **Windows build stability** — one tsup config with two entries (an array of
   configs crashes node with STATUS_HEAP_CORRUPTION on rebuild, per the confetti
   comment); the per-entry banner is applied in `onSuccess` post-processing. ✅
3. **Generator only; scanning is a separate package.** Bundling a decoder would
   double the surface and the bundle for an unrelated capability. ✅
4. **Styling is in-core, not a plugin.** The differentiator (§1.2) is precisely
   that shapes/gradients/logo live in the same engine as the encoder; a plugin
   split would recreate the `qr-code-styling` fragmentation this package
   exists to remove. ✅
5. **No Kanji mode in v0.1.0** — byte+UTF-8 encodes Japanese correctly, just
   less densely; the mode tables cost more than the density is worth at this
   stage. Documented limitation, not a silent gap. ✅
6. **Errors are surfaced, not thrown, by default** — a QR whose value is
   momentarily too long must not blank the page; `onError` + `error` state is
   the default, `throwOnError` is opt-in. ✅
7. **Logo safety is computed and reported, never silently "fixed"** — the
   package will not auto-raise the EC level behind the consumer's back
   (that would change the code's density and size unexpectedly); it reports
   `recommendedLevel` and warns in dev. ✅
8. **Colors sanitized once at resolve time** (signature-pad decision #12) so
   the screen, the SVG and the PNG can never disagree. ✅
9. **Scannability is a correctness property, not polish** — Phase 4 is not
   done until styled variants have been decoded by a real scanner. A
   beautiful unscannable QR is a shipped bug. ✅
10. **Bundle budgets are measured, not aspirational** (Phase 3) — the original
    8 KB / 10 KB targets were written before the styling and logo surface
    existed and were not met by the finished package. Rather than trimming
    spec'd features to hit a guessed number, or quietly dropping the target,
    §4.7 now records four *measured* budgets with the tree-shaken paths broken
    out, and `pnpm size` fails the build if any regresses. ✅
11. **Scannability warnings live in `render/warnings.ts`**, not in `logo.ts` as
    §5.1 first sketched — once the contrast check joined the logo check, a file
    named `logo.ts` was the wrong home for both. `logo.ts` keeps `logoSafety`
    and `loadImage`. ✅
12. **Every document-global SVG id is content-hashed** (`render/ids.ts`), for
    clip paths as well as gradients. The first implementation derived the logo
    clip id from the viewBox alone, so two codes of the same version and margin
    shared an id while having different clip circles — the second code's logo
    was clipped by the first's geometry and all but vanished. Identical
    fragments may share an id; differing ones never collide. ✅
13. **`moduleGap` ceilings are measured per shape, and warned rather than
    clamped** — each shape × gap combination is rendered by this package in a
    real browser, rasterized at **five** resolutions (180–640 px) and decoded.
    `square` holds to 0.2, `rounded`/`classy` to 0.15, `dot` to 0.05. Warning
    (not clamping) because a code rendered large or for print tolerates more
    than one on a phone, and silently overriding an explicit value is the more
    surprising behaviour. See `MAX_SAFE_MODULE_GAP` for the full table.

    *Revised in review round 2:* the first pass sampled only 180–480 px and
    concluded `square` survived the whole 0–0.3 range. Adding a 640 px sample
    showed it failing there, and at 240 px on some versions — so the ceiling
    dropped to 0.2. The bug was not just the number: with `square` at 0.3 and
    the hard clamp also at 0.3, the warning could never fire for square modules
    at all. A threshold that can't be crossed isn't a threshold. ✅
14. **`QRSVGProps` carries `shapeRendering` and the logo `clipId`** — both were
    previously re-derived at each call site, so `<QRCode />` and `toSVG()`
    could disagree about the same options. One resolved struct feeds every
    surface, as the rest of the package already did. ✅
15. **Encoding failures are reported once per distinct error**, guarded by a
    ref. StrictMode remounts effects, and a consumer's error toast firing twice
    for one failure is a bug in their app, not a dev-only artefact. ✅
16. **`QRCodeProps` forwards unknown DOM attributes** and lets an explicit
    `aria-label`/`aria-hidden` override the `title`-derived default — a
    consumer must be able to disagree with our accessibility guess, and tests
    need something to target. ✅
17. **The canvas's CSS size belongs to whoever rendered the element.** The draw
    effect owns the backing store and fills in the CSS size only when it was
    left unset, so `style={{ width: "100%" }}` survives a redraw. ✅
18. **Demos encode through `useQRCode`, never a bare `encodeQR` in render**
    (review round 2) — both the Storybook `ErrorCorrection` story and the
    `apps/web` live demo hand the visitor a text field and then called
    `encodeQR` during render. Pasting past capacity threw out of render and
    took down the Storybook canvas and the entire product-page route. The
    package's headline promise is that an over-long value is *reported*, not
    thrown; the storefront was demonstrating the opposite. Both now surface the
    `QRCapacityError` as a message and recover when the value fits again. ✅
19. **Scannability checks judge a gradient by its extreme stop, never its
    first** — this bit twice: once for contrast (`worstContrast`) and again for
    polarity (`lightestForeground`). A gradient that starts dark and ends pale
    is legible where it starts and unreadable where it ends, and `style.fg` is
    only the first stop. Any future check over a foreground colour must use one
    of these two helpers rather than reading `style.fg`. ✅

---

## 12. Appendix

### A. Related packages
- `@usefy/signature-pad` — canvas/DPR/export/color-sanitization precedents.
- `@usefy/confetti` — tsup/measure-size/banner precedents.
- `@usefy/diff-viewer` — pure-engine + golden-test precedent.
- Future `@usefy/qr-scanner` — the decode counterpart (STANDALONE-IDEAS).

### B. Prior art surveyed (2026-07-27, with live npm figures — §1.2)
- [node-qrcode](https://github.com/soldair/node-qrcode) — encoder reference.
- [qrcode.react](https://github.com/zpao/qrcode.react) — React API reference.
- [react-qr-code](https://github.com/rosskhanas/react-qr-code) — SVG-only incumbent.
- [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) — styling/logo niche.
- ISO/IEC 18004 — the specification the encoder implements.

---

*Document Version: 1.0*
*Last Updated: 2026-07-27*

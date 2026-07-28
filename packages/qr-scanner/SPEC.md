# QRScanner Component Specification

## Overview

**Package Name:** `@usefy/qr-scanner` — single package with `./headless` and
`./worker` subpaths (house pattern: confetti, virtual-keyboard, spotlight-tour,
diff-viewer, signature-pad, qr-code)
**Version:** `0.1.0`
**Status:** Implemented — phases 0–6 complete, browser-QA'd (Storybook driven in
Chromium in both themes; the live camera path proven against a fake capture
device). One item outstanding: the real-device pass, which needs hardware.
**Created:** 2026-07-28
**Author:** usefy team
**Counterpart:** `@usefy/qr-code` (the encoder — this is the decode half of the set)

---

## 1. Executive Summary

### 1.1 Purpose

`@usefy/qr-scanner` reads QR codes in React — from a **live camera** and from a
**still image** (file, drop, paste, `<img>`, `ImageData`, `Blob`). The core is a
**hand-written ISO/IEC 18004 decoder**: grayscale → adaptive binarization →
finder-pattern detection → perspective correction → grid sampling → format/version
BCH recovery → de-interleaving → **Reed–Solomon *decoding*** (syndromes →
Berlekamp–Massey → Chien → Forney) → segment parsing with ECI.

It is the mirror image of `@usefy/qr-code`, and deliberately shares that
package's GF(256) arithmetic and ISO capacity tables rather than restating them,
so the generator and the scanner can never disagree about the specification.

**Where the platform can do it, we let it.** When `BarcodeDetector` reports
`qr_code` support, the native path runs first (hardware-accelerated, zero
main-thread cost); the hand-written engine is the universal fallback and the
source of everything the native API refuses to tell you (version, EC level,
mask, raw bytes, corrected-error count, multiple symbols, mirrored symbols).

### 1.2 The reason to build it (gate ⑤ — measured 2026-07-27, not assumed)

**The QR-scanning ecosystem is healthy. This package is not justified by
"nobody maintains one," and the README/SPEC must never claim that.**

| Incumbent | Weekly DL | Last publish | What it is |
|---|---:|---|---|
| `jsqr` | 1.8M | 63 mo | Pure JS decoder, **abandoned** — the trap: the most-downloaded is the dead one |
| `html5-qrcode` | 1.2M | 39 mo | Full UI + engine, stale |
| `zxing-wasm` | 1.4M | 0.3 mo | The live core — C++ ZXing compiled to WASM |
| `@zxing/library` | 1.4M | 2.9 mo | The TS port, actively maintained |
| `barcode-detector` | 1.3M | 0.5 mo | Polyfill for the **native browser API** — the platform is absorbing this |
| `@yudiel/react-qr-scanner` | 242k | 2.5 mo | Maintained React wrapper |
| `react-zxing` | 72k | 1.8 mo | Maintained React wrapper |

The honest reasons, in order:

1. **It completes a set we already ship.** `@usefy/qr-code` generates; nothing
   reads back. Generate/scan is one capability split across two packages by
   size, not by ambition.
2. **Half the engine is already written and tested.** `galois.ts` +
   `reedSolomon.ts` give GF(256) arithmetic; `capacity.ts`, `info.ts`, `mask.ts`
   give every ISO table the decoder needs. Only the syndrome/locator half of
   Reed–Solomon and the image pipeline are new.
3. **It is the only candidate on the shortlist that is self-verifying.** Our own
   encoder produces the ground truth, so "encode all 160 version × level
   combinations, render, degrade, read back, compare" is an *automated suite* —
   gate ⑥, satisfied more completely than anything else in STANDALONE-IDEAS.
4. **Nobody composes native + fallback.** The wrappers above wrap one engine.
   `barcode-detector`'s 1.3M weekly downloads prove the demand for the native
   API; a package that uses the platform when it is there and still works when
   it isn't is a better product than either half.

### 1.3 The differentiator, stated once

> One package: **native `BarcodeDetector` when available, a hand-written
> zero-dependency TS decoder when not** + **camera *and* still image** + a
> framework-free `./headless` core + an optional **Web Worker** entry +
> full symbol metadata (version, level, mask, mirrored, ECI, corrected errors) +
> corner geometry mapped correctly onto an `object-fit: cover` video +
> StrictMode/SSR-safe React + strict types.

If the implementation drifts away from this combination — in particular, if the
camera half or the fallback engine is deferred — it becomes a me-too wrapper and
loses its reason to exist (CLAUDE.md, "Build it properly the first time").

### 1.4 Target users

- **Ticketing / check-in / POS** — a full-screen scanner with torch, camera
  switching and duplicate suppression.
- **2FA / Wi-Fi / vCard onboarding** — "scan or upload a screenshot", which is
  why still-image decoding is not optional.
- **Inventory / warehouse** — several codes in one frame, each with its position.
- **Anyone already using `@usefy/qr-code`** — the round trip in one ecosystem.

### 1.5 Key value propositions

1. **A real, hand-written decoder** — hybrid adaptive binarization, finder
   detection, homography-based sampling, BCH format recovery, Reed–Solomon error
   *correction* (not just detection), mirrored and inverted symbols, ECI, Kanji,
   Structured Append, FNC1.
2. **Native-first, never native-only** — `BarcodeDetector` where the platform
   has it, our engine everywhere else, chosen per call and reported in the result.
3. **Camera done properly** — permission states, device enumeration and
   switching, torch, pause on tab-hide, guaranteed track teardown, no leaked
   green light after unmount.
4. **Geometry you can actually draw with** — corners in source-image pixels
   *and* a helper that maps them to the rendered element through `object-fit`,
   so an overlay box lands on the code instead of near it.
5. **Verifiable correctness** — the counterpart encoder is the oracle; every
   claim in §10 is a test result, not an opinion.
6. **Zero runtime dependencies** beyond `@usefy/*` workspace packages.

---

## 2. Scope & Non-Goals

### 2.1 In scope (v0.1.0 — full scope, single release)

- **Image pipeline:** any `ImageSource` (`HTMLVideoElement`, `HTMLImageElement`,
  `HTMLCanvasElement`, `OffscreenCanvas`, `ImageBitmap`, `ImageData`, `Blob`/
  `File`, data/blob URL) → luminance → binary bitmap. Hybrid local binarizer +
  Otsu global, custom-binarizer seam, optional working-resolution downscale,
  optional `region` crop.
- **Detection:** finder-pattern scan with cross-checks, candidate clustering,
  triple grouping, corner ordering, module-size and dimension estimation,
  bottom-right alignment-pattern search, 4-point homography (3-point similarity
  fallback for v1 / missing alignment), grid sampling.
- **Bit decode:** format info (BCH(15,5), both copies, min-Hamming over the 32
  legal words), version info (BCH(18,6), v≥7), unmasking, zig-zag codeword read
  using the encoder's reserved-module map, de-interleaving, **Reed–Solomon
  decoding**, refusing on locator degree > ⌊ec/2⌋ or a root count that
  disagrees with it (decision #11), plus a post-correction syndrome check kept
  as an invariant guard.
- **Segment parsing:** numeric, alphanumeric, byte, **Kanji** (via
  `TextDecoder("shift_jis")` — no table shipped), ECI (charset applied via
  `TextDecoder`, raw bytes always retained), Structured Append (reported +
  `joinStructuredAppend()` helper), FNC1 position 1 / position 2 (flagged, data
  untouched), terminator/padding tolerance.
- **Robustness passes:** mirrored symbols, inverted (light-on-dark) symbols,
  arbitrary rotation, moderate perspective, blur and noise within the EC budget.
- **Multi-symbol:** decode up to `maxSymbols` codes per frame (default 1).
- **Native engine:** `BarcodeDetector` adapter + capability probe + documented
  metadata gaps; `engine: "auto" | "native" | "internal"`.
- **Worker:** `@usefy/qr-scanner/worker` entry, consumer-constructed `Worker`
  (bundler-friendly, CSP-safe — no blob URLs), transferable buffers.
- **Camera:** `getUserMedia` lifecycle, device enumeration + switching, facing
  mode, torch, pause/resume, tab-visibility pause, teardown on unmount,
  `requestVideoFrameCallback` when available (rAF otherwise), decode-rate
  throttle, in-flight skip.
- **React:** `<QRScanner />` (video + viewfinder overlay + controls + states),
  `useQRScanner()`, `decodeImage()` / `decodeFile()`, `controllerRef`.
- **Still-image fallback in the component** — when the camera is unsupported or
  denied, the component offers file selection / drop / paste instead of dead-ending.
- **A11y:** keyboard-operable controls, `role="status"` announcement of results,
  `prefers-reduced-motion`-respecting viewfinder, visible focus, both themes.
- SSR-safe, StrictMode-safe, React 18 & 19, TS strict, zero-CSS build.

### 2.2 Out of scope for v0.1.0 (possible later)

- 1D barcodes and non-QR 2D symbologies (Code128, EAN, DataMatrix, PDF417,
  Aztec) — a different engine. The native path *could* return them; we do not
  expose that, because the fallback engine cannot, and an API whose capabilities
  depend on the browser is a trap. Documented explicitly.
- Micro QR / rMQR — different geometry and tables.
- Structured Append **joining across frames/sessions** beyond the pure helper.
- Video-file scrubbing, PDF input, server-side (Node) decoding as a supported
  target — the headless engine is DOM-free and will work where an `ImageData`
  can be produced, but Node is not a tested target in v0.1.0.
- Continuous "scan history" UI, sound/vibration feedback (recipes in the README).

### 2.3 Explicit non-goals

- **Not a generator.** `@usefy/qr-code` is.
- **No network, no telemetry, no frame upload.** Camera frames never leave the
  device and are never retained after a decode.
- **The component never acts on a scanned value** — it does not navigate, open,
  copy or fetch. A QR payload is untrusted input; acting on it is the
  consumer's decision (§9).

---

## 3. Functional Requirements

### 3.1 Image pipeline (`src/image/`)

| Feature | Description | Priority |
|---|---|---|
| Source normalization | Every `ImageSource` → `ImageData` through one path; `Blob`/`File`/URL via `createImageBitmap` with an `<img>` fallback | P0 |
| Luminance | BT.601 luma into a `Uint8ClampedArray`, single pass, no intermediate allocation per frame (reusable buffers) | P0 |
| Downscale | Optional box-filter downscale to `maxDimension` (default 800 px longest side) — a decode budget, not a quality cap; disabled with `maxDimension: 0` | P0 |
| Region | `region: { x, y, width, height }` crop in source pixels; results are reported back in **full-source** coordinates | P1 |
| Hybrid binarizer | 8×8 block black points + 5×5 neighbourhood averaging, low-dynamic-range blocks inherit the neighbourhood — the workhorse for photos and uneven lighting | P0 |
| Otsu binarizer | Global threshold; automatic for images smaller than 5 blocks per side, and selectable | P0 |
| Binarizer seam | `binarize?: (gray: GrayImage) => BitMatrix` — bring your own (diff-viewer's highlighter-seam precedent) | P2 |
| Buffer reuse | The luminance plane — the biggest per-frame allocation — is allocated once per frame *size* and reused; `toGray` takes a subarray of whatever it is handed, so one buffer sized for the full frame serves every working resolution | P1 |

### 3.2 Detection (`src/detect/`)

| Feature | Description | Priority |
|---|---|---|
| Finder scan | Row-wise run-length state machine matching 1:1:3:1:1 within tolerance; vertical **and** diagonal cross-checks reject false positives | P0 |
| Sub-pixel centres | Centres refined from run midpoints, not integer pixels — the difference between a v20 symbol sampling correctly and not at all | P0 |
| Clustering | Candidates merged by proximity + module-size agreement, ranked by hit count | P0 |
| Triple grouping | Candidate triples validated by module-size similarity and right-isoceles geometry; supports several symbols in one frame | P0 |
| Corner ordering | Longest side ⇒ hypotenuse ⇒ TL; the cross-product sign then fixes TR/BL as the normally-handed labelling. Mirroring is *not* decidable here (decision #6) — it is settled by the format word during decoding | P0 |
| Dimension estimate | From finder spacing / module size, snapped to `4v+17`, clamped 21–177; rejected if inconsistent with the estimated module size | P0 |
| Alignment search | Predicted bottom-right centre, windowed 1:1:1 search with widening radius; absence is not fatal | P0 |
| Perspective | 4-point homography (square↔quad composition); 3-point similarity fallback (v1 or no alignment pattern) | P0 |
| Sampling | Module centres through the inverse transform; 5-point majority sampling option for low-resolution frames | P0 |
| Rejection | Every stage returns a typed reason (`no-finder`, `bad-geometry`, `dimension-mismatch`, …) surfaced in dev diagnostics rather than a bare `null` | P1 |

### 3.3 Bit decode (`src/decode/`)

| Feature | Description | Priority |
|---|---|---|
| Format info | Both copies read; each corrected by minimum Hamming distance over the 32 legal masked words (≤3 bit errors); disagreement resolved by distance, not by order | P0 |
| Version info | v≥7 reads both 18-bit copies with BCH(18,6) correction; smaller versions derive the version from the dimension | P0 |
| Unmask | `maskAt()` from `@usefy/qr-code` — the same function the encoder masked with | P0 |
| Codeword read | Zig-zag traversal skipping function modules, using the encoder's reserved map so placement can never diverge | P0 |
| De-interleave | Inverse of `interleave()`, driven by `ecCodewordsPerBlock` / `numEcBlocks` from `@usefy/qr-code` | P0 |
| Reed–Solomon decode | Syndromes → Berlekamp–Massey → Chien search → Forney; corrects up to `⌊ec/2⌋` errors per block; **refuses** when the locator's degree exceeds that budget or its root count disagrees with its degree (decision #11) | P0 |
| Error reporting | `errorsCorrected` per symbol (sum over blocks) — a quality signal a UI can act on | P1 |
| Bit reader | Big-endian bit reader with bounds errors, never silent zero-fill | P0 |
| Modes | numeric, alphanumeric, byte, Kanji, ECI, Structured Append, FNC1(1), FNC1(2), terminator | P0 |
| Charset | ECI-driven `TextDecoder`; no ECI ⇒ UTF-8 if the bytes are valid UTF-8, else ISO-8859-1 (what real scanners do); `bytes` always available regardless | P0 |
| Kanji | 13-bit values → Shift-JIS byte pairs → `TextDecoder("shift_jis")`; if the runtime lacks the encoding, the segment reports raw bytes and `mode: "kanji"` instead of throwing | P1 |
| Structured Append | `{ index, total, parity }` reported; `joinStructuredAppend(results)` validates parity and order and concatenates | P1 |
| Failure typing | `QRDecodeError` with a `stage` (`detect` \| `format` \| `ec` \| `parse`) and a human-readable reason | P0 |

### 3.4 Engine selection (`src/engine.ts`, `src/native.ts`)

| Feature | Description | Priority |
|---|---|---|
| Capability probe | `isNativeSupported()` — `BarcodeDetector` present **and** `getSupportedFormats()` includes `qr_code`; probed once, cached, never on the server | P0 |
| `engine: "auto"` | Native when supported, internal otherwise. **Still images**: if native finds nothing, the internal engine re-runs before reporting failure (recall beats a few ms). **Camera**: the frame pump passes `fallbackToInternal: false`, so an empty frame costs one engine rather than two; after 12 consecutive empty frames the session switches to internal for good (`NATIVE_MISS_STREAK` in `useQRScanner.ts`) | P0 |
| `engine: "native"` | Never falls back; throws `QRUnsupportedError` where unavailable | P1 |
| `engine: "internal"` | Always our engine — the deterministic mode tests and CI use | P0 |
| Metadata honesty | Native results carry `engine: "native"` and **no** `symbol` metadata (the API does not expose version/level/mask) and no `bytes`. Anything the native API cannot answer forces the internal engine — `binary`, `sampling: "majority5"`, a function `binarizer`, `invert: "always"`, **and `region`/`maxDimension`**, which the detector takes no instruction about. Documented, not silently degraded | P0 |
| Worker client | `createWorkerDecoder(worker)` — same contract, `ImageData` buffers transferred both ways, sticky failure so a dead worker fails fast rather than hanging, terminate-safe. Concurrency is *not* capped: the camera loop already serialises decodes, and capping would silently queue a direct caller's work | P1 |

### 3.5 Camera (`@usefy/use-user-media` + the frame pump in `src/useQRScanner.ts`)

| Feature | Description | Priority |
|---|---|---|
| Acquisition | `getUserMedia` with `facingMode: "environment"` preferred, explicit `deviceId` override, consumer `constraints` merge | P0 |
| Permission states | `idle \| prompting \| granted \| denied \| unsupported \| error`, derived from the `getUserMedia` outcome. **The Permissions API is deliberately not consulted**: `navigator.permissions.query({ name: "camera" })` is unimplemented in Safari and Firefox, so it would report `unsupported` on the two browsers whose users most need a clear answer, and where it *does* work it only tells you what the next `getUserMedia` would have told you anyway | P0 |
| Devices | Enumerated **after** the first grant (labels are empty before it), live `devicechange` updates, `switchCamera()` cycling | P0 |
| Torch | Capability-probed (`track.getCapabilities().torch`), toggled via `applyConstraints`, **forced off before the track stops** | P1 |
| Frame pump | `requestVideoFrameCallback` when available, `requestAnimationFrame` otherwise; decode throttled to `scanRate` (default 12/s); frames dropped while a decode is in flight | P0 |
| Visibility | Decoding pauses on `visibilitychange` (`@usefy/use-page-visibility`); `stopOnHide` optionally releases the camera entirely | P1 |
| Teardown | Every track stopped on unmount, on `stop()`, and on stream replacement — verified by test, because a leaked camera light is the single most visible bug this package can ship | P0 |
| Errors | `QRCameraError` carrying the `DOMException` name mapped to an actionable reason (`NotAllowedError` → denied, `NotReadableError` → in use by another app, `OverconstrainedError` → no such camera) | P0 |

### 3.6 React layer

| Feature | Description | Priority |
|---|---|---|
| `<QRScanner />` | Video + viewfinder overlay + status/error surface + controls (torch, camera switch, file fallback); `onScan`, `onError`, `paused`, `deviceId`, `facingMode`, `constraints`, `scanRate`, `engine`, `maxSymbols`, `dedupeMs`, `controllerRef` | P0 |
| Overlay | SVG corner brackets + a highlight quad that tracks the detected symbol, drawn from mapped corners; sweep animation via WAAPI, suppressed under `prefers-reduced-motion` | P0 |
| Coordinate mapping | `mapCorners(result, video)` accounts for intrinsic vs. rendered size, `object-fit`, mirroring of front cameras, and `region` cropping | P0 |
| Dedupe | `onScan` fires once per distinct value within `dedupeMs` (default 1500); `onFrame` exposes every decode for consumers that want raw throughput | P1 |
| `useQRScanner()` | `{ videoRef, state, result, results, error, devices, deviceId, selectDevice, switchCamera, torch, setTorch, isTorchAvailable, start, stop, pause, resume, scanFile, engine }` | P0 |
| `decodeImage()` / `decodeFile()` | Standalone one-shot helpers (headless, no React) | P0 |
| Controller | `controllerRef` → `{ start, stop, pause, resume, scanFile, capture }` (all async where they touch pixels) | P1 |
| Error surface | Camera/decoder failures set `error` and render a recoverable state; they never throw during render (`throwOnError` opts in) — qr-code decision #6, inherited | P0 |
| Uncontrolled/controlled | `paused` is controllable (`paused` + `defaultPaused` + `onPausedChange`) via `@usefy/use-controllable-state` | P2 |
| StrictMode / SSR | Double mount acquires exactly one stream and leaks nothing; server render emits the static shell with no camera access | P0 |

### 3.7 Options (shared `QRScanOptions`)

| Option | Default | Description |
|---|---|---|
| `engine` | `"auto"` | `auto \| native \| internal` (§3.4) |
| `maxSymbols` | `1` | Symbols to decode per image |
| `maxDimension` | `800` | Working-resolution cap in px (`0` = none) |
| `binarizer` | `"hybrid"` | `hybrid \| otsu \| (gray) => BitMatrix` |
| `invert` | `"auto"` | Second pass for light-on-dark symbols, run only when the normal reading found nothing. The camera loop paces it (one frame in four) by passing `never` on the others, so the pure decode path keeps no hidden state |
| `mirror` | `"auto"` | Handedness is detected; `always`/`never` force it for testing |
| `region` | — | Crop rect in source pixels |
| `sampling` | `"center"` | `center \| majority5` |
| `scanRate` | `12` | Max decodes per second (camera) |
| `dedupeMs` | `1500` | Suppression window for repeated values |
| `binary` | `false` | Skip text decoding; forces the internal engine |
| `signal` | — | `AbortSignal` for one-shot decodes |

---

## 4. Technical Specifications

### 4.1 Data model

```typescript
export interface Point { readonly x: number; readonly y: number }

export type QRScanEngine = "native" | "internal";
export type QRDecodeStage = "detect" | "format" | "ec" | "parse";

/** One decoded segment, exactly as the symbol carried it. */
export interface QRScanSegment {
  readonly mode: "numeric" | "alphanumeric" | "byte" | "kanji";
  /** Decoded text, when the segment's charset could be applied. */
  readonly text?: string;
  readonly bytes: Uint8Array;
  /** ECI in effect for this segment, when one was declared. */
  readonly eci?: number;
}

/** Symbol-level facts only the internal engine can report. */
export interface QRSymbolInfo {
  readonly version: number;      // 1–40
  readonly size: number;         // 4v + 17
  readonly level: ErrorCorrectionLevel;
  readonly mask: number;         // 0–7
  readonly mirrored: boolean;
  readonly inverted: boolean;
  readonly errorsCorrected: number;
  readonly structuredAppend?: { index: number; total: number; parity: number };
  readonly fnc1?: "gs1" | "aim";
}

export interface QRScanResult {
  readonly text: string;
  readonly bytes: Uint8Array;
  readonly segments: readonly QRScanSegment[];
  /** Absent for native results — the API does not expose it (§3.4). */
  readonly symbol?: QRSymbolInfo;
  /** TL, TR, BR, BL in **source-image** pixels. */
  readonly corners: readonly [Point, Point, Point, Point];
  readonly center: Point;
  readonly engine: QRScanEngine;
  /** `performance.now()` at decode time. */
  readonly timestamp: number;
}
```

### 4.2 Pure decode pipeline (`src/image/`, `src/detect/`, `src/decode/` — the hand-testable core)

```typescript
/** RGBA → luminance, with optional downscale and crop. */
export function toGray(image: ImageData, options?: GrayOptions): GrayImage;

/** Luminance → 1-bit bitmap. */
export function binarize(gray: GrayImage, mode?: BinarizerMode): BitMatrix;

/** Every finder-pattern candidate, sub-pixel, with its estimated module size. */
export function findFinderPatterns(bits: BitMatrix, limit?: number): FinderCandidate[];

/** Candidates → ordered {topLeft, topRight, bottomLeft} triples. Needs the image
    to measure module size along the symbol's own axes (§3.2). */
export function groupFinders(bits: BitMatrix, candidates: readonly FinderCandidate[], limit?: number): FinderTriple[];

/** Module counts worth trying, most likely first — the estimate is biased on a
    blurred or downscaled image, by four modules at version 40. */
export function dimensionCandidates(topLeft: Point, topRight: Point, bottomLeft: Point, moduleSize: number): number[];

/** Locate the bottom-right alignment pattern near its predicted centre. */
export function findAlignmentPattern(bits: BitMatrix, predicted: Point, moduleSize: number, radius?: number): Point | null;

/** Projective map between two quadrilaterals, in module and image coordinates. */
export class PerspectiveTransform {
  static quadToQuad(source: Quad, destination: Quad): PerspectiveTransform;
  map(x: number, y: number): Point;
}

/** Sample module centres through the transform → a module grid, or `null` when
    the symbol runs off the edge of the image. */
export function sampleGrid(bits: BitMatrix, transform: PerspectiveTransform, dimension: number, mode?: SamplingMode): ModuleGrid | null;

/** Format word from both copies, BCH-corrected; the cleaner copy wins. */
export function readFormatInfo(grid: ModuleGrid): FormatInfo | null;

/** Version from both copies (v≥7), BCH-corrected; falls back to the size (§3.3). */
export function readVersion(grid: ModuleGrid): number | null;

/** Unmask + zig-zag read + de-interleave + Reed–Solomon → the data codewords. */
export function readCodewords(grid: ModuleGrid, version: number, level: ErrorCorrectionLevel, mask: number): DecodedCodewords;

/** Correct one block. Throws `QRDecodeError("ec")` beyond capacity. */
export function rsDecode(received: Uint8Array, ecLength: number): RSDecodeResult;

/** Codewords → segments, plus the stream-level facts (ECI, Structured Append, FNC1). */
export function parseSegments(data: Uint8Array, version: number): ParsedBitStream;

/** Module grid → a full result (the composed bit-level entry point). */
export function decodeMatrix(grid: ModuleGrid, options?: DecodeMatrixOptions): QRScanResult;

/** Pixels → results. Pure and DOM-free: the worker and the tests use this. */
export function decodeImageData(image: ImageData, options?: DecodeImageDataOptions): QRScanResult[];

/** The public image-level entry point — normalizes the source and picks an engine. */
export function decode(source: ImageSource, options?: DecodeOptions): Promise<QRScanResult[]>;
```

### 4.3 What is reused from `@usefy/qr-code`, and what is new

| Concern | Source |
|---|---|
| GF(256) arithmetic (`gfMul`, `gfDiv`, `gfExp`, `gfLog`, `polyMul`) | **reused** (`encode/galois`) |
| Generator polynomials / `rsEncode` | reused for tests (round-trip fixtures) |
| Capacity + block tables (`ecCodewordsPerBlock`, `numEcBlocks`, `totalCodewords`, `dataCodewords`) | **reused** (`encode/capacity`) |
| `versionSize`, `alignmentPatternPositions`, `charCountBits`, `MODE_INDICATOR`, `ALPHANUMERIC_CHARSET`, `EC_FORMAT_BITS` | **reused** |
| `maskAt`, function-pattern/reserved map | **reused** (`encode/mask`, `encode/matrix`) |
| `formatInfoBits`, `versionInfoBits` | **reused** — the decoder corrects by distance to these 32/40 legal words, generated rather than tabulated |
| Reed–Solomon **decoding** (syndromes, Berlekamp–Massey, Chien, Forney) | **new** |
| Whole image pipeline, detection, sampling | **new** |
| Segment **parsing** (the inverse of `bitstream`/`segment`) | **new** |

Six of these are not currently exported from `@usefy/qr-code/headless`
(`gf*`/`polyMul`, `ecCodewordsPerBlock`, `numEcBlocks`, `totalCodewords`,
`MODE_INDICATOR`, `EC_FORMAT_BITS`, `formatInfoBits`, `versionInfoBits`, and the
reserved-module map). Phase 0 widens that surface **additively** — a `minor`
changeset on `@usefy/qr-code` (0.2.0 → 0.3.0). See decision #2.

### 4.4 Headless surface (`./headless` — zero React, **no `"use client"`**)

```typescript
export { decodeImage, decodeMatrix, decodeFile } from "./decode";
export { toGray, binarize, otsuThreshold, hybridBinarize } from "./image";
export { findFinderPatterns, groupFinders, findAlignmentPattern,
         perspectiveTransform, sampleGrid } from "./detect";
export { rsDecode, readFormatInfo, readVersion, readCodewords,
         parseSegments } from "./decode";
export { isNativeSupported, decodeWithNative } from "./native";
export { createWorkerDecoder } from "./worker-client";
export { joinStructuredAppend, mapCorners } from "./utils";
export { QRDecodeError, QRCameraError, QRUnsupportedError } from "./errors";
export type { QRScanResult, QRScanSegment, QRSymbolInfo, QRScanOptions,
              QRScanEngine, QRDecodeStage, ImageSource, BitMatrix, GrayImage,
              Point, Quad, Transform } from "./types";
```

### 4.5 Worker surface (`./worker`)

```typescript
// consumer code — bundler-resolvable, no blob URL, CSP-safe
const worker = new Worker(new URL("@usefy/qr-scanner/worker", import.meta.url), { type: "module" });
const decoder = createWorkerDecoder(worker);          // same contract as decodeImage
<QRScanner decoder={decoder} />                        // or pass to useQRScanner
```

The worker entry imports only `./headless` (no React, no DOM APIs beyond
`ImageData`), receives `{ id, imageData, options }`, transfers the pixel buffer
in both directions, and answers `{ id, results }` or `{ id, error }`.

### 4.6 React surface (`.`)

```typescript
export interface QRScannerController {
  start(): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  scanFile(file: Blob): Promise<QRScanResult[]>;
  capture(): Promise<ImageData | null>;
}

export interface QRScannerProps extends QRScanOptions,
  Omit<React.HTMLAttributes<HTMLDivElement>, "onError" | "children"> {
  onScan: (result: QRScanResult, all: readonly QRScanResult[]) => void;
  onError?: (error: Error) => void;
  onFrame?: (results: readonly QRScanResult[]) => void;
  paused?: boolean;
  facingMode?: "environment" | "user";
  deviceId?: string;
  constraints?: MediaTrackConstraints;
  /** Camera off entirely; file / drop / paste only. */
  source?: "camera" | "file";
  showTorch?: boolean;        // default: when the device supports it
  showSwitch?: boolean;       // default: when >1 camera exists
  showFileFallback?: boolean; // default: true when the camera is unavailable
  decoder?: Decoder;          // e.g. a worker decoder
  controllerRef?: React.Ref<QRScannerController>;
  throwOnError?: boolean;
  children?: React.ReactNode; // rendered inside the viewfinder, above the video
}

export function QRScanner(props: QRScannerProps): React.ReactNode;
export function useQRScanner(options: UseQRScannerOptions): UseQRScannerReturn;
```

### 4.7 Dependencies

| Package | Purpose |
|---|---|
| `@usefy/qr-code` | GF(256) + ISO tables + `maskAt` (§4.3). Tree-shaken; the React entry of qr-code is never touched |
| `@usefy/use-user-media` | Camera stream lifecycle (**new hook — decision #3**) |
| `@usefy/use-permission` | Camera permission state |
| `@usefy/use-page-visibility` | Pause on tab hide |
| `@usefy/use-event-listener` | `devicechange`, drop/paste handlers |
| `@usefy/use-latest`, `@usefy/use-event-callback` | Stable `onScan`/`onError` without re-subscribing the frame pump |
| `@usefy/use-isomorphic-layout-effect` | SSR-safe video wiring |
| `@usefy/use-controllable-state` | `paused` |
| `@usefy/use-reduced-motion` | Viewfinder animation |
| `react` / `react-dom` (peer) | ^18 \|\| ^19 |
| `@usefy/qr-code` (**dev use too**) | The oracle: `encodeQR` generates test ground truth |
| `jsqr`, `zxing-wasm` (**devDependencies**) | Second-opinion cross-checks on the corpus |

No CSS pipeline: the overlay is inline styles + SVG + WAAPI, so there is no
`./styles.css` (qr-code precedent, and it sidesteps the known `:global()` scoper
bug entirely).

`sideEffects` is **not** `false`, though — it lists the `./worker` entry, which
exists purely for the listener it registers and which a blanket `false` gives
every bundler permission to delete. See §4.8.

### 4.8 Performance contract

**Measured, not guessed** (qr-code decision #10: a budget invented before the
code exists either gets quietly dropped or costs the package a feature). Both
scripts ship with the package: `pnpm size` and `pnpm bench`.

**Decode time** — median / p95 of 30 runs after warm-up, `pnpm bench`:

| Frame | Median | p95 |
|---|---:|---:|
| 640 × 480, version 3 | 2.3 ms | 3.3 ms |
| 1280 × 720, version 3 | 5.7 ms | 8.0 ms |
| 1280 × 720, version 10 | 6.2 ms | 7.7 ms |
| 1920 × 1080, version 40 | 14.8 ms | 15.5 ms |
| 640 × 480, no symbol present | 3.8 ms | 5.8 ms |
| 4000 × 3000 photo, version 3 | 53.1 ms | 62.1 ms |

At the default 12 decodes per second a frame has 83 ms; every camera-sized case
above fits several times over, which is why the preview stays smooth without a
worker. `BarcodeDetector`, where it exists, costs the main thread nothing at all.

**Two findings the benchmark produced, both of which changed the code:**

1. **Downscaling only pays past ~2.5×.** Reading every source pixel costs about
   what one detection pass over those pixels costs, so a modest reduction is a
   straight loss: capping 1280 × 720 to 800 px measured *slower* than not
   capping. `maxDimension` now applies only past that ratio (`luminance.ts`),
   which made every row above 1.3–4× faster.
2. **The resampler had to be separable.** Computing area weights inside the
   inner loop cost more than the analysis it fed; precomputing them per axis
   cut the 12 MP case from 72 ms to 53 ms.

**Bundle sizes** — `pnpm size`, esbuild, minified, ESM, gzipped:

| Import path | Measured | Budget |
|---|---:|---:|
| Native detector only | 1.19 KB | 2 KB |
| `decodeFile` (internal engine, no React) | 12.58 KB | 16 KB |
| `./headless`, full surface | 14.36 KB | 18 KB |
| `./worker` entry | 11.41 KB | 16 KB |
| `.` React entry, full surface | 20.57 KB | 22 KB |

The worker row also has a **floor**: it exists purely for its side effect, so a
`sideEffects: false` manifest lets bundlers delete it entirely — which happened,
and measured 0.02 KB. `pnpm size` now fails if it ever collapses again.

---

## 5. Architecture

### 5.1 File structure

```
packages/qr-scanner/
├── src/
│   ├── index.ts                  # "." surface (React, "use client")
│   ├── headless.ts               # "./headless" surface (no banner, no React)
│   ├── worker.ts                 # "./worker" entry
│   ├── types.ts
│   ├── errors.ts                 # QRDecodeError / QRCameraError / QRUnsupportedError
│   ├── image/
│   │   ├── source.ts             # ImageSource → ImageData (bitmap/img/canvas paths)
│   │   ├── luminance.ts          # BT.601 + downscale + crop, reusable buffers
│   │   ├── binarize.ts           # hybrid + otsu
│   │   └── bitmatrix.ts          # packed 1-bit bitmap
│   ├── detect/
│   │   ├── finder.ts             # 1:1:3:1:1 scan, cross-checks, sub-pixel centres
│   │   ├── group.ts              # clustering, triples, corner order, handedness
│   │   ├── alignment.ts
│   │   ├── perspective.ts        # homography + inverse
│   │   └── sample.ts             # grid sampling → BitGrid
│   ├── decode/
│   │   ├── format.ts             # BCH(15,5) / BCH(18,6) recovery
│   │   ├── codewords.ts          # unmask, zig-zag read, de-interleave
│   │   ├── rsDecode.ts           # syndromes, Berlekamp–Massey, Chien, Forney
│   │   ├── bitreader.ts
│   │   ├── segments.ts           # modes, ECI, kanji, structured append, FNC1
│   │   └── decodeMatrix.ts
│   ├── decodeImage.ts            # detect + decode + invert/mirror passes + multi-symbol
│   ├── native.ts                 # BarcodeDetector adapter + probe + typings
│   ├── engine.ts                 # auto selection, miss-streak policy
│   ├── worker-client.ts          # createWorkerDecoder
│   ├── useQRScanner.ts
│   ├── QRScanner.tsx
│   ├── Viewfinder.tsx            # SVG overlay + WAAPI sweep + controls
│   ├── __testing__/              # fixture rendering, degradation, corpus loader
│   └── *.test.ts(x)              # co-located
├── scripts/measure-size.mjs
├── scripts/bench-decode.mjs
├── package.json                  # ".", "./headless", "./worker"; sideEffects lists ./worker
├── tsup.config.ts                # ONE config, THREE entries, per-entry banner
├── SPEC.md / README.md
└── vitest.config.ts / vitest.setup.ts / tsconfig.json
```

### 5.2 Data flow

```
 ImageSource (video frame | file | ImageData)
      │  toGray() → [downscale, crop]
      ▼
 GrayImage ──► binarize() ──► BitMatrix
      │                           │
      │        engine: native ────┼──► BarcodeDetector ──► QRScanResult (no symbol info)
      │                           │
      ▼                           ▼
 findFinderPatterns() → groupFinders() → findAlignmentPattern()
      │
      ▼  perspectiveTransform() → sampleGrid()
 BitGrid
      │  readFormatInfo() → readVersion() → readCodewords()
      ▼
 Blocks ──► rsDecode() per block ──► data codewords
      │
      ▼  parseSegments()  (modes · ECI · kanji · structured append)
 QRScanResult ──► corners mapped back to full-source coordinates
      │
      └─► mapCorners(result, video) ──► overlay quad in element pixels
```

Retry passes (`inverted`, `mirrored`) re-enter at `binarize` / `sampleGrid`, not
at the top — the grayscale pass is computed once per frame.

---

## 6. Development Milestones

> House loop applies: each phase ends green (`pnpm typecheck` + package tests)
> and passes a `usefy-reviewer` checkpoint (★) before the next begins. Budget
> roughly a third of total effort for the review rounds — that is the measured
> normal for this kind of package (qr-code), not an overrun.

### Phase 0 — Widen the `@usefy/qr-code` headless surface ★ (small)
- [ ] Export `gfExp/gfLog/gfMul/gfDiv/polyMul`, `ecCodewordsPerBlock`,
      `numEcBlocks`, `totalCodewords`, `MODE_INDICATOR`, `EC_FORMAT_BITS`,
      `formatInfoBits`, `versionInfoBits`, and a reserved-module map helper from
      `@usefy/qr-code/headless`. Additive only — no behaviour change.
- [ ] JSDoc each as a shared-with-the-scanner primitive so nobody "cleans them
      up" later; extend qr-code's headless build-output test to cover them.
- [ ] `minor` changeset for `@usefy/qr-code` (0.3.0), re-run its size script and
      update its README/SPEC table if the numbers move.

### Phase 1 — Bit-level decoder ★ (the pure core)
- [ ] Scaffold the package (qr-code parity: one tsup config, three entries,
      per-entry `"use client"`, `rimraf dist && tsup`, measure-size script).
- [ ] `bitreader`, `format`, `codewords` (unmask + zig-zag + de-interleave).
- [ ] `rsDecode`: syndromes, Berlekamp–Massey, Chien, Forney, **post-correction
      syndrome re-verification**.
- [ ] `segments`: all modes + ECI + charset + Kanji + Structured Append + FNC1.
- [ ] **Oracle suite:** `encodeQR` → matrix → `decodeMatrix` round trip across
      **all 160** version × level combinations × three modes; per-block error
      injection at 1 … ⌊ec/2⌋ (must correct) and at ⌊ec/2⌋+1 (must fail, and
      must not return a wrong payload); format-word corruption up to 3 bits;
      mirrored grid; capacity-boundary payloads. **100 % coverage on
      `src/decode/`.**

### Phase 2 — Image pipeline + detection ★ (the hard half)
- [ ] `source`, `luminance`, `binarize` (hybrid + otsu), `bitmatrix`.
- [ ] `finder`, `group` (incl. handedness), `alignment`, `perspective`, `sample`.
- [ ] `decodeImage` composing detection + decode, with invert/mirror passes and
      `maxSymbols`.
- [ ] **Oracle suite (synthetic):** render every fixture symbol with the
      package's own counterpart (`@usefy/qr-code` → canvas) and degrade it
      deterministically — rotation (0–360° in steps), perspective warp, scale
      down to 2 px/module, gaussian blur, gaussian noise, uneven illumination
      gradients, JPEG-like ringing, partial occlusion within the EC budget,
      inverted, mirrored, quiet zone 4/2/0, multi-symbol frames. Each case
      asserts the exact payload **and** corner positions within tolerance.
- [ ] **Cross-check:** the same corpus through `jsqr` and `zxing-wasm`; our
      engine must decode a superset of `jsqr`'s successes and be within a stated
      margin of `zxing-wasm`. Divergences are triaged, not averaged away.
- [ ] Benchmark script + first real numbers into §4.8.

### Phase 3 — Engines, worker, still-image API ★
- [ ] `native.ts` (+ `BarcodeDetector` typings — TS ships none), probe caching.
- [ ] `engine.ts` auto policy incl. the miss-streak switch; `decodeFile`.
- [ ] `worker.ts` + `createWorkerDecoder` with buffer transfer, in-flight cap,
      termination safety; tests with a real `Worker` in browser mode and a stub
      in jsdom.
- [ ] Build-output test: `dist/headless.*` and `dist/worker.*` contain no
      `"use client"` and no React import (qr-code decision #2, inherited).

### Phase 4 — Camera + React ★
- [ ] `@usefy/use-user-media` via `add-usefy-hook` (decision #3): stream
      acquisition, device list, switching, torch, teardown, StrictMode safety.
- [ ] `camera.ts` frame pump (rVFC/rAF, throttle, in-flight skip).
- [ ] `useQRScanner`, `<QRScanner />`, `Viewfinder`, `mapCorners`, controls,
      file/drop/paste fallback, dedupe, controller, error surface.
- [ ] StrictMode / SSR tests; **camera-teardown test** (every track stopped on
      unmount, on stop, and on device switch); mapped-corner geometry tests
      across `object-fit` and mirrored front cameras.

### Phase 5 — Storybook + browser QA ★ (mandatory) — complete
- [x] Stories (interactive-first, nothing self-runs): `Default`
      (generate → degrade → scan, no camera needed), `LiveCamera`,
      `MultipleCodes`, `DamageAndRepair`, `EngineComparison`, `HeadlessHook`,
      `DarkSurface`, plus an `!autodocs` `InteractionTest`. A companion
      `useUserMedia` story ships with the hook.
- [x] **Browser QA with screenshots.** Every story driven in Chromium. It found
      two real defects that no unit test had:
      1. **A rotated, antialiased symbol lost a finder pattern.** The diagonal
         cross-check compared run lengths against the row scan's total, but a
         diagonal chord is √2 × the side when axis-aligned and 1 × at 45°, so
         there is no expected length to compare to. Diagonals now check the
         *ratio* only. Before: 2 candidates, undecodable. After: 3 candidates,
         confirmed 9–10 times each.
      2. **The damage demo failed at its first step** because the blots hit the
         finder patterns, which demonstrates nothing about error correction. The
         blots now stay in the data region, and the story compares levels — L
         gives up at 12 blots having repaired 4 codewords, H survives all 20
         having repaired 15.
- [x] **The live camera path is automatically provable.** Chromium plays a
      generated Y4M (`scripts/make-capture-video.mjs`) as its camera under
      `--use-fake-device-for-media-stream --use-file-for-fake-video-capture`.
      Verified: the stream reaches the `<video>` (640 × 480, playing), the frame
      pump decodes the moving symbol to the exact expected payload, and the
      overlay polygon lands on it.
- [ ] **Real-device pass:** a printed and an on-screen code scanned with a real
      phone camera, including torch on a dark surface. Synthetic frames and a
      fake capture device cover a great deal, but not lens distortion, rolling
      shutter or a real LED. **Outstanding — requires physical hardware.**

### Phase 6 — Ship ★
- [ ] Measured numbers into §4.8 (sizes + bench), README tables updated.
- [ ] READMEs: package README + the four root-README touchpoints (Overview
      table, Ecosystem, Packages, "Choose Your Package").
- [ ] `apps/web` Phase-7 presentation: registry (`CATEGORY` + `PACKAGE_DIRS` +
      regenerate), `PRODUCTS` entry + `demo` union member + `LIVE_DEMO_SLUGS`,
      `--accent-qr-scanner` in all three theme spots, card micro-demo
      (a viewfinder locking onto a code), product-page live demo (camera with a
      file-scan fallback — the live demo must work on a desktop without a
      webcam), workspace dep. Browser-verified in both themes.
- [ ] `minor` changeset for `@usefy/qr-scanner` (standalone, independent
      version), `pnpm changeset status` verified, prefilled PR link handed over.

---

## 7. Testing Strategy

**The oracle is the whole point of picking this package** (STANDALONE-IDEAS
gate ⑥). Three independent sources of truth:

1. **Our own encoder.** `encodeQR` produces the matrix *and* the expected
   payload, so every decode assertion is exact rather than "looks right".
   Covers all 160 version × level combinations, every mode, capacity boundaries,
   and every mask.
2. **Deterministic degradation.** Fixtures are rendered and then transformed by
   a seeded, reproducible pipeline (rotation, perspective, scale, blur, noise,
   illumination, occlusion, inversion, mirroring). A failure is reproducible
   from its seed; no flaky "sometimes decodes" tests.
3. **Independent decoders.** `jsqr` (already a devDep in qr-code) and
   `zxing-wasm` run the same corpus. This catches the failure mode our own
   oracle structurally cannot: agreeing with ourselves about a wrong reading.

Plus:

- **Reed–Solomon:** algebraic identities, correction at exactly the capacity
  limit, guaranteed failure one error past it (and never a silent wrong
  payload across 600 trials at the limit + 1), and the invariant guard that no
  correction leaves a non-zero syndrome behind.
- **Detection units:** hand-built bitmaps for finder ratios, false-positive
  rejection, sub-pixel centre accuracy, triple grouping under noise, handedness,
  alignment search, homography round trip (map → unmap = identity within ε).
- **Engine:** native adapter against a stubbed `BarcodeDetector` (present /
  absent / unsupported format / throwing); auto-policy miss-streak switching;
  `binary`/`maxSymbols` forcing internal.
- **Camera / React:** StrictMode double-mount, teardown (tracks stopped —
  asserted, always), permission-denied path, device switching, visibility pause,
  dedupe window, `onScan` firing exactly once per value, error surface,
  `mapCorners` across `object-fit` and mirroring.
- **Build:** `dist/headless.*` + `dist/worker.*` free of `"use client"` and React.
- **Browser (Phase 5):** fake-capture camera video, worker path with a real
  `Worker`, both themes, screenshots — plus the real-phone pass.

---

## 8. Accessibility

- Every control (torch, camera switch, file fallback) is a real `<button>` with
  a label, reachable by keyboard, with a visible focus ring in both themes.
- Scan results are announced through a `role="status"` live region
  (`aria-live="polite"`); the raw payload is announced only when it is short and
  human-meaningful, otherwise a generic "code detected" message — reading a
  200-character URL aloud is hostile.
- The viewfinder sweep is decorative (`aria-hidden`) and **fully suppressed
  under `prefers-reduced-motion`** (a static bracket frame, not a slowed sweep).
- The `<video>` carries `playsInline`, `muted`, and an accessible name; the
  component never relies on colour alone to signal state (icon + text).
- Permission-denied and unsupported states are rendered as readable text with a
  recovery action, never as a silent black rectangle.
- Documented: a scanner must not be the **only** input path — always pair it
  with manual entry (the qr-code README makes the symmetric point).

## 9. Security & privacy

- **No network, no telemetry.** Frames are decoded in-process and discarded; no
  buffer outlives the decode except the result.
- The camera is released deterministically on unmount, `stop()`, and stream
  replacement; torch is forced off before the track stops.
- **A decoded value is untrusted input.** The component never navigates,
  fetches, copies, or renders the payload as HTML. The README states this
  plainly and shows the safe pattern (validate → confirm → act), because
  auto-opening a scanned URL is a phishing vector.
- Worker messages carry only pixel buffers and plain options — no functions, no
  `eval`, no blob URLs (which is also why the worker is a real module entry, not
  an inlined string: it survives a strict CSP).
- `decodeFile` accepts consumer-supplied blobs only; no remote fetching on the
  consumer's behalf.

## 10. Success Criteria

### Functional
- [x] Round trip: **all 160** version × level combinations, all modes, encoded
      by `@usefy/qr-code` and decoded back to the exact payload.
- [x] Correction: every block corrects up to ⌊ec/2⌋ injected errors, and one
      error past the limit fails cleanly — 600 trials at the limit + 1 across
      three block shapes, **never a wrong payload**.
- [x] Degradation: the synthetic corpus (rotation through a full turn,
      perspective, blur, noise, illumination, hard-edged shadow, occlusion,
      inversion, mirroring, 2 px/module, no quiet zone) decodes, and the
      measured recall is a **strict superset of jsQR's** on a shared corpus —
      asserted two-sided, so ours can never quietly fall behind.
- [x] **Reads symbols this ecosystem did not produce** — `node-qrcode` output
      across nine version groups × four levels, all eight masks, every mode, and
      a degraded foreign symbol.
- [x] Camera: the live path decodes in a real browser from a fake-capture video
      (`scripts/make-capture-video.mjs` + Chromium's fake device) — the stream
      reaches the `<video>`, the pump decodes the moving symbol to the exact
      payload, and the overlay lands on it. **A real phone-camera pass against a
      printed code is still outstanding** (needs hardware).
- [x] Native and internal engines return equal `text` where both succeed; the
      result reports which one ran, and never invents native metadata.
- [x] Multiple symbols in one frame are decoded with correct, distinct corners.
- [x] Overlay corners land on the symbol across `object-fit: cover/contain/fill`,
      mirrored front cameras, and `region` cropping — verified in a browser as
      well as in unit tests.
- [x] The camera is provably released: no active track after unmount or `stop()`,
      including under StrictMode's double mount and when a stream arrives after
      the component is gone.

### Non-functional
- [ ] `src/decode/` 100 % coverage; `src/detect/` + `src/image/` ≥ 95 %;
      package ≥ 95 % statements.
- [ ] Measured size + decode benchmarks recorded in §4.8 and enforced by
      `pnpm size`.
- [ ] `dist/headless.*` and `dist/worker.*` carry no `"use client"` and no React.
- [ ] SSR + StrictMode safe; React 18 & 19; TS strict; zero non-`@usefy`
      runtime dependencies.
- [ ] Browser QA evidence captured: screenshots in both themes, fake-capture
      camera run, real-device scan, re-run green after the review rounds.

---

## 11. Decisions

1. **Packaging** — single package, three entries (`.`, `./headless`,
   `./worker`), no umbrella (components have none). `"use client"` applied
   **per entry** in `onSuccess`, never globally: the headless and worker bundles
   must stay React-free and RSC-importable (qr-code decision #2, and the known
   confetti/signature-pad/diff-viewer bug we are not inheriting). ✅ **Implemented.**
2. **Depend on `@usefy/qr-code`, do not duplicate its tables.** The alternative
   — copying `galois.ts` and the capacity tables — creates a divergence bug
   class where the generator and the scanner disagree about the ISO spec, and
   the symptom would be an unreadable code at exactly one version × level
   combination. The cost is one additive `minor` release of `@usefy/qr-code`
   (Phase 0) and a workspace dependency that tree-shakes to the tables actually
   used. ✅ **Implemented.**
3. **Camera lifecycle becomes `@usefy/use-user-media`, a new hook package.**
   The `add-usefy-component` skill's rule: a generic concern with no hook yet
   gets extracted rather than buried. `getUserMedia` + device enumeration +
   switching + torch + teardown is textbook generic, and it partly retires
   ROADMAP `useMediaDevices` (P2). Cost: one extra hook package and a lockstep
   `minor` bump of the hook family. ✅ **Implemented** — the hook shipped and this package composes it.
4. **Native-first, never native-only.** `BarcodeDetector` is used where present,
   but the fallback engine is a first-class citizen, not a stub: it is the only
   path that yields symbol metadata, binary payloads, multi-symbol results and
   mirrored symbols, and it is the engine every deterministic test runs against.
   The result always reports which engine produced it. ✅ **Implemented.**
5. **Camera and still image are both in v0.1.0.** CLAUDE.md, "Build it properly
   the first time" — and STANDALONE-IDEAS says so for this package by name.
   Shipping file-decode first would make it worse than the thing it replaces.
   ✅ **Implemented.**
6. **Mirroring is settled at the format word, not by geometry.** The first
   draft of this SPEC claimed the finder triple's cross-product sign reveals
   handedness. **It does not, and cannot** — the three finder patterns are
   identical squares, as are the timing and alignment patterns, so a mirrored
   symbol is geometrically identical to a normal one; of the two possible
   corner labellings, one always has "normal" handedness, and computing a cross
   product only re-derives the label the detector itself just chose. The
   detector therefore emits the normally-handed labelling, and `decodeMatrix`
   reads the grid, then its transpose if that fails. Mirrored symbols pay one
   extra format read (which fails fast); everyone else pays nothing.
   **Corrected during Phase 2.** ✅ Implemented.
7. **Kanji is decoded via `TextDecoder("shift_jis")`.** qr-code deliberately
   omits Kanji *encoding* (its decision #5), but a scanner meets symbols other
   people generated. The platform ships the table, so support costs a few lines;
   where the runtime lacks the encoding, the segment degrades to raw bytes with
   `mode: "kanji"` rather than throwing. ✅ **Implemented.**
8. **Charset without ECI follows real-world behaviour, not the letter of the
   spec.** ISO says default ISO-8859-1; the world emits UTF-8 without ECI. We
   use UTF-8 when the bytes validate as UTF-8, ISO-8859-1 otherwise, and always
   expose `bytes` so a consumer can disagree. Documented as a deliberate
   deviation. ✅ **Implemented.**
9. **The worker is a real module entry, not an inlined blob.** Blob-URL workers
   break under a strict CSP and inflate the main bundle by the size of the whole
   decoder. A `./worker` entry the consumer constructs with
   `new URL(..., import.meta.url)` is bundler-native and CSP-safe; the trade-off
   is one line of consumer setup, which is documented in the README. Worker use
   stays **opt-in** — the main-thread path must be good enough alone. ✅ **Implemented.**
10. **Bundle and speed budgets are provisional until measured** (qr-code
    decision #10, learned the hard way): §4.8 is marked as targets, and Phase 6
    replaces them with measured values rather than trimming spec'd features to
    hit a number invented before the code existed. ✅ **Implemented.**
11. **A wrong decode is worse than no decode** — and the mechanism is named
    honestly. Reed–Solomon can "correct" heavy noise into a *different valid*
    codeword, and re-checking syndromes afterwards cannot detect that: a
    miscorrected word is a real codeword, so its syndromes are legitimately
    zero. What does the work is refusing on **locator degree > ⌊ec/2⌋** and on
    **root count ≠ locator degree**, backed by two further independent checks
    above the RS layer (the BCH-protected format word, and a bit-stream parser
    that rejects malformed streams instead of zero-filling). The
    post-correction syndrome check is kept as an *invariant guard* against a
    bug in the Forney step, and is documented as that rather than sold as a
    miscorrection detector. **Revised during Phase 1** — the first draft claimed
    the syndrome re-check prevented wrong payloads, which is not true.
    ✅ Implemented.
12. **The component never acts on a payload** (§9). It reports; the consumer
    decides. ✅ **Implemented.**
13. **The product-page live demo must work without a webcam** — desktop
    visitors are the majority of that audience, so the demo leads with
    generate-then-scan (`@usefy/qr-code` renders a code, the scanner reads the
    canvas) and offers the camera as an upgrade. A demo that shows a permission
    prompt and then a black box is a worse storefront than no demo. ✅ **Implemented.**

---

## 12. Appendix

### A. Related packages
- `@usefy/qr-code` — the encoder; supplies GF(256), the ISO tables and the
  test oracle. This package is its other half.
- `@usefy/signature-pad`, `@usefy/confetti` — canvas/DPR/export precedents.
- `@usefy/diff-viewer` — pure-engine, golden-test and seam precedents.
- `@usefy/use-user-media` (new, decision #3) — camera stream lifecycle.

### B. Prior art surveyed (npm figures measured 2026-07-27 — §1.2)
- [ZXing](https://github.com/zxing/zxing) / [zxing-wasm](https://github.com/Sec-ant/zxing-wasm) — the reference decoder architecture (binarizer → detector → decoder).
- [jsQR](https://github.com/cozmo/jsQR) — the abandoned pure-JS incumbent; used here as a cross-check baseline.
- [barcode-detector](https://github.com/Sec-ant/barcode-detector) — the native-API polyfill whose downloads justify the native-first design.
- [@yudiel/react-qr-scanner](https://github.com/yudielcurbelo/react-qr-scanner), [react-zxing](https://github.com/adamlorenzi/react-zxing) — the maintained React wrappers this must beat on capability, not on marketing.
- ISO/IEC 18004 — the specification both halves implement.

---

*Document Version: 1.0*
*Last Updated: 2026-07-28*
</content>
</invoke>

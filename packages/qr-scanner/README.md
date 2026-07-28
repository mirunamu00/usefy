<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/qr-scanner</h1>

<p align="center">
  <strong>QR code scanner for React — the platform's native BarcodeDetector where it exists, a hand-written ISO/IEC 18004 decoder where it doesn't. Camera and still image, Reed–Solomon error correction, zero dependencies.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/qr-scanner">
    <img src="https://img.shields.io/npm/v/@usefy/qr-scanner.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/qr-scanner">
    <img src="https://img.shields.io/npm/dm/@usefy/qr-scanner.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/qr-scanner">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/qr-scanner?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/qr-scanner.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="#options">Options</a> ·
  <a href="#engines">Engines</a> ·
  <a href="#web-worker">Web Worker</a> ·
  <a href="#headless-usage">Headless</a> ·
  <a href="#security">Security</a> ·
  <a href="#accessibility">Accessibility</a> ·
  <a href="#limitations">Limitations</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/story/qr-scanner--default" target="_blank" rel="noopener noreferrer">
    <strong>▦ View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/qr-scanner` reads QR codes — from a **live camera** and from a **still image** (a file, a drop, a paste, a `<canvas>`, an `ImageData`).

Where the browser ships a `BarcodeDetector` that understands QR, it uses it: that path is hardware-accelerated and costs the main thread nothing. Where it does not — Safari, Firefox, most desktops — it falls back to a hand-written decoder that does the whole job:

```
grayscale → adaptive binarization → finder-pattern detection → perspective
correction → grid sampling → BCH format/version recovery → de-interleaving →
Reed–Solomon error correction → segment parsing (ECI · Kanji · FNC1)
```

It is the counterpart to [`@usefy/qr-code`](https://www.npmjs.com/package/@usefy/qr-code), and shares that package's GF(256) arithmetic and ISO tables rather than restating them — so the generator and the scanner cannot disagree about the specification.

### Why @usefy/qr-scanner?

QR *scanning* is a healthy field, and this package is not here because nobody maintains one. It is here for three reasons:

1. **It completes a set.** `@usefy/qr-code` generates; this reads back.
2. **Nobody composes native + fallback.** The maintained wrappers each wrap one engine. Using the platform where it exists *and* working everywhere else is a better product than either half.
3. **It is verifiable.** Our own encoder produces the ground truth, so "does it read every version and level" is an automated suite, not an opinion — and the recall claims below are measured against an independent decoder rather than asserted.

### Features

- **A real decoder, zero runtime dependencies** — local adaptive thresholding, sub-pixel finder detection, four-point homography, Reed–Solomon *repair*, ECI charsets, Kanji, Structured Append, FNC1
- **Native-first, never native-only** — and the result says which engine ran
- **Camera done properly** — permission states, device switching, torch, pause on hidden tab, and a guaranteed teardown
- **Still images too** — file, drop, paste; a desktop without a webcam is a first-class case, not an error state
- **Geometry you can draw with** — corners in source pixels, plus `mapCorners()` for `object-fit` and mirrored front cameras
- **Optional Web Worker** — a real `./worker` entry, no blob URLs, CSP-safe
- **RSC- and worker-safe headless core** — `@usefy/qr-scanner/headless` carries no `"use client"` and no React
- **House-standard robustness** — SSR & StrictMode safe, React 18 + 19, TypeScript strict

---

## Installation

```bash
npm install @usefy/qr-scanner
# or
pnpm add @usefy/qr-scanner
# or
yarn add @usefy/qr-scanner
```

React 18 or 19 is a peer dependency. No stylesheet to import — the component styles itself.

---

## Quick Start

```tsx
import { QRScanner } from "@usefy/qr-scanner";

export function CheckIn() {
  return (
    <QRScanner
      onScan={(result) => {
        // A QR payload is untrusted input. Show it, validate it, then act.
        console.log(result.text, result.symbol?.version);
      }}
    />
  );
}
```

That is the whole component: a camera preview, a viewfinder, torch and camera-switch controls when the device has them, and an "scan an image instead" fallback when it does not.

### Scan a file, with no camera at all

```tsx
import { decodeFile } from "@usefy/qr-scanner";

async function onPick(file: File) {
  const [result] = await decodeFile(file);
  if (result) console.log(result.text);
}
```

### Bring your own UI

```tsx
import { useQRScanner } from "@usefy/qr-scanner";

function Custom() {
  const scanner = useQRScanner({ onScan: (r) => console.log(r.text) });

  return (
    <>
      <video ref={scanner.videoRef} playsInline muted />
      {scanner.isTorchSupported && (
        <button onClick={() => scanner.setTorch(!scanner.torch)}>Torch</button>
      )}
    </>
  );
}
```

---

## API Reference

### `<QRScanner />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `onScan` | `(result, all) => void` | — | Fired once per distinct value (see `dedupeMs`) |
| `onFrame` | `(results) => void` | — | Fired for **every** decode, repeats included |
| `onError` | `(error) => void` | — | Camera and environment failures |
| `source` | `"camera" \| "file"` | `"camera"` | `"file"` never opens a camera |
| `accent` | `string` | `"#22d3ee"` | Viewfinder and highlight colour |
| `paused` | `boolean` | — | Hold the loop; the camera stays open. Controllable — pair with `defaultPaused` / `onPausedChange`, or just use `pause()` / `resume()` |
| `defaultPaused` | `boolean` | `false` | Initial paused state when `paused` is not supplied |
| `onPausedChange` | `(paused) => void` | — | Fired whenever the paused state changes, from either side |
| `facingMode` | `"environment" \| "user"` | `"environment"` | Preferred camera |
| `deviceId` | `string` | — | Open one specific camera |
| `scanRate` | `number` | `12` | Maximum decodes per second |
| `dedupeMs` | `number` | `1500` | How long a repeated value is suppressed |
| `stopOnHide` | `boolean` | `false` | Release the camera when the tab is hidden |
| `showTorch` / `showSwitch` / `showFileFallback` | `boolean` | `true` | Control visibility |
| `decoder` | `Decoder` | — | Decode elsewhere, e.g. a worker |
| `controllerRef` | `Ref<QRScannerController>` | — | `start` / `stop` / `pause` / `resume` / `scanFile` / `capture` |

Everything in [Options](#options) is accepted too, and any other prop is forwarded to the wrapper element.

### `useQRScanner(options)`

Returns `{ videoRef, state, result, results, error, start, stop, pause, resume, devices, activeDeviceId, selectDevice, switchCamera, isTorchSupported, torch, setTorch, scanFile, capture }`.

`state` is one of `idle · prompting · scanning · paused · denied · unsupported · error` — enough to render every case without inspecting the error.

### Decoding functions

| Function | Description |
|---|---|
| `decode(source, options?)` | Any image source → results, choosing an engine |
| `decodeFile(blob, options?)` | The same, named for the call site |
| `decodeFirst(source, options?)` | One result or `null` |
| `decodeImageData(image, options?)` | **Synchronous**, DOM-free, internal engine only |
| `isNativeSupported()` | Whether the platform can decode QR natively |

### Result

```ts
interface QRScanResult {
  text: string;                      // the decoded value
  bytes: Uint8Array;                 // raw payload, before any charset
  segments: QRScanSegment[];         // as the symbol carried them
  symbol?: QRSymbolInfo;             // internal engine only — see Engines
  corners: Quad;                     // TL, TR, BR, BL in source-image pixels
  center: Point;
  engine: "native" | "internal";
  timestamp: number;
}

interface QRSymbolInfo {
  version: number;                   // 1–40
  size: number;                      // 4v + 17
  level: "L" | "M" | "Q" | "H";
  mask: number;                      // 0–7
  mirrored: boolean;
  inverted: boolean;
  errorsCorrected: number;           // codewords Reed–Solomon repaired
  structuredAppend?: { index: number; total: number; parity: number };
  fnc1?: "gs1" | "aim";
}
```

---

## Options

| Option | Default | Description |
|---|---|---|
| `engine` | `"auto"` | `auto` · `native` · `internal` — see [Engines](#engines) |
| `maxSymbols` | `1` | Symbols to decode per image |
| `maxDimension` | `800` | Working-resolution cap. Applied only when it would shrink the image by ≥ 2.5× — below that, shrinking costs more than it saves |
| `binarizer` | `"hybrid"` | `hybrid` · `otsu` · your own function |
| `invert` | `"auto"` | Second pass for light-on-dark symbols, only when the normal read found nothing |
| `region` | — | Restrict analysis to a rectangle; results still report full-image coordinates |
| `sampling` | `"center"` | `majority5` reads five taps per module — more forgiving on tiny modules |
| `binary` | `false` | Skip text decoding; forces the internal engine |

---

## Engines

`engine: "auto"` (the default) uses the platform's `BarcodeDetector` when it supports QR, and the built-in decoder otherwise. If the native pass finds nothing in a still image, the internal engine runs before reporting failure.

The native API returns a value and a bounding box — **and nothing else**. It cannot tell you the symbol's version, error-correction level, mask, whether it was mirrored, or how many codewords had to be repaired. So a native result omits `symbol` rather than inventing it, and these options force the internal engine because the platform cannot answer them:

- `binary: true` — the native API hands back a string; re-encoding it is not the symbol's original bytes
- `region` and `maxDimension` — the detector takes no instruction about *how* to look at the frame. Honouring them on one engine and ignoring them on the other would make an option's meaning depend on the browser
- `sampling: "majority5"`, a function `binarizer`, `invert: "always"`

On a **live camera** the two engines never both run on one frame: an empty frame — by far the most common kind — costs one engine, not two. If the platform detector produces nothing for twelve consecutive frames (about a second), the session stops asking it and uses the internal engine for the rest of its life. A **still image** keeps the fallback, because there recall matters more than a millisecond.

```tsx
// Deterministic, fully-featured, everywhere — at the cost of the main thread
<QRScanner engine="internal" />
```

---

## Web Worker

Decoding on the main thread is fine for the frame budget (see the benchmarks below), but a dense symbol on a slow phone is worth moving. The worker is a **real module entry**, so your bundler emits it and no blob URL is involved — which also means it survives a strict `script-src` policy:

```tsx
import { QRScanner, createWorkerDecoder } from "@usefy/qr-scanner";

const worker = new Worker(new URL("@usefy/qr-scanner/worker", import.meta.url), {
  type: "module",
});
const decoder = createWorkerDecoder(worker);

<QRScanner decoder={decoder} />;
```

Functions cannot cross `postMessage`, so a function `binarizer` is decoded on the main thread instead — and says so once in development rather than being silently ignored.

---

## Headless Usage

`@usefy/qr-scanner/headless` has no React and no `"use client"`, so it imports cleanly into a server component, a worker, or a plain script:

```ts
import { decodeImageData, binarize, toGray } from "@usefy/qr-scanner/headless";

const results = decodeImageData(imageData, { maxSymbols: 3 });
```

Every stage is exported individually (`toGray`, `binarize`, `findFinderPatterns`, `groupFinders`, `sampleGrid`, `readFormatInfo`, `readCodewords`, `rsDecode`, `parseSegments`) for anyone building something else on top.

### Structured Append

A payload can span up to 16 symbols. `joinStructuredAppend()` sorts them, de-duplicates repeats, refuses to mix two different sequences, and reports what is still missing:

```ts
const sequence = joinStructuredAppend(scannedSoFar);
if (sequence.missing.length === 0) save(sequence.text);
else toast(`${sequence.total - sequence.missing.length} of ${sequence.total} scanned`);
```

---

## Security

**A decoded value is untrusted input.** This package never navigates to it, fetches it, copies it, or renders it as HTML — acting on a payload is your decision, made with your knowledge of what a valid value looks like. Auto-opening a scanned URL is a phishing vector.

```tsx
<QRScanner
  onScan={(result) => {
    const url = safeParse(result.text);       // your validation
    if (url) setPendingConfirmation(url);      // then let the user confirm
  }}
/>
```

Beyond that: no network, no telemetry, frames are decoded in-process and discarded, and the camera is released deterministically on unmount, on `stop()`, and when the stream is replaced.

---

## Accessibility

- Every control is a real `<button>` with a label, keyboard-reachable, with a visible focus ring
- Results are announced through a polite live region — short values are read out, long ones become "QR code detected", because reading a 200-character URL aloud is hostile
- The viewfinder is decorative (`aria-hidden`) and its sweep **stops entirely** under `prefers-reduced-motion`
- Permission-denied and unsupported states render as readable text with a recovery action, never a silent black rectangle
- A scanner should never be the *only* input path — pair it with manual entry

---

## Performance

Measured with `pnpm --filter @usefy/qr-scanner bench` (median / p95 of 30 runs, internal engine):

| Frame | Median | p95 |
|---|---:|---:|
| 640 × 480, version 3 | 2.3 ms | 3.3 ms |
| 1280 × 720, version 3 | 5.7 ms | 8.0 ms |
| 1280 × 720, version 10 | 6.2 ms | 7.7 ms |
| 1920 × 1080, version 40 | 14.8 ms | 15.5 ms |
| 4000 × 3000 photo | 53.1 ms | 62.1 ms |

At the default 12 decodes per second, a frame has 83 ms — every camera-sized case fits several times over.

Bundle sizes (`pnpm size`, minified + gzipped):

| Import | Size |
|---|---:|
| Native detector only | 1.19 KB |
| `decodeFile` (internal engine, no React) | 12.58 KB |
| `./headless`, full surface | 14.36 KB |
| `./worker` entry | 11.41 KB |
| `.` React entry, full surface | 20.57 KB |

---

## Limitations

Stated plainly, because a scanner that overpromises wastes your afternoon:

- **QR only.** No Code128, EAN, DataMatrix, PDF417 or Aztec. The native API could return some of those; exposing that would make the package's capabilities depend on the browser, which is a worse API than a narrow one.
- **No Micro QR or rMQR** — different geometry and tables.
- **A perspective-warped symbol needs its alignment pattern.** Version 1 has none, and a badly damaged one cannot be found; with only three corners there is nothing to correct a warp against. Flat symbols are unaffected. Every other decoder has the same limit.
- **Charsets follow the platform.** Text comes from `TextDecoder`, so an encoding the runtime lacks (CP437, for instance) leaves the segment's `text` undefined — `bytes` is always there. Node and browsers also differ on the 0x80–0x9F range of `windows-125x`.
- **The native path reports no symbol metadata** — see [Engines](#engines).
- **A worker cannot take a function `binarizer`.** Functions do not survive `postMessage`.

---

## License

MIT © [usefy](https://github.com/mirunamu00/usefy)

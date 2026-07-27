<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/qr-code</h1>

<p align="center">
  <strong>QR code generator for React — hand-written ISO/IEC 18004 encoder, SVG/canvas/PNG output, module &amp; eye shapes, gradients, logo embedding with scannability validation, zero dependencies</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/qr-code">
    <img src="https://img.shields.io/npm/v/@usefy/qr-code.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/qr-code">
    <img src="https://img.shields.io/npm/dm/@usefy/qr-code.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/qr-code">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/qr-code?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/qr-code.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="#options">Options</a> ·
  <a href="#server-components">Server Components</a> ·
  <a href="#logos">Logos</a> ·
  <a href="#headless-usage">Headless</a> ·
  <a href="#accessibility">Accessibility</a> ·
  <a href="#limitations">Limitations</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/story/qr-code--default" target="_blank" rel="noopener noreferrer">
    <strong>▦ View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/qr-code` turns a string into a QR code. The core is a hand-written **ISO/IEC 18004 encoder** — optimal mode segmentation → bit stream → Reed–Solomon error correction over GF(256) → block interleaving → matrix placement → mask selection by penalty scoring → BCH-protected format and version information.

Everything above the matrix — SVG paths, canvas, PNG export, module and eye shapes, gradients, logo placement — is built on that one engine, so **every output surface renders the same symbol**.

Three layers, one model:

1. **Component** — `<QRCode />`: SVG or canvas, all styling as props, an imperative controller for exports.
2. **Hook** — `useQRCode()`: the encoded matrix and structured SVG data for markup you render yourself.
3. **Headless** — `encodeQR()` / `toSVG()` / `toSVGProps()` from `@usefy/qr-code/headless`: pure TypeScript, **zero React, no `"use client"`** — importable straight from a React Server Component.

### Why @usefy/qr-code?

QR generation is a crowded field, and this package is not here because nobody maintains one. It exists because the capability set is split across packages that don't compose — a plain generator, a React wrapper, and a separate styling library that isn't React at all. This is all of it in one dependency-free engine:

- **A real encoder** — versions 1–40, levels L/M/Q/H, numeric/alphanumeric/byte with automatic mixed segmentation, ECI 26 for UTF-8, all eight masks scored by the spec's four penalty rules
- **Four outputs, one matrix** — `toSVG()` (string), `toSVGProps()` (structured, for JSX), canvas, and PNG (data URI + `Blob`), all from the same path geometry
- **Styling in-core** — `square` / `rounded` / `dot` / `classy` modules, `square` / `rounded` / `circle` / `leaf` finder eyes, per-eye colours, linear and radial gradients, quiet-zone control
- **Logos that tell you when they're unsafe** — `logoSafety()` measures occlusion against what the error-correction level can actually recover, and development builds warn with the level that would fix it
- **Scannability treated as correctness** — every shape combination, gradient, logo size and export path in this package has been decoded by a real scanner in a browser, not just unit-tested
- **House-standard robustness** — SSR & StrictMode safe, encoding failures reported rather than thrown, React 18 + 19, TypeScript strict

---

## Installation

```bash
# npm
npm install @usefy/qr-code

# yarn
yarn add @usefy/qr-code

# pnpm
pnpm add @usefy/qr-code
```

---

## Quick Start

```tsx
import { QRCode } from "@usefy/qr-code";

function ShareLink() {
  return <QRCode value="https://usefy.dev" size={200} level="Q" title="Open usefy.dev" />;
}
```

Branded, with a logo and an export button:

```tsx
import { useRef } from "react";
import { QRCode, type QRCodeController } from "@usefy/qr-code";

function TicketCode({ url, logo }: { url: string; logo: string }) {
  const qr = useRef<QRCodeController>(null);

  return (
    <>
      <QRCode
        controllerRef={qr}
        value={url}
        size={240}
        level="H"
        moduleShape="rounded"
        eyeShape="circle"
        fg={{
          type: "linear",
          rotation: 45,
          stops: [
            { offset: 0, color: "#6366f1" },
            { offset: 1, color: "#be185d" },
          ],
        }}
        logo={{ src: logo, size: 0.2 }}
        title="Your ticket"
      />
      <button onClick={() => qr.current?.download("png", "ticket.png")}>Download</button>
    </>
  );
}
```

---

## API Reference

### `<QRCode />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| Uint8Array` | — | The data to encode. Bytes are passed through verbatim, with no ECI header |
| `size` | `number` | `160` | Rendered width and height in px |
| `render` | `"svg" \| "canvas"` | `"svg"` | SVG scales and server-renders; canvas is cheaper with many codes on screen |
| `controllerRef` | `Ref<QRCodeController>` | — | Imperative handle for exports and downloads |
| `title` | `string` | — | Accessible name. Without one the code is `aria-hidden` |
| `onError` | `(error: Error) => void` | — | Called when encoding fails; the component renders nothing |
| `throwOnError` | `boolean` | `false` | Throw during render instead, for an error boundary |
| `dpr` | `number` | `min(devicePixelRatio, 2)` | Backing-store scale for `render="canvas"` |
| `className` / `style` | — | — | Forwarded to the root element |

Plus every option in [Options](#options).

### `QRCodeController`

| Method | Returns | Description |
|---|---|---|
| `getMatrix()` | `QRMatrix \| null` | The encoded symbol |
| `toSVG(options?)` | `string` | A standalone SVG document |
| `toPNG(options?)` | `Promise<{ dataURL, blob }>` | Rasterized PNG |
| `download(format?, filename?)` | `Promise<void>` | Triggers a browser download (`"png"` or `"svg"`) |

### `useQRCode(options)`

```tsx
const { matrix, error, svgProps, canvasRef, toSVG, toPNG, download } = useQRCode({
  value: "https://usefy.dev",
  level: "Q",
});
```

| Field | Type | Description |
|---|---|---|
| `matrix` | `QRMatrix \| null` | The encoded symbol, `null` when encoding failed |
| `error` | `Error \| null` | The encoding failure. Never thrown by the hook |
| `svgProps` | `QRSVGProps \| null` | Structured SVG data for rendering as JSX |
| `canvasRef` | `(el: HTMLCanvasElement \| null) => void` | Attach to a `<canvas>` to have it drawn and kept in sync |
| `toSVG` / `toPNG` / `download` | — | As on the controller |

---

## Options

Shared by the component, the hook and the headless renderers.

### Encoding

| Option | Default | Description |
|---|---|---|
| `level` | `"M"` | Error correction: `"L"` (~7%), `"M"` (~15%), `"Q"` (~25%), `"H"` (~30%) |
| `version` | auto | Force a symbol version 1–40. Throws `QRCapacityError` if the data doesn't fit |
| `minVersion` | `1` | Floor for automatic selection — keeps a code a stable size as its data varies |
| `mask` | auto | Force mask 0–7 instead of choosing by penalty score |
| `eci` | `true` | Emit an ECI 26 header when the text leaves ASCII, so scanners decode UTF-8 |

### Appearance

| Option | Default | Description |
|---|---|---|
| `margin` | `4` | Quiet zone, in modules. The spec minimum is 4 |
| `fg` | `"#000000"` | Foreground colour, or a `QRGradient` |
| `bg` | `"#ffffff"` | Background colour; `null` renders transparent |
| `moduleShape` | `"square"` | `"square"` · `"rounded"` · `"dot"` · `"classy"` |
| `eyeShape` | `"square"` | `"square"` · `"rounded"` · `"circle"` · `"leaf"` |
| `eyeColor` | — | `{ outer?, inner? }` — finder colours independent of `fg` |
| `moduleGap` | `0` | Inset between modules, 0–0.3 of a module |
| `logo` | — | See [Logos](#logos) |

Colours pass a charset whitelist and a `url()` blocklist before they reach any output. An unsafe foreground falls back to black; an unsafe background becomes transparent — never a substituted colour that could render the code invisible.

---

## Server Components

The `./headless` entry ships **no `"use client"` directive and no React**, so a server component can render a complete QR code with zero client JavaScript:

```tsx
// app/ticket/page.tsx — a React Server Component
import { encodeQR, toSVGProps } from "@usefy/qr-code/headless";

export default function TicketPage() {
  const props = toSVGProps(encodeQR("https://usefy.dev", { level: "Q" }), { margin: 2 });

  return (
    <svg viewBox={props.viewBox} width={200} height={200} role="img" aria-label="Ticket">
      {props.background && <rect width={props.side} height={props.side} fill={props.background} />}
      {props.paths.map((path, index) => (
        <path key={index} d={path.d} fill={path.fill} />
      ))}
    </svg>
  );
}
```

No `dangerouslySetInnerHTML`, no hydration, nothing in the client bundle. The encoder plus the SVG path builder is about **6.7 KB gzipped**, and on this path none of it ships to the browser.

---

## Logos

A centre logo works because Reed–Solomon can reconstruct the codewords it hides — up to a point. `logoSafety()` tells you where that point is:

```tsx
import { QRCode, encodeQR, logoSafety } from "@usefy/qr-code";

const matrix = encodeQR(url, { level: "H" });
const safety = logoSafety(matrix, { logo: { src: logo, size: 0.25 } });

safety.occludedRatio;    // 0.11 — fraction of the symbol covered
safety.ecBudget;         // 0.30 — what level H can recover
safety.safe;             // true
safety.recommendedLevel; // "H" — the lowest level that would be safe
```

Development builds warn when a logo exceeds the budget, naming the level that would fix it. The package **never silently raises the level for you** — that would change the symbol's version and physical density behind your back.

| Option | Default | Description |
|---|---|---|
| `logo.src` | — | Image URL, or (recommended) a data URI |
| `logo.size` | `0.2` | Width as a fraction of the code, clamped to `0.35` |
| `logo.excavate` | `true` | Clear the modules underneath rather than painting over them |
| `logo.padding` | `0.02` | Quiet ring around the logo, as a fraction of the code |
| `logo.shape` | `"square"` | `"square"` or `"circle"` |
| `logo.crossOrigin` | — | Required to export a PNG with a remote logo |

The three finder patterns are never excavated: they are what a scanner uses to locate the symbol at all.

**Cross-origin logos taint the canvas.** `toPNG()` throws a `QRExportError` naming the fix rather than returning a blank image — serve the logo with CORS headers and set `logo.crossOrigin`, or inline it as a data URI.

---

## Headless Usage

```ts
import { encodeQR, toSVG, drawToCanvas, toPNG, logoSafety } from "@usefy/qr-code/headless";

const matrix = encodeQR("https://usefy.dev", { level: "Q" });

matrix.version;        // 3
matrix.size;           // 29 modules per side
matrix.get(0, 0);      // true — top-left module is dark
matrix.isReserved(3, 3); // true — part of a finder pattern

const svg = toSVG(matrix, { margin: 2, moduleShape: "rounded" });
```

| Export | Description |
|---|---|
| `encodeQR(data, options?)` | Encode to a `QRMatrix` |
| `toSVG(matrix, options?)` | A standalone SVG document string |
| `toSVGProps(matrix, options?)` | Structured SVG data — the server-rendering path |
| `drawToCanvas(ctx, matrix, options?)` | Draw into a 2D context, DPR-aware |
| `toPNG(matrix, options?)` | `Promise<{ dataURL, blob }>` (browser only) |
| `matrixToPaths(matrix, style)` | The raw fill paths |
| `logoSafety(matrix, options?)` | Logo occlusion analysis |
| `contrastRatio(a, b)` | WCAG contrast, for your own checks |
| `QRCapacityError` / `QRExportError` | Typed failures |

---

## Accessibility

- Pass `title` to give the code an accessible name — it becomes `role="img"` with an `aria-label` and an SVG `<title>`.
- **Without a `title` the code is `aria-hidden`.** That is deliberate: a screen reader announcing a raw URL character by character is worse than silence, and in almost every real layout there is already visible text saying where the code leads.
- **A QR code must never be the only route to a destination.** Always pair it with a link or a short code someone can type — a camera is not an accessible input device for everyone.
- Scanners need dark modules on a light field with at least a 3:1 contrast ratio; development builds warn below that, checking **every** stop of a gradient rather than just the first.
- The component produces no animation, so `prefers-reduced-motion` does not apply.

---

## Limitations

- **No decoding.** This package generates; scanning is a different engine.
- **No Kanji mode.** Japanese text encodes correctly through UTF-8 byte mode, just less densely than the dedicated mode would.
- **No Structured Append, Micro QR or rMQR.**
- **`toPNG()` is browser-only** — use `toSVG()` on the server.
- Bundle sizes (min+gz): `encodeQR` alone **4.3 KB**, `encodeQR` + `toSVGProps` **6.7 KB**, the full `./headless` surface **10.5 KB**, the full React entry **12.4 KB**. Zero runtime dependencies in the headless graph.
- `moduleGap` is not equally safe for every module shape — separated circles lose timing-pattern detection long before inset squares do. Measured ceilings: `square` 0.2, `rounded`/`classy` 0.15, `dot` 0.05; development builds warn above them.

---

## License

MIT © [usefy](https://github.com/mirunamu00/usefy)

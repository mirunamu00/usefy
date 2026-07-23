<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/signature-pad</h1>

<p align="center">
  <strong>Electronic signature pad for React — hand-written ink engine, velocity/pressure-based variable stroke width, PNG/SVG/JSON exports, zero dependencies</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/signature-pad">
    <img src="https://img.shields.io/npm/v/@usefy/signature-pad.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/signature-pad">
    <img src="https://img.shields.io/npm/dm/@usefy/signature-pad.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/signature-pad">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/signature-pad?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/signature-pad.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="#exports">Exports</a> ·
  <a href="#options">Options</a> ·
  <a href="#headless-usage">Headless</a> ·
  <a href="#accessibility">Accessibility</a> ·
  <a href="#performance">Performance</a> ·
  <a href="#limitations">Limitations</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/story/signature-pad--basic-pad" target="_blank" rel="noopener noreferrer">
    <strong>✍️ View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/signature-pad` is a signature input: users draw with mouse, finger, or stylus, and your app exports the result as a **trimmed PNG**, a **true-vector SVG**, or **replayable JSON**. The core is a hand-written ink engine — min-distance point filtering → cubic Bézier smoothing → **EMA-filtered velocity → continuously variable stroke width**, with stylus pressure blending — the pipeline that separates "pen on paper" ink from an angular polyline scribble.

One ink model works across **three layers**:

1. **Component** — `<SignaturePad />`: a container-filling canvas with an optional on-canvas "sign here" guideline, imperative controller, and edge-only callbacks.
2. **Hook** — `useSignaturePad()`: the engine on a canvas *you* render, with reactive `isEmpty`/`canUndo`/`canRedo` state.
3. **Headless** — `createSignatureEngine(canvas)` from `@usefy/signature-pad/headless`: pure TypeScript, zero React, usable from any framework.

### Why @usefy/signature-pad?

- **Real ink, zero deps** — velocity-thinned, pressure-aware stroke width; smooth Bézier curves with no visible corners; a tap renders a dot
- **Exports that match the screen** — canvas, PNG, and SVG all derive from the *same* geometry functions: what you see is what you export
- **Serialization built in** — versioned `toJSON()`/`fromJSON()`; strokes are **self-contained** (each stores the width parameters it was drawn with), so a stored signature replays identically on any pad, any options
- **Stroke-level undo/redo** — plus `clear()` as a single undoable action
- **Edge-only reactivity** — zero React renders while ink is flowing; state updates only on stroke end / undo / redo / clear / restore
- **House-standard robustness** — SSR & StrictMode safe, DPR-crisp (capped ×2), resize-resilient, engine-managed `touch-action: none`, single-active-pointer palm rejection, right-click never inks, React 18 + 19

---

## Installation

```bash
# npm
npm install @usefy/signature-pad

# yarn
yarn add @usefy/signature-pad

# pnpm
pnpm add @usefy/signature-pad
```

---

## Quick Start

```tsx
import { useRef, useState } from "react";
import { SignaturePad, type SignaturePadController } from "@usefy/signature-pad";

function ConsentForm() {
  const pad = useRef<SignaturePadController>(null);
  const [signed, setSigned] = useState(false);

  return (
    <>
      <div style={{ height: 200, border: "1px solid #e2e8f0", borderRadius: 12 }}>
        <SignaturePad
          guideline
          controllerRef={pad}
          onChange={({ isEmpty }) => setSigned(!isEmpty)}
        />
      </div>
      <button
        disabled={!signed}
        onClick={async () => {
          const { blob } = await pad.current!.toPNG({ background: "#fff" });
          await upload(blob);
        }}
      >
        Agree &amp; sign
      </button>
    </>
  );
}
```

The component fills its container — give the parent a height. The engine owns all canvas plumbing: DPR backing store, ResizeObserver, `touch-action: none` (drawing never scrolls the page).

---

## API Reference

### `<SignaturePad />`

```tsx
<SignaturePad
  penColor="#1e293b"
  guideline={{ y: 140, inset: 24, color: "#94a3b8" }}
  defaultValue={storedSignature}   // applied once on mount
  readOnly={false}                 // reactive — input detaches in place
  controllerRef={pad}              // imperative controller (stable)
  onBegin={() => {}}
  onEnd={() => {}}
  onChange={({ isEmpty, strokeCount }) => {}} // edges only, never per point
  aria-label="Signature input area"
  className="..."
  style={{ ... }}
/>
```

- **`controllerRef`** receives a stable `SignaturePadController`: `clear() / undo() / redo() / isEmpty() / toPNG() / toSVG() / toJSON() / fromJSON()`. Calls before mount (or after unmount) are safe no-ops.
- **`guideline`** draws a "sign here" baseline **beneath** the ink, on-canvas — and it is **excluded from every export** by construction.
- **Ink props are live**: changing `penColor` (etc.) never wipes the pad — committed strokes keep the style they were drawn with; new strokes pick up the new options. (History resets, and a stroke in progress at that exact moment is discarded.)

### `useSignaturePad()`

```tsx
import { useSignaturePad } from "@usefy/signature-pad";

function SignatureField() {
  const pad = useSignaturePad({ penColor: "#0f172a" });
  return (
    <>
      <canvas ref={pad.canvasRef} style={{ width: "100%", height: 200 }} />
      <button onClick={pad.undo} disabled={!pad.canUndo}>Undo</button>
      <button onClick={pad.redo} disabled={!pad.canRedo}>Redo</button>
      <button onClick={pad.clear} disabled={pad.isEmpty}>Clear</button>
    </>
  );
}
```

Returns `{ canvasRef, isEmpty, strokeCount, canUndo, canRedo, clear, undo, redo, toPNG, toSVG, toJSON, fromJSON }` — every function referentially stable. The engine is created when the canvas attaches and destroyed when it detaches; options are read once at attach (remount or attach a new canvas to change them).

---

## Exports

All exports contain **committed strokes only** and share one geometry pipeline with the canvas.

### PNG

```ts
const { dataURL, blob } = await pad.toPNG({
  trim: true,          // default: crop to the ink bounding box…
  padding: 8,          // …plus this many px (floored so round caps never clip)
  background: "#fff",  // default: the pad's `background` option (transparent)
  scale: 2,            // default: the device pixel ratio
});
```

An empty pad resolves to a minimal 1×1 transparent artifact — it never rejects for emptiness.

> **Forcing transparency:** when the pad itself has a `background`, pass `background: "transparent"` to export without it.

### SVG

```ts
const svg = pad.toSVG({ trim: true, padding: 8 }); // standalone <svg> string
```

True vector: each Bézier segment becomes a round-capped path whose width follows the rendered ink. Colors are sanitized (no markup or `url(...)` injection via stored data).

### JSON

```ts
const data = pad.toJSON();   // { v: 1, width, height, strokes: [...] }
pad.fromJSON(data);          // replace, replay, notify — resets history
```

Strokes are self-contained (points + color + `minWidth`/`maxWidth`/`velocityFilterWeight`/`pressure`/`pointerType`), so documents replay identically on a pad configured differently. `fromJSON` tolerates unknown extra fields and throws on an unsupported major version.

### Read-only restore

```tsx
<SignaturePad readOnly defaultValue={stored} />   // review screens
```

Input is detached; rendering, exports, and `fromJSON` keep working.

---

## Options

Shared by the component (as props), the hook, and the headless engine:

| Option | Default | Description |
|---|---|---|
| `penColor` | `#1e293b` | Ink color (captured per stroke at stroke start) |
| `minWidth` | `0.5` | Minimum stroke half-width, px — fast strokes thin toward this |
| `maxWidth` | `2.5` | Maximum stroke half-width, px — slow strokes fatten toward this |
| `velocityFilterWeight` | `0.7` | EMA weight for velocity smoothing (0–1; higher = reacts faster) |
| `minDistance` | `2` | Point-filter threshold, px |
| `pressure` | `"auto"` | Blend stylus pressure into the width (`"ignore"` to disable) |
| `acceptPointerTypes` | `["pen", "touch", "mouse"]` | Which pointer types draw |
| `dpr` | `min(devicePixelRatio, 2)` | Backing-store resolution override (clamped to `[0.1, 2]`) |
| `background` | `undefined` | Canvas fill beneath the ink; also the default export background |

Every numeric option is NaN/Infinity-guarded; unsafe `background`/`penColor` strings degrade safely (transparent background / default ink) — the screen and the exports always agree.

---

## Headless Usage

```ts
import { createSignatureEngine } from "@usefy/signature-pad/headless";

const engine = createSignatureEngine(canvas, { penColor: "#0f172a" });
const off = engine.onChange((e) => console.log("signed:", !e.isEmpty));

engine.undo();
const draft = engine.toJSON();
const svg = engine.toSVG();
off();
engine.destroy();
```

Zero React in the graph — usable from any framework or vanilla JS. The pure ink math (`filterPoints`, `bezierFor`, `widthForSegment`, `flattenSegment`, `strokeGeometry`, `inkBounds`, `strokesToSVG`) is exported too, for replay tooling and advanced use. `engine.ingest()` feeds synthetic input through the exact same pipeline as real pointer events — deterministic replay and testing without a pointer.

---

## Accessibility

The canvas renders with `role="img"` and a live `aria-label` that reflects state (`"Signature input area, empty"` / `"…, signed"`). All state (`isEmpty`, `canUndo`, …) is exposed programmatically for accessible toolbars.

Freehand drawing has **no meaningful keyboard equivalent** — offer a typed-signature fallback for keyboard and switch users:

```tsx
function TypedSignatureFallback({ onSign }: { onSign: (data: SignatureData) => void }) {
  const [name, setName] = useState("");
  const sign = () => {
    // Render the typed name to a canvas with a script font…
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 120;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "48px 'Segoe Script', 'Brush Script MT', cursive";
    ctx.fillStyle = "#1e293b";
    ctx.fillText(name, 24, 76);
    // …then store the PNG alongside (or instead of) drawn ink.
    canvas.toBlob((blob) => blob && uploadTypedSignature(name, blob));
  };
  return (
    <div>
      <label>
        Type your full name to sign
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <button onClick={sign} disabled={!name.trim()}>Sign</button>
    </div>
  );
}
```

Pair the pad with this fallback behind a "Can't draw? Type your signature" toggle; the pad's `readOnly` + `fromJSON` support re-displaying either kind.

---

## Performance

- **Incremental rendering** — while drawing, only the newly completed curve segment is stamped: O(new points), never a full-canvas redraw per point
- **Edge-only React** — zero renders while a stroke is in progress; state flips only on commit/undo/redo/clear/restore
- **Deterministic replay** — undo/resize/restore re-run the identical pipeline; same input, same geometry, every time

Bundle sizes (minified + gzip, measured by `scripts/measure-size.mjs`):

| Entry | Size |
|---|---|
| `@usefy/signature-pad/headless` (full engine + ink math) | **~5.0 KB** |
| `@usefy/signature-pad` (React component + hook + headless) | **~6.4 KB** |

Zero runtime dependencies in the headless engine.

---

## Limitations

- **Resize preserves, never scales** — strokes are stored in CSS-px coordinates anchored top-left; shrinking the canvas clips the ink rather than distorting stroke widths. Restore into a canvas at least as large as `data.width`/`data.height`.
- **Mid-stroke option changes** — changing ink props while a stroke is in progress discards that stroke (committed ink is carried over exactly).
- **Pointer Events only** — no legacy Touch/Mouse event fallbacks (universal in evergreen browsers).
- Not a drawing app: no shapes, erasers, or layers — the engine is signature-scoped.

---

## License

MIT © [usefy](https://github.com/mirunamu00/usefy)

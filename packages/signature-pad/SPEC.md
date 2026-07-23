# SignaturePad Component Specification

## Overview

**Package Name:** `@usefy/signature-pad` — single package with a `./headless` subpath (house pattern: virtual-keyboard, spotlight-tour, confetti)
**Version:** `0.1.0`
**Status:** Implemented — all 4 phases complete, browser-QA'd (screenshot evidence in the Phase 4 report)
**Created:** 2026-07-23
**Author:** usefy team

---

## 1. Executive Summary

### 1.1 Purpose

`@usefy/signature-pad` is a React electronic-signature input: users draw a
signature with mouse, finger, or stylus on a canvas, and the app exports it as
a trimmed PNG or a scalable SVG. The core is a **hand-written ink engine** —
pointer stream → point filtering → Bézier smoothing → **velocity/pressure-based
variable stroke width** — the pipeline that separates "pen on paper" ink from
an angular polyline scribble.

The niche mirrors spotlight-tour's: the de-facto standard `signature_pad`
(~500k weekly downloads) is a 2011-designed vanilla-JS library; its React
wrappers (`react-signature-canvas` et al.) are thin, dated, and effectively
unmaintained. A modern React-18/19-native, headless-first, SSR/StrictMode-safe
implementation with first-class exports and serialization fills a real gap —
and directly inherits the canvas/DPR/engine know-how built for
`@usefy/confetti`.

### 1.2 Target Users

- **Delivery / field-service apps** — proof-of-delivery signature on a phone.
- **E-contract / approval flows** — sign a contract or consent form.
- **Kiosk / POS / clinic check-in** — signature on shared touch terminals
  (pairs with `@usefy/virtual-keyboard`'s kiosk story).
- **Back-office** — review screens re-rendering stored signatures read-only.

### 1.3 Key Value Propositions

1. **Real ink, zero deps**: min-distance filtering, cubic Bézier smoothing,
   exponential-moving-average velocity → continuously variable stroke width,
   stylus `pressure` blending — pure functions, hand-testable math.
2. **One model, three layers**: `createSignatureEngine` (framework-free,
   `./headless`) → `useSignaturePad()` hook → `<SignaturePad />` component.
3. **Exports that match the screen**: PNG (ink-bbox trim, background, scale)
   and true vector SVG, both generated from the *same geometry pipeline* the
   canvas renders — what you see is what you export.
4. **Serialization built in**: versioned `toJSON()`/`fromJSON()` for drafts,
   audit trails, and read-only re-display; deterministic replay.
5. **Undo/redo + clear as first-class, stroke-level history.**
6. **SSR/StrictMode-safe, DPR-crisp, resize-resilient** — house standard.

---

## 2. Scope & Non-Goals

### 2.1 In scope (v0.1.0 — full spec, single release)

- Pointer-events input pipeline: `setPointerCapture`, single-active-pointer
  policy (basic palm rejection), `pointercancel` grace, `touch-action: none`.
- Ink model: raw `SignaturePoint` capture (x, y, time, pressure) → per-stroke
  smoothing/width pipeline; incremental rendering during input (no full
  redraw per point); deterministic full replay for undo/resize/restore.
- Velocity-based variable width (EMA-filtered, `velocityFilterWeight`),
  clamped `minWidth`/`maxWidth`; stylus pressure blending (`pressure:
  "auto" | "ignore"`).
- Stroke-level **undo/redo**; `clear()` as a single undoable action;
  `isEmpty`, `strokeCount`, `canUndo`, `canRedo`.
- **Exports**: `toPNG({ trim, background, scale })` (dataURL + Blob),
  `toSVG({ trim, background })` (variable-width per-segment vector paths),
  `toJSON()`/`fromJSON()` (versioned, replayable).
- Engine-owned canvas management: DPR-aware backing store (cap 2, override),
  own ResizeObserver (confetti precedent), redraw-preserve on resize.
- Edge-only change subscription: `engine.onChange(listener)` (confetti
  `onActiveChange` pattern) driving React state without per-point renders.
- React layer: `useSignaturePad()` (consumer-owned canvas) and
  `<SignaturePad />` (container-filling canvas, optional baseline guideline
  drawn on-canvas, `controllerRef`, `readOnly`, callbacks).
- A11y: state-reflecting `role="img"` + live `aria-label`, documented
  keyboard-alternative pattern (typed-signature fallback recipe in README).
- SSR-safe (no DOM at import; component portals nothing — renders a plain
  canvas, inert until mount), StrictMode-safe (one engine, zero leaks).

### 2.2 Out of scope for v0.1.0 (possible later)

- Typed/keyboard signature generation (font-rendered) — README recipe only.
- Multi-page annotation / drawing-app features (shapes, erasers, layers).
- Stroke playback animation ("watch the signature being drawn").
- Biometric/forensic capture (timing signatures beyond the stored `time`).
- Legacy Touch/Mouse event fallbacks (Pointer Events are universal in
  evergreen browsers).

### 2.3 Explicit non-goals

- Not a general drawing/whiteboard library — the engine is signature-scoped.
- No network calls, no telemetry, no built-in upload.

---

## 3. Functional Requirements

### 3.1 Ink engine

| Feature | Description | Priority |
|---|---|---|
| Pointer capture | `pointerdown` → `setPointerCapture`; stroke continues off-canvas; `pointerup`/`pointercancel` ends it cleanly | P0 |
| Single active pointer | First active pointer draws; concurrent pointers ignored (basic palm rejection); `acceptPointerTypes` filter | P1 |
| Point filtering | Drop points closer than `minDistance` (px) to the previous kept point | P0 |
| Bézier smoothing | Cubic Bézier per segment with control points from neighboring points (signature_pad-style) — no angular polylines | P0 |
| Variable width | Stroke width from EMA-filtered pointer velocity (`velocityFilterWeight`), clamped `[minWidth, maxWidth]`, interpolated along each curve | P0 |
| Pressure blending | `pressure: "auto"` (default): when a pen reports meaningful pressure, blend it into the width; `"ignore"` disables | P1 |
| Incremental render | During input, draw only the newly completed curve segment — O(new points), never full-canvas redraw per point | P0 |
| Deterministic replay | Full redraw (undo/resize/restore) re-runs the identical pipeline → pixel-consistent result; same input → same geometry | P0 |
| Dot support | A tap with no movement renders a single dot of start width | P1 |

### 3.2 History & data

| Feature | Description | Priority |
|---|---|---|
| Undo / redo | Stroke-level; redo stack cleared on new stroke | P0 |
| `clear()` | Wipes ink; a single undoable action (undo restores all strokes) | P0 |
| `isEmpty` / `strokeCount` / `canUndo` / `canRedo` | Introspection, edge-notified | P0 |
| `toJSON()` | Versioned `{ v: 1, width, height, strokes: [{ points, color, minWidth, maxWidth, velocityFilterWeight, pressure, pointerType }] }` — raw points, self-contained per-stroke width params, replayable on any engine | P0 |
| `fromJSON(data)` | Restore + redraw; tolerant of unknown future fields; throws on unsupported major version | P0 |
| `onChange` subscription | Edge-only listener (stroke end / undo / redo / clear / fromJSON) — never fires per point | P0 |
| `onBegin` / `onEnd` | Stroke lifecycle callbacks | P1 |

### 3.3 Exports

| Feature | Description | Priority |
|---|---|---|
| `toPNG(opts?)` | `{ dataURL, blob }`; `trim` (crop to ink bbox + `padding` — default true, padding 8), `background` (default transparent), `scale` (default DPR); committed strokes only (an in-progress stroke is excluded) | P0 |
| `toSVG(opts?)` | Standalone SVG string; variable-width strokes emitted as per-segment stroked paths mirroring rendered geometry; `trim`, `background` | P0 |
| Geometry parity | PNG, SVG, and on-screen rendering all derive from the same pure geometry functions | P0 |
| Empty-pad export | `toPNG`/`toSVG` on an empty pad produce a minimal valid artifact (1×1 transparent / empty-viewBox SVG) — never throw | P1 |

### 3.4 Canvas & environment

| Feature | Description | Priority |
|---|---|---|
| DPR-aware sizing | Backing store at `min(devicePixelRatio, 2)` (override via `dpr`); crisp ink on retina | P0 |
| Resize handling | Engine-owned ResizeObserver; on resize: re-size backing store and **redraw strokes as-is** (CSS-px coordinates preserved, anchored top-left; no scaling — documented) | P0 |
| `touch-action: none` | Set on the canvas by the engine (drawing must not scroll the page) | P0 |
| SSR safety | No `window`/`document` at import; engine constructor throws loudly without a canvas 2D context | P0 |
| `destroy()` | Removes all listeners/observers; idempotent; further calls no-op | P0 |
| Read-only mode | Input pipeline detached; rendering/export/restore still work | P1 |

### 3.5 React layer

| Feature | Description | Priority |
|---|---|---|
| `useSignaturePad(options?)` | `{ canvasRef, isEmpty, canUndo, canRedo, clear, undo, redo, toPNG, toSVG, toJSON, fromJSON }` — engine lazy on canvas attach, destroyed on detach; all functions stable; state via edge subscription only | P0 |
| `<SignaturePad />` | Renders a container-filling canvas; all engine options as props; `controllerRef` imperative handle; `onBegin`/`onEnd`/`onChange(isEmpty)` callbacks | P0 |
| Guideline | Optional baseline ("sign here" line): drawn on-canvas beneath the ink, excluded from exports; `guideline={true | { y?, inset?, color? }}` | P1 |
| `readOnly` | Disables input; `defaultValue` (SignatureData) renders a stored signature | P1 |
| Controlled-ish value | `defaultValue` + `onChange` only — a signature is not a controlled text field; full `value` round-trip is deliberately NOT offered (decision #6) | P0 |
| StrictMode | Double-mount leaves exactly one engine, one set of listeners, zero orphan observers | P0 |

### 3.6 Options (shared `SignatureOptions`)

| Option | Default | Description |
|---|---|---|
| `penColor` | `#1e293b` | Ink color (per-stroke captured at stroke start) |
| `minWidth` | `0.5` | Minimum stroke half-width (px) |
| `maxWidth` | `2.5` | Maximum stroke half-width (px) |
| `velocityFilterWeight` | `0.7` | EMA weight for velocity smoothing (0–1) |
| `minDistance` | `2` | Point-filter threshold (px) |
| `pressure` | `"auto"` | Blend stylus pressure into width (`"ignore"` to disable) |
| `acceptPointerTypes` | `["pen", "touch", "mouse"]` | Which pointer types draw |
| `dpr` | `min(devicePixelRatio, 2)` | Backing-store resolution override |
| `background` | `undefined` (transparent) | Canvas fill beneath ink (also default export background) |

---

## 4. Technical Specifications

### 4.1 Data model

```typescript
/** One captured input sample (raw — smoothing happens at render time). */
export interface SignaturePoint {
  /** CSS-pixel coords relative to the canvas box. */
  x: number;
  y: number;
  /** ms timestamp (performance.now() domain) — velocity + audit. */
  time: number;
  /** Normalized pressure 0–1; 0 when the device reports none. */
  pressure: number;
}

/**
 * One stroke: pen-down → pen-up. Self-contained: every width-determining
 * input is captured at stroke start and stored, so a serialized stroke
 * replays identically on any engine regardless of its options.
 */
export interface SignatureStroke {
  points: SignaturePoint[];
  color: string;
  /** Width bounds captured at stroke start (options may change between strokes). */
  minWidth: number;
  maxWidth: number;
  /** EMA velocity weight captured at stroke start. */
  velocityFilterWeight: number;
  /** Effective pressure mode captured at stroke start. */
  pressure: "auto" | "ignore";
  pointerType: "pen" | "touch" | "mouse";
}

/** Versioned, JSON-serializable document. */
export interface SignatureData {
  v: 1;
  /** CSS-pixel canvas size at capture time. */
  width: number;
  height: number;
  strokes: SignatureStroke[];
}
```

### 4.2 Pure geometry pipeline (`src/ink/` — the hand-testable core)

```typescript
/** Drop points closer than minDistance to the last kept point. */
export function filterPoints(points: readonly SignaturePoint[], minDistance: number): SignaturePoint[];

/** Cubic Bézier control points for the segment p1→p2 given neighbors p0/p3. */
export function bezierFor(
  p0: SignaturePoint | null, p1: SignaturePoint, p2: SignaturePoint, p3: SignaturePoint | null,
): BezierSegment; // { start, c1, c2, end }

/**
 * EMA-filtered velocity → stroke width for a segment.
 * width = clamp(maxWidth / (1 + k·v_ema), minWidth, maxWidth), blended with
 * pressure when meaningful. Pure; the exact formula is fixed here and shared
 * by canvas, PNG, and SVG output.
 */
export function widthForSegment(input: {
  prevVelocity: number; distance: number; dtMs: number;
  minWidth: number; maxWidth: number;
  velocityFilterWeight: number; pressure: number | null;
}): { width: number; velocity: number };

/** Flatten a Bézier segment into N draw steps with interpolated width. */
export function flattenSegment(seg: BezierSegment, startWidth: number, endWidth: number): FlatStep[];

/** Ink bounding box (accounting for stroke widths) for trim/export.
 *  Strokes are self-contained — no options argument. */
export function inkBounds(strokes: readonly SignatureStroke[]): Rect | null;

/** Strokes → standalone SVG markup (per-segment stroked paths). */
export function strokesToSVG(data: SignatureData, opts: SVGExportOptions): string;
```

### 4.3 Headless engine API (`./headless`)

```typescript
export interface SignatureEngineOptions extends SignatureOptions {
  /** Start with input detached (read-only display). @default false */
  readOnly?: boolean;
}

export interface SignatureEngine {
  /** Live flags (edge-notified via onChange). */
  readonly isEmpty: boolean;
  readonly strokeCount: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;

  // history
  clear(): void;
  undo(): void;
  redo(): void;

  // data
  toJSON(): SignatureData;
  fromJSON(data: SignatureData): void;

  // exports
  toPNG(opts?: PNGExportOptions): Promise<{ dataURL: string; blob: Blob }>;
  toSVG(opts?: SVGExportOptions): string;

  // environment
  resize(): void;              // manual re-sync (RO covers the normal path)
  setReadOnly(readOnly: boolean): void;
  destroy(): void;

  /** Edge-only change subscription (stroke end/undo/redo/clear/fromJSON). */
  onChange(listener: (engine: SignatureEngine) => void): () => void;
  /** Stroke lifecycle. */
  onBegin(listener: () => void): () => void;
  onEnd(listener: () => void): () => void;

  /** Synthetic input seam — testing & replay (same path as real pointers). */
  ingest(sample: { type: "down" | "move" | "up" | "cancel"; x: number; y: number; time: number; pressure?: number; pointerType?: string }): void;
}

export function createSignatureEngine(
  canvas: HTMLCanvasElement,
  options?: SignatureEngineOptions,
): SignatureEngine;
```

The engine attaches its own pointer listeners to the canvas, owns its
ResizeObserver, sets `touch-action: none`, and sizes the backing store —
consumers never manage canvas plumbing (confetti precedent).

### 4.4 React API

```typescript
export interface SignaturePadController {
  clear(): void;
  undo(): void;
  redo(): void;
  isEmpty(): boolean;
  toPNG(opts?: PNGExportOptions): Promise<{ dataURL: string; blob: Blob }>;
  toSVG(opts?: SVGExportOptions): string;
  toJSON(): SignatureData;
  fromJSON(data: SignatureData): void;
}

export interface SignaturePadProps extends SignatureOptions {
  controllerRef?: React.Ref<SignaturePadController>;
  /** Render a stored signature (applied once on mount). */
  defaultValue?: SignatureData;
  readOnly?: boolean;
  /** Baseline "sign here" guideline, drawn under the ink, never exported. */
  guideline?: boolean | { y?: number; inset?: number; color?: string };
  onBegin?: () => void;
  onEnd?: () => void;
  /** Fires on stroke end / undo / redo / clear / fromJSON — never per point. */
  onChange?: (state: { isEmpty: boolean; strokeCount: number }) => void;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;      // default: "Signature input area"
}

export function SignaturePad(props: SignaturePadProps): React.ReactNode;

export interface UseSignaturePadReturn {
  canvasRef: React.RefCallback<HTMLCanvasElement>;
  isEmpty: boolean;
  strokeCount: number;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  toPNG: (opts?: PNGExportOptions) => Promise<{ dataURL: string; blob: Blob }>;
  toSVG: (opts?: SVGExportOptions) => string;
  toJSON: () => SignatureData;
  fromJSON: (data: SignatureData) => void;
}

export function useSignaturePad(options?: SignatureEngineOptions & {
  onBegin?: () => void; onEnd?: () => void;
}): UseSignaturePadReturn;
```

### 4.5 Export surface

```typescript
// "."  — React component + hook + everything below
export { SignaturePad } from "./SignaturePad";
export { useSignaturePad } from "./useSignaturePad";
export type { SignaturePadProps, SignaturePadController, UseSignaturePadReturn };

// "./headless" — framework-free (zero React in its graph)
export { createSignatureEngine } from "./engine/createEngine";
export { filterPoints, bezierFor, widthForSegment, flattenSegment, inkBounds, strokesToSVG } from "./ink";
export type {
  SignatureEngine, SignatureEngineOptions, SignatureOptions,
  SignaturePoint, SignatureStroke, SignatureData,
  PNGExportOptions, SVGExportOptions,
};
```

### 4.6 Dependencies

| Package | Purpose |
|---|---|
| — (headless) | **Zero runtime deps** |
| `@usefy/use-isomorphic-layout-effect` | React: SSR-safe engine creation |
| `@usefy/use-latest` | React: stable callback refs |
| `react` / `react-dom` (peer) | ^18 \|\| ^19 |

No CSS pipeline (canvas-only; guideline drawn on-canvas) → `sideEffects: false`,
no `./styles.css` export (confetti precedent, resolved decision #2).

### 4.7 Performance contract

- Incremental input rendering is O(new points); a stroke never triggers a
  full-canvas redraw while drawing.
- React re-renders only on state edges (stroke end/undo/redo/clear) — zero
  renders while ink is flowing.
- 60fps drawing on a mid-range phone; verified by frame sampling in Phase 4
  browser QA.
- Bundle targets (minified+gz via `scripts/measure-size.mjs`, confetti
  pattern): `./headless` **< 5 KB**, React entry **< 7 KB**. Zero deps.

---

## 5. Architecture

### 5.1 File structure

```
packages/signature-pad/
├── src/
│   ├── index.ts                 # "." surface
│   ├── headless.ts              # "./headless" surface
│   ├── types.ts                 # data model + options + resolveOptions
│   ├── ink/                     # PURE geometry (100% coverage target)
│   │   ├── filterPoints.ts
│   │   ├── bezier.ts            # bezierFor + flattenSegment
│   │   ├── width.ts             # widthForSegment (EMA + pressure blend)
│   │   ├── bounds.ts            # inkBounds (trim math)
│   │   └── svg.ts               # strokesToSVG
│   ├── engine/
│   │   ├── createEngine.ts      # pointer pipeline, canvas mgmt, history, RO
│   │   └── render.ts            # incremental segment draw + full replay
│   ├── SignaturePad.tsx
│   ├── useSignaturePad.ts
│   └── *.test.ts(x)             # co-located
├── scripts/measure-size.mjs     # confetti pattern
├── package.json                 # ".", "./headless"; sideEffects: false
├── tsup.config.ts               # single config, two entries (confetti-proven)
├── SPEC.md / README.md
└── vitest.config.ts / vitest.setup.ts / tsconfig.json
```

### 5.2 Data flow

```
 pointerdown/move/up (or engine.ingest)
        │  capture → filterPoints(minDistance)
        ▼
 ┌─────────────────────────────┐
 │ stroke builder (current)     │──► incremental: bezierFor + widthForSegment
 │ raw SignaturePoint[]         │        └► flattenSegment → render.ts (canvas)
 └───────────┬─────────────────┘
             │ pointerup → stroke committed
             ▼
   strokes[] + redoStack[]  ──► onChange edge ──► React state (isEmpty/canUndo…)
             │
             ├── undo/redo/clear/fromJSON ──► full replay (same pipeline)
             ├── toPNG  ──► offscreen replay @scale → trim(inkBounds) → blob
             ├── toSVG  ──► strokesToSVG (same geometry functions)
             └── toJSON ──► raw strokes (versioned)
```

One geometry pipeline, four consumers (screen, PNG, SVG, replay) — parity by
construction, not by testing alone.

---

## 6. Development Milestones

> House loop applies: each phase ends green and passes a `usefy-reviewer`
> checkpoint (★) before the next begins. Phase 4 carries the mandatory
> browser QA (CLAUDE.md Quality bar).

### Phase 1 — Headless ink core ★ (complete)

- [x] Scaffold (confetti parity: single tsup config, two entries, no CSS,
      `rimraf dist && tsup`, measure-size script slot).
- [x] Types + `resolveOptions` (defaults table §3.6, NaN/Infinity `toFinite`
      guards — confetti lesson, applied from day one).
- [x] Pure ink pipeline: `filterPoints`, `bezierFor`, `widthForSegment`
      (EMA + pressure blend), `flattenSegment`, `inkBounds` — exhaustive
      hand-computed tests, **100% coverage on `src/ink/` (all metrics)**.
- [x] Engine: pointer pipeline (capture, single-active-pointer,
      pointercancel, primary-button-only mouse), stroke builder, incremental
      render, full replay, history (undo/redo/clear-undoable), edge-only
      `onChange`/`onBegin`/`onEnd`, DPR + RO + `touch-action`, `destroy`,
      `ingest` seam, read-only mode, SSR-safe imports.
- [x] Determinism test: identical `ingest` sequence → identical `toJSON` and
      identical draw-call geometry (mocked-2D-context arc recording).

### Phase 2 — Exports & serialization ★ (complete)

- [x] `toJSON`/`fromJSON` (versioned; tolerant minor, throwing major;
      round-trip incl. cross-engine-with-different-options test).
- [x] `toPNG`: offscreen replay at `scale`, `trim` via the shared
      `exportBounds` + `padding`, `background` (sanitized + canvas
      read-back probe); dataURL + Blob (toBlob → base64 fallback);
      empty-pad 1×1 artifact.
- [x] `toSVG`: `strokesToSVG` per-segment round-capped paths (mean-diameter
      stroke width); `trim`/`background`; DOMParser valid-XML tests; golden
      string; structural geometry parity (paths ↔ `strokeGeometry` segments).
- [x] Cross-parity test: PNG crop ≈ SVG viewBox ≈ ink bounds (shared
      `exportBounds` makes it identity, not tolerance).

### Phase 3 — React layer ★ (complete)

- [x] `useSignaturePad` (lazy engine on attach, destroy on detach, stable
      functions, edge-only state with value-bail — confetti `useConfetti`
      pattern).
- [x] `<SignaturePad />`: container-filling canvas, all options (reactive,
      with committed-ink carry-over — decision #11), guideline (engine
      `renderUnderlay` seam — on-canvas, export-excluded by construction),
      `defaultValue`, reactive `readOnly`, `controllerRef`, callbacks,
      `aria-label`/`role="img"` with state-reflecting label.
- [x] StrictMode/SSR tests (one engine, zero leaks, renderToString inert),
      controller stability, callback-latest semantics, render-count tests.

### Phase 4 — Ship ★ (complete; browser QA performed)

- [x] Storybook (interactive-first, NO self-running demos): BasicPad
      (Clear/Undo/Redo + live state), ExportPreview (PNG/SVG side-by-side +
      downloads), PenStyles (knobs; ink survives changes), GuidelineAndForm,
      ReadOnlyRestore, DarkSurface, `!autodocs` InteractionTest (synthetic
      pointer sequence → isEmpty flips → undo/redo → export non-empty →
      clear).
- [x] **Browser QA with screenshots** (Playwright, real mouse strokes):
      smooth cornerless curves, visible slow/fast width variation, no
      beading on fast flicks, tap dot; undo/redo/clear visually correct;
      export preview matches on-screen ink (real PNG bytes verified in the
      browser); guideline under ink + absent from exports; touch emulation —
      page does NOT scroll while signing (ink draws instead); DPR-2
      crispness. **No tunable retune needed** — §3.6 defaults confirmed by
      eye (decision #9 exercised, values kept).
- [x] READMEs (package + root, standalone-sibling pattern), web registry
      wiring + regenerate, changeset (`@usefy/signature-pad` minor,
      standalone), SPEC status flip, bundle sizes in README (headless
      ~5.0 KB gz, react entry ~6.4 KB gz — both under target).

---

## 7. Testing Strategy

- **Pure ink math** (highest signal): filter thresholds, Bézier control
  points vs hand-computed values, EMA width sequence for a scripted velocity
  profile, pressure blending on/off, bounds with width inflation, SVG string
  golden tests.
- **Engine** (jsdom + mocked 2D context, `ingest` seam): stroke lifecycle,
  single-pointer policy, cancel, incremental vs replay draw-call parity,
  history semantics (incl. clear-undo, redo invalidation), edge-only
  notification counts, RO/DPR/resize redraw, destroy idempotence,
  NaN/Infinity option guards, read-only.
- **Exports**: round-trip, PNG trim box, empty artifacts, SVG validity +
  parity.
- **React**: StrictMode, SSR, stability, edge-only re-render counting,
  controller, guideline exclusion from exports.
- **Browser (Phase 4)**: real pointer drawing via Playwright, visual ink
  judgment, scroll-prevention, export preview comparison, fps.

---

## 8. Accessibility

- Canvas: `role="img"`, default `aria-label` reflecting state ("Signature
  input area, empty" / "…, signed") updated on change edges.
- Freehand drawing has no meaningful keyboard equivalent — documented
  honestly; README ships a **typed-signature fallback recipe** (text input +
  font rendering) as the recommended accessible alternative, and the
  component API (`readOnly` + `fromJSON`) supports rendering that fallback's
  output.
- All state (empty/signed, can-undo) is exposed programmatically for
  consumer-built accessible toolbars; no color-only signaling.
- No animation — `prefers-reduced-motion` is not applicable (no motion is
  produced beyond the user's own ink appearing under their pointer).

---

## 9. Security & privacy

- No network, no telemetry, no storage — signature data leaves the component
  only through explicit consumer calls (`toPNG`/`toSVG`/`toJSON`).
- `fromJSON` validates shape and version; no HTML/string injection paths
  (SVG output is built from numbers and a fixed template, colors run through
  a sanitizing serializer).

---

## 10. Success Criteria

### Functional
- [x] Signing with mouse/touch/pen produces smooth, width-varying ink with
      no visible corners; a tap renders a dot. (Browser QA, by eye.)
- [x] Undo/redo/clear behave per §3.2 incl. clear-undo. (Unit + browser.)
- [x] PNG (trimmed, transparent) and SVG exports visually match the canvas.
      (Cross-parity tests + browser side-by-side screenshots.)
- [x] JSON round-trip re-renders identically; readOnly restore works.
      (Identical-arc tests; read-only pad pixel-identical under drawing.)
- [x] Page never scrolls while signing on touch. (CDP touch emulation:
      scrollY stays 0, the swipe draws ink.)

### Non-functional
- [x] Pure ink modules 100% coverage (all metrics); package ~99% stmts /
      ~97% branch overall.
- [x] Zero React renders while a stroke is in progress (render-count test).
- [x] Headless < 5 KB gz (measured ~5.00), React entry < 7 KB gz (measured
      ~6.37); zero runtime deps in the headless graph.
- [x] SSR + StrictMode safe; React 18 & 19 peers; TS strict.
- [x] Browser QA evidence (screenshots) attached at Phase 4 review; fps
      sampling subsumed by by-eye smoothness checks on real strokes.

---

## 11. Resolved Decisions

1. **Packaging** — single package + `./headless` (4th consecutive use of the
   house pattern). No umbrella wiring. ✅
2. **No CSS pipeline** — canvas-only; guideline drawn on-canvas (exportable
   layers stay separate); `sideEffects: false`. ✅
3. **Pointer Events only** — no legacy touch/mouse fallback paths. ✅
4. **Engine owns canvas plumbing** — listeners, RO, DPR, `touch-action`
   (confetti precedent). ✅
5. **Resize preserves, never scales** — points are CSS-px, redraw anchored
   top-left; scaling would distort stroke width. Documented limitation. ✅
6. **No controlled `value` prop** — `defaultValue` + `onChange` + imperative
   restore only; per-point controlled round-trips would force render-per-point
   and violate the perf contract. ✅
7. **SVG = per-segment stroked paths** (signature_pad approach) — faithful to
   the rendered width model; filled-outline vectorization is out of scope. ✅
8. **NaN/Infinity guards from day one** (`toFinite` on every numeric option)
   — confetti Phase-1 review lesson, pre-applied. ✅
9. **Default ink tunables are hypotheses** until Phase 4 browser QA; retune
   by eye is pre-authorized and must be documented in §3.6. ✅
10. **Strokes are self-contained** (Phase 1 review) — `velocityFilterWeight`
    and the effective `pressure` mode are stored per stroke alongside
    `minWidth`/`maxWidth`, so `toJSON` documents replay identically on an
    engine with different options; `fromJSON` uses the stored values and
    falls back to the restoring engine's options only for missing/corrupt
    fields. Still `v: 1` (nothing shipped before this change). ✅
11. **Component ink options are reactive with committed-ink carry-over**
    (Phase 3, deviation-turned-decision) — `<SignaturePad />` recreates the
    engine on ink-prop value changes and carries `toJSON()` across
    (lossless for committed strokes thanks to #10); existing ink keeps its
    captured style, new strokes use the new options. Costs, by design:
    history resets, and an in-progress stroke at that moment is discarded.
    The hook keeps read-once options (confetti precedent). ✅
12. **Background/color safety semantics** (Phase 2–3 reviews) — colors pass
    a charset whitelist + `url()` blocklist (`isSafeCssColor`, SPEC §9);
    an unsafe INK color falls back to the default pen color, an unsafe
    BACKGROUND is omitted (transparent) everywhere — live canvas, PNG, and
    SVG sanitize ONCE at engine construction so screen and exports always
    agree; the PNG exporter additionally probes the canvas (two-sentinel
    fillStyle read-back) to skip typo'd colors a real canvas rejects. ✅
13. **Guideline seam** (Phase 3) — engine option
    `renderUnderlay(ctx, w, h)`: invoked on every full redraw after the
    background and before the strokes, save/restore-wrapped, throw-isolated;
    excluded from exports by construction (exporters replay strokes only).
    Trim inflation is floored by the round caps' slack via the shared
    `exportBounds` so caps never clip, even at `padding: 0`. ✅

---

## 12. Appendix

### A. Related packages
- `@usefy/confetti` — canvas/DPR/engine/tsup/measure-size precedents.
- `@usefy/virtual-keyboard` — kiosk story sibling; headless subpath origin.

### B. Prior art surveyed
- [signature_pad](https://github.com/szimek/signature_pad) — the width/EMA
  algorithm reference (vanilla JS).
- react-signature-canvas — dated wrapper; the gap this package fills.

---

*Document Version: 1.0*
*Last Updated: 2026-07-23*

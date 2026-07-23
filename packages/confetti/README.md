<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/confetti</h1>

<p align="center">
  <strong>Canvas confetti &amp; celebration engine for React — hand-written physics, zero dependencies, three consumption layers</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/confetti">
    <img src="https://img.shields.io/npm/v/@usefy/confetti.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/confetti">
    <img src="https://img.shields.io/npm/dm/@usefy/confetti.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/confetti">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/confetti?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/confetti.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="#presets">Presets</a> ·
  <a href="#shapes">Shapes</a> ·
  <a href="#headless-usage">Headless</a> ·
  <a href="#reduced-motion">Reduced Motion</a> ·
  <a href="#performance">Performance</a> ·
  <a href="#limitations">Limitations</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/story/confetti--preset-gallery" target="_blank" rel="noopener noreferrer">
    <strong>🎉 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/confetti` renders celebration effects — bursts, fireworks, cannons, snow — on a canvas overlay (or a canvas you own), driven by a **hand-written particle engine**: gravity, drag, drift, 3D tumble, wobble, per-particle lifetime with fade-out. No animation libraries, no runtime dependencies in the engine.

One `FireOptions` shape works across **three layers**:

1. **One-liner** — `fireConfetti()` creates/reuses a full-viewport canvas and cleans it up afterwards.
2. **React** — `<Confetti />` overlay component with an imperative controller, plus `useConfetti()` for component-scoped canvases.
3. **Headless** — `createConfettiEngine(canvas)` from `@usefy/confetti/headless`: pure TypeScript, zero React, usable from any framework.

### Why @usefy/confetti?

- **Real physics, exact math** — time-based closed-form integration: identical motion at 30/60/120 Hz, no catch-up teleports after a background tab
- **Zero jank by design** — one rAF loop that provably stops when idle, object pooling (zero steady-state allocations), a single `clearRect` + one draw pass per frame, **zero React renders during animation**
- **Shape system** — squares, circles, strips, stars, emoji (`textShape("🎉")`), images (`imageShape`), palette-colored `Path2D` (`pathShape`)
- **Presets** — `celebration`, `fireworks`, `sideCannons`, `pride`, `stars`, continuous `snow`/`rain` — pure data run by `runPreset` on any layer
- **Respectful by default** — `prefers-reduced-motion` no-ops, page-hidden pausing, `pointer-events: none` overlay that never blocks the UI
- **SSR &amp; StrictMode safe** — React 18 + 19

---

## Installation

```bash
# npm
npm install @usefy/confetti

# yarn
yarn add @usefy/confetti

# pnpm
pnpm add @usefy/confetti
```

Requires React 18 or 19 (`react` + `react-dom` peer dependencies) for the React layer. The `./headless` entry is framework-free.

---

## Quick Start

```tsx
import { fireConfetti } from "@usefy/confetti";

function ShipItButton() {
  return (
    <button onClick={() => fireConfetti({ origin: { y: 0.8 }, spread: 70 })}>
      🚀 Ship it
    </button>
  );
}
```

That's it — `fireConfetti()` lazily creates one full-viewport overlay canvas, fires the burst, resolves its promise when the last particle dies, and removes the canvas after a few idle seconds. It is a safe no-op during SSR; under `prefers-reduced-motion` no motion is ever produced (a transient invisible canvas may briefly exist before being reclaimed). `resetConfetti()` tears the singleton down immediately.

### FireOptions (shared by every layer)

| Option | Default | Description |
|---|---|---|
| `count` | `80` | Particles in the burst |
| `origin` | `{ x: 0.5, y: 0.5 }` | Normalized (0–1) canvas coordinates |
| `originJitter` | `{ x: 0, y: 0 }` | Per-particle spawn jitter around `origin` (full width, normalized) — `{ x: 1 }` spawns across the whole canvas |
| `angle` | `90` | Launch direction in degrees (90 = up) |
| `spread` | `45` | Cone width in degrees |
| `startVelocity` | `45` | Initial speed (px/frame @60fps equivalent) |
| `gravity` | `1` | Downward acceleration multiplier |
| `drift` | `0` | Constant horizontal push |
| `decay` | `0.9` | Velocity retention per frame @60fps (canvas-confetti scale) |
| `scalar` | `1` | Size multiplier |
| `lifetime` | `3000` | Particle lifetime in ms (±20% per particle) |
| `colors` | 7-color palette | Fill colors |
| `shapes` | `["square", "circle", "strip"]` | Shape mix |
| `flat` | `false` | Disable the 3D tumble |

---

## API Reference

### `<Confetti />` — overlay with an imperative controller

```tsx
import { useRef } from "react";
import { Confetti, type ConfettiController } from "@usefy/confetti";

function CheckoutSuccess() {
  const confetti = useRef<ConfettiController>(null);

  return (
    <>
      <Confetti
        controllerRef={confetti}
        onComplete={() => console.log("settled")}
      />
      <button onClick={() => confetti.current?.fire({ origin: { y: 0.7 } })}>
        Complete purchase
      </button>
    </>
  );
}
```

| Prop | Default | Description |
|---|---|---|
| `variant` | `"overlay"` | `"overlay"` portals a fixed full-viewport canvas after hydration; `"inline"` fills the parent element (give it `position: relative`) |
| `zIndex` | `1100` | Overlay stacking order (above `@usefy/spotlight-tour`'s 1000) |
| `controllerRef` | — | Receives `{ fire, emit, stop, clear }` (stable identity) |
| `onComplete` | — | Called on each idle edge (all particles dead, no emitter) |
| `fireOnMount` | `false` | `true` or a `FireOptions` — one burst after mount (respects reduced motion) |
| `reducedMotion` | `"respect"` | `"respect"` no-ops under `prefers-reduced-motion`; `"ignore"` animates anyway |
| `className` / `style` | — | Merged onto the canvas element |

The canvas is `aria-hidden` with `pointer-events: none` — it never intercepts input, and the engine pauses automatically while the tab is hidden.

### `useConfetti()` — a canvas you own

```tsx
import { useConfetti } from "@usefy/confetti";

function CardCelebration() {
  const { canvasRef, fire, isActive } = useConfetti();

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />
      <button disabled={isActive} onClick={() => fire({ origin: { y: 0.9 } })}>
        {isActive ? "Celebrating…" : "🎉 Celebrate"}
      </button>
    </div>
  );
}
```

Returns `{ canvasRef, fire, emit, stop, clear, isActive }` — all functions stable; `isActive` re-renders **only** on idle↔active edges, never per frame.

---

## Presets

Presets are frozen, tree-shakeable **data** executed by `runPreset(target, preset)`, where the target is anything with `fire` + `emit` — a headless engine, a `<Confetti />` controller, or the `useConfetti()` return value.

```tsx
import { runPreset, fireworks, snow } from "@usefy/confetti";

const run = runPreset(confettiController, fireworks);
await run.done;      // resolves when the finale has fully played out
// …
const winter = runPreset(confettiController, snow); // indefinite emitter
winter.cancel();     // stop snowing (falling flakes finish naturally)
```

| Preset | Type | What it looks like |
|---|---|---|
| `celebration` | burst | Double side burst toward the center + second volley |
| `fireworks` | burst | Three staggered 360° shells high on the canvas |
| `sideCannons` | emit (2s) | Continuous cannons from the lower corners |
| `pride` | emit (2.5s) | Rainbow-colored side cannons |
| `stars` | burst | Double golden star burst |
| `snow` | emit (∞) | Gentle full-width snowfall — stop via `cancel()` |
| `rain` | emit (∞) | Fast full-width rain streaks — stop via `cancel()` |

`cancel()` skips pending bursts and stops all emitters (idempotent). Presets are deep-frozen — copy options (`{ ...stars.bursts[0].options }`) to customize. Note: under reduced motion, burst presets resolve near-instantly, while timed emit presets still wait out their `durationMs`.

---

## Shapes

```tsx
import { fireConfetti, textShape, imageShape, pathShape } from "@usefy/confetti";

// Emoji / text — rastered once at DPR resolution, drawn as tumbling sprites
fireConfetti({ shapes: [textShape("🎉", { size: 26 }), textShape("🎊")] });

// Images — skipped silently until decoded, then drawn as sprites
fireConfetti({ shapes: [imageShape("/logo.png", { height: 14 })] });

// Custom Path2D in a unit box — filled with the burst palette per particle
const heart = pathShape(() => {
  const p = new Path2D("M0.5 1 L0.06 0.55 A0.25 0.25 0 1 1 0.5 0.2 A0.25 0.25 0 1 1 0.94 0.55 Z");
  return p;
}, { size: 12 });
fireConfetti({ shapes: [heart, "star"] });
```

Built-ins: `"square"`, `"circle"`, `"strip"`, `"star"` — mix freely with custom shapes in one burst.

---

## Headless Usage

The entire engine is framework-free:

```ts
import { createConfettiEngine, runPreset, celebration } from "@usefy/confetti/headless";

const canvas = document.querySelector("canvas")!;
const engine = createConfettiEngine(canvas, { poolSize: 500 });

await engine.fire({ count: 120 });        // resolves when the burst dies
const handle = engine.emit({ particlesPerSecond: 20 }); // continuous
handle.stop();

engine.onActiveChange((active) => {        // idle↔active edges only
  statusDot.classList.toggle("busy", active);
});

engine.pause();   // e.g. page hidden — resume() has no catch-up teleport
engine.destroy(); // full teardown (rAF, ResizeObserver, pool)
```

The engine owns DPR-aware backing-store sizing (capped ×2) and its own `ResizeObserver`. `spawnParticle`/`stepParticle`/`resolveFireOptions` are exported as pure functions.

---

## Reduced Motion

By default (`reducedMotion: "respect"`) every `fire`/`emit` resolves immediately as a no-op when the user prefers reduced motion — checked live at call time. Opt out per engine/component with `reducedMotion: "ignore"`.

Recipe for a motion-free celebration:

```tsx
import { useReducedMotion } from "@usefy/use-reduced-motion";

const reduced = useReducedMotion();
// confetti no-ops on its own; show a static flourish instead:
{justFinished && reduced && <span aria-hidden>🎉</span>}
```

---

## Performance

Verified in browser QA and by the test suite:

- **500+ simultaneous particles at 60fps** (measured ~60.5fps under ~550 particles in headless Chromium)
- **Zero steady-state allocations** — pooled particles are reused across bursts (object-identity-tested)
- Single `requestAnimationFrame` loop per engine; **provably idle** when nothing animates (`engine.active`)
- One `clearRect` + one draw pass per frame; sprites raster once; no `save()`/`restore()` per particle

Bundle sizes (minified + gzip, measured by `pnpm --filter @usefy/confetti size`):

| Import | Size |
|---|---|
| Engine only (tree-shaken from `./headless`) | **3.17 KB** |
| Full `./headless` surface (engine + shapes + presets) | **4.94 KB** |
| Full React entry (`"."`, react external) | **6.44 KB** |

---

## Limitations

- **Canvas 2D only** — no WebGL renderer (the 2D path already hits the perf bar; the renderer seam is kept narrow for a possible future backend).
- **No physics interactions** — no collisions, mouse forces, or attractors.
- `imageShape` loads only URLs you provide; no network activity otherwise, no telemetry, no persistence.
- The singleton overlay uses `z-index: 1100`; pass `zIndex` on `<Confetti />` if your app's stacking context needs something else.

---

## License

MIT © [usefy](https://github.com/mirunamu00/usefy)

# Confetti Component Specification

## Overview

**Package Name:** `@usefy/confetti` — single package with a `./headless` subpath (house pattern: virtual-keyboard, spotlight-tour)
**Version:** `0.1.0`
**Status:** Shipped (v0.1.0)
**Created:** 2026-07-23
**Author:** usefy team

---

## 1. Executive Summary

### 1.1 Purpose

`@usefy/confetti` is a canvas confetti/celebration engine for React: performant
particle bursts (and continuous effects like snow) rendered on an overlay or
consumer-supplied canvas, driven by a **hand-written physics engine** — no
external animation libraries. It ships three consumption layers:

1. **One-liner**: `fireConfetti()` — a singleton helper that creates/reuses a
   full-viewport canvas. The 5-second quick start.
2. **React**: `<Confetti controllerRef={ref} />` overlay component +
   `useConfetti()` hook for component-scoped canvases.
3. **Headless engine** (`./headless`): `createConfettiEngine(canvas, opts)` —
   pure TypeScript, framework-free, usable anywhere.

Demand is proven (`canvas-confetti` ~900k weekly downloads; `react-confetti`
~400k), and the natural pairing with `@usefy/spotlight-tour` (celebrate
`onFinish`) makes it the monorepo's showcase piece. **Motion quality is the
product** — this package leans directly on the house browser-QA pipeline
(frame sampling, fps checks, reduced-motion verification).

### 1.2 Target Users

- **Onboarding / gamification flows** — celebrate a completed tour, first
  deploy, streak milestone (pairs with `SpotlightTour.onFinish`).
- **E-commerce / conversion moments** — purchase complete, signup success.
- **Dashboards & games** — achievements, records, season events (snow/rain).
- **Design systems** wanting a framework-free engine (`./headless`).

### 1.3 Key Value Propositions

1. **Real particle engine, zero deps**: gravity, drag, drift, 3D-tumble
   rotation, per-particle wobble — pure functions, unit-tested, object-pooled
   (no GC churn mid-animation).
2. **One API, three layers**: singleton one-liner → React component/hook →
   headless engine. Same `FireOptions` everywhere.
3. **Shape system**: squares, circles, strips/ribbons, stars, **emoji/text**,
   images, and custom `Path2D` — brandable out of the box.
4. **Presets**: `celebration`, `fireworks`, `sideCannons`, `pride`, `stars`,
   plus continuous `snow`/`rain` via emit mode.
5. **Respectful by default**: `prefers-reduced-motion` no-ops (overridable),
   rAF loop fully idle when no particles are alive, paused when the page is
   hidden, `pointer-events: none` overlay that never blocks the UI.
6. **SSR/StrictMode-safe** like every usefy package; React 18 + 19.

---

## 2. Scope & Non-Goals

### 2.1 In scope (v0.1.0 — full spec, single release)

- Canvas 2D particle engine: burst (`fire`) and continuous (`emit`) modes,
  object pooling, DPR-aware sizing, resize tracking, idle rAF shutdown.
- Physics: initial velocity + angle/spread randomization, gravity, drag
  (decay), horizontal drift, 3D tumble (scaleY oscillation) + 2D rotation,
  wobble, per-particle lifetime with opacity fade-out.
- Shapes: `square`, `circle`, `strip`, `star`, emoji/text (`textShape("🎉")`),
  image (`imageShape(url|HTMLImageElement)`), custom `Path2D` factory.
- Presets (each a `FireOptions[]`/emit config, tree-shakeable named exports):
  `celebration`, `fireworks`, `sideCannons`, `pride`, `stars`, `snow`, `rain`.
- `fireConfetti(opts?)` singleton (auto-managed viewport canvas, SSR no-op) +
  `resetConfetti()` teardown helper.
- `<Confetti />` React component: portal full-viewport overlay canvas by
  default (`pointer-events: none`, configurable `zIndex`), or `inline` mode
  rendering a canvas that fills its container; `controllerRef` imperative
  handle (`fire`/`emit`/`stop`/`clear`); `onComplete` when all particles die;
  optional `fireOnMount`.
- `useConfetti()` hook: `{ canvasRef, fire, emit, stop, clear, isActive }` for
  a consumer-owned canvas.
- `./headless`: `createConfettiEngine`, all shape helpers, presets, physics
  types — **zero React imports**.
- Reduced motion: engine option `reducedMotion: "respect" | "ignore"`
  (default `"respect"` → `fire`/`emit` resolve immediately as no-ops); React
  layer auto-detects via `use-reduced-motion`.
- Page visibility: loop pauses while hidden (no burst "wall" on return);
  React layer uses `use-page-visibility`, engine exposes `pause()`/`resume()`.
- SSR-safe (no `window`/`document`/canvas at import; singleton no-ops on
  server), StrictMode-safe (double-mount leaves one canvas, zero leaks).

### 2.2 Out of scope for v0.1.0 (possible later)

- WebGL renderer (2D canvas hits the perf bar; keep the renderer seam narrow).
- Physics interactions (collision, mouse forces, attractors).
- Worker/OffscreenCanvas rendering.
- Built-in sound effects.

### 2.3 Explicit non-goals

- Not a general animation/tween library; the engine is confetti-scoped.
- No network, no telemetry.

---

## 3. Functional Requirements

### 3.1 Engine

| Feature | Description | Priority |
|---|---|---|
| `fire(opts)` burst | Spawn N pooled particles with randomized velocity within `angle ± spread/2`; returns a Promise resolving when that burst's particles all die | P0 |
| `emit(opts)` continuous | Spawn at `particlesPerSecond` until the returned handle's `stop()`; at most one rAF loop regardless of concurrent bursts/emitters | P0 |
| Physics step | Pure `stepParticle(p, dt)`: velocity decay, gravity, drift, rotation/tumble/wobble advance, lifetime + fade; time-based (dt), not frame-count-based — consistent speed at any fps | P0 |
| Object pooling | Particles recycled from a pool; steady-state `fire` allocates zero new objects after warm-up | P0 |
| Idle shutdown | rAF loop stops when no particles alive AND no emitter active; `engine.active` reflects it | P0 |
| Canvas mgmt | DPR-aware backing-store sizing, resize re-sync, `clear()` wipes instantly, `destroy()` releases everything | P0 |
| `pause()`/`resume()` | Freeze/unfreeze the loop (page-hidden integration); dt clamped on resume so no teleport-catch-up | P1 |
| Reduced motion | `reducedMotion: "respect"` (default) → fire/emit no-op (resolved Promise); `"ignore"` runs anyway | P0 |

### 3.2 FireOptions (shared by every layer)

| Option | Default | Description |
|---|---|---|
| `count` | `80` | Particles in the burst |
| `origin` | `{ x: 0.5, y: 0.5 }` | Normalized (0–1) canvas coords |
| `originJitter` | `{ x: 0, y: 0 }` | Per-particle spawn jitter around `origin`, normalized full width (`{ x: 1 }` = whole canvas — used by `snow`/`rain`). *Added during Phase 3: emit presets need a line source, not a point source.* |
| `angle` | `90` | Launch direction, degrees (90 = up) |
| `spread` | `45` | Cone width, degrees |
| `startVelocity` | `45` | Initial speed (px/frame @60fps equivalent) |
| `gravity` | `1` | Downward acceleration multiplier (base tuned by eye in browser QA: 350 px/s² at `1` — see `GRAVITY_ACCEL`) |
| `drift` | `0` | Constant horizontal push |
| `decay` | `0.9` | Velocity retention **per frame @60fps** (canvas-confetti-compatible scale; converted internally to an exact per-second value). *Retuned during Phase 4 browser QA — the original "per-second retention" reading made bursts fly off-screen in <1s with no flutter phase.* |
| `scalar` | `1` | Size multiplier |
| `lifetime` | `~3000ms` | Particle lifetime (randomized ±20%) |
| `colors` | brand-neutral 7-color palette | Fill colors |
| `shapes` | `["square", "circle", "strip"]` | Shape mix |
| `flat` | `false` | Disable 3D tumble |

### 3.3 React layer

| Feature | Description | Priority |
|---|---|---|
| `<Confetti />` overlay | Portal fixed full-viewport canvas, `pointer-events: none`, `zIndex` (default 1100), mounts after hydration (SSR-safe) | P0 |
| `variant="inline"` | Canvas fills its parent container (position: relative host) instead of the viewport | P1 |
| `controllerRef` | `{ fire, emit, stop, clear }` — mirrors `TourController` ergonomics | P0 |
| `onComplete` | Fires when the engine goes idle (all particles dead, no emitter) | P1 |
| `fireOnMount` | `boolean \| FireOptions` — one burst after mount (respects reduced motion) | P2 |
| `useConfetti()` | `{ canvasRef, fire, emit, stop, clear, isActive }`; engine created lazily on first canvas attach, destroyed on unmount | P0 |
| `fireConfetti()` | Module-level singleton; lazily creates one viewport canvas (removed when idle after `singletonTeardownMs`), no-op on server & under reduced motion | P0 |

### 3.4 Shapes & presets

| Feature | Description | Priority |
|---|---|---|
| Built-in shapes | `square`, `circle`, `strip`, `star` | P0 |
| `textShape(text, opts?)` | Emoji/text rendered to an offscreen raster once, drawn as sprite | P0 |
| `imageShape(src)` | Image sprite (async decode handled; falls back silently until loaded) | P1 |
| `pathShape(factory)` | Custom `Path2D` in a unit box | P1 |
| Presets | `celebration` (double side burst), `fireworks` (staggered center bursts), `sideCannons` (continuous 2-origin emit for N ms), `pride` (rainbow side cannons), `stars` (gold star burst), `snow`/`rain` (indefinite emit configs). **Shipped call shape:** each preset is deep-frozen data (`{ type: "burst", bursts: [{ delayMs, options }] }` / `{ type: "emit", emitters: [{ options, durationMs? }] }`) executed by `runPreset(target, preset) → { done, cancel }`, where the target is anything with `fire`+`emit` (engine, `ConfettiController`, `useConfetti()` return) | P0/P1 |

---

## 4. Technical Specifications

### 4.1 Headless engine API (`./headless`, zero React)

```typescript
export interface ConfettiEngineOptions {
  reducedMotion?: "respect" | "ignore";   // default "respect"
  poolSize?: number;                       // default 500 (grows on demand)
  dpr?: number;                            // default devicePixelRatio, capped 2
}

export interface EmitHandle {
  stop(): void;                 // stop spawning; live particles finish naturally
  readonly active: boolean;
}

export interface ConfettiEngine {
  fire(opts?: FireOptions): Promise<void>;
  emit(opts?: EmitOptions): EmitHandle;    // EmitOptions = FireOptions + particlesPerSecond
                                           // (rate 0 → inert handle)
  stop(): void;                            // stop all emitters (bursts finish)
  clear(): void;                           // kill everything, wipe canvas now
  pause(): void;
  resume(): void;
  destroy(): void;                         // clear + release canvas/listeners/pool
  resize(): void;                          // re-sync to canvas CSS size × DPR
  onActiveChange(l: (active: boolean) => void): () => void;
                                           // idle↔active edges only (never per
                                           // frame) — the seam the React layer
                                           // uses for onComplete/isActive
  readonly active: boolean;
}

export function createConfettiEngine(
  canvas: HTMLCanvasElement,
  options?: ConfettiEngineOptions,
): ConfettiEngine;

// Pure, exported for tests & advanced use:
export function stepParticle(p: Particle, dtMs: number): boolean; // false = dead
export function spawnParticle(pool: Particle, opts: ResolvedFireOptions, random: () => number): void;
```

Shape helpers and presets are exported from `./headless` too (`textShape`,
`imageShape`, `pathShape`, `presets`). All types (`FireOptions`, `EmitOptions`,
`ConfettiShape`, `Particle`) live in `types.ts`.

### 4.2 React API (`"."` — re-exports everything from `./headless` as well)

```typescript
export interface ConfettiController {
  fire(opts?: FireOptions): Promise<void>;
  emit(opts?: EmitOptions): EmitHandle;
  stop(): void;
  clear(): void;
}

export interface ConfettiProps {
  variant?: "overlay" | "inline";          // default "overlay"
  zIndex?: number;                          // default 1100 (above the tour's 1000)
  controllerRef?: React.Ref<ConfettiController>;
  onComplete?: () => void;
  fireOnMount?: boolean | FireOptions;
  reducedMotion?: "respect" | "ignore";     // default "respect"
  className?: string;
  style?: React.CSSProperties;
}
export function Confetti(props: ConfettiProps): React.ReactNode;

export interface UseConfettiReturn {
  canvasRef: React.RefCallback<HTMLCanvasElement>;
  fire(opts?: FireOptions): Promise<void>;
  emit(opts?: EmitOptions): EmitHandle;
  stop(): void;
  clear(): void;
  isActive: boolean;                        // re-renders only on idle↔active edges
}
export function useConfetti(options?: ConfettiEngineOptions): UseConfettiReturn;

export function fireConfetti(opts?: FireOptions): Promise<void>;
export function resetConfetti(): void;      // destroy the singleton canvas now
```

All controller functions `useCallback`/stable; `isActive` derived via
subscription to the engine's idle/active edge (no per-frame React work —
**zero React renders during animation**).

### 4.3 Rendering & performance contract

- Single `requestAnimationFrame` loop per engine; **loop not running ⇔ no
  particles and no emitters** (verifiable via `engine.active`).
- Time-based physics (`dt` clamped to ≤ 64ms) — consistent at 30/60/120Hz,
  no catch-up burst after `resume()`/tab return.
- Object pool: after warm-up, steady-state `fire(80)` performs **zero
  allocations** in the hot loop (verified by test on pool reuse).
- Draw path: single `clearRect` + one pass over alive particles; shape sprites
  (text/image) rastered once and `drawImage`d; no `save()/restore()` per
  particle (manual transform math).
- Perf bar: **500 simultaneous particles at 60fps** on a mid-range laptop
  (browser QA sanity-checks frame pacing).
- Bundle targets: headless engine **< 6KB gz**, full React entry **< 9KB gz**
  (no CSS — the overlay canvas is styled inline; `sideEffects: false`, no
  `./styles.css` export. Deviation from vk/spotlight-tour precedent is
  deliberate: there is nothing to theme).

### 4.4 Dependencies

| Package | Purpose |
|---|---|
| `@usefy/use-reduced-motion` | React-layer motion preference |
| `@usefy/use-page-visibility` | Pause/resume on tab hide |
| `@usefy/use-isomorphic-layout-effect` | SSR-safe canvas setup |
| `@usefy/use-latest` | Stable callbacks (`onComplete`) |
| `react` / `react-dom` (peer) | ^18 \|\| ^19 |

No `clsx` (no class juggling), no animation libs. The engine itself (headless)
has **zero** dependencies. Canvas sizing uses a plain `ResizeObserver` inside
the engine (framework-free requirement) — not `use-resize-observer`.

### 4.5 Environment support

| Environment | Support | Notes |
|---|---|---|
| Evergreen browsers | Full | Canvas 2D + rAF |
| SSR (Next/Remix) | Safe | Import-safe; singleton/component no-op until mount |
| Reduced motion | Respected | Default no-op, opt-out documented |
| Low-end devices | Degrades | dt-based physics keeps motion correct at low fps |

---

## 5. Architecture

### 5.1 Package layout

```
packages/confetti/
├── src/
│   ├── index.ts                 # "." — React layer + re-export of headless
│   ├── headless.ts              # "./headless" — engine, shapes, presets, types
│   ├── engine/
│   │   ├── createEngine.ts      # loop, pool, canvas mgmt, fire/emit/pause
│   │   ├── physics.ts           # stepParticle, spawnParticle (pure)
│   │   ├── pool.ts              # particle pool (pure-ish, testable)
│   │   └── draw.ts              # renderParticle, sprite cache
│   ├── shapes/
│   │   ├── builtin.ts           # square/circle/strip/star draw fns
│   │   ├── textShape.ts         # emoji/text sprite
│   │   ├── imageShape.ts
│   │   └── pathShape.ts
│   ├── presets.ts
│   ├── Confetti.tsx             # overlay/inline component
│   ├── useConfetti.ts
│   ├── singleton.ts             # fireConfetti / resetConfetti
│   ├── types.ts
│   └── *.test.ts(x)
├── package.json                 # ".", "./headless"; sideEffects: false
├── tsup.config.ts               # minimal (no SCSS pipeline needed)
├── SPEC.md / README.md / vitest configs / tsconfig
```

### 5.2 Data flow

```
fireConfetti() ──┐
<Confetti/> ─────┤ (each owns/attaches a canvas)
useConfetti() ───┘
        │ fire/emit
        ▼
  createConfettiEngine ── pool.take() → spawnParticle()
        │ rAF (only while alive)
        ▼
  stepParticle(dt) ──dead──► pool.release()   │ alive ──► draw.renderParticle
        │
   idle edge ──► stop rAF, resolve fire() promises, onComplete
```

React never renders per frame; the engine is imperative and self-contained.

---

## 6. Development Milestones

> Full spec lands in one v0.1.0 release. Each phase ends green
> (`pnpm typecheck` + package tests); ★ = `usefy-reviewer` checkpoint.
> Phases 2–4 include **browser visual QA per the house Quality bar** —
> for this package, motion IS the product.

### Phase 1 — Headless engine ★ (done)

- [x] Scaffold (`add-usefy-component` conventions; minimal tsup, two entries, no SCSS). *(Build note: the two entries live in ONE tsup config — a parallel two-config array crashed node natively on warm Windows rebuilds; the `"use client"` banner therefore lands on both entries, per spotlight-tour precedent.)*
- [x] Types (§3.2, §4.1); `resolveFireOptions` defaults/merging (+ NaN/Infinity hardening on every numeric field).
- [x] `physics.ts` + `pool.ts` pure & exhaustively unit-tested (dt scaling exact via closed-form integration, decay math, lifetime/fade, pool reuse & growth, zero-alloc steady state).
- [x] `createEngine`: canvas DPR sizing + ResizeObserver, rAF lifecycle (idle shutdown, `active`, `onActiveChange` edges), `fire` promise resolution, `emit` handles, `stop`/`clear`/`pause`/`resume`/`destroy`, reduced-motion no-op, dt clamp on resume.
- [x] Built-in shapes (square/circle/strip/star) + `draw.ts` sprite cache; deterministic tests via injected `random` + mocked 2D context.

### Phase 2 — React layer ★ (done)

- [x] `<Confetti />` overlay (portal after mount, inline variant, zIndex, pointer-events none), `controllerRef`, `onComplete` (idle-edge subscription), `fireOnMount`.
- [x] `useConfetti` (lazy engine on canvas attach, destroy on unmount, stable returns, `isActive` edge-only re-renders).
- [x] `fireConfetti`/`resetConfetti` singleton (SSR no-op, idle teardown timer `SINGLETON_TEARDOWN_MS`, StrictMode-safe reuse).
- [x] `use-page-visibility` pause/resume (component + hook; singleton uses a plain `visibilitychange` listener engine-side); `use-reduced-motion` wiring.
- [x] jsdom tests (mock canvas/rAF): lifecycle, StrictMode double-mount → one canvas + full teardown, SSR renderToString, controller stability.

### Phase 3 — Shapes+, presets & polish ★ (done)

- [x] `textShape` (emoji) with sprite raster (DPR-capped, scalar headroom ≤×4); `imageShape` (async decode via null-retry, silent error fallback); `pathShape` (unit-box `Path2D`, per-particle palette colors).
- [x] Presets: `celebration`, `fireworks`, `sideCannons`, `pride`, `stars`, `snow`, `rain` — deep-frozen, documented, tree-shakeable exports + cancelable `runPreset`.
- [x] Perf verification: 500-particle structural tests (single clearRect, one draw pass, zero-alloc) + wall-clock 60fps in browser QA; bundle sizes measured by `scripts/measure-size.mjs` (see §10).

### Phase 4 — Ship ★ (builder complete; final review pending)

- [x] Coverage ≥90% (engine pure parts 100%; package ~99.5% stmts).
- [x] Storybook (interactive-first per `add-usefy-story`): button-triggered preset gallery with night-sky snow panel, emoji/brand shapes, origin-from-click demo, continuous snow toggle, **SpotlightTour `onFinish` integration demo**, `useConfetti` inline-canvas demo; one `!autodocs` `InteractionTest` story. **No demo self-runs** (verified: all six demos open with 0 painted pixels).
- [x] Browser visual QA (builder side): 29/29 automated Playwright checks + screenshot review — bursts decay smoothly (physics retuned by eye: `decay` semantics + `GRAVITY_ACCEL` 350 + snow density), ~60.5fps at ~550 particles, reduced-motion no-op, click-through verified through a live burst, dark background checked.
- [x] READMEs (package + root + apps/web registry wiring), changeset (`@usefy/confetti` minor, standalone).
- [ ] Final independent review ★.

---

## 7. Testing Strategy

- **Physics/pool (pure)**: dt scaling (same result 1×60fps vs 60×1fps within tolerance), decay/gravity/drift math, lifetime & fade curve, pool take/release/growth, injected-`random` determinism.
- **Engine (mocked canvas + fake rAF/timers)**: loop starts on fire / stops on idle, `fire` promise resolves exactly when its cohort dies, emit spawn rate honors dt, pause/resume without catch-up, clear/destroy teardown, reduced-motion no-op, resize re-sync.
- **React (jsdom)**: SSR empty render; StrictMode double-mount → single canvas, no orphan rAF/observers; controllerRef stability; onComplete on idle edge; singleton reuse + teardown; fireOnMount respects reduced motion.
- **Browser (Storybook QA)**: real burst rendering, frame pacing sanity, overlay click-through, reduced-motion emulation — per the Quality bar, both builder and reviewer drive the stories.

---

## 8. Accessibility & UX

- Overlay canvas is `aria-hidden="true"`, `pointer-events: none` — purely
  decorative, never intercepts input or focus.
- `prefers-reduced-motion` no-ops by default; consumers may pass a
  reduced-motion-friendly alternative themselves (documented recipe: static
  "🎉" flash).
- No flashing patterns beyond gentle particle motion (no strobe).

## 9. Security

- No network (image shapes load only consumer-provided URLs), no telemetry,
  no persistence. Canvas is same-origin-safe (no `getImageData` use).

---

## 10. Success Criteria

- [x] `fireConfetti()` one-liner is SSR-safe with zero config (module import-safe; server calls resolve as no-ops; singleton canvas created only client-side — unit-tested; a live Next.js smoke test remains a post-ship nicety).
- [x] Tour-finish integration demo: spotlight-tour `onFinish` → celebration burst (Storybook `confetti--tour-finish-celebration`, driven end-to-end in browser QA).
- [x] 500 particles @ 60fps (measured ~60.5fps at ~550 particles in headless Chromium); rAF provably idle when nothing animates (pending-rAF = 0 asserted); zero steady-state allocations (object-identity pool tests at 500).
- [x] Reduced-motion users get no motion by default (unit tests + Playwright `reducedMotion: "reduce"` emulation: 0 painted pixels).
- [x] Coverage ≥90% (~99.5% stmts, pure parts 100%). Bundle (minified+gz via `pnpm --filter @usefy/confetti size`): headless full surface **4.94 KB** (< 6 KB ✓; engine-only tree-shaken 3.17 KB), React entry **6.44 KB** (< 9 KB ✓). Zero runtime deps in the engine; React layer composes only `@usefy/use-*` hooks; React 18+19; TS strict.

---

## 11. Resolved Decisions

1. **Packaging** — single `@usefy/confetti` with `./headless` (React-free
   engine); no separate hook package; independent versioning. Per house
   precedent. ✅ 2026-07-23
2. **No CSS pipeline** — canvas styled inline; `sideEffects: false`, no
   `./styles.css` export (deviation from vk/spotlight-tour, justified: nothing
   themeable). ✅
3. **Renderer** — Canvas 2D only for v0.1.0; renderer seam kept narrow for a
   possible future WebGL backend. ✅
4. **Reduced motion default** — `"respect"` → no-op (not a degraded
   animation); explicitly overridable. ✅
5. **Engine owns its ResizeObserver** (framework-free requirement) — the
   React layer does not duplicate resize handling. ✅

---

*Document Version: 1.1 — updated at ship: decay semantics + gravity retune (Phase 4 browser QA), `originJitter`, preset data + `runPreset` shape, `onActiveChange`, measured sizes/criteria.*
*Last Updated: 2026-07-23*

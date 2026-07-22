# SpotlightTour Component Specification

## Overview

**Package Name:** `@usefy/spotlight-tour` — single package with a `./headless` subpath (virtual-keyboard packaging pattern)
**Version:** `0.1.0`
**Status:** Shipped (v0.1.0)
**Created:** 2026-07-22
**Author:** usefy team

---

## 1. Executive Summary

### 1.1 Purpose

`SpotlightTour` is a React onboarding walkthrough component. It dims the whole
screen with an overlay, cuts a **spotlight hole** around a target element, and
shows a step tooltip next to it ("This is the search bar → Next → Here are your
settings → Done"). Steps are data; the spotlight follows its target through
scroll, resize, and layout changes, and **animates smoothly** from one step's
target to the next.

The niche is real: `react-joyride` (~400k weekly downloads) is effectively
unmaintained, and `driver.js` is not React-native. A modern, accessible,
React-18/19 tour library built on the usefy hook family fills that gap — and
showcases the "hooks → component" story better than any other package
(8+ `@usefy/use-*` hooks consumed in production).

### 1.2 Target Users

- **SaaS / dashboard** apps onboarding new users through complex UIs.
- **Feature-announcement** flows ("what's new" highlighting a shipped feature).
- **Docs / demo sites** guiding readers through interactive examples.
- **Design systems** wanting a headless tour primitive (`./headless`) to skin
  with their own tooltip UI.

### 1.3 Key Value Propositions

1. **Spotlight that actually tracks**: SVG-mask overlay pinned to the target
   through scroll, resize, and DOM mutation — not a one-shot position snapshot.
2. **Animated step transitions**: the spotlight morphs from the previous target
   to the next (interpolated rect + radius), the detail that separates polished
   products from demos. Disabled automatically under `prefers-reduced-motion`.
3. **Headless core**: `useSpotlightTour` exposes the full state machine +
   positioning data via `./headless` so consumers can render a bespoke UI.
4. **Enterprise a11y**: focus trap, keyboard navigation, `role="dialog"`,
   live-region step announcements, focus restore on exit — WCAG 2.1 AA.
5. **Controlled & uncontrolled everything**: `open`/`step` both follow the
   `useControllableState` pattern; imperative controller for event-driven flows.
6. **Zero runtime deps beyond usefy + clsx**: positioning (flip/shift/arrow) is
   implemented in-house as pure, unit-testable functions.

---

## 2. Scope & Non-Goals

### 2.1 In scope (v0.1.0 — full spec, single release)

- Dim overlay with an SVG-mask spotlight (padding + border-radius per step).
- Step system: `target` as CSS selector / ref / function; per-step placement,
  padding, radius, and content.
- Live target tracking (scroll, resize, mutation) + animated step transitions.
- Auto-scroll off-screen targets into view before showing the step.
- Missing-target policy per step: `skip` (default) / `wait` (with timeout) /
  `center` (render as a centered modal step with no spotlight).
- Tooltip with in-house positioning: `top`/`bottom`/`left`/`right` (+ `auto`),
  flip on overflow, shift to stay in viewport, arrow pointing at the target.
- Default tooltip UI: title, content, step counter, progress dots,
  Back / Next / Skip / Done buttons, close (×) — all label-overridable and
  fully replaceable via `renderStep`.
- Progress control: controlled/uncontrolled `open` and `step`, callbacks,
  imperative controller (`next/prev/goTo/skip/finish`).
- **Interaction gates**: a step can require a real click on its target (or a
  custom event) to advance, with the Next button hidden or disabled.
- A11y: focus trap in the tooltip, `←`/`→`/`Esc` keys, background scroll lock,
  `role="dialog"` + `aria-live` announcements, focus restore, reduced motion.
- **Persistence**: `tourId` + localStorage — a finished/skipped tour does not
  auto-open again (plain guarded helpers in `persistence.ts`; imperative
  write-on-event doesn't fit `use-local-storage`'s reactive hook shape).
- **Beacon**: exported `SpotlightBeacon` — a pulsing dot pinned to an element
  that starts the tour (at a given step) when clicked.
- Theming via `--usefy-tour-*` CSS variables, light/dark, `classNames` slots.
- SSR-safe (portal render guarded; no `window`/`document` at import).

### 2.2 Out of scope for v0.1.0 (possible later)

- Multi-page / router-spanning tours (persist step across navigation).
- Branching / conditional step graphs (non-linear tours).
- Canvas/WebGL confetti-style celebration on finish.
- Built-in analytics callbacks beyond the lifecycle events already exposed.
- Targets inside iframes or shadow DOM (document as a limitation).

### 2.3 Explicit non-goals

- Not a generic popover/tooltip library — the positioning engine is internal
  and scoped to tour needs (no virtual elements, no middleware plugin API).
- No network calls, no telemetry.

---

## 3. Functional Requirements

### 3.1 Spotlight overlay

| Feature | Description | Priority |
|---------|-------------|----------|
| Dim overlay | Full-viewport fixed layer, portal-rendered, configurable color/opacity | P0 |
| SVG-mask hole | Spotlight cutout with per-step `padding` and `radius` | P0 |
| Live tracking | Follows target through scroll/resize (`use-resize-observer` + scroll listeners, rAF-batched) | P0 |
| Mutation resilience | Re-resolves selector targets when the DOM changes (`use-mutation-observer`, throttled) | P1 |
| Animated transition | Spotlight rect + radius interpolate between steps (CSS transition on mask geometry) | P0 |
| Reduced motion | Transition skipped when `prefers-reduced-motion` (`use-reduced-motion`) | P0 |
| Click policy | Overlay click: `ignore` (default) / `close` / `next`; spotlight area interactive or blocked per step | P1 |
| Centered step | Step with no target renders as a centered modal (no hole) | P1 |

### 3.2 Step system

| Feature | Description | Priority |
|---------|-------------|----------|
| Target forms | CSS selector string, `RefObject<Element>`, or `() => Element \| null` | P0 |
| Auto-scroll | `scrollIntoView({ block: 'center' })` when target is off-screen; step shows after scroll settles | P0 |
| Missing-target policy | `skip` / `wait` (timeout → then skip) / `center` | P0 |
| Per-step overrides | `placement`, `spotlightPadding`, `spotlightRadius`, `disableOverlayClose`, gate | P0 |
| Lifecycle callbacks | `onEnter(step)` / `onLeave(step)` per step; `onStepChange`, `onFinish`, `onSkip` on the tour | P1 |
| Interaction gate | `advanceOn: { event: 'click', selector? }` — Next **disabled** (shipped default; with a visible `labels.gatedHint` line and an announced hint) until the user performs the action | P1 |

### 3.3 Tooltip & positioning

| Feature | Description | Priority |
|---------|-------------|----------|
| Placements | `top` / `bottom` / `left` / `right` / `auto` (best-fit) | P0 |
| Flip | Falls back to the opposite side when there is not enough room | P0 |
| Shift | Clamps along the cross axis to stay inside the viewport (with margin) | P0 |
| Arrow | Arrow tracks the target center, clamped to the tooltip edge | P1 |
| Default UI | Title, content, counter ("2 / 5"), dots, Back/Next/Skip/Done, close | P0 |
| `renderStep` | Full custom render — receives step data + controller + prop getters | P0 |
| Labels | All button labels overridable (i18n-friendly), sensible English defaults | P0 |

### 3.4 Progress control

| Mode | Behavior | Priority |
|------|----------|----------|
| Uncontrolled | `defaultOpen` / initial step; component owns state | P0 |
| Controlled | `open` + `onOpenChange`, `step` + `onStepChange` (`use-controllable-state`) | P0 |
| Imperative | `controllerRef` exposes `start(at?) / next / prev / goTo / skip / finish` | P0 |
| Persistence | `tourId` → localStorage key `usefy-tour:<tourId>`; finished/skipped tours don't auto-open; `resetTour(tourId)` helper exported | P1 |
| Beacon | `SpotlightBeacon` pinned to an element, pulsing; click starts the tour | P2 |

### 3.5 Accessibility & keyboard

| Feature | Description | Priority |
|---------|-------------|----------|
| Focus trap | Tab cycles inside the tooltip (`use-focus-trap`); initial focus on Next | P0 |
| Keyboard | `→`/`Enter` next, `←` back, `Esc` skip/close (`use-hotkeys`), all optional via `keyboard` prop | P0 |
| Scroll lock | Background scroll locked while open, opt-out (`use-scroll-lock`) | P1 |
| ARIA | Tooltip is `role="dialog"` + `aria-modal`, labelled by title; step content announced via `aria-live="polite"` | P0 |
| Focus restore | Focus returns to the pre-tour element (or beacon) on exit | P0 |
| Reduced motion | No spotlight/tooltip animation under `prefers-reduced-motion` | P0 |

### 3.6 Theming & environment

| Feature | Description | Priority |
|---------|-------------|----------|
| CSS variables | All colors/spacing/z-index via `--usefy-tour-*` | P0 |
| Light/Dark/System | `theme` prop + auto detection | P1 |
| `classNames` slots | Per-part overrides: overlay, spotlight, tooltip, arrow, header, content, footer, dots, counter (the beacon styles via its own `className`) | P1 |
| SSR safe | No DOM access at import; overlay portals only after mount | P0 |

---

## 4. Technical Specifications

### 4.1 Step & tour model

```typescript
export type TourTarget =
  | string                                  // CSS selector
  | React.RefObject<Element | null>
  | (() => Element | null);

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export type MissingTargetPolicy = 'skip' | 'wait' | 'center';

export interface TourStep {
  /** Element to spotlight. Omit for a centered (modal) step. */
  target?: TourTarget;
  /** Tooltip heading. */
  title?: React.ReactNode;
  /** Tooltip body. */
  content: React.ReactNode;
  /** Preferred tooltip side; 'auto' picks the roomiest. @default 'auto' */
  placement?: TourPlacement;
  /** Extra px around the target inside the spotlight. @default 8 */
  spotlightPadding?: number;
  /** Spotlight corner radius in px. @default 8 */
  spotlightRadius?: number;
  /** What to do when the target can't be resolved. @default 'skip' */
  missingTarget?: MissingTargetPolicy;
  /** ms to wait in 'wait' mode before falling back to skip. @default 3000 */
  waitTimeout?: number;
  /** Require a user action on the target to advance (disables Next with a hint). */
  advanceOn?: { event: 'click'; selector?: string };
  /** Allow clicking through the spotlight onto the target. @default true */
  spotlightClicks?: boolean;
  /** Scroll the target into view when off-screen. @default true */
  scrollIntoView?: boolean;
  /** Make overlayClick 'close'/'next' behave as 'ignore' for this step. @default false */
  disableOverlayClose?: boolean;
  /** Step lifecycle. */
  onEnter?: () => void;
  onLeave?: () => void;
}
```

### 4.2 Positioning engine (pure — `src/engine/`)

```typescript
export interface Rect { x: number; y: number; width: number; height: number; }

/** Spotlight geometry from a target rect. */
export function getSpotlightRect(
  target: Rect, padding: number,
): Rect;

/**
 * Tooltip position: preferred placement → flip if it overflows →
 * shift along the cross axis → arrow offset. Pure; fully unit-tested.
 */
export function computeTooltipPosition(input: {
  target: Rect;               // spotlight rect (already padded)
  tooltip: { width: number; height: number };
  viewport: { width: number; height: number };
  placement: TourPlacement;
  offset?: number;            // gap between spotlight and tooltip, default 12
  viewportMargin?: number;    // min gap to viewport edge, default 8
}): {
  x: number; y: number;
  placement: Exclude<TourPlacement, 'auto'>;   // resolved side
  arrow: { x: number; y: number };             // relative to the tooltip
};
```

### 4.3 Headless hook API (`./headless`)

```typescript
export interface UseSpotlightTourOptions {
  steps: TourStep[];

  // --- open ownership ---
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  // --- step ownership ---
  step?: number;
  defaultStep?: number;
  onStepChange?: (index: number) => void;

  // --- behavior ---
  /** localStorage persistence key; omit to disable persistence. */
  tourId?: string;
  keyboard?: boolean;            // default true
  scrollLock?: boolean;          // default true
  /** Tour lifecycle. */
  onFinish?: () => void;
  onSkip?: (atStep: number) => void;
}

export interface SpotlightGeometry {
  /** Spotlight rect in viewport coords, or null for a centered step. */
  spotlight: (Rect & { radius: number }) | null;
  /** Resolved tooltip position (null until measured). */
  tooltip: { x: number; y: number; placement: string; arrow: { x: number; y: number } } | null;
}

export interface UseSpotlightTourReturn {
  open: boolean;
  stepIndex: number;
  step: TourStep | null;
  stepCount: number;
  isFirst: boolean;
  isLast: boolean;
  /** Live geometry, rAF-batched; re-renders only when values change. */
  geometry: SpotlightGeometry;
  /** True while waiting for a 'wait'-policy target or auto-scroll to settle. */
  pending: boolean;
  /** True when the current step has an unmet advanceOn gate. */
  gated: boolean;
  /** True once the active step actually settled on screen (combine with !pending for announcements). */
  settled: boolean;

  // --- controls (useCallback-stable) ---
  start: (at?: number) => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  skip: () => void;
  finish: () => void;

  // --- prop getters for custom UIs (a11y baked in) ---
  getTooltipProps: () => React.HTMLAttributes<HTMLElement> & { ref: React.Ref<HTMLElement> };
  getOverlayProps: () => React.HTMLAttributes<HTMLElement>;
}

export function useSpotlightTour(options: UseSpotlightTourOptions): UseSpotlightTourReturn;

/** Clear a persisted tour so it can auto-open again. */
export function resetTour(tourId: string): void;
```

### 4.4 Component API

```typescript
export interface TourController {
  start: (at?: number) => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  skip: () => void;
  finish: () => void;
}

export interface SpotlightTourProps extends UseSpotlightTourOptions {
  // --- presentation ---
  /** Overlay color. @default 'rgba(0 0 0 / 0.55)' */
  maskColor?: string;
  /** Spotlight/tooltip transition ms (0 disables). @default 300 */
  transitionDuration?: number;
  /** Overlay click behavior. @default 'ignore' */
  overlayClick?: 'ignore' | 'close' | 'next';
  zIndex?: number;               // default 1000

  // --- UI customization ---
  labels?: Partial<{ back: string; next: string; skip: string; finish: string; close: string; gatedHint: string }>;
  showProgress?: boolean;        // dots, default true
  showCounter?: boolean;         // "2 / 5", default true
  showSkip?: boolean;            // default true
  showClose?: boolean;           // default true
  /** Replace the whole tooltip. */
  renderStep?: (ctx: {
    step: TourStep; index: number; count: number;
    controller: TourController; gated: boolean;
    tooltipProps: React.HTMLAttributes<HTMLElement>;
  }) => React.ReactNode;

  // --- theming ---
  theme?: 'light' | 'dark' | 'system';
  classNames?: Partial<Record<
    'overlay' | 'spotlight' | 'tooltip' | 'arrow' | 'header' | 'content'
    | 'footer' | 'dots' | 'counter', string>>;
  className?: string;

  /** Imperative access. */
  controllerRef?: React.Ref<TourController>;
}

export function SpotlightTour(props: SpotlightTourProps): React.ReactNode;

export interface SpotlightBeaconProps {
  /** Element the beacon attaches to. */
  target: TourTarget;
  /** Called on click — typically `() => controller.start(2)`. */
  onActivate: () => void;
  'aria-label'?: string;         // default "Start tour"
  className?: string;
}

export function SpotlightBeacon(props: SpotlightBeaconProps): React.ReactNode;
```

### 4.5 Exported surface

```typescript
// "."  — styled component + everything below (injects CSS)
export { SpotlightTour } from './SpotlightTour';
export { SpotlightBeacon } from './components/Beacon/Beacon';
export type { SpotlightTourProps, SpotlightBeaconProps, TourController } from ...;

// "./headless" — no styles, no CSS side effects
export { useSpotlightTour, resetTour } from './useSpotlightTour';
export { computeTooltipPosition, getSpotlightRect } from './engine';
export type {
  UseSpotlightTourOptions, UseSpotlightTourReturn, SpotlightGeometry,
  TourStep, TourTarget, TourPlacement, MissingTargetPolicy, Rect,
} from './types';

// "./styles.css" — opt-in extracted stylesheet
```

### 4.6 Dependencies

| Package | Purpose |
|---------|---------|
| `@usefy/use-controllable-state` | `open` + `step` controlled/uncontrolled |
| `@usefy/use-focus-trap` | Tooltip focus containment |
| `@usefy/use-hotkeys` | `←`/`→`/`Esc` navigation |
| `@usefy/use-scroll-lock` | Background scroll lock |
| `@usefy/use-resize-observer` | Target + tooltip size tracking |
| `@usefy/use-mutation-observer` | Selector target re-resolution |
| *(no dep — `persistence.ts` helpers)* | `tourId` persistence (imperative write-on-event; the reactive `use-local-storage` hook shape doesn't fit) |
| `@usefy/use-reduced-motion` | Motion opt-out |
| `@usefy/use-isomorphic-layout-effect` | SSR-safe measurement |
| `@usefy/use-latest` | Stable callback refs |
| `clsx` | Class names |
| `react` / `react-dom` (peer) | ^18 \|\| ^19 |

> No positioning library — the engine in §4.2 is in-house, pure, and scoped to
> tour needs. Styling: SCSS modules, runtime-injected (virtual-keyboard tsup
> parity), `--usefy-tour-*` CSS vars, `./styles.css` opt-in extraction.

### 4.7 Browser / environment support

| Environment | Support | Notes |
|-------------|---------|-------|
| Evergreen desktop browsers | Full | SVG mask + ResizeObserver |
| Mobile / touch | Full | Touch targets ≥ 44px; visual viewport aware |
| SSR (Next/Remix) | Safe | Portal only after mount; no DOM at import |
| iframes / shadow DOM targets | Not supported | Documented limitation (§2.2) |

---

## 5. Architecture

### 5.1 Single package with a headless subpath

```
@usefy/spotlight-tour              (packages/spotlight-tour)
├── "."          → styled SpotlightTour + SpotlightBeacon + hook + engine (injects CSS)
├── "./headless" → useSpotlightTour + engine + types only (no CSS side effects)
└── "./styles.css" → opt-in extracted stylesheet
```

No `@usefy/hooks` umbrella wiring (single standalone package, not a `use-*`
hook package). Versions independently of the hook family.

### 5.2 File structure

```
packages/spotlight-tour/
├── src/
│   ├── index.ts                     # "." export surface
│   ├── headless.ts                  # "./headless" export surface
│   ├── SpotlightTour.tsx            # styled component (consumes the hook)
│   ├── SpotlightTour.module.scss
│   ├── useSpotlightTour.ts          # headless state machine + geometry
│   ├── engine/
│   │   ├── computeTooltipPosition.ts  # pure: placement → flip → shift → arrow
│   │   ├── getSpotlightRect.ts        # pure: target rect + padding
│   │   └── resolveTarget.ts           # selector/ref/fn → Element | null
│   ├── hooks/
│   │   ├── useTargetRect.ts         # live rect tracking (RO + scroll + rAF)
│   │   ├── useAutoScroll.ts         # scrollIntoView + settle detection
│   │   └── useAdvanceGate.ts        # advanceOn event listener
│   ├── components/
│   │   ├── Overlay/                 # portal + SVG mask + transition
│   │   ├── Tooltip/                 # default step UI (header/content/footer/dots)
│   │   ├── Arrow/
│   │   └── Beacon/                  # SpotlightBeacon
│   ├── styles/_variables.scss       # --usefy-tour-* vars
│   ├── types.ts
│   └── *.test.ts(x)                 # co-located tests
├── package.json                     # ".", "./headless", "./styles.css" exports
├── tsup.config.ts                   # cloned from virtual-keyboard (SCSS + inject)
├── vitest.config.ts / vitest.setup.ts
├── tsconfig.json
├── SPEC.md                          # this document
└── README.md
```

### 5.3 State & data flow

```
        steps[] + open/step (controllable)
                    │
                    ▼
        ┌───────────────────────────┐
        │     useSpotlightTour      │
        │  step machine (next/prev/ │
        │  gate/pending/persist)    │
        └─────┬───────────┬─────────┘
   resolveTarget()   geometry (rAF-batched)
        │                 │
        ▼                 ▼
  useTargetRect ──► getSpotlightRect ──► Overlay (SVG mask, animated)
        │                 │
        └── tooltip size ─┴─► computeTooltipPosition ──► Tooltip (+Arrow)
                                    │
                       focus trap / hotkeys / scroll lock / aria-live
```

Geometry updates are rAF-batched and only commit when values actually change,
so scrolling doesn't re-render the tooltip content every frame.

### 5.4 Spotlight rendering decision

SVG `<mask>` (a white full-screen rect + a black rounded rect for the hole)
rather than the `box-shadow` trick: masks give exact rounded corners, clean
transitions (animating `x/y/width/height/rx` of the hole rect), and don't
break at extreme z-index/stacking contexts. The overlay is one fixed,
pointer-events-managed portal layer.

---

## 6. Development Milestones

> All phases land before the single v0.1.0 release (full-spec MVP per the
> scoping decision). Each phase ends green (`pnpm typecheck` + package tests)
> before the next begins; the mandatory review loop (`usefy-reviewer`) runs
> at the checkpoints marked ★.

### Phase 1 — Headless core (engine + state machine)

- [x] Package scaffold (`add-usefy-component`, virtual-keyboard tsup parity, `./headless` subpath).
- [x] Types (§4.1, §4.3).
- [x] Pure engine: `getSpotlightRect`, `computeTooltipPosition` (placement → flip → shift → arrow), `resolveTarget` — exhaustive unit tests.
- [x] Step machine in `useSpotlightTour`: open/step via `use-controllable-state`, next/prev/goTo/skip/finish, missing-target policies (skip/wait/center), lifecycle callbacks.
- [x] `useTargetRect` live tracking (ResizeObserver + scroll + rAF batching).
- [x] Hook tests: state transitions, controlled/uncontrolled parity, callback stability. ★

### Phase 2 — Overlay & tooltip rendering

- [x] Portal overlay with SVG-mask spotlight; `maskColor`, per-step padding/radius.
- [x] Animated step transitions (mask rect interpolation); `transitionDuration`; reduced-motion opt-out.
- [x] Tooltip component measuring itself → `computeTooltipPosition`; Arrow; centered-step modal mode.
- [x] Default UI: header/content/footer, counter, dots, Back/Next/Skip/Done/close, `labels`, `renderStep`.
- [x] SCSS theming (`--usefy-tour-*`), light/dark/system, `classNames` slots.
- [x] Component tests (jsdom: geometry mocked at the engine seam). ★

### Phase 3 — Interaction & accessibility

- [x] Focus trap, initial focus, focus restore on exit.
- [x] Hotkeys (`←`/`→`/`Enter`/`Esc`), `keyboard` opt-out; scroll lock + opt-out.
- [x] `role="dialog"`, `aria-modal`, labelling, `aria-live` step announcements.
- [x] Auto-scroll (`useAutoScroll` + settle detection, `pending` state).
- [x] Interaction gates (`advanceOn`, `gated` state, Next disabled + gate hint); `spotlightClicks`; `overlayClick` modes.
- [x] A11y tests (roles, tab cycle, key nav, focus restore). ★

### Phase 4 — Persistence, beacon & hardening

- [x] `tourId` persistence (guarded `persistence.ts` helpers), `resetTour` helper, versioned key format.
- [x] `SpotlightBeacon` (pulsing, reduced-motion-aware, accessible name).
- [x] Selector re-resolution on DOM mutation; edge cases: target unmounts mid-step, window resize during transition, zero-size targets.
- [x] SSR smoke test; StrictMode double-mount safety.

### Phase 5 — Ship (docs + release)

- [x] 90%+ coverage across engine/hook/components.
- [x] Storybook story (house standard via `add-usefy-story`): multi-step demo over a fake app UI, gated step, centered step, beacon, dark theme, `renderStep` custom UI — real copy-pasteable "Show code".
- [x] READMEs per house standard (package README + root/docs listing updates).
- [x] Changeset (independent package — named explicitly, minor `0.1.0`).
- [x] Final `usefy-reviewer` pass on the whole package. ★

---

## 7. Testing Strategy

### 7.1 Engine (pure) unit tests — highest signal, cheapest

```typescript
describe('computeTooltipPosition', () => {
  it('places bottom-centered when there is room');
  it('flips top→bottom when the top overflows');
  it('shifts horizontally to stay inside the viewport margin');
  it('clamps the arrow to the tooltip bounds while tracking target center');
  it('auto picks the side with the most room');
});

describe('getSpotlightRect', () => {
  it('expands the target rect by padding on all sides');
});

describe('resolveTarget', () => {
  it('resolves selector / ref / function forms; returns null when absent');
});
```

### 7.2 Hook tests (`renderHook` / `act`)

- Step machine: next/prev/goTo bounds, finish on last next, skip.
- Controlled vs uncontrolled `open` and `step` (parity + onChange firing).
- Missing-target policies: skip advances, wait respects timeout, center yields `spotlight: null`.
- Persistence: finished tour doesn't reopen; `resetTour` clears it.
- Gate: `gated` true until the target event fires.
- All controls `useCallback`-stable across rerenders.

### 7.3 Component & a11y tests

- Overlay + spotlight render with mocked rects; centered step has no hole.
- Buttons drive the machine; labels/slots/renderStep respected.
- Focus trapped in tooltip; Tab cycles; `Esc` skips; focus restored.
- ARIA: dialog role, aria-modal, live-region announcement on step change.
- SSR smoke: import + render without `window`.

### 7.4 Storybook

- "App onboarding" demo: fake dashboard, 5 steps incl. a gated step and a centered welcome step.
- Beacon-triggered tour; dark theme; custom `renderStep`.
- `play` tests: click-through the whole tour, keyboard navigation.

---

## 8. Performance Considerations

- Geometry updates rAF-batched; state commits only on actual value change.
- Scroll/resize listeners passive; single listener set for the active target only.
- Mask transition animates SVG attributes/CSS transforms — no React re-render per frame.
- Tooltip content memoized; step content only remounts on step change.
- Target bundle: **< 12KB gzipped** styled entry, **< 5KB** headless entry (excluding React).

---

## 9. Accessibility (WCAG 2.1 AA)

- Tooltip is a `role="dialog"` with `aria-modal="true"`, labelled by the step
  title (or an explicit `aria-label`), content announced politely on change.
- Focus trapped inside the tooltip; initial focus on the primary action;
  focus restored to the trigger/beacon (or prior element) on exit.
- Full keyboard operation: `→`/`Enter` next, `←` back, `Esc` dismiss, Tab cycle.
- Gated steps: the gate requirement is conveyed in text, not color alone.
- `prefers-reduced-motion` disables spotlight/beacon animation.
- Contrast of default tooltip UI verified AA in both themes; buttons ≥ 44px targets.

---

## 10. Security Considerations

- No network, no telemetry; persistence is a single boolean-ish localStorage key.
- Selector targets are resolved with `document.querySelector` only — no HTML
  injection; step `content` is consumer-provided React, never parsed strings.
- Style injection: single de-duplicated `<style>`, SSR-guarded, idempotent (virtual-keyboard parity).

---

## 11. Documentation Requirements

- **README**: install, 5-minute quick start (steps array + component), controlled
  usage, gating recipe, persistence, beacon, theming vars table, headless usage,
  a11y notes, limitations (iframe/shadow DOM).
- **Storybook**: demos in §7.4 with real, copy-pasteable "Show code".
- **JSDoc**: every exported type/function with a runnable `@example`.

---

## 12. Success Criteria

### 12.1 Functional

- [x] A 5-step tour over a real page: spotlight tracks scroll/resize, animates between steps, tooltip flips/shifts correctly at viewport edges.
- [x] Gated step blocks Next until the target is clicked.
- [x] `tourId` tour opens once, never again after finish/skip; `resetTour` revives it.
- [x] Fully driveable by keyboard alone and by the imperative controller.

### 12.2 Non-functional

- [x] 90%+ coverage; engine functions 100%.
- [x] WCAG 2.1 AA; StrictMode + SSR safe; React 18 **and** 19; TS strict.
- [x] Zero non-usefy runtime deps except clsx. Measured at ship: styled ≈ 13.1KB gz, headless ≈ 6.5KB gz (entry + shared chunk; workspace deps external) — modestly above the draft's 12/5KB aspiration, reflecting scope added after drafting (gates, persistence, beacon, mutation re-resolution).

---

## 13. Resolved Decisions

1. **Packaging** — single package `@usefy/spotlight-tour` with a `./headless`
   subpath (virtual-keyboard pattern); no separate `use-*` hook package, no
   umbrella wiring, independent versioning. ✅ Confirmed 2026-07-22.
2. **Positioning** — in-house pure engine (flip + shift + arrow); no
   `@floating-ui` dependency. ✅ Confirmed 2026-07-22.
3. **MVP scope** — full spec in v0.1.0: core + a11y + animation + persistence +
   gates + beacon, all in the first release. ✅ Confirmed 2026-07-22.
4. **Spotlight rendering** — SVG mask over the `box-shadow` trick (§5.4). ✅
5. **Overlay default click behavior** — `ignore` (tour is deliberate; misclicks
   shouldn't dismiss onboarding). `close`/`next` opt-in. ✅

---

## 14. Appendix

### A. Related packages

- `@usefy/virtual-keyboard` — packaging + tsup/SCSS reference (single package, `./headless`).
- `@usefy/memory-monitor` — original component build pipeline reference.

### B. References

- [WAI-ARIA APG: Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [MDN: SVG mask](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mask)
- [react-joyride](https://github.com/gilbarbara/react-joyride) / [driver.js](https://driverjs.com/) — prior art surveyed

### C. Glossary

| Term | Definition |
|------|------------|
| Spotlight | The cutout hole in the dim overlay highlighting the target |
| Step | One unit of the tour: a target + tooltip content + behavior |
| Gate | A per-step requirement (e.g. click the target) to advance |
| Beacon | A pulsing marker that invites the user to start the tour |
| Centered step | A step with no target, rendered as a centered modal |

### D. Deferred / known limitations

- **Firefox: spotlight jumps instead of morphing.** The hole animation relies
  on CSS transitions of SVG geometry properties (`x`/`y`/`width`/`height`/
  `rx`), which Firefox does not support. There the hole snaps to the next
  target; everything else (dim, tooltip glide) animates normally. Graceful
  degradation — no transform-based fallback for now. Document in the README
  (Phase 5).
- ~~Gate selectors resolve once~~ — addressed in Phase 4: the DOM-mutation
  re-resolution epoch re-queries `advanceOn.selector` (and step targets) on a
  throttled tick.

---

*Document Version: 1.0*
*Last Updated: 2026-07-22*

# @usefy/spotlight-tour

## 0.2.2

### Patch Changes

- @usefy/use-controllable-state@1.1.0
- @usefy/use-focus-trap@1.1.0
- @usefy/use-hotkeys@1.1.0
- @usefy/use-isomorphic-layout-effect@1.1.0
- @usefy/use-latest@1.1.0
- @usefy/use-mutation-observer@1.1.0
- @usefy/use-reduced-motion@1.1.0
- @usefy/use-resize-observer@1.1.0
- @usefy/use-scroll-lock@1.1.0

## 0.2.1

### Patch Changes

- ee19e5e: Fix tooltip motion and the disabled-button visibility.

  - **Tooltip motion**: on a step change the tooltip now glides smoothly from the
    previous position to the new one — same duration and easing as the spotlight
    morph — instead of teleporting. The previous position is retained as the
    transition's from-state (no hidden flash, no jump), and the glide duration is
    now correctly inherited on the tooltip (the effective transition duration is
    published on the portal root, so reduced motion / `transitionDuration={0}`
    make it instant too). Continuous tracking updates (scroll, resize, auto-scroll
    in flight) are snapped 1:1 with the transition disabled, removing the
    rubber-band lag where the tooltip chased its target.
  - **Disabled buttons**: a gated step's disabled Next is no longer a near-invisible
    low-opacity accent. It uses explicit disabled tokens
    (`--usefy-tour-accent-disabled-bg` / `-color`, plus secondary equivalents) for
    both the light and dark palettes, so the button stays a solid, clearly-visible
    (yet clearly inactive) control on every surface.

## 0.2.0

### Minor Changes

- a148dc2: Add `@usefy/spotlight-tour` — guided React onboarding tours with a tracking spotlight overlay. Dims the page behind an SVG-mask hole that morphs from target to target (clicks pass through via `spotlightClicks`), with a themable step tooltip: title/content, progress dots, counter, Back/Next/Skip/close, per-step `placement`/padding/radius, and centered modal steps. Steps support missing-target policies (`skip`/`wait`/`center`), DOM-mutation re-resolution for late-mounting targets, auto-scroll for off-screen targets, `advanceOn` interaction gates (Next disabled with a hint until the user performs the action), and `onEnter`/`onLeave` lifecycle. Enterprise a11y baked in: focus trap + restore, `role="dialog"`/`aria-modal`/labelling, `aria-live` step announcements, ←/→/Enter/Esc navigation, scroll lock, and reduced-motion support. `tourId` persists finished/skipped tours (`resetTour` clears); `SpotlightBeacon` is a pulsing invitation dot; `open`/`step` are controllable with an imperative `controllerRef`; theming via `--usefy-tour-*` variables, `theme="light|dark|system"`, `classNames`, or a full `renderStep` replacement. The entire state machine also ships headless via `@usefy/spotlight-tour/headless` (hook + pure positioning engine, no CSS). SSR-safe and StrictMode-safe.

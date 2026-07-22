# @usefy/spotlight-tour

## 0.2.0

### Minor Changes

- a148dc2: Add `@usefy/spotlight-tour` — guided React onboarding tours with a tracking spotlight overlay. Dims the page behind an SVG-mask hole that morphs from target to target (clicks pass through via `spotlightClicks`), with a themable step tooltip: title/content, progress dots, counter, Back/Next/Skip/close, per-step `placement`/padding/radius, and centered modal steps. Steps support missing-target policies (`skip`/`wait`/`center`), DOM-mutation re-resolution for late-mounting targets, auto-scroll for off-screen targets, `advanceOn` interaction gates (Next disabled with a hint until the user performs the action), and `onEnter`/`onLeave` lifecycle. Enterprise a11y baked in: focus trap + restore, `role="dialog"`/`aria-modal`/labelling, `aria-live` step announcements, ←/→/Enter/Esc navigation, scroll lock, and reduced-motion support. `tourId` persists finished/skipped tours (`resetTour` clears); `SpotlightBeacon` is a pulsing invitation dot; `open`/`step` are controllable with an imperative `controllerRef`; theming via `--usefy-tour-*` variables, `theme="light|dark|system"`, `classNames`, or a full `renderStep` replacement. The entire state machine also ships headless via `@usefy/spotlight-tour/headless` (hook + pure positioning engine, no CSS). SSR-safe and StrictMode-safe.

<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/spotlight-tour</h1>

<p align="center">
  <strong>React onboarding tours with a tracking spotlight overlay and enterprise a11y</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/spotlight-tour">
    <img src="https://img.shields.io/npm/v/@usefy/spotlight-tour.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/spotlight-tour">
    <img src="https://img.shields.io/npm/dm/@usefy/spotlight-tour.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/spotlight-tour">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/spotlight-tour?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/spotlight-tour.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#recipes">Recipes</a> •
  <a href="#theming">Theming</a> •
  <a href="#headless-usage">Headless</a> •
  <a href="#accessibility">Accessibility</a> •
  <a href="#limitations">Limitations</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/story/spotlight-tour--app-onboarding" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/spotlight-tour` is a guided product tour: it dims the page, cuts an **animated spotlight hole** around each step's target, and shows a step tooltip beside it. The hole and tooltip **morph smoothly** from step to step, clicks pass through the hole to the real element underneath, and the whole thing is a proper modal dialog for keyboard and screen-reader users.

- **Styled component** — `<SpotlightTour />` + a pulsing `<SpotlightBeacon />` invitation dot, themable to your brand
- **Headless hook** — the entire state machine as `useSpotlightTour()` from `@usefy/spotlight-tour/headless` (no styles, no CSS side effects)
- **Enterprise a11y** — focus trap + restore, `role="dialog"`/`aria-modal`/labelling, `aria-live` step announcements, full keyboard navigation, scroll lock, reduced-motion support

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — composes `use-focus-trap`, `use-hotkeys`, `use-scroll-lock`, `use-mutation-observer`, and friends.

### Why spotlight-tour?

- **A real hole, not a fake highlight** — SVG-mask spotlight; the target stays fully interactive (`spotlightClicks`)
- **Animated step transitions** — the hole and tooltip glide between targets with pure CSS transitions (no per-frame React work)
- **Interaction gates** — `advanceOn` requires the user to actually perform an action before the tour continues
- **Resilient targeting** — missing-target policies (`skip` / `wait` / `center`), DOM-mutation re-resolution for late-mounting targets, graceful handling when a target unmounts mid-step
- **Persistence** — `tourId` remembers finished/skipped tours across visits; `resetTour()` for replay buttons
- **Controlled or uncontrolled** — `open`/`step` props, `defaultOpen`/`defaultStep`, or an imperative `controllerRef`
- **SSR compatible** — portals only after mount; nothing renders on the server

---

## Installation

```bash
# npm
npm install @usefy/spotlight-tour

# yarn
yarn add @usefy/spotlight-tour

# pnpm
pnpm add @usefy/spotlight-tour
```

Requires React 18 or 19 (`react` + `react-dom` peer dependencies).

Styles are **injected automatically** when you import from `@usefy/spotlight-tour`. If your bundler strips style side effects, import them once explicitly:

```ts
import "@usefy/spotlight-tour/styles.css";
```

---

## Quick Start

```tsx
import { SpotlightTour } from "@usefy/spotlight-tour";

function App() {
  return (
    <>
      <YourApp />
      <SpotlightTour
        defaultOpen
        steps={[
          // No target → a centered welcome modal.
          { title: "Welcome! 👋", content: "Let's take a quick look around." },
          { target: "#search", title: "Search", content: "Find anything from here." },
          { target: "#settings", content: "Tune your preferences.", placement: "left" },
        ]}
        onFinish={() => console.log("toured!")}
        onSkip={(at) => console.log(`dismissed at step ${at}`)}
      />
    </>
  );
}
```

Targets can be CSS selectors, refs, or functions (`target: () => document.querySelector(...)`).

---

## API Reference

### `<SpotlightTour />` Props

All [`useSpotlightTour` options](#headless-usage) (steps, `open`/`defaultOpen`, `step`/`defaultStep`, `tourId`, `keyboard`, `scrollLock`, `onFinish`, `onSkip`, …) plus:

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `maskColor` | `string` | `"rgba(0 0 0 / 0.55)"` | Dim overlay color. |
| `transitionDuration` | `number` | `300` | Spotlight/tooltip transition (ms). `0` disables; forced to `0` under reduced motion. |
| `overlayClick` | `"ignore" \| "close" \| "next"` | `"ignore"` | What a click on the dimmed area does (`"close"` fires `onSkip`). Per-step `disableOverlayClose` downgrades to `"ignore"`. |
| `zIndex` | `number` | `1000` | z-index of the portal layer. |
| `labels` | `Partial<TourLabels>` | English | Button/hint label overrides (i18n): `back`, `next`, `skip`, `finish`, `close`, `gatedHint`. |
| `showProgress` / `showCounter` / `showSkip` / `showClose` | `boolean` | `true` | Toggle the dots, "2 / 5" counter, Skip button, and close (×). |
| `renderStep` | `(ctx) => ReactNode` | — | Replace the whole tooltip UI; positioning stays automatic. Spread `ctx.tooltipProps` for the dialog semantics. |
| `theme` | `"light" \| "dark" \| "system"` | `"system"` | Color theme; `"system"` follows `prefers-color-scheme`. |
| `classNames` | `SpotlightTourClassNames` | — | Per-part class overrides: `overlay`, `spotlight`, `tooltip`, `arrow`, `header`, `content`, `footer`, `dots`, `counter`. |
| `className` | `string` | — | Extra class on the portal root. |
| `controllerRef` | `Ref<TourController>` | — | Imperative access: `start(at?)`, `next`, `prev`, `goTo`, `skip`, `finish`. |

### `TourStep`

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `target` | `string \| RefObject \| () => Element \| null` | — | Element to spotlight. Omit for a centered modal step. |
| `title` / `content` | `ReactNode` | — | Tooltip heading / body (`content` required). |
| `placement` | `"top" \| "bottom" \| "left" \| "right" \| "auto"` | `"auto"` | Preferred tooltip side; `"auto"` prefers a side that fits, then the roomiest. |
| `spotlightPadding` / `spotlightRadius` | `number` | `8` / `8` | Hole padding / corner radius (px). |
| `missingTarget` | `"skip" \| "wait" \| "center"` | `"skip"` | Policy when the target can't be resolved. |
| `waitTimeout` | `number` | `3000` | How long `"wait"` holds before skipping (ms). |
| `advanceOn` | `{ event: "click"; selector?: string }` | — | Interaction gate — see [the recipe](#gating-a-step-on-a-real-action). |
| `spotlightClicks` | `boolean` | `true` | Whether clicks pass through the hole to the target. |
| `scrollIntoView` | `boolean` | `true` | Auto-scroll an off-screen target into view. |
| `disableOverlayClose` | `boolean` | `false` | Make `overlayClick` behave as `"ignore"` for this step. |
| `onEnter` / `onLeave` | `() => void` | — | Fire when the step settles on screen / is left. |

### `<SpotlightBeacon />` Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `target` | `TourTarget` | — | Element the pulsing dot pins to (top-right corner, tracks live). |
| `onActivate` | `() => void` | — | Called on click — typically `controller.current?.start()`. |
| `aria-label` | `string` | `"Start tour"` | Accessible name of the beacon button. |
| `className` | `string` | — | Extra class on the beacon button. |

Renders nothing while the target is unresolved or invisible; static (no pulse) under reduced motion.

---

## Recipes

### Controlled usage

Own `open`/`step` yourself — e.g. to sync the tour with a router or analytics:

```tsx
function App() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  return (
    <SpotlightTour
      open={open}
      onOpenChange={setOpen}
      step={step}
      onStepChange={setStep}
      steps={steps}
    />
  );
}
```

Or stay uncontrolled and drive it imperatively:

```tsx
const controller = useRef<TourController>(null);
<button onClick={() => controller.current?.start(2)}>Show me step 3</button>
<SpotlightTour controllerRef={controller} steps={steps} />
```

### Gating a step on a real action

```tsx
{
  target: "#create-project",
  title: "Try it yourself",
  content: "Click “Create project” to continue.",
  advanceOn: { event: "click" },          // listen on the target itself
  // or: advanceOn: { event: "click", selector: "#some-other-element" }
  disableOverlayClose: true,              // don't let a stray click dismiss it
}
```

While the gate is unmet the step reports `gated`, Next renders **disabled** with a hint line (`labels.gatedHint`, announced to screen readers too), and ArrowRight/Enter won't advance. When the event fires, the tour advances automatically. Explain the required action in `content` — and if you need the gate action itself keyboard-reachable, render it inside the tooltip via `renderStep`.

### Persistence

```tsx
<SpotlightTour tourId="dashboard-onboarding" defaultOpen steps={steps} />
```

Finishing **or** skipping writes a versioned flag to `localStorage` (`usefy-tour:dashboard-onboarding`); on later visits the stored flag suppresses the *automatic* `defaultOpen`. An explicit `start()` call still opens — so "Replay tour" buttons keep working:

```tsx
import { resetTour } from "@usefy/spotlight-tour";

<button onClick={() => { resetTour("dashboard-onboarding"); controller.current?.start(); }}>
  Replay onboarding
</button>
```

Cross-tab sync is out of scope — the flag is read once per mount.

### Beacon

```tsx
import { SpotlightTour, SpotlightBeacon, type TourController } from "@usefy/spotlight-tour";

function App() {
  const controller = useRef<TourController>(null);
  return (
    <>
      <SpotlightBeacon target="#new-feature" onActivate={() => controller.current?.start()} />
      <SpotlightTour controllerRef={controller} steps={steps} />
    </>
  );
}
```

---

## Theming

Every color and metric is a CSS variable scoped to the tour root — override them globally or per-tour (via `className`):

| Variable | Default (light) | Description |
| -------- | --------------- | ----------- |
| `--usefy-tour-tooltip-bg` | `#ffffff` | Tooltip surface. |
| `--usefy-tour-tooltip-color` | `#0f172a` | Tooltip text. |
| `--usefy-tour-tooltip-border` | `#e2e8f0` | Tooltip border. |
| `--usefy-tour-tooltip-shadow` | soft shadow | Tooltip shadow. |
| `--usefy-tour-tooltip-max-width` | `360px` | Tooltip max width. |
| `--usefy-tour-tooltip-padding` | `16px` | Tooltip padding. |
| `--usefy-tour-muted-color` | `#64748b` | Counter / hint / close color. |
| `--usefy-tour-accent` | `#6366f1` | Primary button, active dot, beacon. |
| `--usefy-tour-accent-hover` | `#4f46e5` | Primary button hover. |
| `--usefy-tour-accent-color` | `#ffffff` | Primary button text. |
| `--usefy-tour-accent-disabled-bg` / `-color` | `#64748b` / `#ffffff` | Disabled primary (e.g. a gated Next) — a solid, clearly-visible muted fill, not a faded accent. |
| `--usefy-tour-button-bg` / `-color` / `-hover-bg` | grays | Secondary buttons. |
| `--usefy-tour-dot` / `--usefy-tour-dot-active` | grays / accent | Progress dots. |
| `--usefy-tour-radius` | `10px` | Corner radius. |
| `--usefy-tour-gap` | `8px` | Internal spacing. |
| `--usefy-tour-font` | system stack | Font family. |

`theme="dark"` swaps the palette; `"system"` (default) follows `prefers-color-scheme`, and a host `[data-theme="dark"]` ancestor also activates it. Precedence: an explicit `theme` prop always wins over the host's `data-theme`, which wins over the system preference. `classNames` targets every part, and `renderStep` replaces the tooltip entirely.

---

## Headless Usage

The full state machine ships as a hook with **no styles and no CSS side effects**:

```tsx
import { useSpotlightTour } from "@usefy/spotlight-tour/headless";

function MyTour() {
  const tour = useSpotlightTour({ steps, defaultOpen: true });

  if (!tour.open || !tour.step) return null;
  return (
    <div {...tour.getOverlayProps()}>
      <div {...tour.getTooltipProps()} style={{ position: "fixed" }}>
        {tour.step.content}
        <button onClick={tour.prev} disabled={tour.isFirst}>Back</button>
        <button onClick={tour.next} disabled={tour.gated}>
          {tour.isLast ? "Done" : "Next"}
        </button>
        <button onClick={tour.skip}>Skip</button>
      </div>
    </div>
  );
}
```

You get `open`, `stepIndex`, `step`, `geometry` (live spotlight + tooltip positions from the pure engine), `pending`, `gated`, `settled`, stable controls, and prop getters with the dialog a11y baked in. The positioning engine (`computeTooltipPosition`, `getSpotlightRect`, `resolveTarget`) is exported too.

---

## Accessibility

- **Focus**: focus is trapped in the tooltip while open (initial focus on the primary action) and restored to the pre-tour element on close — safely skipped if that element left the DOM.
- **Dialog semantics**: `role="dialog"`, `aria-modal`, `aria-labelledby` (step title) or a positional `aria-label`, `aria-describedby` (content).
- **Announcements**: a visually-hidden `aria-live="polite"` region announces each settled step ("Step 2 of 5: Search"), including the gate hint on gated steps. Skipped-over steps are never announced.
- **Keyboard**: `ArrowRight`/`Enter` next (Enter never hijacks a focused button; neither passes an unmet gate), `ArrowLeft` back, `Escape` dismiss — Escape works even while typing in a form field. `keyboard={false}` turns the shortcuts off (the trap stays).
- **Scroll lock**: background scroll is locked while open (`scrollLock={false}` opts out); auto-scroll to off-screen targets still works.
- **Reduced motion**: spotlight/tooltip transitions and the beacon pulse are disabled under `prefers-reduced-motion`.
- Buttons meet WCAG target-size guidance; the gate requirement is conveyed in text, not color alone.

## SSR

Nothing renders on the server — the overlay portals into `document.body` only after mount, and no `window`/`document` access happens at import time. Next.js/Remix-safe.

---

## Limitations

- **Iframes & shadow DOM**: targets inside iframes or closed shadow roots can't be resolved by selector. For open shadow roots, pass a ref or function target that reaches inside; cross-frame tours are out of scope.
- **Firefox spotlight morph**: Firefox doesn't support CSS transitions on SVG geometry attributes, so the hole *jumps* to the next target there instead of morphing. Everything else (dim, tooltip glide) animates normally.
- **Persistence is per-browser** (`localStorage`) and does not sync across tabs.

---

## License

MIT © [usefy](https://github.com/mirunamu00/usefy)

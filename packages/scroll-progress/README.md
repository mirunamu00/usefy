<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/scroll-progress</h1>

<p align="center">
  <strong>Drop-in React reading-progress bar</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/scroll-progress">
    <img src="https://img.shields.io/npm/v/@usefy/scroll-progress.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/scroll-progress">
    <img src="https://img.shields.io/npm/dm/@usefy/scroll-progress.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/scroll-progress">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/scroll-progress?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/scroll-progress.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#accessibility">Accessibility</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/story/scroll-progress--overview" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/scroll-progress` is the reading-progress bar every article page wants, as a single drop-in component. Mount `<ScrollProgress />` once:

- A thin, fixed, **non-interactive bar** pinned to the top (or bottom) of the viewport fills left → right as the user scrolls.
- Progress is `scrollTop / (scrollHeight - clientHeight)`, clamped to `0`–`1`.
- **Tracks the window by default**; pass a `target` ref to measure a scrollable container instead.
- When the content is **shorter than the viewport** (nothing to scroll), progress is `0` and the bar stays empty — never `NaN`, never a misleading fill.

Built on the [`@usefy/use-scroll-position`](https://www.npmjs.com/package/@usefy/use-scroll-position) hook — passive listeners, optional throttling, SSR-safe, StrictMode-safe.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem.**

### Why scroll-progress?

- **Zero-config** — sensible defaults and inline styling; no CSS import required
- **Cheap on scroll** — the fill is a GPU-composited `transform: scaleX(...)`; no layout or paint per scroll event
- **Container-aware** — measure the window or any scrollable element via a ref
- **Fully customizable** — `color`/`height`/`zIndex` props, `className`/`style` passthrough, or take over the UI entirely with `render`
- **Accessible by default** — a real `role="progressbar"` with `aria-valuenow/min/max` and an overridable label
- **SSR compatible** — no `window` access at render; Next.js/Remix-safe, no hydration mismatch
- **TypeScript first** — every prop and type exported

---

## Installation

```bash
# npm
npm install @usefy/scroll-progress

# yarn
yarn add @usefy/scroll-progress

# pnpm
pnpm add @usefy/scroll-progress
```

### Peer Dependencies

Requires React 18 or 19:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

---

## Quick Start

```tsx
import { ScrollProgress } from "@usefy/scroll-progress";

function App() {
  return (
    <>
      {/* Mount once — a 3px blue bar fixed to the top of the viewport */}
      <ScrollProgress />
      <YourApp />
    </>
  );
}
```

> **Note:** Styling is inline — no CSS import required.

---

## Features

### Window scroll by default

With no props, the bar measures the document scroll: empty at the top of the page, full at the bottom. It re-measures on every (optionally throttled) scroll event and on window resize; a content-height change without either (e.g. an image finishing loading) is picked up on the next scroll or resize.

### Track a scrollable container

Pass a ref as `target` and the bar reflects that element's own scroll instead of the window's. The bar itself is always fixed to the viewport edge — `target` only selects which scroll is measured.

```tsx
function Article() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <>
      <ScrollProgress target={ref} />
      <div ref={ref} style={{ height: "100vh", overflowY: "auto" }}>
        <LongContent />
      </div>
    </>
  );
}
```

### Bring your own UI

Pass `render` to keep the scroll tracking but own every pixel:

```tsx
<ScrollProgress
  render={(progress) => (
    <MyCircularGauge value={Math.round(progress * 100)} />
  )}
/>
```

---

## API Reference

### `<ScrollProgress />` Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `position` | `"top" \| "bottom"` | `"top"` | Which viewport edge the fixed bar is pinned to. |
| `color` | `string` | `"#3b82f6"` | Bar fill color (any CSS color). |
| `height` | `number \| string` | `3` | Bar thickness — a number is pixels, a string is any CSS length. |
| `zIndex` | `number` | `9999` | Stacking order of the fixed bar. |
| `target` | `RefObject<HTMLElement \| null>` | — (window) | Ref to the scrollable container to measure. Omit to track the window/document scroll. |
| `throttleMs` | `number` | `0` | Throttle interval (ms) for scroll updates, forwarded to `useScrollPosition`. `0` updates on every scroll event. The trailing edge always fires, so the resting position is never dropped. |
| `aria-label` | `string` | `"Scroll progress"` | Accessible name of the progressbar. |
| `render` | `(progress: number) => ReactNode` | — | Escape hatch: replaces the default bar entirely; called on every render with the current progress (`0`–`1`). |
| `className` | `string` | — | Class applied to the default bar element. |
| `style` | `CSSProperties` | — | Inline styles merged over the defaults (yours win). |

### Other exports

| Export | Description |
| ------ | ----------- |
| `ScrollProgressProps` | Props type. |
| `ScrollProgressPosition` | `"top" \| "bottom"`. |
| `DEFAULT_BAR_COLOR` / `DEFAULT_BAR_HEIGHT` / `DEFAULT_Z_INDEX` / `DEFAULT_ARIA_LABEL` | The defaults, for reuse in custom `render` UIs. |

The default bar also exposes a `data-position="top" | "bottom"` attribute for styling and testing.

### Progress model

```
progress = clamp(scrollTop / (scrollHeight - clientHeight), 0, 1)
```

When `scrollHeight - clientHeight <= 0` (the content fits in the viewport, so there is nothing to scroll), progress is `0` — the bar renders but stays empty, so layout and stacking never jump when content grows.

---

## Examples

### A thicker bar at the bottom

```tsx
<ScrollProgress position="bottom" color="#10b981" height={6} />
```

### Under a sticky header

```tsx
{/* Push the bar below a 56px header and keep it under modals */}
<ScrollProgress zIndex={40} style={{ top: 56 }} />
```

### Throttled updates

```tsx
{/* Update at most every 100ms (trailing edge still lands the final value) */}
<ScrollProgress throttleMs={100} />
```

### Restyle the default bar

```tsx
<ScrollProgress
  className="my-progress"
  style={{ background: "linear-gradient(to right, #6366f1, #ec4899)" }}
/>
```

---

## Accessibility

- The bar is a **`role="progressbar"`** with `aria-valuemin={0}`, `aria-valuemax={100}`, and `aria-valuenow` as a rounded `0`–`100` percentage.
- The accessible name defaults to `"Scroll progress"` and is overridable via the `aria-label` prop.
- The bar is **non-interactive** (`pointer-events: none`) and never steals focus or clicks.

## SSR

No `window` or `document` access happens at module scope or during render. On the server the bar renders at progress `0` (`scaleX(0)`), so there is never a hydration mismatch — the real progress is measured in a layout effect before first paint on the client.

---

## License

MIT © [usefy](https://github.com/mirunamu00/usefy)

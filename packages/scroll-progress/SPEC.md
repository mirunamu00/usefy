# ScrollProgress Component Specification

## Overview

**Package Name:** `@usefy/scroll-progress`
**Version:** `0.0.0` (unreleased — the pending `minor` changeset publishes `0.1.0`)
**Status:** Implemented
**Created:** 2026-07-22
**Author:** usefy team

---

## 1. Purpose

`<ScrollProgress />` is a drop-in reading-progress bar: a thin, fixed,
non-interactive strip pinned to the top (or bottom) of the viewport whose width
reflects how far the user has scrolled through the page — or through a given
scrollable container. Mount it once and it:

1. Renders a bar whose fill scales from `0` (at the very top) to `1` (scrolled
   to the very bottom), computed as
   `scrollTop / (scrollHeight - clientHeight)`, clamped to `[0, 1]`.
2. Tracks the **window/document scroll by default**; pass a `target` ref to
   track a scrollable element instead.
3. When the content is **shorter than the viewport** (nothing to scroll,
   `scrollHeight - clientHeight <= 0`), progress is **`0`** — the bar stays
   empty rather than showing a misleading full/partial fill.

## 2. Composition (house hooks — no reinvented listeners)

| Concern | Hook |
| ------- | ---- |
| Scroll offset subscription (throttled, passive, SSR-safe, StrictMode-safe) | `@usefy/use-scroll-position` |
| Recompute the denominator when the viewport resizes | `@usefy/use-window-size` |
| Pre-paint progress computation on the client | `@usefy/use-isomorphic-layout-effect` |

The component itself owns only the progress arithmetic and the bar's
presentation. Scroll listeners, throttling, and resize listeners all come from
the hooks above.

**Recompute triggers:** progress is recomputed on every (throttled) scroll of
the target and on every window resize. A content-height change that happens
*without* a scroll or resize (e.g. an image finishing loading) is picked up on
the next scroll/resize — an accepted trade-off to avoid a MutationObserver.

## 3. API

### 3.1 Props (`ScrollProgressProps`)

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `position` | `"top" \| "bottom"` | `"top"` | Which viewport edge the fixed bar is pinned to. |
| `color` | `string` | `"#3b82f6"` | Bar fill color (any CSS color). |
| `height` | `number \| string` | `3` | Bar thickness — a number is pixels, a string is any CSS length. |
| `zIndex` | `number` | `9999` | Stacking order of the fixed bar. |
| `target` | `RefObject<HTMLElement \| null>` | — (window) | Ref to the scrollable container to measure. Omit to track the window/document scroll. The bar itself is always fixed to the viewport edge. |
| `throttleMs` | `number` | `0` | Throttle interval for scroll updates, forwarded to `useScrollPosition`. `0` updates on every scroll event (smoothest bar). The trailing edge always fires, so the resting position is never dropped. |
| `aria-label` | `string` | `"Scroll progress"` | Accessible name of the progressbar. |
| `render` | `(progress: number) => ReactNode` | — | Escape hatch: fully own the UI. When provided, the default bar is never rendered and `render` is called on every render with the current progress (`0`–`1`); return `null` to render nothing. |
| `className` | `string` | — | Class applied to the default bar element. |
| `style` | `CSSProperties` | — | Merged **over** the default inline styles (user styles win). |

### 3.2 Exports

- `ScrollProgress` — the component.
- `ScrollProgressProps`, `ScrollProgressPosition` — types.
- `DEFAULT_BAR_COLOR`, `DEFAULT_BAR_HEIGHT`, `DEFAULT_Z_INDEX`,
  `DEFAULT_ARIA_LABEL` — defaults, for reuse in custom `render` UIs.

## 4. Progress model

```
progress = clamp(scrollTop / (scrollHeight - clientHeight), 0, 1)
```

- **Window target:** `scrollTop = window.scrollY`,
  `scrollHeight/clientHeight` from `document.documentElement`.
- **Element target:** the element's own `scrollTop` / `scrollHeight` /
  `clientHeight`.
- **Divide-by-zero:** when `scrollHeight - clientHeight <= 0` (content fits in
  the viewport), progress is `0`. The bar renders but stays empty
  (`scaleX(0)`), so layout/stacking never jumps when content grows.
- The value is committed to state from a layout effect with an equality
  bail-out, so no-op scrolls don't re-render.

## 5. Default presentation

A fixed, full-width, non-interactive strip (`pointer-events: none`) pinned to
`position`, `z-index: 9999`, `height: 3px`, `background-color: #3b82f6`. The
fill is drawn with `transform: scaleX(progress)` and `transform-origin: left`
(GPU-composited — no layout or paint on scroll). All inline styles — no CSS
import, zero-config. `style`/`className` customize it; `render` replaces it
entirely.

`data-position="top" | "bottom"` is set on the bar for styling/testing hooks.

## 6. Accessibility

The bar is a **`role="progressbar"`** with:

- `aria-valuemin={0}`, `aria-valuemax={100}`,
  `aria-valuenow={Math.round(progress * 100)}`;
- a default `aria-label` of `"Scroll progress"`, overridable via the
  `aria-label` prop;
- `pointer-events: none` — it never steals clicks or focus.

## 7. SSR & StrictMode

- No `window`/`document` access at module scope or during render. On the
  server the bar renders at progress `0` (`scaleX(0)`), so there is never a
  hydration mismatch; the real progress is measured in a layout effect before
  first paint on the client.
- All subscriptions (scroll, resize) come from house hooks that clean up on
  unmount — StrictMode's double mount/unmount never leaks a listener.
- No user callback is ever fired from a `setState` updater.
- Supports React 18 and 19 (`peerDependencies: ^18 || ^19`).

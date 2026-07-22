---
"@usefy/scroll-progress": minor
---

Add `@usefy/scroll-progress` — a drop-in React reading-progress bar. A thin, fixed, non-interactive `role="progressbar"` bar pinned to the top (or bottom) of the viewport fills as the user scrolls the page — or a scrollable container passed via `target`. Progress is `scrollTop / (scrollHeight - clientHeight)` clamped to 0–1 (0 when there is nothing to scroll), drawn with a GPU-composited `scaleX` transform. Customizable via `color` / `height` / `zIndex` / `throttleMs` / `aria-label` / `className` / `style`, with a `render` escape hatch receiving the raw 0–1 progress. Built on `@usefy/use-scroll-position` + `@usefy/use-window-size`; SSR-safe and StrictMode-safe.

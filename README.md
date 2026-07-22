<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="180" />
</p>

<h1 align="center">usefy</h1>

<p align="center">
  <strong>Production-ready React utilities for modern applications</strong>
</p>

<p align="center">
  <a href="https://usefy-web.vercel.app" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/website-usefy--web.vercel.app-000000?style=flat-square" alt="website" />
  </a>
  <a href="https://www.npmjs.com/org/usefy" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/npm-@usefy-007acc?style=flat-square" alt="npm org" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/npm/l/@usefy/hooks.svg?style=flat-square&color=007acc" alt="license" />
  </a>
  <a href="https://github.com/mirunamu00/usefy" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/github/stars/mirunamu00/usefy?style=flat-square&color=007acc" alt="stars" />
  </a>
</p>

<p align="center">
  <a href="https://usefy-web.vercel.app">Website</a> •
  <a href="#ecosystem">Ecosystem</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#why-usefy">Why usefy?</a> •
  <a href="#packages">Packages</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/" target="_blank" rel="noopener noreferrer">
    <strong>View Storybook Demo</strong>
  </a>
</p>

---

> ✅ **Stable & production-ready.** usefy follows [semantic versioning](https://semver.org) — breaking changes only ever land in a new major version.

---

## Overview

**usefy** is a monorepo of production-ready React packages published under `@usefy/*`. Each package under `packages/` stands on its own — install exactly what you need. Some are umbrellas that bundle a whole family (`@usefy/hooks`); others are single-purpose packages (`@usefy/memory-monitor`). New packages — another umbrella, or a standalone UI package — simply drop in at the same level.

| Package | Description |
| ------- | ----------- |
| `@usefy/hooks` | 70+ lightweight React hooks (umbrella — each hook is also published on its own as `@usefy/use-*`) |
| `@usefy/memory-monitor` | Real-time browser memory monitoring component |
| `@usefy/virtual-keyboard` | On-screen virtual keyboard with a declarative layout engine and headless hook |
| `@usefy/network-indicator` | Drop-in online/offline status banner with an auto-dismissing "back online" confirmation |
| `@usefy/scroll-progress` | Drop-in reading-progress bar that fills as you scroll the page or any container |

---

## Ecosystem

### @usefy/hooks — React Hooks Collection

<a href="https://www.npmjs.com/package/@usefy/hooks" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/npm/v/@usefy/hooks.svg?style=flat-square&color=007acc" alt="npm version" />
</a>
<a href="https://www.npmjs.com/package/@usefy/hooks" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/npm/dm/@usefy/hooks.svg?style=flat-square&color=007acc" alt="npm downloads" />
</a>
<a href="https://bundlephobia.com/package/@usefy/hooks" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/bundlephobia/minzip/@usefy/hooks?style=flat-square&color=007acc" alt="bundle size" />
</a>

A collection of **70+ lightweight React hooks** for common patterns like state management, timing, storage, events, and more.

```bash
pnpm add @usefy/hooks
```

```tsx
import { useToggle, useDebounce, useLocalStorage } from "@usefy/hooks";

function App() {
  const { value: isOpen, toggle } = useToggle(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [theme, setTheme] = useLocalStorage("theme", "light");

  // ...
}
```

**Highlights:**
- `useToggle`, `useCounter`, `useObjectState` — State management (boolean, counter, object patch/merge)
- `useRafState` — `useState` that batches updates to `requestAnimationFrame` (one commit per frame)
- `useDebounce`, `useThrottle`, `useTimer`, `useTimeout`, `useInterval` — Timing utilities
- `useLocalStorage`, `useSessionStorage`, `useCookie` — Persistent storage (localStorage, sessionStorage, cookies)
- `useEventListener`, `useOnClickOutside`, `useHover`, `useLongPress`, `useScrollLock`, `useFocusTrap`, `useFocusWithin` — DOM events, gestures & modal accessibility
- `useInfiniteScroll` — Sentinel-driven infinite loading built on IntersectionObserver
- `usePagination` — Headless pagination state (page count, slice-ready range, ellipsis-aware pager model)
- `useKeyPress`, `useHotkeys` — Keyboard shortcuts, combinations, and sequences
- `useMap`, `useSet`, `useList`, `useQueue`, `useStack` — Map / Set / array / FIFO queue / LIFO stack data structure state management
- `useSelection` — Multi/single selection state for lists and tables (Set-based, checkbox-ready)
- `useHistoryState` — Undo/redo state history with time-travel
- `useStep` — Multi-step navigation for wizards, forms, and carousels
- `useIntersectionObserver`, `useResizeObserver`, `useMutationObserver`, `useMeasure`, `useScrollPosition`, `useGeolocation`, `useWindowSize`, `useNetworkState`, `usePageVisibility`, `useIdle`, `usePermission`, `useScript` — Browser APIs & element measurement
- `useAsyncFn`, `useAsync`, `usePolling` — Async lifecycle tracking (manual-trigger / auto-run / interval polling with backoff and AbortController cancellation)
- `useSignal` — Event-driven communication
- `useMemoryMonitor` — Memory monitoring hook
- `useIsClient`, `useIsomorphicLayoutEffect`, `usePrevious`, `useLatest`, `useEventCallback`, `useUpdateEffect`, `useMount`, `useIsFirstRender` — SSR & lifecycle utilities
- `useMediaQuery`, `usePreferredColorScheme`, `useReducedMotion`, `useDarkMode`, `useDocumentTitle` — Responsive, theme & accessibility
- `useControllableState`, `useMergedRefs`, `useDisclosure` — Component-library primitives (controllable state, ref merging, open/close state)

<a href="./packages/hooks/README.md"><strong>View full documentation →</strong></a>

---

### @usefy/memory-monitor

<a href="https://www.npmjs.com/package/@usefy/memory-monitor" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/npm/v/@usefy/memory-monitor.svg?style=flat-square&color=007acc" alt="npm version" />
</a>
<a href="https://www.npmjs.com/package/@usefy/memory-monitor" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/npm/dm/@usefy/memory-monitor.svg?style=flat-square&color=007acc" alt="npm downloads" />
</a>
<a href="https://bundlephobia.com/package/@usefy/memory-monitor" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/bundlephobia/minzip/@usefy/memory-monitor?style=flat-square&color=007acc" alt="bundle size" />
</a>

Real-time memory monitoring panel with leak detection, snapshots, and reports
(built on `@usefy/use-memory-monitor`).

```bash
pnpm add @usefy/memory-monitor
```

```tsx
import { MemoryMonitor } from "@usefy/memory-monitor";

function App() {
  return (
    <div>
      <h1>My Application</h1>
      <MemoryMonitor
        mode="development"
        position="right"
        onLeakDetected={(analysis) => console.warn("Leak:", analysis)}
      />
    </div>
  );
}
```

<a href="./packages/memory-monitor/README.md"><strong>View full documentation →</strong></a>

---

### @usefy/virtual-keyboard

<a href="https://www.npmjs.com/package/@usefy/virtual-keyboard" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/npm/v/@usefy/virtual-keyboard.svg?style=flat-square&color=007acc" alt="npm version" />
</a>
<a href="https://www.npmjs.com/package/@usefy/virtual-keyboard" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/npm/dm/@usefy/virtual-keyboard.svg?style=flat-square&color=007acc" alt="npm downloads" />
</a>
<a href="https://bundlephobia.com/package/@usefy/virtual-keyboard" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/bundlephobia/minzip/@usefy/virtual-keyboard?style=flat-square&color=007acc" alt="bundle size" />
</a>

On-screen (virtual) keyboard for kiosks, PIN pads, and D-pad UIs — a declarative
layout engine, a headless `useVirtualKeyboard` hook, and enterprise a11y.

```bash
pnpm add @usefy/virtual-keyboard
```

```tsx
import { useRef } from "react";
import { VirtualKeyboard, qwertyLayout } from "@usefy/virtual-keyboard";

function Search() {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={inputRef} placeholder="Search…" />
      <VirtualKeyboard inputRef={inputRef} layouts={qwertyLayout} submitOnEnter />
    </>
  );
}
```

<a href="./packages/virtual-keyboard/README.md"><strong>View full documentation →</strong></a>

---

### @usefy/network-indicator

<a href="https://www.npmjs.com/package/@usefy/network-indicator" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/npm/v/@usefy/network-indicator.svg?style=flat-square&color=007acc" alt="npm version" />
</a>
<a href="https://www.npmjs.com/package/@usefy/network-indicator" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/npm/dm/@usefy/network-indicator.svg?style=flat-square&color=007acc" alt="npm downloads" />
</a>
<a href="https://bundlephobia.com/package/@usefy/network-indicator" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/bundlephobia/minzip/@usefy/network-indicator?style=flat-square&color=007acc" alt="bundle size" />
</a>

Drop-in online/offline status banner — renders nothing while online, warns when
the connection drops, and flashes an auto-dismissing "Back online" confirmation
on reconnect (built on `@usefy/use-network-state`).

```bash
pnpm add @usefy/network-indicator
```

```tsx
import { NetworkIndicator } from "@usefy/network-indicator";

function App() {
  return (
    <>
      <YourApp />
      {/* Mount once at the root — zero-config, SSR-safe */}
      <NetworkIndicator position="top" onlineDuration={3000} />
    </>
  );
}
```

<a href="./packages/network-indicator/README.md"><strong>View full documentation →</strong></a>

---

### @usefy/scroll-progress

<a href="https://www.npmjs.com/package/@usefy/scroll-progress" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/npm/v/@usefy/scroll-progress.svg?style=flat-square&color=007acc" alt="npm version" />
</a>
<a href="https://www.npmjs.com/package/@usefy/scroll-progress" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/npm/dm/@usefy/scroll-progress.svg?style=flat-square&color=007acc" alt="npm downloads" />
</a>
<a href="https://bundlephobia.com/package/@usefy/scroll-progress" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/bundlephobia/minzip/@usefy/scroll-progress?style=flat-square&color=007acc" alt="bundle size" />
</a>

Drop-in reading-progress bar — a thin fixed bar pinned to the top (or bottom) of
the viewport that fills as you scroll the page or any scrollable container
(built on `@usefy/use-scroll-position`).

```bash
pnpm add @usefy/scroll-progress
```

```tsx
import { ScrollProgress } from "@usefy/scroll-progress";

function App() {
  return (
    <>
      {/* Mount once — zero-config, accessible, SSR-safe */}
      <ScrollProgress color="#8b5cf6" height={4} />
      <YourApp />
    </>
  );
}
```

<a href="./packages/scroll-progress/README.md"><strong>View full documentation →</strong></a>

---

## Quick Start

### Choose Your Package

| Need | Install | Import |
| ---- | ------- | ------ |
| All hooks | `pnpm add @usefy/hooks` | `import { useToggle } from "@usefy/hooks"` |
| Single hook | `pnpm add @usefy/use-toggle` | `import { useToggle } from "@usefy/use-toggle"` |
| Memory monitor | `pnpm add @usefy/memory-monitor` | `import { MemoryMonitor } from "@usefy/memory-monitor"` |
| Virtual keyboard | `pnpm add @usefy/virtual-keyboard` | `import { VirtualKeyboard } from "@usefy/virtual-keyboard"` |
| Network status banner | `pnpm add @usefy/network-indicator` | `import { NetworkIndicator } from "@usefy/network-indicator"` |
| Scroll progress bar | `pnpm add @usefy/scroll-progress` | `import { ScrollProgress } from "@usefy/scroll-progress"` |

### Peer Dependencies

All packages require React 18 or 19:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

Some packages may have additional peer dependencies (check individual package docs).

---

## Why usefy?

<table>
<tr>
<td width="50%">

### Hooks
- Zero dependencies
- Minimal bundle size
- Building blocks for custom UI
- Logic only, no styling

</td>
<td width="50%">

### Complete packages
- Self-contained solutions
- Built-in UI with customization
- Feature-rich, installed on their own
- Ready to use out of the box

</td>
</tr>
</table>

### Common Features

- **TypeScript First** — Complete type safety with full autocomplete support
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Tree Shakeable** — Import only what you need to optimize bundle size
- **Well Tested** — High test coverage ensures reliability and stability
- **Well Documented** — Detailed documentation with practical examples
- **Interactive Demos** — Try everything in our Storybook playground

---

## Packages

### @usefy/hooks

| Hook | Description |
| ---- | ----------- |
| `useToggle` | Boolean state with toggle, setTrue, setFalse |
| `useCounter` | Counter with increment, decrement, reset |
| `useDebounce` | Value debouncing with leading/trailing edge |
| `useDebounceCallback` | Debounced callbacks with cancel/flush |
| `useThrottle` | Value throttling for rate-limiting |
| `useThrottleCallback` | Throttled callbacks with cancel/flush |
| `useTimer` | Countdown timer with drift compensation |
| `useTimeout` | Declarative setTimeout with reset/clear and isPending |
| `useInterval` | Declarative setInterval with start/stop/toggle and isRunning |
| `useLocalStorage` | localStorage with cross-tab sync |
| `useSessionStorage` | sessionStorage persistence |
| `useCookie` | Browser cookie as React state, SSR-aware |
| `useEventListener` | DOM events with auto cleanup |
| `useOnClickOutside` | Outside click detection |
| `useClickAnyWhere` | Global click detection |
| `useCopyToClipboard` | Clipboard operations |
| `useGeolocation` | Device geolocation with tracking |
| `useIntersectionObserver` | Element visibility detection |
| `useResizeObserver` | Element size tracking (content/border/device-pixel box) with debounce/throttle and SSR |
| `useWindowSize` | Window size tracking with debounce/throttle and SSR support |
| `useHover` | Element hover detection with delay |
| `useKeyPress` | Keyboard key, shortcut, and combination detection |
| `useMap` | Map data structure state with immutable updates |
| `useSet` | Set data structure state with immutable updates |
| `useList` | Array state with push/filter/sort/insertAt/updateAt |
| `useQueue` | FIFO queue state with enqueue/dequeue and immutable updates |
| `useStack` | LIFO stack state with push/pop/peek and immutable updates |
| `useHistoryState` | Undo/redo state history with time-travel |
| `useStep` | Multi-step navigation for wizards, forms, carousels |
| `useSignal` | Event-driven communication |
| `useUnmount` | Unmount callback |
| `useInit` | One-time initialization |
| `useMemoryMonitor` | Browser memory monitoring |
| `useIsClient` | True once hydrated on the client (SSR guard) |
| `useIsomorphicLayoutEffect` | SSR-safe useLayoutEffect |
| `usePrevious` | Value from the previous render |
| `useLatest` | Ref that always holds the latest value |
| `useEventCallback` | Stable callback that sees the latest state |
| `useUpdateEffect` | useEffect that skips the first render |
| `useMount` | Run a callback once on mount |
| `useIsFirstRender` | True only on the first render |
| `useMediaQuery` | Match CSS media queries (matchMedia, SSR-safe) |
| `usePreferredColorScheme` | System color scheme (prefers-color-scheme) |
| `useReducedMotion` | Reduced-motion preference (a11y) |
| `useDarkMode` | Dark mode: system/light/dark, persistence, DOM apply |
| `useDocumentTitle` | Set document.title with restore-on-unmount |
| `useControllableState` | Controlled/uncontrolled state primitive (Radix/Mantine pattern) |
| `useMergedRefs` | Merge multiple refs into one (forwardRef helper) |
| `useDisclosure` | open/close/toggle state for modals, drawers, popovers |
| `useMutationObserver` | Watch an element for DOM mutations (childList/attributes/characterData) |
| `useScrollPosition` | Throttled scroll offset (x, y) of the window or an element |
| `useScrollLock` | Lock body scroll for modals/drawers — iOS-aware, nested-lock counted |
| `useHotkeys` | High-level keyboard shortcuts — combos, sequences, `mod` alias, scoping, input-field guard |
| `useFocusTrap` | Trap keyboard focus in a subtree (modals/dialogs) — Tab cycling, initial/return focus, Escape |
| `useFocusWithin` | Track whether keyboard focus is anywhere within a subtree — reactive `:focus-within` with `onFocus`/`onBlur` edges |
| `useLongPress` | Long-press ("press and hold") gestures for mouse and touch — time threshold, movement cancellation, `onStart`/`onFinish`/`onCancel` |
| `useAsyncFn` | Run a manual-trigger async function with idle/pending/success/error lifecycle, race-safe stale-response guarding, and unmount safety |
| `useAsync` | Full async task lifecycle — object-style state, immediate auto-run, and AbortController cancellation |
| `usePolling` | Poll an async function on an interval — non-overlapping self-scheduling ticks, pause/resume, an `enabled` gate, and exponential backoff |
| `useRafState` | A drop-in `useState` that batches updates to `requestAnimationFrame` — rapid scroll/resize/pointer/animation updates coalesce to at most one commit per frame |
| `useObjectState` | Object state with immutable partial updates (patch/merge) and reset |
| `useSelection` | Multi/single selection state for lists and tables — Set-based, checkbox-ready with indeterminate support |
| `useInfiniteScroll` | Sentinel-driven infinite loading built on IntersectionObserver — fires `loadMore` once per intersection, respects `hasMore`/`loading`/`enabled` |
| `usePagination` | Headless pagination state machine — controlled/uncontrolled current page, derived `pageCount`, a slice-ready 0-based `range`, and an ellipsis-aware `items` pager model |
| `useNetworkState` | Online/offline status + Network Information API (`effectiveType`, `downlink`, `saveData`), SSR-safe |
| `usePageVisibility` | Track tab/window visibility (foreground vs. background) via the Page Visibility API, with optional `onChange` and SSR support |
| `useIdle` | Report user inactivity after a timeout, with throttled activity listeners, visibility awareness, and SSR support |
| `usePermission` | Read Permissions API status with live updates — `{ state, status, isSupported, error }`, SSR-safe, accepts any permission name |
| `useScript` | Load an external script with `idle/loading/ready/error` status, `<script>` deduplication across components, and ref-counted cleanup — SSR-safe |

### @usefy/memory-monitor

| Export | Description |
| ------ | ----------- |
| `MemoryMonitor` | Real-time memory monitoring panel with leak detection, snapshots, and reports |

### @usefy/virtual-keyboard

| Export | Description |
| ------ | ----------- |
| `VirtualKeyboard` | On-screen keyboard component (inline / docked / floating, with an optional trigger) bound to any input |
| `useVirtualKeyboard` | Headless engine — modifier state, layout engine, caret-aware editing, prop-getters |
| `qwertyLayout`, `azertyLayout`, `qwertzLayout`, `dvorakLayout`, `colemakLayout`, `numericLayout`, `phoneLayout`, `emailLayout` | Built-in data-driven layouts (5 Latin + numeric / phone / email) |
| `createLayout`, `resolveLayout`, `randomizeLayout` | Author a custom layout / resolve one against modifiers / shuffle char-key positions (seedable) |
| `identityComposer` | Default 1:1 composer (IME seam) |

Also ships a `@usefy/virtual-keyboard/headless` entry (hook + engine + types, no CSS), an opt-in `@usefy/virtual-keyboard/hangul` entry (`hangulComposer` + `hangulLayout` — Korean 두벌식 IME), and an opt-in `@usefy/virtual-keyboard/styles.css`.

### @usefy/network-indicator

| Export | Description |
| ------ | ----------- |
| `NetworkIndicator` | Drop-in online/offline banner — offline warning + auto-dismissing "back online" confirmation, `render` escape hatch, `onStatusChange` callback |
| `DEFAULT_OFFLINE_MESSAGE`, `DEFAULT_ONLINE_MESSAGE`, `DEFAULT_ONLINE_DURATION` | The component's defaults, reusable in custom `render` UIs |

### @usefy/scroll-progress

| Export | Description |
| ------ | ----------- |
| `ScrollProgress` | Drop-in reading-progress bar — fixed top/bottom bar filled by `scrollTop / (scrollHeight - clientHeight)`, window or container `target`, `render` escape hatch |
| `DEFAULT_BAR_COLOR`, `DEFAULT_BAR_HEIGHT`, `DEFAULT_Z_INDEX`, `DEFAULT_ARIA_LABEL` | The component's defaults, reusable in custom `render` UIs |

---

## Browser Support

| Browser | Version |
| ------- | ------- |
| Chrome | 66+ |
| Firefox | 63+ |
| Safari | 13.1+ |
| Edge | 79+ |

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

```bash
# Clone the repo
git clone https://github.com/mirunamu00/usefy.git

# Install dependencies
pnpm install

# Run tests
pnpm test

# Start Storybook
pnpm storybook
```

---

## Related Links

- <a href="https://www.npmjs.com/org/usefy" target="_blank" rel="noopener noreferrer">npm Organization</a>
- <a href="https://mirunamu00.github.io/usefy/" target="_blank" rel="noopener noreferrer">Storybook Demo</a>
- <a href="https://mirunamu00.github.io/usefy/coverage/" target="_blank" rel="noopener noreferrer">Coverage Report</a>
- <a href="https://github.com/mirunamu00/usefy/issues" target="_blank" rel="noopener noreferrer">Issue Tracker</a>

---

## License

MIT © <a href="https://github.com/mirunamu00" target="_blank" rel="noopener noreferrer">mirunamu</a>

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>

<p align="center">
  <a href="https://github.com/mirunamu00/usefy" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/github/stars/mirunamu00/usefy?style=social" alt="GitHub stars" />
  </a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="180" />
</p>

<h1 align="center">usefy</h1>

<p align="center">
  <strong>Production-ready React utilities for modern applications</strong>
</p>

<p align="center">
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

> **Pre-release Notice**: This project is currently in version `0.x.x` (alpha/beta stage). APIs may change between minor versions. While fully functional and tested, please use with caution in production environments.

---

## Overview

**usefy** is a monorepo containing production-ready React utilities. The ecosystem is divided into two main categories:

| Category | Package | Description |
| -------- | ------- | ----------- |
| **Hooks** | `@usefy/hooks` | Lightweight React hooks for common patterns |
| **Kits** | `@usefy/kits` | Feature-complete UI components with built-in functionality |

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

A collection of **20+ lightweight React hooks** for common patterns like state management, timing, storage, events, and more.

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
- `useToggle`, `useCounter` — State management
- `useDebounce`, `useThrottle`, `useTimer` — Timing utilities
- `useLocalStorage`, `useSessionStorage` — Persistent storage
- `useEventListener`, `useOnClickOutside`, `useHover`, `useLongPress`, `useScrollLock`, `useFocusTrap`, `useFocusWithin` — DOM events, gestures & modal accessibility
- `useKeyPress`, `useHotkeys` — Keyboard shortcuts, combinations, and sequences
- `useMap`, `useSet`, `useList`, `useQueue` — Map / Set / array / FIFO queue data structure state management
- `useHistoryState` — Undo/redo state history with time-travel
- `useStep` — Multi-step navigation for wizards, forms, and carousels
- `useIntersectionObserver`, `useResizeObserver`, `useMutationObserver`, `useMeasure`, `useScrollPosition`, `useGeolocation`, `useWindowSize` — Browser APIs & element measurement
- `useSignal` — Event-driven communication
- `useMemoryMonitor` — Memory monitoring hook
- `useIsClient`, `useIsomorphicLayoutEffect`, `usePrevious`, `useLatest`, `useEventCallback`, `useUpdateEffect`, `useMount`, `useIsFirstRender` — SSR & lifecycle utilities
- `useMediaQuery`, `usePreferredColorScheme`, `useReducedMotion`, `useDarkMode`, `useDocumentTitle` — Responsive, theme & accessibility
- `useControllableState`, `useMergedRefs`, `useDisclosure` — Component-library primitives (controllable state, ref merging, open/close state)

<a href="./packages/hooks/README.md"><strong>View full documentation →</strong></a>

---

### @usefy/kits — Feature Kits Collection

<a href="https://www.npmjs.com/package/@usefy/kits" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/npm/v/@usefy/kits.svg?style=flat-square&color=007acc" alt="npm version" />
</a>
<a href="https://www.npmjs.com/package/@usefy/kits" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/npm/dm/@usefy/kits.svg?style=flat-square&color=007acc" alt="npm downloads" />
</a>
<a href="https://bundlephobia.com/package/@usefy/kits" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/bundlephobia/minzip/@usefy/kits?style=flat-square&color=007acc" alt="bundle size" />
</a>

A collection of **feature-complete UI components** with built-in state management, styling, and functionality. Drop them into your app with minimal configuration.

```bash
pnpm add @usefy/kits
```

```tsx
import { MemoryMonitor } from "@usefy/kits";

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

**Available Kits:**
- `MemoryMonitor` — Real-time memory monitoring panel (built on `@usefy/use-memory-monitor`)

<a href="./packages/kits/README.md"><strong>View full documentation →</strong></a>

---

## Quick Start

### Choose Your Package

| Need | Install | Import |
| ---- | ------- | ------ |
| All hooks | `pnpm add @usefy/hooks` | `import { useToggle } from "@usefy/hooks"` |
| All kits | `pnpm add @usefy/kits` | `import { MemoryMonitor } from "@usefy/kits"` |
| Single hook | `pnpm add @usefy/use-toggle` | `import { useToggle } from "@usefy/use-toggle"` |
| Single kit | `pnpm add @usefy/memory-monitor` | `import { MemoryMonitor } from "@usefy/memory-monitor"` |

### Peer Dependencies

All packages require React 18 or 19:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

Some kits may have additional peer dependencies (check individual package docs).

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

### Kits
- Complete solutions
- Built-in UI with customization
- Feature-rich components
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

### Hooks (`@usefy/hooks`)

| Hook | Description |
| ---- | ----------- |
| `useToggle` | Boolean state with toggle, setTrue, setFalse |
| `useCounter` | Counter with increment, decrement, reset |
| `useDebounce` | Value debouncing with leading/trailing edge |
| `useDebounceCallback` | Debounced callbacks with cancel/flush |
| `useThrottle` | Value throttling for rate-limiting |
| `useThrottleCallback` | Throttled callbacks with cancel/flush |
| `useTimer` | Countdown timer with drift compensation |
| `useLocalStorage` | localStorage with cross-tab sync |
| `useSessionStorage` | sessionStorage persistence |
| `useEventListener` | DOM events with auto cleanup |
| `useOnClickOutside` | Outside click detection |
| `useClickAnyWhere` | Global click detection |
| `useCopyToClipboard` | Clipboard operations |
| `useGeolocation` | Device geolocation with tracking |
| `useIntersectionObserver` | Element visibility detection |
| `useWindowSize` | Window size tracking with debounce/throttle and SSR support |
| `useHover` | Element hover detection with delay |
| `useKeyPress` | Keyboard key, shortcut, and combination detection |
| `useMap` | Map data structure state with immutable updates |
| `useSet` | Set data structure state with immutable updates |
| `useList` | Array state with push/filter/sort/insertAt/updateAt |
| `useQueue` | FIFO queue state with enqueue/dequeue and immutable updates |
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

### Kits (`@usefy/kits`)

| Kit | Description |
| --- | ----------- |
| `MemoryMonitor` | Real-time memory monitoring panel with leak detection, snapshots, and reports |

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

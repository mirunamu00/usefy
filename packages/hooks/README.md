<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="180" />
</p>

<h1 align="center">usefy</h1>

<p align="center">
  <strong>🪝 A collection of production-ready React hooks for modern applications</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/hooks" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/npm/v/@usefy/hooks.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/hooks" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/npm/dm/@usefy/hooks.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/hooks" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/hooks?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/npm/l/@usefy/hooks.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#packages">Packages</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

> ⚠️ **Pre-release Notice**: This project is currently in version `0.x.x` (alpha/beta stage). APIs may change between minor versions. While fully functional and tested, please use with caution in production environments.
>
> 🚧 **Actively Developing**: New hooks are being added regularly. Stay tuned for more utilities!

---

## Overview

**usefy** is a collection of production-ready custom hooks designed for modern React applications. All hooks are written in TypeScript, providing complete type safety, comprehensive testing, and minimal bundle size.

### ✨ Why usefy?

- **🚀 Zero Dependencies** — Pure React implementation with no external dependencies
- **📦 Tree Shakeable** — Import only the hooks you need to optimize bundle size
- **🔷 TypeScript First** — Complete type safety with full autocomplete support
- **⚡ SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **🧪 Well Tested** — High test coverage ensures reliability and stability
- **📖 Well Documented** — Detailed documentation with practical examples
- **🎨 Interactive Demos** — Try all hooks in action with our Storybook playground

---

## Installation

### All-in-One Package

Install all hooks at once:

```bash
# npm
npm install @usefy/hooks

# yarn
yarn add @usefy/hooks

# pnpm
pnpm add @usefy/hooks
```

### Individual Packages

You can also install only the hooks you need:

```bash
# Example: Install only use-toggle
pnpm add @usefy/use-toggle

# Install multiple packages
pnpm add @usefy/use-debounce @usefy/use-local-storage
```

### Peer Dependencies

All packages require React 18 or 19:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

---

## Packages

### 📦 Available Hooks

| Hook                                                                                                                                                    | Description                                             | npm                                                                                                                                                                                                                                                     | Coverage                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| <a href="https://www.npmjs.com/package/@usefy/use-toggle" target="_blank" rel="noopener noreferrer">@usefy/use-toggle</a>                               | Boolean state management with toggle, setTrue, setFalse | <a href="https://www.npmjs.com/package/@usefy/use-toggle" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-toggle.svg?style=flat-square&color=007acc" alt="npm version" /></a>                               | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-counter" target="_blank" rel="noopener noreferrer">@usefy/use-counter</a>                             | Counter state with increment, decrement, reset          | <a href="https://www.npmjs.com/package/@usefy/use-counter" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-counter.svg?style=flat-square&color=007acc" alt="npm version" /></a>                             | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-debounce" target="_blank" rel="noopener noreferrer">@usefy/use-debounce</a>                           | Value debouncing with leading/trailing edge             | <a href="https://www.npmjs.com/package/@usefy/use-debounce" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-debounce.svg?style=flat-square&color=007acc" alt="npm version" /></a>                           | ![92%](https://img.shields.io/badge/coverage-92%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-debounce-callback" target="_blank" rel="noopener noreferrer">@usefy/use-debounce-callback</a>         | Debounced callbacks with cancel/flush/pending           | <a href="https://www.npmjs.com/package/@usefy/use-debounce-callback" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-debounce-callback.svg?style=flat-square&color=007acc" alt="npm version" /></a>         | ![93%](https://img.shields.io/badge/coverage-93%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-throttle" target="_blank" rel="noopener noreferrer">@usefy/use-throttle</a>                           | Value throttling for rate-limiting updates              | <a href="https://www.npmjs.com/package/@usefy/use-throttle" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-throttle.svg?style=flat-square&color=007acc" alt="npm version" /></a>                           | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-throttle-callback" target="_blank" rel="noopener noreferrer">@usefy/use-throttle-callback</a>         | Throttled callbacks with cancel/flush/pending           | <a href="https://www.npmjs.com/package/@usefy/use-throttle-callback" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-throttle-callback.svg?style=flat-square&color=007acc" alt="npm version" /></a>         | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-local-storage" target="_blank" rel="noopener noreferrer">@usefy/use-local-storage</a>                 | localStorage persistence with cross-tab sync            | <a href="https://www.npmjs.com/package/@usefy/use-local-storage" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-local-storage.svg?style=flat-square&color=007acc" alt="npm version" /></a>                 | ![95%](https://img.shields.io/badge/coverage-95%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-session-storage" target="_blank" rel="noopener noreferrer">@usefy/use-session-storage</a>             | sessionStorage persistence for tab lifetime             | <a href="https://www.npmjs.com/package/@usefy/use-session-storage" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-session-storage.svg?style=flat-square&color=007acc" alt="npm version" /></a>             | ![95%](https://img.shields.io/badge/coverage-95%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-cookie" target="_blank" rel="noopener noreferrer">@usefy/use-cookie</a>                                   | Browser cookie as React state, SSR-aware                | <a href="https://www.npmjs.com/package/@usefy/use-cookie" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-cookie.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                   | ![96%](https://img.shields.io/badge/coverage-96%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-click-any-where" target="_blank" rel="noopener noreferrer">@usefy/use-click-any-where</a>             | Document-wide click event detection                     | <a href="https://www.npmjs.com/package/@usefy/use-click-any-where" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-click-any-where.svg?style=flat-square&color=007acc" alt="npm version" /></a>             | ![92%](https://img.shields.io/badge/coverage-92%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-copy-to-clipboard" target="_blank" rel="noopener noreferrer">@usefy/use-copy-to-clipboard</a>         | Clipboard copy with fallback support                    | <a href="https://www.npmjs.com/package/@usefy/use-copy-to-clipboard" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-copy-to-clipboard.svg?style=flat-square&color=007acc" alt="npm version" /></a>         | ![88%](https://img.shields.io/badge/coverage-88%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-event-listener" target="_blank" rel="noopener noreferrer">@usefy/use-event-listener</a>               | DOM event listener with auto cleanup                    | <a href="https://www.npmjs.com/package/@usefy/use-event-listener" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-event-listener.svg?style=flat-square&color=007acc" alt="npm version" /></a>               | ![96%](https://img.shields.io/badge/coverage-96%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-on-click-outside" target="_blank" rel="noopener noreferrer">@usefy/use-on-click-outside</a>           | Outside click detection for modals/dropdowns            | <a href="https://www.npmjs.com/package/@usefy/use-on-click-outside" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-on-click-outside.svg?style=flat-square&color=007acc" alt="npm version" /></a>           | ![98%](https://img.shields.io/badge/coverage-98%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-unmount" target="_blank" rel="noopener noreferrer">@usefy/use-unmount</a>                             | Execute callback on component unmount                   | <a href="https://www.npmjs.com/package/@usefy/use-unmount" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-unmount.svg?style=flat-square&color=007acc" alt="npm version" /></a>                             | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-init" target="_blank" rel="noopener noreferrer">@usefy/use-init</a>                                   | One-time initialization with async, retry, timeout      | <a href="https://www.npmjs.com/package/@usefy/use-init" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-init.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                   | ![96%](https://img.shields.io/badge/coverage-96%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-timer" target="_blank" rel="noopener noreferrer">@usefy/use-timer</a>                                 | Countdown timer with drift compensation and formats     | <a href="https://www.npmjs.com/package/@usefy/use-timer" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-timer.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                 | ![84%](https://img.shields.io/badge/coverage-84%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-geolocation" target="_blank" rel="noopener noreferrer">@usefy/use-geolocation</a>                     | Device geolocation with real-time tracking and distance | <a href="https://www.npmjs.com/package/@usefy/use-geolocation" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-geolocation.svg?style=flat-square&color=007acc" alt="npm version" /></a>                     | ![90%](https://img.shields.io/badge/coverage-90%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-intersection-observer" target="_blank" rel="noopener noreferrer">@usefy/use-intersection-observer</a> | Element visibility detection with Intersection Observer | <a href="https://www.npmjs.com/package/@usefy/use-intersection-observer" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-intersection-observer.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![94%](https://img.shields.io/badge/coverage-94%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-signal" target="_blank" rel="noopener noreferrer">@usefy/use-signal</a>                                   | Event-driven communication between components           | <a href="https://www.npmjs.com/package/@usefy/use-signal" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-signal.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                   | ![98%](https://img.shields.io/badge/coverage-98%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-memory-monitor" target="_blank" rel="noopener noreferrer">@usefy/use-memory-monitor</a>                   | Real-time browser memory monitoring with leak detection | <a href="https://www.npmjs.com/package/@usefy/use-memory-monitor" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-memory-monitor.svg?style=flat-square&color=007acc" alt="npm version" /></a>                   | ![90%](https://img.shields.io/badge/coverage-90%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-hover" target="_blank" rel="noopener noreferrer">@usefy/use-hover</a>                                     | Element hover detection with delay support              | <a href="https://www.npmjs.com/package/@usefy/use-hover" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-hover.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                     | ![92%](https://img.shields.io/badge/coverage-92%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-key-press" target="_blank" rel="noopener noreferrer">@usefy/use-key-press</a>                             | Keyboard key, shortcut, and combination detection       | <a href="https://www.npmjs.com/package/@usefy/use-key-press" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-key-press.svg?style=flat-square&color=007acc" alt="npm version" /></a>                             | ![93%](https://img.shields.io/badge/coverage-93%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-map" target="_blank" rel="noopener noreferrer">@usefy/use-map</a>                                         | Map data structure state with immutable updates         | <a href="https://www.npmjs.com/package/@usefy/use-map" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-map.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                         | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-set" target="_blank" rel="noopener noreferrer">@usefy/use-set</a>                                         | Set data structure state with immutable updates         | <a href="https://www.npmjs.com/package/@usefy/use-set" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-set.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                         | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-list" target="_blank" rel="noopener noreferrer">@usefy/use-list</a>                                       | Array state with push/filter/sort/insertAt/updateAt     | <a href="https://www.npmjs.com/package/@usefy/use-list" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-list.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                       | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-queue" target="_blank" rel="noopener noreferrer">@usefy/use-queue</a>                                     | FIFO queue state with enqueue/dequeue and immutable updates | <a href="https://www.npmjs.com/package/@usefy/use-queue" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-queue.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                     | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-history-state" target="_blank" rel="noopener noreferrer">@usefy/use-history-state</a>                     | Undo/redo state history with time-travel                | <a href="https://www.npmjs.com/package/@usefy/use-history-state" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-history-state.svg?style=flat-square&color=007acc" alt="npm version" /></a>                     | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-step" target="_blank" rel="noopener noreferrer">@usefy/use-step</a>                                       | Multi-step navigation for wizards, forms, carousels     | <a href="https://www.npmjs.com/package/@usefy/use-step" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-step.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                       | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-window-size" target="_blank" rel="noopener noreferrer">@usefy/use-window-size</a>                       | Window size tracking with debounce/throttle and SSR     | <a href="https://www.npmjs.com/package/@usefy/use-window-size" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-window-size.svg?style=flat-square&color=007acc" alt="npm version" /></a>                       | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-is-client" target="_blank" rel="noopener noreferrer">@usefy/use-is-client</a> | True once hydrated on the client (SSR guard) | <a href="https://www.npmjs.com/package/@usefy/use-is-client" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-is-client.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-isomorphic-layout-effect" target="_blank" rel="noopener noreferrer">@usefy/use-isomorphic-layout-effect</a> | SSR-safe useLayoutEffect | <a href="https://www.npmjs.com/package/@usefy/use-isomorphic-layout-effect" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-isomorphic-layout-effect.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-previous" target="_blank" rel="noopener noreferrer">@usefy/use-previous</a> | Value from the previous render | <a href="https://www.npmjs.com/package/@usefy/use-previous" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-previous.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-latest" target="_blank" rel="noopener noreferrer">@usefy/use-latest</a> | Ref that always holds the latest value | <a href="https://www.npmjs.com/package/@usefy/use-latest" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-latest.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-event-callback" target="_blank" rel="noopener noreferrer">@usefy/use-event-callback</a> | Stable callback that sees the latest state | <a href="https://www.npmjs.com/package/@usefy/use-event-callback" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-event-callback.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-update-effect" target="_blank" rel="noopener noreferrer">@usefy/use-update-effect</a> | useEffect that skips the first render | <a href="https://www.npmjs.com/package/@usefy/use-update-effect" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-update-effect.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-mount" target="_blank" rel="noopener noreferrer">@usefy/use-mount</a> | Run a callback once on mount | <a href="https://www.npmjs.com/package/@usefy/use-mount" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-mount.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-is-first-render" target="_blank" rel="noopener noreferrer">@usefy/use-is-first-render</a> | True only on the first render | <a href="https://www.npmjs.com/package/@usefy/use-is-first-render" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-is-first-render.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-media-query" target="_blank" rel="noopener noreferrer">@usefy/use-media-query</a> | Match CSS media queries (matchMedia, SSR-safe) | <a href="https://www.npmjs.com/package/@usefy/use-media-query" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-media-query.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-preferred-color-scheme" target="_blank" rel="noopener noreferrer">@usefy/use-preferred-color-scheme</a> | System color scheme (prefers-color-scheme) | <a href="https://www.npmjs.com/package/@usefy/use-preferred-color-scheme" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-preferred-color-scheme.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-reduced-motion" target="_blank" rel="noopener noreferrer">@usefy/use-reduced-motion</a> | Reduced-motion preference (a11y) | <a href="https://www.npmjs.com/package/@usefy/use-reduced-motion" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-reduced-motion.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-dark-mode" target="_blank" rel="noopener noreferrer">@usefy/use-dark-mode</a> | Dark mode: system/light/dark, persistence, DOM apply | <a href="https://www.npmjs.com/package/@usefy/use-dark-mode" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-dark-mode.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![96%](https://img.shields.io/badge/coverage-96%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-document-title" target="_blank" rel="noopener noreferrer">@usefy/use-document-title</a> | Set document.title with restore-on-unmount | <a href="https://www.npmjs.com/package/@usefy/use-document-title" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-document-title.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![92%](https://img.shields.io/badge/coverage-92%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-controllable-state" target="_blank" rel="noopener noreferrer">@usefy/use-controllable-state</a> | Controlled/uncontrolled state primitive (Radix/Mantine pattern) | <a href="https://www.npmjs.com/package/@usefy/use-controllable-state" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-controllable-state.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-merged-refs" target="_blank" rel="noopener noreferrer">@usefy/use-merged-refs</a> | Merge multiple refs into one (forwardRef helper) | <a href="https://www.npmjs.com/package/@usefy/use-merged-refs" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-merged-refs.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-disclosure" target="_blank" rel="noopener noreferrer">@usefy/use-disclosure</a> | open/close/toggle state for modals, drawers, popovers | <a href="https://www.npmjs.com/package/@usefy/use-disclosure" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-disclosure.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-measure" target="_blank" rel="noopener noreferrer">@usefy/use-measure</a> | Reactive element bounds (x, y, width, height, top, right, bottom, left) via ResizeObserver | <a href="https://www.npmjs.com/package/@usefy/use-measure" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-measure.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-mutation-observer" target="_blank" rel="noopener noreferrer">@usefy/use-mutation-observer</a> | Watch an element for DOM mutations (childList/attributes/characterData) via MutationObserver | <a href="https://www.npmjs.com/package/@usefy/use-mutation-observer" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-mutation-observer.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![99%](https://img.shields.io/badge/coverage-99%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-scroll-position" target="_blank" rel="noopener noreferrer">@usefy/use-scroll-position</a> | Throttled scroll offset (x, y) of the window or an element | <a href="https://www.npmjs.com/package/@usefy/use-scroll-position" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-scroll-position.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-scroll-lock" target="_blank" rel="noopener noreferrer">@usefy/use-scroll-lock</a> | Lock body scroll for modals/drawers — iOS-aware, nested-lock counted, with scroll-position restore | <a href="https://www.npmjs.com/package/@usefy/use-scroll-lock" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-scroll-lock.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-hotkeys" target="_blank" rel="noopener noreferrer">@usefy/use-hotkeys</a> | High-level keyboard shortcuts — combos, sequences, `mod` alias, scoping, input-field guard | <a href="https://www.npmjs.com/package/@usefy/use-hotkeys" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-hotkeys.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-focus-trap" target="_blank" rel="noopener noreferrer">@usefy/use-focus-trap</a> | Trap keyboard focus inside a subtree (modals/dialogs) — Tab cycling, initial focus, restore on close | <a href="https://www.npmjs.com/package/@usefy/use-focus-trap" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-focus-trap.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-focus-within" target="_blank" rel="noopener noreferrer">@usefy/use-focus-within</a> | Track whether keyboard focus is anywhere within a subtree — reactive `:focus-within` with `onFocus`/`onBlur` edges | <a href="https://www.npmjs.com/package/@usefy/use-focus-within" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-focus-within.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![98%](https://img.shields.io/badge/coverage-98%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-long-press" target="_blank" rel="noopener noreferrer">@usefy/use-long-press</a> | Long-press ("press and hold") gestures for mouse and touch — time threshold, movement cancellation, `onStart`/`onFinish`/`onCancel` | <a href="https://www.npmjs.com/package/@usefy/use-long-press" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-long-press.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-async-fn" target="_blank" rel="noopener noreferrer">@usefy/use-async-fn</a> | Run a manual-trigger async function with idle/pending/success/error lifecycle, race-safe stale-response guarding, and unmount safety | <a href="https://www.npmjs.com/package/@usefy/use-async-fn" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-async-fn.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-async" target="_blank" rel="noopener noreferrer">@usefy/use-async</a> | Full async task lifecycle — object-style state, immediate auto-run, and AbortController cancellation | <a href="https://www.npmjs.com/package/@usefy/use-async" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-async.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-polling" target="_blank" rel="noopener noreferrer">@usefy/use-polling</a> | Poll an async function on an interval — non-overlapping ticks, pause/resume, an `enabled` gate, and exponential backoff | <a href="https://www.npmjs.com/package/@usefy/use-polling" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-polling.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![97%](https://img.shields.io/badge/coverage-97%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-raf-state" target="_blank" rel="noopener noreferrer">@usefy/use-raf-state</a> | A drop-in `useState` that batches updates to `requestAnimationFrame` — rapid scroll/resize/pointer/animation updates coalesce to at most one commit per frame | <a href="https://www.npmjs.com/package/@usefy/use-raf-state" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-raf-state.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-object-state" target="_blank" rel="noopener noreferrer">@usefy/use-object-state</a> | Object state with immutable partial updates (patch/merge) and reset | <a href="https://www.npmjs.com/package/@usefy/use-object-state" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-object-state.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-stack" target="_blank" rel="noopener noreferrer">@usefy/use-stack</a> | LIFO stack state with push/pop/peek and immutable updates | <a href="https://www.npmjs.com/package/@usefy/use-stack" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-stack.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-selection" target="_blank" rel="noopener noreferrer">@usefy/use-selection</a> | Multi/single selection state for lists and tables — Set-based, checkbox-ready with indeterminate support | <a href="https://www.npmjs.com/package/@usefy/use-selection" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-selection.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-infinite-scroll" target="_blank" rel="noopener noreferrer">@usefy/use-infinite-scroll</a> | Sentinel-driven infinite loading built on IntersectionObserver — fires `loadMore` once per intersection, respects `hasMore`/`loading`/`enabled` | <a href="https://www.npmjs.com/package/@usefy/use-infinite-scroll" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-infinite-scroll.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-pagination" target="_blank" rel="noopener noreferrer">@usefy/use-pagination</a> | Headless pagination state machine — controlled/uncontrolled current page, derived `pageCount`, a slice-ready 0-based `range`, and an ellipsis-aware `items` pager model | <a href="https://www.npmjs.com/package/@usefy/use-pagination" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-pagination.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-network-state" target="_blank" rel="noopener noreferrer">@usefy/use-network-state</a> | Online/offline status + Network Information API (`effectiveType`, `downlink`, `saveData`), SSR-safe via useSyncExternalStore | <a href="https://www.npmjs.com/package/@usefy/use-network-state" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-network-state.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![95%](https://img.shields.io/badge/coverage-95%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-page-visibility" target="_blank" rel="noopener noreferrer">@usefy/use-page-visibility</a> | Track tab/window visibility (foreground vs. background) via the Page Visibility API, with optional `onChange` and SSR support | <a href="https://www.npmjs.com/package/@usefy/use-page-visibility" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-page-visibility.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![92%](https://img.shields.io/badge/coverage-92%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-idle" target="_blank" rel="noopener noreferrer">@usefy/use-idle</a> | Report user inactivity after a timeout, with throttled activity listeners, visibility awareness, and SSR support | <a href="https://www.npmjs.com/package/@usefy/use-idle" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-idle.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![98%](https://img.shields.io/badge/coverage-98%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-permission" target="_blank" rel="noopener noreferrer">@usefy/use-permission</a> | Read Permissions API status with live updates — `{ state, status, isSupported, error }`, keyed on descriptor contents, SSR-safe, accepts any permission name | <a href="https://www.npmjs.com/package/@usefy/use-permission" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-permission.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-script" target="_blank" rel="noopener noreferrer">@usefy/use-script</a> | Load an external script with `idle/loading/ready/error` status, `<script>` deduplication across components, and ref-counted cleanup — SSR-safe and StrictMode-safe | <a href="https://www.npmjs.com/package/@usefy/use-script" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-script.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![96%](https://img.shields.io/badge/coverage-96%25-brightgreen?style=flat-square) |

---

## Quick Start

### Using the All-in-One Package

```tsx
import {
  useToggle,
  useCounter,
  useDebounce,
  useLocalStorage,
  useCookie,
  useCopyToClipboard,
  useEventListener,
  useOnClickOutside,
  useIntersectionObserver,
  useHover,
  useKeyPress,
  useMap,
  useSet,
  useList,
  useQueue,
  useHistoryState,
  useStep,
  useWindowSize,
  useNetworkState,
  usePageVisibility,
  useIdle,
  usePermission,
  useScript,
  useSignal,
  useUnmount,
  useInit,
  useIsClient,
  useIsomorphicLayoutEffect,
  usePrevious,
  useLatest,
  useEventCallback,
  useUpdateEffect,
  useMount,
  useIsFirstRender,
  useMediaQuery,
  usePreferredColorScheme,
  useReducedMotion,
  useDarkMode,
  useDocumentTitle,
  useControllableState,
  useMergedRefs,
  useDisclosure,
  useMeasure,
  useMutationObserver,
  useScrollPosition,
  useScrollLock,
  useHotkeys,
  useFocusTrap,
  useFocusWithin,
  useLongPress,
  useAsyncFn,
  useAsync,
  usePolling,
  useRafState,
  useObjectState,
  useStack,
  useSelection,
  useInfiniteScroll,
  usePagination,
} from "@usefy/hooks";

function App() {
  // Boolean state management
  const { value: isOpen, toggle, setFalse: close } = useToggle(false);

  // Counter with controls
  const { count, increment, decrement, reset } = useCounter(0);

  // Debounced search
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  // Persistent theme preference
  const [theme, setTheme] = useLocalStorage("theme", "light");

  // Copy functionality
  const [copiedText, copy] = useCopyToClipboard();

  // Lazy loading image
  const { ref: imageRef, inView } = useIntersectionObserver({
    triggerOnce: true,
    rootMargin: "50px",
  });

  return (
    <div data-theme={theme}>
      {/* Modal */}
      <button onClick={toggle}>Open Modal</button>
      {isOpen && (
        <div className="modal">
          <button onClick={close}>Close</button>
        </div>
      )}

      {/* Counter */}
      <div>
        <button onClick={decrement}>-</button>
        <span>{count}</span>
        <button onClick={increment}>+</button>
      </div>

      {/* Search */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />

      {/* Theme Toggle */}
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle Theme
      </button>

      {/* Copy */}
      <button onClick={() => copy("Hello World!")}>
        {copiedText ? "Copied!" : "Copy"}
      </button>

      {/* Lazy Loading */}
      <div ref={imageRef}>
        {inView && <img src="large-image.jpg" alt="Lazy loaded" />}
      </div>
    </div>
  );
}
```

### Using Individual Packages

```tsx
import { useToggle } from "@usefy/use-toggle";
import { useDebounce } from "@usefy/use-debounce";

function SearchModal() {
  const { value: isOpen, toggle } = useToggle(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <>
      <button onClick={toggle}>Search</button>
      {isOpen && (
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      )}
    </>
  );
}
```

---

## Features

### 🔄 State Management

<details>
<summary><strong>useToggle</strong> — Boolean state with utility functions</summary>

```tsx
const { value, toggle, setTrue, setFalse, setValue } = useToggle(false);
```

Perfect for modals, dropdowns, accordions, and switches.

</details>

<details>
<summary><strong>useCounter</strong> — Counter state with controls</summary>

```tsx
const { count, increment, decrement, reset } = useCounter(0);
```

Ideal for quantity selectors, pagination, and score tracking.

</details>

<details>
<summary><strong>useMap</strong> — Map state with immutable updates</summary>

```tsx
import { useMap } from "@usefy/use-map";

const [users, { set, setAll, remove, reset, clear, get }] = useMap<string, User>([
  ["1", { id: "1", name: "Alice" }],
]);

set("2", { id: "2", name: "Bob" }); // add / overwrite
remove("1");                          // delete a key
setAll(entries);                      // replace everything
reset();                              // back to initial
```

Immutable updates (new `Map` on every change), a `ReadonlyMap` return type, stable action identities, lazy initialization, and no-op skipping. Perfect for keyed collections, caches, form field maps, and feature flags.

</details>

<details>
<summary><strong>useSet</strong> — Set state with immutable updates</summary>

```tsx
import { useSet } from "@usefy/use-set";

const [selected, { add, remove, toggle, has, clear, reset }] = useSet<string>(["1"]);

toggle("2");           // flip membership
toggle("3", true);     // force add (like DOMTokenList.toggle)
has("1");              // membership check
remove("1");           // delete
```

Immutable updates (new `Set` on every change), a `ReadonlySet` return type, `toggle` with an optional force argument, stable action identities, lazy initialization, and no-op skipping. Perfect for multi-select, tag filters, and tracking selected ids.

</details>

<details>
<summary><strong>useList</strong> — Array state with immutable updates</summary>

```tsx
import { useList } from "@usefy/use-list";

const [todos, { push, removeAt, updateAt, sort, filter, reset }] = useList<Todo>([]);

push({ id: 1, text: "Hi", completed: false }); // append
updateAt(0, { ...todos[0], completed: true }); // replace at index
removeAt(0);                                    // delete at index
sort((a, b) => a.id - b.id);                    // immutable sort
```

Immutable updates (new array on every change), a `readonly T[]` return type, a rich action set (`set`/`push`/`filter`/`sort`/`clear`/`removeAt`/`insertAt`/`updateAt`/`reset`), `set` with an updater function, stable action identities, lazy init, and no-op skipping. Perfect for todo lists, editable tables, and ordered collections.

</details>

<details>
<summary><strong>useQueue</strong> — FIFO queue state with immutable updates</summary>

```tsx
import { useQueue } from "@usefy/use-queue";

const [queue, { add, remove, peek, clear, reset }] = useQueue<Task>([]);

add(task);              // enqueue to the back (variadic: add(a, b, c))
const next = remove();  // dequeue the front and return it (undefined if empty)
peek();                 // read the front without mutating
```

FIFO semantics (`add` to the back, `remove`/`peek` from the front), immutable updates (new array on every change), a `readonly T[]` return type, `remove` that returns the dequeued item, stable action identities, lazy init, and no-op skipping. Read `first`/`last`/`size` directly from the queue (`queue[0]`, `queue[queue.length - 1]`, `queue.length`). Perfect for task runners, print/job queues, message buffers, and breadth-first traversals.

</details>

<details>
<summary><strong>useHistoryState</strong> — Undo/redo state history with time-travel</summary>

```tsx
import { useHistoryState } from "@usefy/use-history-state";

const { state, set, undo, redo, canUndo, canRedo, goTo, history } =
  useHistoryState(initialCanvas, { limit: 50 });

set((s) => ({ ...s, dirty: true })); // record a new entry (value or updater)
undo();                               // step back
redo();                               // step forward
goTo(0);                              // jump to any point on the timeline
```

Undo/redo/`goTo` time travel over an immutable timeline, `set` with value-or-updater (like `useState`), `canUndo`/`canRedo` flags, the full `history` array + `currentIndex`, an optional `limit` to bound memory, `clear`/`reset`, stable control identities (safe as effect deps), and no-op skipping. Perfect for editors, drawing/design canvases, form builders, and any `Ctrl/Cmd+Z` experience.

</details>

<details>
<summary><strong>useStep</strong> — Multi-step navigation for wizards, forms, and carousels</summary>

```tsx
import { useStep } from "@usefy/use-step";

const [step, { goToNextStep, goToPrevStep, canGoToNextStep, canGoToPrevStep, setStep, reset }] =
  useStep(4); // steps 0..3

goToNextStep();     // advance (no-op on the last step)
setStep(2);         // jump to a step (value or updater, clamped)
setStep((s) => s + 1);
```

0-based indexing with automatic range validation, `goToNextStep`/`goToPrevStep` plus ready-made `canGoToNextStep`/`canGoToPrevStep` flags for disabling buttons, `setStep` (value or updater), `reset`, stable control identities (safe as effect deps), resilience to a changing step `count`, and no-op skipping at the edges. Perfect for multi-step forms, wizards, onboarding flows, and carousels.

</details>

<details>
<summary><strong>useObjectState</strong> — Object state with immutable partial updates (patch/merge) and reset</summary>

```tsx
import { useObjectState } from "@usefy/use-object-state";

const [form, patch, reset] = useObjectState({
  name: "",
  email: "",
  subscribe: false,
});

patch({ name: "Alice" });                     // shallow-merge a partial (immutably)
patch((prev) => ({ subscribe: !prev.subscribe })); // functional updater form
reset();                                       // back to the initial object
reset({ name: "Bob", email: "", subscribe: true }); // reset to a provided object
```

A `useState`-style `[state, patch, reset]` tuple that sits between `useState` (replace the whole value) and `useReducer` (write a reducer). `patch` shallow-merges a `Partial<T>` immutably (`{ ...prev, ...partial }`) — update one field without spreading the whole object — or takes a functional updater; untouched keys are preserved by reference. `reset()` restores the captured initial value (lazy init is cached once), or `reset(next)` swaps in a provided object. `patch`/`reset` are referentially stable (safe as effect deps), and it's SSR- & StrictMode-safe. Shallow merge only — nested objects are replaced, not deep-merged; for array state use `useList`. Perfect for form state, settings panels, and filter/query objects.

</details>

<details>
<summary><strong>useStack</strong> — LIFO stack state with immutable updates</summary>

```tsx
import { useStack } from "@usefy/use-stack";

const [stack, { push, pop, peek, clear, reset }] = useStack<Snapshot>([]);

push(snapshot);       // push onto the top (variadic: push(a, b, c))
const last = pop();   // pop the top and return it (undefined if empty)
peek();               // read the top without mutating
```

The LIFO sibling of `useQueue` — identical shape, but `push` and `pop` operate on the **same** end (the top). LIFO semantics, immutable updates (new array on every change), a `readonly T[]` return type, `pop` that returns the popped item, stable action identities, lazy init, and no-op skipping. Read `top`/`bottom`/`size` directly from the stack (`stack[stack.length - 1]`, `stack[0]`, `stack.length`). Perfect for undo history, navigation/back stacks, expression evaluation, and depth-first traversals.

</details>

<details>
<summary><strong>useSelection</strong> — Multi/single selection state for lists and tables</summary>

```tsx
import { useSelection } from "@usefy/use-selection";

const {
  selected,             // selected items (derived from the current `items`)
  isSelected,           // isSelected(item) → boolean
  toggle,               // toggle(item)
  selectAll,            // select every item (no-op in single-select mode)
  clear,                // deselect all
  isAllSelected,        // every item selected (false for an empty list)
  isPartiallySelected,  // some-but-not-all → drive a header checkbox's indeterminate
} = useSelection(users, { getKey: (u) => u.id });
```

Set-backed selection for checkbox lists and data tables. The backing `Set` stores **keys** (via `getKey`, default identity for primitives), so a selection survives new object identities across renders — rebuild `items` every render and the selection sticks. Item-facing values (`selected`, `isAllSelected`, …) are **derived from the current `items`**, so removing a row makes it drop out automatically. Ships `toggle`/`select`/`deselect`/`selectAll`/`clear`, the `isAllSelected`/`isPartiallySelected`/`isNoneSelected` flags for an indeterminate header checkbox, and a single-selection mode (`multiple: false`) that replaces the selection. Immutable Set updates, stable action identities, no-op skipping, and SSR/StrictMode safe.

</details>

### ⏱️ Timing Utilities

<details>
<summary><strong>useDebounce</strong> — Debounce value updates</summary>

```tsx
const debouncedValue = useDebounce(value, 300, {
  leading: false,
  trailing: true,
  maxWait: 1000,
});
```

Best for search inputs, form validation, and API calls.

</details>

<details>
<summary><strong>useDebounceCallback</strong> — Debounce function calls</summary>

```tsx
const debouncedFn = useDebounceCallback(callback, 300);

debouncedFn(args); // Call debounced
debouncedFn.cancel(); // Cancel pending
debouncedFn.flush(); // Execute immediately
debouncedFn.pending(); // Check if pending
```

</details>

<details>
<summary><strong>useThrottle</strong> — Throttle value updates</summary>

```tsx
const throttledValue = useThrottle(value, 100, {
  leading: true,
  trailing: true,
});
```

Perfect for scroll events, resize handlers, and mouse tracking.

</details>

<details>
<summary><strong>useThrottleCallback</strong> — Throttle function calls</summary>

```tsx
const throttledFn = useThrottleCallback(callback, 100);
```

</details>

<details>
<summary><strong>useTimer</strong> — Countdown timer with accurate timing</summary>

```tsx
import { useTimer, ms } from "@usefy/use-timer";

const timer = useTimer(ms.minutes(5), {
  format: "MM:SS",
  autoStart: false,
  loop: false,
  onComplete: () => console.log("Time's up!"),
});

// Controls
timer.start();
timer.pause();
timer.reset();
timer.addTime(ms.seconds(10));
timer.subtractTime(ms.seconds(5));

// State
timer.time; // "05:00"
timer.progress; // 0-100
timer.isRunning; // boolean
```

Perfect for countdown timers, Pomodoro apps, kitchen timers, and time-based UIs with smart render optimization.

</details>

### 💾 Storage

<details>
<summary><strong>useLocalStorage</strong> — Persistent storage with sync</summary>

```tsx
const [value, setValue, removeValue] = useLocalStorage("key", initialValue, {
  serializer: JSON.stringify,
  deserializer: JSON.parse,
  syncTabs: true,
  onError: (error) => console.error(error),
});
```

Supports cross-tab synchronization and custom serialization.

</details>

<details>
<summary><strong>useSessionStorage</strong> — Session-scoped storage</summary>

```tsx
const [value, setValue, removeValue] = useSessionStorage("key", initialValue);
```

Data persists during tab lifetime, isolated per tab.

</details>

<details>
<summary><strong>useCookie</strong> — Browser cookie as React state</summary>

```tsx
const [value, setValue, remove] = useCookie("theme", {
  initialValue: "light",
  maxAge: 60 * 60 * 24 * 7, // one week
  sameSite: "strict",
});
```

Reads/writes `document.cookie` with a `useState`-like tuple. SSR-aware, JSON (de)serialization with a raw-string fallback, and full cookie attributes (`expires`/`maxAge`/`path`/`domain`/`secure`/`sameSite`). Same-document instances sync; cross-tab writes need polling (no `storage` event for cookies).

</details>

### 📡 Communication

<details>
<summary><strong>useSignal</strong> — Event-driven communication between components</summary>

```tsx
import { useSignal } from "@usefy/use-signal";

// Emitter component
function RefreshButton() {
  const { emit, info } = useSignal("dashboard-refresh");
  
  return (
    <button onClick={() => emit()}>
      Refresh All ({info.subscriberCount} widgets)
    </button>
  );
}

// Subscriber component
function DataWidget() {
  const { signal } = useSignal("dashboard-refresh");
  
  useEffect(() => {
    fetchData(); // Refetch when signal changes
  }, [signal]);
  
  return <div>Widget Content</div>;
}

// With typed data payload
interface NotificationData {
  type: "success" | "error";
  message: string;
}

function NotificationEmitter() {
  const { emit } = useSignal<NotificationData>("notification");
  
  return (
    <button onClick={() => emit({ type: "success", message: "Done!" })}>
      Notify
    </button>
  );
}

function NotificationReceiver() {
  const { signal, info } = useSignal<NotificationData>("notification");
  
  useEffect(() => {
    if (signal > 0 && info.data) {
      toast[info.data.type](info.data.message);
    }
  }, [signal]);
  
  return null;
}
```

**Perfect for:** Dashboard refresh, form reset, cache invalidation, multi-step flows, and event broadcasting.

> ⚠️ **Note:** `useSignal` is NOT a global state management solution. It's designed for lightweight event-driven communication. For complex state management, use Context, Zustand, Jotai, or Recoil.

</details>

### 🖱️ Events

<details>
<summary><strong>useEventListener</strong> — DOM event listener with auto cleanup</summary>

```tsx
// Window resize event (default target)
useEventListener("resize", (e) => {
  console.log("Window resized:", window.innerWidth);
});

// Document keydown event
useEventListener(
  "keydown",
  (e) => {
    if (e.key === "Escape") closeModal();
  },
  document
);

// Element with ref
const buttonRef = useRef<HTMLButtonElement>(null);
useEventListener("click", handleClick, buttonRef);

// With options
useEventListener("scroll", handleScroll, window, {
  passive: true,
  capture: false,
  enabled: isTracking,
});
```

Supports window, document, HTMLElement, and RefObject targets with full TypeScript type inference.

</details>

<details>
<summary><strong>useOnClickOutside</strong> — Outside click detection</summary>

```tsx
// Basic usage - close modal on outside click
const modalRef = useRef<HTMLDivElement>(null);
useOnClickOutside(modalRef, () => onClose(), { enabled: isOpen });

// Multiple refs - button and dropdown menu
const buttonRef = useRef<HTMLButtonElement>(null);
const menuRef = useRef<HTMLDivElement>(null);
useOnClickOutside([buttonRef, menuRef], () => setIsOpen(false), {
  enabled: isOpen,
});

// With exclude refs
useOnClickOutside(modalRef, onClose, {
  excludeRefs: [toastRef], // Clicks on toast won't close modal
});
```

Perfect for modals, dropdowns, popovers, tooltips, and context menus with mouse + touch support.

</details>

<details>
<summary><strong>useClickAnyWhere</strong> — Global click detection</summary>

```tsx
useClickAnyWhere(
  (event) => {
    if (!ref.current?.contains(event.target)) {
      closeMenu();
    }
  },
  { enabled: isOpen }
);
```

Ideal for closing dropdowns, modals, and context menus.

</details>

<details>
<summary><strong>useCopyToClipboard</strong> — Clipboard operations</summary>

```tsx
const [copiedText, copy] = useCopyToClipboard({
  timeout: 2000,
  onSuccess: (text) => toast.success("Copied!"),
  onError: (error) => toast.error("Failed to copy"),
});

const success = await copy("text to copy");
```

Modern Clipboard API with automatic fallback for older browsers.

</details>

### ⌨️ Keyboard

<details>
<summary><strong>useKeyPress</strong> — Keyboard key, shortcut, and combination detection</summary>

```tsx
import { useKeyPress } from "@usefy/use-key-press";

// Single key — true while held
const escapePressed = useKeyPress("Escape");

// Combination (mod = Ctrl on Win/Linux, Cmd on macOS)
useKeyPress("mod+k", {
  preventDefault: true,
  onPress: () => openCommandPalette(),
});

// Alternative bindings — array is OR
useKeyPress(["ctrl+s", "meta+s"], {
  preventDefault: true,
  onPress: () => save(),
});

// Physical keys for game controls (layout-independent)
const forward = useKeyPress("w", { matchBy: "code" });

// Custom predicate
const digitPressed = useKeyPress((e) => /^[0-9]$/.test(e.key));

// Ignore shortcuts while typing in inputs
useKeyPress("f", { ignoreInputElements: true, onPress: openFilter });
```

Perfect for command palettes, editor shortcuts, modal dismissal, and game controls — with cross-platform `mod`, `onPress`/`onRelease` callbacks, auto-repeat handling, and blur-safe held state.

</details>

<details>
<summary><strong>useHotkeys</strong> — High-level keyboard shortcuts with combos, sequences, and an input-field guard</summary>

```tsx
import { useHotkeys } from "@usefy/use-hotkeys";

// Command palette (mod = Ctrl on Win/Linux, Cmd on macOS)
useHotkeys("mod+k", () => openCommandPalette(), { preventDefault: true });

// Multiple bindings for one handler (array is OR)
useHotkeys(["mod+s", "ctrl+enter"], save, { preventDefault: true });

// A Gmail-style sequence: press "g" then "i"
useHotkeys("g i", () => navigate("/inbox"));

// Scoped to an element, allowed inside inputs, only while enabled
const ref = useRef<HTMLDivElement>(null);
useHotkeys("Escape", close, { target: ref, enableOnFormTags: true, enabled: isOpen });
```

The high-level shortcut layer over the keyboard: combos (`"ctrl+shift+p"`, `"shift+?"`), space-separated **sequences** (`"g i"`, `"g g"`) with a configurable reset timeout, arrays of bindings on one handler, a cross-platform `mod` alias (overridable for tests), **exact** modifier matching (`"a"` never fires on `Ctrl+A`), and an input-field guard that ignores editable targets by default. Bind to `document`/`window`/an element/a ref. The handler is stored in a ref (no memoization needed), and it's SSR-safe and StrictMode-safe with full timer/listener cleanup.

</details>

### 📍 Location

<details>
<summary><strong>useGeolocation</strong> — Device geolocation with real-time tracking and distance calculation</summary>

```tsx
import { useGeolocation } from "@usefy/use-geolocation";

// Basic usage - get current position
const { position, loading, error } = useGeolocation();

// Real-time tracking
const { position, watchPosition, clearWatch } = useGeolocation({
  immediate: false,
  watch: false,
  onPositionChange: (pos) => console.log("Position updated:", pos),
});

// Distance calculation
const { position, distanceFrom, bearingTo } = useGeolocation();

// Calculate distance to New York (in meters)
const distance = distanceFrom(40.7128, -74.006);

// Calculate bearing/direction to London (0-360 degrees)
const bearing = bearingTo(51.5074, -0.1278);

// High accuracy mode
const { position } = useGeolocation({
  enableHighAccuracy: true,
  timeout: 10000,
});

// Permission tracking
const { permission } = useGeolocation({
  onPermissionChange: (state) => {
    console.log("Permission:", state); // "prompt" | "granted" | "denied" | "unavailable"
  },
});
```

Perfect for location-based apps, maps, navigation, distance tracking, and geofencing with built-in Haversine distance calculation and bearing utilities.

</details>

### 👁️ Visibility

<details>
<summary><strong>useIntersectionObserver</strong> — Efficient element visibility detection with Intersection Observer API</summary>

```tsx
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

// Basic usage - detect when element enters viewport
const { ref, inView, entry } = useIntersectionObserver();

// Lazy loading images
const { ref, inView } = useIntersectionObserver({
  triggerOnce: true, // Stop observing after first detection
  threshold: 0.1, // Trigger when 10% visible
  rootMargin: "50px", // Start loading 50px before entering viewport
});

// Infinite scroll with sentinel element
const { ref, inView } = useIntersectionObserver({
  threshold: 1.0,
  rootMargin: "100px", // Preload 100px ahead
});

useEffect(() => {
  if (inView) loadMoreItems();
}, [inView]);

// Scroll animations
const { ref, inView } = useIntersectionObserver({
  triggerOnce: true,
  threshold: 0.3,
});

// Progress tracking with multiple thresholds
const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
const { ref, entry } = useIntersectionObserver({
  threshold: thresholds,
  onChange: (entry) => {
    setProgress(Math.round(entry.intersectionRatio * 100));
  },
});

// Custom scroll container
const containerRef = useRef<HTMLDivElement>(null);
const { ref, inView } = useIntersectionObserver({
  root: containerRef.current,
  rootMargin: "0px",
});

// Delayed observation
const { ref, inView } = useIntersectionObserver({
  delay: 500, // Wait 500ms before creating observer
});
```

Perfect for lazy loading, infinite scroll, scroll animations, progress tracking, and any visibility-based interactions with smart re-render optimization.

</details>

<details>
<summary><strong>useHover</strong> — Element hover detection with delay support</summary>

```tsx
import { useHover } from "@usefy/use-hover";

// Basic usage
const { ref, isHovered } = useHover<HTMLDivElement>();

// Tuple destructuring
const [ref, isHovered] = useHover<HTMLDivElement>();

// Tooltip pattern with delays
const { ref, isHovered } = useHover<HTMLButtonElement>({
  delay: { enter: 500, leave: 100 }, // Show after 500ms, hide after 100ms
});

// Dropdown menu pattern
const { ref, isHovered } = useHover<HTMLDivElement>({
  delay: { leave: 300 }, // Keep open for 300ms after mouse leaves
});

// With onChange callback
const { ref, isHovered } = useHover<HTMLDivElement>({
  onChange: (hovered, event) => {
    if (hovered) analytics.track("element_hovered");
  },
});

// Touch support for mobile devices
const { ref, isHovered } = useHover<HTMLButtonElement>({
  detectTouch: true,
  delay: { leave: 1500 },
});

// Conditional enabling
const [enabled, setEnabled] = useState(true);
const { ref, isHovered } = useHover<HTMLDivElement>({ enabled });
```

Perfect for tooltips, dropdowns, interactive cards, and any hover-based interactions with configurable delays and touch support.

</details>

<details>
<summary><strong>useWindowSize</strong> — Window size tracking with debounce/throttle and SSR support</summary>

```tsx
import { useWindowSize } from "@usefy/use-window-size";

// Basic usage — live width/height
const { width, height } = useWindowSize();

// Responsive breakpoints
const { width } = useWindowSize();
if (width < 768) return <MobileView />;

// Debounced updates (great for expensive layout work)
const size = useWindowSize({ debounceMs: 200 });

// Throttled updates with a change callback
const { width } = useWindowSize({
  throttleMs: 100,
  onChange: ({ width }) => {
    if (width < 768) closeSidebar();
  },
});

// SSR-safe with initial values to avoid hydration mismatches
const { width, height } = useWindowSize({
  initialWidth: 1024,
  initialHeight: 768,
});

// Exclude the scrollbar (documentElement client sizes)
const inner = useWindowSize({ includeScrollbar: false });
```

Real-time width/height with debounce/throttle, SSR-safe initial values, no-op re-render skipping, and scrollbar control. Perfect for responsive layouts, charts, and viewport-driven UI.

</details>

<details>
<summary><strong>useNetworkState</strong> — Online/offline + Network Information API (effectiveType, downlink, saveData)</summary>

```tsx
import { useNetworkState } from "@usefy/use-network-state";

// Online/offline banner
const { online } = useNetworkState();
if (!online) return <div role="alert">You are offline.</div>;

// Adapt to connection quality
const { effectiveType, saveData } = useNetworkState();
const lowData = saveData || effectiveType === "slow-2g" || effectiveType === "2g";
return lowData ? <LowResImage /> : <HighResImage />;

// Full snapshot
const { online, since, downlink, rtt, type } = useNetworkState();
```

Combines `navigator.onLine` (window `online`/`offline` events) with the Network Information API (`navigator.connection` `change` event, plus `mozConnection`/`webkitConnection` fallbacks). Built on `useSyncExternalStore` for tear-free, SSR-safe reads (`{ online: true }` on the server). Every Network Information field degrades to `undefined` on browsers without the API (Firefox, Safari) — `online` always works.

</details>

<details>
<summary><strong>usePageVisibility</strong> — Tab/window visibility (foreground vs. background) via the Page Visibility API</summary>

```tsx
import { usePageVisibility } from "@usefy/use-page-visibility";

// Boolean-first: true when the tab is in the foreground
const visible = usePageVisibility();

// Pause work while hidden
useEffect(() => {
  if (!visible) return; // don't poll in the background
  const id = setInterval(fetchUpdates, 5000);
  return () => clearInterval(id);
}, [visible]);

// React to transitions with an onChange callback
usePageVisibility((visible) => {
  if (visible) video.play();
  else video.pause();
});
```

Reports whether the page is visible through the document `visibilitychange` event. Built on `useSyncExternalStore` for tear-free, SSR-safe reads (returns `true` on the server, no hydration mismatch). The optional `onChange` callback fires on each transition and is read through a ref, so replacing it never re-subscribes the listener. The listener is cleaned up on unmount.

</details>

<details>
<summary><strong>useIdle</strong> — Report user inactivity after a timeout, with throttled activity listeners</summary>

```tsx
import { useIdle } from "@usefy/use-idle";

// Boolean-first: true once the user has been inactive for the timeout
const idle = useIdle(60_000); // one minute

// Log the user out after 5 minutes of inactivity
const idle = useIdle(5 * 60_000);
useEffect(() => {
  if (idle) logout();
}, [idle]);

// Only listen to keyboard activity, start in the idle state
const idle = useIdle(30_000, {
  events: ["keydown"],
  initialState: true,
});
```

Returns `false` while the user is active and flips to `true` once no listened activity (mouse, keyboard, touch, wheel, resize, tab focus) has occurred for `timeout` ms; the next activity flips it back. Activity is throttled to a leading-edge timer reset at most once every ~200ms, so high-frequency events (`mousemove`, `wheel`, `resize`) never thrash React state. `visibilitychange` is handled specially: returning to a backgrounded tab counts as activity, while backgrounding does not reset the timer (the user is allowed to fall idle) — the `react-use`/`@mantine/hooks` convention. SSR-safe (no listeners on the server, returns `initialState` inertly) and leak-free (every listener + timer is cleaned up on unmount or when `timeout`/`events`/`element` change).

</details>

<details>
<summary><strong>usePermission</strong> — Permissions API status with live updates</summary>

```tsx
import { usePermission } from "@usefy/use-permission";

// Destructure the field you need
const { state } = usePermission({ name: "camera" });
// state: 'granted' | 'denied' | 'prompt' | null

// Full surface: cover the async + unsupported/error edges
const { state, status, isSupported, error } = usePermission({
  name: "geolocation",
});
// status: 'idle' | 'pending' | 'granted' | 'denied' | 'prompt' | 'unsupported' | 'error'

// Descriptors with extra fields typecheck too
usePermission({ name: "push", userVisibleOnly: true });
usePermission({ name: "midi", sysex: true });
```

Calls `navigator.permissions.query(descriptor)` and subscribes to the returned `PermissionStatus`'s `change` event, so `state` updates live when the user grants or revokes the permission — no polling, no re-mount. Returns a rich object rather than a bare `PermissionState` so the async and unavailable paths are explicit: `isSupported` is `false` during SSR and in browsers without the Permissions API (`status: 'unsupported'`), and a rejected query (some browsers throw for unknown names) surfaces as `status: 'error'` with the `error`. The effect is keyed on the descriptor's **serialized contents**, not its object identity, so an inline `usePermission({ name: 'camera' })` literal does not re-query on every render — no caller-side `useMemo` needed. SSR-safe and StrictMode/concurrent-safe: the async query is race-guarded (stale resolutions after unmount are ignored) and the change listener is removed on cleanup.

</details>

<details>
<summary><strong>useScript</strong> — Load an external script with idle/loading/ready/error status and tag deduplication</summary>

```tsx
import { useScript } from "@usefy/use-script";

// Bare status string — `const status = useScript(src)` reads true.
const status = useScript("https://js.stripe.com/v3");
// 'idle' | 'loading' | 'ready' | 'error'

// Conditional loading — null/undefined src stays idle and injects nothing.
const status = useScript(consented ? "https://cdn.example.com/analytics.js" : null);

// Options: attributes on the created tag + ref-counted removal on unmount.
const status = useScript("https://maps.googleapis.com/maps/api/js", {
  attributes: { id: "gmaps", async: "" },
  removeOnUnmount: true,
});
```

All state lives in a **module-level registry keyed by `src`**, so multiple components calling `useScript(sameSrc)` share **one** `<script>` tag and one status — the first to mount injects it (or adopts a matching tag already in the DOM), and every subscriber re-renders together when it fires `load`/`error`. Pass `null`/`undefined` (or `shouldPreventLoad`) to stay `idle` for conditional loading. Cleanup is ref-counted: with `removeOnUnmount`, the DOM node is removed only when the last subscriber unmounts (removing a script does not un-run its side effects — documented caveat). Built on `useSyncExternalStore`: returns `idle` deterministically on the server (never touches `document`), and a StrictMode double-mount converges to a single tag with no leaked listeners. `getScriptStatus(src)` reads the shared status imperatively.

</details>

<details>
<summary><strong>useMeasure</strong> — Reactive element bounds (size + viewport position) via ResizeObserver</summary>

```tsx
import { useMeasure } from "@usefy/use-measure";

// Live size + viewport-relative position
const [ref, bounds] = useMeasure<HTMLDivElement>();
return <div ref={ref}>{bounds.width} × {bounds.height}</div>;

// Full bounds surface
const { x, y, width, height, top, right, bottom, left } = bounds;

// Userland container queries — layout keyed off the element's own width
const isCompact = bounds.width > 0 && bounds.width < 400;
```

The ergonomic "just give me the bounds" convenience layer over `useResizeObserver`: it reuses that hook as the low-level observer and returns the full `getBoundingClientRect()` rect. Reach for `useResizeObserver` when you need box models, debounce/throttle, or callbacks; reach for `useMeasure` when you just want the current position + size. SSR-safe and StrictMode-safe.

</details>

<details>
<summary><strong>useMutationObserver</strong> — Watch an element for DOM mutations via MutationObserver</summary>

```tsx
import { useMutationObserver } from "@usefy/use-mutation-observer";

// childList + subtree, react via callback or the reactive `records` state
const { ref, records } = useMutationObserver<HTMLDivElement>({
  childList: true,
  subtree: true,
  onMutation: (mutations) => console.log(mutations),
});
return <div ref={ref}>{records.length} recent mutations</div>;

// Watch a single attribute (with its old value), zero re-renders
const { ref: boxRef } = useMutationObserver({
  attributeFilter: ["class"],
  attributeOldValue: true,
  updateState: false,
  onMutation: (m) => console.log(m[0]?.attributeName, m[0]?.oldValue),
});

// Pause observation, or drive it manually
const { ref: r, observe, disconnect, takeRecords } = useMutationObserver({
  enabled: false,
});
```

The low-level observer primitive — a sibling to `useResizeObserver` and `useIntersectionObserver` — with the same callback-`ref` / `enabled` / `onXxx` / `updateState` conventions. Defaults to `childList: true` so `observe()` never throws, stores `onMutation` in a ref so it never re-registers, and is SSR-safe and StrictMode-safe.

</details>

<details>
<summary><strong>useScrollPosition</strong> — Throttled scroll offset (x, y) of the window or an element</summary>

```tsx
import { useScrollPosition } from "@usefy/use-scroll-position";

// Track the window/document scroll (throttled to 100ms by default)
const { x, y } = useScrollPosition();
return <div>Scrolled to {x}, {y}</div>;

// Track a scrollable element via a ref, updating on every frame
const ref = useRef<HTMLDivElement>(null);
const { y: top } = useScrollPosition({ element: ref, throttleMs: 0 });
```

Reads the initial position synchronously on mount, attaches a `{ passive: true }` scroll listener, and throttles with **leading + trailing** edges so the final resting position is never dropped. Accepts a raw element or a ref, is SSR-safe (`{ x: 0, y: 0 }` on the server), and cleans up listeners/timers on unmount and target change.

</details>

<details>
<summary><strong>useScrollLock</strong> — Lock body scroll for modals/drawers (iOS-aware, nested-lock counted)</summary>

```tsx
import { useScrollLock } from "@usefy/use-scroll-lock";

// Imperative — lock while a modal is open
const { lock, unlock, isLocked } = useScrollLock();
useEffect(() => {
  if (open) lock();
  else unlock();
}, [open, lock, unlock]);

// Declarative — let `enabled` own the lock for the drawer's lifetime
useScrollLock({ enabled: open });
```

Sets `overflow: hidden` + scrollbar-width `padding-right` on the body (no layout shift), and on iOS pins the body with `position: fixed` and restores the scroll position on unlock. A shared module-level reference counter means N stacked locks apply the body styles once and restore only on the last release. Per-instance idempotent, StrictMode-safe (unmount always releases), and SSR-safe.

</details>

<details>
<summary><strong>useInfiniteScroll</strong> — Sentinel-driven infinite loading built on IntersectionObserver</summary>

```tsx
import { useInfiniteScroll } from "@usefy/use-infinite-scroll";

const sentinelRef = useInfiniteScroll(loadMore, { hasMore, loading });

return (
  <ul>
    {items.map((item) => (
      <li key={item.id}>{item.title}</li>
    ))}
    {/* Attach the ref to a sentinel at the end of the list. */}
    {hasMore && <li ref={sentinelRef} aria-hidden />}
  </ul>
);
```

Turns "load the next page when the user reaches the bottom" into a one-liner. Attach the returned callback ref to a small sentinel element; when it scrolls into view, `loadMore` fires — **once per intersection**, never while a load is already in flight. Respects `hasMore` (stops observing once exhausted), `loading`, and an `enabled` master switch; supports `rootMargin` for prefetch, a custom scroll-container `root`, and `threshold`. `loadMore` may be sync or async — an internal in-flight guard on top of the `loading` flag prevents overlapping loads. Built on `useIntersectionObserver`, so it is SSR-safe (inert no-op ref on the server) and StrictMode-safe.

</details>

<details>
<summary><strong>usePagination</strong> — Headless pagination state: page count, slice-ready range, and an ellipsis-aware pager model</summary>

```tsx
import { usePagination } from "@usefy/use-pagination";

const { page, pageCount, range, items, setPage, next, prev, canNext, canPrev } =
  usePagination({ total: users.length, pageSize: 10 });

const visible = users.slice(range.start, range.end);

return (
  <nav>
    <button onClick={prev} disabled={!canPrev}>‹</button>
    {items.map((item, i) =>
      item.type === "ellipsis" ? (
        <span key={`gap-${i}`}>…</span>
      ) : (
        <button
          key={item.page}
          aria-current={item.selected ? "page" : undefined}
          onClick={() => setPage(item.page!)}
        >
          {item.page}
        </button>
      )
    )}
    <button onClick={next} disabled={!canNext}>›</button>
  </nav>
);
```

Owns pagination state only — you render the pager however you like. Derives `pageCount` from `total`/`pageSize`, keeps the current page clamped in `[1, pageCount]` (so a shrinking dataset never leaves you on a dangling page), and gives you a slice-ready 0-based `range` (`{ start, end }`, end exclusive) plus the ellipsis-aware `items` model (page numbers + `"ellipsis"` tokens, MUI/Mantine-style) driven by `siblingCount`/`boundaryCount`. Works **controlled** (`page` + `onChange`) or **uncontrolled** (`defaultPage`) via `useControllableState`; controls are identity-stable and skip no-op moves. Pure state and math, so it is fully SSR-safe.

</details>

### 🔄 Lifecycle

<details>
<summary><strong>useUnmount</strong> — Execute callback on component unmount</summary>

```tsx
// Basic usage
useUnmount(() => {
  console.log("Component unmounted");
});

// With latest state access
const [formData, setFormData] = useState({});
useUnmount(() => {
  // Always accesses latest formData value
  saveToLocalStorage(formData);
});

// Conditional cleanup
useUnmount(
  () => {
    sendAnalyticsEvent("component_unmounted");
  },
  { enabled: trackingEnabled }
);
```

Perfect for saving data, sending analytics, and cleaning up resources on component removal.

</details>

<details>
<summary><strong>useInit</strong> — One-time initialization with async support, retry, timeout, and conditional execution</summary>

```tsx
// Basic async initialization
const { isInitialized, isInitializing, error } = useInit(async () => {
  await loadConfiguration();
});

// With retry and timeout
const { error, reinitialize } = useInit(
  async () => {
    await connectToServer();
  },
  {
    retry: 3,
    retryDelay: 1000,
    timeout: 5000,
  }
);

// Conditional initialization
useInit(
  () => {
    initializeFeature();
  },
  { when: isEnabled }
);

// With cleanup function
useInit(() => {
  const subscription = eventBus.subscribe();
  return () => subscription.unsubscribe();
});
```

Perfect for initializing services, loading configuration, setting up subscriptions, and any one-time setup tasks with robust error handling.

</details>

### 🔩 SSR & Render Lifecycle

<details>
<summary><strong>useIsClient</strong> — True once hydrated on the client</summary>

```tsx
const isClient = useIsClient();
return isClient ? <ClientOnlyWidget /> : <ServerFallback />;
```

`false` on the server and first render, `true` after hydration — the canonical guard for client-only UI without hydration mismatches.

</details>

<details>
<summary><strong>useIsomorphicLayoutEffect</strong> — SSR-safe useLayoutEffect</summary>

```tsx
useIsomorphicLayoutEffect(() => {
  setSize(ref.current?.getBoundingClientRect());
}, []);
```

`useLayoutEffect` in the browser, `useEffect` on the server — silences the SSR warning while keeping synchronous layout on the client.

</details>

<details>
<summary><strong>usePrevious</strong> — Value from the previous render</summary>

```tsx
const prev = usePrevious(count);
// ignore new-but-equal values with a comparator
const prevUser = usePrevious(user, (a, b) => a.id === b.id);
```

Tracks the previous distinct value (via ref, no extra render); optional comparator defaults to `Object.is`.

</details>

<details>
<summary><strong>useLatest</strong> — Ref that always holds the latest value</summary>

```tsx
const latest = useLatest(value);
useEffect(() => {
  const id = setInterval(() => console.log(latest.current), 1000);
  return () => clearInterval(id);
}, [latest]);
```

Read fresh props/state inside stable callbacks without stale closures or extra deps. Stable ref identity.

</details>

<details>
<summary><strong>useEventCallback</strong> — Stable callback that sees the latest state</summary>

```tsx
const onClick = useEventCallback(() => console.log(count));
// stable identity, always reads the current count
```

The community `useEffectEvent`: a referentially-stable function that always proxies to the latest closure.

</details>

<details>
<summary><strong>useUpdateEffect</strong> — useEffect that skips the first render</summary>

```tsx
useUpdateEffect(() => {
  search(query); // runs only when query changes, not on mount
}, [query]);
```

Same as `useEffect` but never runs on the initial render — no spurious mount-time call.

</details>

<details>
<summary><strong>useMount</strong> — Run a callback once on mount</summary>

```tsx
useMount(() => {
  analytics.page();
  return () => cleanup();
});
```

A readable alias for `useEffect(fn, [])`; the optional returned function runs on unmount.

</details>

<details>
<summary><strong>useIsFirstRender</strong> — True only on the first render</summary>

```tsx
const isFirst = useIsFirstRender();
if (!isFirst) onValueChange(value);
```

`true` on the first render, `false` on every render thereafter.

</details>

### 🎨 Responsive, Theme & Accessibility

<details>
<summary><strong>useMediaQuery</strong> — Match CSS media queries (matchMedia, SSR-safe)</summary>

```tsx
import { useMediaQuery } from "@usefy/use-media-query";

const isDesktop = useMediaQuery("(min-width: 1024px)");
const isLandscape = useMediaQuery("(orientation: landscape)");

// SSR: keep the first client render matching the server
const isWide = useMediaQuery("(min-width: 1024px)", {
  defaultValue: false,
  initializeWithValue: false,
});
```

Live updates on change, any query (breakpoints, orientation, `prefers-*`), SSR-safe default. The #1 responsive primitive.

</details>

<details>
<summary><strong>usePreferredColorScheme</strong> — System color scheme (prefers-color-scheme)</summary>

```tsx
import { usePreferredColorScheme } from "@usefy/use-preferred-color-scheme";

const scheme = usePreferredColorScheme(); // "light" | "dark"
```

Reflects the OS color-scheme preference and updates live — the system-level primitive under `useDarkMode`.

</details>

<details>
<summary><strong>useReducedMotion</strong> — Reduced-motion preference (a11y)</summary>

```tsx
import { useReducedMotion } from "@usefy/use-reduced-motion";

const reduced = useReducedMotion();
<div style={{ transition: reduced ? "none" : "transform 300ms" }} />;
```

Honor `prefers-reduced-motion` to disable or tone down animations — baseline accessibility.

</details>

<details>
<summary><strong>useDarkMode</strong> — Dark mode with system detection, persistence, and DOM application</summary>

```tsx
import { useDarkMode } from "@usefy/use-dark-mode";

const { mode, isDark, setMode, toggle } = useDarkMode();
// mode: "system" | "light" | "dark"; isDark is the resolved theme

<button onClick={toggle}>{isDark ? "🌙" : "☀️"}</button>;

// Custom attribute instead of the default `dark` class on <html>
useDarkMode({ attribute: "data-theme" });
```

Three modes, `localStorage` persistence, cross-tab sync, and automatic DOM application (class or attribute).

</details>

<details>
<summary><strong>useDocumentTitle</strong> — Set document.title with restore-on-unmount</summary>

```tsx
import { useDocumentTitle } from "@usefy/use-document-title";

useDocumentTitle(`Inbox (${unread})`);
useDocumentTitle("Checkout", { restoreOnUnmount: true });
```

Keeps the tab title in sync with your value; optionally restores the original on unmount. SSR-safe.

</details>

### 🧩 Component Primitives

<details>
<summary><strong>useControllableState</strong> — Controlled/uncontrolled state primitive (Radix/Mantine pattern)</summary>

```tsx
import { useControllableState } from "@usefy/use-controllable-state";

function Switch({ checked, defaultChecked, onCheckedChange }) {
  const [on, setOn] = useControllableState({
    value: checked,
    defaultValue: defaultChecked ?? false,
    onChange: onCheckedChange,
  });

  return (
    <button role="switch" aria-checked={on} onClick={() => setOn((p) => !p)}>
      {on ? "On" : "Off"}
    </button>
  );
}

// Uncontrolled: <Switch defaultChecked />
// Controlled:   <Switch checked={value} onCheckedChange={setValue} />
```

One component, both modes: parent-controlled `value`/`onChange` **or** self-managed from `defaultValue`. `useState` ergonomics (value or updater), stable setter, StrictMode-safe `onChange`.

</details>

<details>
<summary><strong>useMergedRefs</strong> — Merge multiple refs into one (forwardRef helper)</summary>

```tsx
import { forwardRef, useRef } from "react";
import { useMergedRefs } from "@usefy/use-merged-refs";

const Input = forwardRef<HTMLInputElement, InputProps>((props, forwardedRef) => {
  const localRef = useRef<HTMLInputElement>(null);
  const ref = useMergedRefs(localRef, forwardedRef);
  return <input {...props} ref={ref} />;
});
```

Fans a node out to any mix of callback and object refs. Supports React 19 callback-ref cleanups (with a "set null on unmount" fallback), keeps a stable identity, and ships a non-hook `mergeRefs` for use outside render.

</details>

<details>
<summary><strong>useDisclosure</strong> — open/close/toggle state for modals, drawers, popovers</summary>

```tsx
import { useDisclosure } from "@usefy/use-disclosure";

const [opened, { open, close, toggle }] = useDisclosure(false, {
  onOpen: () => trackEvent("drawer_opened"),
  onClose: () => trackEvent("drawer_closed"),
});
```

Returns a `[opened, handlers]` tuple (Mantine shape) with stable `open`/`close`/`toggle` identities. Optional `onOpen`/`onClose` fire only on a real transition; `open()` while open (and `close()` while closed) is a no-op. StrictMode-safe.

</details>

<details>
<summary><strong>useFocusTrap</strong> — Trap keyboard focus inside a subtree (modals/dialogs)</summary>

```tsx
import { useState } from "react";
import { useFocusTrap } from "@usefy/use-focus-trap";

const [open, setOpen] = useState(false);
// Focus is trapped while `open`, moved to the first field on open, and restored
// to the trigger on close. Escape is surfaced so you own the open/close state.
const ref = useFocusTrap<HTMLDivElement>(open, {
  onEscape: () => setOpen(false),
});

return open ? (
  <div ref={ref} role="dialog" aria-modal="true">
    <input placeholder="Name" />
    <button onClick={() => setOpen(false)}>Close</button>
  </div>
) : null;
```

The accessibility primitive behind modals, dialogs, drawers, and popovers. While active, `Tab`/`Shift+Tab` cycle only through the container's focusable elements (recomputed live on every keypress, excluding `disabled`/`hidden`/`inert`/`tabindex="-1"`/invisible), focus moves in on activation (`initialFocus`), and returns to the trigger on close/unmount (`returnFocus`). `onEscape` is surfaced so you own open/close. Does one thing — pair it with `useScrollLock` for a full modal. SSR-safe and StrictMode-safe. Also exports the reusable `getFocusableElements` helper.

</details>

<details>
<summary><strong>useFocusWithin</strong> — Track whether keyboard focus is anywhere within a subtree</summary>

```tsx
import { useFocusWithin } from "@usefy/use-focus-within";

const [ref, focused] = useFocusWithin<HTMLFormElement>();

return (
  <form ref={ref} style={{ outline: focused ? "2px solid dodgerblue" : "none" }}>
    <input placeholder="Name" />
    <input placeholder="Email" />
  </form>
);
```

The reactive, state-driven equivalent of the CSS `:focus-within` pseudo-class. Attach the callback ref to a container and `focused` is `true` whenever the active element is that container or any descendant. Built on the bubbling `focusin`/`focusout` events, it keeps `focused` steady when focus moves *between* descendants (no flicker) and only flips off when focus leaves the subtree — with robust handling of the unreliable `relatedTarget: null` case (a deferred `document.activeElement` re-check). Optional `onFocus`/`onBlur` fire on the subtree's edge transitions only. SSR-safe and StrictMode-safe.

</details>

<details>
<summary><strong>useLongPress</strong> — Long-press ("press and hold") gestures for mouse and touch</summary>

```tsx
import { useLongPress } from "@usefy/use-long-press";

const bind = useLongPress(() => deleteItem(), {
  threshold: 600,
  moveThreshold: 10,
  onCancel: (_event, { reason }) => console.log("cancelled:", reason),
});

return (
  <button {...bind} style={{ touchAction: "none", userSelect: "none" }}>
    Hold to delete
  </button>
);
```

Recognise a press-and-hold gesture on any element, for both mouse and touch, and get back a stable `bind` object of DOM handler props to spread onto the target. The `callback` fires once when the press is held for at least `threshold` ms (default `400`) without being released or dragged past `moveThreshold` px (default `10`; pass `false` to disable). Optional `onStart`/`onFinish`/`onCancel` (with a `{ reason }` of `"released"` | `"moved"`) cover the full lifecycle, all kept in latest-refs so inline callbacks never destabilise the handlers. Synthetic mouse events emitted after a touch are ignored, so a touch long-press never double-fires. The timer is cleared on release/cancel/unmount; SSR-safe and StrictMode-safe. (React's passive touch listeners mean `preventDefault` can't stop scrolling — use CSS `touch-action`/`user-select` instead.)

</details>

### 🌐 Async & Data

<details>
<summary><strong>useAsyncFn</strong> — Run a manual-trigger async function with race-safe lifecycle tracking</summary>

```tsx
import { useAsyncFn } from "@usefy/use-async-fn";

const [state, run] = useAsyncFn(async (id: string) => {
  const res = await fetch(`/api/user/${id}`);
  if (!res.ok) throw new Error("Failed to load user");
  return res.json();
});

return (
  <button onClick={() => run("42")} disabled={state.isLoading}>
    {state.isLoading ? "Loading…" : "Load user"}
  </button>
);
```

The manual-trigger core for running a single async function and tracking its lifecycle — the foundation for building higher-level data hooks. Returns a `[state, run]` tuple where `state` is `{ data, error, status, isLoading }` (`status` is the source of truth: `idle` → `pending` → `success` | `error`; `isLoading` mirrors `pending`). Call `run(...args)` from an event handler; it forwards its arguments to your function. `data` is retained across later runs and only replaced on success; `error` is cleared when a run starts. Built-in **stale-response guarding** means calling `run` again before the previous call settles discards the older result — only the latest call updates state, so out-of-order resolutions never clobber fresh data. `run` is referentially stable, never rejects (it resolves with the value, or `undefined` on failure — errors surface via `state.error`), and reads the latest inline `fn` through a ref so no memoization is needed. Unmount-safe (no state updates or callbacks after unmount), SSR-safe, and StrictMode-safe.

</details>

<details>
<summary><strong>useAsync</strong> — Full async task lifecycle with object-style state, immediate auto-run & AbortController</summary>

```tsx
import { useAsync } from "@usefy/use-async";

const { data, error, isLoading, execute, reset } = useAsync(
  async (signal: AbortSignal, id: string) => {
    const res = await fetch(`/api/user/${id}`, { signal });
    if (!res.ok) throw new Error("Failed to load user");
    return res.json();
  },
  { immediate: true, args: ["42"] }, // auto-load on mount
);

if (isLoading) return <p>Loading…</p>;
if (error) return <button onClick={() => execute("42")}>Retry</button>;
return <button onClick={reset}>Clear {data?.name}</button>;
```

The object-style, abortable sibling of `useAsyncFn`. Returns `{ data, error, status, isLoading, execute, reset }` with the **same state shape** (`status` is the source of truth; `data` retained on error). Your function receives an **`AbortSignal` as its first argument** — wire it into `fetch(url, { signal })` so obsolete requests are truly cancelled. `execute` aborts the previous in-flight request before starting a new one; `reset()` aborts the in-flight request and returns to idle; both are aborted on unmount too. A monotonic call-id **stale-guard** backs up the abort so a superseded call never updates state. **`immediate` auto-runs once on mount by default** (opt out with `immediate: false`; feed args via `options.args`) — it fires from an effect, so it never runs during SSR, and under StrictMode the first run is aborted and the second wins. `execute`/`reset` are referentially stable and `execute` never rejects. Deliberately **not** a query cache — for keys/dedupe/revalidation use TanStack Query.

</details>

<details>
<summary><strong>usePolling</strong> — Poll an async function on an interval with pause/resume, an enabled gate & exponential backoff</summary>

```tsx
import { usePolling } from "@usefy/use-polling";

const { data, status, isPolling, pause, resume } = usePolling(
  async (signal: AbortSignal) => {
    const res = await fetch("/api/status", { signal });
    return res.json();
  },
  { interval: 5000, immediate: true, backoff: { factor: 2, maxInterval: 30_000 } },
);

return (
  <button onClick={isPolling ? pause : resume}>
    {isPolling ? "Pause" : "Resume"} ({status})
  </button>
);
```

Polls `fn` on an interval, exposing the latest result with the **same state shape** as `useAsyncFn`/`useAsync` (`{ data, error, status, isLoading }`; `status` is the source of truth, `data` retained on error) plus polling-loop control: `isPolling` and imperative `pause`/`resume` (with `start`/`stop` aliases). The next tick is scheduled **only after** the current poll settles — a self-rescheduling `setTimeout`, never a stacking `setInterval` — so a slow `fn` can never overlap in-flight requests. `enabled` (default `true`) is the declarative master gate; `pause`/`resume` are the imperative override within it (`isPolling === enabled && !paused`). `immediate` (default `true`) polls right away vs. after one interval. **Exponential backoff** grows the delay on consecutive failures (`true`, `{ factor, maxInterval }`, or a custom `(failures, base) => ms`) and resets on success. Your `fn` receives an **`AbortSignal` first** — the in-flight poll is aborted on pause/stop/`enabled:false`/unmount, backed by a stale-guard. A changed `interval`/`args`/`fn` applies on the next tick without restarting the loop. SSR-safe and StrictMode-safe (exactly one self-scheduling loop — no runaway timers).

</details>

<details>
<summary><strong>useRafState</strong> — A <code>useState</code> replacement that batches updates to <code>requestAnimationFrame</code> (one commit per frame)</summary>

```tsx
import { useEffect } from "react";
import { useRafState } from "@usefy/use-raf-state";

function MouseFollower() {
  const [pos, setPos] = useRafState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [setPos]);

  return <div style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>◍</div>;
}
```

A drop-in replacement for `useState` whose setter **batches** every update to `requestAnimationFrame`, so a burst of rapid `setState` calls (scroll, resize, pointer move, animation loops) coalesces to **at most one commit per frame** — smoother UI and far fewer wasted re-renders. The API matches `useState` exactly: a direct initial value **or** a lazy `() => T` initializer (forwarded to the underlying `useState`, so it runs once), and a setter that accepts a next value **or** a functional updater `(prev) => next`. **Coalescing is last-write-wins**: if the setter is called several times before the frame fires, the earlier frames are cancelled and only the latest call commits — functional updaters follow the same rule (three `setState(n => n+1)` in one frame commit `1`, not `3`; to accumulate within a frame, set an absolute value instead). The setter is referentially **stable** (`useCallback([])`), safe as a child prop or effect dependency. Any pending frame is **cancelled on unmount** (no setState after unmount), it never touches `requestAnimationFrame` at import time (**SSR-safe**, falling back to a synchronous update when rAF is unavailable), and it is **StrictMode / concurrent-safe** (no leaked or double-applied frames).

</details>

---

## Test Coverage

All packages are comprehensively tested using Vitest to ensure reliability and stability.

📊 <a href="https://mirunamu00.github.io/usefy/coverage/" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

> 💡 To generate coverage report locally, run `pnpm test:coverage`. The report will be available at `coverage/index.html`.

---

## Browser Support

| Browser | Version          |
| ------- | ---------------- |
| Chrome  | 66+              |
| Firefox | 63+              |
| Safari  | 13.1+            |
| Edge    | 79+              |
| IE 11   | Fallback support |

---

## Related Links

- 📦 <a href="https://www.npmjs.com/org/usefy" target="_blank" rel="noopener noreferrer">npm Organization</a>
- 🐙 <a href="https://github.com/mirunamu00/usefy" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
- 📝 <a href="https://github.com/mirunamu00/usefy/blob/master/packages/usefy/CHANGELOG.md" target="_blank" rel="noopener noreferrer">Changelog</a>
- 🐛 <a href="https://github.com/mirunamu00/usefy/issues" target="_blank" rel="noopener noreferrer">Issue Tracker</a>

---

## License

MIT © <a href="https://github.com/mirunamu00" target="_blank" rel="noopener noreferrer">mirunamu</a>

---

<p align="center">
  <sub>Built with ❤️ by the usefy team</sub>
</p>

<p align="center">
  <a href="https://github.com/mirunamu00/usefy" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/github/stars/mirunamu00/usefy?style=social" alt="GitHub stars" />
  </a>
</p>

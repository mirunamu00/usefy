<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-page-visibility</h1>

<p align="center">
  <strong>Track whether the browser tab is visible or hidden, via the Page Visibility API.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-page-visibility"><img src="https://img.shields.io/npm/v/@usefy/use-page-visibility.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-page-visibility"><img src="https://img.shields.io/npm/dm/@usefy/use-page-visibility.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-page-visibility"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-page-visibility?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-page-visibility.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usepagevisibility--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`usePageVisibility` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It reports whether the current tab/window is visible to the user through the [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), so you can pause polling, videos, animations, or analytics while the page is in the background.

## Features

- **Boolean-first** — `const visible = usePageVisibility()` returns a plain `boolean` (`true` = foreground, `false` = hidden), matching the natural call site
- **Optional `onChange`** — pass `usePageVisibility((visible) => …)` to run side effects on each transition; the callback is read through a ref, so replacing it never re-subscribes the listener
- **SSR-safe & concurrent-safe** — built on `useSyncExternalStore`; returns a deterministic `true` on the server, so there is no hydration mismatch
- **Leak-free** — the `visibilitychange` listener is registered once and cleaned up on unmount
- **TypeScript-first** — full type inference and exported types (`PageVisibilityState`, `OnVisibilityChange`, `UsePageVisibilityReturn`)
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-page-visibility

# yarn
yarn add @usefy/use-page-visibility

# pnpm
pnpm add @usefy/use-page-visibility
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { usePageVisibility } from "@usefy/use-page-visibility";

function TabStatus() {
  const visible = usePageVisibility();
  return <span>{visible ? "👀 Active" : "💤 Background"}</span>;
}
```

Pause work while the tab is hidden:

```tsx
import { usePageVisibility } from "@usefy/use-page-visibility";
import { useEffect } from "react";

function LiveFeed() {
  const visible = usePageVisibility();
  useEffect(() => {
    if (!visible) return; // don't poll in the background
    const id = setInterval(fetchUpdates, 5000);
    return () => clearInterval(id);
  }, [visible]);
  return <Feed />;
}
```

React to transitions with the `onChange` callback:

```tsx
import { usePageVisibility } from "@usefy/use-page-visibility";

function Player({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  usePageVisibility((visible) => {
    if (visible) videoRef.current?.play();
    else videoRef.current?.pause();
  });
  return <video ref={videoRef} />;
}
```

## API

### `usePageVisibility(onChange?): boolean`

Returns `true` while the page is in the foreground and `false` while it is hidden. The value updates on the document `visibilitychange` event.

| Parameter  | Type                            | Description                                                                                                                              |
| ---------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `onChange` | `(visible: boolean) => void` \| `undefined` | Optional. Fired on every visibility transition with the new boolean value. Never fires on mount. Read through a ref (changing it does not re-subscribe). |

**Returns:** `boolean` — `true` when visible, `false` when hidden. On the server (or any environment without a `document`) it returns `true`.

#### Exported types & helpers

```ts
import {
  usePageVisibility,
  getPageVisibility,          // read a one-off boolean snapshot outside React
  getVisibilityState,         // read the raw "visible" | "hidden" state
  isPageVisibilitySupported,  // feature detection
  SERVER_PAGE_VISIBILITY,     // the inert server value (true)
  type PageVisibilityState,   // "visible" | "hidden"
  type OnVisibilityChange,    // (visible: boolean) => void
  type UsePageVisibilityReturn,
} from "@usefy/use-page-visibility";
```

## Browser Support

The Page Visibility API is supported in every modern browser (Chrome, Edge, Firefox, Safari, and their mobile counterparts). In an environment without a `document` (SSR, tests without a DOM) the hook returns its inert `true` value and never throws.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-page-visibility/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **22 tests**, 92% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

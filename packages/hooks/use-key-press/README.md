<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-key-press</h1>

<p align="center">
  <strong>A powerful React hook for detecting keyboard key presses, shortcuts, and combinations</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-key-press">
    <img src="https://img.shields.io/npm/v/@usefy/use-key-press.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-key-press">
    <img src="https://img.shields.io/npm/dm/@usefy/use-key-press.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-key-press">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-key-press?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-key-press.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usekeypress--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-key-press` is a feature-rich React hook for detecting keyboard input — from a single key to complex modifier combinations. It supports cross-platform shortcuts, alternative bindings, physical-key matching, and callbacks with the raw event, making it ideal for command palettes, editor shortcuts, and game controls.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-key-press?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with comprehensive type definitions
- **Shortcuts & Combinations** — `"Escape"`, `"ctrl+s"`, `"mod+shift+k"` out of the box
- **Alternative Bindings** — Arrays are matched as OR: `["ctrl+s", "meta+s"]`
- **Cross-Platform `mod`** — Resolves to Ctrl on Windows/Linux, Cmd on macOS
- **Key or Code Matching** — Layout-aware (`event.key`) or physical (`event.code`) for WASD-style controls
- **Callbacks** — `onPress` / `onRelease` receive the raw event for `preventDefault`
- **Robust** — Ignores auto-repeat & typing in inputs (opt-in), resets on window blur
- **SSR Compatible** — Safe listener setup and automatic cleanup

---

## Installation

```bash
# npm
npm install @usefy/use-key-press

# yarn
yarn add @usefy/use-key-press

# pnpm
pnpm add @usefy/use-key-press
```

### Peer Dependencies

This package requires React 18 or 19:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

---

## Quick Start

```tsx
import { useKeyPress } from "@usefy/use-key-press";

function Modal({ onClose }: { onClose: () => void }) {
  const escapePressed = useKeyPress("Escape");

  useEffect(() => {
    if (escapePressed) onClose();
  }, [escapePressed, onClose]);

  return <div>Press Escape to close</div>;
}
```

### Shortcut with a callback

```tsx
// mod = Ctrl on Windows/Linux, Cmd on macOS
useKeyPress("mod+k", {
  preventDefault: true,
  onPress: () => openCommandPalette(),
});
```

---

## API Reference

### `useKeyPress(target, options?)`

Detects whether `target` is currently pressed and returns a `boolean`.

#### Parameters

| Parameter | Type                 | Description                                        |
| --------- | -------------------- | -------------------------------------------------- |
| `target`  | `KeyPressTarget`     | The key(s) or predicate to detect (see below)      |
| `options` | `UseKeyPressOptions` | Optional configuration object                      |

#### `target` — `KeyPressTarget`

| Form               | Example                        | Meaning                                                   |
| ------------------ | ------------------------------ | --------------------------------------------------------- |
| `string`           | `"Escape"`, `"ctrl+s"`         | A single key or a `+`-joined modifier combination         |
| `string[]`         | `["ctrl+s", "meta+s"]`         | **Alternative** bindings — matches if **any** applies (OR) |
| predicate function | `(e) => /^[0-9]$/.test(e.key)` | Full control over matching                                 |

**Modifier aliases:** `ctrl`/`control`, `shift`, `alt`/`option`/`opt`, `meta`/`cmd`/`command`/`win`, and `mod` (Ctrl on Windows/Linux, Cmd on macOS).

**Key aliases:** `esc`/`escape`, `space`, `up`/`down`/`left`/`right` (arrows), `enter`/`return`, `del`/`delete`, `tab`, `backspace`, `plus`, and more.

#### Options — `UseKeyPressOptions`

| Option                | Type                                          | Default    | Description                                                                                     |
| --------------------- | --------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `target`              | `Window \| Document \| HTMLElement \| RefObject \| null` | `window` | The element to attach listeners to. `null` detaches                                             |
| `eventType`           | `"keydown" \| "keyup" \| "both"`              | `"both"`   | Which events drive the pressed state. `"both"` tracks the full held lifecycle                   |
| `enabled`             | `boolean`                                     | `true`     | When `false`, no listeners are attached and the result is always `false`                        |
| `preventDefault`      | `boolean`                                     | `false`    | Call `event.preventDefault()` on a match (e.g. override the browser's `ctrl+s`)                 |
| `stopPropagation`     | `boolean`                                     | `false`    | Call `event.stopPropagation()` on a match                                                        |
| `ignoreRepeat`        | `boolean`                                     | `true`     | Ignore auto-repeated `keydown` events for `onPress` (does not affect the returned boolean)      |
| `ignoreInputElements` | `boolean`                                     | `false`    | Ignore events from `<input>`, `<textarea>`, `<select>`, and `contenteditable` elements          |
| `caseSensitive`       | `boolean`                                     | `false`    | Match letters case-sensitively (key mode only)                                                   |
| `matchBy`             | `"key" \| "code"`                             | `"key"`    | Match the logical key (`event.key`) or the physical key (`event.code`)                          |
| `exactModifiers`      | `boolean`                                     | `true`     | Require an exact modifier match. When `true`, `"ctrl+s"` does **not** match `ctrl+shift+s`       |
| `onPress`             | `(event: KeyboardEvent) => void`              | —          | Called on a matching `keydown`, with the raw event                                               |
| `onRelease`           | `(event: KeyboardEvent) => void`              | —          | Called when a matched key is released                                                            |

#### Returns

`boolean` — `true` while the target key/combination is pressed (with the default `eventType: "both"`).

---

## Examples

### Cross-platform save shortcut

```tsx
import { useKeyPress } from "@usefy/use-key-press";

function Editor({ onSave }: { onSave: () => void }) {
  // Array = OR: matches Ctrl+S on Windows/Linux and Cmd+S on macOS
  useKeyPress(["ctrl+s", "meta+s"], {
    preventDefault: true, // stop the browser's Save dialog
    onPress: () => onSave(),
  });

  return <textarea />;
}
```

### Command palette

```tsx
import { useState } from "react";
import { useKeyPress } from "@usefy/use-key-press";

function App() {
  const [open, setOpen] = useState(false);

  useKeyPress("mod+k", {
    preventDefault: true,
    onPress: () => setOpen((prev) => !prev),
  });

  return open ? <CommandPalette /> : null;
}
```

### WASD game controls (physical keys)

```tsx
import { useKeyPress } from "@usefy/use-key-press";

function Game() {
  // matchBy: "code" is layout-independent (works on AZERTY, Dvorak, etc.)
  const up = useKeyPress("w", { matchBy: "code" });
  const left = useKeyPress("a", { matchBy: "code" });
  const down = useKeyPress("s", { matchBy: "code" });
  const right = useKeyPress("d", { matchBy: "code" });

  return <Player up={up} left={left} down={down} right={right} />;
}
```

### Ignore shortcuts while typing

```tsx
import { useKeyPress } from "@usefy/use-key-press";

function App() {
  // "f" opens a filter — but not while the user types "f" in a field
  useKeyPress("f", {
    ignoreInputElements: true,
    onPress: () => openFilter(),
  });

  return <input placeholder="Type freely..." />;
}
```

### Custom predicate

```tsx
import { useKeyPress } from "@usefy/use-key-press";

function NumericField() {
  const digitPressed = useKeyPress((e) => /^[0-9]$/.test(e.key));
  return <div data-active={digitPressed}>Press any number</div>;
}
```

### Scoped to a specific element

```tsx
import { useRef } from "react";
import { useKeyPress } from "@usefy/use-key-press";

function ScopedInput() {
  const ref = useRef<HTMLInputElement>(null);

  // Only reacts while the input is the event target
  const enterPressed = useKeyPress("Enter", { target: ref });

  return <input ref={ref} data-submit={enterPressed} />;
}
```

---

## TypeScript

This hook is written in TypeScript and exports comprehensive type definitions.

```tsx
import {
  useKeyPress,
  type KeyPressTarget,
  type UseKeyPressOptions,
  type KeyPressEventType,
  type KeyPressMatchBy,
  type ParsedShortcut,
} from "@usefy/use-key-press";

const options: UseKeyPressOptions = {
  preventDefault: true,
  matchBy: "key",
  onPress: (event) => console.log(event.key),
};

const isPressed: boolean = useKeyPress("mod+shift+p", options);
```

Utility helpers such as `parseShortcut`, `isKeyPressSupported`, and `isApplePlatform` are also exported for advanced use.

---

## Behavior Notes

- **Held state** — With the default `eventType: "both"`, the returned boolean is `true` only while the key/combination is physically held.
- **Stuck-key prevention** — If focus leaves the window while a key is held (so `keyup` is never delivered), the state resets on `blur`.
- **Modifier release** — For combinations, releasing either the primary key or any required modifier ends the pressed state.
- **SSR** — In non-browser environments the hook safely returns `false` and attaches no listeners.

---

## Browser Support

This hook uses standard `keydown`/`keyup` events, supported in all modern browsers:

- Chrome 1+
- Firefox 1+
- Safari 1+
- Edge 12+
- Opera 7+

For SSR environments, the hook gracefully degrades and returns `false`.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-key-press/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useKeyPress.test.ts` — 49 tests for hook behavior and utilities

**Total: 49 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>

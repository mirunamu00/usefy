<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-hotkeys</h1>

<p align="center">
  <strong>High-level keyboard shortcuts — combos, sequences, the cross-platform <code>mod</code> alias, scoping, and an input-field guard.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-hotkeys"><img src="https://img.shields.io/npm/v/@usefy/use-hotkeys.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-hotkeys"><img src="https://img.shields.io/npm/dm/@usefy/use-hotkeys.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-hotkeys"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-hotkeys?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-hotkeys.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usehotkeys--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useHotkeys` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It turns a hotkey string (or an array of them) into a callback: register `"mod+k"`, `["mod+s", "ctrl+p"]`, or a Gmail-style sequence like `"g i"`, and your handler fires when the user presses it.

It is a purpose-built handler API rather than a thin wrapper over [`@usefy/use-key-press`](https://www.npmjs.com/package/@usefy/use-key-press): that sibling hook returns the _held state_ of a key as a boolean and has no notion of chord sequences, so `useHotkeys` owns its own single managed listener (via [`@usefy/use-event-listener`](https://www.npmjs.com/package/@usefy/use-event-listener)) plus a sequence buffer.

## Features

- **Combos** — `"mod+k"`, `"ctrl+shift+p"`, `"shift+?"`, `"Escape"`, `"ArrowUp"`, `"a"`. Modifier tokens are case-insensitive: `ctrl`/`control`, `shift`, `alt`/`option`, `meta`/`cmd`/`command`, and `mod`.
- **Sequences** — space-separated combos such as `"g i"` or `"g g"`, with a configurable reset timeout (`sequenceTimeoutMs`, default `1000`).
- **Multiple bindings** — pass an array to bind several hotkeys to one handler (matched as OR).
- **Cross-platform `mod`** — resolves to Cmd (`metaKey`) on macOS and Ctrl (`ctrlKey`) on Windows/Linux. Detection is SSR-safe and overridable via the `mac` option (handy for tests).
- **Exact modifiers** — `"a"` does **not** fire on `Ctrl+A`; `"ctrl+a"` does **not** fire on a plain `a`.
- **Input-field guard** — by default hotkeys do not fire while an `<input>`, `<textarea>`, `<select>`, or `contenteditable` element is focused. Opt out with `enableOnFormTags: true`.
- **Scoping** — bind to `document` (default), `window`, an `HTMLElement`, or a React `RefObject`.
- **SSR-safe & StrictMode-safe** — no listeners on the server, no duplicate listeners, no leaked sequence timers, and full cleanup on unmount and on `enabled`/`target`/`keys` change.
- **TypeScript-first** — full type inference and exported types.
- **Tiny & tree-shakeable** — published as its own package.

## Installation

```bash
# npm
npm install @usefy/use-hotkeys

# yarn
yarn add @usefy/use-hotkeys

# pnpm
pnpm add @usefy/use-hotkeys
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useHotkeys } from "@usefy/use-hotkeys";
import { useState } from "react";

function App() {
  const [open, setOpen] = useState(false);

  // Cmd/Ctrl + K toggles a command palette (browser default suppressed)
  useHotkeys("mod+k", () => setOpen((o) => !o), { preventDefault: true });

  // Multiple bindings for one handler
  useHotkeys(["mod+s", "ctrl+enter"], save, { preventDefault: true });

  // A sequence: press "g" then "i"
  useHotkeys("g i", () => navigate("/inbox"));

  return open ? <CommandPalette /> : null;
}
```

## API

```ts
useHotkeys(
  keys: string | string[],
  handler: (event: KeyboardEvent, match: HotkeyMatch) => void,
  options?: UseHotkeysOptions
): void;
```

### `keys`

A hotkey string, or an array of them (all bound to the same `handler`, matched as OR). A hotkey is either a single **combo** (`"mod+k"`) or a space-separated **sequence** of combos (`"g i"`).

- **Modifier tokens** (case-insensitive): `ctrl`/`control`, `shift`, `alt`/`option`, `meta`/`cmd`/`command`, and the cross-platform `mod`.
- **Key** — the final non-modifier token, matched against `KeyboardEvent.key` case-insensitively, with friendly aliases: `esc`→`Escape`, `space`→`" "`, `up`/`down`/`left`/`right`→arrow keys, `enter`/`return`, `del`/`delete`, `tab`, `backspace`, `plus`/`+`.
- Because whitespace separates a sequence, write the space bar as `"space"` (not a literal `" "`).

### `handler`

`(event: KeyboardEvent, match: HotkeyMatch) => void`. The `match` object reports `{ hotkey, index, sequence }` — the raw string that matched, its index in the `keys` array, and whether it was a multi-combo sequence. The handler is kept in a ref, so you never need to memoize it and the listener is not re-subscribed when it changes.

### `options` (`UseHotkeysOptions`)

| Option              | Type                                                       | Default      | Description                                                                                             |
| ------------------- | ---------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------- |
| `enabled`           | `boolean`                                                  | `true`       | When `false`, nothing is attached and no hotkey fires; any in-progress sequence buffer is cleared.      |
| `target`            | `HTMLElement \| RefObject \| Document \| Window \| null`   | `document`   | The element the listener is bound to. `null` detaches. Refs are resolved to `.current`.                 |
| `eventType`         | `"keydown" \| "keyup"`                                     | `"keydown"`  | Which keyboard event drives matching.                                                                   |
| `enableOnFormTags`  | `boolean`                                                  | `false`      | Allow hotkeys to fire while an editable element is focused. Left off, typing in a form never triggers a shortcut. |
| `preventDefault`    | `boolean`                                                  | `false`      | Call `event.preventDefault()` on a match only. Safe for overriding browser shortcuts such as `mod+s`.   |
| `sequenceTimeoutMs` | `number`                                                   | `1000`       | How long the sequence buffer waits between combos before resetting.                                     |
| `mac`               | `boolean`                                                  | auto-detect  | Override `mod` resolution: `true` → `meta`, `false` → `ctrl`. Leave undefined to detect from the UA.    |

### Exported helpers & types

`parseHotkey(hotkey, { mac? })`, `isMacPlatform()`, `isHotkeysSupported()`, and the types `Hotkey`, `HotkeyTarget`, `HotkeyHandler`, `HotkeyMatch`, `ParsedChord`, `ParsedHotkey`, `UseHotkeysOptions`.

### Notes on behavior

- **Auto-repeat is ignored** — holding a combo fires once (a held `keydown` with `event.repeat` is skipped), which also keeps sequence buffers clean.
- **Lone modifier presses** (Ctrl/Shift/Alt/Meta by themselves) neither start a combo nor break an in-progress sequence.
- **Letter case in the key token is ignored** — write `"shift+a"` rather than `"A"` when you need the Shift modifier.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-hotkeys/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **55 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

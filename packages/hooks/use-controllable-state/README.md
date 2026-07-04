<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-controllable-state</h1>

<p align="center">
  <strong>The controlled/uncontrolled state primitive every component library needs</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-controllable-state"><img src="https://img.shields.io/npm/v/@usefy/use-controllable-state.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-controllable-state"><img src="https://img.shields.io/npm/dm/@usefy/use-controllable-state.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-controllable-state"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-controllable-state?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-controllable-state.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usecontrollablestate--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useControllableState` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It lets a component support **both** a parent-controlled `value`/`onChange` API **and** self-managed state from a `defaultValue`, with a single hook and no branching at the call site — the exact pattern used by Radix UI and Mantine.

## Features

- **Controlled mode** — when `value` is defined, the returned value mirrors it and the setter only calls `onChange` (the parent owns the value)
- **Uncontrolled mode** — when `value` is `undefined`, the hook manages its own state seeded from `defaultValue`
- **`useState` ergonomics** — the setter accepts a value **or** an updater function `(prev) => next`
- **Stable & StrictMode-safe** — the setter keeps a permanent identity; `onChange` fires only on real changes and never double-fires under StrictMode/concurrent rendering
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-controllable-state

# yarn
yarn add @usefy/use-controllable-state

# pnpm
pnpm add @usefy/use-controllable-state
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useControllableState } from "@usefy/use-controllable-state";

// A switch that is controllable but works standalone.
function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
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

// Uncontrolled — manages its own state:
<Switch defaultChecked />;

// Controlled — the parent owns the value:
const [value, setValue] = useState(false);
<Switch checked={value} onCheckedChange={setValue} />;
```

## API

```ts
const [value, setValue] = useControllableState<T>({
  value,        // T | undefined — the controlled value (defined ⇒ controlled)
  defaultValue, // T | undefined — initial value used while uncontrolled
  onChange,     // ((value: T) => void) | undefined — called on every change
});
```

### Options — `UseControllableStateOptions<T>`

| Option         | Type                    | Description                                                                                                                                             |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`        | `T \| undefined`        | The controlled value. When **not** `undefined`, the hook is controlled: the returned value mirrors this prop and the setter only notifies `onChange`.   |
| `defaultValue` | `T \| undefined`        | Initial value used in uncontrolled mode (when `value` is `undefined`). Passed to `useState`, so a function value is treated as a lazy initializer.      |
| `onChange`     | `(value: T) => void`    | Called with the next value on every change. Its identity may change between renders without re-subscribing — the latest callback is always used.        |

### Returns — `UseControllableStateReturn<T>`

A `readonly [value, setValue]` tuple with the same shape as `useState`:

- **`value: T`** — the effective value (the controlled prop when controlled, otherwise the internal state).
- **`setValue: Dispatch<SetStateAction<T>>`** — accepts a next value or an updater `(prev) => next`. In uncontrolled mode it updates internal state and fires `onChange` on change; in controlled mode it only fires `onChange` (when the resolved value differs), leaving the parent to update `value`.

### Behavior notes

- **Mode is per-render** — it is decided each render by whether `value === undefined`. Switching between defined/undefined switches modes; components should avoid doing so mid-lifecycle (same caveat as React's own controlled inputs).
- **No `onChange` on mount** — it fires only when the value actually changes (compared with `Object.is`).
- **StrictMode-safe** — in uncontrolled mode `onChange` is dispatched from an effect after commit, never from inside a `setState` updater, so it does not double-fire.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-controllable-state/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **19 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

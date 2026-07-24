<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-focus-within</h1>

<p align="center">
  <strong>Track whether keyboard focus is currently anywhere within a subtree — the reactive equivalent of CSS <code>:focus-within</code></strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-focus-within"><img src="https://img.shields.io/npm/v/@usefy/use-focus-within.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-focus-within"><img src="https://img.shields.io/npm/dm/@usefy/use-focus-within.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-focus-within"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-focus-within?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-focus-within.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#examples">Examples</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usefocuswithin--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useFocusWithin` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It tells you, as React state, whether keyboard focus is currently on a container or any of its descendants — the reactive, state-driven equivalent of the CSS `:focus-within` pseudo-class.

Attach the returned callback ref to any element and read the boolean: highlight a form while it's being filled in, reveal a toolbar while a field group is active, or fire side effects when focus enters/leaves a region.

It's built on the **bubbling** `focusin` / `focusout` events (the non-bubbling `focus` / `blur` can't observe descendant focus), and correctly distinguishes focus *moving between descendants* — where `focused` stays `true` with no flicker — from focus *leaving the subtree entirely*, where it flips to `false`.

## Features

- **`[ref, focused]` tuple** — attach the callback ref, read the boolean; no wiring
- **No flicker** — focus moving between two children keeps `focused` `true` (unlike naïve `focus`/`blur` tracking)
- **Robust `relatedTarget: null` handling** — some browsers report a `null` `relatedTarget` even when focus stays inside; the hook defers to `document.activeElement` on the next microtask to decide correctly
- **Edge callbacks** — optional `onFocus` / `onBlur` fire **only** on the subtree's `false ↔ true` transitions, never on inner focus moves; kept stable via a latest-ref so new inline handlers never re-subscribe listeners
- **Callback ref** — listeners attach/detach exactly when the element mounts, unmounts, or the ref moves to another element (works on React 18 and 19)
- **SSR-safe** — no `window`/`document` access on the server; initial `focused` is `false`
- **StrictMode / concurrent-safe** — no duplicate listeners, no stuck state on double mount
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — published as its own package

## Installation

```bash
# npm
npm install @usefy/use-focus-within

# yarn
yarn add @usefy/use-focus-within

# pnpm
pnpm add @usefy/use-focus-within
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useFocusWithin } from "@usefy/use-focus-within";

function ContactForm() {
  const [ref, focused] = useFocusWithin<HTMLFormElement>();

  return (
    <form
      ref={ref}
      style={{ outline: focused ? "2px solid dodgerblue" : "none" }}
    >
      <input placeholder="Name" />
      <input placeholder="Email" />
      <button type="submit">Send</button>
    </form>
  );
}
```

## API

### `useFocusWithin(options?)`

```ts
const [ref, focused] = useFocusWithin<T>(options?);
// <div ref={ref}> …focusable content… </div>
```

Returns a `[ref, focused]` tuple:

| Element   | Type                          | Description                                                                                     |
| --------- | ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `ref`     | `(node: T \| null) => void`   | A **stable callback ref** to attach to the container element you want to track.                 |
| `focused` | `boolean`                     | `true` whenever the active element is the container or any descendant. Starts `false` (also on the server). |

`T` defaults to `HTMLElement`; pass the concrete element type (e.g. `HTMLFormElement`) for a precisely-typed ref.

#### Options — `UseFocusWithinOptions`

| Option    | Type                             | Description                                                                                                  |
| --------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `onFocus` | `(event: FocusEvent) => void`    | Fires when focus **enters** a previously-unfocused subtree. Receives the triggering `focusin` event.        |
| `onBlur`  | `(event: FocusEvent) => void`    | Fires when focus **leaves** the subtree entirely. Receives the triggering `focusout` event.                 |

Both callbacks fire **only on the edge transitions** — moving focus from one descendant to another fires neither.

#### Also exported

- `isFocusInside(container, target)` — the reusable predicate for "is this node the container or a descendant of it" (folds in the `null` cases).
- Types: `UseFocusWithinOptions`, `UseFocusWithinRef`, `UseFocusWithinReturn`.

### How `focusout` is resolved

On `focusout` the hook decides whether focus truly left the subtree:

1. If `event.relatedTarget` is a node **inside** the container → focus just moved between descendants; stay `focused`.
2. If `relatedTarget` is a node **outside** the container → focus left; go `false`.
3. If `relatedTarget` is `null` (unreliable — reported when focus goes to nothing, to another window, or by browsers that omit it) → defer one microtask and re-check `document.activeElement`; go `false` only if focus genuinely ended up outside.

Step 3 is what makes the hook robust to the well-known `null`-`relatedTarget` quirk while staying fully testable in jsdom.

## Examples

### Highlight a card while it's being filled in

```tsx
const [ref, focused] = useFocusWithin<HTMLDivElement>();

return (
  <div ref={ref} className={focused ? "card card--active" : "card"}>
    <input placeholder="Card number" />
    <input placeholder="Expiry" />
    <input placeholder="CVC" />
  </div>
);
```

### Run side effects on enter/leave

```tsx
const [ref, focused] = useFocusWithin<HTMLDivElement>({
  onFocus: () => analytics.track("filter_group_focused"),
  onBlur: () => validateGroup(),
});
```

`onFocus`/`onBlur` fire only on the subtree's transitions — tabbing across the inner fields won't re-fire them.

### Reveal a toolbar while a region is active

```tsx
const [ref, focused] = useFocusWithin<HTMLDivElement>();

return (
  <div ref={ref}>
    <textarea placeholder="Write something…" />
    {focused && <FormattingToolbar />}
  </div>
);
```

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-focus-within/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **26 tests**, 98% statement coverage.

- `useFocusWithin.test.tsx` — hook behavior (focus in/out, container-level focus, no-flicker between descendants, leave to outside, blur-to-nothing; `relatedTarget` inside/outside/`null`- and `undefined`-quirk branches; `onFocus`/`onBlur` edge semantics; latest-callback without re-subscribe; callback-ref attach/detach, initial-focus sync, detach reset, unmount cleanup; ref stability, SSR-inert default, StrictMode) plus the `isFocusInside` predicate in isolation.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

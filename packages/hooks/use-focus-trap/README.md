<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-focus-trap</h1>

<p align="center">
  <strong>Trap keyboard focus inside a subtree — the accessibility primitive behind modals, dialogs, drawers, and popovers</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-focus-trap"><img src="https://img.shields.io/npm/v/@usefy/use-focus-trap.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-focus-trap"><img src="https://img.shields.io/npm/dm/@usefy/use-focus-trap.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-focus-trap"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-focus-trap?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-focus-trap.svg?style=flat-square&color=007acc" alt="license" /></a>
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usefocustrap--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useFocusTrap` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It traps keyboard focus inside a container so <kbd>Tab</kbd> can't wander off to the page behind a modal — an accessibility essential for any dialog, drawer, or popover.

While the trap is active, <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd> cycle only through the container's focusable descendants (computed **live** on every keypress, so content that mounts/unmounts inside the dialog is always handled), focus is moved into the trap on activation, and focus is restored to wherever it was when the trap deactivates or unmounts.

It does **one** thing — trapping focus. It doesn't lock body scroll (that's [`@usefy/use-scroll-lock`](https://www.npmjs.com/package/@usefy/use-scroll-lock)) and it renders nothing; you attach the returned callback ref to your own container.

## Features

- **Wrap-around cycling** — <kbd>Tab</kbd> on the last element wraps to the first; <kbd>Shift</kbd>+<kbd>Tab</kbd> on the first wraps to the last
- **Live focusable set** — recomputed on every <kbd>Tab</kbd> (never cached), with a robust selector that excludes `disabled` (including `<fieldset disabled>` descendants), `hidden`, `inert`, `tabindex="-1"`, and invisible elements
- **Nested-trap aware** — stack two traps (a dialog over a dialog) and only the topmost reacts: <kbd>Escape</kbd> fires once and the Tab handlers never race
- **Configurable initial focus** — `initialFocus` accepts an element, a ref, or a getter; defaults to the first focusable element (or the container). `false` disables it
- **Return focus on close** — restores focus to the trigger by default (`returnFocus`), overridable to any target or disablable
- **Escape callback** — `onEscape` is surfaced so you close the dialog from your own state; the hook never owns open/close
- **Zero focusable elements handled** — focus is pinned to the container and <kbd>Tab</kbd> can't escape
- **SSR-safe** — no `document` access on the server; the ref is inert until it attaches on the client
- **StrictMode / concurrent-safe** — cleanup always removes the listener and restores focus; React 18's double mount never leaks
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — published as its own package

## Installation

```bash
# npm
npm install @usefy/use-focus-trap

# yarn
yarn add @usefy/use-focus-trap

# pnpm
pnpm add @usefy/use-focus-trap
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useState } from "react";
import { useFocusTrap } from "@usefy/use-focus-trap";

function Dialog() {
  const [open, setOpen] = useState(false);
  // Focus is trapped while `open`, moved to the first field on open, and
  // restored to the trigger on close. Escape is surfaced so you own the state.
  const ref = useFocusTrap<HTMLDivElement>(open, {
    onEscape: () => setOpen(false),
  });

  return (
    <>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      {open && (
        <div ref={ref} role="dialog" aria-modal="true" aria-label="Sign up">
          <input placeholder="Name" />
          <input placeholder="Email" />
          <button onClick={() => setOpen(false)}>Cancel</button>
          <button onClick={() => setOpen(false)}>Save</button>
        </div>
      )}
    </>
  );
}
```

## API

### `useFocusTrap(active?, options?)`

```ts
const ref = useFocusTrap<HTMLDivElement>(active, options);
// <div ref={ref}> …focusable content… </div>
```

Returns a **stable callback ref** to attach to the container that should contain focus.

> **Modal-grade "hard" trap.** `active` **defaults to `true`**, and while active a <kbd>Tab</kbd> pressed _anywhere on the page_ — even from outside the container — is pulled back into the trap. If you render two traps at once (a dialog opened over another dialog), only the **most-recently activated ("topmost")** one reacts to <kbd>Tab</kbd> and <kbd>Escape</kbd>; the ones beneath stay dormant until it deactivates, so <kbd>Escape</kbd> fires once and the two Tab handlers never fight.

| Parameter | Type                    | Default | Description                                                                                        |
| --------- | ----------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `active`  | `boolean`               | `true`  | Whether the trap is active. When it flips `false`, the listener is removed and focus is restored.  |
| `options` | `UseFocusTrapOptions`   | `{}`    | See below.                                                                                          |

#### Options — `UseFocusTrapOptions`

| Option         | Type                                         | Default          | Description                                                                                                              |
| -------------- | -------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `initialFocus` | `FocusTarget \| false`                       | first focusable  | Where focus lands on activation. An element, ref, or getter. `false` means don't move focus (you place it yourself).    |
| `returnFocus`  | `boolean \| FocusTarget`                     | `true`           | Where focus returns on deactivation/unmount. `true` restores the element focused at activation; a target overrides it; `false` skips restore. |
| `onEscape`     | `(event: KeyboardEvent) => void`             | —                | Called when <kbd>Escape</kbd> is pressed inside the trap. The hook never manages open/close state itself.               |

`FocusTarget` is `HTMLElement | RefObject<HTMLElement | null> | (() => HTMLElement | null)` — resolved at the moment focus moves.

#### Also exported

- `getFocusableElements(container)` — the live focusable-descendants helper (in **DOM order**; it does not reorder for positive `tabindex`), reusable for roving-tabindex and custom keyboard navigation. Controls disabled directly or by an ancestor `<fieldset disabled>`, as well as `hidden`/`inert`/`tabindex="-1"`/invisible elements, are excluded.
- Types: `UseFocusTrapOptions`, `UseFocusTrapRef`, `FocusTarget`.

## Examples

### Custom initial focus

Point `initialFocus` at a specific element (a ref, element, or getter):

```tsx
import { useRef, useState } from "react";
import { useFocusTrap } from "@usefy/use-focus-trap";

function EditProfile() {
  const [open, setOpen] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Focus the Email field on open instead of the first field.
  const ref = useFocusTrap<HTMLDivElement>(open, {
    initialFocus: emailRef,
    onEscape: () => setOpen(false),
  });

  return open ? (
    <div ref={ref} role="dialog" aria-modal="true">
      <input defaultValue="Ada Lovelace" />
      <input ref={emailRef} defaultValue="ada@example.com" />
      <button onClick={() => setOpen(false)}>Done</button>
    </div>
  ) : null;
}
```

### Don't move or restore focus

```tsx
// Place focus yourself, and leave it where it is on close.
const ref = useFocusTrap<HTMLDivElement>(open, {
  initialFocus: false,
  returnFocus: false,
});
```

### Pair with scroll lock for a full modal

`useFocusTrap` deliberately does one thing. Compose it with `@usefy/use-scroll-lock` for a complete modal:

```tsx
import { useFocusTrap } from "@usefy/use-focus-trap";
import { useScrollLock } from "@usefy/use-scroll-lock";

function Modal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useFocusTrap<HTMLDivElement>(open, { onEscape: onClose });
  useScrollLock({ enabled: open });

  return open ? (
    <div ref={ref} role="dialog" aria-modal="true">
      …
    </div>
  ) : null;
}
```

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-focus-trap/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **44 tests**, 100% statement coverage.

- `useFocusTrap.test.tsx` — hook behavior (initial focus: default/custom element/ref/getter/`false`; Tab & Shift+Tab wrap-around; from-outside recovery; zero-focusable container pinning; disabled/hidden/`fieldset[disabled]` exclusion; `onEscape`; nested/simultaneous traps — topmost-only Escape & Tab, next-trap re-activation, no stack leak on unmount; return focus on deactivate/unmount; re-activation cancels the pending restore; `returnFocus` `false`/custom; ref stability; no-op when unattached; no re-subscribe on option change; StrictMode) plus the `getFocusableElements` / `isFocusable` / `isHidden` / `resolveFocusTarget` utilities in isolation.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

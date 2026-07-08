<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/virtual-keyboard</h1>

<p align="center">
  <strong>On-screen virtual keyboard for React — declarative layouts, headless hook, enterprise a11y</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/virtual-keyboard">
    <img src="https://img.shields.io/npm/v/@usefy/virtual-keyboard.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/virtual-keyboard">
    <img src="https://img.shields.io/npm/dm/@usefy/virtual-keyboard.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/virtual-keyboard">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/virtual-keyboard?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <img src="https://img.shields.io/badge/coverage-92%25-brightgreen?style=flat-square" alt="coverage" />
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/virtual-keyboard.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#input-modes">Input Modes</a> •
  <a href="#built-in-layouts">Built-in Layouts</a> •
  <a href="#custom-layouts">Custom Layouts</a> •
  <a href="#korean--ime-composition">IME Composition</a> •
  <a href="#theming">Theming</a> •
  <a href="#accessibility">Accessibility</a> •
  <a href="#api">API</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/story/components-virtualkeyboard--search-box" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/virtual-keyboard` is a React on-screen keyboard — the kind you click open
next to a search box (like YouTube's keyboard icon) so a user can type with the
**mouse, touch, or a pointer/remote** instead of a physical keyboard. It renders a
fully interactive keyboard UI, emits keystrokes to any input, and ships a
declarative **layout engine** so teams can support new key sets without forking
the component.

Built for **kiosks / POS, smart-TV / D-pad UIs, PIN pads, and accessibility**
scenarios. The styled `VirtualKeyboard` component sits on top of the headless
`useVirtualKeyboard` hook — use either.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem.**

### Features

- **Three input modes** — event-emit (BYO input), controlled/uncontrolled `value`, or **ref-bound** to a real `<input>`/`<textarea>` with caret & selection tracking.
- **Declarative layout engine** — layouts are data (`rows` of key definitions). Built-ins: **QWERTY, AZERTY, QWERTZ, Dvorak, Colemak, numeric, phone, email**, plus a first-class `createLayout` API.
- **Modifiers** — one-shot **Shift**, sticky **Caps Lock**, and a **symbol layer**.
- **Gestures** — inline / docked / floating placement with an optional trigger, long-press **accent variants**, Backspace **auto-repeat**, and a per-mount **randomized** secure PIN pad.
- **Enterprise a11y** — `role="group"`, real `<button>` keys with accessible names, `aria-pressed` on active modifiers, **roving-tabindex arrow-key navigation** (mirrored under RTL), `Escape` to blur/close, 44×44px targets.
- **Themeable & RTL** — `--usefy-vk-*` CSS variables, light/dark, responsive, and `direction: "rtl"` layouts render mirrored; styles are injected at import (no CSS import required).
- **Optional feedback** — opt-in `sound` (synthesized Web Audio click, no asset) and `haptics` (`navigator.vibrate`).
- **SSR-safe** — no `window`/`document` at import; renders inertly on the server.
- **IME composition** — a pluggable `Composer` seam with a ready-made Korean **두벌식** composer (`@usefy/virtual-keyboard/hangul`): jamo assemble into syllable blocks, the pending block renders underlined, and `value` stays composition-free.

---

## Installation

```bash
# npm
npm install @usefy/virtual-keyboard

# pnpm
pnpm add @usefy/virtual-keyboard

# yarn
yarn add @usefy/virtual-keyboard
```

Peer dependencies: `react` and `react-dom` (`^18 || ^19`). Styles are injected at
runtime on import, so **no CSS import is required**. If you prefer to extract the
CSS yourself, an opt-in stylesheet is available:

```ts
import "@usefy/virtual-keyboard/styles.css";
```

---

## Quick Start

A YouTube-style search box: bind the keyboard to an input by ref and submit on
Enter.

```tsx
import { useRef } from "react";
import { VirtualKeyboard, qwertyLayout } from "@usefy/virtual-keyboard";

function Search() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input ref={inputRef} placeholder="Search…" />
      <VirtualKeyboard
        inputRef={inputRef}
        layouts={qwertyLayout}
        submitOnEnter
        onEnter={(query) => runSearch(query)}
      />
    </>
  );
}
```

---

## Input Modes

All three modes are supported by both the component and the hook.

### 1. Ref-bound (write into an existing input)

The keyboard writes into the element and restores the caret after each edit.

```tsx
const inputRef = useRef<HTMLInputElement>(null);
<input ref={inputRef} />
<VirtualKeyboard inputRef={inputRef} />
```

### 2. Controlled / uncontrolled `value`

```tsx
// Controlled — you own the string.
const [value, setValue] = useState("");
<VirtualKeyboard value={value} onChange={setValue} />

// Uncontrolled — the keyboard keeps its own state.
<VirtualKeyboard defaultValue="hello" onChange={(v) => console.log(v)} />
```

### 3. Event-emit (bring your own input)

```tsx
<VirtualKeyboard
  onChange={(value) => setState(value)}
  onKeyPress={(key, event) => console.log(key.key, event)}
/>
```

### Headless

Drop the styling and build your own UI on the engine:

```tsx
import { useVirtualKeyboard } from "@usefy/virtual-keyboard/headless";

function CustomKeyboard() {
  const kb = useVirtualKeyboard({ maxLength: 4, keyFilter: (k) => /\d/.test(k) });
  return (
    <div {...kb.getKeyboardProps()}>
      {kb.layout.rows.map((row, r) => (
        <div key={r} {...kb.getRowProps(r)}>
          {row.map((key, k) => (
            <button key={k} {...kb.getKeyProps(key)}>{key.displayLabel}</button>
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

## Built-in Layouts

Import any built-in layout and pass it straight to `layouts`:

| Layout | Import | Notes |
| --- | --- | --- |
| QWERTY | `qwertyLayout` | US-QWERTY with a `?123` symbol layer + accent variants. |
| AZERTY | `azertyLayout` | French — `A`/`Z` on the top row, `M` on the home row. |
| QWERTZ | `qwertzLayout` | German — `Y`/`Z` swapped, umlaut + ß variants. |
| Dvorak | `dvorakLayout` | Ergonomic — `aoeuidhtns` home row. |
| Colemak | `colemakLayout` | Ergonomic — `arstdhneio` home row, QWERTY bottom row. |
| Numeric | `numericLayout` | 3×3 + zero PIN pad with Clear. |
| Phone | `phoneLayout` | Dial pad with `*`, `#`, `+`. |
| Email | `emailLayout` | QWERTY with `@` and `.com` convenience keys. |

The five Latin layouts share the same 26 letters, `?123` symbol layer, and
long-press accent variants — only the key arrangement differs.

```tsx
import { VirtualKeyboard, azertyLayout } from "@usefy/virtual-keyboard";

<VirtualKeyboard layouts={azertyLayout} enableVariants />;
```

## Custom Layouts

A layout is just data. Bare strings are expanded into character keys; full key
definitions give you modifiers, actions, widths, and symbol-layer glyphs.

```tsx
import { VirtualKeyboard, createLayout } from "@usefy/virtual-keyboard";

const hex = createLayout({
  name: "hex",
  rows: [
    ["1", "2", "3", "4"],
    ["5", "6", "7", "8"],
    ["9", "0", "a", "b"],
    [
      "c",
      "d",
      "e",
      "f",
      { key: "Backspace", label: "⌫", action: "backspace", width: 1.5 },
    ],
  ],
});

<VirtualKeyboard layouts={hex} maxLength={6} />;
```

Register multiple layouts and switch between them with a `layout-switch` key or
the `setLayout` action:

```tsx
<VirtualKeyboard layouts={[qwertyLayout, numericLayout]} defaultLayout="qwerty" />
```

---

## Korean & IME Composition

For scripts that assemble characters from smaller units (an **IME**), a layout can
carry a `Composer`. The opt-in subpath `@usefy/virtual-keyboard/hangul` ships a
ready-made Korean **두벌식 (dubeolsik)** composer and its layout — import it only
when you need it (it is tree-shakeable and adds no CSS):

```tsx
import { VirtualKeyboard } from "@usefy/virtual-keyboard";
import { hangulLayout } from "@usefy/virtual-keyboard/hangul";

<VirtualKeyboard layouts={hangulLayout} />;
```

Jamo assemble into full syllable blocks — including compound vowels (ㅗ+ㅏ→ㅘ),
compound finals (ㄱ+ㅅ→ㄳ), and final→initial migration (강+ㅏ → 가+…). The
**in-progress block renders underlined** and commits on the next block, Space,
Enter, or a layout switch; Backspace deletes one jamo at a time. Throughout,
`value`/`onChange` report **committed text only** — read `composing` from the
hook for the pending block:

```tsx
import { useVirtualKeyboard } from "@usefy/virtual-keyboard";
import { hangulComposer } from "@usefy/virtual-keyboard/hangul";

// Attach the composer to any custom layout, or drive it directly:
const kb = useVirtualKeyboard({ layouts: hangulLayout });
kb.value;     // committed text, e.g. "안녕"
kb.composing; // the block still forming, e.g. "하"
```

Any layout can supply its own `composer` (implement `input`/`flush`/`reset`, plus
an optional `backspace` for composition-aware deletion) — Hangul is just the
built-in one.

---

## Theming

All colors and sizing are driven by `--usefy-vk-*` CSS variables. Override them on
any ancestor (or via `className`/`style`):

```css
.my-keyboard {
  --usefy-vk-bg: #0b1020;
  --usefy-vk-key-bg: #1a2138;
  --usefy-vk-key-color: #e6e9f2;
  --usefy-vk-accent: #7c8cff;
  --usefy-vk-radius: 12px;
  --usefy-vk-key-min-size: 48px;
}
```

| Variable | Purpose |
| -------- | ------- |
| `--usefy-vk-bg` | Keyboard background |
| `--usefy-vk-key-bg` / `--usefy-vk-key-color` | Key surface / text |
| `--usefy-vk-key-border` | Key border |
| `--usefy-vk-key-active-bg` | Pressed/hover key background |
| `--usefy-vk-modifier-bg` / `--usefy-vk-modifier-active-bg` | Modifier resting / active |
| `--usefy-vk-accent` | Focus ring & active accent |
| `--usefy-vk-radius` / `--usefy-vk-gap` | Corner radius / spacing |
| `--usefy-vk-key-min-size` | Minimum key size (defaults to 44px) |

Set the theme explicitly or follow the OS:

```tsx
<VirtualKeyboard theme="system" /> // "light" | "dark" | "system"
```

---

## Accessibility

- The keyboard is a labelled `role="group"`; every key is a real `<button>` with
  an accessible name (icon keys fall back to a humanized label).
- Active modifiers expose `aria-pressed`.
- **Roving tabindex** — exactly one key is tabbable; **Arrow keys** move focus
  (2D), **Home/End** jump to the first/last key, **Space/Enter** activate — so
  pointer *and* keyboard/D-pad users are both served.
- **Trigger** — when a `trigger` is provided it is wrapped in a `<button>` with
  `aria-expanded` (reflecting the open state) and `aria-controls` (the keyboard's
  id). Provide `triggerLabel` for an icon-only trigger.
- **Escape** blurs the focused key; for `docked`/`floating` it also closes the
  keyboard and **returns focus to the trigger** (WAI-ARIA disclosure).
- **Accent-variants popup** — a `role="menu"` of `role="menuitem"` buttons
  (WAI-ARIA APG). Focus moves in on open; Arrow keys / Home / End navigate;
  Enter/Space select; Escape closes the popup only (the keyboard stays open);
  focus returns to the originating key.
- Minimum target size is 44×44 CSS px; `prefers-reduced-motion` is respected.

---

## API

### `<VirtualKeyboard />` props

Extends every [`useVirtualKeyboard` option](#usevirtualkeyboard-options), plus:

| Prop | Type | Description |
| ---- | ---- | ----------- |
| `variant` | `"inline" \| "docked" \| "floating"` | Placement: `inline` (in flow, always visible — default); `docked` (fixed full-width bar at the bottom of the viewport); `floating` (elevated floating panel above the bottom edge). |
| `open` | `boolean` | Controlled open state for `docked`/`floating` (ignored by `inline`). |
| `defaultOpen` | `boolean` | Uncontrolled initial open state. Defaults to closed when a `trigger` is present, otherwise open. |
| `onOpenChange` | `(open: boolean) => void` | Fired when the open state changes (trigger click, Escape). |
| `trigger` | `ReactNode` | The "keyboard icon" affordance. Wrapped in an accessible toggle button; content must be **non-interactive**. |
| `triggerLabel` | `string` | Accessible name for an icon-only `trigger` (visible text is preferred when present). |
| `zIndex` | `number` | Stacking for the fixed `docked`/`floating` variants (default `1000`). |
| `enableVariants` | `boolean` | Show a corner dot on keys with `variants` and open an accent chooser on long-press / right-click. |
| `enableKeyRepeat` | `boolean` | Auto-repeat repeatable action keys while held. Only **Backspace** repeats today; char keys never do. |
| `randomize` | `boolean` | Shuffle char-key **positions** once per mount (secure PIN pads). Action/modifier keys stay put; values are unchanged. Changing `layouts` after mount has no effect while on — remount (a changing `key`) to reshuffle. |
| `sound` | `boolean` | Play a synthesized Web Audio click on each press (no asset, CSP-friendly). The AudioContext is created lazily on the first press; no-ops where unsupported. Rides taps/clicks only (a held auto-repeat doesn't click each tick). Built-in keys only — `renderKey` keys bypass it. |
| `haptics` | `boolean` | Vibrate ~10ms on each press via `navigator.vibrate` where supported (independent of `sound`). Built-in keys only — `renderKey` keys bypass it. |
| `theme` | `"light" \| "dark" \| "system"` | Color theme (default `"system"`). |
| `classNames` | `{ root?, row?, key?, keyActive? }` | Per-part class overrides. |
| `renderKey` | `(key, defaultProps) => ReactNode` | Render keys yourself (advanced). Custom keys use the raw press path, so built-in `sound`/`haptics` and the variants/auto-repeat gestures don't apply — wire your own. |
| `className` / `style` | — | Applied to the root element. |

> **Docked layout note:** a `docked` keyboard is `position: fixed` at the bottom
> of the viewport, so it overlays page content. Reserve space for it (e.g.
> bottom padding on your scroll container equal to the keyboard height) so the
> bar never covers the input it types into.
>
> **RTL:** give a layout `direction: "rtl"` and the keyboard renders mirrored
> (`dir="rtl"` on the root; rows flip via CSS, the data order is unchanged) and
> Arrow-key navigation mirrors with it (ArrowLeft → visually-left key). Home/End
> and Up/Down stay logical.

### `useVirtualKeyboard` options

| Option | Type | Description |
| ------ | ---- | ----------- |
| `layouts` | `KeyboardLayout \| KeyboardLayout[]` | Registered layouts (first is initial). Defaults to QWERTY. |
| `defaultLayout` | `string` | Name of the initial layout. |
| `value` / `defaultValue` / `onChange` | — | Controlled / uncontrolled value ownership. |
| `inputRef` | `RefObject<HTMLInputElement \| HTMLTextAreaElement>` | Ref-bound target. |
| `maxLength` | `number` | Reject inserts beyond this length. |
| `keyFilter` | `(key, nextValue) => boolean` | Reject an insertion. |
| `submitOnEnter` | `boolean` | Enter fires `onEnter` instead of a newline. |
| `onKeyPress` / `onEnter` / `onLayoutChange` | — | Callbacks. |

### `useVirtualKeyboard` returns

`value` (committed text), `composing` (the pending IME block, empty without a
`Composer`), `layout`, `layoutNames`, `modifiers`, and the stable actions
`press`, `insert`, `backspace`, `clear`, `setValue`, `setLayout`, `toggleShift`,
`toggleCapsLock`, plus prop-getters `getKeyboardProps`, `getRowProps`,
`getKeyProps`.

Also exported: `qwertyLayout`, `azertyLayout`, `qwertzLayout`, `dvorakLayout`,
`colemakLayout`, `numericLayout`, `phoneLayout`, `emailLayout`, `LATIN_VARIANTS`
(the shared accent map), `createLayout`, `resolveLayout`, `randomizeLayout`,
`identityComposer`, and all types. `randomizeLayout(layout, rng?)` is a pure, seedable Fisher–Yates shuffle
of a layout's char-key positions — inject an RNG for a deterministic /
reproducible pad.

The opt-in **`@usefy/virtual-keyboard/hangul`** subpath adds `hangulComposer` and
`hangulLayout` (Korean 두벌식) — see [IME Composition](#korean--ime-composition).

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

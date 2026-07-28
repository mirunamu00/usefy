# @usefy/virtual-keyboard

## 1.0.2

### Patch Changes

- @usefy/use-controllable-state@1.1.0
- @usefy/use-long-press@1.1.0
- @usefy/use-on-click-outside@1.1.0

## 1.0.1

### Patch Changes

- e143f2a: Fix broken theme selectors in the published stylesheet. The old dark-theme host rule used `:global(...)`, which the CSS-module scoper emits literally — an invalid pseudo-class that made browsers drop the entire rule (and left an unscoped `.keyboard.dark` selector shipping in the bundle as a hazard for CSS optimizers). The `[data-theme="dark"]` host hook is now a properly scoped rule and **works for the first time**: a keyboard with the default `theme="system"` under a `data-theme="dark"` ancestor now renders dark (previously it silently stayed light). An explicit `theme="light"` prop overrides a dark host theme (controlled-prop precedence, matching `@usefy/spotlight-tour`).

## 1.0.0

### Major Changes

- 8924240: usefy 1.0.0 — first stable release.

  All `@usefy/*` packages graduate to a stable **1.0.0** together (they share a
  fixed-version group). No API changes are required by this bump — it marks the
  public API as stable and ready for production semver guarantees.

  Also adds a `homepage` field to every published package, pointing at its page on
  the docs site (https://usefy-web.vercel.app) so the npm listing links straight
  to live docs.

### Patch Changes

- Updated dependencies [8924240]
  - @usefy/use-controllable-state@1.0.0
  - @usefy/use-long-press@1.0.0
  - @usefy/use-on-click-outside@1.0.0

## 0.25.1

### Patch Changes

- 89e484e: Docs: fix the "View Storybook Demo" link. The standalone component stories now sit at the top level of the Storybook sidebar (mirroring their top-level `packages/` directory) instead of under a "Components" group, so the demo URLs changed (`virtual-keyboard--…`, `memory-monitor--…`).
  - @usefy/use-controllable-state@0.25.1
  - @usefy/use-long-press@0.25.1
  - @usefy/use-on-click-outside@0.25.1

## 0.25.0

### Minor Changes

- 77daf95: Fix two VirtualKeyboard issues:

  - **Dvorak overflow** — the Dvorak bottom row packed 11 keys (Shift + 9 letters + Backspace), one more than the other layouts, so the last key overflowed the container at typical widths. Backspace now stays top-right and Shift moves onto the bottom mode row, keeping every row at ≤ 10 keys. All 26 letters and the `aoeuidhtns` home row are unchanged. A regression test asserts each built-in Latin row stays within 10 keys.
  - **No way to dismiss a floating/docked keyboard** — the panel now closes on a pointer press outside it, via the new `closeOnClickOutside` prop. It defaults to `true` when a `trigger` is present (otherwise `false`, so a trigger-less panel can't be dismissed with no way to reopen). The `trigger` (which toggles) and a bound `inputRef` are always excluded, so clicking either does not dismiss. Escape (while a key is focused) and toggling the trigger continue to work. Set `closeOnClickOutside={false}` to opt out.

### Patch Changes

- @usefy/use-controllable-state@0.25.0
- @usefy/use-long-press@0.25.0
- @usefy/use-on-click-outside@0.25.0

## 0.24.0

### Minor Changes

- 71982f3: Add Korean **두벌식 (dubeolsik) IME composition** and composing-text rendering.

  - New opt-in subpath `@usefy/virtual-keyboard/hangul` exporting `hangulComposer` (a full 한글 오토마타 — jamo assembly, compound vowels/finals, and final→initial migration) and `hangulLayout` (the 두벌식 layout, pre-wired with the composer). Tree-shakeable and style-free; the main entry is unchanged if you don't import it.
  - `useVirtualKeyboard` now exposes `composing` (the in-progress block, committed-free) and drives any layout's `composer`: character presses split into committed + composing, structural keys (Space/Enter/layout-switch) and `clear()` flush the pending block, and Backspace deletes one jamo at a time. `value`/`onChange` stay composition-free.
  - `VirtualKeyboard` renders the pending composition as an underlined `role="status"` preview while composing.
  - `Composer` gains an optional `backspace(state)` method for composition-aware deletion (non-breaking; `identityComposer` is unaffected).

- 71982f3: Add the Latin layout catalog: **AZERTY** (French), **QWERTZ** (German), **Dvorak**, and **Colemak** built-in layouts (`azertyLayout`, `qwertzLayout`, `dvorakLayout`, `colemakLayout`), plus a shared `LATIN_VARIANTS` accent map. Each ships the same 26 letters, `?123` symbol layer, and long-press accent variants as `qwertyLayout` — only the key arrangement differs.

### Patch Changes

- @usefy/use-controllable-state@0.24.0
- @usefy/use-long-press@0.24.0
- @usefy/use-on-click-outside@0.24.0

## 0.23.0

### Minor Changes

- 4ef6513: Add `@usefy/virtual-keyboard` — an on-screen virtual keyboard for React with a declarative layout engine, a headless `useVirtualKeyboard` hook, and enterprise accessibility.

  **Core**

  - Styled `VirtualKeyboard` component + headless `useVirtualKeyboard` hook (also exposed via a CSS-free `./headless` subpath entry). Opt-in `./styles.css`.
  - Three input modes: event-emit, controlled/uncontrolled `value`, and ref-bound (caret/selection tracking).
  - Declarative layout engine (`createLayout`, `resolveLayout`, `randomizeLayout`) with built-in QWERTY / numeric / phone / email layouts, one-shot Shift, sticky Caps Lock, and a symbol layer.
  - `Composer` seam (default `identityComposer`) for future IME layouts.
  - CSS-variable theming (`--usefy-vk-*`), light/dark, SSR-safe, 44px targets.

  **Placement & visibility**

  - `variant` inline / docked / floating, with `zIndex` for the fixed variants.
  - Open/close state (`open` / `defaultOpen` / `onOpenChange`) and an accessible `trigger` (with `triggerLabel`) that toggles the keyboard (`aria-expanded` / `aria-controls`); Escape closes and returns focus to the trigger.

  **Gestures**

  - `enableVariants` — long-press / right-click accent-variants popup (a WAI-ARIA menu; arrow-nav, Escape, focus return).
  - `enableKeyRepeat` — Backspace auto-repeat while held (leak-free timers).
  - `randomize` — per-mount Fisher–Yates shuffle of char-key positions for secure PIN pads (exported pure, seedable `randomizeLayout`).

  **Feedback & RTL**

  - `sound` (synthesized Web Audio click, no asset, lazy AudioContext) and `haptics` (`navigator.vibrate`), both capability-guarded and off by default.
  - RTL: `direction: "rtl"` layouts render mirrored (`dir="rtl"`) with mirrored arrow-key navigation.

  Accessibility throughout: `role="group"`, real `<button>` keys with accessible names, `aria-pressed` modifiers, roving-tabindex arrow-key navigation (mirrored under RTL).

### Patch Changes

- @usefy/use-controllable-state@0.23.0
- @usefy/use-long-press@0.23.0
- @usefy/use-on-click-outside@0.23.0

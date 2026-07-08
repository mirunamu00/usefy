# @usefy/virtual-keyboard

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

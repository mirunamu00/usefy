# VirtualKeyboard Component Specification

## Overview

**Package Name:** `@usefy/virtual-keyboard` (component) — built on `@usefy/use-virtual-keyboard` (headless hook)
**Version:** `0.1.0`
**Status:** Draft
**Created:** 2026-07-07
**Author:** usefy team

---

## 1. Executive Summary

### 1.1 Purpose

`VirtualKeyboard` is a React on-screen (virtual) keyboard — the kind you click open next to a search box (e.g. YouTube's keyboard icon) so a user can type with the **mouse, touch, or a pointer/remote** instead of a physical keyboard. It renders a fully interactive keyboard UI, emits keystrokes to any input, and ships a declarative **layout engine** so teams can support new alphabets and custom key sets without forking the component.

### 1.2 Target Users

- **Kiosk / POS / signage** apps where no physical keyboard exists (touch-only).
- **Smart-TV / set-top / remote-driven** UIs (D-pad navigation over an on-screen keyboard).
- **Accessibility** scenarios — users who operate a pointer or switch device rather than a keyboard.
- **Security-sensitive inputs** (PIN pads) that want to avoid physical keyloggers and randomize key positions.
- **Search boxes** wanting a discoverable "type without a keyboard" affordance.

### 1.3 Key Value Propositions

1. **Bring-your-own-input**: attach to any `<input>`/`<textarea>` by ref, *or* run controlled, *or* just consume raw key events — no lock-in.
2. **Declarative layout engine**: layouts are data (rows of key definitions), not hard-coded JSX. Built-ins for QWERTY/numeric/phone/email plus a first-class custom-layout API.
3. **Enterprise a11y**: WCAG 2.1 AA — the on-screen keyboard is itself operable by physical keyboard, D-pad, and screen readers, with correct roles and live regions.
4. **Themeable & RTL-ready**: CSS-variable theming, light/dark, and right-to-left layout support.
5. **Composition-ready architecture**: a pluggable `Composer` seam so future IME layouts (Korean Hangul 두벌식, etc.) drop in without an API break.
6. **Headless core**: `useVirtualKeyboard` exposes all state + prop-getters so consumers can build a bespoke UI while reusing the engine.

---

## 2. Scope & Non-Goals

### 2.1 In scope (v0.1.0 — MVP)

- On-screen keyboard component with mouse/touch/pointer input.
- Modifier keys: **Shift**, **Caps Lock**, and a **symbol/second layer** (AltGr-style).
- Action keys: Backspace, Enter, Space, Tab, Clear, layout-switch, and Hide/Close.
- Built-in layouts: **US-QWERTY**, **numeric pad**, **phone pad**, **email** (adds `@`/`.com` conveniences).
- Custom layout API (author a layout as data).
- Input binding modes: **event-emit (BYO input)**, **ref-bound to a target element**, and **controlled/uncontrolled value**.
- Long-press / hold **accent variants** popup (e.g. `a` → à á â ä).
- Theming (CSS variables, light/dark), RTL, responsive sizing.
- Full a11y + keyboard/D-pad operability of the on-screen keyboard.

### 2.2 Out of scope for MVP (architected for, shipped later — see §6)

- **IME composition** (Hangul jamo combining, Japanese kana→kanji, Pinyin). The `Composer` interface is defined in v0.1.0 and defaults to a 1:1 pass-through; concrete composers ship in a later phase.
- Handwriting / gesture / swipe-typing input.
- Predictive text / autocomplete / suggestion bar.
- Built-in multilingual layout **catalog** beyond the Latin set (AZERTY/QWERTZ/Dvorak land in Phase 4; CJK is composition-dependent and later).

### 2.3 Explicit non-goals

- Not a replacement for the OS IME on devices that have one.
- No network calls, no telemetry, no external layout downloads.

---

## 3. Functional Requirements

### 3.1 Core keyboard

| Feature | Description | Priority |
|---------|-------------|----------|
| Render keyboard | Render rows of keys from a layout definition | P0 |
| Key press → emit | Clicking/tapping a key emits its value & fires callbacks | P0 |
| Backspace | Delete char before caret (respects selection) | P0 |
| Enter | Emit newline / fire `onEnter` (configurable submit) | P0 |
| Space / Tab / Clear | Standard action keys | P0 |
| Shift | One-shot uppercase / shifted symbol for next key | P0 |
| Caps Lock | Sticky uppercase toggle | P0 |
| Symbol layer | Toggle to a second layer (numbers/symbols) | P0 |
| Layout switch | Key that swaps to another named layout | P1 |
| Hide/Close | Key + API to dismiss the keyboard | P1 |
| Accent variants | Long-press a key to pick an alternate glyph | P2 |
| Key repeat | Hold Backspace/arrows to auto-repeat | P2 |

### 3.2 Input integration (all three modes supported)

| Mode | Behavior | Priority |
|------|----------|----------|
| **Event-emit** | Fire `onChange(value)`, `onKeyPress(key)`, `onEnter`; consumer owns the input | P0 |
| **Ref-bound** | Pass `inputRef` — keyboard writes into that `<input>`/`<textarea>`, tracking caret & selection | P0 |
| **Controlled** | `value` + `onChange` own the string | P0 |
| **Uncontrolled** | `defaultValue`, keyboard keeps internal state | P0 |
| Caret/selection aware | Insert/delete at the caret, replace selection ranges | P1 |
| `maxLength` / filter | Enforce max length and an optional per-key filter | P2 |

### 3.3 Layout engine

| Feature | Description | Priority |
|---------|-------------|----------|
| Data-driven layout | A layout is `rows: KeyDefinition[][]` (see §4.1) | P0 |
| Modifier resolution | Resolve display + emitted value from shift/caps/layer | P0 |
| Built-in layouts | QWERTY, numeric, phone, email | P0 |
| Custom layout API | Consumers author & pass their own layout(s) | P0 |
| Multiple registered layouts | Switch between named layouts at runtime | P1 |
| **Randomized layout** | Shuffle key positions per mount (secure PIN pads) | P2 |
| Composer seam | Pluggable `Composer` for future IME (§4.4) | P1 (interface only in MVP) |

### 3.4 UI / interaction

| Feature | Description | Priority |
|---------|-------------|----------|
| Docked/floating | Render inline, docked to bottom, or as a floating panel | P1 |
| Show/hide + trigger | Optional trigger button (the "keyboard icon" affordance) | P1 |
| Pointer feedback | Active/pressed visual state, ripple optional | P1 |
| Sound/haptics | Optional key click sound / vibration | P3 |
| Responsive sizing | Scales to container; min touch target 44×44px | P0 |
| RTL | Right-to-left layouts render mirrored | P2 |

### 3.5 Theming & environment

| Feature | Description | Priority |
|---------|-------------|----------|
| CSS-variable theming | All colors/sizing via `--usefy-vk-*` vars | P0 |
| Light/Dark/System | Theme prop + auto detection | P1 |
| `className`/`style` slots | Per-part class overrides (keyboard, row, key) | P1 |
| SSR safe | Renders inertly on the server, no `window` at import | P0 |

---

## 4. Technical Specifications

### 4.1 Layout & key model

```typescript
/** A single key on the keyboard. */
export interface KeyDefinition {
  /** Value emitted / inserted when pressed (e.g. "a", " ", "Enter"). */
  key: string;
  /** Display label; defaults to `key`. Can be a node (icon for action keys). */
  label?: React.ReactNode;
  /** Physical KeyboardEvent.code equivalent, for event synthesis & D-pad. */
  code?: string;
  /** Relative width in flex units (1 = a standard key). */
  width?: number;
  /** Semantic type — drives styling and behavior. */
  type?: 'char' | 'action' | 'modifier' | 'spacer';
  /** For action/modifier keys, the built-in behavior to run. */
  action?: KeyAction;
  /** Value emitted when Shift is active (e.g. "A", "!"). */
  shiftKey?: string;
  /** Value emitted on the symbol layer, if different. */
  layerKey?: string;
  /** For layout-switch keys: the target layout name. */
  targetLayout?: string;
  /** Long-press alternates (accents), e.g. ["à","á","â","ä"]. */
  variants?: string[];
  /** Explicit ARIA label (falls back to a humanized `key`). */
  ariaLabel?: string;
  /** Disable this key. */
  disabled?: boolean;
}

export type KeyAction =
  | 'backspace' | 'enter' | 'space' | 'tab' | 'clear'
  | 'shift' | 'capslock' | 'layer' | 'layout-switch' | 'hide';

/** A named, data-driven keyboard layout. */
export interface KeyboardLayout {
  /** Unique layout name (used by layout-switch keys). */
  name: string;
  /** Human label for the layout picker. */
  label?: string;
  /** Text direction. */
  direction?: 'ltr' | 'rtl';
  /** Rows of keys, top to bottom. */
  rows: KeyDefinition[][];
  /** Optional composer for IME layouts (default: identity). */
  composer?: Composer;
}

/** Layout after modifier resolution — what the renderer draws. */
export interface ResolvedLayout {
  name: string;
  direction: 'ltr' | 'rtl';
  rows: ResolvedKey[][];
}

export interface ResolvedKey extends KeyDefinition {
  /** The label to actually show given current modifiers. */
  displayLabel: React.ReactNode;
  /** The value that will be emitted given current modifiers. */
  effectiveValue: string;
  /** Whether this key is a currently-active modifier (for styling). */
  active?: boolean;
}
```

### 4.2 Headless hook API

```typescript
export interface UseVirtualKeyboardOptions {
  /** Registered layouts (or a single layout). First is the initial layout. */
  layouts?: KeyboardLayout | KeyboardLayout[];
  /** Name of the initial layout (defaults to the first). */
  defaultLayout?: string;

  // --- value ownership (choose one style) ---
  value?: string;                 // controlled
  defaultValue?: string;          // uncontrolled seed
  onChange?: (value: string) => void;

  // --- input binding ---
  /** Target input/textarea to write into (ref-bound mode). */
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;

  // --- behavior ---
  maxLength?: number;
  keyFilter?: (key: string, nextValue: string) => boolean;
  /** Enter submits instead of inserting a newline. */
  submitOnEnter?: boolean;

  // --- callbacks ---
  onKeyPress?: (key: KeyDefinition, event: VirtualKeyEvent) => void;
  onEnter?: (value: string) => void;
  onLayoutChange?: (name: string) => void;
}

export interface UseVirtualKeyboardReturn {
  /** Current string value (controlled or internal). */
  value: string;
  /** Current resolved layout to render. */
  layout: ResolvedLayout;
  /** All registered layout names. */
  layoutNames: string[];
  /** Active modifier state. */
  modifiers: { shift: boolean; capsLock: boolean; layer: boolean };

  // --- imperative controls (all useCallback-stable) ---
  /** Simulate pressing a key (what the UI calls on click). */
  press: (key: KeyDefinition) => void;
  /** Insert an arbitrary string at the caret. */
  insert: (text: string) => void;
  backspace: () => void;
  clear: () => void;
  setValue: (value: string) => void;
  setLayout: (name: string) => void;
  toggleShift: () => void;
  toggleCapsLock: () => void;

  // --- prop getters for custom UIs (a11y baked in) ---
  getKeyboardProps: () => React.HTMLAttributes<HTMLElement>;
  getRowProps: (rowIndex: number) => React.HTMLAttributes<HTMLElement>;
  getKeyProps: (key: ResolvedKey) => React.ButtonHTMLAttributes<HTMLButtonElement>;
}

export function useVirtualKeyboard(
  options?: UseVirtualKeyboardOptions,
): UseVirtualKeyboardReturn;
```

`VirtualKeyEvent` is a lightweight synthetic descriptor (`{ key, code, shiftKey, layer }`) — deliberately **not** a real `KeyboardEvent`, so it's SSR-safe and testable, but shaped familiarly.

### 4.3 Component API

```typescript
export interface VirtualKeyboardProps extends UseVirtualKeyboardOptions {
  // --- presentation ---
  /** Layout placement. */
  variant?: 'inline' | 'docked' | 'floating';
  /** Show state for controlled visibility (floating/docked). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional trigger (the "keyboard icon" button). */
  trigger?: React.ReactNode;

  // --- theming ---
  theme?: 'light' | 'dark' | 'system';
  /** Per-part class overrides. */
  classNames?: Partial<Record<'root' | 'row' | 'key' | 'keyActive' | 'popup', string>>;
  /** Render a key yourself (advanced). */
  renderKey?: (key: ResolvedKey, defaultProps: React.ButtonHTMLAttributes<HTMLButtonElement>) => React.ReactNode;

  // --- interaction ---
  /** Enable long-press accent variants. */
  enableVariants?: boolean;
  /** Enable key auto-repeat on hold. */
  enableKeyRepeat?: boolean;
  /** Shuffle key order on mount (secure PIN pads). */
  randomize?: boolean;
  /** Optional key click sound. */
  sound?: boolean;
  /** z-index for floating/docked variants. */
  zIndex?: number;
  className?: string;
  style?: React.CSSProperties;
}
```

### 4.4 Composer (IME seam — interface in MVP, implementations later)

```typescript
/**
 * Transforms a raw key press into committed + composing text.
 * MVP ships the identity composer (1:1). Future: HangulComposer, etc.
 */
export interface Composer {
  /** Apply a key to the current composing buffer. */
  input(state: ComposerState, key: string): ComposerResult;
  /** Flush any pending composition (e.g. on space/enter/blur). */
  flush(state: ComposerState): ComposerResult;
  reset(): ComposerState;
}

export interface ComposerState { buffer: string; }
export interface ComposerResult {
  /** Text to commit into the value. */
  committed: string;
  /** Text still being composed (shown but not committed). */
  composing: string;
  next: ComposerState;
}
```

### 4.5 Exported surface

```typescript
// Component: @usefy/virtual-keyboard
export { VirtualKeyboard } from './VirtualKeyboard';
export type { VirtualKeyboardProps } from './VirtualKeyboard';

// Headless (re-exported from @usefy/use-virtual-keyboard)
export { useVirtualKeyboard } from '@usefy/use-virtual-keyboard';
export type {
  UseVirtualKeyboardOptions, UseVirtualKeyboardReturn,
  KeyDefinition, KeyAction, KeyboardLayout, ResolvedLayout, ResolvedKey,
  VirtualKeyEvent, Composer, ComposerState, ComposerResult,
} from '@usefy/use-virtual-keyboard';

// Built-in layouts + helpers
export {
  qwertyLayout, numericLayout, phoneLayout, emailLayout,
  createLayout, resolveLayout, identityComposer,
} from '@usefy/use-virtual-keyboard';
```

### 4.6 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@usefy/use-virtual-keyboard` | workspace:* | Headless engine (state, layouts, composer) |
| `react` / `react-dom` | ^18 \|\| ^19 | Peer dependencies |
| `clsx` | ^2.1.1 | Conditional class names |

> No chart/heavy deps. Styling is SCSS-modules compiled + injected at runtime (memory-monitor's tsup pipeline), so **no CSS import is required** by consumers, though a `./styles.css` export is provided for opt-in extraction.

### 4.7 Browser / environment support

| Environment | Support | Notes |
|-------------|---------|-------|
| Chrome/Edge/Firefox/Safari (evergreen) | Full | Pointer + touch events |
| Touch devices / kiosks | Full | 44px min targets, touch-action tuned |
| Smart-TV / D-pad | Full | Roving tabindex, arrow-key navigation |
| SSR (Next/Remix) | Safe | Inert render; no `window`/`document` at import |
| No physical keyboard | Full | That's the point |

---

## 5. Architecture

### 5.1 Two-package split (house pattern)

```
@usefy/use-virtual-keyboard   (packages/hooks/use-virtual-keyboard)  ← headless engine
        ▲  consumed by
        │
@usefy/virtual-keyboard       (packages/virtual-keyboard)           ← styled component
```

Mirrors `@usefy/use-memory-monitor` → `@usefy/memory-monitor`. The hook holds the layout engine, modifier state, value/caret logic, and the `Composer` seam; the component is presentation + interaction only.

### 5.2 Component file structure

```
packages/virtual-keyboard/
├── src/
│   ├── index.ts                     # public exports (re-exports hook surface)
│   ├── VirtualKeyboard.tsx          # main component (consumes the hook)
│   ├── VirtualKeyboard.module.scss
│   ├── components/
│   │   ├── Key/Key.tsx              # single key button
│   │   ├── Key/Key.module.scss
│   │   ├── Row/Row.tsx             # a keyboard row
│   │   ├── VariantsPopup/          # long-press accent picker
│   │   └── Trigger/                # the "keyboard icon" button
│   ├── hooks/
│   │   ├── useLongPress.ts         # variant popup / key repeat
│   │   ├── useRovingFocus.ts       # D-pad / arrow navigation
│   │   └── useTheme.ts             # light/dark/system
│   ├── styles/
│   │   ├── _variables.scss         # --usefy-vk-* CSS vars
│   │   └── _mixins.scss
│   └── constants.ts
├── package.json                     # @usefy/virtual-keyboard, ./styles.css export, sideEffects ["*.css"]
├── tsup.config.ts                   # cloned from memory-monitor (SCSS modules + inject)
├── vitest.config.ts / vitest.setup.ts
├── tsconfig.json
├── SPEC.md                          # this document
└── README.md
```

### 5.3 Hook (engine) file structure

```
packages/hooks/use-virtual-keyboard/
├── src/
│   ├── index.ts
│   ├── useVirtualKeyboard.ts        # the hook
│   ├── engine/
│   │   ├── resolveLayout.ts         # modifiers → ResolvedLayout (pure)
│   │   ├── applyKey.ts              # value/caret transform for a key (pure)
│   │   └── createLayout.ts          # authoring helper (pure)
│   ├── layouts/
│   │   ├── qwerty.ts / numeric.ts / phone.ts / email.ts
│   ├── composer/
│   │   └── identity.ts             # identityComposer (1:1)
│   ├── types.ts
│   └── *.test.ts
```

Pure functions (`resolveLayout`, `applyKey`, layout builders) are unit-tested in isolation — the cheapest, highest-signal coverage.

### 5.4 State & data flow

```
   Pointer / Touch / D-pad
            │  press(key)
            ▼
 ┌───────────────────────────┐
 │   useVirtualKeyboard      │
 │  ┌─────────────────────┐  │
 │  │ modifiers (shift…)  │──┼──► resolveLayout() ──► ResolvedLayout ──► render
 │  ├─────────────────────┤  │
 │  │ value + caret       │  │
 │  │ applyKey() + Composer│ │
 │  └─────────────────────┘  │
 └───────────┬───────────────┘
             │ onChange / onKeyPress / onEnter
             ▼            │
      consumer state   inputRef.current (ref-bound: write value, restore caret)
```

Caret handling: in ref-bound mode the hook reads `selectionStart/End` from the target element, applies the edit, writes `value`, and restores the caret via `setSelectionRange` in a layout effect.

---

## 6. Development Milestones

### Phase 1 — Headless engine (`@usefy/use-virtual-keyboard`)

- [ ] Package scaffold (via `add-usefy-hook`).
- [ ] Types: `KeyDefinition`, `KeyboardLayout`, `Composer`, options/return.
- [ ] Pure `resolveLayout` (shift/caps/layer) + `applyKey` (insert/backspace/caret) + tests.
- [ ] `identityComposer`; wire the composer seam (no-op).
- [ ] Built-in layouts: QWERTY, numeric, phone, email.
- [ ] `useVirtualKeyboard` with all three input modes + prop-getters.
- [ ] 90%+ coverage; umbrella wiring; story; READMEs; changeset.

### Phase 2 — Styled component MVP (`@usefy/virtual-keyboard`)

- [ ] Package scaffold (via `add-usefy-component`, SCSS-modules tsup).
- [ ] `Key`, `Row`, keyboard container; CSS-var theming + light/dark.
- [ ] Pointer/touch press feedback; responsive sizing (44px targets).
- [ ] `inline` variant; controlled/uncontrolled/ref-bound wired through.
- [ ] a11y: roles, `aria-*`, roving focus / arrow-key nav; Escape to hide.
- [ ] Tests (component + a11y), Storybook, READMEs, changeset.

### Phase 3 — Interaction polish

- [ ] `docked` + `floating` variants, trigger button, `open`/`onOpenChange`.
- [ ] Long-press accent variants popup; key auto-repeat.
- [ ] `randomize` (secure PIN pad); `renderKey`/`classNames` slots.
- [ ] Sound/haptics (optional); RTL.

### Phase 4 — Layout catalog & composition

- [ ] Latin layout catalog: AZERTY, QWERTZ, Dvorak, Colemak.
- [ ] Ship a concrete `Composer` (Hangul 두벌식) as a **separate** entry/export; docs.
- [ ] Composing-text rendering (underline pending composition).

---

## 7. Testing Strategy

### 7.1 Engine (pure) unit tests

```typescript
describe('resolveLayout', () => {
  it('uppercases char keys under capsLock');
  it('emits shiftKey when shift is active, then clears one-shot shift');
  it('swaps to the symbol layer and back');
});

describe('applyKey', () => {
  it('inserts a char at the caret and advances the caret');
  it('backspace deletes the char before the caret');
  it('backspace/insert replaces the active selection range');
  it('respects maxLength and keyFilter');
});
```

### 7.2 Hook tests (`renderHook`/`act`)

- All three input modes (event-emit, controlled, ref-bound to a real `<input>`).
- Caret/selection restoration after edits.
- Modifier lifecycle (one-shot shift, sticky caps, layer toggle).
- `press` for every action key; `onEnter`/`submitOnEnter`.
- Reference stability: `press`/`insert`/getters stable across rerenders.
- Composer seam: identity composer passes through unchanged.

### 7.3 Component & a11y tests

- Renders a layout; clicking a key emits and updates the bound input.
- Keyboard operability: Tab/arrow-key roving focus, Enter/Space activate a key, Escape hides.
- ARIA: `role="group"`/`aria-label` on the keyboard, `aria-pressed` on active modifiers, min 44px targets.
- SSR smoke: renders without `window`.

### 7.4 Storybook

- Inline QWERTY bound to a search box (the YouTube-style demo).
- Numeric PIN pad with `randomize`.
- Custom layout authored via `createLayout`.
- Dark theme + RTL + floating variant with a trigger.
- `play` tests exercising click-to-type and modifier toggles.

---

## 8. Performance Considerations

- `resolveLayout`/key lists memoized on `(layout, modifiers)`; keys are `React.memo`.
- All handlers/getters `useCallback`-stable; a stable actions object for effect-dep safety.
- Pointer events over synthetic re-renders; a single delegated handler where feasible.
- No layout thrash on caret restore (single `useLayoutEffect`).
- Target bundle: **< 15KB gzipped** for the component (excluding React); engine **< 6KB**.

---

## 9. Accessibility (WCAG 2.1 AA)

- The on-screen keyboard is **itself keyboard-operable** (roving tabindex + arrow keys), so it never traps pointer-only users *or* keyboard users.
- `role="group"` + `aria-label="On-screen keyboard"`; each key is a real `<button>` with an accessible name (icon keys get `aria-label`).
- Modifier keys expose `aria-pressed`; layer/layout switches announce state.
- Live region announces committed characters / composing text for screen readers (opt-in, throttled).
- Minimum target size 44×44 CSS px; visible focus ring; respects `prefers-reduced-motion` and `prefers-color-scheme`.
- Sufficient contrast in both themes (verified against AA).

---

## 10. Security Considerations

- No network, no telemetry, no persistence by default.
- `randomize` mode shuffles key positions each mount to frustrate positional shoulder-surfing/keyloggers on PIN pads.
- CSP-friendly: styles are class-based (no inline `style` for theming beyond CSS vars); runtime style injection uses a single de-duplicated `<style>` (SSR-guarded, idempotent).

---

## 11. Documentation Requirements

- **README** (component): install, the search-box quick start, all three input modes, custom-layout recipe, theming vars, a11y notes.
- **README** (hook): headless quick start + prop-getter usage.
- **Storybook**: the demos in §7.4 with real, copy-pasteable "Show code".
- **JSDoc**: every exported type/function with a runnable `@example`.

---

## 12. Success Criteria

### 12.1 Functional

- [ ] Click/tap types into a bound `<input>` with correct caret behavior.
- [ ] Shift/Caps/layer resolve correct glyphs; action keys behave.
- [ ] Built-in layouts + a custom layout both render and switch.
- [ ] Works with mouse, touch, and D-pad/arrow keys.

### 12.2 Non-functional

- [ ] Engine 90%+ coverage; component tested (central config or `pnpm --filter`).
- [ ] WCAG 2.1 AA; verified keyboard + screen-reader operability.
- [ ] SSR-safe; React 18 **and** 19; TypeScript strict.
- [ ] Component < 15KB gz, engine < 6KB gz.
- [ ] Zero required peer deps beyond React.

---

## 13. Resolved Decisions

1. **Package naming** — `@usefy/virtual-keyboard` (component) + `@usefy/use-virtual-keyboard` (engine). ✅ Confirmed.
2. **Enter default** — insert newline by default; `submitOnEnter` opt-in fires `onEnter` instead. ✅ Confirmed.
3. **Variants popup** — long-press to open **and** a visible corner indicator (a small dot) on keys that have variants, so pointer users without press-and-hold discover them; a right-click / secondary-tap also opens the popup. ✅ Confirmed.
4. **Composer packaging** — future concrete composers (Hangul 두벌식, …) ship as **subpath exports of the engine** (`@usefy/use-virtual-keyboard/hangul`), tree-shakeable and opt-in; the `Composer` interface stays in the main entry. ✅ Confirmed.
5. **Styling** — SCSS modules compiled + runtime-injected (memory-monitor tsup parity), themeable via `--usefy-vk-*` CSS variables; a `./styles.css` export is also provided for opt-in extraction. ✅ Confirmed.
6. **Hangul / IME scope** — **out of MVP**, delivered in Phase 4. The `Composer` seam ships in v0.1.0 (default `identityComposer`) so IME plugs in later with no breaking API change. Rationale: composition is high-risk and would balloon the MVP; the seam de-risks the deferral.

---

## 14. Appendix

### A. Related packages

- `@usefy/use-virtual-keyboard` — headless engine (this component's core).
- `@usefy/memory-monitor` — the reference component for build/SCSS/tsup parity.

### B. References

- [WAI-ARIA APG: Keyboard interface patterns](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: KeyboardEvent.code / .key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [WCAG 2.1 — Target Size (2.5.5) & Keyboard (2.1.1)](https://www.w3.org/WAI/WCAG21/quickref/)

### C. Glossary

| Term | Definition |
|------|------------|
| Layout | Data describing rows of keys for one keyboard state |
| Modifier | Shift / Caps Lock / symbol layer that changes emitted values |
| Composer | Pluggable transform turning key presses into committed + composing text (IME) |
| Roving tabindex | A11y pattern where one child is tabbable and arrows move focus |
| Ref-bound | Mode where the keyboard writes into a consumer-owned input element |

---

*Document Version: 1.0*
*Last Updated: 2026-07-07*

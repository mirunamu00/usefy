---
"@usefy/virtual-keyboard": minor
---

Add Korean **두벌식 (dubeolsik) IME composition** and composing-text rendering.

- New opt-in subpath `@usefy/virtual-keyboard/hangul` exporting `hangulComposer` (a full 한글 오토마타 — jamo assembly, compound vowels/finals, and final→initial migration) and `hangulLayout` (the 두벌식 layout, pre-wired with the composer). Tree-shakeable and style-free; the main entry is unchanged if you don't import it.
- `useVirtualKeyboard` now exposes `composing` (the in-progress block, committed-free) and drives any layout's `composer`: character presses split into committed + composing, structural keys (Space/Enter/layout-switch) and `clear()` flush the pending block, and Backspace deletes one jamo at a time. `value`/`onChange` stay composition-free.
- `VirtualKeyboard` renders the pending composition as an underlined `role="status"` preview while composing.
- `Composer` gains an optional `backspace(state)` method for composition-aware deletion (non-breaking; `identityComposer` is unaffected).

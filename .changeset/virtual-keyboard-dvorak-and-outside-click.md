---
"@usefy/virtual-keyboard": minor
---

Fix two VirtualKeyboard issues:

- **Dvorak overflow** — the Dvorak bottom row packed 11 keys (Shift + 9 letters + Backspace), one more than the other layouts, so the last key overflowed the container at typical widths. Backspace now stays top-right and Shift moves onto the bottom mode row, keeping every row at ≤ 10 keys. All 26 letters and the `aoeuidhtns` home row are unchanged. A regression test asserts each built-in Latin row stays within 10 keys.
- **No way to dismiss a floating/docked keyboard** — the panel now closes on a pointer press outside it, via the new `closeOnClickOutside` prop. It defaults to `true` when a `trigger` is present (otherwise `false`, so a trigger-less panel can't be dismissed with no way to reopen). The `trigger` (which toggles) and a bound `inputRef` are always excluded, so clicking either does not dismiss. Escape (while a key is focused) and toggling the trigger continue to work. Set `closeOnClickOutside={false}` to opt out.

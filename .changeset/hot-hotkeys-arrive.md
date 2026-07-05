---
"@usefy/use-hotkeys": minor
"@usefy/hooks": minor
---

feat(use-hotkeys): add useHotkeys hook for high-level keyboard shortcuts

- Register a hotkey string or an array of them against a single handler: `useHotkeys("mod+k", handler, { enabled })`, `useHotkeys(["mod+s", "ctrl+p"], handler)`.
- Combos (`"ctrl+shift+p"`, `"shift+?"`, `"Escape"`), space-separated sequences (`"g i"`, `"g g"`) with a configurable `sequenceTimeoutMs`, and a cross-platform `mod` alias (Cmd on macOS, Ctrl elsewhere; overridable via `mac`).
- Exact modifier matching, an input-field guard (`enableOnFormTags`), scoping to `document`/`window`/element/ref, `eventType`, and `preventDefault`.
- Built on `@usefy/use-event-listener` + `@usefy/use-latest`; SSR-safe and StrictMode-safe with full listener/timer cleanup. Also exports `parseHotkey`, `isMacPlatform`, `isHotkeysSupported`.

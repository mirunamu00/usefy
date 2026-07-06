---
"@usefy/use-controllable-state": minor
"@usefy/hooks": minor
---

Fix `useControllableState` setter identity so it is genuinely stable in **controlled** mode. Previously the setter listed `controlledValue` in its `useCallback` deps, so it got a new identity on every render where the controlled prop changed — despite the docs promising a permanent identity — causing extra renders / effect re-runs for consumers that pass it to `React.memo` children or effect dependency arrays. The setter now reads the current mode and controlled value from refs (the Radix pattern), so its identity is constant for the component's lifetime in both modes while still resolving updater functions against the freshest prop. Also **removed the internal `isUpdater` and `useCallbackRef` helpers from the package's public entry point** — they were never documented and `useCallbackRef` duplicates `@usefy/use-event-callback`; they remain internal. Added controlled-mode setter-stability tests and a StrictMode test.

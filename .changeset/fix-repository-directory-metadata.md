---
"@usefy/hooks": patch
"@usefy/memory-monitor": patch
"@usefy/use-click-any-where": patch
"@usefy/use-controllable-state": patch
"@usefy/use-copy-to-clipboard": patch
"@usefy/use-counter": patch
"@usefy/use-debounce": patch
"@usefy/use-debounce-callback": patch
"@usefy/use-disclosure": patch
"@usefy/use-event-listener": patch
"@usefy/use-geolocation": patch
"@usefy/use-init": patch
"@usefy/use-intersection-observer": patch
"@usefy/use-local-storage": patch
"@usefy/use-memory-monitor": patch
"@usefy/use-merged-refs": patch
"@usefy/use-on-click-outside": patch
"@usefy/use-session-storage": patch
"@usefy/use-signal": patch
"@usefy/use-throttle": patch
"@usefy/use-throttle-callback": patch
"@usefy/use-timer": patch
"@usefy/use-toggle": patch
"@usefy/use-unmount": patch
---

Fix incorrect npm package-provenance metadata. The `repository.directory` field pointed at non-existent paths for these packages (e.g. `packages/use-toggle` instead of `packages/hooks/use-toggle`, and the `@usefy/hooks` umbrella pointed at `packages/usefy`), which broke the "source" link on each npm package page. Each now points at its real location in the monorepo. Additionally, `@usefy/memory-monitor` had its `repository.url`, `bugs.url`, and `homepage` pointing at a non-existent `usefy/usefy` GitHub org and a wrong `packages/components/...` path — these are corrected to `mirunamu00/usefy` and `packages/kits/memory-monitor`. Metadata-only; no code or runtime change.

# @usefy/use-page-visibility

## 0.21.1

## 0.21.0

## 0.20.0

### Minor Changes

- 65b754f: feat(use-page-visibility): add usePageVisibility hook for tab focus/blur via the Page Visibility API

  Adds `@usefy/use-page-visibility`, a hook that reports whether the page (tab/window)
  is currently visible to the user:

  - Boolean-first API — `const visible = usePageVisibility()` returns a plain
    `boolean` (`true` = foreground, `false` = hidden), updated on the document
    `visibilitychange` event.
  - Optional `onChange` callback — `usePageVisibility((visible) => …)` fires on
    each transition (never on mount) and is read through a ref, so replacing it
    never re-subscribes the listener.
  - Built on `useSyncExternalStore` — tear-free under concurrent rendering and
    SSR-safe (returns `true` on the server, no hydration mismatch).
  - Leak-free: the `visibilitychange` listener is registered once and removed on
    unmount.
  - Exports the `PageVisibilityState`, `OnVisibilityChange`, and
    `UsePageVisibilityReturn` types plus helpers (`getPageVisibility`,
    `getVisibilityState`, `isPageVisibilitySupported`, `SERVER_PAGE_VISIBILITY`).
  - Re-exported from the `@usefy/hooks` umbrella.

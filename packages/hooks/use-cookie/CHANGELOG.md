# @usefy/use-cookie

## 1.1.0

## 1.0.0

### Major Changes

- 8924240: usefy 1.0.0 — first stable release.

  All `@usefy/*` packages graduate to a stable **1.0.0** together (they share a
  fixed-version group). No API changes are required by this bump — it marks the
  public API as stable and ready for production semver guarantees.

  Also adds a `homepage` field to every published package, pointing at its page on
  the docs site (https://usefy-web.vercel.app) so the npm listing links straight
  to live docs.

## 0.25.1

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.0

## 0.21.1

## 0.21.0

## 0.20.0

## 0.19.0

### Minor Changes

- f561890: feat(use-cookie): add @usefy/use-cookie hook

  Read and write a browser cookie as React state — the cookie sibling of
  `@usefy/use-local-storage` and `@usefy/use-session-storage`, completing the
  storage trio with a matching API. Returns a `[value, setValue, remove]` tuple:
  `setValue` writes `document.cookie` (with `encodeURIComponent` and the standard
  attributes) and supports a functional updater, while `remove` deletes the cookie
  and resets state to `initialValue`. Values are JSON-serialized by default with a
  graceful fallback to the raw string, so plain (non-JSON) cookies never throw.
  Supports the full set of cookie write attributes (`expires` as a `Date` or days,
  `maxAge`, `path`, `domain`, `secure`, `sameSite`), is SSR-safe (guards all
  `document` access and returns `initialValue` on the server via
  `useSyncExternalStore`, exactly like its storage siblings), and keeps
  same-document `useCookie(key)` instances in sync via an internal subscription.
  Cookie-string construction is extracted into pure, unit-tested helpers.
  `setValue`/`remove` are referentially stable and StrictMode-safe. Cross-tab
  writes are not observed (cookies have no `storage` event) — documented, not
  faked. Re-exported from the `@usefy/hooks` umbrella.

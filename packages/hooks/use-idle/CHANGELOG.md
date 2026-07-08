# @usefy/use-idle

## 0.22.0

## 0.21.1

## 0.21.0

## 0.20.0

### Minor Changes

- 65b754f: Add `useIdle` — report user inactivity after a timeout. `const idle = useIdle(60_000)` returns `false` while the user is active and flips to `true` once no listened activity (mouse, keyboard, touch, wheel, resize, tab focus) has occurred for `timeout` ms; the next activity flips it back. Activity is throttled with a leading-edge guard so the timer resets at most once every ~200ms, keeping high-frequency events (`mousemove`/`wheel`/`resize`) from thrashing React state. `visibilitychange` is handled specially: returning to a backgrounded tab counts as activity while backgrounding does not reset the timer (the `react-use`/`@mantine/hooks` convention). Configurable `events`, `initialState`, and target `element`; SSR-safe and StrictMode/concurrent-safe with full listener + timer cleanup. Re-exported from the `@usefy/hooks` umbrella.

# usefy Hooks Roadmap

> Rewritten from scratch (July 2026) against the current React 19 landscape,
> the hooks already shipped in this repo, and real-world demand across the
> leading hook libraries (usehooks-ts, ahooks, @mantine/hooks, react-use,
> @react-hookz/web). This document is the source of truth for what we build
> next and, just as importantly, what we deliberately do **not** build.

## Vision

usefy is a collection of **independently versioned, production-grade React
hooks**. Every hook is a building block that a serious application or design
system can depend on: typed, tested, SSR-safe, and tree-shakeable. The bar is
not "it works in a demo" — it is "a component library could ship this."

## Design principles (the enterprise bar)

Every hook we ship must satisfy all of these:

1. **TypeScript-first** — full inference, exported option/return types, no `any`
   leaking into the public surface. Read-only return types where a mutable
   collection would otherwise be a foot-gun (`ReadonlyMap`, `readonly T[]`).
2. **SSR-safe** — guard `window`/`document`; return a deterministic inert value
   on the server; never cause hydration mismatches (accept an initial value).
3. **Stable identities** — every returned function is `useCallback`-memoized;
   action bundles are `useMemo`-stable so they are safe as effect deps.
4. **No wasted renders** — bail out of state updates that don't change anything
   (`Object.is` / structural no-op skipping).
5. **Latest-callback pattern** — user callbacks are read through a ref so that
   changing a handler never re-subscribes listeners.
6. **Complements React, never fights it** — we do not re-implement anything React
   19 already ships (see Scope boundaries).
7. **~100% test coverage**, a Storybook story with `play` tests, three READMEs,
   and a changeset. A hook is not "done" until it ships complete.

## Scope boundaries — what usefy does NOT build

Judgment is part of the product. We decline whole categories:

**React 19 built-ins (never re-implement):**
`use`, `useActionState`, `useFormStatus`, `useOptimistic`, `useId`,
`useTransition`, `useDeferredValue`, `useSyncExternalStore`, `useLayoutEffect`.
We may ship thin *ergonomic* helpers around them, but not clones.

**Dedicated-library territory (we ship primitives, not the whole solution):**

| Need | Use instead | usefy provides only |
| ---- | ----------- | ------------------- |
| Server state / caching | TanStack Query, SWR | `useAsync` for simple local async |
| Forms & validation | react-hook-form, TanStack Form | `useControllableState`, field primitives |
| Virtualization | TanStack Virtual | `useIntersectionObserver` (shipped) |
| Animation | Framer Motion, react-spring | `useRafState`, `useReducedMotion` |
| Global state | Zustand, Jotai, Redux | `useSignal` (shipped), local collections |
| Routing / i18n / DnD | dedicated libs | — |

---

## Shipped (v0.9.x)

The roadmap below assumes these already exist. Do not re-propose them.

- **State & structures** — `useToggle`, `useCounter`, `useMap`, `useSet`,
  `useList`, `useQueue`, `useHistoryState`, `useLocalStorage`,
  `useSessionStorage`, `useSignal`
- **Timing** — `useDebounce`, `useDebounceCallback`, `useThrottle`,
  `useThrottleCallback`, `useTimeout`, `useInterval`, `useTimer`
- **DOM & events** — `useEventListener`, `useOnClickOutside`,
  `useClickAnyWhere`, `useHover`, `useKeyPress`, `useIntersectionObserver`,
  `useResizeObserver`, `useWindowSize`
- **Browser & device** — `useCopyToClipboard`, `useGeolocation`,
  `useMemoryMonitor`
- **Lifecycle & flow** — `useUnmount`, `useInit`, `useStep`

---

## Roadmap

**Priority legend**
- **P0** — highest demand / foundational for building design systems. Build next.
- **P1** — strong, broad demand. Build after P0.
- **P2** — valuable but niche or platform-specific. Build opportunistically.

### 1. SSR & Lifecycle

| Hook | Pri | Purpose & API sketch |
| ---- | --- | -------------------- |
| `useIsClient` | **P0** | Detect post-hydration client render. `const isClient = useIsClient()`. Canonical SSR guard for client-only UI. |
| `useIsomorphicLayoutEffect` | **P0** | `useLayoutEffect` on client, `useEffect` on server — silences the SSR warning. Building block used by other hooks. |
| `usePrevious` | **P0** | Value from the previous render. `const prev = usePrevious(value)`. Optional comparator; ref-based (no extra render). |
| `useEventCallback` | **P0** | Stable callback that always sees the latest props/state (community `useEffectEvent`). `const fn = useEventCallback(cb)`. |
| `useUpdateEffect` | **P1** | `useEffect` that skips the first run. Pairs with `useEffectOnce`/`useMount`. |
| `useMount` / `useIsFirstRender` | **P1** | `useMount(fn)` runs once on mount; `useIsFirstRender()` returns a boolean. Small, extremely common. |
| `useIsMounted` | **P2** | Mounted-ref guard: `const isMounted = useIsMounted()`. Document as an escape hatch — React prefers `AbortController`; ship with guidance. |
| `useForceUpdate` | **P2** | Imperative re-render trigger for interop/legacy. `const rerender = useForceUpdate()`. |
| `useLatest` | **P1** | Ref mirroring the latest value, for reading fresh state inside stable callbacks. `const ref = useLatest(value)`. |

### 2. State & Data Structures

| Hook | Pri | Purpose & API sketch |
| ---- | --- | -------------------- |
| `useControllableState` | **P0** | The controlled/uncontrolled primitive every component library needs. `const [v, setV] = useControllableState({ value, defaultValue, onChange })`. Radix/Mantine pattern. |
| `useDisclosure` | **P0** | Open/close/toggle state for modals, drawers, popovers. `const [opened, { open, close, toggle }] = useDisclosure(false)`. |
| `useObjectState` | **P1** | Partial object updates with immutability + reset. `const [state, patch, reset] = useObjectState(init)`; `patch({ field })`. |
| `useStack` | **P1** | LIFO companion to `useQueue`. `[stack, { push, pop, peek, clear, reset }]`, `readonly T[]`, immutable, no-op skipping. |
| `useSelection` | **P1** | Multi/single selection state for lists & tables. `{ selected, isSelected, toggle, selectAll, clear, isAllSelected }`. Built on `Set`. |
| `useCookie` | **P1** | Cookie value as state, SSR-aware. `const [value, setValue, remove] = useCookie(key, opts)`. Fills the storage trio (local/session/cookie). |
| `useDefault` | **P2** | State that falls back to a default when set to `null`/`undefined`. |

### 3. Responsive, Theme & Accessibility

| Hook | Pri | Purpose & API sketch |
| ---- | --- | -------------------- |
| `useMediaQuery` | **P0** | The #1 missing hook. `const isWide = useMediaQuery('(min-width: 1024px)', { defaultValue, initializeWithValue })`. `matchMedia`, SSR default, listener cleanup. |
| `useReducedMotion` | **P0** | `prefers-reduced-motion` as a boolean. Accessibility table-stakes for any animation. |
| `useDarkMode` | **P0** | Theme state with system detection + persistence + DOM class/attribute. `{ mode, isDark, setMode, toggle }` where `mode: 'system' \| 'light' \| 'dark'` (folds in the old `useTernaryDarkMode`). |
| `usePreferredColorScheme` | **P1** | Raw `prefers-color-scheme` (`'light' \| 'dark'`), the primitive under `useDarkMode`. |
| `useDocumentTitle` | **P0** | Set `document.title` with restore-on-unmount. `useDocumentTitle(title, { restoreOnUnmount })`. |
| `useFavicon` | **P2** | Swap the page favicon dynamically. |
| `usePreferredLanguage` | **P2** | `navigator.language`/`languages` reactive to change. |

### 4. DOM, Refs & Observers

| Hook | Pri | Purpose & API sketch |
| ---- | --- | -------------------- |
| `useMergedRefs` | **P0** | Merge callback/object refs onto one node — essential for `forwardRef` components. `const ref = useMergedRefs(localRef, forwardedRef)`. |
| `useMeasure` | **P1** | Element bounds (`x, y, width, height, top…`) via `ResizeObserver`. `const [ref, bounds] = useMeasure()`. Convenience layer over the shipped `useResizeObserver`. |
| `useMutationObserver` | **P1** | Observe DOM subtree mutations — completes the observer trio (intersection/resize/mutation). `useMutationObserver(ref, cb, options)`. |
| `useScrollPosition` | **P1** | Throttled scroll offset for window or element. `const { x, y } = useScrollPosition({ element, throttleMs })`. |
| `useScrollLock` | **P1** | Lock body scroll (iOS-safe, nested counter, restores position) for modals. `const { lock, unlock, isLocked } = useScrollLock()`. |
| `useScrollIntoView` | **P2** | Smooth-scroll a target into view with alignment options. |
| `useTextSelection` | **P2** | Currently selected text/range within a subtree. |

### 5. Interaction, Gestures & Focus (A11y)

| Hook | Pri | Purpose & API sketch |
| ---- | --- | -------------------- |
| `useHotkeys` | **P0** | High-level keyboard shortcuts above `useKeyPress`: scopes, sequences, `mod` alias, input-field guards. `useHotkeys('mod+k', handler, { enabled })`. |
| `useFocusTrap` | **P1** | Contain focus within a subtree (modals/dialogs) — accessibility essential. `const ref = useFocusTrap(active)`. |
| `useFocusWithin` | **P1** | Track whether focus is anywhere inside a subtree. `const [ref, focused] = useFocusWithin()`. |
| `useLongPress` | **P1** | Long-press gesture with threshold and move-cancel, mouse + touch. `const bind = useLongPress(cb, { threshold })`. |
| `useInfiniteScroll` | **P1** | Sentinel-driven infinite loading built on `IntersectionObserver`. `const ref = useInfiniteScroll(loadMore, { hasMore, loading })`. |
| `usePagination` | **P1** | Pagination state machine. `{ page, pageCount, next, prev, setPage, range }`. |
| `usePageLeave` | **P2** | Detect the cursor leaving the viewport (exit-intent). |

### 6. Async & Data

| Hook | Pri | Purpose & API sketch |
| ---- | --- | -------------------- |
| `useAsync` | **P0** | Lifecycle for a single async op: `{ data, error, status, isLoading, execute, reset }`, `AbortController` cancellation, `immediate` option. Deliberately *not* a query cache — that's TanStack Query's job. |
| `useAsyncFn` | **P1** | Manual-trigger variant returning `[state, run]` for event-driven calls. |
| `usePolling` | **P1** | Poll an async fn on an interval with pause/resume and backoff. |
| `useDebouncedState` / `useThrottledState` | **P1** | `[value, debouncedValue, setValue]` conveniences pairing state with the shipped debounce/throttle. |
| `useRafState` | **P1** | State whose updates are batched to `requestAnimationFrame` — smooth for scroll/resize/pointer-driven UI. |
| `useAnimationFrame` | **P2** | rAF loop with delta time, start/stop. `useAnimationFrame(({ delta }) => …)`. |

### 7. Browser & Device APIs

| Hook | Pri | Purpose & API sketch |
| ---- | --- | -------------------- |
| `useNetworkState` | **P1** | Online/offline + Network Information (`effectiveType`, `downlink`, `saveData`). `const { online, effectiveType } = useNetworkState()`. |
| `usePageVisibility` | **P1** | Document visibility (tab focus/blur) via the Page Visibility API. `const visible = usePageVisibility()`. |
| `useIdle` | **P1** | User inactivity after a timeout, throttled activity listeners. `const idle = useIdle(60_000)`. |
| `usePermission` | **P1** | Permissions API status with live updates. `const state = usePermission({ name: 'camera' })`. |
| `useScript` | **P1** | Load an external script with `idle/loading/ready/error` status, dedup, cleanup. `const status = useScript(src)`. |
| `useClipboardRead` | **P2** | Read/paste side of the clipboard (extends the shipped `useCopyToClipboard`). |
| `useShare` | **P2** | Web Share API with capability detection. `const { share, canShare } = useShare()`. |
| `useFullscreen` | **P2** | Fullscreen API for an element. `{ isFullscreen, enter, exit, toggle, isSupported }`. |
| `useOrientation` | **P2** | Screen orientation (`angle`, `type`). |
| `useScreen` | **P2** | `screen` object info (avail size, orientation). Low priority — largely covered by `useMediaQuery`/`useWindowSize`. |
| `useBattery` | **P2** | Battery Status API (`level`, `charging`). |
| `useWakeLock` | **P2** | Screen Wake Lock API — keep the display awake. |
| `useMediaDevices` | **P2** | Enumerate cameras/microphones/speakers. |
| `useNotification` | **P2** | Web Notifications with permission flow. |
| `useBroadcastChannel` | **P2** | Cross-tab messaging via BroadcastChannel. |
| `useStyleTag` | **P2** | Inject/manage a `<style>` tag. |
| `useEyeDropper` | **P2** | EyeDropper API color picking. |

---

## Removed / merged from the previous roadmap

| Old entry | Decision | Rationale |
| --------- | -------- | --------- |
| `useCountdown` (#22) | **Removed** | Covered by the shipped `useTimer`. |
| `useOnScreen` (#34) | **Removed** | Duplicate of `useIntersectionObserver`; if a boolean-only convenience is wanted, add a `boolean` return mode there instead of a new package. |
| `useTernaryDarkMode` (#31) | **Merged** | Folded into `useDarkMode` as `mode: 'system' \| 'light' \| 'dark'`. One hook, not two. |
| `useMeasure` (#44) vs `useResizeObserver` | **Kept, reframed** | `useMeasure` stays as the ergonomic bounds-returning layer over the shipped `useResizeObserver`; avoid overlap in docs. |
| `useIsMounted` (#24) | **Kept w/ caveat** | Retained (P2) but documented as an escape hatch; prefer `AbortController` for async cancellation. |

## New in this roadmap (not in the old one)

Driven by current demand & React 19: `useMediaQuery`, `useReducedMotion`,
`useControllableState`, `useMergedRefs`, `useDisclosure`, `useHotkeys`,
`useFocusTrap`, `useFocusWithin`, `useMutationObserver`, `useScrollPosition`,
`useNetworkState`, `usePageVisibility`, `useSelection`, `useStack`, `useCookie`,
`useRafState`, `usePagination`, `useInfiniteScroll`, `usePolling`,
`useAsync`/`useAsyncFn`, `usePreferredColorScheme`, `useShare`, `useWakeLock`,
`useBroadcastChannel`, and more.

---

## Recommended build order (batches)

Ship in cohesive batches so related hooks share design decisions and land
together:

1. **SSR & lifecycle core** — `useIsClient`, `useIsomorphicLayoutEffect`,
   `usePrevious`, `useEventCallback`, `useLatest`, `useUpdateEffect`, `useMount`.
   *(small, foundational, unblock other hooks)*
2. **Responsive & theme** — `useMediaQuery`, `usePreferredColorScheme`,
   `useReducedMotion`, `useDarkMode`, `useDocumentTitle`.
3. **Design-system primitives** — `useControllableState`, `useMergedRefs`,
   `useDisclosure`.
4. **DOM & observers** — `useMeasure`, `useMutationObserver`,
   `useScrollPosition`, `useScrollLock`.
5. **Interaction & a11y** — `useHotkeys`, `useFocusTrap`, `useFocusWithin`,
   `useLongPress`.
6. **Async & data** — `useAsync`, `useAsyncFn`, `usePolling`, `useRafState`.
7. **State extras** — `useObjectState`, `useStack`, `useSelection`, `useCookie`.
8. **Interaction/data patterns** — `useInfiniteScroll`, `usePagination`.
9. **Browser/device** — `useNetworkState`, `usePageVisibility`, `useIdle`,
   `usePermission`, `useScript`, then P2 platform hooks as demand warrants.

Each hook follows the `add-usefy-hook` workflow: scaffold → implement → tests
(~100%) → umbrella wiring → Storybook story → coverage badge → three READMEs →
changeset.

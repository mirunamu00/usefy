<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-async</h1>

<p align="center">
  <strong>Manage the full lifecycle of a single async task — object-style state, immediate auto-run, and AbortController cancellation.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-async"><img src="https://img.shields.io/npm/v/@usefy/use-async.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-async"><img src="https://img.shields.io/npm/dm/@usefy/use-async.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-async"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-async?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-async.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useasync--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useAsync` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It manages the full lifecycle of a single async task (`idle → pending → success | error`) with an **object-style** return, built-in **`AbortController` cancellation**, and an **`immediate` auto-run** on mount.

It is the abortable, self-running sibling of [`useAsyncFn`](https://www.npmjs.com/package/@usefy/use-async-fn) — same state shape, but it runs itself on mount, hands your function an `AbortSignal` so obsolete requests are truly cancelled, and can be `reset()` back to idle.

It is deliberately **not** a query cache — no keys, no cross-component dedupe, no background revalidation. For that reach for [TanStack Query](https://tanstack.com/query); `useAsync` is a focused local-async primitive.

## Features

- **Object-style state** — `{ data, error, status, isLoading }` where `status` (`idle`/`pending`/`success`/`error`) is the source of truth and `isLoading` mirrors `pending`. Identical in meaning to `useAsyncFn`.
- **AbortController cancellation** — every `execute` creates a fresh `AbortController` and passes its `signal` as the **first argument** to your function; the previous request is aborted when a new `execute` starts, on `reset()`, and on unmount
- **`immediate` auto-run** — runs once on mount by default (opt out with `immediate: false`), fed by `options.args`; fires from an effect, so it never runs during SSR render
- **Race-safe** — a superseded call can never update state (or fire callbacks) even if it resolves after being aborted — a monotonic call-id guard backs up the abort
- **Unmount-safe** — the in-flight request is aborted and no state update / callback runs after unmount
- **Stable `execute` / `reset`** — memoized identities, safe as effect deps or child props; read the latest inline `fn` through a ref so you never need to memoize it
- **Never rejects** — `execute` resolves with the value (or `undefined` on failure) so an un-awaited call can't throw; errors surface via `state.error`
- **SSR-safe & StrictMode-safe** — touches no browser globals at module/render time; under StrictMode the first auto-run is aborted and the second wins
- **TypeScript-first** — full type inference; reuses the shared `AsyncStatus`/`AsyncState`/`AsyncFn` types
- **Tiny & tree-shakeable** — published as its own package

## Installation

```bash
# npm
npm install @usefy/use-async

# yarn
yarn add @usefy/use-async

# pnpm
pnpm add @usefy/use-async
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useAsync } from "@usefy/use-async";

function UserProfile({ id }: { id: string }) {
  const { data, error, isLoading, execute, reset } = useAsync(
    async (signal: AbortSignal, userId: string) => {
      const res = await fetch(`/api/user/${userId}`, { signal });
      if (!res.ok) throw new Error("Failed to load user");
      return (await res.json()) as { name: string };
    },
    { immediate: true, args: [id] }, // auto-load on mount with `id`
  );

  if (isLoading) return <p>Loading…</p>;
  if (error) return <button onClick={() => execute(id)}>Retry</button>;
  return (
    <div>
      <h1>{data?.name}</h1>
      <button onClick={reset}>Clear</button>
    </div>
  );
}
```

## API

```ts
const { data, error, status, isLoading, execute, reset } = useAsync<T, Args, E>(fn, options?);
```

### Parameters

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `fn` | `(signal: AbortSignal, ...args: Args) => Promise<T>` | The async function to run. Receives an `AbortSignal` **first**, then whatever args you pass to `execute`. Wire the signal into `fetch(url, { signal })`. Read through a ref — an inline function is fine and never goes stale. |
| `options` | `UseAsyncOptions<T, Args, E>` | Optional. See below. |

### Options — `UseAsyncOptions<T, Args, E>`

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `immediate` | `boolean` | `true` | Auto-run once on mount (client-side only, from an effect — never during SSR). Set `false` for a manual-only hook. |
| `args` | `Args` | `[]` | Arguments for the immediate run. Required if your `fn` needs args and you keep `immediate` on. Ignored by manual `execute(...)` calls. |
| `initialData` | `T` | — | Seed value for `data` before the first successful run. Status still starts `"idle"`; `reset()` restores it. |
| `onSuccess` | `(data: T) => void` | — | Called after a run resolves — only for the latest (non-superseded) run, only while mounted. Fired from the event turn, never inside a state updater. |
| `onError` | `(error: E) => void` | — | Called after a run fails — same latest-only, mounted-only guarantees. The abort of a superseded/reset/unmounted call is never reported here. |

### Return — `{ data, error, status, isLoading, execute, reset }`

| Field | Type | Description |
| ----- | ---- | ----------- |
| `data` | `T \| undefined` | The most recent successfully-resolved value. Retained across later `pending`/`error` transitions; only replaced on success. |
| `error` | `E \| undefined` | The error from the most recent failed run. Cleared when a run starts and when a run succeeds. |
| `status` | `"idle" \| "pending" \| "success" \| "error"` | The lifecycle status — the source of truth. |
| `isLoading` | `boolean` | Convenience mirror of `status === "pending"`. |
| `execute` | `(...args: Args) => Promise<T \| undefined>` | Runs `fn(signal, ...args)`. Stable. Aborts any previous in-flight request first. Never rejects. |
| `reset` | `() => void` | Returns state to idle (restoring `initialData`), aborts any in-flight request, and supersedes it. Stable. |

### Behavioural guarantees (by design)

- **AbortSignal signature:** the signal is passed **first** — `fn(signal, ...args)` — keeping the forwarded `Args` tuple clean and fully inferable. Wire it into `fetch(url, { signal })` (or any abortable API).
- **What `execute` resolves with:** the value `fn` produced on success, or **`undefined`** on failure / supersession. `execute` **never rejects** — errors are surfaced via `state.error`, so a fire-and-forget `execute()` can never cause an unhandled rejection.
- **Data on error:** the last successful `data` is **kept** (not cleared) when a later run fails. `error` is cleared the moment a new run starts.
- **Cancellation vs. stale-guard:** aborting can't stop a plain promise, so both mechanisms run together — the `AbortSignal` cancels abortable work (like `fetch`), and a monotonic call-id guard guarantees a superseded call never updates state (or fires `onSuccess`/`onError`) even if it resolves late. An abort of a superseded/reset call is never surfaced as `error`.
- **`immediate` default:** `true`. `useAsync` is the auto-running counterpart to the manual `useAsyncFn` — the reason to reach for it is a declarative "load on mount". If you want fully manual control, use `useAsyncFn`.
- **StrictMode:** under React 18 StrictMode the mount effect double-invokes; the first auto-run's controller is aborted by the interleaved cleanup and the second run wins, so the double-mount is harmless.

### Exported types

`AsyncFnWithSignal<T, Args>`, `AsyncExecuteFn<T, Args>`, `UseAsyncOptions<T, Args, E>`, `UseAsyncReturn<T, Args, E>`, plus the shared `AsyncStatus`, `AsyncFn<T, Args>`, `AsyncState<T, E>` re-exported from `@usefy/use-async-fn`.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-async/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **28 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

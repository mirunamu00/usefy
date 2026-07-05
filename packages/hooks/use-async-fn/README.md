<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-async-fn</h1>

<p align="center">
  <strong>Run a manual-trigger async function and track its idle/pending/success/error lifecycle — race-safe and unmount-safe.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-async-fn"><img src="https://img.shields.io/npm/v/@usefy/use-async-fn.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-async-fn"><img src="https://img.shields.io/npm/dm/@usefy/use-async-fn.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-async-fn"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-async-fn?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-async-fn.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useasyncfn--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useAsyncFn` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It is the manual-trigger core for running a single async function and tracking its lifecycle, designed for event-driven invocation (button clicks, form submits) and built to be the foundation higher-level data hooks (`useAsync`, `usePolling`) build on.

Nothing runs until you call `run(...)`. Every call is race-guarded so out-of-order resolutions never clobber fresh data, and the component is never updated after it unmounts.

## Features

- **Full lifecycle state** — `{ data, error, status, isLoading }` where `status` (`idle`/`pending`/`success`/`error`) is the source of truth and `isLoading` mirrors `pending`
- **Race-safe** — call `run` again before the previous call settles and only the latest call may update state; a slow earlier promise resolving late is ignored
- **Unmount-safe** — no state updates (and no `onSuccess`/`onError` callbacks) after the component unmounts
- **Stable `run`** — memoized identity, safe as an effect dependency or child prop; reads the latest inline `fn` through a ref so you never need to memoize it
- **Never rejects** — `run` resolves with the value (or `undefined` on failure) so an un-awaited call can't throw an unhandled rejection; errors surface via `state.error`
- **SSR-safe & StrictMode-safe** — touches no browser globals; the mounted flag is re-armed on re-mount
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — published as its own package

## Installation

```bash
# npm
npm install @usefy/use-async-fn

# yarn
yarn add @usefy/use-async-fn

# pnpm
pnpm add @usefy/use-async-fn
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useAsyncFn } from "@usefy/use-async-fn";

function LoginForm() {
  const [state, run] = useAsyncFn(async (email: string, password: string) => {
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    return (await res.json()) as { token: string };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run("me@example.com", "hunter2"); // fire-and-forget is safe — run never rejects
  };

  return (
    <form onSubmit={handleSubmit}>
      <button disabled={state.isLoading}>
        {state.isLoading ? "Signing in…" : "Sign in"}
      </button>
      {state.status === "error" && <p role="alert">{state.error?.message}</p>}
      {state.status === "success" && <p>Welcome! Token: {state.data?.token}</p>}
    </form>
  );
}
```

## API

```ts
const [state, run] = useAsyncFn<T, Args, E>(fn, options?);
```

### Parameters

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `fn` | `(...args: Args) => Promise<T>` | The async function to run. Receives whatever args you pass to `run`. Read through a ref — an inline function is fine and never goes stale. |
| `options` | `UseAsyncFnOptions<T, E>` | Optional. See below. |

### Options — `UseAsyncFnOptions<T, E>`

| Option | Type | Description |
| ------ | ---- | ----------- |
| `initialData` | `T` | Seed value for `state.data` before the first successful run. Status still starts `"idle"`. |
| `onSuccess` | `(data: T) => void` | Called after a run resolves — only for the latest (non-superseded) run, only while mounted. Fired from the event turn, never inside a state updater. |
| `onError` | `(error: E) => void` | Called after a run fails — same latest-only, mounted-only, post-`setState` guarantees. |

### Return — `[state, run]`

**`state: AsyncState<T, E>`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `data` | `T \| undefined` | The most recent successfully-resolved value. Retained across later `pending`/`error` transitions; only replaced on success. |
| `error` | `E \| undefined` | The error from the most recent failed run. Cleared when a run starts and when a run succeeds. |
| `status` | `"idle" \| "pending" \| "success" \| "error"` | The lifecycle status — the source of truth. |
| `isLoading` | `boolean` | Convenience mirror of `status === "pending"`. |

**`run: (...args: Args) => Promise<T | undefined>`** — Stable across renders. Forwards `args` to `fn`, moves state to `pending`, then to `success` or `error`.

### Behavioural guarantees (by design)

- **What `run` resolves with:** the value `fn` produced for *that specific call* on success, or **`undefined`** on failure. `run` **never rejects** — errors are surfaced via `state.error`, so a fire-and-forget `run()` can never cause an unhandled promise rejection. (Because failure resolves to `undefined`, a `T` of `undefined` is ambiguous with failure — read `state.error` to disambiguate.)
- **Data on error:** the last successful `data` is **kept** (not cleared) when a later run fails, so you can keep showing stale data alongside an error. `error` is cleared the moment a new run starts.
- **Race / stale-response guarding:** each call gets a monotonically increasing id; if a newer `run` starts before an older one settles, the older result is ignored for state purposes (and its `onSuccess`/`onError` is skipped). Only the latest call wins. Each `run()` promise still resolves with its own result.
- **AbortController:** intentionally **not** wired into `fn`'s signature here, to keep the generic `Args` clean. In-flight results from superseded calls are discarded by the stale-guard rather than aborted. Abortable fetching is layered on by the higher-level `useAsync`/`usePolling` hooks.

### Exported types

`AsyncStatus`, `AsyncFn<T, Args>`, `AsyncState<T, E>`, `AsyncRunFn<T, Args>`, `UseAsyncFnOptions<T, E>`, `UseAsyncFnReturn<T, Args, E>`.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-async-fn/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **23 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

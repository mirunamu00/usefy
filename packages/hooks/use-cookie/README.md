<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-cookie</h1>

<p align="center">
  <strong>Read and write a browser cookie as React state — SSR-aware, JSON-friendly, with full cookie attribute support</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-cookie"><img src="https://img.shields.io/npm/v/@usefy/use-cookie.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-cookie"><img src="https://img.shields.io/npm/dm/@usefy/use-cookie.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-cookie"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-cookie?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-cookie.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usecookie--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useCookie` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It reads and writes a browser cookie with a `useState`-like API, and completes the storage trio alongside [`@usefy/use-local-storage`](https://www.npmjs.com/package/@usefy/use-local-storage) and [`@usefy/use-session-storage`](https://www.npmjs.com/package/@usefy/use-session-storage) — the three feel like siblings.

## Features

- **`useState`-like tuple** — `[value, setValue, remove]`, with a functional updater `(prev) => next`
- **Full cookie attributes** — `expires` (Date or days), `maxAge` (seconds), `path`, `domain`, `secure`, `sameSite`
- **Safe (de)serialization** — JSON by default, with a graceful fallback to the raw string so plain (non-JSON) cookies never throw
- **SSR-safe** — guards all `document` access and returns `initialValue` on the server (built on `useSyncExternalStore`, exactly like its storage siblings, to avoid hydration mismatches)
- **Same-document sync** — multiple `useCookie(key)` instances stay in sync when any of them writes or removes
- **Stable references** — `setValue` and `remove` are memoized
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-cookie

# yarn
yarn add @usefy/use-cookie

# pnpm
pnpm add @usefy/use-cookie
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useCookie } from "@usefy/use-cookie";

function ThemeToggle() {
  const [theme, setTheme, removeTheme] = useCookie("theme", {
    initialValue: "light",
  });

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={removeTheme}>Reset</button>
    </div>
  );
}
```

## API

### `useCookie<T>(key, options?)`

Reads and writes the cookie named `key`, returning a `[value, setValue, remove]` tuple.

#### Parameters

| Parameter | Type                  | Description               |
| --------- | --------------------- | ------------------------- |
| `key`     | `string`              | The cookie name           |
| `options` | `UseCookieOptions<T>` | Configuration (see below) |

#### Options

| Option         | Type                     | Default          | Description                                                              |
| -------------- | ------------------------ | ---------------- | ----------------------------------------------------------------------- |
| `initialValue` | `T \| (() => T)`         | `undefined`      | Value when the cookie is absent (and on the server); also the reset target for `remove()`. Supports a lazy initializer. |
| `serializer`   | `(value: T) => string`   | `JSON.stringify` | Convert the value to the stored cookie string                           |
| `deserializer` | `(value: string) => T`   | JSON-or-raw\*    | Parse the stored cookie string back to a value                          |
| `onError`      | `(error: Error) => void` | —                | Called on a serialization/deserialization error                         |
| `expires`      | `Date \| number`         | —                | Absolute `Date`, or a number of **days** from now. Omit for a session cookie. |
| `maxAge`       | `number`                 | —                | `Max-Age` in **seconds**. Use `0`/negative to expire immediately.       |
| `path`         | `string`                 | `"/"`            | Path the cookie is scoped to                                            |
| `domain`       | `string`                 | —                | Domain the cookie is scoped to (e.g. `.example.com`)                    |
| `secure`       | `boolean`                | —                | Send the cookie over HTTPS only                                         |
| `sameSite`     | `'strict' \| 'lax' \| 'none'` | —           | `SameSite` policy. `'none'` requires `secure: true`.                    |

\* **Default deserialization:** the value is written with `JSON.stringify` and read with `JSON.parse`. Because cookies are very often plain, non-JSON strings (set by a server or another library), the default deserializer **falls back to the raw string** when `JSON.parse` throws — so `foo=bar` reads back as `"bar"` and never crashes, while `'{"a":1}'` reads back as `{ a: 1 }`.

#### Returns `[T | undefined, SetValue, Remove]`

| Index | Type                                            | Description                                                    |
| ----- | ----------------------------------------------- | ------------------------------------------------------------- |
| `[0]` | `T \| undefined`                                | Current value (`undefined` when absent and no `initialValue`) |
| `[1]` | `Dispatch<SetStateAction<T \| undefined>>`      | Set the cookie; accepts a value or `(prev) => next`           |
| `[2]` | `() => void`                                    | Delete the cookie and reset state to `initialValue`           |

### SSR / hydration

On the server there is no `document`, so `useCookie` returns `initialValue`. Like `@usefy/use-local-storage`, it reads through `useSyncExternalStore` with a server snapshot, so the first client render is consistent and there is no hydration mismatch.

### Cross-tab limitation

Cookies have **no `storage` event**, so writes made in *other* browser tabs cannot be observed without polling — `useCookie` does not fake this. It does keep every `useCookie(key)` instance **within the same document** in sync via an internal subscription (mirroring `@usefy/use-local-storage`'s same-tab store). If you need cross-tab reactivity for a cookie, poll `document.cookie` yourself or store the value in `localStorage` instead.

## Examples

### Cookie attributes

```tsx
import { useCookie } from "@usefy/use-cookie";

// A secure, same-site session token that expires in a week.
const [token, setToken, clearToken] = useCookie<string>("token", {
  expires: 7, // days (a Date also works)
  path: "/",
  secure: true,
  sameSite: "strict",
});
```

### Object value (JSON)

```tsx
import { useCookie } from "@usefy/use-cookie";

interface Prefs {
  lang: string;
  compact: boolean;
}

const [prefs, setPrefs] = useCookie<Prefs>("prefs", {
  initialValue: { lang: "en", compact: false },
  maxAge: 60 * 60 * 24 * 30, // 30 days
});

setPrefs((prev) => ({ ...prev!, compact: true }));
```

### Reading a plain server-set cookie

```tsx
import { useCookie } from "@usefy/use-cookie";

// Cookie set by the backend as `consent=accepted` (not JSON) — reads back as
// the raw string, no throw.
const [consent] = useCookie<string>("consent");
```

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-cookie/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **47 tests**, 96% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

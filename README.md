<p align="center">
  <img src="https://raw.githubusercontent.com/geon0529/usefy/master/assets/logo.png" alt="usefy logo" width="180" />
</p>

<h1 align="center">usefy</h1>

<p align="center">
  <strong>🪝 A collection of production-ready React hooks for modern applications</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/usefy">
    <img src="https://img.shields.io/npm/v/@usefy/usefy.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/usefy">
    <img src="https://img.shields.io/npm/dm/@usefy/usefy.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/usefy">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/usefy?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/geon0529/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/usefy.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#packages">Packages</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a>
</p>

---

> ⚠️ **Pre-release Notice**: This project is currently in version `0.x.x` (alpha/beta stage). APIs may change between minor versions. While fully functional and tested, please use with caution in production environments.
>
> 🚧 **Actively Developing**: New hooks are being added regularly. Stay tuned for more utilities!

---

## Overview

**usefy** is a collection of production-ready custom hooks designed for modern React applications. All hooks are written in TypeScript, providing complete type safety, comprehensive testing, and minimal bundle size.

### ✨ Why usefy?

- **🚀 Zero Dependencies** — Pure React implementation with no external dependencies
- **📦 Tree Shakeable** — Import only the hooks you need to optimize bundle size
- **🔷 TypeScript First** — Complete type safety with full autocomplete support
- **⚡ SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **🧪 Well Tested** — High test coverage ensures reliability and stability
- **📖 Well Documented** — Detailed documentation with practical examples

---

## Installation

### All-in-One Package

Install all hooks at once:

```bash
# npm
npm install @usefy/usefy

# yarn
yarn add @usefy/usefy

# pnpm
pnpm add @usefy/usefy
```

### Individual Packages

You can also install only the hooks you need:

```bash
# Example: Install only use-toggle
pnpm add @usefy/use-toggle

# Install multiple packages
pnpm add @usefy/use-debounce @usefy/use-local-storage
```

### Peer Dependencies

All packages require React 18 or 19:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

---

## Packages

### 📦 Available Hooks

| Hook                                                                                       | Description                                             | npm                                                                                                                                                                | Coverage                                                                            |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| [@usefy/use-toggle](https://www.npmjs.com/package/@usefy/use-toggle)                       | Boolean state management with toggle, setTrue, setFalse | [![npm](https://img.shields.io/npm/v/@usefy/use-toggle.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/@usefy/use-toggle)                       | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| [@usefy/use-counter](https://www.npmjs.com/package/@usefy/use-counter)                     | Counter state with increment, decrement, reset          | [![npm](https://img.shields.io/npm/v/@usefy/use-counter.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/@usefy/use-counter)                     | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| [@usefy/use-debounce](https://www.npmjs.com/package/@usefy/use-debounce)                   | Value debouncing with leading/trailing edge             | [![npm](https://img.shields.io/npm/v/@usefy/use-debounce.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/@usefy/use-debounce)                   | ![91%](https://img.shields.io/badge/coverage-91%25-brightgreen?style=flat-square)   |
| [@usefy/use-debounce-callback](https://www.npmjs.com/package/@usefy/use-debounce-callback) | Debounced callbacks with cancel/flush/pending           | [![npm](https://img.shields.io/npm/v/@usefy/use-debounce-callback.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/@usefy/use-debounce-callback) | ![94%](https://img.shields.io/badge/coverage-94%25-brightgreen?style=flat-square)   |
| [@usefy/use-throttle](https://www.npmjs.com/package/@usefy/use-throttle)                   | Value throttling for rate-limiting updates              | [![npm](https://img.shields.io/npm/v/@usefy/use-throttle.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/@usefy/use-throttle)                   | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| [@usefy/use-throttle-callback](https://www.npmjs.com/package/@usefy/use-throttle-callback) | Throttled callbacks with cancel/flush/pending           | [![npm](https://img.shields.io/npm/v/@usefy/use-throttle-callback.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/@usefy/use-throttle-callback) | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| [@usefy/use-local-storage](https://www.npmjs.com/package/@usefy/use-local-storage)         | localStorage persistence with cross-tab sync            | [![npm](https://img.shields.io/npm/v/@usefy/use-local-storage.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/@usefy/use-local-storage)         | ![95%](https://img.shields.io/badge/coverage-95%25-brightgreen?style=flat-square)   |
| [@usefy/use-session-storage](https://www.npmjs.com/package/@usefy/use-session-storage)     | sessionStorage persistence for tab lifetime             | [![npm](https://img.shields.io/npm/v/@usefy/use-session-storage.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/@usefy/use-session-storage)     | ![94%](https://img.shields.io/badge/coverage-94%25-brightgreen?style=flat-square)   |
| [@usefy/use-click-any-where](https://www.npmjs.com/package/@usefy/use-click-any-where)     | Document-wide click event detection                     | [![npm](https://img.shields.io/npm/v/@usefy/use-click-any-where.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/@usefy/use-click-any-where)     | ![92%](https://img.shields.io/badge/coverage-92%25-brightgreen?style=flat-square)   |
| [@usefy/use-copy-to-clipboard](https://www.npmjs.com/package/@usefy/use-copy-to-clipboard) | Clipboard copy with fallback support                    | [![npm](https://img.shields.io/npm/v/@usefy/use-copy-to-clipboard.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/@usefy/use-copy-to-clipboard) | ![88%](https://img.shields.io/badge/coverage-88%25-brightgreen?style=flat-square)   |
| [@usefy/use-event-listener](https://www.npmjs.com/package/@usefy/use-event-listener)       | DOM event listener with auto cleanup                    | [![npm](https://img.shields.io/npm/v/@usefy/use-event-listener.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/@usefy/use-event-listener)       | ![96%](https://img.shields.io/badge/coverage-96%25-brightgreen?style=flat-square)   |
| [@usefy/use-on-click-outside](https://www.npmjs.com/package/@usefy/use-on-click-outside)   | Outside click detection for modals/dropdowns            | [![npm](https://img.shields.io/npm/v/@usefy/use-on-click-outside.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/@usefy/use-on-click-outside)   | ![97%](https://img.shields.io/badge/coverage-97%25-brightgreen?style=flat-square)   |

---

## Quick Start

### Using the All-in-One Package

```tsx
import {
  useToggle,
  useCounter,
  useDebounce,
  useLocalStorage,
  useCopyToClipboard,
  useEventListener,
  useOnClickOutside,
} from "@usefy/usefy";

function App() {
  // Boolean state management
  const { value: isOpen, toggle, setFalse: close } = useToggle(false);

  // Counter with controls
  const { count, increment, decrement, reset } = useCounter(0);

  // Debounced search
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  // Persistent theme preference
  const [theme, setTheme] = useLocalStorage("theme", "light");

  // Copy functionality
  const [copiedText, copy] = useCopyToClipboard();

  return (
    <div data-theme={theme}>
      {/* Modal */}
      <button onClick={toggle}>Open Modal</button>
      {isOpen && (
        <div className="modal">
          <button onClick={close}>Close</button>
        </div>
      )}

      {/* Counter */}
      <div>
        <button onClick={decrement}>-</button>
        <span>{count}</span>
        <button onClick={increment}>+</button>
      </div>

      {/* Search */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />

      {/* Theme Toggle */}
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle Theme
      </button>

      {/* Copy */}
      <button onClick={() => copy("Hello World!")}>
        {copiedText ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
```

### Using Individual Packages

```tsx
import { useToggle } from "@usefy/use-toggle";
import { useDebounce } from "@usefy/use-debounce";

function SearchModal() {
  const { value: isOpen, toggle } = useToggle(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <>
      <button onClick={toggle}>Search</button>
      {isOpen && (
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      )}
    </>
  );
}
```

---

## Features

### 🔄 State Management

<details>
<summary><strong>useToggle</strong> — Boolean state with utility functions</summary>

```tsx
const { value, toggle, setTrue, setFalse, setValue } = useToggle(false);
```

Perfect for modals, dropdowns, accordions, and switches.

</details>

<details>
<summary><strong>useCounter</strong> — Counter state with controls</summary>

```tsx
const { count, increment, decrement, reset } = useCounter(0);
```

Ideal for quantity selectors, pagination, and score tracking.

</details>

### ⏱️ Timing Utilities

<details>
<summary><strong>useDebounce</strong> — Debounce value updates</summary>

```tsx
const debouncedValue = useDebounce(value, 300, {
  leading: false,
  trailing: true,
  maxWait: 1000,
});
```

Best for search inputs, form validation, and API calls.

</details>

<details>
<summary><strong>useDebounceCallback</strong> — Debounce function calls</summary>

```tsx
const debouncedFn = useDebounceCallback(callback, 300);

debouncedFn(args); // Call debounced
debouncedFn.cancel(); // Cancel pending
debouncedFn.flush(); // Execute immediately
debouncedFn.pending(); // Check if pending
```

</details>

<details>
<summary><strong>useThrottle</strong> — Throttle value updates</summary>

```tsx
const throttledValue = useThrottle(value, 100, {
  leading: true,
  trailing: true,
});
```

Perfect for scroll events, resize handlers, and mouse tracking.

</details>

<details>
<summary><strong>useThrottleCallback</strong> — Throttle function calls</summary>

```tsx
const throttledFn = useThrottleCallback(callback, 100);
```

</details>

### 💾 Storage

<details>
<summary><strong>useLocalStorage</strong> — Persistent storage with sync</summary>

```tsx
const [value, setValue, removeValue] = useLocalStorage("key", initialValue, {
  serializer: JSON.stringify,
  deserializer: JSON.parse,
  syncTabs: true,
  onError: (error) => console.error(error),
});
```

Supports cross-tab synchronization and custom serialization.

</details>

<details>
<summary><strong>useSessionStorage</strong> — Session-scoped storage</summary>

```tsx
const [value, setValue, removeValue] = useSessionStorage("key", initialValue);
```

Data persists during tab lifetime, isolated per tab.

</details>

### 🖱️ Events

<details>
<summary><strong>useEventListener</strong> — DOM event listener with auto cleanup</summary>

```tsx
// Window resize event (default target)
useEventListener("resize", (e) => {
  console.log("Window resized:", window.innerWidth);
});

// Document keydown event
useEventListener(
  "keydown",
  (e) => {
    if (e.key === "Escape") closeModal();
  },
  document
);

// Element with ref
const buttonRef = useRef<HTMLButtonElement>(null);
useEventListener("click", handleClick, buttonRef);

// With options
useEventListener("scroll", handleScroll, window, {
  passive: true,
  capture: false,
  enabled: isTracking,
});
```

Supports window, document, HTMLElement, and RefObject targets with full TypeScript type inference.

</details>

<details>
<summary><strong>useOnClickOutside</strong> — Outside click detection</summary>

```tsx
// Basic usage - close modal on outside click
const modalRef = useRef<HTMLDivElement>(null);
useOnClickOutside(modalRef, () => onClose(), { enabled: isOpen });

// Multiple refs - button and dropdown menu
const buttonRef = useRef<HTMLButtonElement>(null);
const menuRef = useRef<HTMLDivElement>(null);
useOnClickOutside([buttonRef, menuRef], () => setIsOpen(false), {
  enabled: isOpen,
});

// With exclude refs
useOnClickOutside(modalRef, onClose, {
  excludeRefs: [toastRef], // Clicks on toast won't close modal
});
```

Perfect for modals, dropdowns, popovers, tooltips, and context menus with mouse + touch support.

</details>

<details>
<summary><strong>useClickAnyWhere</strong> — Global click detection</summary>

```tsx
useClickAnyWhere(
  (event) => {
    if (!ref.current?.contains(event.target)) {
      closeMenu();
    }
  },
  { enabled: isOpen }
);
```

Ideal for closing dropdowns, modals, and context menus.

</details>

<details>
<summary><strong>useCopyToClipboard</strong> — Clipboard operations</summary>

```tsx
const [copiedText, copy] = useCopyToClipboard({
  timeout: 2000,
  onSuccess: (text) => toast.success("Copied!"),
  onError: (error) => toast.error("Failed to copy"),
});

const success = await copy("text to copy");
```

Modern Clipboard API with automatic fallback for older browsers.

</details>

---

## Test Coverage

All packages are comprehensively tested using Vitest to ensure reliability and stability.

| Package               | Statements | Branches | Functions | Lines |
| --------------------- | ---------- | -------- | --------- | ----- |
| use-toggle            | 100%       | 100%     | 100%      | 100%  |
| use-counter           | 100%       | 100%     | 100%      | 100%  |
| use-throttle          | 100%       | 100%     | 100%      | 100%  |
| use-throttle-callback | 100%       | 100%     | 100%      | 100%  |
| use-local-storage     | 95%        | 86%      | 100%      | 95%   |
| use-session-storage   | 94%        | 79%      | 100%      | 94%   |
| use-debounce-callback | 94%        | 83%      | 94%       | 94%   |
| use-click-any-where   | 92%        | 88%      | 100%      | 92%   |
| use-debounce          | 91%        | 90%      | 67%       | 93%   |
| use-copy-to-clipboard | 88%        | 79%      | 86%       | 88%   |
| use-event-listener    | 96%        | 91%      | 100%      | 96%   |
| use-on-click-outside  | 97%        | 93%      | 100%      | 97%   |

---

## Browser Support

| Browser | Version          |
| ------- | ---------------- |
| Chrome  | 66+              |
| Firefox | 63+              |
| Safari  | 13.1+            |
| Edge    | 79+              |
| IE 11   | Fallback support |

---

## Related Links

- 📦 [npm Organization](https://www.npmjs.com/org/usefy)
- 🐙 [GitHub Repository](https://github.com/geon0529/usefy)
- 📝 [Changelog](https://github.com/geon0529/usefy/blob/master/CHANGELOG.md)
- 🐛 [Issue Tracker](https://github.com/geon0529/usefy/issues)

---

## License

MIT © [mirunamu](https://github.com/geon0529)

---

<p align="center">
  <sub>Built with ❤️ by the usefy team</sub>
</p>

<p align="center">
  <a href="https://github.com/geon0529/usefy">
    <img src="https://img.shields.io/github/stars/geon0529/usefy?style=social" alt="GitHub stars" />
  </a>
</p>

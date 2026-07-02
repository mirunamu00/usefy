<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="180" />
</p>

<h1 align="center">usefy</h1>

<p align="center">
  <strong>🪝 A collection of production-ready React hooks for modern applications</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/hooks" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/npm/v/@usefy/hooks.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/hooks" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/npm/dm/@usefy/hooks.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/hooks" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/hooks?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/npm/l/@usefy/hooks.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#packages">Packages</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
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
- **🎨 Interactive Demos** — Try all hooks in action with our Storybook playground

---

## Installation

### All-in-One Package

Install all hooks at once:

```bash
# npm
npm install @usefy/hooks

# yarn
yarn add @usefy/hooks

# pnpm
pnpm add @usefy/hooks
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

| Hook                                                                                                                                                    | Description                                             | npm                                                                                                                                                                                                                                                     | Coverage                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| <a href="https://www.npmjs.com/package/@usefy/use-toggle" target="_blank" rel="noopener noreferrer">@usefy/use-toggle</a>                               | Boolean state management with toggle, setTrue, setFalse | <a href="https://www.npmjs.com/package/@usefy/use-toggle" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-toggle.svg?style=flat-square&color=007acc" alt="npm version" /></a>                               | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-counter" target="_blank" rel="noopener noreferrer">@usefy/use-counter</a>                             | Counter state with increment, decrement, reset          | <a href="https://www.npmjs.com/package/@usefy/use-counter" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-counter.svg?style=flat-square&color=007acc" alt="npm version" /></a>                             | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-debounce" target="_blank" rel="noopener noreferrer">@usefy/use-debounce</a>                           | Value debouncing with leading/trailing edge             | <a href="https://www.npmjs.com/package/@usefy/use-debounce" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-debounce.svg?style=flat-square&color=007acc" alt="npm version" /></a>                           | ![92%](https://img.shields.io/badge/coverage-92%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-debounce-callback" target="_blank" rel="noopener noreferrer">@usefy/use-debounce-callback</a>         | Debounced callbacks with cancel/flush/pending           | <a href="https://www.npmjs.com/package/@usefy/use-debounce-callback" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-debounce-callback.svg?style=flat-square&color=007acc" alt="npm version" /></a>         | ![93%](https://img.shields.io/badge/coverage-93%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-throttle" target="_blank" rel="noopener noreferrer">@usefy/use-throttle</a>                           | Value throttling for rate-limiting updates              | <a href="https://www.npmjs.com/package/@usefy/use-throttle" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-throttle.svg?style=flat-square&color=007acc" alt="npm version" /></a>                           | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-throttle-callback" target="_blank" rel="noopener noreferrer">@usefy/use-throttle-callback</a>         | Throttled callbacks with cancel/flush/pending           | <a href="https://www.npmjs.com/package/@usefy/use-throttle-callback" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-throttle-callback.svg?style=flat-square&color=007acc" alt="npm version" /></a>         | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-local-storage" target="_blank" rel="noopener noreferrer">@usefy/use-local-storage</a>                 | localStorage persistence with cross-tab sync            | <a href="https://www.npmjs.com/package/@usefy/use-local-storage" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-local-storage.svg?style=flat-square&color=007acc" alt="npm version" /></a>                 | ![95%](https://img.shields.io/badge/coverage-95%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-session-storage" target="_blank" rel="noopener noreferrer">@usefy/use-session-storage</a>             | sessionStorage persistence for tab lifetime             | <a href="https://www.npmjs.com/package/@usefy/use-session-storage" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-session-storage.svg?style=flat-square&color=007acc" alt="npm version" /></a>             | ![95%](https://img.shields.io/badge/coverage-95%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-click-any-where" target="_blank" rel="noopener noreferrer">@usefy/use-click-any-where</a>             | Document-wide click event detection                     | <a href="https://www.npmjs.com/package/@usefy/use-click-any-where" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-click-any-where.svg?style=flat-square&color=007acc" alt="npm version" /></a>             | ![92%](https://img.shields.io/badge/coverage-92%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-copy-to-clipboard" target="_blank" rel="noopener noreferrer">@usefy/use-copy-to-clipboard</a>         | Clipboard copy with fallback support                    | <a href="https://www.npmjs.com/package/@usefy/use-copy-to-clipboard" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-copy-to-clipboard.svg?style=flat-square&color=007acc" alt="npm version" /></a>         | ![88%](https://img.shields.io/badge/coverage-88%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-event-listener" target="_blank" rel="noopener noreferrer">@usefy/use-event-listener</a>               | DOM event listener with auto cleanup                    | <a href="https://www.npmjs.com/package/@usefy/use-event-listener" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-event-listener.svg?style=flat-square&color=007acc" alt="npm version" /></a>               | ![96%](https://img.shields.io/badge/coverage-96%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-on-click-outside" target="_blank" rel="noopener noreferrer">@usefy/use-on-click-outside</a>           | Outside click detection for modals/dropdowns            | <a href="https://www.npmjs.com/package/@usefy/use-on-click-outside" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-on-click-outside.svg?style=flat-square&color=007acc" alt="npm version" /></a>           | ![98%](https://img.shields.io/badge/coverage-98%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-unmount" target="_blank" rel="noopener noreferrer">@usefy/use-unmount</a>                             | Execute callback on component unmount                   | <a href="https://www.npmjs.com/package/@usefy/use-unmount" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-unmount.svg?style=flat-square&color=007acc" alt="npm version" /></a>                             | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-init" target="_blank" rel="noopener noreferrer">@usefy/use-init</a>                                   | One-time initialization with async, retry, timeout      | <a href="https://www.npmjs.com/package/@usefy/use-init" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-init.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                   | ![96%](https://img.shields.io/badge/coverage-96%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-timer" target="_blank" rel="noopener noreferrer">@usefy/use-timer</a>                                 | Countdown timer with drift compensation and formats     | <a href="https://www.npmjs.com/package/@usefy/use-timer" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-timer.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                 | ![84%](https://img.shields.io/badge/coverage-84%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-geolocation" target="_blank" rel="noopener noreferrer">@usefy/use-geolocation</a>                     | Device geolocation with real-time tracking and distance | <a href="https://www.npmjs.com/package/@usefy/use-geolocation" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-geolocation.svg?style=flat-square&color=007acc" alt="npm version" /></a>                     | ![90%](https://img.shields.io/badge/coverage-90%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-intersection-observer" target="_blank" rel="noopener noreferrer">@usefy/use-intersection-observer</a> | Element visibility detection with Intersection Observer | <a href="https://www.npmjs.com/package/@usefy/use-intersection-observer" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-intersection-observer.svg?style=flat-square&color=007acc" alt="npm version" /></a> | ![94%](https://img.shields.io/badge/coverage-94%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-signal" target="_blank" rel="noopener noreferrer">@usefy/use-signal</a>                                   | Event-driven communication between components           | <a href="https://www.npmjs.com/package/@usefy/use-signal" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-signal.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                   | ![98%](https://img.shields.io/badge/coverage-98%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-memory-monitor" target="_blank" rel="noopener noreferrer">@usefy/use-memory-monitor</a>                   | Real-time browser memory monitoring with leak detection | <a href="https://www.npmjs.com/package/@usefy/use-memory-monitor" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-memory-monitor.svg?style=flat-square&color=007acc" alt="npm version" /></a>                   | ![90%](https://img.shields.io/badge/coverage-90%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-hover" target="_blank" rel="noopener noreferrer">@usefy/use-hover</a>                                     | Element hover detection with delay support              | <a href="https://www.npmjs.com/package/@usefy/use-hover" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-hover.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                     | ![92%](https://img.shields.io/badge/coverage-92%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-key-press" target="_blank" rel="noopener noreferrer">@usefy/use-key-press</a>                             | Keyboard key, shortcut, and combination detection       | <a href="https://www.npmjs.com/package/@usefy/use-key-press" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-key-press.svg?style=flat-square&color=007acc" alt="npm version" /></a>                             | ![93%](https://img.shields.io/badge/coverage-93%25-brightgreen?style=flat-square)   |
| <a href="https://www.npmjs.com/package/@usefy/use-map" target="_blank" rel="noopener noreferrer">@usefy/use-map</a>                                         | Map data structure state with immutable updates         | <a href="https://www.npmjs.com/package/@usefy/use-map" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-map.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                         | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-set" target="_blank" rel="noopener noreferrer">@usefy/use-set</a>                                         | Set data structure state with immutable updates         | <a href="https://www.npmjs.com/package/@usefy/use-set" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-set.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                         | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-list" target="_blank" rel="noopener noreferrer">@usefy/use-list</a>                                       | Array state with push/filter/sort/insertAt/updateAt     | <a href="https://www.npmjs.com/package/@usefy/use-list" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-list.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                       | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |
| <a href="https://www.npmjs.com/package/@usefy/use-queue" target="_blank" rel="noopener noreferrer">@usefy/use-queue</a>                                     | FIFO queue state with enqueue/dequeue and immutable updates | <a href="https://www.npmjs.com/package/@usefy/use-queue" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@usefy/use-queue.svg?style=flat-square&color=007acc" alt="npm version" /></a>                                     | ![100%](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square) |

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
  useIntersectionObserver,
  useHover,
  useKeyPress,
  useMap,
  useSet,
  useList,
  useQueue,
  useSignal,
  useUnmount,
  useInit,
} from "@usefy/hooks";

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

  // Lazy loading image
  const { ref: imageRef, inView } = useIntersectionObserver({
    triggerOnce: true,
    rootMargin: "50px",
  });

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

      {/* Lazy Loading */}
      <div ref={imageRef}>
        {inView && <img src="large-image.jpg" alt="Lazy loaded" />}
      </div>
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

<details>
<summary><strong>useMap</strong> — Map state with immutable updates</summary>

```tsx
import { useMap } from "@usefy/use-map";

const [users, { set, setAll, remove, reset, clear, get }] = useMap<string, User>([
  ["1", { id: "1", name: "Alice" }],
]);

set("2", { id: "2", name: "Bob" }); // add / overwrite
remove("1");                          // delete a key
setAll(entries);                      // replace everything
reset();                              // back to initial
```

Immutable updates (new `Map` on every change), a `ReadonlyMap` return type, stable action identities, lazy initialization, and no-op skipping. Perfect for keyed collections, caches, form field maps, and feature flags.

</details>

<details>
<summary><strong>useSet</strong> — Set state with immutable updates</summary>

```tsx
import { useSet } from "@usefy/use-set";

const [selected, { add, remove, toggle, has, clear, reset }] = useSet<string>(["1"]);

toggle("2");           // flip membership
toggle("3", true);     // force add (like DOMTokenList.toggle)
has("1");              // membership check
remove("1");           // delete
```

Immutable updates (new `Set` on every change), a `ReadonlySet` return type, `toggle` with an optional force argument, stable action identities, lazy initialization, and no-op skipping. Perfect for multi-select, tag filters, and tracking selected ids.

</details>

<details>
<summary><strong>useList</strong> — Array state with immutable updates</summary>

```tsx
import { useList } from "@usefy/use-list";

const [todos, { push, removeAt, updateAt, sort, filter, reset }] = useList<Todo>([]);

push({ id: 1, text: "Hi", completed: false }); // append
updateAt(0, { ...todos[0], completed: true }); // replace at index
removeAt(0);                                    // delete at index
sort((a, b) => a.id - b.id);                    // immutable sort
```

Immutable updates (new array on every change), a `readonly T[]` return type, a rich action set (`set`/`push`/`filter`/`sort`/`clear`/`removeAt`/`insertAt`/`updateAt`/`reset`), `set` with an updater function, stable action identities, lazy init, and no-op skipping. Perfect for todo lists, editable tables, and ordered collections.

</details>

<details>
<summary><strong>useQueue</strong> — FIFO queue state with immutable updates</summary>

```tsx
import { useQueue } from "@usefy/use-queue";

const [queue, { add, remove, peek, clear, reset }] = useQueue<Task>([]);

add(task);              // enqueue to the back (variadic: add(a, b, c))
const next = remove();  // dequeue the front and return it (undefined if empty)
peek();                 // read the front without mutating
```

FIFO semantics (`add` to the back, `remove`/`peek` from the front), immutable updates (new array on every change), a `readonly T[]` return type, `remove` that returns the dequeued item, stable action identities, lazy init, and no-op skipping. Read `first`/`last`/`size` directly from the queue (`queue[0]`, `queue[queue.length - 1]`, `queue.length`). Perfect for task runners, print/job queues, message buffers, and breadth-first traversals.

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

<details>
<summary><strong>useTimer</strong> — Countdown timer with accurate timing</summary>

```tsx
import { useTimer, ms } from "@usefy/use-timer";

const timer = useTimer(ms.minutes(5), {
  format: "MM:SS",
  autoStart: false,
  loop: false,
  onComplete: () => console.log("Time's up!"),
});

// Controls
timer.start();
timer.pause();
timer.reset();
timer.addTime(ms.seconds(10));
timer.subtractTime(ms.seconds(5));

// State
timer.time; // "05:00"
timer.progress; // 0-100
timer.isRunning; // boolean
```

Perfect for countdown timers, Pomodoro apps, kitchen timers, and time-based UIs with smart render optimization.

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

### 📡 Communication

<details>
<summary><strong>useSignal</strong> — Event-driven communication between components</summary>

```tsx
import { useSignal } from "@usefy/use-signal";

// Emitter component
function RefreshButton() {
  const { emit, info } = useSignal("dashboard-refresh");
  
  return (
    <button onClick={() => emit()}>
      Refresh All ({info.subscriberCount} widgets)
    </button>
  );
}

// Subscriber component
function DataWidget() {
  const { signal } = useSignal("dashboard-refresh");
  
  useEffect(() => {
    fetchData(); // Refetch when signal changes
  }, [signal]);
  
  return <div>Widget Content</div>;
}

// With typed data payload
interface NotificationData {
  type: "success" | "error";
  message: string;
}

function NotificationEmitter() {
  const { emit } = useSignal<NotificationData>("notification");
  
  return (
    <button onClick={() => emit({ type: "success", message: "Done!" })}>
      Notify
    </button>
  );
}

function NotificationReceiver() {
  const { signal, info } = useSignal<NotificationData>("notification");
  
  useEffect(() => {
    if (signal > 0 && info.data) {
      toast[info.data.type](info.data.message);
    }
  }, [signal]);
  
  return null;
}
```

**Perfect for:** Dashboard refresh, form reset, cache invalidation, multi-step flows, and event broadcasting.

> ⚠️ **Note:** `useSignal` is NOT a global state management solution. It's designed for lightweight event-driven communication. For complex state management, use Context, Zustand, Jotai, or Recoil.

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

### ⌨️ Keyboard

<details>
<summary><strong>useKeyPress</strong> — Keyboard key, shortcut, and combination detection</summary>

```tsx
import { useKeyPress } from "@usefy/use-key-press";

// Single key — true while held
const escapePressed = useKeyPress("Escape");

// Combination (mod = Ctrl on Win/Linux, Cmd on macOS)
useKeyPress("mod+k", {
  preventDefault: true,
  onPress: () => openCommandPalette(),
});

// Alternative bindings — array is OR
useKeyPress(["ctrl+s", "meta+s"], {
  preventDefault: true,
  onPress: () => save(),
});

// Physical keys for game controls (layout-independent)
const forward = useKeyPress("w", { matchBy: "code" });

// Custom predicate
const digitPressed = useKeyPress((e) => /^[0-9]$/.test(e.key));

// Ignore shortcuts while typing in inputs
useKeyPress("f", { ignoreInputElements: true, onPress: openFilter });
```

Perfect for command palettes, editor shortcuts, modal dismissal, and game controls — with cross-platform `mod`, `onPress`/`onRelease` callbacks, auto-repeat handling, and blur-safe held state.

</details>

### 📍 Location

<details>
<summary><strong>useGeolocation</strong> — Device geolocation with real-time tracking and distance calculation</summary>

```tsx
import { useGeolocation } from "@usefy/use-geolocation";

// Basic usage - get current position
const { position, loading, error } = useGeolocation();

// Real-time tracking
const { position, watchPosition, clearWatch } = useGeolocation({
  immediate: false,
  watch: false,
  onPositionChange: (pos) => console.log("Position updated:", pos),
});

// Distance calculation
const { position, distanceFrom, bearingTo } = useGeolocation();

// Calculate distance to New York (in meters)
const distance = distanceFrom(40.7128, -74.006);

// Calculate bearing/direction to London (0-360 degrees)
const bearing = bearingTo(51.5074, -0.1278);

// High accuracy mode
const { position } = useGeolocation({
  enableHighAccuracy: true,
  timeout: 10000,
});

// Permission tracking
const { permission } = useGeolocation({
  onPermissionChange: (state) => {
    console.log("Permission:", state); // "prompt" | "granted" | "denied" | "unavailable"
  },
});
```

Perfect for location-based apps, maps, navigation, distance tracking, and geofencing with built-in Haversine distance calculation and bearing utilities.

</details>

### 👁️ Visibility

<details>
<summary><strong>useIntersectionObserver</strong> — Efficient element visibility detection with Intersection Observer API</summary>

```tsx
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

// Basic usage - detect when element enters viewport
const { ref, inView, entry } = useIntersectionObserver();

// Lazy loading images
const { ref, inView } = useIntersectionObserver({
  triggerOnce: true, // Stop observing after first detection
  threshold: 0.1, // Trigger when 10% visible
  rootMargin: "50px", // Start loading 50px before entering viewport
});

// Infinite scroll with sentinel element
const { ref, inView } = useIntersectionObserver({
  threshold: 1.0,
  rootMargin: "100px", // Preload 100px ahead
});

useEffect(() => {
  if (inView) loadMoreItems();
}, [inView]);

// Scroll animations
const { ref, inView } = useIntersectionObserver({
  triggerOnce: true,
  threshold: 0.3,
});

// Progress tracking with multiple thresholds
const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
const { ref, entry } = useIntersectionObserver({
  threshold: thresholds,
  onChange: (entry) => {
    setProgress(Math.round(entry.intersectionRatio * 100));
  },
});

// Custom scroll container
const containerRef = useRef<HTMLDivElement>(null);
const { ref, inView } = useIntersectionObserver({
  root: containerRef.current,
  rootMargin: "0px",
});

// Delayed observation
const { ref, inView } = useIntersectionObserver({
  delay: 500, // Wait 500ms before creating observer
});
```

Perfect for lazy loading, infinite scroll, scroll animations, progress tracking, and any visibility-based interactions with smart re-render optimization.

</details>

<details>
<summary><strong>useHover</strong> — Element hover detection with delay support</summary>

```tsx
import { useHover } from "@usefy/use-hover";

// Basic usage
const { ref, isHovered } = useHover<HTMLDivElement>();

// Tuple destructuring
const [ref, isHovered] = useHover<HTMLDivElement>();

// Tooltip pattern with delays
const { ref, isHovered } = useHover<HTMLButtonElement>({
  delay: { enter: 500, leave: 100 }, // Show after 500ms, hide after 100ms
});

// Dropdown menu pattern
const { ref, isHovered } = useHover<HTMLDivElement>({
  delay: { leave: 300 }, // Keep open for 300ms after mouse leaves
});

// With onChange callback
const { ref, isHovered } = useHover<HTMLDivElement>({
  onChange: (hovered, event) => {
    if (hovered) analytics.track("element_hovered");
  },
});

// Touch support for mobile devices
const { ref, isHovered } = useHover<HTMLButtonElement>({
  detectTouch: true,
  delay: { leave: 1500 },
});

// Conditional enabling
const [enabled, setEnabled] = useState(true);
const { ref, isHovered } = useHover<HTMLDivElement>({ enabled });
```

Perfect for tooltips, dropdowns, interactive cards, and any hover-based interactions with configurable delays and touch support.

</details>

### 🔄 Lifecycle

<details>
<summary><strong>useUnmount</strong> — Execute callback on component unmount</summary>

```tsx
// Basic usage
useUnmount(() => {
  console.log("Component unmounted");
});

// With latest state access
const [formData, setFormData] = useState({});
useUnmount(() => {
  // Always accesses latest formData value
  saveToLocalStorage(formData);
});

// Conditional cleanup
useUnmount(
  () => {
    sendAnalyticsEvent("component_unmounted");
  },
  { enabled: trackingEnabled }
);
```

Perfect for saving data, sending analytics, and cleaning up resources on component removal.

</details>

<details>
<summary><strong>useInit</strong> — One-time initialization with async support, retry, timeout, and conditional execution</summary>

```tsx
// Basic async initialization
const { isInitialized, isInitializing, error } = useInit(async () => {
  await loadConfiguration();
});

// With retry and timeout
const { error, reinitialize } = useInit(
  async () => {
    await connectToServer();
  },
  {
    retry: 3,
    retryDelay: 1000,
    timeout: 5000,
  }
);

// Conditional initialization
useInit(
  () => {
    initializeFeature();
  },
  { when: isEnabled }
);

// With cleanup function
useInit(() => {
  const subscription = eventBus.subscribe();
  return () => subscription.unsubscribe();
});
```

Perfect for initializing services, loading configuration, setting up subscriptions, and any one-time setup tasks with robust error handling.

</details>

---

## Test Coverage

All packages are comprehensively tested using Vitest to ensure reliability and stability.

📊 <a href="https://mirunamu00.github.io/usefy/coverage/" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

> 💡 To generate coverage report locally, run `pnpm test:coverage`. The report will be available at `coverage/index.html`.

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

- 📦 <a href="https://www.npmjs.com/org/usefy" target="_blank" rel="noopener noreferrer">npm Organization</a>
- 🐙 <a href="https://github.com/mirunamu00/usefy" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
- 📝 <a href="https://github.com/mirunamu00/usefy/blob/master/packages/usefy/CHANGELOG.md" target="_blank" rel="noopener noreferrer">Changelog</a>
- 🐛 <a href="https://github.com/mirunamu00/usefy/issues" target="_blank" rel="noopener noreferrer">Issue Tracker</a>

---

## License

MIT © <a href="https://github.com/mirunamu00" target="_blank" rel="noopener noreferrer">mirunamu</a>

---

<p align="center">
  <sub>Built with ❤️ by the usefy team</sub>
</p>

<p align="center">
  <a href="https://github.com/mirunamu00/usefy" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/github/stars/mirunamu00/usefy?style=social" alt="GitHub stars" />
  </a>
</p>

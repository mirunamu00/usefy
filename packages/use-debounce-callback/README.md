<p align="center">
  <img src="https://raw.githubusercontent.com/geon0529/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-debounce-callback</h1>

<p align="center">
  <strong>A powerful React hook for debounced callbacks with cancel, flush, and pending methods</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-debounce-callback">
    <img src="https://img.shields.io/npm/v/@usefy/use-debounce-callback.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-debounce-callback">
    <img src="https://img.shields.io/npm/dm/@usefy/use-debounce-callback.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-debounce-callback">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-debounce-callback?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/geon0529/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-debounce-callback.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#license">License</a>
</p>

---

## Overview

`@usefy/use-debounce-callback` provides a debounced version of your callback function with full control methods: `cancel()`, `flush()`, and `pending()`. Perfect for API calls, form submissions, event handlers, and any scenario requiring debounced function execution with fine-grained control.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-debounce-callback?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with generics and exported interfaces
- **Full Control** — `cancel()`, `flush()`, and `pending()` methods
- **Flexible Options** — Leading edge, trailing edge, and maxWait support
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Lightweight** — Minimal bundle footprint (~500B minified + gzipped)
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-debounce-callback

# yarn
yarn add @usefy/use-debounce-callback

# pnpm
pnpm add @usefy/use-debounce-callback
```

### Peer Dependencies

This package requires React 18 or 19:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

---

## Quick Start

```tsx
import { useDebounceCallback } from '@usefy/use-debounce-callback';

function SearchInput() {
  const [query, setQuery] = useState('');

  const debouncedSearch = useDebounceCallback((searchTerm: string) => {
    fetchSearchResults(searchTerm);
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search..."
    />
  );
}
```

---

## API Reference

### `useDebounceCallback<T>(callback, delay?, options?)`

A hook that returns a debounced version of the provided callback function.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `callback` | `T extends (...args: any[]) => any` | — | The callback function to debounce |
| `delay` | `number` | `500` | The debounce delay in milliseconds |
| `options` | `UseDebounceCallbackOptions` | `{}` | Additional configuration options |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `leading` | `boolean` | `false` | Invoke on the leading edge (first call) |
| `trailing` | `boolean` | `true` | Invoke on the trailing edge (after delay) |
| `maxWait` | `number` | — | Maximum time to wait before forcing invocation |

#### Returns `DebouncedFunction<T>`

| Property | Type | Description |
|----------|------|-------------|
| `(...args)` | `ReturnType<T>` | The debounced function (same signature as original) |
| `cancel` | `() => void` | Cancels any pending invocation |
| `flush` | `() => void` | Immediately invokes any pending invocation |
| `pending` | `() => boolean` | Returns `true` if there's a pending invocation |

---

## Examples

### Auto-Save with Cancel

```tsx
import { useDebounceCallback } from '@usefy/use-debounce-callback';

function Editor() {
  const [content, setContent] = useState('');

  const debouncedSave = useDebounceCallback((text: string) => {
    saveToServer(text);
    console.log('Auto-saved');
  }, 1000);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    debouncedSave(e.target.value);
  };

  const handleManualSave = () => {
    // Flush any pending save immediately
    debouncedSave.flush();
  };

  const handleDiscard = () => {
    // Cancel pending save and reset content
    debouncedSave.cancel();
    setContent('');
  };

  return (
    <div>
      <textarea value={content} onChange={handleChange} />
      <button onClick={handleManualSave}>Save Now</button>
      <button onClick={handleDiscard}>Discard</button>
      {debouncedSave.pending() && <span>Saving...</span>}
    </div>
  );
}
```

### Search with Immediate First Call

```tsx
import { useDebounceCallback } from '@usefy/use-debounce-callback';

function SearchWithSuggestions() {
  const [results, setResults] = useState([]);

  // First keystroke triggers immediate search, then debounce
  const debouncedSearch = useDebounceCallback(
    async (query: string) => {
      const data = await fetch(`/api/search?q=${query}`);
      setResults(await data.json());
    },
    300,
    { leading: true }
  );

  return (
    <input
      type="text"
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Form Validation

```tsx
import { useDebounceCallback } from '@usefy/use-debounce-callback';

function RegistrationForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = useDebounceCallback(async (value: string) => {
    if (!value.includes('@')) {
      setError('Invalid email format');
      return;
    }
    const response = await fetch(`/api/check-email?e=${value}`);
    const { available } = await response.json();
    setError(available ? '' : 'Email already registered');
  }, 500);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(''); // Clear error immediately
    validateEmail(e.target.value);
  };

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={handleChange}
        placeholder="Enter email"
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### Event Handler with maxWait

```tsx
import { useDebounceCallback } from '@usefy/use-debounce-callback';

function ResizeHandler() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Debounce resize events, but guarantee update every 1 second
  const handleResize = useDebounceCallback(
    () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    },
    250,
    { maxWait: 1000 }
  );

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      handleResize.cancel();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return (
    <div>
      Window: {dimensions.width} x {dimensions.height}
    </div>
  );
}
```

### API Request with Pending State

```tsx
import { useDebounceCallback } from '@usefy/use-debounce-callback';

function DataFetcher() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useDebounceCallback(
    async (params: QueryParams) => {
      setLoading(true);
      try {
        const response = await fetch('/api/data', {
          method: 'POST',
          body: JSON.stringify(params),
        });
        setData(await response.json());
      } finally {
        setLoading(false);
      }
    },
    500
  );

  return (
    <div>
      <button onClick={() => fetchData({ page: 1 })}>
        {fetchData.pending() ? 'Request pending...' : 'Fetch Data'}
      </button>
      {loading && <Spinner />}
    </div>
  );
}
```

### Cleanup on Unmount

```tsx
import { useDebounceCallback } from '@usefy/use-debounce-callback';

function Component() {
  const debouncedAction = useDebounceCallback(() => {
    // Some action
  }, 500);

  // Cancel pending on unmount
  useEffect(() => {
    return () => {
      debouncedAction.cancel();
    };
  }, [debouncedAction]);

  return <button onClick={debouncedAction}>Action</button>;
}
```

---

## TypeScript

This hook is written in TypeScript with full generic support.

```tsx
import {
  useDebounceCallback,
  type UseDebounceCallbackOptions,
  type DebouncedFunction,
} from '@usefy/use-debounce-callback';

// Type inference from callback
const debouncedFn = useDebounceCallback((a: string, b: number) => {
  return `${a}-${b}`;
}, 300);

// debouncedFn(string, number) => string | undefined
// debouncedFn.cancel() => void
// debouncedFn.flush() => void
// debouncedFn.pending() => boolean
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

| Category | Tests | Coverage |
|----------|-------|----------|
| Initialization | 4 | 100% |
| Basic Debouncing | 6 | 100% |
| Leading Edge | 5 | 100% |
| Trailing Edge | 3 | 100% |
| maxWait Option | 4 | 100% |
| cancel Method | 4 | 100% |
| flush Method | 4 | 100% |
| pending Method | 4 | 100% |
| Callback Updates | 3 | 100% |
| Cleanup | 2 | 100% |
| **Total** | **39** | **100%** |

### Test Categories

<details>
<summary><strong>Control Method Tests</strong></summary>

- Cancel pending invocations
- Flush immediately invokes pending callback
- pending() returns correct state
- cancel() clears pending state
- flush() clears pending state after invocation

</details>

<details>
<summary><strong>Leading/Trailing Edge Tests</strong></summary>

- Invoke on leading edge with leading: true
- No immediate invoke with leading: false (default)
- Invoke on trailing edge with trailing: true (default)
- No trailing invoke with trailing: false
- Combined leading and trailing options

</details>

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test --coverage
```

---

## Related Packages

Explore other hooks in the **@usefy** collection:

| Package | Description |
|---------|-------------|
| [@usefy/use-debounce](https://www.npmjs.com/package/@usefy/use-debounce) | Value debouncing |
| [@usefy/use-throttle](https://www.npmjs.com/package/@usefy/use-throttle) | Value throttling |
| [@usefy/use-throttle-callback](https://www.npmjs.com/package/@usefy/use-throttle-callback) | Throttled callbacks |
| [@usefy/use-toggle](https://www.npmjs.com/package/@usefy/use-toggle) | Boolean state management |
| [@usefy/use-counter](https://www.npmjs.com/package/@usefy/use-counter) | Counter state management |
| [@usefy/use-click-any-where](https://www.npmjs.com/package/@usefy/use-click-any-where) | Global click detection |

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/geon0529/usefy/blob/master/CONTRIBUTING.md) for details.

```bash
# Clone the repository
git clone https://github.com/geon0529/usefy.git

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build
```

---

## License

MIT © [mirunamu](https://github.com/geon0529)

This package is part of the [usefy](https://github.com/geon0529/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>

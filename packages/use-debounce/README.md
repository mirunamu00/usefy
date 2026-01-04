<p align="center">
  <img src="https://raw.githubusercontent.com/geon0529/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-debounce</h1>

<p align="center">
  <strong>A feature-rich React hook for debouncing values with leading/trailing edge and maxWait support</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-debounce">
    <img src="https://img.shields.io/npm/v/@usefy/use-debounce.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-debounce">
    <img src="https://img.shields.io/npm/dm/@usefy/use-debounce.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-debounce">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-debounce?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/geon0529/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-debounce.svg?style=flat-square&color=007acc" alt="license" />
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

`@usefy/use-debounce` is a powerful React hook for debouncing values with advanced options like leading edge, trailing edge, and maximum wait time. Perfect for search inputs, form validation, API calls, and any scenario where you need to limit the rate of value updates.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-debounce?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with generics and exported interfaces
- **Flexible Options** — Leading edge, trailing edge, and maxWait support
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Lightweight** — Minimal bundle footprint (~400B minified + gzipped)
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-debounce

# yarn
yarn add @usefy/use-debounce

# pnpm
pnpm add @usefy/use-debounce
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
import { useDebounce } from "@usefy/use-debounce";

function SearchInput() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

---

## API Reference

### `useDebounce<T>(value, delay?, options?)`

A hook that returns a debounced version of the provided value.

#### Parameters

| Parameter | Type                 | Default | Description                        |
| --------- | -------------------- | ------- | ---------------------------------- |
| `value`   | `T`                  | —       | The value to debounce              |
| `delay`   | `number`             | `500`   | The debounce delay in milliseconds |
| `options` | `UseDebounceOptions` | `{}`    | Additional configuration options   |

#### Options

| Option     | Type      | Default | Description                                   |
| ---------- | --------- | ------- | --------------------------------------------- |
| `leading`  | `boolean` | `false` | Update on the leading edge (first call)       |
| `trailing` | `boolean` | `true`  | Update on the trailing edge (after delay)     |
| `maxWait`  | `number`  | —       | Maximum time to wait before forcing an update |

#### Returns

| Type | Description         |
| ---- | ------------------- |
| `T`  | The debounced value |

---

## Examples

### Basic Search Input

```tsx
import { useDebounce } from "@usefy/use-debounce";

function SearchInput() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState([]);

  useEffect(() => {
    async function search() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      const data = await fetch(`/api/search?q=${debouncedQuery}`);
      setResults(await data.json());
    }
    search();
  }, [debouncedQuery]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search..."
      />
      <ul>
        {results.map((result) => (
          <li key={result.id}>{result.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### With Leading Edge (Instant First Update)

```tsx
import { useDebounce } from "@usefy/use-debounce";

function FilterPanel() {
  const [filters, setFilters] = useState({ category: "all", price: 0 });

  // Update immediately on first change, then debounce subsequent changes
  const debouncedFilters = useDebounce(filters, 500, { leading: true });

  useEffect(() => {
    applyFilters(debouncedFilters);
  }, [debouncedFilters]);

  return (
    <div>
      <select
        value={filters.category}
        onChange={(e) =>
          setFilters((f) => ({ ...f, category: e.target.value }))
        }
      >
        <option value="all">All</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
      <input
        type="range"
        value={filters.price}
        onChange={(e) => setFilters((f) => ({ ...f, price: +e.target.value }))}
      />
    </div>
  );
}
```

### With maxWait (Guaranteed Updates)

```tsx
import { useDebounce } from "@usefy/use-debounce";

function AutoSaveEditor() {
  const [content, setContent] = useState("");

  // Debounce for 1 second, but guarantee save every 5 seconds during continuous typing
  const debouncedContent = useDebounce(content, 1000, { maxWait: 5000 });

  useEffect(() => {
    if (debouncedContent) {
      saveToServer(debouncedContent);
    }
  }, [debouncedContent]);

  return (
    <textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      placeholder="Start typing... (auto-saves)"
    />
  );
}
```

### Form Validation

```tsx
import { useDebounce } from "@usefy/use-debounce";

function RegistrationForm() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const debouncedUsername = useDebounce(username, 500);

  useEffect(() => {
    async function checkAvailability() {
      if (debouncedUsername.length < 3) {
        setError("Username must be at least 3 characters");
        return;
      }
      const response = await fetch(
        `/api/check-username?u=${debouncedUsername}`
      );
      const { available } = await response.json();
      setError(available ? "" : "Username is already taken");
    }

    if (debouncedUsername) {
      checkAvailability();
    }
  }, [debouncedUsername]);

  return (
    <div>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Choose a username"
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### Debouncing Object Values

```tsx
import { useDebounce } from "@usefy/use-debounce";

function FilteredTable() {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    sortBy: "date",
  });

  const debouncedFilters = useDebounce(filters, 300);

  useEffect(() => {
    fetchTableData(debouncedFilters);
  }, [debouncedFilters]);

  return (
    <div>
      <input
        value={filters.search}
        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        placeholder="Search..."
      />
      <select
        value={filters.status}
        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
```

---

## TypeScript

This hook is written in TypeScript with full generic support.

```tsx
import { useDebounce, type UseDebounceOptions } from "@usefy/use-debounce";

// Generic type inference
const debouncedString = useDebounce("hello", 300); // string
const debouncedNumber = useDebounce(42, 300); // number
const debouncedObject = useDebounce({ x: 1 }, 300); // { x: number }

// Explicit generic type
interface Filters {
  search: string;
  category: string;
}
const debouncedFilters = useDebounce<Filters>(filters, 300);
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://geon0529.github.io/usefy/coverage/use-debounce/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Categories

<details>
<summary><strong>Initialization Tests</strong></summary>

- Initialize with initial value
- Initialize with different types (string, number, boolean, object, array)
- Use default delay of 500ms

</details>

<details>
<summary><strong>Leading/Trailing Edge Tests</strong></summary>

- Update immediately with leading: true
- Do not update immediately with leading: false (default)
- Update on trailing edge with trailing: true (default)
- No update with trailing: false
- Combined leading and trailing options

</details>

<details>
<summary><strong>maxWait Tests</strong></summary>

- Force update after maxWait even with continuous changes
- Respect maxWait when delay is longer
- Work correctly with both leading and maxWait

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

## License

MIT © [mirunamu](https://github.com/geon0529)

This package is part of the [usefy](https://github.com/geon0529/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/geon0529/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-local-storage</h1>

<p align="center">
  <strong>A powerful React hook for persisting state in localStorage with automatic cross-tab synchronization</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-local-storage">
    <img src="https://img.shields.io/npm/v/@usefy/use-local-storage.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-local-storage">
    <img src="https://img.shields.io/npm/dm/@usefy/use-local-storage.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-local-storage">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-local-storage?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/geon0529/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-local-storage.svg?style=flat-square&color=007acc" alt="license" />
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

`@usefy/use-local-storage` provides a `useState`-like API for persisting data in localStorage. Features include cross-tab synchronization, custom serialization, lazy initialization, error handling, and a `removeValue` function. Data persists across browser sessions.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-local-storage?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with generics and exported interfaces
- **useState-like API** — Familiar tuple return: `[value, setValue, removeValue]`
- **Cross-Tab Sync** — Automatic synchronization across browser tabs
- **Custom Serialization** — Support for Date, Map, Set, or any custom type
- **Lazy Initialization** — Function initializer support for expensive defaults
- **Error Handling** — `onError` callback for graceful error recovery
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Stable References** — Memoized functions for optimal performance
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-local-storage

# yarn
yarn add @usefy/use-local-storage

# pnpm
pnpm add @usefy/use-local-storage
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
import { useLocalStorage } from '@usefy/use-local-storage';

function ThemeToggle() {
  const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={removeTheme}>Reset</button>
    </div>
  );
}
```

---

## API Reference

### `useLocalStorage<T>(key, initialValue, options?)`

A hook that persists state in localStorage with automatic synchronization.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | The localStorage key |
| `initialValue` | `T \| () => T` | Initial value or lazy initializer function |
| `options` | `UseLocalStorageOptions<T>` | Configuration options |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serializer` | `(value: T) => string` | `JSON.stringify` | Custom serializer function |
| `deserializer` | `(value: string) => T` | `JSON.parse` | Custom deserializer function |
| `syncTabs` | `boolean` | `true` | Sync value across browser tabs |
| `onError` | `(error: Error) => void` | — | Callback for error handling |

#### Returns `[T, SetValue<T>, RemoveValue]`

| Index | Type | Description |
|-------|------|-------------|
| `[0]` | `T` | Current stored value |
| `[1]` | `Dispatch<SetStateAction<T>>` | Function to update value (same as useState) |
| `[2]` | `() => void` | Function to remove value and reset to initial |

---

## Examples

### Basic String Storage

```tsx
import { useLocalStorage } from '@usefy/use-local-storage';

function NameInput() {
  const [name, setName, removeName] = useLocalStorage('userName', '');

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <button onClick={removeName}>Clear</button>
      <p>Hello, {name || 'Guest'}!</p>
    </div>
  );
}
```

### Object State

```tsx
import { useLocalStorage } from '@usefy/use-local-storage';

interface UserSettings {
  notifications: boolean;
  language: string;
  fontSize: number;
}

function SettingsPanel() {
  const [settings, setSettings] = useLocalStorage<UserSettings>('settings', {
    notifications: true,
    language: 'en',
    fontSize: 16,
  });

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={settings.notifications}
          onChange={(e) =>
            setSettings((prev) => ({ ...prev, notifications: e.target.checked }))
          }
        />
        Enable Notifications
      </label>

      <select
        value={settings.language}
        onChange={(e) =>
          setSettings((prev) => ({ ...prev, language: e.target.value }))
        }
      >
        <option value="en">English</option>
        <option value="ko">한국어</option>
        <option value="ja">日本語</option>
      </select>

      <input
        type="range"
        min="12"
        max="24"
        value={settings.fontSize}
        onChange={(e) =>
          setSettings((prev) => ({ ...prev, fontSize: +e.target.value }))
        }
      />
    </div>
  );
}
```

### Lazy Initialization

```tsx
import { useLocalStorage } from '@usefy/use-local-storage';

function ExpensiveDefaultDemo() {
  // Expensive computation only runs if no stored value exists
  const [config, setConfig] = useLocalStorage('appConfig', () => {
    console.log('Computing expensive default...');
    return generateComplexDefaultConfig();
  });

  return <ConfigEditor config={config} onChange={setConfig} />;
}
```

### Custom Serialization (Date)

```tsx
import { useLocalStorage } from '@usefy/use-local-storage';

function DatePicker() {
  const [lastVisit, setLastVisit] = useLocalStorage<Date>(
    'lastVisit',
    new Date(),
    {
      serializer: (date) => date.toISOString(),
      deserializer: (str) => new Date(str),
    }
  );

  return (
    <div>
      <p>Last visit: {lastVisit.toLocaleDateString()}</p>
      <button onClick={() => setLastVisit(new Date())}>Update</button>
    </div>
  );
}
```

### Custom Serialization (Map)

```tsx
import { useLocalStorage } from '@usefy/use-local-storage';

function FavoritesManager() {
  const [favorites, setFavorites] = useLocalStorage<Map<string, boolean>>(
    'favorites',
    new Map(),
    {
      serializer: (map) => JSON.stringify([...map.entries()]),
      deserializer: (str) => new Map(JSON.parse(str)),
    }
  );

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Map(prev);
      next.has(id) ? next.delete(id) : next.set(id, true);
      return next;
    });
  };

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => toggleFavorite(item.id)}>
            {favorites.has(item.id) ? '★' : '☆'}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### Error Handling

```tsx
import { useLocalStorage } from '@usefy/use-local-storage';

function RobustStorage() {
  const [data, setData] = useLocalStorage('userData', { items: [] }, {
    onError: (error) => {
      console.error('Storage error:', error.message);
      // Could show toast notification, log to analytics, etc.
      toast.error('Failed to save data. Storage may be full.');
    },
  });

  return <DataEditor data={data} onChange={setData} />;
}
```

### Cross-Tab Synchronization

```tsx
import { useLocalStorage } from '@usefy/use-local-storage';

function CartCounter() {
  // Changes in one tab automatically sync to other tabs
  const [cartItems, setCartItems] = useLocalStorage<string[]>('cart', []);

  const addItem = (item: string) => {
    setCartItems((prev) => [...prev, item]);
  };

  return (
    <div>
      <span>Cart: {cartItems.length} items</span>
      {/* Other tabs will see the updated count */}
    </div>
  );
}
```

### Disable Tab Sync

```tsx
import { useLocalStorage } from '@usefy/use-local-storage';

function LocalOnlyData() {
  // Don't sync changes from other tabs
  const [draft, setDraft] = useLocalStorage('draft', '', {
    syncTabs: false,
  });

  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      placeholder="This draft won't sync with other tabs"
    />
  );
}
```

### Shopping Cart

```tsx
import { useLocalStorage } from '@usefy/use-local-storage';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

function ShoppingCart() {
  const [cart, setCart, clearCart] = useLocalStorage<CartItem[]>('cart', []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div>
      <h2>Cart ({cart.length} items)</h2>
      <ul>
        {cart.map((item) => (
          <li key={item.id}>
            {item.name} x {item.quantity} - ${item.price * item.quantity}
          </li>
        ))}
      </ul>
      <p>Total: ${total.toFixed(2)}</p>
      <button onClick={clearCart}>Clear Cart</button>
    </div>
  );
}
```

---

## TypeScript

This hook is written in TypeScript with full generic support.

```tsx
import {
  useLocalStorage,
  type UseLocalStorageOptions,
  type UseLocalStorageReturn,
  type InitialValue,
} from '@usefy/use-local-storage';

// Generic type inference
const [name, setName] = useLocalStorage('name', 'John');     // string
const [count, setCount] = useLocalStorage('count', 0);        // number
const [items, setItems] = useLocalStorage('items', [1, 2]);   // number[]

// Explicit generic type
interface User {
  id: string;
  name: string;
}
const [user, setUser] = useLocalStorage<User | null>('user', null);
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

| Category | Tests | Coverage |
|----------|-------|----------|
| Initialization | 7 | 100% |
| setValue | 5 | 100% |
| removeValue | 2 | 100% |
| Type Preservation | 5 | 100% |
| Custom Serialization | 2 | 100% |
| Cross-Tab Sync | 5 | 100% |
| Key Changes | 2 | 100% |
| Function Stability | 3 | 100% |
| Multiple Instances | 2 | 100% |
| Edge Cases | 6 | 100% |
| Cleanup | 1 | 100% |
| **Total** | **40** | **100%** |

### Test Categories

<details>
<summary><strong>Initialization Tests</strong></summary>

- Return initial value when localStorage is empty
- Return stored value when localStorage has data
- Support lazy initialization with function
- Not call initializer when localStorage has data
- Fallback to initial value when JSON parse fails
- Call onError when localStorage read fails

</details>

<details>
<summary><strong>Cross-Tab Sync Tests</strong></summary>

- Update value when storage event is fired
- Reset to initial when key is removed in another tab
- Ignore storage events for different keys
- Not sync when syncTabs is false
- Fallback to initial value on invalid JSON

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
| [@usefy/use-session-storage](https://www.npmjs.com/package/@usefy/use-session-storage) | Session storage persistence |
| [@usefy/use-toggle](https://www.npmjs.com/package/@usefy/use-toggle) | Boolean state management |
| [@usefy/use-counter](https://www.npmjs.com/package/@usefy/use-counter) | Counter state management |
| [@usefy/use-debounce](https://www.npmjs.com/package/@usefy/use-debounce) | Value debouncing |
| [@usefy/use-throttle](https://www.npmjs.com/package/@usefy/use-throttle) | Value throttling |
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

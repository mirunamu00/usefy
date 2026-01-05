<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-counter</h1>

<p align="center">
  <strong>A lightweight, type-safe React hook for counter state management</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-counter">
    <img src="https://img.shields.io/npm/v/@usefy/use-counter.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-counter">
    <img src="https://img.shields.io/npm/dm/@usefy/use-counter.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-counter">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-counter?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-counter.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usecounter--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-counter` is a simple yet powerful React hook for managing counter state. It provides a clean, intuitive API with stable function references, making it ideal for building increment/decrement UIs, pagination controls, quantity selectors, and more.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-counter?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with comprehensive type definitions
- **Stable References** — Functions are memoized with `useCallback` for optimal performance
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Lightweight** — Minimal bundle footprint (~200B minified + gzipped)
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-counter

# yarn
yarn add @usefy/use-counter

# pnpm
pnpm add @usefy/use-counter
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
import { useCounter } from "@usefy/use-counter";

function Counter() {
  const { count, increment, decrement, reset } = useCounter(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

---

## API Reference

### `useCounter(initialValue?)`

A hook that manages counter state with increment, decrement, and reset capabilities.

#### Parameters

| Parameter      | Type     | Default | Description                      |
| -------------- | -------- | ------- | -------------------------------- |
| `initialValue` | `number` | `0`     | The initial value of the counter |

#### Returns

| Property    | Type         | Description                             |
| ----------- | ------------ | --------------------------------------- |
| `count`     | `number`     | The current counter value               |
| `increment` | `() => void` | Increases the counter by 1              |
| `decrement` | `() => void` | Decreases the counter by 1              |
| `reset`     | `() => void` | Resets the counter to the initial value |

---

## Examples

### Basic Counter

```tsx
import { useCounter } from "@usefy/use-counter";

function BasicCounter() {
  const { count, increment, decrement, reset } = useCounter();

  return (
    <div className="counter">
      <span className="count">{count}</span>
      <div className="controls">
        <button onClick={decrement} aria-label="Decrease">
          −
        </button>
        <button onClick={increment} aria-label="Increase">
          +
        </button>
        <button onClick={reset} aria-label="Reset">
          Reset
        </button>
      </div>
    </div>
  );
}
```

### Starting with a Custom Value

```tsx
import { useCounter } from "@usefy/use-counter";

function QuantitySelector() {
  const { count, increment, decrement } = useCounter(1);

  return (
    <div className="quantity-selector">
      <button
        onClick={decrement}
        disabled={count <= 1}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span aria-label="Quantity">{count}</span>
      <button onClick={increment} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}
```

### Pagination Control

```tsx
import { useCounter } from "@usefy/use-counter";

function Pagination({ totalPages }: { totalPages: number }) {
  const {
    count: currentPage,
    increment: nextPage,
    decrement: prevPage,
    reset,
  } = useCounter(1);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button onClick={prevPage} disabled={currentPage <= 1}>
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button onClick={nextPage} disabled={currentPage >= totalPages}>
        Next
      </button>
      <button onClick={reset}>First Page</button>
    </nav>
  );
}
```

### Multiple Independent Counters

```tsx
import { useCounter } from "@usefy/use-counter";

function ScoreBoard() {
  const teamA = useCounter(0);
  const teamB = useCounter(0);

  const resetAll = () => {
    teamA.reset();
    teamB.reset();
  };

  return (
    <div className="scoreboard">
      <div className="team">
        <h3>Team A</h3>
        <span className="score">{teamA.count}</span>
        <button onClick={teamA.increment}>+1</button>
      </div>
      <div className="team">
        <h3>Team B</h3>
        <span className="score">{teamB.count}</span>
        <button onClick={teamB.increment}>+1</button>
      </div>
      <button onClick={resetAll}>Reset Game</button>
    </div>
  );
}
```

### With Negative Values

```tsx
import { useCounter } from "@usefy/use-counter";

function TemperatureAdjuster() {
  const { count: temperature, increment, decrement, reset } = useCounter(-10);

  return (
    <div className="temperature">
      <span>{temperature}°C</span>
      <button onClick={increment}>Warmer</button>
      <button onClick={decrement}>Cooler</button>
      <button onClick={reset}>Reset to -10°C</button>
    </div>
  );
}
```

---

## TypeScript

This hook is written in TypeScript and provides full type inference out of the box.

```tsx
import { useCounter } from "@usefy/use-counter";

// Return type is automatically inferred
const { count, increment, decrement, reset } = useCounter(0);

// count: number
// increment: () => void
// decrement: () => void
// reset: () => void
```

---

## Performance

The hook uses `useCallback` to memoize all returned functions, ensuring stable references across re-renders. This is particularly important when passing these functions as props to child components or using them as dependencies in other hooks.

```tsx
const { increment, decrement, reset } = useCounter(0);

// These references remain stable across renders
useEffect(() => {
  // Safe to use as dependencies
}, [increment, decrement, reset]);
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-counter/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Categories

<details>
<summary><strong>Initialization Tests</strong></summary>

- Default value initialization (0)
- Custom initial value
- Negative initial value
- Large number support
- Explicit zero initialization

</details>

<details>
<summary><strong>Increment Tests</strong></summary>

- Increment from zero
- Increment from positive values
- Increment from negative values
- Multiple consecutive increments

</details>

<details>
<summary><strong>Decrement Tests</strong></summary>

- Decrement from positive values
- Decrement crossing zero boundary
- Decrement from negative values
- Multiple consecutive decrements

</details>

<details>
<summary><strong>Reset Tests</strong></summary>

- Reset after increment operations
- Reset after decrement operations
- Reset to negative initial value
- Reset to zero
- Multiple reset operations

</details>

<details>
<summary><strong>Complex Scenario Tests</strong></summary>

- Sequential mixed operations
- Zero boundary crossing
- State stability verification
- Alternating increment/decrement
- Large number operations
- Multiple independent hook instances
- Function reference stability across renders

</details>

### Testing Stack

- **[Vitest](https://vitest.dev/)** — Fast, modern test runner
- **[@testing-library/react](https://testing-library.com/react)** — React testing utilities
- **[jsdom](https://github.com/jsdom/jsdom)** — DOM environment for Node.js

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>

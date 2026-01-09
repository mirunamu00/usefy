<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-toggle</h1>

<p align="center">
  <strong>A lightweight, type-safe React hook for boolean state management</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-toggle">
    <img src="https://img.shields.io/npm/v/@usefy/use-toggle.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-toggle">
    <img src="https://img.shields.io/npm/dm/@usefy/use-toggle.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-toggle">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-toggle?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-toggle.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usetoggle--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-toggle` is a powerful React hook for managing boolean state with helpful utilities. It provides `toggle`, `setTrue`, `setFalse`, and `setValue` functions, making it perfect for modals, dropdowns, accordions, and any UI component with on/off states.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-toggle?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with exported interfaces
- **Stable References** — All functions are memoized with `useCallback` for optimal performance
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Lightweight** — Minimal bundle footprint (~300B minified + gzipped)
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-toggle

# yarn
yarn add @usefy/use-toggle

# pnpm
pnpm add @usefy/use-toggle
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
import { useToggle } from "@usefy/use-toggle";

function Modal() {
  const { value: isOpen, toggle, setTrue, setFalse } = useToggle(false);

  return (
    <>
      <button onClick={setTrue}>Open Modal</button>
      {isOpen && (
        <div className="modal">
          <h2>Modal Content</h2>
          <button onClick={setFalse}>Close</button>
        </div>
      )}
    </>
  );
}
```

---

## API Reference

### `useToggle(initialValue?)`

A hook that manages boolean state with toggle, setTrue, setFalse, and setValue functions.

#### Parameters

| Parameter      | Type      | Default | Description               |
| -------------- | --------- | ------- | ------------------------- |
| `initialValue` | `boolean` | `false` | The initial boolean value |

#### Returns `UseToggleReturn`

| Property   | Type                       | Description                          |
| ---------- | -------------------------- | ------------------------------------ |
| `value`    | `boolean`                  | The current boolean state            |
| `toggle`   | `() => void`               | Toggles the value (true ↔ false)     |
| `setTrue`  | `() => void`               | Sets the value to `true`             |
| `setFalse` | `() => void`               | Sets the value to `false`            |
| `setValue` | `(value: boolean) => void` | Sets the value to a specific boolean |

---

## Examples

### Modal/Dialog

```tsx
import { useToggle } from "@usefy/use-toggle";

function ConfirmDialog() {
  const { value: isOpen, setTrue: open, setFalse: close } = useToggle(false);

  return (
    <>
      <button onClick={open}>Delete Item</button>
      {isOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this item?</p>
            <div className="dialog-actions">
              <button onClick={close}>Cancel</button>
              <button
                onClick={() => {
                  deleteItem();
                  close();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### Accordion

```tsx
import { useToggle } from "@usefy/use-toggle";

function AccordionItem({ title, content }: AccordionItemProps) {
  const { value: isExpanded, toggle } = useToggle(false);

  return (
    <div className="accordion-item">
      <button
        className="accordion-header"
        onClick={toggle}
        aria-expanded={isExpanded}
      >
        {title}
        <span className={`icon ${isExpanded ? "rotate" : ""}`}>▼</span>
      </button>
      {isExpanded && <div className="accordion-content">{content}</div>}
    </div>
  );
}
```

### Dark Mode Toggle

```tsx
import { useToggle } from "@usefy/use-toggle";

function ThemeToggle() {
  const { value: isDark, toggle, setValue } = useToggle(false);

  // Sync with system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setValue(mediaQuery.matches);
  }, [setValue]);

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}
```

### Dropdown Menu

```tsx
import { useToggle } from "@usefy/use-toggle";

function Dropdown({ items }: DropdownProps) {
  const { value: isOpen, toggle, setFalse: close } = useToggle(false);

  return (
    <div className="dropdown">
      <button onClick={toggle} aria-haspopup="true" aria-expanded={isOpen}>
        Menu
      </button>
      {isOpen && (
        <ul className="dropdown-menu">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  item.onClick();
                  close();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Controlled from Props

```tsx
import { useToggle } from "@usefy/use-toggle";

function ControlledSwitch({ defaultChecked, onChange }: SwitchProps) {
  const { value, toggle } = useToggle(defaultChecked);

  const handleToggle = () => {
    toggle();
    onChange?.(!value);
  };

  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={handleToggle}
      className={`switch ${value ? "on" : "off"}`}
    >
      <span className="switch-thumb" />
    </button>
  );
}
```

---

## TypeScript

This hook is written in TypeScript and exports the `UseToggleReturn` interface.

```tsx
import { useToggle, type UseToggleReturn } from "@usefy/use-toggle";

// Return type is fully typed
const { value, toggle, setTrue, setFalse, setValue }: UseToggleReturn =
  useToggle(false);

// value: boolean
// toggle: () => void
// setTrue: () => void
// setFalse: () => void
// setValue: (value: boolean) => void
```

---

## Performance

All functions returned by the hook are memoized using `useCallback`, ensuring stable references across re-renders. This makes them safe to use as dependencies in other hooks or as props to child components.

```tsx
const { toggle, setTrue, setFalse, setValue } = useToggle(false);

// These references remain stable across renders
useEffect(() => {
  // Safe to use as dependencies
}, [toggle, setTrue, setFalse, setValue]);
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-toggle/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Categories

<details>
<summary><strong>Initialization Tests</strong></summary>

- Default value initialization (false)
- Custom initial value (true/false)
- Return all required functions

</details>

<details>
<summary><strong>Toggle Tests</strong></summary>

- Toggle from false to true
- Toggle from true to false
- Multiple toggles
- Rapid successive toggles

</details>

<details>
<summary><strong>setTrue/setFalse Tests</strong></summary>

- Set value from opposite state
- Maintain value when already set
- Multiple consecutive calls
- After toggle operations

</details>

<details>
<summary><strong>Function Reference Tests</strong></summary>

- Stable toggle reference across renders
- Stable setTrue reference across renders
- Stable setFalse reference across renders
- Stable setValue reference across renders
- All references stable after multiple operations

</details>

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>

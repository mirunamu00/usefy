<p align="center">
  <img src="https://raw.githubusercontent.com/geon0529/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-click-any-where</h1>

<p align="center">
  <strong>A lightweight React hook for detecting document-wide click events</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-click-any-where">
    <img src="https://img.shields.io/npm/v/@usefy/use-click-any-where.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-click-any-where">
    <img src="https://img.shields.io/npm/dm/@usefy/use-click-any-where.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-click-any-where">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-click-any-where?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/geon0529/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-click-any-where.svg?style=flat-square&color=007acc" alt="license" />
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

`@usefy/use-click-any-where` detects clicks anywhere on the document and calls your handler. Perfect for closing dropdowns, modals, context menus, or any component that should respond to outside clicks.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-click-any-where?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with exported interfaces
- **Conditional Activation** — Enable/disable via the `enabled` option
- **Event Capture Support** — Choose between capture and bubble phase
- **Passive Listeners** — Performance-optimized with passive listeners by default
- **Handler Stability** — No re-registration when handler changes
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Lightweight** — Minimal bundle footprint (~200B minified + gzipped)
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-click-any-where

# yarn
yarn add @usefy/use-click-any-where

# pnpm
pnpm add @usefy/use-click-any-where
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
import { useClickAnyWhere } from "@usefy/use-click-any-where";

function ClickTracker() {
  const [lastClick, setLastClick] = useState({ x: 0, y: 0 });

  useClickAnyWhere((event) => {
    setLastClick({ x: event.clientX, y: event.clientY });
  });

  return (
    <div>
      Last click: ({lastClick.x}, {lastClick.y})
    </div>
  );
}
```

---

## API Reference

### `useClickAnyWhere(handler, options?)`

A hook that listens for document-wide click events.

#### Parameters

| Parameter | Type                          | Description                                      |
| --------- | ----------------------------- | ------------------------------------------------ |
| `handler` | `(event: MouseEvent) => void` | Callback function called on every document click |
| `options` | `UseClickAnyWhereOptions`     | Configuration options                            |

#### Options

| Option    | Type      | Default | Description                                |
| --------- | --------- | ------- | ------------------------------------------ |
| `enabled` | `boolean` | `true`  | Whether the event listener is active       |
| `capture` | `boolean` | `false` | Use event capture phase instead of bubble  |
| `passive` | `boolean` | `true`  | Use passive event listener for performance |

#### Returns

`void`

---

## Examples

### Close Dropdown on Outside Click

```tsx
import { useClickAnyWhere } from "@usefy/use-click-any-where";
import { useRef, useState } from "react";

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickAnyWhere(
    (event) => {
      // Close if clicked outside the dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    },
    { enabled: isOpen }
  );

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle Menu</button>
      {isOpen && (
        <ul className="dropdown-menu">
          <li>Option 1</li>
          <li>Option 2</li>
          <li>Option 3</li>
        </ul>
      )}
    </div>
  );
}
```

### Modal with Click Outside to Close

```tsx
import { useClickAnyWhere } from "@usefy/use-click-any-where";
import { useRef } from "react";

function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useClickAnyWhere(
    (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    },
    { enabled: isOpen }
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal-content">
        {children}
      </div>
    </div>
  );
}
```

### Context Menu

```tsx
import { useClickAnyWhere } from "@usefy/use-click-any-where";
import { useState } from "react";

function ContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  // Close menu on any click
  useClickAnyWhere(() => setMenu(null), { enabled: menu !== null });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div onContextMenu={handleContextMenu} className="context-area">
      Right-click anywhere
      {menu && (
        <div
          className="context-menu"
          style={{ position: "fixed", left: menu.x, top: menu.y }}
        >
          <button>Cut</button>
          <button>Copy</button>
          <button>Paste</button>
        </div>
      )}
    </div>
  );
}
```

### Click Coordinate Logger

```tsx
import { useClickAnyWhere } from "@usefy/use-click-any-where";
import { useState } from "react";

function ClickLogger() {
  const [clicks, setClicks] = useState<
    Array<{ x: number; y: number; time: Date }>
  >([]);

  useClickAnyWhere((event) => {
    setClicks((prev) => [
      ...prev.slice(-9), // Keep last 10 clicks
      { x: event.clientX, y: event.clientY, time: new Date() },
    ]);
  });

  return (
    <div>
      <h3>Recent Clicks</h3>
      <ul>
        {clicks.map((click, i) => (
          <li key={i}>
            ({click.x}, {click.y}) at {click.time.toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### With Capture Phase

```tsx
import { useClickAnyWhere } from "@usefy/use-click-any-where";

function CapturePhaseHandler() {
  // Handle click before it reaches any element
  useClickAnyWhere(
    (event) => {
      console.log("Click captured (before bubble):", event.target);
    },
    { capture: true }
  );

  return <div>Clicks are captured in capture phase</div>;
}
```

### Tooltip Dismissal

```tsx
import { useClickAnyWhere } from "@usefy/use-click-any-where";
import { useState, useRef } from "react";

function TooltipTrigger({ content }: { content: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useClickAnyWhere(
    (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    },
    { enabled: showTooltip }
  );

  return (
    <div className="tooltip-container">
      <button ref={triggerRef} onClick={() => setShowTooltip(!showTooltip)}>
        Show Info
      </button>
      {showTooltip && <div className="tooltip">{content}</div>}
    </div>
  );
}
```

---

## TypeScript

This hook is written in TypeScript with exported types.

```tsx
import {
  useClickAnyWhere,
  type UseClickAnyWhereOptions,
  type ClickAnyWhereHandler,
} from "@usefy/use-click-any-where";

// Handler type
const handleClick: ClickAnyWhereHandler = (event) => {
  console.log("Clicked at:", event.clientX, event.clientY);
};

// Options type
const options: UseClickAnyWhereOptions = {
  enabled: true,
  capture: false,
  passive: true,
};

useClickAnyWhere(handleClick, options);
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

| Category | Coverage |
|----------|----------|
| Statements | 92.3% (12/13) |
| Branches | 87.5% (7/8) |
| Functions | 100% (4/4) |
| Lines | 92.3% (12/13) |

### Test Categories

<details>
<summary><strong>Basic Functionality Tests</strong></summary>

- Call handler when document is clicked
- Pass MouseEvent with correct properties
- Handle multiple clicks
- Register event listener on mount

</details>

<details>
<summary><strong>Enabled Option Tests</strong></summary>

- Not call handler when enabled is false
- Not register event listener when disabled
- Toggle listener when enabled changes
- Default enabled to true

</details>

<details>
<summary><strong>Handler Stability Tests</strong></summary>

- Not re-register listener when handler changes
- Call the latest handler after update

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

| Package                                                                                    | Description              |
| ------------------------------------------------------------------------------------------ | ------------------------ |
| [@usefy/use-toggle](https://www.npmjs.com/package/@usefy/use-toggle)                       | Boolean state management |
| [@usefy/use-counter](https://www.npmjs.com/package/@usefy/use-counter)                     | Counter state management |
| [@usefy/use-debounce](https://www.npmjs.com/package/@usefy/use-debounce)                   | Value debouncing         |
| [@usefy/use-debounce-callback](https://www.npmjs.com/package/@usefy/use-debounce-callback) | Debounced callbacks      |
| [@usefy/use-throttle](https://www.npmjs.com/package/@usefy/use-throttle)                   | Value throttling         |
| [@usefy/use-throttle-callback](https://www.npmjs.com/package/@usefy/use-throttle-callback) | Throttled callbacks      |

---

## License

MIT © [mirunamu](https://github.com/geon0529)

This package is part of the [usefy](https://github.com/geon0529/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>

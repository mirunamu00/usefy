<p align="center">
  <img src="https://raw.githubusercontent.com/geon0529/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-on-click-outside</h1>

<p align="center">
  <strong>A React hook for detecting clicks outside of specified elements</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-on-click-outside">
    <img src="https://img.shields.io/npm/v/@usefy/use-on-click-outside.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-on-click-outside">
    <img src="https://img.shields.io/npm/dm/@usefy/use-on-click-outside.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-on-click-outside">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-on-click-outside?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/geon0529/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-on-click-outside.svg?style=flat-square&color=007acc" alt="license" />
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

`@usefy/use-on-click-outside` detects clicks outside of specified element(s) and calls your handler. Perfect for closing modals, dropdowns, popovers, tooltips, and any UI component that should dismiss when clicking elsewhere.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-on-click-outside?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with exported interfaces
- **Multiple Refs Support** — Pass a single ref or an array of refs (e.g., button + dropdown)
- **Exclude Elements** — Exclude specific elements from triggering the handler via `excludeRefs` or `shouldExclude`
- **Mouse + Touch Support** — Handles both `mousedown` and `touchstart` events for mobile compatibility
- **Capture Phase** — Uses capture phase by default to avoid `stopPropagation` issues
- **Conditional Activation** — Enable/disable via the `enabled` option
- **Handler Stability** — No re-registration when handler changes
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Well Tested** — 97.61% test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-on-click-outside

# yarn
yarn add @usefy/use-on-click-outside

# pnpm
pnpm add @usefy/use-on-click-outside
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
import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useRef, useState } from "react";

function Modal({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(modalRef, () => onClose());

  return (
    <div className="overlay">
      <div ref={modalRef} className="modal">
        Click outside to close
      </div>
    </div>
  );
}
```

---

## API Reference

### `useOnClickOutside(ref, handler, options?)`

A hook that detects clicks outside of specified element(s).

#### Parameters

| Parameter | Type                       | Description                                               |
| --------- | -------------------------- | --------------------------------------------------------- |
| `ref`     | `RefTarget<T>`             | Single ref or array of refs to detect outside clicks for  |
| `handler` | `OnClickOutsideHandler`    | Callback function called when a click outside is detected |
| `options` | `UseOnClickOutsideOptions` | Configuration options                                     |

#### Options

| Option           | Type                                | Default        | Description                                               |
| ---------------- | ----------------------------------- | -------------- | --------------------------------------------------------- |
| `enabled`        | `boolean`                           | `true`         | Whether the event listener is active                      |
| `capture`        | `boolean`                           | `true`         | Use event capture phase (immune to stopPropagation)       |
| `eventType`      | `MouseEventType`                    | `"mousedown"`  | Mouse event type to listen for                            |
| `touchEventType` | `TouchEventType`                    | `"touchstart"` | Touch event type to listen for                            |
| `detectTouch`    | `boolean`                           | `true`         | Whether to detect touch events (mobile support)           |
| `excludeRefs`    | `RefObject<HTMLElement>[]`          | `[]`           | Refs to exclude from outside click detection              |
| `shouldExclude`  | `(target: Node) => boolean`         | `undefined`    | Custom function to determine if target should be excluded |
| `eventTarget`    | `Document \| HTMLElement \| Window` | `document`     | The event target to attach listeners to                   |

#### Types

```typescript
type ClickOutsideEvent = MouseEvent | TouchEvent;
type OnClickOutsideHandler = (event: ClickOutsideEvent) => void;
type MouseEventType =
  | "mousedown"
  | "mouseup"
  | "click"
  | "pointerdown"
  | "pointerup";
type TouchEventType = "touchstart" | "touchend";
type RefTarget<T extends HTMLElement> =
  | React.RefObject<T | null>
  | Array<React.RefObject<HTMLElement | null>>;
```

#### Returns

`void`

---

## Examples

### Basic Modal

```tsx
import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useRef, useState } from "react";

function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(modalRef, onClose, { enabled: isOpen });

  if (!isOpen) return null;

  return (
    <div className="overlay">
      <div ref={modalRef} className="modal">
        {children}
      </div>
    </div>
  );
}
```

### Dropdown with Multiple Refs

When you have a button that toggles a dropdown, you want clicks on both the button and dropdown to be considered "inside":

```tsx
import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useRef, useState } from "react";

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Both button and menu are considered "inside"
  useOnClickOutside([buttonRef, menuRef], () => setIsOpen(false), {
    enabled: isOpen,
  });

  return (
    <>
      <button ref={buttonRef} onClick={() => setIsOpen(!isOpen)}>
        Toggle Menu
      </button>
      {isOpen && (
        <div ref={menuRef} className="dropdown-menu">
          <button>Option 1</button>
          <button>Option 2</button>
          <button>Option 3</button>
        </div>
      )}
    </>
  );
}
```

### Exclude Specific Elements

Use `excludeRefs` to prevent certain elements from triggering the outside click handler:

```tsx
import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useRef, useState } from "react";

function ModalWithToast() {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(modalRef, () => setIsOpen(false), {
    enabled: isOpen,
    excludeRefs: [toastRef], // Clicks on toast won't close modal
  });

  return (
    <>
      {isOpen && (
        <div className="overlay">
          <div ref={modalRef} className="modal">
            Modal Content
          </div>
        </div>
      )}
      <div ref={toastRef} className="toast">
        This toast won't close the modal when clicked
      </div>
    </>
  );
}
```

### Custom Exclude Logic with shouldExclude

Use `shouldExclude` for dynamic exclusion based on element properties:

```tsx
import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useRef, useState } from "react";

function MenuWithIgnoredElements() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(menuRef, () => setIsOpen(false), {
    enabled: isOpen,
    shouldExclude: (target) => {
      // Ignore clicks on elements with specific class
      return (target as Element).closest?.(".ignore-outside-click") !== null;
    },
  });

  return (
    <>
      {isOpen && (
        <div ref={menuRef} className="menu">
          Menu Content
        </div>
      )}
      <button className="ignore-outside-click">
        This button won't close the menu
      </button>
    </>
  );
}
```

### Popover with Touch Support

Touch events are enabled by default for mobile compatibility:

```tsx
import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useRef, useState } from "react";

function Popover({ trigger, content }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Handles both mouse and touch events
  useOnClickOutside(popoverRef, () => setIsOpen(false), {
    enabled: isOpen,
    detectTouch: true, // default
  });

  return (
    <div ref={popoverRef}>
      <button onClick={() => setIsOpen(!isOpen)}>{trigger}</button>
      {isOpen && <div className="popover-content">{content}</div>}
    </div>
  );
}
```

### Context Menu

```tsx
import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useRef, useState } from "react";

function ContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(menuRef, () => setMenu(null), {
    enabled: menu !== null,
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div onContextMenu={handleContextMenu} className="context-area">
      Right-click anywhere
      {menu && (
        <div
          ref={menuRef}
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

### Different Event Types

You can customize which mouse/touch events trigger the handler:

```tsx
import { useOnClickOutside } from "@usefy/use-on-click-outside";

// Use 'click' instead of 'mousedown' (fires after full click completes)
useOnClickOutside(ref, handler, {
  eventType: "click",
});

// Use 'touchend' instead of 'touchstart'
useOnClickOutside(ref, handler, {
  touchEventType: "touchend",
});

// Disable touch detection entirely
useOnClickOutside(ref, handler, {
  detectTouch: false,
});
```

---

## TypeScript

This hook is written in TypeScript with exported types.

```tsx
import {
  useOnClickOutside,
  type UseOnClickOutsideOptions,
  type OnClickOutsideHandler,
  type ClickOutsideEvent,
  type RefTarget,
  type MouseEventType,
  type TouchEventType,
} from "@usefy/use-on-click-outside";

// Handler type
const handleOutsideClick: OnClickOutsideHandler = (event) => {
  console.log("Clicked outside at:", event.clientX, event.clientY);
};

// Options type
const options: UseOnClickOutsideOptions = {
  enabled: true,
  capture: true,
  eventType: "mousedown",
  detectTouch: true,
};

useOnClickOutside(ref, handleOutsideClick, options);
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://geon0529.github.io/usefy/coverage/use-on-click-outside/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Categories

<details>
<summary><strong>Basic Functionality Tests</strong></summary>

- Call handler when clicked outside the element
- Not call handler when clicked inside the element
- Not call handler when target is not connected to DOM
- Handle events with correct type (MouseEvent/TouchEvent)

</details>

<details>
<summary><strong>Multiple Refs Tests</strong></summary>

- Support array of refs
- Not call handler when clicking inside any of the refs
- Call handler only when clicking outside all refs

</details>

<details>
<summary><strong>Enabled Option Tests</strong></summary>

- Not call handler when enabled is false
- Not register event listener when disabled
- Toggle listener when enabled changes
- Default enabled to true

</details>

<details>
<summary><strong>Exclude Refs Tests</strong></summary>

- Not call handler when clicking on excluded element
- Support multiple exclude refs
- Handle dynamically added exclude refs

</details>

<details>
<summary><strong>shouldExclude Function Tests</strong></summary>

- Not call handler when shouldExclude returns true
- Pass correct target to shouldExclude function

</details>

<details>
<summary><strong>Touch Events Tests</strong></summary>

- Call handler on touchstart when detectTouch is true
- Not listen for touch events when detectTouch is false

</details>

<details>
<summary><strong>Handler Stability Tests</strong></summary>

- Not re-register listener when handler changes
- Call the latest handler after update

</details>

<details>
<summary><strong>Cleanup Tests</strong></summary>

- Remove event listeners on unmount
- Not call handler after unmount

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

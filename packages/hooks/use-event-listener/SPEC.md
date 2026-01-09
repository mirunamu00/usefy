### useEventListener

**Purpose**: Add event listeners to DOM elements with automatic cleanup

**Key Features**:

- Support for window, document, HTMLElement, RefObject targets
- TypeScript event type inference (MouseEvent, KeyboardEvent, etc.)
- Automatic cleanup on unmount
- Handler stability (no re-registration on handler change)
- Conditional activation via enabled option
- Event listener options support (capture, passive, once)
- SSR compatible

**API**:

```typescript
useEventListener(eventName, handler, element?, options?);
```

**Parameters**:

| Parameter   | Type                      | Description                         |
| ----------- | ------------------------- | ----------------------------------- |
| `eventName` | `string`                  | Event type to listen for            |
| `handler`   | `(event: Event) => void`  | Callback function when event fires  |
| `element`   | `EventTargetType`         | Target element (defaults to window) |
| `options`   | `UseEventListenerOptions` | Configuration options               |

**Usage Example**:

```typescript
// Window event (default target)
useEventListener("resize", () => {
  console.log("Window resized:", window.innerWidth);
});

// Document event
useEventListener(
  "keydown",
  (e) => {
    if (e.key === "Escape") closeModal();
  },
  document
);

// HTMLElement event
const button = document.getElementById("myButton");
useEventListener("click", handleClick, button);

// RefObject event
const ref = useRef<HTMLDivElement>(null);
useEventListener("scroll", handleScroll, ref);

// With options
useEventListener("scroll", handleScroll, window, {
  passive: true,
  capture: false,
});

// Conditional activation
useEventListener("mousemove", handleMouseMove, document, {
  enabled: isTracking,
});

// One-time event
useEventListener("click", handleFirstClick, document, {
  once: true,
});
```

**Implementation Points**:

- Store handler in `useRef` to avoid re-registering event listeners
- SSR check with `typeof window === "undefined"`
- Cleanup function in `useEffect` to remove listener
- Support both `null` (no listener) and `undefined` (default to window)
- Extract element from RefObject via `target.current`
- Pass consistent `capture` option to both add and remove
- Only set `passive` option when explicitly provided (respect browser defaults)

**Options Interface**:

```typescript
interface UseEventListenerOptions {
  /**
   * Whether the event listener is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Whether to use event capture phase
   * @default false
   */
  capture?: boolean;

  /**
   * Whether to use passive event listener for performance optimization
   * Useful for scroll/touch events
   * @default undefined (browser default)
   */
  passive?: boolean;

  /**
   * Whether the handler should be invoked only once and then removed
   * @default false
   */
  once?: boolean;
}
```

**Target Types**:

```typescript
type EventTargetType<T extends HTMLElement = HTMLElement> =
  | Window // window object
  | Document // document object
  | HTMLElement // any HTML element
  | React.RefObject<T> // React ref
  | null // no listener
  | undefined; // defaults to window
```

**Type Overloads**:

```typescript
// Window events
function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: Window | null,
  options?: UseEventListenerOptions
): void;

// Document events
function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element: Document,
  options?: UseEventListenerOptions
): void;

// HTMLElement events
function useEventListener<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: HTMLElement | null,
  options?: UseEventListenerOptions
): void;

// RefObject events
function useEventListener<
  K extends keyof HTMLElementEventMap,
  T extends HTMLElement
>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: React.RefObject<T | null>,
  options?: UseEventListenerOptions
): void;

// Custom events (fallback)
function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element?: EventTargetType,
  options?: UseEventListenerOptions
): void;
```

**Event Type Inference Examples**:

```typescript
// MouseEvent is automatically inferred
useEventListener("click", (e) => {
  console.log(e.clientX, e.clientY);
});

// KeyboardEvent is automatically inferred
useEventListener(
  "keydown",
  (e) => {
    console.log(e.key, e.code);
  },
  document
);

// FocusEvent is automatically inferred
useEventListener(
  "focus",
  (e) => {
    console.log(e.relatedTarget);
  },
  inputRef
);

// ScrollEvent
useEventListener(
  "scroll",
  (e) => {
    console.log(window.scrollY);
  },
  window,
  { passive: true }
);
```

**Common Use Cases**:

1. **Window resize handling**

   ```typescript
   useEventListener("resize", () => {
     setWindowSize({ width: window.innerWidth, height: window.innerHeight });
   });
   ```

2. **Keyboard shortcuts**

   ```typescript
   useEventListener(
     "keydown",
     (e) => {
       if (e.ctrlKey && e.key === "s") {
         e.preventDefault();
         saveDocument();
       }
     },
     document
   );
   ```

3. **Scroll tracking with passive listener**

   ```typescript
   useEventListener(
     "scroll",
     () => {
       setScrollY(window.scrollY);
     },
     window,
     { passive: true }
   );
   ```

4. **Network status detection**

   ```typescript
   useEventListener("online", () => setIsOnline(true));
   useEventListener("offline", () => setIsOnline(false));
   ```

5. **Element-specific mouse tracking**

   ```typescript
   const boxRef = useRef<HTMLDivElement>(null);
   useEventListener(
     "mousemove",
     (e) => {
       const rect = boxRef.current?.getBoundingClientRect();
       if (rect) {
         setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
       }
     },
     boxRef
   );
   ```

6. **Visibility change detection**
   ```typescript
   useEventListener(
     "visibilitychange",
     () => {
       if (document.hidden) {
         pauseVideo();
       } else {
         resumeVideo();
       }
     },
     document
   );
   ```

**Dependencies Array**:

```typescript
// deps: [eventName, element, enabled, capture, passive, once]
//
// - eventName: Re-register on event type change
// - element: Re-register on target element change
// - enabled: Add/remove listener on toggle
// - capture: Re-register on capture mode change
// - passive: Re-register on passive option change
// - once: Re-register on once option change
//
// handler is stored in ref, excluded from deps to prevent re-registration
```

**Edge Cases**:

- `element = null`: No listener is added
- `element = undefined`: Defaults to window
- `RefObject.current = null`: No listener is added
- Handler changes: Listener is NOT re-registered, but new handler is called
- Rapid enabled toggling: Handled correctly via cleanup
- SSR environment: No-op, returns early

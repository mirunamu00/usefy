# usefy Hooks Roadmap

## Overview

This document contains the roadmap and detailed feature specifications for React custom hooks to be included in the usefy library.

---

## Hooks List

### 1. useCounter

**Purpose**: Manage increment/decrement/reset of numeric values

**Key Features**:

- Provides increment, decrement, reset functions
- Optional min/max range constraints
- Configurable step size
- Circular option - cycles from max to min

**API**:

```typescript
const [count, { increment, decrement, reset, set }] = useCounter(initialValue, {
  min,
  max,
  step,
});
```

**Usage Example**:

```typescript
const [count, { increment, decrement, reset }] = useCounter(0, {
  min: 0,
  max: 10,
  step: 2,
});

return (
  <div>
    <p>Count: {count}</p>
    <button onClick={increment}>+2</button>
    <button onClick={decrement}>-2</button>
    <button onClick={reset}>Reset</button>
  </div>
);
```

**Implementation Points**:

- Based on useState
- Memoize functions with useCallback
- Include range validation logic
- Support circular mode

---

### 2. useToggle

**Purpose**: Easily toggle boolean state

**Key Features**:

- Manage on/off state
- Provides toggle, setTrue, setFalse functions
- Useful for modals, dropdowns, etc.
- Support for initial value

**API**:

```typescript
const [value, toggle, setValue] = useToggle(initialValue);
// or
const [value, { toggle, setTrue, setFalse, setValue }] =
  useToggle(initialValue);
```

**Usage Example**:

```typescript
const [isOpen, toggle, setIsOpen] = useToggle(false);

return (
  <>
    <button onClick={toggle}>Toggle Modal</button>
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} />
  </>
);
```

**Implementation Points**:

- Based on useState
- Memoize functions with useCallback
- Provide clear and intuitive API
- Ensure TypeScript type safety

---

### 3. useDebounce (useDebounceValue)

**Purpose**: Delay frequent value changes for performance optimization

**Key Features**:

- Value updates only after specified delay
- Used for search input, API call optimization
- Automatically cancels previous timer
- leading/trailing options
- maxWait option to limit maximum wait time

**API**:

```typescript
const debouncedValue = useDebounce(value, delay, options);
```

**Usage Example**:

```typescript
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  // API call only executes 500ms after input stops
  if (debouncedSearch) {
    fetchResults(debouncedSearch);
  }
}, [debouncedSearch]);
```

**Implementation Points**:

- Combine useEffect and setTimeout
- Remove previous timer with cleanup function
- leading option: execute immediately on first call
- trailing option: execute after last call
- Ensure execution with maxWait

---

### 4. useDebounceCallback

**Purpose**: Debounce callback functions

**Key Features**:

- Delays function calls
- Only executes last call on consecutive calls
- Optimizes event handlers
- cancel function to cancel pending calls
- flush function for immediate execution

**API**:

```typescript
const debouncedCallback = useDebounceCallback(callback, delay, options);
```

**Usage Example**:

```typescript
const handleSearch = useDebounceCallback((term: string) => {
  api.search(term);
}, 500);

return <input onChange={(e) => handleSearch(e.target.value)} />;
```

**Implementation Points**:

- Store timer reference with useRef
- Memoize function with useCallback
- Provide cancel/flush methods
- Support argument passing

---

### 5. useThrottle (useThrottleValue)

**Purpose**: Limit value changes to specified intervals

**Key Features**:

- Updates at most once during specified interval
- Optimizes scroll, resize events
- leading/trailing options
- Useful for infinite scroll implementation

**API**:

```typescript
const throttledValue = useThrottle(value, interval, options);
```

**Usage Example**:

```typescript
const [scrollY, setScrollY] = useState(0);
const throttledScrollY = useThrottle(scrollY, 100);

useEffect(() => {
  const handleScroll = () => setScrollY(window.scrollY);
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
```

**Implementation Points**:

- Timestamp-based limiting
- leading: execute immediately on first call
- trailing: guarantee last value
- Maintain precise intervals

---

### 6. useThrottleCallback

**Purpose**: Throttle callback functions

**Key Features**:

- Limits function calls to specified intervals
- Optimizes scroll/resize handlers
- Provides cancel function
- Supports argument passing

**API**:

```typescript
const throttledCallback = useThrottleCallback(callback, interval, options);
```

**Usage Example**:

```typescript
const handleScroll = useThrottleCallback(() => {
  console.log("Scroll position:", window.scrollY);
}, 100);

useEffect(() => {
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, [handleScroll]);
```

**Implementation Points**:

- Track last call time
- Calculate remaining time
- Support cleanup function

---

### 7. useLocalStorage

**Purpose**: Use localStorage like React state

**Key Features**:

- Use localStorage read/write like useState
- Automatic JSON serialization/deserialization
- Type safety (TypeScript generics)
- SSR environment support (window object check)
- Multi-tab synchronization support (storage event)
- Error handling (quota exceeded, parse errors, etc.)
- Provides removeValue function

**API**:

```typescript
const [value, setValue, removeValue] = useLocalStorage<T>(key, initialValue);
```

**Usage Example**:

```typescript
const [theme, setTheme, removeTheme] = useLocalStorage("theme", "light");

// Usage is identical to useState
setTheme("dark");

// Remove from storage
removeTheme();
```

**Implementation Points**:

- SSR check: `typeof window !== 'undefined'`
- Handle JSON parse errors with try-catch
- Cross-tab synchronization with storage event listener
- Customizable serializer/deserializer options
- Graceful handling of quota exceeded

---

### 8. useSessionStorage

**Purpose**: Use sessionStorage like React state

**Key Features**:

- Same API as useLocalStorage
- Data deleted when tab/window closes
- Suitable for temporary data storage
- Useful for form drafts, temporary settings

**API**:

```typescript
const [value, setValue, removeValue] = useSessionStorage<T>(key, initialValue);
```

**Usage Example**:

```typescript
const [formData, setFormData] = useSessionStorage("form-draft", {
  name: "",
  email: "",
});

return (
  <form>
    <input
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    />
  </form>
);
```

**Implementation Points**:

- Same implementation pattern as localStorage
- Use sessionStorage API
- SSR-safe
- Error handling

---

### 11. useCopyToClipboard

**Purpose**: Copy text to clipboard

**Key Features**:

- Use Clipboard API
- Manage copy success/failure state
- Return copied value
- Timeout option for state reset
- Fallback support (legacy browsers)

**API**:

```typescript
const [copiedText, copy] = useCopyToClipboard(options);
```

**Usage Example**:

```typescript
const [copiedText, copy] = useCopyToClipboard();

return (
  <div>
    <button onClick={() => copy("Hello World")}>
      {copiedText ? "Copied!" : "Copy"}
    </button>
    <input value="Hello World" readOnly />
  </div>
);
```

**Implementation Points**:

- Use navigator.clipboard.writeText()
- Fallback: document.execCommand('copy')
- Error handling with try-catch
- Auto-reset timer (optional)
- Permission check

---

### 13. useClickAnyWhere

**Purpose**: Detect document-wide click events

**Key Features**:

- Detect document-level clicks
- Global click handler
- Conditional activation
- Customizable event options

**API**:

```typescript
useClickAnyWhere(handler, options);
```

**Usage Example**:

```typescript
useClickAnyWhere((event) => {
  console.log("Clicked at:", event.clientX, event.clientY);
});
```

**Implementation Points**:

- document event listener
- useEffect cleanup
- Support event options
- Conditional activation

---

### 14. useClickOutside (useOnClickOutside)

**Purpose**: Detect clicks outside element

**Key Features**:

- Implement modal, dropdown closing
- Support multiple refs (array)
- Handle mousedown, touchstart events
- Conditional activation option
- Option to exclude specific elements

**API**:

```typescript
useClickOutside(ref, handler, options);
// or
useClickOutside([ref1, ref2], handler);
```

**Usage Example**:

```typescript
const ref = useRef<HTMLDivElement>(null);
const buttonRef = useRef<HTMLButtonElement>(null);

useClickOutside([ref, buttonRef], () => setIsOpen(false), { enabled: isOpen });

return (
  <>
    <button ref={buttonRef}>Open</button>
    {isOpen && <div ref={ref}>Dropdown content</div>}
  </>
);
```

**Implementation Points**:

- Register event listener on document
- Determine inside/outside with ref.current.contains()
- Remove listener with cleanup function
- Support array refs
- Use mousedown (faster than click)

---

### 15. useEventListener

**Purpose**: Add event listener to DOM element

**Key Features**:

- Automatic cleanup
- Support window, document, element
- TypeScript event type inference
- Can add multiple events simultaneously
- Support options passing

**API**:

```typescript
useEventListener(eventName, handler, element, options);
```

**Usage Example**:

```typescript
// window event
useEventListener("resize", () => {
  console.log("Window resized");
});

// element event
const ref = useRef<HTMLDivElement>(null);
useEventListener("click", handleClick, ref);

// document event
useEventListener("keydown", handleKeyDown, document);
```

**Implementation Points**:

- addEventListener/removeEventListener
- cleanup function
- Support element ref
- Pass event options
- Type safety with TypeScript generics

---

### 16. useIntersectionObserver

**Purpose**: Detect viewport entry/exit of elements

**Key Features**:

- Implement infinite scroll
- Lazy load images
- Trigger scroll animations
- Support threshold, root, rootMargin options
- Observe single/multiple elements

**API**:

```typescript
const entry = useIntersectionObserver(ref, options);
// or
const isIntersecting = useIntersectionObserver(ref, options);
```

**Usage Example**:

```typescript
const ref = useRef<HTMLDivElement>(null);
const entry = useIntersectionObserver(ref, {
  threshold: 0.5,
  rootMargin: "100px",
});

useEffect(() => {
  if (entry?.isIntersecting) {
    loadMoreItems();
  }
}, [entry?.isIntersecting]);

return <div ref={ref}>Load more trigger</div>;
```

**Implementation Points**:

- Use IntersectionObserver API
- Cleanup with unobserve
- Support options passing
- Browser compatibility check

---

### 17. useResizeObserver

**Purpose**: Detect element size changes

**Key Features**:

- Real-time element size tracking
- Provides width, height, contentRect
- Implement responsive components
- Useful for charts, grid layouts

**API**:

```typescript
const size = useResizeObserver(ref, options);
```

**Usage Example**:

```typescript
const ref = useRef<HTMLDivElement>(null);
const size = useResizeObserver(ref);

return (
  <div ref={ref}>
    Width: {size?.width}px, Height: {size?.height}px
  </div>
);
```

**Implementation Points**:

- Use ResizeObserver API
- Cleanup with disconnect
- Browser compatibility check
- Can provide debounce option

---

### 18. useWindowSize

**Purpose**: Track browser window size

**Key Features**:

- Real-time width, height updates
- Resize event listener
- Debounce/throttle options
- SSR-safe
- Return initial size immediately

**API**:

```typescript
const { width, height } = useWindowSize(options);
```

**Usage Example**:

```typescript
const { width, height } = useWindowSize();

return (
  <div>
    Current window size: {width}px × {height}px
    {width < 768 ? <MobileView /> : <DesktopView />}
  </div>
);
```

**Implementation Points**:

- Use window.innerWidth/innerHeight
- resize event listener
- Optional debounce/throttle
- Return undefined in SSR
- Initial value setting option

---

### 19. useScreen

**Purpose**: Track screen information (screen object)

**Key Features**:

- screen.width, screen.height
- screen.orientation
- availWidth, availHeight
- Provides device screen information

**API**:

```typescript
const screen = useScreen();
```

**Usage Example**:

```typescript
const screen = useScreen();

return (
  <div>
    Screen resolution: {screen?.width}×{screen?.height}
    Available area: {screen?.availWidth}×{screen?.availHeight}
  </div>
);
```

**Implementation Points**:

- Use window.screen object
- orientationchange event
- SSR-safe
- Return screen information object

---

### 20. useTimeout

**Purpose**: setTimeout as a React hook

**Key Features**:

- Delayed execution
- Automatic cleanup
- Reset timer when delay changes
- Provides reset, clear functions
- Conditional execution

**API**:

```typescript
useTimeout(callback, delay);
// or
const { reset, clear } = useTimeout(callback, delay);
```

**Usage Example**:

```typescript
const [show, setShow] = useState(true);

useTimeout(() => {
  setShow(false);
}, 3000);

return show && <Toast message="Will disappear automatically" />;
```

**Implementation Points**:

- useEffect + setTimeout
- cleanup function
- Handle delay null (disable)
- Reference latest callback value

---

### 21. useInterval

**Purpose**: setInterval as a React hook

**Key Features**:

- Repeated execution
- Automatic cleanup
- Reset interval when delay changes
- pause/resume/reset functions
- Immediate execution option

**API**:

```typescript
useInterval(callback, delay, options);
// or
const { pause, resume, reset } = useInterval(callback, delay);
```

**Usage Example**:

```typescript
const [count, setCount] = useState(0);
const { pause, resume } = useInterval(() => {
  setCount((c) => c + 1);
}, 1000);

return (
  <div>
    <p>Count: {count}</p>
    <button onClick={pause}>Pause</button>
    <button onClick={resume}>Resume</button>
  </div>
);
```

**Implementation Points**:

- useEffect + setInterval
- cleanup function
- Handle delay null
- immediate option

---

### 22. useCountdown

**Purpose**: Manage countdown timer

**Key Features**:

- Second-based countdown
- start, stop, reset functions
- Auto-start option
- Completion callback
- Pause/resume functionality

**API**:

```typescript
const [count, { start, stop, reset }] = useCountdown({
  seconds: 60,
  interval: 1000,
  onComplete: () => {},
});
```

**Usage Example**:

```typescript
const [count, { start, reset }] = useCountdown({
  seconds: 60,
  onComplete: () => alert("Time is up!"),
});

return (
  <div>
    <p>Time remaining: {count} seconds</p>
    <button onClick={start}>Start</button>
    <button onClick={reset}>Reset</button>
  </div>
);
```

**Implementation Points**:

- Utilize useInterval
- State management
- Completion detection
- Calculate remaining time

---

### 23. useIsClient

**Purpose**: Check if client-side (SSR check)

**Key Features**:

- Distinguish SSR/CSR
- Detect hydration completion
- Execute client-only code
- Returns simple boolean

**API**:

```typescript
const isClient = useIsClient();
```

**Usage Example**:

```typescript
const isClient = useIsClient();

return <div>{isClient ? <ClientOnlyComponent /> : <ServerFallback />}</div>;
```

**Implementation Points**:

- Detect client with useEffect
- Initial value false
- true after hydration

---

### 24. useIsMounted

**Purpose**: Check if component is mounted

**Key Features**:

- Track mount state
- Useful for canceling async tasks
- Prevent memory leaks
- Use in cleanup function

**API**:

```typescript
const isMounted = useIsMounted();
```

**Usage Example**:

```typescript
const isMounted = useIsMounted();

const fetchData = async () => {
  const data = await api.getData();
  if (isMounted()) {
    setState(data);
  }
};
```

**Implementation Points**:

- Store mount state with useRef
- Set false in useEffect cleanup
- Return function (reference latest value)

---

### 25. useIsomorphicLayoutEffect

**Purpose**: SSR-safe version of useLayoutEffect

**Key Features**:

- useEffect in SSR
- useLayoutEffect in client
- Compatible with Next.js, Gatsby
- Removes warning messages

**API**:

```typescript
useIsomorphicLayoutEffect(() => {
  // effect
}, deps);
```

**Usage Example**:

```typescript
useIsomorphicLayoutEffect(() => {
  // DOM measurement or synchronous update
  const rect = elementRef.current?.getBoundingClientRect();
  setDimensions(rect);
}, []);
```

**Implementation Points**:

- typeof window check
- Conditional export
- Choose useEffect/useLayoutEffect

---

### 26. useDocumentTitle

**Purpose**: Set document title

**Key Features**:

- Update document.title
- Option to restore previous title
- Dynamic title changes
- SSR-safe

**API**:

```typescript
useDocumentTitle(title, options);
```

**Usage Example**:

```typescript
const [count, setCount] = useState(0);
useDocumentTitle(`Count: ${count}`, {
  restoreOnUnmount: true,
});
```

**Implementation Points**:

- Set document.title
- Save previous title
- Restore on cleanup
- SSR check

---

### 27. useEventCallback

**Purpose**: Stable event callback (always references latest value)

**Key Features**:

- Reference latest value without dependency array
- Maintain function reference stability
- Prevent unnecessary re-renders
- Alternative to useCallback

**API**:

```typescript
const stableCallback = useEventCallback(callback);
```

**Usage Example**:

```typescript
const [count, setCount] = useState(0);

const handleClick = useEventCallback(() => {
  // Always references latest count value
  console.log(count);
});

// handleClick reference doesn't change
useEffect(() => {
  element.addEventListener("click", handleClick);
}, [handleClick]);
```

**Implementation Points**:

- Store callback with useRef
- Update with useLayoutEffect
- Return stable reference

---

### 28. usePrevious

**Purpose**: Store value from previous render

**Key Features**:

- Track value changes
- Useful for animations, comparison logic
- No re-render with useRef-based
- Support custom comparison function

**API**:

```typescript
const previousValue = usePrevious(value, compareFn);
```

**Usage Example**:

```typescript
const [count, setCount] = useState(0);
const prevCount = usePrevious(count);

return (
  <div>
    Current: {count}, Previous: {prevCount}
    <p>{count > prevCount ? "Increased ↑" : "Decreased ↓"}</p>
  </div>
);
```

**Implementation Points**:

- Store value with useRef
- Update in useEffect
- Initial value is undefined
- Comparison function option

---

### 29. useHover

**Purpose**: Detect element hover state

**Key Features**:

- mouseenter/mouseleave events
- Returns ref and isHovered
- Useful for conditional rendering
- Delay option

**API**:

```typescript
const [ref, isHovered] = useHover<T>(options);
```

**Usage Example**:

```typescript
const [ref, isHovered] = useHover<HTMLDivElement>();

return (
  <div
    ref={ref}
    style={{
      background: isHovered ? "lightblue" : "white",
    }}
  >
    {isHovered ? "Hovering! 🎯" : "Hover me"}
  </div>
);
```

**Implementation Points**:

- mouseenter/mouseleave events
- Manage hover state with useState
- Event listener cleanup
- Delay option (debounce)

---

### 30. useDarkMode

**Purpose**: Manage dark mode state

**Key Features**:

- localStorage persistence
- Detect system settings
- toggle, enable, disable functions
- Apply class or attribute
- Support prefers-color-scheme

**API**:

```typescript
const { isDarkMode, toggle, enable, disable } = useDarkMode(options);
```

**Usage Example**:

```typescript
const { isDarkMode, toggle } = useDarkMode({
  defaultValue: false,
  localStorageKey: "theme",
});

return <button onClick={toggle}>{isDarkMode ? "🌙 Dark" : "☀️ Light"}</button>;
```

**Implementation Points**:

- Utilize useLocalStorage
- System settings with useMediaQuery
- Add class to document.documentElement
- Initial value determination logic

---

### 31. useTernaryDarkMode

**Purpose**: 3-level dark mode (system, light, dark)

**Key Features**:

- Three modes: system/light/dark
- Automatically reflect system settings
- localStorage persistence
- Toggle functionality

**API**:

```typescript
const {
  isDarkMode,
  ternaryDarkMode,
  setTernaryDarkMode,
  toggleTernaryDarkMode,
} = useTernaryDarkMode();
```

**Usage Example**:

```typescript
const { ternaryDarkMode, setTernaryDarkMode } = useTernaryDarkMode();

return (
  <select
    value={ternaryDarkMode}
    onChange={(e) => setTernaryDarkMode(e.target.value)}
  >
    <option value="system">System</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
);
```

**Implementation Points**:

- Manage 3 modes
- Apply prefers-color-scheme when system
- localStorage persistence
- Calculate actual dark mode status

---

### 32. useScrollLock

**Purpose**: Lock/unlock body scroll

**Key Features**:

- Prevent background scroll when modal opens
- iOS Safari support
- Automatic cleanup
- Support nested locks (counter)
- Restore original scroll position

**API**:

```typescript
const [lockScroll, unlockScroll] = useScrollLock();
// or
const { lock, unlock, isLocked } = useScrollLock();
```

**Usage Example**:

```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const { lock, unlock } = useScrollLock();

useEffect(() => {
  if (isModalOpen) {
    lock();
  } else {
    unlock();
  }
  return () => unlock();
}, [isModalOpen]);

return (
  <>
    <button onClick={() => setIsModalOpen(true)}>Open Modal</button>
    {isModalOpen && <Modal onClose={() => setIsModalOpen(false)} />}
  </>
);
```

**Implementation Points**:

- overflow: hidden on body
- iOS Safari: position: fixed + top
- Save/restore scroll position
- Nested lock counter

---

### 33. useUnmount

**Purpose**: Execute cleanup function on unmount

**Key Features**:

- Same as componentWillUnmount
- Simple API
- No dependency array
- Always executes latest function

**API**:

```typescript
useUnmount(() => cleanup());
```

**Usage Example**:

```typescript
useUnmount(() => {
  // Close WebSocket connection
  socket.disconnect();
  // Clear timer
  clearInterval(timerId);
  // Remove event listener
  element.removeEventListener("click", handler);
});
```

**Implementation Points**:

- Utilize useEffect cleanup
- Empty dependency array
- Reference latest function with useRef

---

### 34. useOnScreen (useIsVisible)

**Purpose**: Detect if element is visible on screen

**Key Features**:

- Simplified version of useIntersectionObserver
- Returns simple boolean
- Suitable for lazy loading
- once option (detect only once)

**API**:

```typescript
const isVisible = useOnScreen(ref, options);
```

**Usage Example**:

```typescript
const ref = useRef<HTMLImageElement>(null);
const isVisible = useOnScreen(ref, {
  threshold: 0.1,
  once: true,
});

return (
  <img ref={ref} src={isVisible ? actualSrc : placeholder} alt="Lazy loaded" />
);
```

**Implementation Points**:

- Use IntersectionObserver
- Simplify to boolean
- Performance optimization with once option
- Default threshold 0

---

### 35. useAsync

**Purpose**: Manage async task state

**Key Features**:

- loading, error, data state
- Automatic error handling
- Retry functionality
- Cancellable (AbortController)
- Immediate or manual execution

**API**:

```typescript
const { data, loading, error, execute, reset } = useAsync(
  asyncFunction,
  options
);
```

**Usage Example**:

```typescript
const { data, loading, error, execute } = useAsync(
  async () => {
    const response = await fetch("/api/users");
    return response.json();
  },
  { immediate: true }
);

if (loading) return <Spinner />;
if (error) return <Error message={error.message} />;
if (!data) return null;

return <UserList users={data} />;
```

**Implementation Points**:

- Manage loading/error/data state
- Error handling with try-catch
- Cancel with AbortController
- immediate option
- reset function

---

### 36. useKeyPress

**Purpose**: Detect keyboard input

**Key Features**:

- Detect specific key input
- Implement shortcuts
- Support modifier keys (ctrl, shift, alt, meta)
- Support key combinations
- Improve accessibility

**API**:

```typescript
const isPressed = useKeyPress(targetKey, options);
// or
const isPressed = useKeyPress(["ctrl", "k"]);
```

**Usage Example**:

```typescript
const escapePressed = useKeyPress("Escape");
const saveShortcut = useKeyPress(["ctrl", "s"]);

useEffect(() => {
  if (escapePressed) {
    closeModal();
  }
}, [escapePressed]);

useEffect(() => {
  if (saveShortcut) {
    event.preventDefault();
    saveData();
  }
}, [saveShortcut]);
```

**Implementation Points**:

- keydown/keyup events
- Compare event.key
- Check modifier keys
- Support combination keys with array

---

### 37. useMap

**Purpose**: Manage Map data structure state

**Key Features**:

- Map object as React state
- set, setAll, remove, reset functions
- Maintain immutability
- TypeScript generic support

**API**:

```typescript
const [map, { set, setAll, remove, reset, clear }] = useMap<K, V>(initialMap);
```

**Usage Example**:

```typescript
const [users, { set, remove }] = useMap<string, User>(
  new Map([
    ["1", { id: "1", name: "Alice" }],
    ["2", { id: "2", name: "Bob" }],
  ])
);

const addUser = (user: User) => {
  set(user.id, user);
};

const removeUser = (id: string) => {
  remove(id);
};
```

**Implementation Points**:

- Manage Map with useState
- Maintain immutability (create new Map)
- Provide utility functions
- TypeScript generics

---

### 38. useSet

**Purpose**: Manage Set data structure state

**Key Features**:

- Set object as React state
- add, remove, has, clear, reset functions
- Maintain immutability
- toggle function

**API**:

```typescript
const [set, { add, remove, has, toggle, clear, reset }] = useSet<T>(initialSet);
```

**Usage Example**:

```typescript
const [selectedIds, { add, remove, has, toggle }] = useSet<string>(
  new Set(["1", "2"])
);

return (
  <div>
    {items.map((item) => (
      <Checkbox
        key={item.id}
        checked={has(item.id)}
        onChange={() => toggle(item.id)}
      />
    ))}
  </div>
);
```

**Implementation Points**:

- Manage Set with useState
- Maintain immutability (create new Set)
- Check inclusion with has
- Convenience with toggle function

---

### 39. useList

**Purpose**: Array state management utility

**Key Features**:

- Array manipulation functions
- push, filter, sort, clear, set
- insert, remove, update
- Automatically maintain immutability

**API**:

```typescript
const [list, { set, push, filter, sort, clear, removeAt, insertAt, updateAt }] =
  useList<T>(initialList);
```

**Usage Example**:

```typescript
const [todos, { push, removeAt, updateAt }] = useList<Todo>([]);

const addTodo = (text: string) => {
  push({ id: Date.now(), text, completed: false });
};

const toggleTodo = (index: number) => {
  const todo = todos[index];
  updateAt(index, { ...todo, completed: !todo.completed });
};
```

**Implementation Points**:

- Based on useState
- Maintain immutability
- Useful array methods
- Index-based manipulation

---

### 40. useQueue

**Purpose**: Manage queue data structure state

**Key Features**:

- FIFO queue implementation
- add (enqueue), remove (dequeue)
- first, last, size
- clear function

**API**:

```typescript
const { queue, add, remove, first, last, size, clear } =
  useQueue<T>(initialQueue);
```

**Usage Example**:

```typescript
const { queue, add, remove, first } = useQueue<Task>([]);

const processNext = () => {
  const task = first;
  if (task) {
    processTask(task);
    remove();
  }
};

return (
  <div>
    <button onClick={() => add(newTask)}>Add Task</button>
    <button onClick={processNext}>Process Next</button>
    <p>Queue size: {queue.length}</p>
  </div>
);
```

**Implementation Points**:

- Array-based implementation
- Use shift/unshift
- Utility functions
- Maintain immutability

---

### 41. useHistoryState (useUndo)

**Purpose**: Undo/Redo functionality

**Key Features**:

- Manage state history
- undo, redo functions
- canUndo, canRedo flags
- Maximum history size limit
- reset function

**API**:

```typescript
const { state, set, undo, redo, canUndo, canRedo, reset, history } =
  useHistoryState<T>(initialState, options);
```

**Usage Example**:

```typescript
const {
  state: canvas,
  set: setCanvas,
  undo,
  redo,
  canUndo,
  canRedo,
} = useHistoryState(initialCanvas, { limit: 50 });

return (
  <div>
    <Canvas data={canvas} onChange={setCanvas} />
    <button onClick={undo} disabled={!canUndo}>
      ⟲ Undo
    </button>
    <button onClick={redo} disabled={!canRedo}>
      ⟳ Redo
    </button>
  </div>
);
```

**Implementation Points**:

- Manage history array
- Track current index
- Maximum size limit
- Delete future history on new state

---

### 42. useStep

**Purpose**: Manage multi-step process (wizard, form, etc.)

**Key Features**:

- Track current step
- goToNextStep, goToPrevStep
- canGoToNextStep, canGoToPrevStep
- Move to specific step with setStep
- reset function

**API**:

```typescript
const [
  currentStep,
  {
    goToNextStep,
    goToPrevStep,
    canGoToNextStep,
    canGoToPrevStep,
    setStep,
    reset,
  },
] = useStep(maxStep, initialStep);
```

**Usage Example**:

```typescript
const [currentStep, { goToNextStep, goToPrevStep, canGoToNextStep }] =
  useStep(4);

return (
  <div>
    <Steps current={currentStep}>
      <Step title="Enter Info" />
      <Step title="Confirm" />
      <Step title="Payment" />
      <Step title="Complete" />
    </Steps>

    {currentStep === 0 && <InfoForm />}
    {currentStep === 1 && <ConfirmForm />}
    {currentStep === 2 && <PaymentForm />}
    {currentStep === 3 && <CompleteMessage />}

    <button onClick={goToPrevStep} disabled={currentStep === 0}>
      Previous
    </button>
    <button onClick={goToNextStep} disabled={!canGoToNextStep}>
      Next
    </button>
  </div>
);
```

**Implementation Points**:

- Manage step with useState
- Range validation
- Utility functions
- 0-based index

---

### 43. useScript

**Purpose**: Dynamic script loading

**Key Features**:

- Dynamically load external scripts
- loading, ready, error states
- Prevent duplicate loading
- Automatic cleanup
- async/defer options

**API**:

```typescript
const status = useScript(src, options);
// status: 'idle' | 'loading' | 'ready' | 'error'
```

**Usage Example**:

```typescript
const status = useScript(
  "https://maps.googleapis.com/maps/api/js?key=YOUR_KEY"
);

if (status === "loading") return <div>Loading map...</div>;
if (status === "error") return <div>Failed to load map</div>;
if (status === "ready") return <GoogleMap />;
```

**Implementation Points**:

- Dynamically create script tag
- load/error event listeners
- Check already loaded scripts
- Remove on cleanup
- Prevent duplicates with global cache

---

### 44. useMeasure

**Purpose**: Measure element size and position

**Key Features**:

- Provide getBoundingClientRect values
- width, height, top, left, etc.
- Based on ResizeObserver
- Real-time updates

**API**:

```typescript
const [ref, bounds] = useMeasure<T>();
// bounds: { x, y, width, height, top, right, bottom, left }
```

**Usage Example**:

```typescript
const [ref, bounds] = useMeasure<HTMLDivElement>();

return (
  <div>
    <div ref={ref} style={{ width: "50%" }}>
      Measure me
    </div>
    <p>
      Width: {Math.round(bounds.width)}px
      <br />
      Height: {Math.round(bounds.height)}px
    </p>
  </div>
);
```

**Implementation Points**:

- Use ResizeObserver
- Call getBoundingClientRect
- Store bounds as state
- Auto-update on resize

---

### 45. useLongPress

**Purpose**: Detect long press events

**Key Features**:

- Detect long press
- Configure threshold (duration)
- onStart, onFinish, onCancel callbacks
- Support touch/mouse events
- Cancel on movement

**API**:

```typescript
const bind = useLongPress(callback, options);
// bind: { onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd }
```

**Usage Example**:

```typescript
const bind = useLongPress(
  () => {
    console.log("Long pressed!");
    showContextMenu();
  },
  {
    threshold: 500,
    onStart: () => console.log("Press started"),
    onCancel: () => console.log("Cancelled"),
  }
);

return <button {...bind}>Long press to open menu</button>;
```

**Implementation Points**:

- Check duration with setTimeout
- Start with mousedown/touchstart
- End with mouseup/touchend
- Cancel with mouseleave/touchcancel
- Check movement distance

---

### 46. useGeolocation

**Purpose**: Track user location

**Key Features**:

- Use Geolocation API
- latitude, longitude, accuracy
- loading, error states
- Real-time location tracking (watchPosition)
- Permission request

**API**:

```typescript
const { latitude, longitude, accuracy, loading, error } =
  useGeolocation(options);
```

**Usage Example**:

```typescript
const { latitude, longitude, loading, error } = useGeolocation();

if (loading) return <div>Loading location...</div>;
if (error) return <div>Error: {error.message}</div>;

return (
  <div>
    Current location: {latitude}, {longitude}
  </div>
);
```

**Implementation Points**:

- Use navigator.geolocation
- getCurrentPosition or watchPosition
- Permission check
- Error handling
- clearWatch on cleanup

---

### 47. useBattery

**Purpose**: Track battery status

**Key Features**:

- Battery level
- Charging status
- Charging time, discharging time
- Battery Status API

**API**:

```typescript
const { level, charging, chargingTime, dischargingTime, loading } =
  useBattery();
```

**Usage Example**:

```typescript
const { level, charging } = useBattery();

return (
  <div>
    Battery: {Math.round(level * 100)}%{charging ? " (Charging)" : ""}
  </div>
);
```

**Implementation Points**:

- Use navigator.getBattery()
- Register event listeners
- Browser compatibility check
- cleanup

---

### 48. useNetwork

**Purpose**: Track network status

**Key Features**:

- Online/offline status
- Connection type (4g, wifi, etc.)
- Downlink speed
- Network Information API

**API**:

```typescript
const { online, downlink, effectiveType, rtt, saveData } = useNetwork();
```

**Usage Example**:

```typescript
const { online, effectiveType } = useNetwork();

return (
  <div>
    {!online && <Alert>You are offline</Alert>}
    Connection: {effectiveType}
  </div>
);
```

**Implementation Points**:

- navigator.onLine
- navigator.connection
- online/offline events
- connection change event

---

### 49. useIdle

**Purpose**: Detect user inactivity

**Key Features**:

- Becomes idle after no activity for specified time
- Detect mouse, keyboard, touch activity
- Useful for auto-logout, notifications
- Configurable timeout

**API**:

```typescript
const isIdle = useIdle(timeout, options);
```

**Usage Example**:

```typescript
const isIdle = useIdle(5 * 60 * 1000); // 5 minutes

useEffect(() => {
  if (isIdle) {
    showInactivityWarning();
  }
}, [isIdle]);
```

**Implementation Points**:

- Multiple event listeners
- Track last activity time
- Check idle with timer
- Apply throttle

---

### 50. useOrientation

**Purpose**: Detect device orientation

**Key Features**:

- Detect portrait/landscape
- Angle information
- Screen Orientation API
- orientationchange event

**API**:

```typescript
const { angle, type } = useOrientation();
// type: 'portrait' | 'landscape'
```

**Usage Example**:

```typescript
const { type } = useOrientation();

return (
  <div>{type === "portrait" ? <PortraitLayout /> : <LandscapeLayout />}</div>
);
```

**Implementation Points**:

- screen.orientation
- orientationchange event
- Fallback: window.orientation
- SSR-safe

---

### 51. useFullscreen

**Purpose**: Manage fullscreen mode

**Key Features**:

- Enter/exit fullscreen
- Track current state
- Fullscreen API
- toggle function

**API**:

```typescript
const { isFullscreen, toggle, enter, exit, isSupported } = useFullscreen(ref);
```

**Usage Example**:

```typescript
const videoRef = useRef<HTMLVideoElement>(null);
const { isFullscreen, toggle } = useFullscreen(videoRef);

return (
  <div>
    <video ref={videoRef} src="video.mp4" />
    <button onClick={toggle}>
      {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
    </button>
  </div>
);
```

**Implementation Points**:

- requestFullscreen/exitFullscreen
- fullscreenchange event
- Handle browser prefixes
- Check document.fullscreenElement

---

### 52. usePageLeave

**Purpose**: Detect page leave

**Key Features**:

- Detect mouse leaving viewport
- Warn before leaving page
- Alert about unsaved changes
- Alternative to beforeunload event

**API**:

```typescript
usePageLeave(callback, options);
```

**Usage Example**:

```typescript
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

usePageLeave(() => {
  if (hasUnsavedChanges) {
    const confirm = window.confirm("You have unsaved changes.");
    if (confirm) {
      saveChanges();
    }
  }
});
```

**Implementation Points**:

- mouseleave event (document)
- Check clientY < 0
- Understand difference from beforeunload

---

### 53. useObjectState

**Purpose**: Object state management utility

**Key Features**:

- Conveniently update object state
- Support partial updates
- reset function
- Automatically maintain immutability

**API**:

```typescript
const [state, setState, reset] = useObjectState<T>(initialState);
```

**Usage Example**:

```typescript
const [form, setForm, resetForm] = useObjectState({
  name: "",
  email: "",
  age: 0,
});

const handleChange = (field: string, value: any) => {
  setForm({ [field]: value }); // Partial update
};

return (
  <form>
    <input
      value={form.name}
      onChange={(e) => handleChange("name", e.target.value)}
    />
    <button onClick={resetForm}>Reset</button>
  </form>
);
```

**Implementation Points**:

- Based on useState
- Partial update (spread)
- Restore initial state with reset function
- TypeScript generics

---

### 54. usePermission

**Purpose**: Check browser permission status

**Key Features**:

- Use Permissions API
- granted/denied/prompt status
- Detect permission changes
- Support various permissions (geolocation, camera, etc.)

**API**:

```typescript
const permissionState = usePermission({ name: "geolocation" });
// 'granted' | 'denied' | 'prompt' | 'unsupported'
```

**Usage Example**:

```typescript
const cameraPermission = usePermission({ name: "camera" });
const micPermission = usePermission({ name: "microphone" });

return (
  <div>
    Camera: {cameraPermission}
    Microphone: {micPermission}
    {cameraPermission === "denied" && (
      <Alert>Camera permission is required</Alert>
    )}
  </div>
);
```

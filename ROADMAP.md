# usefy Hooks Roadmap

## Overview

This document contains the roadmap and detailed feature specifications for React custom hooks to be included in the usefy library.

---

## Hooks List

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

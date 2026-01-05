# useSignal Hook Specification

## Overview
`useSignal` is a lightweight React hook that enables event-driven communication between components without prop drilling or complex state management setup. It uses a name-based subscription pattern to synchronize state changes across deeply nested or sibling components.

## Purpose
Provide a simple, zero-dependency solution for broadcasting signals across multiple components using a shared identifier, eliminating the need for:
- Prop drilling through multiple component layers
- Setting up Context Providers
- Installing and configuring global state management libraries (Recoil, Zustand, etc.)

## Core Concept
Components subscribe to a shared "signal" by name. When any component emits that signal, all subscribers receive a new version number, allowing them to react via `useEffect` or other React hooks.

The signal value itself is not user-controlled data—it's an auto-incrementing version counter that signals "something changed."

## Use Cases
- **Refresh signals**: Parent button signals child components to refetch data
- **Form resets**: Reset button signals multiple form sections to clear
- **Cache invalidation**: Invalidate and reload multiple data views simultaneously
- **Multi-step flows**: Coordinate state across disconnected wizard steps
- **Event broadcasting**: Notify multiple listeners about system events

## API Design

### Basic Usage
```typescript
const { signal, emit, info } = useSignal(name: string, options?: SignalOptions);
```

### Parameters
- `name` (required): Unique identifier string for the signal channel
- `options` (optional): Configuration object

### Return Value
- `signal`: Current version number (number) - primitive value for clean dependency arrays
- `emit`: Function to increment the signal and notify all subscribers
- `info`: Stable metadata object (reference doesn't change) for debugging and monitoring

### Signal Value
The `signal` is a simple primitive number that increments on each emit, designed for clean usage in dependency arrays:
```typescript
useEffect(() => {
  refetch();
}, [signal]); // Clean and simple!
```

### Info Object
```typescript
interface SignalInfo {
  name: string;              // Subscription name
  subscriberCount: number;   // Current number of subscribers
  timestamp: number;         // Last emit time (Date.now())
  emitCount: number;         // Total number of emits (cumulative)
}
```

The `info` object provides debugging and monitoring capabilities without polluting the dependency array:
```typescript
const { signal, emit, info } = useSignal("Dashboard Refresh");

// Use signal in dependencies
useEffect(() => {
  refetch();
}, [signal]);

// Use info for debugging/logging
console.log(`[${info.name}] Emitted ${info.emitCount} times to ${info.subscriberCount} subscribers`);

// Conditional logic based on timing
if (Date.now() - info.timestamp < 5000) {
  // Handle recent emit (within 5 seconds)
}
```

### Options
```typescript
interface SignalOptions {
  // Automatically emit when component mounts
  emitOnMount?: boolean;
  
  // Callback executed when emit is called
  onEmit?: () => void;
  
  // Conditionally enable/disable subscription
  enabled?: boolean;
  
  // Debounce emit calls (ms)
  debounce?: number;
}
```

## Technical Architecture

### Storage Layer
- **In-memory store**: Singleton Map storing `name -> { version, subscribers, metadata }`
- **No persistence**: State resets on page reload (intentional design)
- **No serialization**: Simple number increment, no JSON parsing

### Signal Design Philosophy
- **signal**: Primitive number for optimal DX in dependency arrays
- **info**: Stable object reference for metadata access
- **Separation of concerns**: Signal mechanism (signal) vs monitoring data (info)

### Subscription Pattern
- Uses `useSyncExternalStore` for React 18 compatibility
- Automatic subscription on mount, cleanup on unmount
- Batch notifications to all subscribers when emitted

### Performance Considerations
- Minimal re-renders: Only subscribed components re-render
- No unnecessary object allocations for signal value
- Efficient Map-based lookup
- Stable info object reference (doesn't cause re-renders)

## Implementation Requirements

### Core Functions
1. **Global store**: Manage signal versions, subscriber lists, and metadata per name
2. **subscribe**: Register component as subscriber for a given name
3. **getSnapshot**: Return current signal version for a name
4. **getInfo**: Return stable metadata object for a name
5. **emit**: Increment version, update metadata, and notify all subscribers

### Edge Cases
- Multiple components emitting simultaneously → sequential increment, last timestamp wins
- Unmounted components → automatic cleanup, subscriberCount decrements
- Non-existent names → initialize with version 0, emitCount 0
- Rapid emits → optional debounce support, emitCount reflects all attempts

## Non-Goals
- **Not a state manager**: Does not store or manage user data
- **Not persistent**: No localStorage/sessionStorage integration
- **Not cross-tab**: Each browser tab maintains independent state
- **Not a data cache**: Components handle their own data fetching/storage

## Dependencies
- Zero external dependencies
- React 18+ (uses `useSyncExternalStore`)
- TypeScript support included

## Package Details
- **Name**: `@your-scope/use-signal`
- **Size target**: < 2KB minified
- **License**: MIT
- **Peer dependencies**: `react: ^18.0.0`

## Example Usage

### Basic Refresh Pattern
```typescript
// Parent Component
function ParentComponent() {
  const { emit } = useSignal("Dashboard Refresh");
  
  return <button onClick={emit}>Refresh All</button>;
}

// Child Component 1 (deeply nested)
function DataTable() {
  const { signal } = useSignal("Dashboard Refresh");
  
  useEffect(() => {
    fetchTableData();
  }, [signal]);
  
  return <table>...</table>;
}

// Child Component 2 (different branch)
function ChartWidget() {
  const { signal } = useSignal("Dashboard Refresh");
  
  useEffect(() => {
    fetchChartData();
  }, [signal]);
  
  return <canvas>...</canvas>;
}
```

### With Debugging
```typescript
function MonitoredComponent() {
  const { signal, emit, info } = useSignal("API Sync", {
    onEmit: () => console.log(`Syncing at ${new Date().toISOString()}`)
  });
  
  useEffect(() => {
    syncData();
    console.log(`[${info.name}] Sync #${info.emitCount} with ${info.subscriberCount} listeners`);
  }, [signal]);
  
  return <button onClick={emit}>Sync</button>;
}
```

### Conditional Emission
```typescript
function ConditionalEmitter() {
  const { emit, info } = useSignal("Data Update");
  
  const handleUpdate = () => {
    // Only emit if there are active subscribers
    if (info.subscriberCount > 0) {
      emit();
    }
  };
  
  return <button onClick={handleUpdate}>Update</button>;
}
```

## Future Considerations (Not in v1)
- DevTools integration for visualizing signal networks
- Signal history buffer (last N emissions)
- Pattern matching for wildcard subscriptions
- Middleware support for signal interception

## Success Metrics
- Simple API: Single-line integration in components
- Zero configuration: Works out of the box
- Lightweight: Minimal bundle impact
- Type-safe: Full TypeScript support
- Predictable: No surprises or magic behavior
- Clean DX: signal works seamlessly in dependency arrays
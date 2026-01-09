# useHistory - Undo/Redo History Engine

## Overview

**Package Name**: `use-history-state` (tentative)

**Purpose**: A universal undo/redo history management engine applicable to any state. Provides declarative functionality to track and revert user actions in complex editors, forms, canvas applications, and more.

**Target Users**:
- Drawing/design tool developers
- Form builder developers
- Text editor developers
- Any React developer needing complex state management

---

## Milestones

### v0.1.0 - Core
- [ ] Basic undo/redo functionality
- [ ] maxHistory limit
- [ ] canUndo/canRedo state
- [ ] clear, reset functions

### v0.2.0 - Enhanced Control
- [ ] Debounce (group consecutive changes)
- [ ] Group actions (batch/transaction)
- [ ] goTo (jump to specific point)
- [ ] Change labeling

### v0.3.0 - Persistence
- [ ] localStorage/sessionStorage integration
- [ ] Custom serialization/deserialization
- [ ] History import/export

### v0.4.0 - Advanced
- [ ] History branching
- [ ] Selective field tracking (partial tracking)
- [ ] Middleware system
- [ ] Diff calculation and retrieval

### v1.0.0 - Production Ready
- [ ] Performance optimization (large history)
- [ ] DevTools extension
- [ ] Complete TypeScript support
- [ ] 100% test coverage

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Universal** | Applicable to any state type (primitive, object, array) |
| **Immutability** | All states in history are immutable |
| **Debounce** | Group consecutive changes into single history entry |
| **Batch Actions** | Combine multiple changes into single undo unit |
| **Branching** | Git-like history branch management |
| **Labeling** | Add descriptions to each history entry |
| **Time Travel** | Jump to any specific point instantly |
| **Persistence** | Maintain history after refresh via storage integration |
| **Memory Efficient** | Max history limit, structural sharing |
| **Type Safe** | Complete TypeScript generics support |

---

## API Design

### Core API

```typescript
const {
  // State
  state,              // Current state
  
  // Navigation
  undo,               // Go to previous state
  redo,               // Go to next state
  goTo,               // Jump to specific index
  goToLabel,          // Jump to specific label
  
  // Mutation
  set,                // Change state (creates new history)
  update,             // Functional update
  
  // Batch Operations
  batch,              // Combine multiple changes into one
  startBatch,         // Start batch
  endBatch,           // End batch
  
  // History Management
  clear,              // Clear all history
  reset,              // Reset to initial state
  
  // History Info
  history,            // Full history array
  currentIndex,       // Current position
  canUndo,            // Whether undo is possible
  canRedo,            // Whether redo is possible
  historyLength,      // Total history length
  
  // Metadata
  labels,             // History labels array
  timestamps,         // History timestamps array
  
  // Branching (Advanced)
  branches,           // Branch list
  currentBranch,      // Current branch
  createBranch,       // Create new branch
  switchBranch,       // Switch branch
  mergeBranch,        // Merge branch
  
  // Persistence
  save,               // Manual save
  load,               // Manual load
  
  // Utils
  diff,               // Difference between two history entries
  subscribe,          // Subscribe to changes
} = useHistory<T>(initialState, options);
```

### Options Interface

```typescript
interface UseHistoryOptions<T> {
  // Basic
  maxHistory?: number;              // Max history count (default: 100)
  debounce?: number;                // Debounce time in ms (default: 0)
  
  // Comparison
  isEqual?: (a: T, b: T) => boolean;  // Custom comparison function
  clone?: (state: T) => T;            // Custom clone function
  
  // Partial Tracking
  select?: (state: T) => Partial<T>;  // Select fields to track
  
  // Persistence
  persist?: {
    key: string;                      // Storage key
    storage?: Storage;                // localStorage | sessionStorage
    serialize?: (state: T) => string; // Serialization function
    deserialize?: (raw: string) => T; // Deserialization function
    throttle?: number;                // Save throttle in ms
  };
  
  // Branching
  enableBranching?: boolean;          // Enable branching (default: false)
  
  // Callbacks
  onChange?: (state: T, action: HistoryAction) => void;
  onUndo?: (state: T, prevState: T) => void;
  onRedo?: (state: T, prevState: T) => void;
  onMaxHistory?: (dropped: HistoryEntry<T>[]) => void;
  
  // Middleware
  middleware?: HistoryMiddleware<T>[];
}

type HistoryAction = 'set' | 'undo' | 'redo' | 'reset' | 'clear' | 'goto' | 'batch';

interface HistoryEntry<T> {
  state: T;
  label?: string;
  timestamp: number;
  action: HistoryAction;
}

type HistoryMiddleware<T> = (
  entry: HistoryEntry<T>,
  next: () => void
) => void;
```

---

## Usage Examples

### Basic Usage

```typescript
import { useHistory } from 'use-history-state';

function Counter() {
  const { state, set, undo, redo, canUndo, canRedo } = useHistory(0);

  return (
    <div>
      <p>Count: {state}</p>
      <button onClick={() => set(state + 1)}>+1</button>
      <button onClick={() => set(state - 1)}>-1</button>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

### Object State with Debounce

```typescript
interface FormData {
  title: string;
  content: string;
}

function TextEditor() {
  const { state, update, undo, redo } = useHistory<FormData>(
    { title: '', content: '' },
    { 
      debounce: 300,  // Consecutive inputs within 300ms grouped as one
      maxHistory: 50 
    }
  );

  return (
    <div>
      <input
        value={state.title}
        onChange={(e) => update(s => ({ ...s, title: e.target.value }))}
        placeholder="Title"
      />
      <textarea
        value={state.content}
        onChange={(e) => update(s => ({ ...s, content: e.target.value }))}
        placeholder="Content"
      />
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
    </div>
  );
}
```

### Batch Operations (Drawing App)

```typescript
interface CanvasState {
  shapes: Shape[];
  selectedId: string | null;
}

function DrawingCanvas() {
  const { state, set, batch, undo } = useHistory<CanvasState>({
    shapes: [],
    selectedId: null,
  });

  // Move multiple shapes at once (single undo)
  const moveSelectedShapes = (dx: number, dy: number) => {
    batch((draft) => {
      state.shapes
        .filter(s => s.selected)
        .forEach(shape => {
          draft.set({
            ...state,
            shapes: state.shapes.map(s =>
              s.id === shape.id
                ? { ...s, x: s.x + dx, y: s.y + dy }
                : s
            )
          });
        });
    });
  };

  // Or use startBatch/endBatch
  const handleDragEnd = () => {
    endBatch(); // All changes during drag become single undo
  };

  return (/* ... */);
}
```

### Labeled History (Design Tool)

```typescript
function DesignTool() {
  const { 
    state, 
    set, 
    history, 
    labels, 
    goTo, 
    goToLabel,
    currentIndex 
  } = useHistory(initialDesign);

  // Change state with label
  const addShape = (shape: Shape) => {
    set(
      { ...state, shapes: [...state.shapes, shape] },
      { label: `Added ${shape.type}` }
    );
  };

  const deleteShape = (id: string) => {
    set(
      { ...state, shapes: state.shapes.filter(s => s.id !== id) },
      { label: `Deleted shape` }
    );
  };

  return (
    <div>
      <Canvas state={state} />
      
      {/* History Panel */}
      <aside>
        <h3>History</h3>
        <ul>
          {history.map((entry, index) => (
            <li 
              key={index}
              className={index === currentIndex ? 'active' : ''}
              onClick={() => goTo(index)}
            >
              {labels[index] || `Action ${index}`}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
```

### With Persistence

```typescript
function PersistentEditor() {
  const { state, set, undo, redo } = useHistory(
    { content: '' },
    {
      persist: {
        key: 'editor-history',
        storage: localStorage,
        throttle: 1000,  // Save every 1 second
      },
      maxHistory: 100,
    }
  );

  // History persists after refresh
  return (/* ... */);
}
```

### Branching (Advanced)

```typescript
function AdvancedEditor() {
  const {
    state,
    set,
    branches,
    currentBranch,
    createBranch,
    switchBranch,
    mergeBranch,
  } = useHistory(initialState, { enableBranching: true });

  // Create branch for experimental changes
  const tryExperiment = () => {
    createBranch('experiment-1');
    // Subsequent changes apply only to experiment-1 branch
  };

  // Merge to main on success
  const applyExperiment = () => {
    switchBranch('main');
    mergeBranch('experiment-1');
  };

  // Discard branch on failure
  const discardExperiment = () => {
    switchBranch('main');
    // experiment-1 is abandoned
  };

  return (/* ... */);
}
```

### Middleware (Logging, Validation)

```typescript
const loggingMiddleware: HistoryMiddleware<State> = (entry, next) => {
  console.log(`[History] ${entry.action}:`, entry.state);
  next();
};

const validationMiddleware: HistoryMiddleware<State> = (entry, next) => {
  if (isValidState(entry.state)) {
    next();
  } else {
    console.warn('Invalid state, not recording to history');
  }
};

function App() {
  const { state, set } = useHistory(initialState, {
    middleware: [loggingMiddleware, validationMiddleware],
  });

  return (/* ... */);
}
```

### Keyboard Shortcuts Integration

```typescript
function EditorWithShortcuts() {
  const { undo, redo, canUndo, canRedo } = useHistory(initialState);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          canRedo && redo();
        } else {
          canUndo && undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return (/* ... */);
}
```

---

## Implementation Points

### Core Architecture

```
┌─────────────────────────────────────────┐
│              useHistory                 │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Past    │  │ Present │  │ Future  │ │
│  │ Stack   │  │ State   │  │ Stack   │ │
│  └─────────┘  └─────────┘  └─────────┘ │
│       ▲            │            │       │
│       │            ▼            ▼       │
│       └────── undo/redo ────────┘       │
├─────────────────────────────────────────┤
│  Middleware → Clone → Compare → Store   │
└─────────────────────────────────────────┘
```

### Critical Implementation Details

1. **Immutability**
   - All history entries stored via deep copy
   - Use structuredClone() (fallback: JSON.parse/stringify)
   - Provide custom clone function option
   - Handle circular references

2. **Memory Efficiency**
   - Remove oldest entries when exceeding maxHistory
   - Consider structural sharing
   - Explore WeakRef possibilities

3. **Debounce Implementation**
   - Track last change timestamp
   - Changes within debounce period update current state without adding to history
   - Provide flush method for immediate history save

4. **Batch Processing**
   - Manage batch mode flag
   - Temporarily store all changes during batch
   - Consolidate into single history entry on endBatch

5. **Branching**
   - Each branch maintains independent past/future stacks
   - Preserve current state on branch switch
   - Merge strategies: apply last state or custom merge function

6. **Persistence**
   - Throttled auto-save
   - Error handling for save failures
   - Handle storage capacity overflow

7. **Performance Optimization**
   - Memoize return object with useMemo
   - Ensure function stability with useCallback
   - Prevent unnecessary re-renders

8. **Type Safety**
   - Complete type inference for generic T
   - Link options types with return types
   - Conditional types for option-dependent return values

---

## Type Definitions

```typescript
// Core Types
export type HistoryAction = 
  | 'init' 
  | 'set' 
  | 'undo' 
  | 'redo' 
  | 'reset' 
  | 'clear' 
  | 'goto' 
  | 'batch';

export interface HistoryEntry<T> {
  state: T;
  label?: string;
  timestamp: number;
  action: HistoryAction;
}

export interface HistoryState<T> {
  past: HistoryEntry<T>[];
  present: HistoryEntry<T>;
  future: HistoryEntry<T>[];
}

// Options
export interface UseHistoryOptions<T> {
  maxHistory?: number;
  debounce?: number;
  isEqual?: (a: T, b: T) => boolean;
  clone?: (state: T) => T;
  select?: (state: T) => Partial<T>;
  persist?: PersistOptions<T>;
  enableBranching?: boolean;
  middleware?: HistoryMiddleware<T>[];
  onChange?: (state: T, action: HistoryAction) => void;
  onUndo?: (state: T, prevState: T) => void;
  onRedo?: (state: T, prevState: T) => void;
  onMaxHistory?: (dropped: HistoryEntry<T>[]) => void;
}

export interface PersistOptions<T> {
  key: string;
  storage?: Storage;
  serialize?: (history: HistoryState<T>) => string;
  deserialize?: (raw: string) => HistoryState<T>;
  throttle?: number;
}

// Return Type
export interface UseHistoryReturn<T> {
  // State
  state: T;
  
  // Navigation
  undo: () => void;
  redo: () => void;
  goTo: (index: number) => void;
  goToLabel: (label: string) => void;
  
  // Mutation
  set: (newState: T, options?: SetOptions) => void;
  update: (updater: (state: T) => T, options?: SetOptions) => void;
  
  // Batch
  batch: (fn: (controls: BatchControls<T>) => void) => void;
  startBatch: () => void;
  endBatch: (options?: SetOptions) => void;
  
  // Management
  clear: () => void;
  reset: () => void;
  
  // Info
  history: HistoryEntry<T>[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  labels: (string | undefined)[];
  timestamps: number[];
  
  // Branching (conditional)
  branches?: string[];
  currentBranch?: string;
  createBranch?: (name: string) => void;
  switchBranch?: (name: string) => void;
  mergeBranch?: (name: string) => void;
  deleteBranch?: (name: string) => void;
  
  // Persistence (conditional)
  save?: () => void;
  load?: () => void;
  
  // Utils
  diff: (indexA: number, indexB: number) => Diff<T>;
  subscribe: (listener: HistoryListener<T>) => () => void;
}

export interface SetOptions {
  label?: string;
  skipHistory?: boolean;  // Don't record to history
}

export interface BatchControls<T> {
  set: (state: T) => void;
  update: (updater: (state: T) => T) => void;
  getState: () => T;
}

export type HistoryListener<T> = (
  state: T, 
  entry: HistoryEntry<T>, 
  action: HistoryAction
) => void;

export type HistoryMiddleware<T> = (
  entry: HistoryEntry<T>,
  next: () => void,
  abort: () => void
) => void;

export interface Diff<T> {
  added: Partial<T>;
  removed: Partial<T>;
  changed: Partial<T>;
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('useHistory', () => {
  describe('basic operations', () => {
    it('should initialize with given state', () => {});
    it('should update state with set()', () => {});
    it('should undo to previous state', () => {});
    it('should redo to next state', () => {});
    it('should not undo when canUndo is false', () => {});
    it('should not redo when canRedo is false', () => {});
  });

  describe('maxHistory', () => {
    it('should limit history to maxHistory', () => {});
    it('should call onMaxHistory when dropping entries', () => {});
  });

  describe('debounce', () => {
    it('should group rapid changes into single history entry', () => {});
    it('should create separate entries after debounce period', () => {});
  });

  describe('batch', () => {
    it('should group multiple changes into single undo', () => {});
    it('should work with startBatch/endBatch', () => {});
  });

  describe('persistence', () => {
    it('should save to storage', () => {});
    it('should load from storage on init', () => {});
    it('should throttle saves', () => {});
  });

  describe('branching', () => {
    it('should create new branch', () => {});
    it('should switch between branches', () => {});
    it('should merge branches', () => {});
  });
});
```

### Edge Cases

- Undo on empty state
- maxHistory = 1
- Very large state objects
- Objects with circular references
- Rapid consecutive undo/redo
- Behavior when browser tab is inactive
- SSR environment

---

## Bundle Size Target

| Feature Set | Target Size |
|-------------|-------------|
| Core only | < 2KB gzipped |
| + Persistence | < 3KB gzipped |
| + Branching | < 4KB gzipped |
| Full | < 5KB gzipped |

---

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

---

## Dependencies

### Required
- React >= 16.8.0 (hooks)

### Optional Peer Dependencies
- None (all features self-implemented)

### Dev Dependencies
- TypeScript
- Vitest
- @testing-library/react-hooks
- tsup (bundler)

---

## File Structure

```
use-history-state/
├── src/
│   ├── index.ts                 # Public exports
│   ├── useHistory.ts            # Main hook
│   ├── core/
│   │   ├── reducer.ts           # History state reducer
│   │   ├── actions.ts           # Action creators
│   │   └── selectors.ts         # State selectors
│   ├── features/
│   │   ├── debounce.ts          # Debounce logic
│   │   ├── batch.ts             # Batch operations
│   │   ├── persistence.ts       # Storage integration
│   │   ├── branching.ts         # Branch management
│   │   └── middleware.ts        # Middleware system
│   ├── utils/
│   │   ├── clone.ts             # Deep clone utilities
│   │   ├── diff.ts              # State diff utilities
│   │   └── isEqual.ts           # Equality checks
│   └── types.ts                 # TypeScript definitions
├── tests/
│   ├── useHistory.test.ts
│   ├── debounce.test.ts
│   ├── batch.test.ts
│   ├── persistence.test.ts
│   └── branching.test.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

---

## Roadmap

### Future Considerations

1. **React DevTools Integration**
   - History visualization
   - Time travel debugging UI

2. **Zustand/Jotai Adapter**
   - Integration with state management libraries

3. **Collaborative Editing**
   - CRDT-based multi-user history

4. **Compression**
   - Compressed storage for large history

5. **Selective Undo**
   - Revert specific fields only

---

## References

- [Immer](https://immerjs.github.io/immer/) - Immutable state patterns
- [use-undo](https://github.com/xxhomey19/use-undo) - Simple undo hook (reference)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) - Time travel debugging
- [Y.js](https://yjs.dev/) - CRDT for collaborative editing
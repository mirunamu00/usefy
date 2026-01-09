# @usefy/use-throttle

## 0.0.38

### Patch Changes

- @usefy/use-debounce@0.0.38

## 0.0.37

### Patch Changes

- @usefy/use-debounce@0.0.37

## 0.0.36

### Patch Changes

- @usefy/use-debounce@0.0.36

## 0.0.35

### Patch Changes

- @usefy/use-debounce@0.0.35

## 0.0.34

### Patch Changes

- @usefy/use-debounce@0.0.34

## 0.0.33

### Patch Changes

- @usefy/use-debounce@0.0.33

## 0.0.32

### Patch Changes

- @usefy/use-debounce@0.0.32

## 0.0.31

### Patch Changes

- @usefy/use-debounce@0.0.31

## 0.0.30

### Patch Changes

- @usefy/use-debounce@0.0.30

## 0.0.29

### Patch Changes

- 07dd97e: update README.md
- Updated dependencies [07dd97e]
  - @usefy/use-debounce@0.0.29

## 0.0.28

### Patch Changes

- @usefy/use-debounce@0.0.28

## 0.0.27

### Patch Changes

- @usefy/use-debounce@0.0.27

## 0.0.26

### Patch Changes

- e7548c1: Update repository references from geon0529 to mirunamu00 in documentation and package files
- Updated dependencies [e7548c1]
  - @usefy/use-debounce@0.0.26

## 0.0.25

### Patch Changes

- @usefy/use-debounce@0.0.25

## 0.0.24

### Patch Changes

- @usefy/use-debounce@0.0.24

## 0.0.23

### Patch Changes

- 10bb7e8: update READEM.md
- Updated dependencies [10bb7e8]
  - @usefy/use-debounce@0.0.23

## 0.0.22

### Patch Changes

- b92d737: update README.md
- 4fb2093: Summary of Changes
  Issue
  When leading: false and trailing: false were both set, useDebounce and useDebounceCallback (and consequently useThrottle and useThrottleCallback) were still invoking callbacks when maxWait was specified. This behavior deviated from Lodash's standard behavior, where this configuration means "nothing happens."
  Root Cause
  In the maxWait handling logic, invokeRef.current() / invokeFunc() was called unconditionally when maxWait time elapsed, ignoring the leading and trailing options.
  Fix Applied

  1. useDebounce.ts (Line 233-236)

  // Only invoke if at least one edge is enabled (matches lodash behavior)
  if (leadingRef.current || trailingRef.current) {
  invokeRef.current(time);
  } 2. useDebounceCallback.ts (Line 286-289)

  // Only invoke if at least one edge is enabled (matches lodash behavior)
  if (leadingRef.current || trailingRef.current) {
  return invokeFunc(time);
  }
  Tests Added
  useDebounce.test.ts - 3 new test cases:
  should never update when both leading and trailing are false
  should never update even with maxWait when both edges are false
  should never update with continuous rapid changes and maxWait
  useDebounceCallback.test.ts - 1 new test case:
  should not invoke callback when both leading and trailing are false even with maxWait
  Storybook Updates
  useThrottleCallback.stories.tsx - 2 new stories added:
  BothEdges: Demonstrates default behavior with both edges enabled
  BothDisabled: Demonstrates that callback never executes when both edges are disabled
  Impact
  useDebounce and useDebounceCallback now match Lodash's _.debounce behavior
  useThrottle and useThrottleCallback (which use the debounce hooks internally with maxWait) now match Lodash's _.throttle behavior
  All 47 useDebounce tests and 52 useDebounceCallback tests pass

- Updated dependencies [b92d737]
- Updated dependencies [4fb2093]
  - @usefy/use-debounce@0.0.22

## 0.0.21

### Patch Changes

- e4ee257: update README.md
- Updated dependencies [e4ee257]
  - @usefy/use-debounce@0.0.21

## 0.0.20

### Patch Changes

- @usefy/use-debounce@0.0.20

## 0.0.19

### Patch Changes

- cc15dd3: update README.md
- Updated dependencies [cc15dd3]
  - @usefy/use-debounce@0.0.19

## 0.0.18

### Patch Changes

- dc5cb67: add logo
- Updated dependencies [dc5cb67]
  - @usefy/use-debounce@0.0.18

## 0.0.17

### Patch Changes

- @usefy/use-debounce@0.0.17

## 0.0.16

### Patch Changes

- @usefy/use-debounce@0.0.16

## 0.0.15

### Patch Changes

- e03ef9b: update README.md
- Updated dependencies [e03ef9b]
  - @usefy/use-debounce@0.0.15

## 0.0.14

### Patch Changes

- @usefy/use-debounce@0.0.14

## 0.0.13

### Patch Changes

- @usefy/use-debounce@0.0.13

## 0.0.12

### Patch Changes

- 224c3e1: update README.md
- Updated dependencies [224c3e1]
  - @usefy/use-debounce@0.0.12

## 0.0.11

### Patch Changes

- 555f2dc: update README.md
- 5f7403c: update README.md
- Updated dependencies [555f2dc]
- Updated dependencies [5f7403c]
  - @usefy/use-debounce@0.0.11

## 0.0.10

### Patch Changes

- 6e70220: update README.md
- Updated dependencies [6e70220]
  - @usefy/use-debounce@0.0.10

## 0.0.9

### Patch Changes

- 05a8be8: update README.md
- Updated dependencies [05a8be8]
  - @usefy/use-debounce@0.0.9

## 0.0.8

### Patch Changes

- @usefy/use-debounce@0.0.8

## 0.0.7

### Patch Changes

- @usefy/use-debounce@0.0.7

## 0.0.6

### Patch Changes

- Reorder exports to put types first for better TypeScript compatibility
- Updated dependencies
  - @usefy/use-debounce@0.0.6

## 0.0.5

### Patch Changes

- Simplify exports for better IDE support
- Updated dependencies
  - @usefy/use-debounce@0.0.5

## 0.0.4

### Patch Changes

- Improve TypeScript module resolution with explicit exports types and typesVersions
- Updated dependencies
  - @usefy/use-debounce@0.0.4

## 0.0.3

### Patch Changes

- Improve JSDoc comments
- Updated dependencies
  - @usefy/use-debounce@0.0.3

## 0.0.2

### Patch Changes

- @usefy/use-debounce@0.0.2

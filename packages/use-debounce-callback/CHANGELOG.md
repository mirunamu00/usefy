# @usefy/use-debounce-callback

## 0.0.31

## 0.0.30

## 0.0.29

### Patch Changes

- 07dd97e: update README.md

## 0.0.28

## 0.0.27

## 0.0.26

### Patch Changes

- e7548c1: Update repository references from geon0529 to mirunamu00 in documentation and package files

## 0.0.25

## 0.0.24

## 0.0.23

### Patch Changes

- 10bb7e8: update READEM.md

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

## 0.0.21

### Patch Changes

- e4ee257: update README.md

## 0.0.20

## 0.0.19

### Patch Changes

- cc15dd3: update README.md

## 0.0.18

### Patch Changes

- dc5cb67: add logo

## 0.0.17

## 0.0.16

## 0.0.15

### Patch Changes

- e03ef9b: update README.md

## 0.0.14

## 0.0.13

## 0.0.12

### Patch Changes

- 224c3e1: update README.md

## 0.0.11

### Patch Changes

- 555f2dc: update README.md
- 5f7403c: update README.md

## 0.0.10

### Patch Changes

- 6e70220: update README.md

## 0.0.9

### Patch Changes

- 05a8be8: update README.md

## 0.0.8

## 0.0.7

## 0.0.6

### Patch Changes

- Reorder exports to put types first for better TypeScript compatibility

## 0.0.5

### Patch Changes

- Simplify exports for better IDE support

## 0.0.4

### Patch Changes

- Improve TypeScript module resolution with explicit exports types and typesVersions

## 0.0.3

## 0.0.2

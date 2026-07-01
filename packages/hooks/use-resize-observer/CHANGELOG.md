# @usefy/use-resize-observer

## 0.5.0

## 0.4.0

## 0.3.1

## 0.3.0

## 0.2.6

## 0.2.5

## 0.2.4

### Patch Changes

- 69c3bd1: Fix duplicate onResize callback invocations

  - Prevent redundant `observe()` calls when the same element is passed to ref callback
  - Add `isObservingRef` guard to prevent duplicate observe calls in useEffect
  - Split observer creation (mount-only) and enabled toggle handling into separate effects
  - This fixes the issue where Debounced Callbacks count was incrementing without user interaction

- 6af7994: add useResizeObserver

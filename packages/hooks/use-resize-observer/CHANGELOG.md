# @usefy/use-resize-observer

## 0.22.0

## 0.21.1

## 0.21.0

## 0.20.0

## 0.19.0

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.2

## 0.12.1

## 0.12.0

## 0.11.0

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

## 0.6.0

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

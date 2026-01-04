# @usefy/use-timer

## 0.0.24

## 0.0.23

### Patch Changes

- 10bb7e8: update READEM.md

## 0.0.22

### Patch Changes

- b92d737: update README.md

## 0.0.21

### Patch Changes

- e4ee257: update README.md

## 0.0.20

### Patch Changes

- 6a855d2: refactor(use-timer): simplify API by removing rawTime and decomposedTime

  - Remove `initialTime`, `formattedTime` fields from return object
  - Remove `hours`, `minutes`, `seconds`, `milliseconds` decomposed fields
  - Change `time` to return formatted string directly (was `number`)
  - Simplify hook internals by removing decompose utility usage
  - Update tests and stories to match new API

## 0.0.19

### Patch Changes

- d97addd: fix version
- cc15dd3: update README.md

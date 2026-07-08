# @usefy/use-step

## 0.25.0

## 0.24.0

## 0.23.0

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

### Minor Changes

- c269c3d: Add `useStep` — a hook for multi-step navigation (wizards, multi-step forms, onboarding, carousels). Tracks a 0-based step index with automatic range validation: `goToNextStep`/`goToPrevStep` with ready-made `canGoToNextStep`/`canGoToPrevStep` flags, `setStep` (value or updater, clamped), and `reset`. Returns a `[currentStep, controls]` tuple with stable control identities, resilience to a changing step `count`, and no-op skipping at the edges.

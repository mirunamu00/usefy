# @usefy/use-step

## 0.13.0

## 0.12.2

## 0.12.1

## 0.12.0

## 0.11.0

## 0.10.0

## 0.9.0

### Minor Changes

- c269c3d: Add `useStep` — a hook for multi-step navigation (wizards, multi-step forms, onboarding, carousels). Tracks a 0-based step index with automatic range validation: `goToNextStep`/`goToPrevStep` with ready-made `canGoToNextStep`/`canGoToPrevStep` flags, `setStep` (value or updater, clamped), and `reset`. Returns a `[currentStep, controls]` tuple with stable control identities, resilience to a changing step `count`, and no-op skipping at the edges.

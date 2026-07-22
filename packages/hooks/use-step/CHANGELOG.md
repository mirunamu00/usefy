# @usefy/use-step

## 1.0.0

### Major Changes

- 8924240: usefy 1.0.0 — first stable release.

  All `@usefy/*` packages graduate to a stable **1.0.0** together (they share a
  fixed-version group). No API changes are required by this bump — it marks the
  public API as stable and ready for production semver guarantees.

  Also adds a `homepage` field to every published package, pointing at its page on
  the docs site (https://usefy-web.vercel.app) so the npm listing links straight
  to live docs.

## 0.25.1

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

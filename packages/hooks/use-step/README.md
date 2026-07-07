<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-step</h1>

<p align="center">
  <strong>A React hook for multi-step navigation (wizards, forms, carousels)</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-step">
    <img src="https://img.shields.io/npm/v/@usefy/use-step.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-step">
    <img src="https://img.shields.io/npm/dm/@usefy/use-step.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-step">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-step?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-step.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usestep--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-step` manages navigation through a fixed number of steps — multi-step forms, wizards, onboarding flows, carousels, and paginated views. It tracks the current **0-based** step index, range-checks every move (you can never overshoot the first or last step), and hands you ready-made `canGoToNextStep` / `canGoToPrevStep` flags for disabling Prev/Next buttons.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-step?

- **Zero Dependencies** — Pure React implementation
- **TypeScript First** — Fully typed controls and return tuple
- **Range-Safe** — Automatic clamping; `goToNextStep`/`goToPrevStep` never leave the valid range
- **Ready-made Flags** — `canGoToNextStep` / `canGoToPrevStep` for button `disabled` states
- **Flexible `setStep`** — Jump to any index, with a value or an updater function
- **Stable Controls** — Navigation functions keep their identity, safe as `useEffect` dependencies
- **Resilient** — Handles a changing step `count`; the current step is kept within range
- **No Wasted Renders** — Moving past an edge is a no-op

---

## Installation

```bash
# npm
npm install @usefy/use-step

# yarn
yarn add @usefy/use-step

# pnpm
pnpm add @usefy/use-step
```

### Peer Dependencies

This package requires React 18 or 19:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

---

## Quick Start

```tsx
import { useStep } from "@usefy/use-step";

function Wizard() {
  const [
    step,
    { goToNextStep, goToPrevStep, canGoToNextStep, canGoToPrevStep },
  ] = useStep(4);

  return (
    <div>
      {step === 0 && <InfoForm />}
      {step === 1 && <ConfirmForm />}
      {step === 2 && <PaymentForm />}
      {step === 3 && <CompleteMessage />}

      <button onClick={goToPrevStep} disabled={!canGoToPrevStep}>
        Back
      </button>
      <button onClick={goToNextStep} disabled={!canGoToNextStep}>
        Next
      </button>
    </div>
  );
}
```

---

## API Reference

### `useStep(count, initialStep?)`

Returns a tuple of the current step index and a stable controls object.

#### Parameters

| Parameter     | Type     | Default | Description                                                                                       |
| ------------- | -------- | ------- | ------------------------------------------------------------------------------------------------- |
| `count`       | `number` | —       | Total number of steps. Valid indices are `0 .. count - 1` (e.g. `useStep(4)` → `0,1,2,3`). Values `< 1` or non-finite are treated as a single step |
| `initialStep` | `number` | `0`     | Starting step index (floored and clamped to the valid range)                                       |

#### Returns `[currentStep, controls]`

| Item          | Type              | Description                                    |
| ------------- | ----------------- | ---------------------------------------------- |
| `currentStep` | `number`          | The current 0-based step index                 |
| `controls`    | `UseStepControls` | Stable navigation controls (see below)         |

#### Controls

| Control           | Signature                                        | Description                                                                 |
| ----------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| `goToNextStep`    | `() => void`                                     | Advance one step. No-op on the last step                                    |
| `goToPrevStep`    | `() => void`                                     | Go back one step. No-op on the first step                                   |
| `canGoToNextStep` | `boolean`                                        | Whether there is a next step                                                |
| `canGoToPrevStep` | `boolean`                                        | Whether there is a previous step                                            |
| `setStep`         | `(step: number \| (current: number) => number) => void` | Jump to a step (value or updater). Floored and clamped to `[0, count - 1]`  |
| `reset`           | `() => void`                                     | Reset back to the initial step                                              |

---

## Examples

### Multi-step form with progress

```tsx
const totalSteps = 3;
const [step, { goToNextStep, goToPrevStep, canGoToNextStep, canGoToPrevStep }] =
  useStep(totalSteps);

return (
  <>
    <progress value={step + 1} max={totalSteps} />
    <StepContent index={step} />
    <button onClick={goToPrevStep} disabled={!canGoToPrevStep}>Back</button>
    <button onClick={goToNextStep} disabled={!canGoToNextStep}>Next</button>
  </>
);
```

### Carousel — jump to any slide

```tsx
const [index, { setStep }] = useStep(slides.length);

return (
  <>
    <Slide data={slides[index]} />
    {slides.map((_, i) => (
      <Dot key={i} active={i === index} onClick={() => setStep(i)} />
    ))}
  </>
);
```

### Updater form and reset

```tsx
const [step, { setStep, reset }] = useStep(5, 2);

setStep((s) => s + 2); // relative jump (clamped)
setStep(0);            // jump to the first step
reset();               // back to the initial step (2)
```

### Keyboard navigation (stable controls as effect deps)

```tsx
const [step, { goToNextStep, goToPrevStep }] = useStep(pages.length);

useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") goToNextStep();
    if (e.key === "ArrowLeft") goToPrevStep();
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [goToNextStep, goToPrevStep]); // identities never change
```

---

## TypeScript

```tsx
import {
  useStep,
  type StepUpdater,
  type UseStepControls,
  type UseStepReturn,
} from "@usefy/use-step";

const [step, controls]: UseStepReturn = useStep(4);
```

---

## Behavior Notes

- **0-based** — `currentStep` runs from `0` to `count - 1`. `useStep(4)` yields steps `0, 1, 2, 3`.
- **Range-safe** — `goToNextStep`/`goToPrevStep` never move out of range; `setStep` floors and clamps its target.
- **Non-finite-safe** — A `NaN`/`Infinity` `initialStep` or `setStep` target never corrupts the index: a bad `initialStep` falls back to `0`, and a bad `setStep` target keeps the current step.
- **No-op skipping** — Moving past the first/last step doesn't allocate new state or trigger a re-render.
- **Stable controls** — The navigation functions keep the same identity for the component's lifetime; the controls object's identity changes only when `canGoToNextStep` / `canGoToPrevStep` flips.
- **Dynamic `count`** — If `count` shrinks below the current step, `currentStep` is clamped back into range on the next render.
- **SSR-safe** — No `window`/`document` access; renders identically on the server.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-step/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useStep.test.ts` — 24 tests for navigation, clamping, non-finite targets, dynamic count, and stability

**Total: 24 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>

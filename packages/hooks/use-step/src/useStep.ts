import { useCallback, useMemo, useRef, useState } from "react";
import type { StepUpdater, UseStepControls, UseStepReturn } from "./types";

/** Clamp `value` into the inclusive range `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Normalize a raw `count` argument to a whole number of steps (at least 1).
 * Non-finite or sub-1 values fall back to a single step.
 */
function resolveTotalSteps(count: number): number {
  return Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
}

/**
 * A React hook for managing navigation through a fixed number of steps —
 * wizards, multi-step forms, onboarding flows, carousels, and the like.
 *
 * Returns a tuple of the current **0-based** step index and a stable controls
 * object. All navigation is range-checked: you can never move past the first or
 * last step, and `setStep` clamps out-of-range targets. `canGoToNextStep` /
 * `canGoToPrevStep` are ready-made flags for disabling Prev/Next buttons.
 *
 * Features:
 * - 0-based indexing with automatic range validation (clamping)
 * - `goToNextStep` / `goToPrevStep` with `canGoToNextStep` / `canGoToPrevStep` flags
 * - `setStep` accepts an index or an updater function (like `useState`)
 * - `reset` back to the initial step
 * - Stable control identities — safe as effect dependencies
 * - Resilient to a changing `count`: the current step is kept within range
 * - No-op skipping: moving past an edge doesn't trigger a re-render
 *
 * @param count - Total number of steps. Valid indices are `0 .. count - 1`
 *   (e.g. `useStep(4)` has steps `0`, `1`, `2`, `3`). Values below 1 or
 *   non-finite are treated as a single step.
 * @param initialStep - The starting step index (floored and clamped). Defaults to `0`.
 * @returns `[currentStep, { goToNextStep, goToPrevStep, canGoToNextStep, canGoToPrevStep, setStep, reset }]`
 *
 * @example
 * ```tsx
 * function Wizard() {
 *   const [step, { goToNextStep, goToPrevStep, canGoToNextStep, canGoToPrevStep }] =
 *     useStep(4);
 *
 *   return (
 *     <div>
 *       {step === 0 && <InfoForm />}
 *       {step === 1 && <ConfirmForm />}
 *       {step === 2 && <PaymentForm />}
 *       {step === 3 && <CompleteMessage />}
 *
 *       <button onClick={goToPrevStep} disabled={!canGoToPrevStep}>Back</button>
 *       <button onClick={goToNextStep} disabled={!canGoToNextStep}>Next</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Jump around, start midway, reset
 * const [step, { setStep, reset }] = useStep(5, 2);
 * setStep(4);              // jump to the last step
 * setStep((s) => s - 2);   // updater form (clamped)
 * reset();                 // back to step 2
 * ```
 */
export function useStep(count: number, initialStep = 0): UseStepReturn {
  const totalSteps = resolveTotalSteps(count);
  const lastIndex = totalSteps - 1;

  // Mirror the latest last-index so the stable callbacks always clamp against
  // the current bounds, even if `count` changes between renders.
  const lastIndexRef = useRef(lastIndex);
  lastIndexRef.current = lastIndex;

  // Resolve and remember the initial step once (for `reset`).
  const initialRef = useRef<number | null>(null);
  if (initialRef.current === null) {
    initialRef.current = clamp(Math.floor(initialStep), 0, lastIndex);
  }

  const [rawStep, setRawStep] = useState<number>(
    () => initialRef.current as number
  );

  // Keep the exposed step within the current range (handles a shrinking count).
  const currentStep = clamp(rawStep, 0, lastIndex);

  const goToNextStep = useCallback(() => {
    setRawStep((prev) => {
      const li = lastIndexRef.current;
      const cur = clamp(prev, 0, li);
      return cur < li ? cur + 1 : cur;
    });
  }, []);

  const goToPrevStep = useCallback(() => {
    setRawStep((prev) => {
      const cur = clamp(prev, 0, lastIndexRef.current);
      return cur > 0 ? cur - 1 : cur;
    });
  }, []);

  const setStep = useCallback((step: StepUpdater) => {
    setRawStep((prev) => {
      const li = lastIndexRef.current;
      const cur = clamp(prev, 0, li);
      const next = typeof step === "function" ? step(cur) : step;
      return clamp(Math.floor(next), 0, li);
    });
  }, []);

  const reset = useCallback(() => {
    setRawStep(clamp(initialRef.current as number, 0, lastIndexRef.current));
  }, []);

  const canGoToNextStep = currentStep < lastIndex;
  const canGoToPrevStep = currentStep > 0;

  const controls = useMemo<UseStepControls>(
    () => ({
      goToNextStep,
      goToPrevStep,
      canGoToNextStep,
      canGoToPrevStep,
      setStep,
      reset,
    }),
    [
      goToNextStep,
      goToPrevStep,
      canGoToNextStep,
      canGoToPrevStep,
      setStep,
      reset,
    ]
  );

  return [currentStep, controls];
}

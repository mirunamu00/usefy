/**
 * The argument accepted by {@link UseStepControls.setStep}: either the target
 * step index directly, or an updater function that receives the current step
 * and returns the target — like `useState`'s setter. The result is clamped to
 * the valid range `[0, count - 1]`.
 */
export type StepUpdater = number | ((current: number) => number);

/**
 * Stable controls returned by {@link useStep} as the second tuple element.
 *
 * The `goToNextStep` / `goToPrevStep` / `setStep` / `reset` functions keep a
 * stable identity for the lifetime of the component. The `canGoToNextStep` /
 * `canGoToPrevStep` booleans are derived from the current step, so the controls
 * object's identity changes only when one of those flags flips.
 */
export interface UseStepControls {
  /**
   * Advance to the next step. No-op (and no re-render) when already on the last
   * step.
   */
  goToNextStep: () => void;

  /**
   * Go back to the previous step. No-op (and no re-render) when already on the
   * first step (index `0`).
   */
  goToPrevStep: () => void;

  /** Whether there is a next step to advance to. */
  canGoToNextStep: boolean;

  /** Whether there is a previous step to go back to. */
  canGoToPrevStep: boolean;

  /**
   * Jump to a specific step. Accepts an index or an updater function
   * (`current => next`); the result is floored and clamped to `[0, count - 1]`.
   */
  setStep: (step: StepUpdater) => void;

  /** Reset back to the initial step provided at mount. */
  reset: () => void;
}

/**
 * Return type of {@link useStep}: a tuple of the current (0-based) step index
 * and the stable controls object.
 */
export type UseStepReturn = readonly [number, UseStepControls];

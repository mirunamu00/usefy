/**
 * `@usefy/confetti` — root entry: the React layer plus a re-export of the
 * full framework-free headless surface (`@usefy/confetti/headless`).
 *
 * @example
 * ```tsx
 * import { fireConfetti, Confetti, useConfetti } from "@usefy/confetti";
 *
 * // 1. One-liner:
 * fireConfetti();
 *
 * // 2. Component:  <Confetti controllerRef={ref} />
 * // 3. Hook:       const { canvasRef, fire } = useConfetti();
 * // 4. Headless:   import { createConfettiEngine } from "@usefy/confetti/headless";
 * ```
 */
export * from "./headless";

export { Confetti } from "./Confetti";
export type { ConfettiController, ConfettiProps } from "./Confetti";

export { useConfetti } from "./useConfetti";
export type { UseConfettiReturn } from "./useConfetti";

export { fireConfetti, resetConfetti, SINGLETON_TEARDOWN_MS } from "./singleton";

import { useEffect, useState } from "react";
import { useLatest } from "@usefy/use-latest";
import type { TourStep } from "../types";

/** Options for {@link useAdvanceGate}. */
export interface UseAdvanceGateOptions {
  /** The active step's gate config, or `undefined` (no gate). */
  advanceOn: TourStep["advanceOn"];
  /** The resolved step target (the default listen target). */
  element: Element | null;
  /** Master switch — the tour is open. */
  enabled: boolean;
  /**
   * Identity of the step being gated (the step index). A change resets the
   * gate, so revisiting a step re-arms it.
   */
  stepKey: number;
  /** Called once when the gate's event fires — advance the tour. */
  onAdvance: () => void;
  /**
   * Re-resolution tick (the tour's mutation epoch). A change re-runs the
   * listener effect, re-querying `advanceOn.selector` — so a gate target that
   * mounts after the step settled still arms the gate.
   */
  resolveTick?: number;
}

/**
 * Implement a step's `advanceOn` interaction gate (SPEC §3.3): the step can
 * only be left forward by performing the required user action. The hook
 * listens for `advanceOn.event` on the resolved target element (or on
 * `advanceOn.selector` resolved against `document` when given); when the
 * event fires, the gate is satisfied and `onAdvance` is called once to move
 * the tour forward automatically.
 *
 * Returns `gated` — `true` while the step has an unmet gate, which is what
 * hides the Next/Done button and blocks the ArrowRight/Enter hotkeys.
 *
 * The gate re-arms whenever `stepKey` changes (render-phase reset), so
 * navigating back to a gated step gates it again. Listeners are removed on
 * step change, close, and unmount. SSR-safe (listening requires a DOM
 * element by construction).
 *
 * @param options - {@link UseAdvanceGateOptions}
 * @returns `true` while the current step's gate is unmet.
 *
 * @internal
 */
export function useAdvanceGate(options: UseAdvanceGateOptions): boolean {
  const { advanceOn, element, enabled, stepKey, onAdvance, resolveTick } =
    options;
  const onAdvanceRef = useLatest(onAdvance);

  const [satisfied, setSatisfied] = useState(false);

  // Render-phase reset: a step change re-arms the gate in the same commit,
  // so a revisited gated step is never momentarily un-gated.
  const [prevKey, setPrevKey] = useState(stepKey);
  if (!Object.is(prevKey, stepKey)) {
    setPrevKey(stepKey);
    setSatisfied(false);
  }

  const event = advanceOn?.event;
  const selector = advanceOn?.selector;

  useEffect(() => {
    if (!enabled || !event || satisfied) return;
    const target: Element | null = selector
      ? document.querySelector(selector)
      : element;
    if (!target) return;

    const handler = () => {
      setSatisfied(true);
      onAdvanceRef.current();
    };
    // Capture phase: a consumer handler on a descendant calling
    // `stopPropagation()` in the bubble phase must not starve the gate.
    target.addEventListener(event, handler, true);
    return () => target.removeEventListener(event, handler, true);
    // `resolveTick` re-runs the effect so `selector` is re-queried after DOM
    // mutations — a late-mounting gate target still arms the gate.
  }, [
    enabled,
    event,
    selector,
    element,
    satisfied,
    stepKey,
    onAdvanceRef,
    resolveTick,
  ]);

  return enabled && event !== undefined && !satisfied;
}

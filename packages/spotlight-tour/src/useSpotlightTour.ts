import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type * as React from "react";
import { useControllableState } from "@usefy/use-controllable-state";
import { useFocusTrap } from "@usefy/use-focus-trap";
import { useHotkeys } from "@usefy/use-hotkeys";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { useLatest } from "@usefy/use-latest";
import { useReducedMotion } from "@usefy/use-reduced-motion";
import { useScrollLock } from "@usefy/use-scroll-lock";
import { computeTooltipPosition } from "./engine/computeTooltipPosition";
import { getSpotlightRect } from "./engine/getSpotlightRect";
import { resolveTarget } from "./engine/resolveTarget";
import { useMutationObserver } from "@usefy/use-mutation-observer";
import { useAdvanceGate } from "./hooks/useAdvanceGate";
import { useAutoScroll } from "./hooks/useAutoScroll";
import { useElementSize } from "./hooks/useElementSize";
import { useTargetRect } from "./hooks/useTargetRect";
import { useViewportSize } from "./hooks/useViewportSize";
import { isTourDone, writeTourState, TOUR_STORAGE_PREFIX } from "./persistence";
import type {
  SpotlightGeometry,
  UseSpotlightTourOptions,
  UseSpotlightTourReturn,
} from "./types";

/** Trailing throttle for DOM-mutation-driven target re-resolution (ms). */
export const MUTATION_RERESOLVE_THROTTLE_MS = 100;

const DEFAULT_WAIT_TIMEOUT = 3000;
const DEFAULT_SPOTLIGHT_PADDING = 8;
const DEFAULT_SPOTLIGHT_RADIUS = 8;

/** Clamp a step index into `[0, count - 1]` (0 when there are no steps). */
function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(Math.max(index, 0), count - 1);
}

/**
 * The headless spotlight-tour state machine: step navigation, live spotlight
 * geometry, missing-target policies, and prop getters — everything the styled
 * `SpotlightTour` component uses, exposed so you can render a bespoke UI.
 *
 * `open` and `step` both follow the controllable-state pattern: pass `open` /
 * `step` for controlled mode or `defaultOpen` / `defaultStep` for
 * uncontrolled; `onOpenChange` / `onStepChange` fire in both modes. All
 * returned controls are `useCallback`-stable.
 *
 * Navigation is bounds-safe: `next` on the last step finishes the tour,
 * `prev` on the first step is a no-op, and `goTo` clamps. When a step's
 * target can't be resolved, its `missingTarget` policy applies: `'skip'`
 * (default) advances in the direction the user was navigating, `'wait'` holds
 * in a `pending` state up to `waitTimeout` ms before skipping, and
 * `'center'` shows the step with `geometry.spotlight = null` (like a step
 * with no target at all).
 *
 * Step lifecycle: `onEnter`/`onLeave` fire only for steps that actually
 * settle on screen — centered steps, steps whose target resolved, and
 * `'wait'`-policy steps (visibly pending counts as entered; a wait-then-skip
 * step gets its matching `onLeave` when the timeout skips it). Steps the
 * `'skip'` policy jumps over fire neither callback.
 *
 * Changing the steps array length mid-tour re-runs target resolution for the
 * active step but does **not** re-fire its `onEnter`/`onLeave` pair — the
 * lifecycle is keyed to step entry/exit, not to resolution runs.
 *
 * While open, step targets are **re-resolved on DOM mutation** (childList +
 * subtree on `document.body`, trailing-throttled ~100ms): a late-mounting
 * target un-wedges a `'wait'` step (its `waitTimeout` still measures from
 * step entry), and a target that unmounts mid-step re-applies the step's
 * `missingTarget` policy. Ref/function targets are re-evaluated on the same
 * tick. Unmet `advanceOn.selector` gates re-resolve too.
 *
 * `tourId` persistence: when set, finishing or skipping writes a versioned
 * flag under `usefy-tour:<tourId>`; any stored flag suppresses the
 * **automatic** open via `defaultOpen` (checked once at mount). An explicit
 * `start()` call — and the controlled `open` prop — deliberately override
 * the flag, so "Replay tour" buttons keep working; `resetTour(tourId)`
 * clears it. Cross-tab sync is out of scope.
 *
 * `geometry.tooltip` resolves once a tooltip element is attached via
 * `getTooltipProps().ref` and measured; until then (and for centered steps)
 * it stays `null`.
 *
 * Interaction & accessibility (all active while open):
 * - **Focus trap** — Tab cycles inside the attached tooltip element; initial
 *   focus goes to `[data-tour-next]` (skipped while gate-disabled), then
 *   `[data-tour-close]`, then the tooltip itself. On close, focus returns to
 *   the element focused before the tour opened (skipped safely if it left
 *   the DOM).
 * - **Keyboard** — `ArrowRight`/`Enter` advance (`Enter` never hijacks a
 *   focused button/link, and neither advances past an unmet gate),
 *   `ArrowLeft` goes back, `Escape` skips. `keyboard: false` disables all of
 *   it (the focus trap stays).
 * - **Scroll lock** — background scroll is locked while open;
 *   `scrollLock: false` opts out. The lock is released during auto-scroll.
 * - **Auto-scroll** — an off-viewport target is scrolled to center
 *   (`smooth`, instant under reduced motion); `pending` is true until the
 *   scroll settles. Per-step `scrollIntoView: false` opts out.
 * - **Gates** — a step with `advanceOn` reports `gated: true` until the
 *   required event fires on the target (or `selector`), then advances
 *   automatically.
 * - **Dialog semantics** — `getTooltipProps()` carries `role="dialog"`,
 *   `aria-modal`, and `aria-labelledby`/`aria-describedby` ids (stamp them on
 *   your title/content elements; a step without a title gets a positional
 *   `aria-label` instead).
 *
 * @param options - Steps plus open/step ownership and tour lifecycle options.
 * @returns Tour state, live geometry, stable controls, and prop getters.
 *
 * @example
 * ```tsx
 * import { useSpotlightTour } from "@usefy/spotlight-tour/headless";
 *
 * function MyTour() {
 *   const tour = useSpotlightTour({
 *     steps: [
 *       { target: "#search", title: "Search", content: "Find anything here." },
 *       { target: "#settings", content: "Tweak your preferences." },
 *       { content: "That's it — enjoy!" }, // centered step (no target)
 *     ],
 *     onFinish: () => console.log("tour finished"),
 *     onSkip: (at) => console.log(`skipped at step ${at}`),
 *   });
 *
 *   return (
 *     <>
 *       <button onClick={() => tour.start()}>Start tour</button>
 *       {tour.open && tour.step && (
 *         <div {...tour.getOverlayProps()}>
 *           <div {...tour.getTooltipProps()} style={{ position: "fixed" }}>
 *             {tour.step.content}
 *             <button onClick={tour.prev} disabled={tour.isFirst}>Back</button>
 *             <button onClick={tour.next}>{tour.isLast ? "Done" : "Next"}</button>
 *             <button onClick={tour.skip}>Skip</button>
 *           </div>
 *         </div>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useSpotlightTour(
  options: UseSpotlightTourOptions
): UseSpotlightTourReturn {
  const {
    steps,
    open: openProp,
    defaultOpen,
    onOpenChange,
    step: stepProp,
    defaultStep,
    onStepChange,
    tourId,
    keyboard,
    scrollLock,
    onFinish,
    onSkip,
  } = options;

  // --- tourId persistence ---------------------------------------------------
  // A finished/skipped tour (any value under `usefy-tour:<tourId>`) suppresses
  // the *automatic* open via `defaultOpen`, checked once at mount. An explicit
  // `start()` call (and the controlled `open` prop) deliberately overrides the
  // stored flag — "Replay tour" buttons must always work; `resetTour` clears
  // the flag so `defaultOpen` auto-opens again. Cross-tab sync is out of
  // scope (the flag is read once per mount).
  const [autoOpenSuppressed] = useState(
    () => tourId !== undefined && isTourDone(tourId)
  );
  const tourIdRef = useLatest(tourId);

  // --- controllable open + step -------------------------------------------
  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: (defaultOpen ?? false) && !autoOpenSuppressed,
    onChange: onOpenChange,
  });
  const [stepIndex, setStepIndex] = useControllableState<number>({
    value: stepProp,
    defaultValue: defaultStep ?? 0,
    onChange: onStepChange,
  });

  // Fresh values readable from permanently-stable callbacks.
  const stepsRef = useLatest(steps);
  const openRef = useLatest(open);
  const stepIndexRef = useLatest(stepIndex);
  const onFinishRef = useLatest(onFinish);
  const onSkipRef = useLatest(onSkip);

  /** Last navigation direction; missing-target 'skip' advances the same way. */
  const directionRef = useRef<1 | -1>(1);

  /**
   * Synchronous close latch: `openRef` only updates on the next render, so two
   * `finish()`/`skip()` calls in the same tick would both pass its guard and
   * double-fire the callback. This ref flips immediately on the first close
   * and is reset by an effect whenever the tour is (still) open at commit.
   */
  const closingRef = useRef(false);
  useEffect(() => {
    if (open) closingRef.current = false;
  });

  // --- controls (all permanently stable) ----------------------------------
  const finish = useCallback(() => {
    if (!openRef.current || closingRef.current) return;
    closingRef.current = true;
    if (tourIdRef.current !== undefined) {
      writeTourState(tourIdRef.current, "finished");
    }
    setOpen(false);
    onFinishRef.current?.();
  }, [setOpen, openRef, onFinishRef, tourIdRef]);

  const skip = useCallback(() => {
    if (!openRef.current || closingRef.current) return;
    closingRef.current = true;
    const at = stepIndexRef.current;
    if (tourIdRef.current !== undefined) {
      writeTourState(tourIdRef.current, "skipped");
    }
    setOpen(false);
    onSkipRef.current?.(at);
  }, [setOpen, openRef, stepIndexRef, onSkipRef, tourIdRef]);

  const start = useCallback(
    (at?: number) => {
      directionRef.current = 1;
      if (at !== undefined) {
        setStepIndex(clampIndex(at, stepsRef.current.length));
      }
      setOpen(true);
    },
    [setOpen, setStepIndex, stepsRef]
  );

  const next = useCallback(() => {
    if (!openRef.current) return;
    directionRef.current = 1;
    const index = stepIndexRef.current;
    if (index >= stepsRef.current.length - 1) {
      finish();
      return;
    }
    setStepIndex(index + 1);
  }, [finish, setStepIndex, openRef, stepIndexRef, stepsRef]);

  const prev = useCallback(() => {
    if (!openRef.current) return;
    const index = stepIndexRef.current;
    if (index <= 0) return; // no-op on the first step
    directionRef.current = -1;
    setStepIndex(index - 1);
  }, [setStepIndex, openRef, stepIndexRef]);

  const goTo = useCallback(
    (index: number) => {
      const current = stepIndexRef.current;
      const clamped = clampIndex(index, stepsRef.current.length);
      directionRef.current = clamped >= current ? 1 : -1;
      setStepIndex(clamped);
    },
    [setStepIndex, stepIndexRef, stepsRef]
  );

  /**
   * Advance past an unresolvable step in the current navigation direction.
   * Walking forward past the end finishes the tour; walking backward past the
   * start flips forward (which terminates: from there movement is strictly
   * forward until a resolvable step or `finish`).
   */
  const advanceFrom = useCallback(
    (index: number) => {
      const count = stepsRef.current.length;
      if (directionRef.current === 1) {
        const forward = index + 1;
        if (forward >= count) finish();
        else setStepIndex(forward);
        return;
      }
      const backward = index - 1;
      if (backward >= 0) {
        setStepIndex(backward);
        return;
      }
      directionRef.current = 1;
      const forward = index + 1;
      if (forward >= count) finish();
      else setStepIndex(forward);
    },
    [finish, setStepIndex, stepsRef]
  );

  // --- target resolution + missing-target policies + step lifecycle -------
  const [element, setElement] = useState<Element | null>(null);
  /**
   * The index of the step currently in a 'wait'-policy hold, or `-1`. Carries
   * the step identity — not a bare boolean — so the commit that changes
   * `stepIndex` mid-hold cannot leak the old step's pending state into the
   * new index (which would fire a phantom lifecycle pair for a step that
   * never settles, e.g. a skip-policy step navigated onto during a hold).
   * The public `pending` boolean is derived below.
   */
  const [pendingIndex, setPendingIndex] = useState(-1);
  /**
   * The index of the last step that actually settled on screen (target
   * resolved, or centered). `-1` while closed. Comparing it to the current
   * `stepIndex` distinguishes a settled step from the transient commits of a
   * 'skip'-policy cascade or a 'wait'-policy hold — which is what gates
   * `settled` (and with it, `aria-live` announcements).
   */
  const [settledIndex, setSettledIndex] = useState(-1);

  /**
   * Bumped (throttled) when a DOM mutation may change target resolution — a
   * late-mounting target, or the current target leaving the DOM. A dep of the
   * resolution effect, so re-resolution reuses the exact policy machinery.
   */
  const [resolveEpoch, setResolveEpoch] = useState(0);

  /**
   * The 'wait' policy's absolute deadline for the current step. Kept in a ref
   * keyed by step index so mutation-driven re-runs of the resolution effect
   * resume the countdown instead of restarting it — `waitTimeout` measures
   * from step entry, not from the last DOM mutation.
   *
   * Known edge (accepted): if the steps array length changes mid-hold such
   * that a *different* wait step now occupies the same index, the old
   * deadline carries over — contrived under the steps-via-ref design.
   */
  const waitDeadlineRef = useRef<{ index: number; deadline: number } | null>(
    null
  );

  // Resolution + missing-target policies. Deliberately does NOT fire
  // onEnter/onLeave (see the lifecycle effect below) so re-running on
  // `resolveEpoch` bumps is side-effect-free.
  //
  // Note: reads `steps` through a ref (deliberately only `steps.length` is a
  // dep) so an inline steps array doesn't restart resolution every render.
  const stepCount = steps.length;
  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setElement(null);
      setPendingIndex(-1);
      setSettledIndex(-1);
      waitDeadlineRef.current = null;
      return;
    }
    const step = stepsRef.current[stepIndex];
    if (!step) {
      // Steps shrank or a controlled index went out of range while open —
      // stop tracking the previous step's element so geometry clears too.
      setElement(null);
      setPendingIndex(-1);
      setSettledIndex(-1);
      waitDeadlineRef.current = null;
      return;
    }

    // Centered step: no target at all.
    if (step.target === undefined) {
      waitDeadlineRef.current = null;
      setElement(null);
      setPendingIndex(-1);
      setSettledIndex(stepIndex);
      return;
    }

    // resolveTarget treats a disconnected node as missing, so a target that
    // unmounts mid-step falls through to its missingTarget policy here on the
    // next mutation-driven re-run.
    const resolved = resolveTarget(step.target);
    if (resolved) {
      waitDeadlineRef.current = null;
      setElement(resolved);
      setPendingIndex(-1);
      setSettledIndex(stepIndex);
      return;
    }

    // Target missing — apply the step's policy.
    const policy = step.missingTarget ?? "skip";
    setElement(null);

    if (policy === "center") {
      waitDeadlineRef.current = null;
      setPendingIndex(-1);
      setSettledIndex(stepIndex);
      return;
    }

    if (policy === "skip") {
      // Skipped without ever settling.
      setPendingIndex(-1);
      advanceFrom(stepIndex);
      return;
    }

    // 'wait': hold in a pending state until the deadline, then retry once and
    // skip on failure. (Mutation-driven re-runs land here with the deadline
    // preserved; a mutation that mounted the target resolves above instead.)
    setPendingIndex(stepIndex);
    if (waitDeadlineRef.current?.index !== stepIndex) {
      waitDeadlineRef.current = {
        index: stepIndex,
        deadline: Date.now() + (step.waitTimeout ?? DEFAULT_WAIT_TIMEOUT),
      };
    }
    const remaining = Math.max(
      0,
      waitDeadlineRef.current.deadline - Date.now()
    );
    const timer = setTimeout(() => {
      const retry = resolveTarget(step.target);
      waitDeadlineRef.current = null;
      if (retry) {
        setElement(retry);
        setPendingIndex(-1);
        setSettledIndex(stepIndex);
      } else {
        setPendingIndex(-1);
        advanceFrom(stepIndex);
      }
    }, remaining);
    return () => clearTimeout(timer);
  }, [open, stepIndex, stepCount, advanceFrom, stepsRef, resolveEpoch]);

  // --- step lifecycle (onEnter/onLeave) ------------------------------------
  // Split from resolution so mutation-driven re-resolution never re-fires
  // callbacks. A step is "entered" once it settles on screen or goes visibly
  // pending ('wait' policy), and leaves exactly once on navigation/close.
  // Steps jumped over by the 'skip' policy never flip `entered`, so they fire
  // neither. (This also means changing the steps array length mid-tour no
  // longer re-fires the active step's onLeave/onEnter pair.)
  const pending = open && pendingIndex === stepIndex;
  const entered = open && (settledIndex === stepIndex || pending);
  useIsomorphicLayoutEffect(() => {
    if (!entered) return;
    const step = stepsRef.current[stepIndex];
    step?.onEnter?.();
    return () => step?.onLeave?.();
  }, [entered, stepIndex, stepsRef]);

  // --- live geometry -------------------------------------------------------
  const activeStep = open ? steps[stepIndex] ?? null : null;
  const targetRect = useTargetRect(element);
  const viewport = useViewportSize(open);

  // The tooltip element (attached via getTooltipProps().ref) is measured live
  // so computeTooltipPosition always works with its real box. Size-only
  // tracking: repositioning the tooltip never triggers a re-measure loop.
  // Keyed on stepIndex: a step change drops the previous step's measured size
  // in the same commit (geometry.tooltip → null, the tooltip hides) and
  // re-measures the new content before paint, so the new position is never
  // computed from the old step's box.
  const [tooltipEl, setTooltipEl] = useState<HTMLElement | null>(null);
  const tooltipSize = useElementSize(tooltipEl, stepIndex);

  const spotlightPadding =
    activeStep?.spotlightPadding ?? DEFAULT_SPOTLIGHT_PADDING;
  const spotlightRadius =
    activeStep?.spotlightRadius ?? DEFAULT_SPOTLIGHT_RADIUS;
  const placement = activeStep?.placement ?? "auto";

  const geometry = useMemo<SpotlightGeometry>(() => {
    const spotlight = targetRect
      ? {
          ...getSpotlightRect(targetRect, spotlightPadding),
          radius: spotlightRadius,
        }
      : null;
    // Tooltip position resolves once the tooltip box has been measured and a
    // spotlight exists; centered steps (spotlight null) keep tooltip null —
    // the UI layer centers those with CSS instead of engine math.
    const tooltip =
      spotlight && tooltipSize && viewport
        ? computeTooltipPosition({
            target: spotlight,
            tooltip: tooltipSize,
            viewport,
            placement,
          })
        : null;
    return { spotlight, tooltip };
  }, [
    targetRect,
    spotlightPadding,
    spotlightRadius,
    tooltipSize,
    viewport,
    placement,
  ]);

  // --- auto-scroll + scroll lock ------------------------------------------
  const reducedMotion = useReducedMotion();
  const scrolling = useAutoScroll({
    element,
    enabled: open && activeStep?.scrollIntoView !== false,
    instant: reducedMotion,
  });
  // Lock only once any auto-scroll has settled: the lock pins the body
  // (`overflow: hidden` + `position: fixed`), which would freeze
  // `scrollIntoView` mid-flight. useAutoScroll defers its scroll call past
  // the unlock commit, so the sequencing is deterministic.
  useScrollLock({ enabled: open && scrollLock !== false && !scrolling });

  // --- advance gate ---------------------------------------------------------
  const gated = useAdvanceGate({
    advanceOn: activeStep?.advanceOn,
    element,
    enabled: open,
    stepKey: stepIndex,
    onAdvance: next,
    resolveTick: resolveEpoch,
  });
  const gatedRef = useLatest(gated);

  // --- DOM mutation re-resolution ------------------------------------------
  // Watches document.body (childList + subtree) while open and bumps
  // `resolveEpoch` on a trailing ~100ms throttle — but only when a
  // re-resolution can actually change something (unresolved/disconnected
  // step target, or an unmet selector-based gate), so settled steps aren't
  // churned and 'wait' countdowns aren't disturbed by unrelated mutations.
  const elementRef = useLatest(element);
  const mutationThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const { observe: observeMutations, disconnect: disconnectMutations } =
    useMutationObserver({
      childList: true,
      subtree: true,
      updateState: false,
      enabled: open,
      onMutation: () => {
        if (mutationThrottleRef.current !== null) return;
        mutationThrottleRef.current = setTimeout(() => {
          mutationThrottleRef.current = null;
          if (!openRef.current) return;
          const step = stepsRef.current[stepIndexRef.current];
          if (!step) return;
          const el = elementRef.current;
          const needStep =
            step.target !== undefined && (el === null || !el.isConnected);
          const needGate =
            step.advanceOn?.selector !== undefined && gatedRef.current;
          if (needStep || needGate) setResolveEpoch((e) => e + 1);
        }, MUTATION_RERESOLVE_THROTTLE_MS);
      },
    });
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    observeMutations(document.body);
    return () => {
      disconnectMutations();
      if (mutationThrottleRef.current !== null) {
        clearTimeout(mutationThrottleRef.current);
        mutationThrottleRef.current = null;
      }
    };
  }, [open, observeMutations, disconnectMutations]);

  // --- focus trap + restore -------------------------------------------------
  // Captured at the moment the tour opens, restored by the trap's returnFocus
  // getter on final close. Our own capture (rather than the trap's built-in
  // one) survives the trap's per-step deactivate/reactivate cycle — the trap
  // re-captures "previously focused" on every activation, which mid-tour
  // would be a tour button, not the pre-tour trigger.
  const preTourFocusRef = useRef<HTMLElement | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (open && typeof document !== "undefined") {
      preTourFocusRef.current = document.activeElement as HTMLElement | null;
    }
  }, [open]);

  const tooltipElRef = useLatest(tooltipEl);
  // The trap activates per settled, *visible* tooltip: while the measuring
  // guard has the tooltip `visibility: hidden` (spotlight exists but its
  // position is not yet computed), buttons aren't focusable in real browsers,
  // so activation waits for the measured commit. The step-change re-measure
  // cycles the trap, which also re-applies initial focus on every step.
  //
  // Deliberate gap: during pending windows (wait-policy hold, auto-scroll in
  // flight) the tooltip is unmounted, so the trap is inactive and Tab can
  // reach the page underneath until the step settles. Revisit in Phase 4
  // hardening if a cheap "hold" trap is feasible.
  const trapActive =
    open &&
    tooltipEl !== null &&
    !(geometry.spotlight !== null && geometry.tooltip === null);
  const trapRef = useFocusTrap<HTMLElement>(trapActive, {
    // Primary action first (Next/Done — skipped while disabled by a gate),
    // then close, then the tooltip itself (the trap falls back to its
    // container when the getter yields null).
    initialFocus: () =>
      tooltipElRef.current?.querySelector<HTMLElement>(
        "[data-tour-next]:not([disabled])"
      ) ??
      tooltipElRef.current?.querySelector<HTMLElement>("[data-tour-close]") ??
      null,
    // Restore only on final close. The trap also deactivates mid-tour (every
    // pending transition unmounts the tooltip), and its deferred restore
    // would otherwise fire while the tour is still open — yanking focus (and
    // scroll) back to the trigger. While open, the getter yields null and the
    // trap skips the restore; by the time the close-commit cleanup evaluates
    // it, `openRef` is already false, so the real restore still happens.
    returnFocus: () =>
      openRef.current ? null : preTourFocusRef.current,
  });

  // --- keyboard navigation --------------------------------------------------
  // Escape is registered separately with `enableOnFormTags`: dismissing the
  // tour must work even while the user is typing in an input/textarea (e.g.
  // a renderStep form) — whereas the navigation keys below deliberately keep
  // the editable-target guard so arrows/Enter never hijack typing.
  useHotkeys(
    "esc",
    (event) => {
      event.preventDefault();
      skip();
    },
    { enabled: open && keyboard !== false, enableOnFormTags: true }
  );
  useHotkeys(
    ["right", "enter", "left"],
    (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        prev();
        return;
      }
      // ArrowRight / Enter advance — but Enter never hijacks activating a
      // button or link (the Back/Skip/Close buttons must keep working), and
      // neither key advances past an unmet gate (same rule as the disabled
      // Next button).
      if (event.key === "Enter") {
        const target = event.target;
        if (
          target instanceof Element &&
          target.closest("button, [role='button'], a[href]")
        ) {
          return;
        }
      }
      if (gatedRef.current) return;
      event.preventDefault();
      next();
    },
    { enabled: open && keyboard !== false }
  );

  // --- prop getters --------------------------------------------------------
  const setTooltipRef = useCallback(
    (node: HTMLElement | null) => {
      setTooltipEl(node);
      trapRef(node);
    },
    [trapRef]
  );

  // Stable ids tying the dialog to its title/content elements. (useId can
  // emit ':' — legal in ids but noisy; strip for cleanliness.)
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `usefy-tour-title-${reactId}`;
  const contentId = `usefy-tour-content-${reactId}`;
  const hasTitle = activeStep?.title != null;

  const getTooltipProps = useCallback(
    (): React.HTMLAttributes<HTMLElement> & { ref: React.Ref<HTMLElement> } => ({
      ref: setTooltipRef,
      role: "dialog",
      "aria-modal": true,
      // The UI layer stamps these ids onto the title/content elements it
      // renders (read them from these props); when the step has no title the
      // dialog falls back to a positional label.
      ...(hasTitle
        ? { "aria-labelledby": titleId }
        : { "aria-label": `Step ${stepIndex + 1} of ${stepCount}` }),
      "aria-describedby": contentId,
    }),
    [setTooltipRef, hasTitle, titleId, contentId, stepIndex, stepCount]
  );

  const getOverlayProps = useCallback(
    (): React.HTMLAttributes<HTMLElement> => ({
      "aria-hidden": true,
    }),
    []
  );

  // --- assembled return ----------------------------------------------------
  return {
    open,
    stepIndex,
    step: activeStep,
    stepCount,
    isFirst: stepIndex <= 0,
    isLast: stepCount > 0 && stepIndex >= stepCount - 1,
    geometry,
    pending: pending || scrolling,
    gated,
    settled: open && settledIndex === stepIndex,
    start,
    next,
    prev,
    goTo,
    skip,
    finish,
    getTooltipProps,
    getOverlayProps,
  };
}

/**
 * Clear a persisted tour so it can auto-open again.
 *
 * Removes the `usefy-tour:<tourId>` localStorage entry written when a tour
 * with a `tourId` is finished or skipped. Safe to call on the server or when
 * localStorage is unavailable (it silently no-ops).
 *
 * @param tourId - The `tourId` the tour was configured with.
 *
 * @example
 * ```ts
 * import { resetTour } from "@usefy/spotlight-tour/headless";
 *
 * // e.g. from a "Replay onboarding" button:
 * resetTour("dashboard-onboarding");
 * ```
 */
export function resetTour(tourId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${TOUR_STORAGE_PREFIX}${tourId}`);
  } catch {
    // localStorage can throw (privacy mode, disabled storage) — ignore.
  }
}

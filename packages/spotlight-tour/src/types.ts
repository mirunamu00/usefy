import type * as React from "react";

/**
 * An axis-aligned rectangle in viewport coordinates.
 *
 * Used throughout the positioning engine for target rects, spotlight rects,
 * and tooltip boxes. Matches the `x`/`y`/`width`/`height` subset of
 * `DOMRect`, so a `getBoundingClientRect()` result can be spread into one.
 *
 * @example
 * ```ts
 * import type { Rect } from "@usefy/spotlight-tour/headless";
 *
 * const rect: Rect = { x: 100, y: 200, width: 320, height: 48 };
 * ```
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The element a tour step highlights, in one of three forms:
 *
 * - a **CSS selector** string (resolved with `document.querySelector`),
 * - a **React ref** to the element,
 * - a **function** returning the element (or `null` when absent).
 *
 * @example
 * ```tsx
 * import type { TourStep } from "@usefy/spotlight-tour/headless";
 *
 * const searchRef = React.useRef<HTMLInputElement>(null);
 *
 * const steps: TourStep[] = [
 *   { target: "#search-bar", content: "Search anything here." },
 *   { target: searchRef, content: "Or point a ref at it." },
 *   { target: () => document.querySelector(".settings"), content: "Or a function." },
 * ];
 * ```
 */
export type TourTarget =
  | string
  | React.RefObject<Element | null>
  | (() => Element | null);

/**
 * Preferred tooltip side relative to the spotlight.
 *
 * `'auto'` ranks sides fit-first: it picks the roomiest side among those where
 * the tooltip actually fits, falling back to the roomiest overall when none
 * fit. Whatever the preference, the engine flips to the opposite side when the
 * preferred one overflows, and shifts along the cross axis to stay visible.
 *
 * @example
 * ```ts
 * import type { TourPlacement } from "@usefy/spotlight-tour/headless";
 *
 * const placement: TourPlacement = "bottom";
 * ```
 */
export type TourPlacement = "top" | "bottom" | "left" | "right" | "auto";

/**
 * What the tour does when a step's target cannot be resolved:
 *
 * - `'skip'` — advance to the next resolvable step in the direction the user
 *   was navigating (default).
 * - `'wait'` — hold in a `pending` state up to `waitTimeout` ms, retrying the
 *   target, then fall back to skipping.
 * - `'center'` — show the step anyway as a centered modal (no spotlight).
 *
 * @example
 * ```ts
 * import type { TourStep } from "@usefy/spotlight-tour/headless";
 *
 * const step: TourStep = {
 *   target: "#lazy-widget",
 *   content: "This widget loads asynchronously.",
 *   missingTarget: "wait",
 *   waitTimeout: 5000,
 * };
 * ```
 */
export type MissingTargetPolicy = "skip" | "wait" | "center";

/**
 * One unit of a tour: a target to spotlight plus the tooltip content and
 * per-step behavior overrides.
 *
 * @example
 * ```tsx
 * import type { TourStep } from "@usefy/spotlight-tour/headless";
 *
 * const steps: TourStep[] = [
 *   { title: "Welcome!", content: "Let's take a quick look around." }, // centered
 *   {
 *     target: "#search-bar",
 *     title: "Search",
 *     content: "Find anything from here.",
 *     placement: "bottom",
 *     spotlightPadding: 12,
 *     onEnter: () => console.log("entered search step"),
 *   },
 * ];
 * ```
 */
export interface TourStep {
  /** Element to spotlight. Omit for a centered (modal) step. */
  target?: TourTarget;
  /** Tooltip heading. */
  title?: React.ReactNode;
  /** Tooltip body. */
  content: React.ReactNode;
  /** Preferred tooltip side; 'auto' picks the roomiest. @default 'auto' */
  placement?: TourPlacement;
  /** Extra px around the target inside the spotlight. @default 8 */
  spotlightPadding?: number;
  /** Spotlight corner radius in px. @default 8 */
  spotlightRadius?: number;
  /** What to do when the target can't be resolved. @default 'skip' */
  missingTarget?: MissingTargetPolicy;
  /** ms to wait in 'wait' mode before falling back to skip. @default 3000 */
  waitTimeout?: number;
  /**
   * Require a user action to advance: the step stays `gated` (Next rendered
   * disabled, ArrowRight/Enter blocked) until `event` fires on the resolved
   * target — or on `selector`, resolved against `document` — after which the
   * tour advances automatically.
   *
   * Accessibility notes: explain the required action in the step's `content`
   * (the default UI also shows a `labels.gatedHint` line while gated). Gate
   * targets are pointer-interactive by design — keyboard users can still
   * navigate Back or dismiss with Escape. If you need the gate action itself
   * to be fully keyboard-reachable, render it inside the tooltip via
   * `renderStep` so it participates in the focus trap.
   */
  advanceOn?: { event: "click"; selector?: string };
  /** Allow clicking through the spotlight onto the target. @default true */
  spotlightClicks?: boolean;
  /** Scroll the target into view when off-screen. @default true */
  scrollIntoView?: boolean;
  /**
   * Make the `SpotlightTour` `overlayClick` modes (`'close'` / `'next'`)
   * behave as `'ignore'` for this step — a dimmed-area click does nothing.
   * Useful for gated steps the user must not accidentally dismiss.
   * @default false
   */
  disableOverlayClose?: boolean;
  /**
   * Called when the tour enters this step. Only fires for steps that actually
   * settle on screen: centered steps, steps whose target resolved, and
   * `'wait'`-policy steps (visibly pending counts as entered). Steps jumped
   * over by the `'skip'` missing-target policy never fire it.
   */
  onEnter?: () => void;
  /**
   * Called when the tour leaves this step (navigation, close, or a
   * `'wait'`-policy timeout skipping it). Always paired with a preceding
   * `onEnter`; skipped-over steps fire neither.
   */
  onLeave?: () => void;
}

/**
 * Options for {@link useSpotlightTour}. `open` and `step` each follow the
 * controllable-state pattern: pass `open`/`step` to control from the outside,
 * or `defaultOpen`/`defaultStep` to let the hook own the state — the
 * `on*Change` callbacks fire in both modes.
 *
 * @example
 * ```tsx
 * import { useSpotlightTour } from "@usefy/spotlight-tour/headless";
 *
 * function Onboarding() {
 *   const tour = useSpotlightTour({
 *     steps: [
 *       { target: "#search", content: "Search here" },
 *       { target: "#settings", content: "Tune things here" },
 *     ],
 *     defaultOpen: false,
 *     onFinish: () => console.log("done!"),
 *   });
 *
 *   return <button onClick={() => tour.start()}>Start tour</button>;
 * }
 * ```
 */
export interface UseSpotlightTourOptions {
  /** The ordered list of tour steps. */
  steps: TourStep[];

  // --- open ownership ---
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Fires whenever the open state changes (both modes). */
  onOpenChange?: (open: boolean) => void;

  // --- step ownership ---
  /** Controlled step index. */
  step?: number;
  /** Initial step index when uncontrolled. @default 0 */
  defaultStep?: number;
  /** Fires whenever the step index changes (both modes). */
  onStepChange?: (index: number) => void;

  // --- behavior ---
  /**
   * localStorage persistence key; omit to disable persistence.
   * A finished/skipped tour with a `tourId` will not auto-open again
   * (key format: `usefy-tour:<tourId>`).
   */
  tourId?: string;
  /** Enable arrow-key/Escape keyboard navigation. @default true */
  keyboard?: boolean;
  /** Lock background scroll while the tour is open. @default true */
  scrollLock?: boolean;
  /** Called when the tour completes (Done / next on the last step). */
  onFinish?: () => void;
  /** Called when the tour is skipped, with the step index it was on. */
  onSkip?: (atStep: number) => void;
}

/**
 * Live positioning data for the active step, rAF-batched — state commits only
 * when the underlying values actually change.
 *
 * @example
 * ```tsx
 * import { useSpotlightTour } from "@usefy/spotlight-tour/headless";
 *
 * function CustomOverlay() {
 *   const { geometry } = useSpotlightTour({ steps: [{ target: "#hero", content: "Hi" }], defaultOpen: true });
 *   if (!geometry.spotlight) return null; // centered step (or not measured yet)
 *   const { x, y, width, height, radius } = geometry.spotlight;
 *   return <div style={{ position: "fixed", left: x, top: y, width, height, borderRadius: radius }} />;
 * }
 * ```
 */
export interface SpotlightGeometry {
  /** Spotlight rect in viewport coords, or null for a centered step. */
  spotlight: (Rect & { radius: number }) | null;
  /** Resolved tooltip position (null until measured). */
  tooltip: {
    x: number;
    y: number;
    placement: string;
    arrow: { x: number; y: number };
  } | null;
}

/**
 * Imperative tour controls, exposed via `controllerRef` on `SpotlightTour`
 * (and structurally identical to the control slice of
 * {@link UseSpotlightTourReturn}). All methods are stable references.
 *
 * @example
 * ```tsx
 * import { useRef } from "react";
 * import { SpotlightTour, type TourController } from "@usefy/spotlight-tour";
 *
 * function App() {
 *   const controller = useRef<TourController>(null);
 *   return (
 *     <>
 *       <button onClick={() => controller.current?.start()}>Help</button>
 *       <SpotlightTour
 *         controllerRef={controller}
 *         steps={[{ target: "#search", content: "Search here" }]}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export interface TourController {
  /** Open the tour, optionally jumping to a step index (clamped). */
  start: (at?: number) => void;
  /** Advance one step; on the last step this finishes the tour. */
  next: () => void;
  /** Go back one step; no-op on the first step. */
  prev: () => void;
  /** Jump to a step index (clamped to the valid range). */
  goTo: (index: number) => void;
  /** Close the tour as skipped (fires `onSkip`). */
  skip: () => void;
  /** Close the tour as completed (fires `onFinish`). */
  finish: () => void;
}

/**
 * Button label overrides for the default tooltip UI (i18n-friendly).
 *
 * @example
 * ```tsx
 * <SpotlightTour
 *   steps={steps}
 *   labels={{ back: "이전", next: "다음", skip: "건너뛰기", finish: "완료", close: "닫기" }}
 * />
 * ```
 */
export interface TourLabels {
  /** Back button. @default "Back" */
  back: string;
  /** Next button. @default "Next" */
  next: string;
  /** Skip button. @default "Skip" */
  skip: string;
  /** Next button on the last step. @default "Done" */
  finish: string;
  /** Accessible name of the close (×) button. @default "Close" */
  close: string;
  /**
   * Hint shown (and announced) while a step's `advanceOn` gate is unmet.
   * @default "Complete the highlighted action to continue"
   */
  gatedHint: string;
}

/**
 * Per-part class overrides for `SpotlightTour`.
 *
 * @example
 * ```tsx
 * <SpotlightTour steps={steps} classNames={{ tooltip: "my-tooltip", overlay: "my-overlay" }} />
 * ```
 */
export type SpotlightTourClassNames = Partial<
  Record<
    | "overlay"
    | "spotlight"
    | "tooltip"
    | "arrow"
    | "header"
    | "content"
    | "footer"
    | "dots"
    | "counter",
    string
  >
>;

/**
 * Context handed to `renderStep` when replacing the default tooltip UI.
 * Spread `tooltipProps` on your top-level element to keep the dialog
 * semantics; positioning is handled by the wrapper `SpotlightTour` renders.
 *
 * @example
 * ```tsx
 * <SpotlightTour
 *   steps={steps}
 *   renderStep={({ step, index, count, controller, tooltipProps }) => (
 *     <section {...tooltipProps} style={{ background: "#222", color: "#fff", padding: 16 }}>
 *       <p>{step.content}</p>
 *       <button onClick={controller.next}>Got it ({index + 1}/{count})</button>
 *     </section>
 *   )}
 * />
 * ```
 */
export interface RenderStepContext {
  /** The active step. */
  step: TourStep;
  /** The active step index. */
  index: number;
  /** Total number of steps. */
  count: number;
  /** Imperative tour controls. */
  controller: TourController;
  /** True when the step's advance gate is unmet. */
  gated: boolean;
  /** A11y props to spread on your tooltip element. */
  tooltipProps: React.HTMLAttributes<HTMLElement>;
}

/**
 * Everything {@link useSpotlightTour} returns: tour state, live geometry, and
 * `useCallback`-stable controls plus prop getters for building a bespoke UI.
 *
 * @example
 * ```tsx
 * import { useSpotlightTour } from "@usefy/spotlight-tour/headless";
 *
 * function MyTour() {
 *   const { open, step, stepIndex, stepCount, isLast, next, prev, skip, getTooltipProps } =
 *     useSpotlightTour({
 *       steps: [
 *         { target: "#a", content: "First" },
 *         { target: "#b", content: "Second" },
 *       ],
 *       defaultOpen: true,
 *     });
 *
 *   if (!open || !step) return null;
 *   return (
 *     <div {...getTooltipProps()}>
 *       {step.content}
 *       <button onClick={prev}>Back</button>
 *       <button onClick={next}>{isLast ? "Done" : "Next"}</button>
 *       <button onClick={skip}>Skip ({stepIndex + 1}/{stepCount})</button>
 *     </div>
 *   );
 * }
 * ```
 */
export interface UseSpotlightTourReturn {
  /** Whether the tour is open. */
  open: boolean;
  /** The active step index. */
  stepIndex: number;
  /** The active step object, or null when closed / out of range. */
  step: TourStep | null;
  /** Total number of steps. */
  stepCount: number;
  /** True when the active step is the first one. */
  isFirst: boolean;
  /** True when the active step is the last one. */
  isLast: boolean;
  /** Live geometry, rAF-batched; re-renders only when values change. */
  geometry: SpotlightGeometry;
  /** True while waiting for a 'wait'-policy target or auto-scroll to settle. */
  pending: boolean;
  /** True when the current step has an unmet advanceOn gate. */
  gated: boolean;
  /**
   * True once the active step has actually settled on screen: its target
   * resolved (or it is a centered step). False while closed, while a
   * `'wait'`-policy target is still pending, and during the commits in which
   * a `'skip'`-policy cascade is jumping over unresolvable steps.
   *
   * For announcement gating (`aria-live`) and other "the user can now see
   * this step" side effects, combine it with `!pending` — `settled` stays
   * true while an auto-scroll to an already-resolved target is still in
   * flight, but `pending` covers that window (this is exactly what the
   * styled `SpotlightTour` does).
   */
  settled: boolean;

  // --- controls (useCallback-stable) ---
  /** Open the tour, optionally jumping to a step index (clamped). */
  start: (at?: number) => void;
  /** Advance one step; on the last step this finishes the tour. */
  next: () => void;
  /** Go back one step; no-op on the first step. */
  prev: () => void;
  /** Jump to a step index (clamped to the valid range). */
  goTo: (index: number) => void;
  /** Close the tour as skipped (fires `onSkip` with the current index). */
  skip: () => void;
  /** Close the tour as completed (fires `onFinish`). */
  finish: () => void;

  // --- prop getters for custom UIs (a11y baked in) ---
  /** Props (incl. ref) to spread on your tooltip element. */
  getTooltipProps: () => React.HTMLAttributes<HTMLElement> & {
    ref: React.Ref<HTMLElement>;
  };
  /** Props to spread on your overlay element. */
  getOverlayProps: () => React.HTMLAttributes<HTMLElement>;
}

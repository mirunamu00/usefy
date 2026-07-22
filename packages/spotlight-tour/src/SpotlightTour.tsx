import * as React from "react";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { useReducedMotion } from "@usefy/use-reduced-motion";
import { useSpotlightTour } from "./useSpotlightTour";
import { Overlay } from "./components/Overlay/Overlay";
import { Tooltip } from "./components/Tooltip/Tooltip";
import type {
  RenderStepContext,
  SpotlightTourClassNames,
  TourController,
  TourLabels,
  UseSpotlightTourOptions,
} from "./types";
import styles from "./SpotlightTour.module.scss";

/** Default overlay dim color. */
const DEFAULT_MASK_COLOR = "rgba(0 0 0 / 0.55)";
/** Default spotlight/tooltip transition duration (ms). */
const DEFAULT_TRANSITION_MS = 300;
/** Default stacking context for the portal layer. */
const DEFAULT_Z_INDEX = 1000;

const DEFAULT_LABELS: TourLabels = {
  back: "Back",
  next: "Next",
  skip: "Skip",
  finish: "Done",
  close: "Close",
  gatedHint: "Complete the highlighted action to continue",
};

/** Props for {@link SpotlightTour}. Extends every {@link UseSpotlightTourOptions}. */
export interface SpotlightTourProps extends UseSpotlightTourOptions {
  // --- presentation ---
  /** Overlay color. @default 'rgba(0 0 0 / 0.55)' */
  maskColor?: string;
  /**
   * Spotlight/tooltip transition ms (0 disables). Automatically forced to 0
   * when the user prefers reduced motion. @default 300
   */
  transitionDuration?: number;
  /**
   * What a click on the dimmed area does: `'ignore'` (nothing — the tour is
   * deliberate), `'close'` (dismisses like Skip, fires `onSkip`), or `'next'`
   * (advances a step). @default 'ignore'
   */
  overlayClick?: "ignore" | "close" | "next";
  /** z-index of the portal layer. @default 1000 */
  zIndex?: number;

  // --- UI customization ---
  /** Button label overrides (i18n-friendly). */
  labels?: Partial<TourLabels>;
  /** Show the progress dots. @default true */
  showProgress?: boolean;
  /** Show the "2 / 5" step counter. @default true */
  showCounter?: boolean;
  /** Show the Skip button. @default true */
  showSkip?: boolean;
  /** Show the close (×) button. @default true */
  showClose?: boolean;
  /**
   * Replace the whole tooltip UI. The wrapper `SpotlightTour` renders stays
   * position-only; spread `ctx.tooltipProps` on your element for a11y.
   */
  renderStep?: (ctx: RenderStepContext) => ReactNode;

  // --- theming ---
  /** Color theme. `'system'` follows `prefers-color-scheme`. @default 'system' */
  theme?: "light" | "dark" | "system";
  /** Per-part class overrides. */
  classNames?: SpotlightTourClassNames;
  /** Extra class on the portal root element. */
  className?: string;

  /** Imperative access to the tour controls. */
  controllerRef?: React.Ref<TourController>;
}

/** Resolve the effective dark-mode boolean for the chosen theme (SSR-safe). */
function useResolvedDark(theme: "light" | "dark" | "system"): boolean {
  const [dark, setDark] = useState(theme === "dark");

  useEffect(() => {
    if (theme === "light") {
      setDark(false);
      return;
    }
    if (theme === "dark") {
      setDark(true);
      return;
    }
    if (typeof window === "undefined" || !window.matchMedia) {
      setDark(false);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDark(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, [theme]);

  return dark;
}

/**
 * A guided onboarding tour: dims the screen, cuts an animated spotlight hole
 * around each step's target, and shows a step tooltip beside it. Built on
 * {@link useSpotlightTour} — every hook option (controlled/uncontrolled
 * `open`/`step`, missing-target policies, lifecycle callbacks) works here too.
 *
 * Portal-rendered into `document.body` after mount (nothing renders on the
 * server), themable via `--usefy-tour-*` CSS variables, and animated between
 * steps unless `transitionDuration` is 0 or the user prefers reduced motion.
 *
 * @example
 * ```tsx
 * import { SpotlightTour } from "@usefy/spotlight-tour";
 *
 * function App() {
 *   return (
 *     <SpotlightTour
 *       defaultOpen
 *       steps={[
 *         { title: "Welcome!", content: "A quick look around." }, // centered
 *         { target: "#search", title: "Search", content: "Find anything here." },
 *         { target: "#settings", content: "Tune your preferences.", placement: "left" },
 *       ]}
 *       onFinish={() => console.log("toured!")}
 *     />
 *   );
 * }
 * ```
 */
export function SpotlightTour(props: SpotlightTourProps): ReactNode {
  const {
    // presentation
    maskColor = DEFAULT_MASK_COLOR,
    transitionDuration = DEFAULT_TRANSITION_MS,
    overlayClick = "ignore",
    zIndex = DEFAULT_Z_INDEX,
    // UI customization
    labels,
    showProgress = true,
    showCounter = true,
    showSkip = true,
    showClose = true,
    renderStep,
    // theming
    theme = "system",
    classNames,
    className,
    controllerRef,
    // everything else drives the hook
    ...hookOptions
  } = props;

  const tour = useSpotlightTour(hookOptions);

  const reducedMotion = useReducedMotion();
  const effectiveDuration = reducedMotion ? 0 : transitionDuration;
  const isDark = useResolvedDark(theme);

  // Portal only after mount: nothing renders during SSR / the first hydration
  // pass, so no `document` access happens on the server.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const mergedLabels: TourLabels = { ...DEFAULT_LABELS, ...labels };
  const gatedHintLabel = mergedLabels.gatedHint;

  // Step announcements for screen readers: the visually-hidden live region
  // below re-announces on each *settled* step (skipped-over steps and
  // pending/auto-scrolling states stay silent). Gated steps append the gate
  // hint so the requirement is conveyed non-visually too. The text is set
  // from an effect so the region always mounts empty first — aria-live only
  // announces *changes* to an existing region.
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    if (!tour.open) {
      setAnnouncement("");
      return;
    }
    if (!tour.settled || tour.pending) return;
    const title =
      typeof tour.step?.title === "string" ? `: ${tour.step.title}` : "";
    const hint = tour.gated ? `. ${gatedHintLabel}` : "";
    setAnnouncement(
      `Step ${tour.stepIndex + 1} of ${tour.stepCount}${title}${hint}`
    );
  }, [
    tour.open,
    tour.settled,
    tour.pending,
    tour.gated,
    tour.stepIndex,
    tour.stepCount,
    tour.step?.title,
    gatedHintLabel,
  ]);

  const controller = useMemo<TourController>(
    () => ({
      start: tour.start,
      next: tour.next,
      prev: tour.prev,
      goTo: tour.goTo,
      skip: tour.skip,
      finish: tour.finish,
    }),
    [tour.start, tour.next, tour.prev, tour.goTo, tour.skip, tour.finish]
  );
  useImperativeHandle(controllerRef, () => controller, [controller]);

  if (!mounted || !tour.open || !tour.step) return null;

  const step = tour.step;
  const centered = tour.geometry.spotlight === null;

  // Per-step disableOverlayClose downgrades 'close'/'next' to 'ignore'.
  const overlayClickHandler = step.disableOverlayClose
    ? undefined
    : overlayClick === "close"
      ? tour.skip
      : overlayClick === "next"
        ? tour.next
        : undefined;

  return createPortal(
    <div
      // `.light` only for an explicit theme="light" prop: it out-specifies a
      // host's [data-theme="dark"] hook (explicit prop > host attribute >
      // system). System-resolved light stays overridable by the host.
      className={clsx(
        styles.root,
        isDark && styles.dark,
        theme === "light" && styles.light,
        className
      )}
      style={{ zIndex }}
      data-tour-root=""
    >
      <Overlay
        spotlight={tour.geometry.spotlight}
        maskColor={maskColor}
        transitionDuration={effectiveDuration}
        spotlightClicks={step.spotlightClicks ?? true}
        onOverlayClick={overlayClickHandler}
        overlayProps={tour.getOverlayProps()}
        className={classNames?.overlay}
        spotlightClassName={classNames?.spotlight}
      />
      <div className={styles.srOnly} role="status" aria-live="polite">
        {announcement}
      </div>
      {/* While a 'wait'-policy target is pending (or an auto-scroll is in
          flight) there is nothing to anchor to yet — the dim layer shows and
          the tooltip holds off. A hidden focus holder keeps the trap alive by
          carrying the tooltip ref: it contains nothing focusable, so the trap
          pins focus to it and Tab cannot reach the dimmed page underneath. */}
      {tour.pending ? (
        <div
          ref={tour.getTooltipProps().ref as Ref<HTMLDivElement> | undefined}
          className={styles.srOnly}
          data-tour-focus-holder=""
        />
      ) : (
        <Tooltip
          step={step}
          index={tour.stepIndex}
          count={tour.stepCount}
          position={tour.geometry.tooltip}
          centered={centered}
          gated={tour.gated}
          isFirst={tour.isFirst}
          isLast={tour.isLast}
          labels={mergedLabels}
          showProgress={showProgress}
          showCounter={showCounter}
          showSkip={showSkip}
          showClose={showClose}
          controller={controller}
          tooltipProps={tour.getTooltipProps()}
          classNames={classNames}
          renderStep={renderStep}
        />
      )}
    </div>,
    document.body
  );
}

SpotlightTour.displayName = "SpotlightTour";

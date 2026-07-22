import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Arrow } from "../Arrow/Arrow";
import type {
  RenderStepContext,
  SpotlightGeometry,
  SpotlightTourClassNames,
  TourController,
  TourLabels,
  TourStep,
} from "../../types";
import styles from "./Tooltip.module.scss";

/** A resolved (non-null) tooltip position from the engine. */
type TooltipPosition = NonNullable<SpotlightGeometry["tooltip"]>;

/** Props for the internal {@link Tooltip}. */
export interface TooltipProps {
  /** The active step. */
  step: TourStep;
  /** Active step index. */
  index: number;
  /** Total step count. */
  count: number;
  /** Engine-resolved position, or `null` (unmeasured / centered). */
  position: SpotlightGeometry["tooltip"];
  /**
   * Effective transition duration (ms) — the same value driving the spotlight
   * morph and the tooltip's CSS `left`/`top` transition. Used to hold the
   * step-move glide "armed" for exactly its duration before returning to the
   * snap-on-tracking mode. `0` (reduced motion / disabled) makes every move
   * instant.
   */
  transitionDuration: number;
  /** Render centered (modal mode) instead of positioned. */
  centered: boolean;
  /** Whether the step's advance gate is unmet (disables Next/Done + hint). */
  gated: boolean;
  isFirst: boolean;
  isLast: boolean;
  /** Fully-merged button labels. */
  labels: TourLabels;
  showProgress: boolean;
  showCounter: boolean;
  showSkip: boolean;
  showClose: boolean;
  /** Imperative controls driving the buttons. */
  controller: TourController;
  /** Props (incl. measurement ref) from `getTooltipProps()`. */
  tooltipProps: React.HTMLAttributes<HTMLElement> & {
    ref: React.Ref<HTMLElement>;
  };
  classNames?: SpotlightTourClassNames;
  /** Full custom render replacing the default UI (SPEC §4.4). */
  renderStep?: (ctx: RenderStepContext) => React.ReactNode;
}

/**
 * The step tooltip. A positioning wrapper (absolute at the engine-computed
 * position, or CSS-centered for target-less steps, `visibility: hidden` until
 * measured) hosts either the default UI — header (title + close), content,
 * footer (counter, dots, Back / Skip / Next-Done) — or the consumer's
 * `renderStep` output.
 *
 * With `renderStep`, the wrapper stays visually bare: it only positions and
 * carries the measurement ref, while the a11y props are handed to the consumer
 * via `ctx.tooltipProps` to spread on their own element.
 *
 * @internal Rendered by `SpotlightTour`; not part of the public API.
 */
export function Tooltip(props: TooltipProps): React.ReactNode {
  const {
    step,
    index,
    count,
    position,
    transitionDuration,
    centered,
    gated,
    isFirst,
    isLast,
    labels,
    showProgress,
    showCounter,
    showSkip,
    showClose,
    controller,
    tooltipProps,
    classNames,
    renderStep,
  } = props;

  const { ref, ...restTooltipProps } = tooltipProps;
  // The hook mints the dialog's labelling ids; stamp them on the elements we
  // render so aria-labelledby/-describedby actually resolve.
  const titleId = restTooltipProps["aria-labelledby"];
  const contentId = restTooltipProps["aria-describedby"];

  // --- motion: glide on step change, snap on live tracking ------------------
  // The engine feeds `position` as: real coords while the step is settled and
  // tracking, then momentarily `null` for the re-measure window on a step
  // change (the size hook drops its measurement so the NEW content is measured
  // before paint), then the new step's coords — which themselves settle across
  // SEVERAL pre-paint commits (element → target rect → size → position all
  // cascade). Two things fall out of that and drive the design:
  //
  //   1. Retention — the last painted coordinates are kept as the effective
  //      position through the null window, so the box never blanks/hides and
  //      never teleports; those coords are the CSS transition's from-state.
  //   2. Arming — whether to animate CANNOT be decided from an effect: React
  //      flushes passive effects between the cascade's commits (verified in
  //      Chrome, not just jsdom), so any effect-updated "last step" marker
  //      advances mid-cascade and the final positioned commit snaps. Instead we
  //      arm synchronously (render-phase) when the step index changes and hold
  //      it armed for the whole synchronous cascade AND the glide's duration
  //      (disarming any earlier would toggle `transition: none` mid-flight and
  //      cancel it). Live tracking updates land later, disarmed, and snap 1:1
  //      (no rubber-band).
  //
  //   • Step-to-step move (target → target) → glide (armed).
  //   • Live tracking (scroll / resize / auto-scroll) → snap (disarmed).
  //   • First paint & centered↔targeted → snap (no positioned from-state).
  //
  // Concurrent-safe: `paintedRef` (retention only) is read in render and
  // written in a passive effect; the arm decision is the documented
  // setState-during-render derivation — no render-phase ref mutation.
  const paintedRef = useRef<TooltipPosition | null>(null);

  // Effective coordinates: the live position, or — through the re-measure
  // window — the last painted coordinates (retained, never cleared on a step
  // change), so the transition's from-state survives.
  const activePos = centered ? null : position ?? paintedRef.current;

  // Arm a glide the moment the step index changes, but only when there is a
  // positioned from-state to move from (target → target). `armed` stays true
  // across the settling cascade and is dropped on the next frame below.
  const [seenIndex, setSeenIndex] = useState(index);
  const [armed, setArmed] = useState(false);
  if (seenIndex !== index) {
    setSeenIndex(index);
    setArmed(!centered && paintedRef.current !== null);
  }

  useEffect(() => {
    if (!armed || typeof window === "undefined") return;
    // Hold armed for the glide's full duration, then return to snap mode so
    // live tracking sticks 1:1. Disarming any earlier (e.g. next frame) would
    // toggle `transition: none` mid-flight and cancel the glide. A small buffer
    // guards the transition-end boundary. `seenIndex` is a dep so back-to-back
    // step moves each reschedule their own disarm — without it, a second move
    // arriving while already armed is a no-op `setArmed(true)` and the FIRST
    // move's timer would fire mid-way through the second glide, snapping it.
    const timer = window.setTimeout(
      () => setArmed(false),
      transitionDuration + 50
    );
    return () => window.clearTimeout(timer);
  }, [armed, seenIndex, transitionDuration]);

  useEffect(() => {
    paintedRef.current = centered ? null : position ?? paintedRef.current;
  });

  const isStepMove = armed && !centered && activePos !== null;

  // Not centered and never positioned yet → keep hidden until the first
  // measure lands, so the box never flashes at (0, 0).
  const measuring = !centered && activePos === null;

  const wrapperStyle: React.CSSProperties | undefined = activePos
    ? { left: activePos.x, top: activePos.y }
    : undefined;

  const wrapperClass = clsx(
    styles.tooltip,
    centered && styles.centered,
    measuring && styles.measuring,
    // Transition ON only for a step move; snapped for first paint, live
    // tracking, the re-measure window, and centered↔targeted switches.
    !isStepMove && styles.noTransition,
    classNames?.tooltip
  );

  if (renderStep) {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={wrapperClass}
        style={wrapperStyle}
        data-tour-tooltip=""
        data-placement={activePos?.placement}
      >
        {renderStep({
          step,
          index,
          count,
          controller,
          gated,
          tooltipProps: restTooltipProps,
        })}
      </div>
    );
  }

  return (
    <div
      {...restTooltipProps}
      ref={ref as React.Ref<HTMLDivElement>}
      className={clsx(wrapperClass, styles.box)}
      style={wrapperStyle}
      data-tour-tooltip=""
      data-placement={activePos?.placement}
    >
      {!centered && activePos && (
        <Arrow
          x={activePos.arrow.x}
          y={activePos.arrow.y}
          placement={activePos.placement}
          className={classNames?.arrow}
        />
      )}

      {(step.title != null || showClose) && (
        <div
          className={clsx(styles.header, classNames?.header)}
          data-tour-header=""
        >
          {step.title != null && (
            <div className={styles.title} id={titleId}>
              {step.title}
            </div>
          )}
          {showClose && (
            <button
              type="button"
              className={styles.close}
              aria-label={labels.close}
              onClick={controller.skip}
              data-tour-close=""
            >
              ×
            </button>
          )}
        </div>
      )}

      <div
        className={clsx(styles.content, classNames?.content)}
        id={contentId}
        data-tour-content=""
      >
        {step.content}
      </div>

      <div
        className={clsx(styles.footer, classNames?.footer)}
        data-tour-footer=""
      >
        {(showCounter || showProgress) && (
          <div className={styles.meta}>
            {showCounter && (
              <span
                className={clsx(styles.counter, classNames?.counter)}
                data-tour-counter=""
              >
                {index + 1} / {count}
              </span>
            )}
            {showProgress && (
              <span
                className={clsx(styles.dots, classNames?.dots)}
                data-tour-dots=""
                aria-hidden="true"
              >
                {Array.from({ length: count }, (_, dot) => (
                  <span
                    key={dot}
                    className={clsx(
                      styles.dot,
                      dot === index && styles.dotActive
                    )}
                    data-tour-dot={dot === index ? "active" : ""}
                  />
                ))}
              </span>
            )}
          </div>
        )}

        {showSkip && (
          <button
            type="button"
            className={clsx(styles.button, styles.buttonSecondary)}
            onClick={controller.skip}
            data-tour-skip=""
          >
            {labels.skip}
          </button>
        )}
        {!isFirst && (
          <button
            type="button"
            className={clsx(styles.button, styles.buttonSecondary)}
            onClick={controller.prev}
            data-tour-back=""
          >
            {labels.back}
          </button>
        )}
        {/* Gated steps keep Next visible but disabled — a hidden button reads
            as a dead end; disabled + the hint below conveys what to do. The
            onClick guard is belt-and-braces on top of `disabled`. */}
        <button
          type="button"
          className={clsx(styles.button, styles.buttonPrimary)}
          onClick={gated ? undefined : controller.next}
          disabled={gated}
          aria-disabled={gated || undefined}
          data-tour-next=""
        >
          {isLast ? labels.finish : labels.next}
        </button>
      </div>

      {gated && (
        <div className={styles.gatedHint} data-tour-gated-hint="">
          {labels.gatedHint}
        </div>
      )}
    </div>
  );
}

Tooltip.displayName = "SpotlightTourTooltip";

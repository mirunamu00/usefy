import * as React from "react";
import { useEffect, useRef } from "react";
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

  // Suppress the left/top transition on the commits that leave centered mode
  // (see .noTransition). Updated in a passive (post-paint) effect so the
  // pre-paint re-renders that first position the tooltip are still covered.
  const prevCentered = useRef(centered);
  useEffect(() => {
    prevCentered.current = centered;
  });
  const leavingCentered = prevCentered.current && !centered;

  const measuring = !centered && !position;
  const wrapperStyle: React.CSSProperties | undefined =
    !centered && position ? { left: position.x, top: position.y } : undefined;

  const wrapperClass = clsx(
    styles.tooltip,
    centered && styles.centered,
    measuring && styles.measuring,
    leavingCentered && styles.noTransition,
    classNames?.tooltip
  );

  if (renderStep) {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={wrapperClass}
        style={wrapperStyle}
        data-tour-tooltip=""
        data-placement={position?.placement}
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
      data-placement={position?.placement}
    >
      {!centered && position && (
        <Arrow
          x={position.arrow.x}
          y={position.arrow.y}
          placement={position.placement}
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

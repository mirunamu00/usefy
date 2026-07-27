"use client";

import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useImperativeHandle,
  useMemo,
} from "react";
import type { QRMatrix, QROptions } from "./types";
import { type UseQRCodeOptions, useQRCode } from "./useQRCode";
import { linearEndpoints, radialGeometry } from "./render/gradient";
import type { PNGExport, PNGExportOptions } from "./render/png";
import type { RenderOptions } from "./render/svg";

/** Imperative handle exposed through {@link QRCodeProps.controllerRef}. */
export interface QRCodeController {
  /** The encoded symbol, or `null` when encoding failed. */
  getMatrix(): QRMatrix | null;
  /** Serialize as a standalone SVG document. */
  toSVG(options?: RenderOptions): string;
  /** Rasterize to a PNG. */
  toPNG(options?: PNGExportOptions): Promise<PNGExport>;
  /** Trigger a browser download. */
  download(format?: "png" | "svg", filename?: string): Promise<void>;
}

/**
 * Attributes forwarded to the rendered element. `className`/`style` are listed
 * explicitly below; everything else — `id`, `data-*`, event handlers — passes
 * straight through, which is what lets a consumer target the element from a
 * test or a stylesheet.
 */
type PassthroughAttributes = Omit<
  HTMLAttributes<SVGSVGElement & HTMLCanvasElement>,
  // `color` and `onError` collide with this component's own props; children
  // and raw HTML have no meaning inside a generated symbol.
  "color" | "onError" | "children" | "dangerouslySetInnerHTML"
>;

export interface QRCodeProps extends QROptions, PassthroughAttributes {
  /** The data to encode. */
  value: string | Uint8Array;
  /** Rendered width and height in px. @default 160 */
  size?: number;
  /**
   * `"svg"` renders scalable markup and server-renders with no client work.
   * `"canvas"` is cheaper when many codes are on screen at once.
   * @default "svg"
   */
  render?: "svg" | "canvas";
  controllerRef?: Ref<QRCodeController>;
  /**
   * Accessible name. Without one the code is `aria-hidden`, on the assumption
   * that nearby text already says where it leads — reading a raw URL aloud is
   * poor screen-reader UX. Pass `aria-label` or `aria-hidden` explicitly to
   * override that decision either way.
   */
  title?: string;
  /** Called when encoding fails. The component renders nothing in that case. */
  onError?: (error: Error) => void;
  /** Throw the encoding failure during render, for an error boundary to catch. @default false */
  throwOnError?: boolean;
  /** Backing-store scale for `render="canvas"`. @default `min(devicePixelRatio, 2)` */
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

/** Props consumed by this component rather than forwarded to the DOM. */
const OWN_PROPS = new Set([
  "value",
  "size",
  "render",
  "controllerRef",
  "throwOnError",
  "dpr",
  "onError",
  "level",
  "version",
  "minVersion",
  "mask",
  "eci",
  "margin",
  "fg",
  "bg",
  "moduleShape",
  "eyeShape",
  "eyeColor",
  "moduleGap",
  "logo",
  "className",
  "style",
  "title",
]);

function passthrough(props: QRCodeProps): Record<string, unknown> {
  const source = props as unknown as Record<string, unknown>;
  const rest: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    // `undefined` means the caller said nothing. Carrying the key through
    // would let a spread of `aria-label={undefined}` erase the accessible name
    // the component just derived from `title`.
    if (!OWN_PROPS.has(key) && source[key] !== undefined) rest[key] = source[key];
  }
  return rest;
}

/**
 * A QR code.
 *
 * @example
 * ```tsx
 * <QRCode value="https://usefy.dev" size={200} level="Q" title="Open usefy.dev" />
 * ```
 *
 * @example Branded, with a logo
 * ```tsx
 * <QRCode
 *   value={ticketUrl}
 *   level="H"
 *   moduleShape="rounded"
 *   eyeShape="circle"
 *   fg={{ type: "linear", rotation: 45, stops: [
 *     { offset: 0, color: "#6366f1" },
 *     { offset: 1, color: "#ec4899" },
 *   ] }}
 *   logo={{ src: logoDataUri, size: 0.2 }}
 * />
 * ```
 */
export function QRCode(props: QRCodeProps): ReactNode {
  const {
    size = 160,
    render = "svg",
    controllerRef,
    throwOnError = false,
    className,
    style,
    title,
  } = props;

  const qr = useQRCode(props as UseQRCodeOptions);

  useImperativeHandle(
    controllerRef,
    () => ({
      getMatrix: () => qr.matrix,
      toSVG: qr.toSVG,
      toPNG: qr.toPNG,
      download: qr.download,
    }),
    [qr.matrix, qr.toSVG, qr.toPNG, qr.download],
  );

  const rest = passthrough(props);

  // A consumer's explicit aria-* always wins over the title-derived default.
  // `passthrough` has already dropped `undefined` values, so a key being
  // present here means the caller really did say something.
  const namedByConsumer = "aria-label" in rest || "aria-labelledby" in rest;
  const hiddenByConsumer = "aria-hidden" in rest;

  const accessibility = useMemo(() => {
    // `role="img"` accompanies any accessible name, whichever side supplied it:
    // a bare labelled <svg> is announced inconsistently across screen readers.
    if (namedByConsumer) return { role: "img" };
    if (hiddenByConsumer) return {};
    return title ? { role: "img", "aria-label": title } : { "aria-hidden": true as const };
  }, [title, namedByConsumer, hiddenByConsumer]);

  // Every hook has run by this point, so throwing here is safe for an error
  // boundary and cannot desynchronize the hook order.
  if (qr.error) {
    if (throwOnError) throw qr.error;
    return null;
  }

  if (render === "canvas") {
    return (
      <canvas
        ref={qr.canvasRef}
        className={className}
        // The JSX prop is the single owner of the CSS size; the draw effect
        // only sizes the backing store, so `style={{ width: "100%" }}` sticks.
        style={{ width: size, height: size, ...style }}
        {...accessibility}
        {...rest}
      />
    );
  }

  const svgProps = qr.svgProps;
  if (!svgProps) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={svgProps.viewBox}
      width={size}
      height={size}
      shapeRendering={svgProps.shapeRendering}
      className={className}
      style={style}
      {...accessibility}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {svgProps.defs.length > 0 ? (
        <defs>
          {svgProps.defs.map(({ id, gradient, bounds }) => {
            const stops = gradient.stops.map((stop, index) => (
              <stop key={index} offset={stop.offset} stopColor={stop.color} />
            ));
            if (gradient.type === "radial") {
              const { cx, cy, r } = radialGeometry(bounds);
              return (
                <radialGradient key={id} id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
                  {stops}
                </radialGradient>
              );
            }
            const { x1, y1, x2, y2 } = linearEndpoints(bounds, gradient.rotation ?? 0);
            return (
              <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
                {stops}
              </linearGradient>
            );
          })}
        </defs>
      ) : null}
      {svgProps.background ? (
        <rect width={svgProps.side} height={svgProps.side} fill={svgProps.background} />
      ) : null}
      {svgProps.paths.map((path, index) => (
        <path key={index} d={path.d} fill={path.fill} />
      ))}
      {svgProps.image ? (
        <>
          {svgProps.image.clipCircle ? (
            // The id is derived from the logo's own geometry (see render/ids.ts),
            // so two codes on one page can never clip each other's logo.
            <clipPath id={svgProps.image.clipId}>
              <circle
                cx={svgProps.image.x + svgProps.image.width / 2}
                cy={svgProps.image.y + svgProps.image.height / 2}
                r={svgProps.image.width / 2}
              />
            </clipPath>
          ) : null}
          <image
            href={svgProps.image.href}
            x={svgProps.image.x}
            y={svgProps.image.y}
            width={svgProps.image.width}
            height={svgProps.image.height}
            preserveAspectRatio="xMidYMid meet"
            crossOrigin={svgProps.image.crossOrigin}
            clipPath={svgProps.image.clipCircle ? `url(#${svgProps.image.clipId})` : undefined}
          />
        </>
      ) : null}
    </svg>
  );
}

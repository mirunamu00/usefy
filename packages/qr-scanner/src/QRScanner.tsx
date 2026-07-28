"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useEventListener } from "@usefy/use-event-listener";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { Viewfinder } from "./Viewfinder";
import { useQRScanner, type UseQRScannerOptions, type QRScannerState } from "./useQRScanner";
import type { ElementGeometry } from "./utils";
import type { QRScanResult } from "./types";

/**
 * A camera scanner you can drop in.
 *
 * The component's job is everything around the decoder: the permission states,
 * the controls, the overlay that has to land *on* the code rather than near it,
 * and the file fallback for the many situations where a camera is not an
 * option — a desktop without a webcam, a denied permission, a screenshot the
 * user already has.
 *
 * It deliberately never *acts* on what it reads. A QR payload is untrusted
 * input; navigating to it, copying it or fetching it is the consumer's
 * decision, made with their own knowledge of what a valid value looks like.
 */

export interface QRScannerController {
  start(): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  scanFile(file: Blob): Promise<QRScanResult[]>;
  capture(): Promise<ImageData | null>;
}

export interface QRScannerProps
  extends UseQRScannerOptions,
    Omit<React.HTMLAttributes<HTMLDivElement>, "onError" | "children"> {
  onScan?: (result: QRScanResult, all: readonly QRScanResult[]) => void;
  /** Accent for the viewfinder and the highlight. @default "#22d3ee" */
  accent?: string;
  /** Show the torch button when the camera supports one. @default true */
  showTorch?: boolean;
  /** Show the camera-switch button when more than one exists. @default true */
  showSwitch?: boolean;
  /**
   * Offer "scan an image instead" when the camera is unavailable or denied.
   * @default true
   */
  showFileFallback?: boolean;
  /** Skip the camera entirely: file, drop and paste only. */
  source?: "camera" | "file";
  controllerRef?: React.Ref<QRScannerController>;
  /** Rendered inside the viewfinder, above the video. */
  children?: React.ReactNode;
}

const MESSAGES: Record<QRScannerState, string> = {
  idle: "Camera is off.",
  prompting: "Waiting for camera permission…",
  scanning: "Point the camera at a QR code.",
  paused: "Paused.",
  denied: "Camera access was denied. Allow it in your browser settings, or scan an image instead.",
  unsupported:
    "This browser cannot open a camera here. It needs a secure connection (HTTPS) — you can still scan an image.",
  error: "The camera could not be started.",
};

/** States where the camera will not produce frames and a file is the way in. */
const NEEDS_FALLBACK: ReadonlySet<QRScannerState> = new Set(["denied", "unsupported", "error"]);

export function QRScanner(props: QRScannerProps): React.ReactNode {
  const {
    onScan,
    onFrame,
    onError,
    accent = "#22d3ee",
    showTorch = true,
    showSwitch = true,
    showFileFallback = true,
    source = "camera",
    controllerRef,
    children,
    className,
    style,
    autoStart,
    paused,
    defaultPaused,
    onPausedChange,
    facingMode,
    deviceId,
    constraints,
    scanRate,
    dedupeMs,
    stopOnHide,
    decoder,
    engine,
    maxSymbols,
    maxDimension,
    binarizer,
    invert,
    region,
    sampling,
    binary,
    ...rest
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [geometry, setGeometry] = useState<ElementGeometry | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const scanner = useQRScanner({
    onScan: (result, all) => {
      // Short values are read out; a 200-character URL is not. Announcing the
      // payload verbatim is hostile to a screen-reader user, and saying nothing
      // leaves them with no feedback at all.
      //
      // The message is cleared first so that scanning the same value twice
      // re-announces: a live region only speaks when its text *changes*, and
      // identical text is silence — which reads as "it didn't work".
      const message =
        result.text.length <= 40 ? `Scanned: ${result.text}` : "QR code detected.";
      setAnnouncement("");
      requestAnimationFrame(() => setAnnouncement(message));
      onScan?.(result, all);
    },
    onFrame,
    onError,
    autoStart: source === "camera" ? autoStart : false,
    paused,
    defaultPaused,
    onPausedChange,
    facingMode,
    deviceId,
    constraints,
    scanRate,
    dedupeMs,
    stopOnHide,
    decoder,
    engine,
    maxSymbols,
    maxDimension,
    binarizer,
    invert,
    region,
    sampling,
    binary,
  });

  /* ── The file path: picker, drop, paste, and the controller ── */

  const scanBlob = useCallback(
    async (blob: Blob | null | undefined) => {
      if (!blob) return [];
      const found = await scanner.scanFile(blob);
      // Announced here rather than in the hook, so the picker, a drop, a paste
      // and `controller.scanFile()` all behave identically — a consumer driving
      // the component from their own button should not get a quieter result
      // than one who used ours.
      if (found.length === 0) setAnnouncement("No QR code found in that image.");
      return found;
    },
    [scanner],
  );

  useImperativeHandle(
    controllerRef,
    () => ({
      start: scanner.start,
      stop: scanner.stop,
      pause: scanner.pause,
      resume: scanner.resume,
      scanFile: scanBlob,
      capture: scanner.capture,
    }),
    [scanner.start, scanner.stop, scanner.pause, scanner.resume, scanBlob, scanner.capture],
  );

  /* ── Geometry: how the video's pixels sit inside the element ── */

  const measure = useCallback(() => {
    const container = containerRef.current;
    const video = scanner.videoRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setGeometry({
      sourceWidth: video?.videoWidth ?? 0,
      sourceHeight: video?.videoHeight ?? 0,
      elementWidth: rect.width,
      elementHeight: rect.height,
      objectFit: "cover",
      // A front camera is displayed mirrored (that is what users expect of a
      // selfie view), and the overlay has to be mirrored with it or the
      // highlight lands on the wrong side of the frame.
      mirrored: facingMode === "user",
    });
  }, [facingMode, scanner.videoRef]);

  useIsomorphicLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [measure]);

  // `videoWidth` is 0 until the first frame arrives, so the geometry is
  // remeasured when the stream announces its real size.
  useEventListener("loadedmetadata", measure, scanner.videoRef);
  useEventListener("resize", measure, scanner.videoRef);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      void scanBlob(event.dataTransfer.files?.[0]);
    },
    [scanBlob],
  );

  // Paste is a document-level event, so this listener is scoped to the states
  // where the scanner is actually asking for an image. Attaching it while a
  // camera is running — or while the scanner is off-screen — would hijack every
  // image paste on the host page, which is not this component's to take.
  const wantsPaste = source === "file" || NEEDS_FALLBACK.has(scanner.state);
  useEffect(() => {
    if (!wantsPaste) return;

    const handler = (event: ClipboardEvent): void => {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) =>
        entry.type.startsWith("image/"),
      );
      if (item) void scanBlob(item.getAsFile());
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, [scanBlob, wantsPaste]);

  const state = source === "file" ? "idle" : scanner.state;
  const showFileButton = showFileFallback && (source === "file" || NEEDS_FALLBACK.has(state));
  const isLive = state === "scanning";
  // Without a camera there is no video to look at, so the surface has to say
  // what it wants instead of presenting an empty black rectangle. This covers
  // `source="file"` and every state where the camera will not produce frames.
  const showDropTarget = source === "file" || NEEDS_FALLBACK.has(state);

  return (
    <div
      ref={containerRef}
      className={className}
      onDrop={onDrop}
      onDragOver={(event) => event.preventDefault()}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        background: "#0b0f14",
        // A camera preview is portrait because phones are; a drop target has no
        // reason to be, and a 3:4 empty rectangle just looks broken.
        aspectRatio: source === "file" ? "4 / 3" : "3 / 4",
        width: "100%",
        color: "#e6edf3",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        ...style,
      }}
      {...rest}
    >
      {source === "camera" && (
        <video
          ref={scanner.videoRef}
          playsInline
          muted
          aria-label="Camera preview"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transform: facingMode === "user" ? "scaleX(-1)" : undefined,
          }}
        />
      )}

      {source === "camera" && !showDropTarget && (
        <Viewfinder result={scanner.result} geometry={geometry} accent={accent} active={isLive} />
      )}

      {/* One flex column owns the surface below the video, so the drop target
          takes exactly the space the status line does not — rather than
          guessing at its height with a fixed offset and overlapping it the
          moment the message wraps to another line. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          pointerEvents: "none",
        }}
      >
        {showDropTarget && (
          <div
            style={{
              flex: 1,
              margin: 16,
              marginBottom: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: 24,
              textAlign: "center",
              // `color-mix` rather than an alpha suffix: `accent` is documented
              // as any CSS colour, and `var(--accent)66` is not a colour at all
              // — it is an invalid shorthand that drops the border entirely.
              // That is exactly what the web demo passes.
              border: `2px dashed color-mix(in srgb, ${accent} 40%, transparent)`,
              borderRadius: 14,
            }}
          >
          <svg
            aria-hidden="true"
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke={accent}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14h1" />
          </svg>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, maxWidth: 260 }}>
              Drop an image here, paste one, or choose a file.
            </p>
          </div>
        )}

        {/* Status line. Always rendered so the layout does not jump when it changes. */}
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            // The column above is click-through so the video and the drop zone
            // keep their own hit areas; the controls opt back in.
            pointerEvents: "auto",
            background: "linear-gradient(to top, rgba(0,0,0,0.72), transparent)",
          }}
        >
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, flex: 1 }}>
          {/* The drop target already says what to do, so the status line does
              not repeat it — it carries the reason the camera is unavailable,
              which is the part the drop target cannot explain. */}
          {source === "file" ? "" : MESSAGES[state]}
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          {showTorch && scanner.isTorchSupported && (
            <ControlButton
              accent={accent}
              pressed={scanner.torch}
              label={scanner.torch ? "Turn the torch off" : "Turn the torch on"}
              onClick={() => void scanner.setTorch(!scanner.torch)}
            >
              {scanner.torch ? "Torch on" : "Torch"}
            </ControlButton>
          )}

          {showSwitch && scanner.devices.length > 1 && (
            <ControlButton
              accent={accent}
              label="Switch camera"
              onClick={() => void scanner.switchCamera()}
            >
              Switch
            </ControlButton>
          )}

          {showFileButton && (
            <ControlButton
              accent={accent}
              label="Scan an image file instead"
              onClick={() => inputRef.current?.click()}
            >
              Scan an image
            </ControlButton>
          )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        // Reached through the visible button, never directly: a visually-hidden
        // input left in the tab order is an invisible stop that keyboard users
        // land on with nothing to see.
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          void scanBlob(event.target.files?.[0]);
          // Reset so choosing the same file twice fires again.
          event.target.value = "";
        }}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />

      {/* Results are announced politely: a scanner that interrupted whatever the
          user was reading on every frame would be unusable with a screen reader. */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {announcement}
      </div>

      {children}
    </div>
  );
}

interface ControlButtonProps {
  accent: string;
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

/**
 * A real `<button>` — reachable by keyboard, with a visible focus ring in both
 * themes and a `title`/`aria-label` that says what it does rather than what it
 * looks like.
 */
function ControlButton({
  accent,
  label,
  pressed,
  onClick,
  children,
}: ControlButtonProps): React.ReactNode {
  const [focused, setFocused] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        appearance: "none",
        border: `1px solid ${pressed ? accent : "rgba(255,255,255,0.28)"}`,
        background: pressed ? accent : "rgba(255,255,255,0.10)",
        color: pressed ? "#0b0f14" : "#e6edf3",
        borderRadius: 999,
        padding: "7px 13px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        lineHeight: 1.2,
        outline: focused ? `2px solid ${accent}` : "none",
        outlineOffset: 2,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { encodeQR, toSVG } from "@usefy/qr-code";
import { QRScanner, decodeImageData, type QRScanResult } from "@usefy/qr-scanner";
import { DemoButton, DemoShell } from "./demo-shell";
import { cn } from "@/lib/cn";

/**
 * The scanner's live demo.
 *
 * **It leads with generate-then-scan, not with the camera.** Most visitors to a
 * product page are on a desktop, and a demo whose first move is a permission
 * prompt followed by a black rectangle is a worse storefront than no demo at
 * all (SPEC decision #13). The camera is offered as an upgrade, on a button,
 * for the people who have one.
 */

type Degradation = "none" | "rotate" | "angle" | "blur" | "shadow" | "inverted";

const DEGRADATIONS: Array<{ id: Degradation; label: string }> = [
  { id: "none", label: "Clean" },
  { id: "rotate", label: "Rotated" },
  { id: "angle", label: "At an angle" },
  { id: "blur", label: "Blurred" },
  { id: "shadow", label: "Shadowed" },
  { id: "inverted", label: "Inverted" },
];

const VALUE = "https://usefy.dev/packages/qr-scanner";
const CANVAS = 260;

export function QRScannerDemo() {
  const [degradation, setDegradation] = useState<Degradation>("none");
  const [result, setResult] = useState<QRScanResult | null>(null);
  const [missed, setMissed] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // The symbol comes from this project's own encoder, so the demo never ships a
  // picture of a QR code — it ships the code.
  useEffect(() => {
    const svg = toSVG(encodeQR(VALUE, { level: "Q" }), { margin: 2 });
    const element = new Image();
    element.onload = () => setImage(element);
    element.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !image) return;

    canvas.width = CANVAS;
    canvas.height = CANVAS;
    context.fillStyle = degradation === "inverted" ? "#111827" : "#ffffff";
    context.fillRect(0, 0, CANVAS, CANVAS);

    context.save();
    if (degradation === "rotate") {
      context.translate(CANVAS / 2, CANVAS / 2);
      context.rotate((34 * Math.PI) / 180);
      context.scale(0.74, 0.74);
      context.translate(-CANVAS / 2, -CANVAS / 2);
    } else if (degradation === "angle") {
      context.translate(CANVAS / 2, CANVAS / 2);
      context.transform(0.78, 0.12, -0.1, 0.94, 0, 0);
      context.translate(-CANVAS / 2, -CANVAS / 2);
    }
    if (degradation === "blur") context.filter = "blur(2px)";
    if (degradation === "inverted") context.filter = "invert(1)";

    const inset = 22;
    context.drawImage(image, inset, inset, CANVAS - inset * 2, CANVAS - inset * 2);
    context.restore();

    if (degradation === "shadow") {
      context.fillStyle = "rgba(0, 0, 0, 0.6)";
      context.fillRect(0, 0, CANVAS * 0.5, CANVAS);
    }
  }, [image, degradation]);

  useEffect(() => {
    draw();
    setResult(null);
    setMissed(false);
  }, [draw]);

  const scan = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const found = decodeImageData(context.getImageData(0, 0, CANVAS, CANVAS));
    setResult(found[0] ?? null);
    setMissed(found.length === 0);
  }, []);

  return (
    <DemoShell hint="Decoded in your browser — no camera needed, and nothing leaves the page.">
      {cameraOn ? (
        <div className="space-y-4">
          <QRScanner
            onScan={setResult}
            accent="var(--accent, var(--brand))"
            style={{ maxWidth: 300, margin: "0 auto" }}
          />
          <div className="flex justify-center">
            <DemoButton onClick={() => setCameraOn(false)}>Back to the image</DemoButton>
          </div>
          <Readout result={result} missed={false} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {DEGRADATIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDegradation(option.id)}
                aria-pressed={option.id === degradation}
                className={cn(
                  "focusable rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  option.id === degradation
                    ? "border-transparent text-[var(--bg)]"
                    : "border-border text-fg-muted hover:border-border-strong",
                )}
                style={
                  option.id === degradation
                    ? { background: "var(--accent, var(--brand))" }
                    : undefined
                }
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={CANVAS}
              height={CANVAS}
              className="rounded-xl border border-border"
              style={{ width: CANVAS, height: CANVAS }}
              aria-label="A QR code, optionally degraded"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <DemoButton onClick={scan} primary>
              Scan this image
            </DemoButton>
            <DemoButton onClick={() => setCameraOn(true)}>Use my camera</DemoButton>
          </div>

          <Readout result={result} missed={missed} />
        </div>
      )}
    </DemoShell>
  );
}

function Readout({ result, missed }: { result: QRScanResult | null; missed: boolean }) {
  if (missed && !result) {
    return (
      <p className="rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm text-fg-muted">
        No code found — the decoder refuses rather than guessing.
      </p>
    );
  }

  if (!result) {
    return (
      <p className="rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm text-fg-subtle">
        Press scan to decode the image above.
      </p>
    );
  }

  const symbol = result.symbol;
  return (
    <div className="rounded-lg border border-border bg-surface/60 px-4 py-3">
      <p className="m-0 break-all font-mono text-sm text-fg">{result.text}</p>
      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-fg-subtle">
        <span>
          <dt className="inline">engine</dt> <dd className="inline text-fg-muted">{result.engine}</dd>
        </span>
        {symbol && (
          <>
            <span>
              <dt className="inline">version</dt>{" "}
              <dd className="inline text-fg-muted">{symbol.version}</dd>
            </span>
            <span>
              <dt className="inline">level</dt>{" "}
              <dd className="inline text-fg-muted">{symbol.level}</dd>
            </span>
            <span>
              <dt className="inline">mask</dt> <dd className="inline text-fg-muted">{symbol.mask}</dd>
            </span>
            <span>
              <dt className="inline">repaired</dt>{" "}
              <dd className="inline text-fg-muted">{symbol.errorsCorrected}</dd>
            </span>
            {symbol.inverted && <span className="text-fg-muted">inverted</span>}
            {symbol.mirrored && <span className="text-fg-muted">mirrored</span>}
          </>
        )}
      </dl>
    </div>
  );
}

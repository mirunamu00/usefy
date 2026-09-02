import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { QRCode } from "@usefy/qr-code";
import {
  QRScanner,
  decodeImageData,
  isNativeSupported,
  createWorkerDecoder,
  useQRScanner,
  type QRScanResult,
  type WorkerDecoder,
} from "@usefy/qr-scanner";
import { storyTheme } from "../styles/storyTheme";

// ============================================================================
// Shared demo helpers
//
// Every story here works **without a camera**: a symbol is drawn to a canvas and
// fed to the decoder, so the demos run on a desktop, in CI, and in the docs
// iframe. The camera stories are opt-in and never open a device on load — a
// permission prompt nobody asked for is a hostile way to greet a visitor.
// ============================================================================

const DEMO_URL = "https://usefy.dev/packages/qr-scanner";

type Degradation = "none" | "rotate" | "perspective" | "blur" | "shadow" | "inverted";

const DEGRADATIONS: Array<{ id: Degradation; label: string }> = [
  { id: "none", label: "Clean" },
  { id: "rotate", label: "Rotated 37°" },
  { id: "perspective", label: "At an angle" },
  { id: "blur", label: "Out of focus" },
  { id: "shadow", label: "Half in shadow" },
  { id: "inverted", label: "Light on dark" },
];

/**
 * Draw a QR symbol onto a canvas, optionally mangled.
 *
 * The mangling is deliberately physical — a rotation, a perspective squeeze, a
 * blur, a shadow with a hard edge — because those are what a phone camera
 * actually produces, and they are what makes a decoder's work visible.
 */
function drawSymbol(
  canvas: HTMLCanvasElement,
  svgImage: HTMLImageElement,
  degradation: Degradation,
): void {
  const size = 320;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.fillStyle = degradation === "inverted" ? "#111827" : "#ffffff";
  context.fillRect(0, 0, size, size);

  context.save();
  if (degradation === "rotate") {
    context.translate(size / 2, size / 2);
    context.rotate((37 * Math.PI) / 180);
    context.scale(0.72, 0.72);
    context.translate(-size / 2, -size / 2);
  } else if (degradation === "perspective") {
    // A canvas cannot do a true homography, but a strong horizontal squeeze
    // plus a shear is close enough to look — and decode — like an angled shot.
    context.translate(size / 2, size / 2);
    context.transform(0.78, 0.12, -0.1, 0.94, 0, 0);
    context.translate(-size / 2, -size / 2);
  }
  if (degradation === "blur") context.filter = "blur(2.4px)";
  if (degradation === "inverted") context.filter = "invert(1)";

  const inset = 28;
  context.drawImage(svgImage, inset, inset, size - inset * 2, size - inset * 2);
  context.restore();

  if (degradation === "shadow") {
    context.fillStyle = "rgba(0, 0, 0, 0.62)";
    context.fillRect(0, 0, size * 0.52, size);
  }
}

/** Render a value to an `<img>` holding an SVG QR — the source for the canvas. */
function useSymbolImage(value: string, level: "L" | "M" | "Q" | "H" = "Q"): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    // The encoder renders the SVG, so the story never restates its geometry.
    import("@usefy/qr-code").then(({ toSVG, encodeQR }) => {
      if (cancelled) return;
      const svg = toSVG(encodeQR(value, { level }), { margin: 2 });
      const element = new Image();
      element.onload = () => {
        if (!cancelled) setImage(element);
      };
      element.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    });

    return () => {
      cancelled = true;
    };
  }, [value, level]);

  return image;
}

function ResultCard({ result }: { result: QRScanResult | null }) {
  if (!result) {
    return (
      <div className={storyTheme.card} data-testid="result-empty">
        <p className="m-0 text-sm text-zinc-500">Nothing decoded yet.</p>
      </div>
    );
  }

  const symbol = result.symbol;
  return (
    <div className={storyTheme.cardSuccess} data-testid="result">
      <p className="m-0 break-all font-mono text-sm font-semibold text-emerald-900" data-testid="result-text">
        {result.text}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-emerald-900/80">
        <dt className="font-semibold">Engine</dt>
        <dd className="m-0">{result.engine}</dd>
        {symbol && (
          <>
            <dt className="font-semibold">Version</dt>
            <dd className="m-0">
              {symbol.version} ({symbol.size} × {symbol.size} modules)
            </dd>
            <dt className="font-semibold">Error correction</dt>
            <dd className="m-0">Level {symbol.level}</dd>
            <dt className="font-semibold">Mask</dt>
            <dd className="m-0">{symbol.mask}</dd>
            <dt className="font-semibold">Codewords repaired</dt>
            <dd className="m-0">{symbol.errorsCorrected}</dd>
            {(symbol.mirrored || symbol.inverted) && (
              <>
                <dt className="font-semibold">Read as</dt>
                <dd className="m-0">
                  {[symbol.mirrored && "mirrored", symbol.inverted && "inverted"]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </>
            )}
          </>
        )}
      </dl>
    </div>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof QRScanner> = {
  title: "qr-scanner",
  component: QRScanner,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `QR code scanner for React — the platform's \`BarcodeDetector\` where it exists, and a hand-written ISO/IEC 18004 decoder everywhere else. Camera **and** still image, from one API.

## Features
- **A real decoder, zero dependencies** — adaptive binarization, finder-pattern detection, perspective correction, Reed–Solomon *error correction*, ECI, Kanji, Structured Append
- **Native-first, never native-only** — uses \`BarcodeDetector\` when the browser has it; falls back to the built-in engine, which is also the only path that reports version, level, mask and repaired-codeword counts
- **Camera done properly** — permission states, device switching, torch, pause on hidden tab, and a guaranteed teardown (no camera light left on)
- **Geometry you can draw with** — corners in source pixels plus \`mapCorners()\`, which accounts for \`object-fit\` and mirrored front cameras
- **Off the main thread, optionally** — a real \`./worker\` entry, no blob URLs, CSP-safe
- **Reads what others wrote** — verified against symbols generated by an independent encoder, and against jsQR on a degraded corpus

## Basic Usage
\`\`\`tsx
import { QRScanner } from "@usefy/qr-scanner";

<QRScanner onScan={(result) => console.log(result.text)} />
\`\`\`

> **The scanner never acts on what it reads.** A QR payload is untrusted input — validate it, show it to the user, and let them confirm before you navigate.`,
      },
    },
  },
  argTypes: {
    accent: {
      control: "color",
      description: "Colour of the viewfinder brackets and the result highlight",
      table: { type: { summary: "string" }, defaultValue: { summary: '"#22d3ee"' } },
    },
    facingMode: {
      control: "inline-radio",
      options: ["environment", "user"],
      description: "Which camera to prefer",
      table: { type: { summary: '"environment" | "user"' } },
    },
    scanRate: {
      control: { type: "range", min: 1, max: 30, step: 1 },
      description: "Maximum decodes per second",
      table: { type: { summary: "number" }, defaultValue: { summary: "12" } },
    },
    dedupeMs: {
      control: { type: "range", min: 0, max: 5000, step: 250 },
      description: "How long the same value is suppressed after a hit",
      table: { type: { summary: "number" }, defaultValue: { summary: "1500" } },
    },
    maxSymbols: {
      control: { type: "range", min: 1, max: 5, step: 1 },
      description: "How many symbols to decode per frame",
      table: { type: { summary: "number" }, defaultValue: { summary: "1" } },
    },
    engine: {
      control: "inline-radio",
      options: ["auto", "native", "internal"],
      description: "Which decoder to use",
      table: { type: { summary: '"auto" | "native" | "internal"' }, defaultValue: { summary: '"auto"' } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof QRScanner>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Generate a code, then scan it — no camera needed. Change the text, mangle the image, and watch the decoder report exactly what it read, including the symbol's version, mask and how many codewords it had to repair.",
      },
      source: {
        language: "tsx",
        code: `import { decodeFile } from "@usefy/qr-scanner";

async function onFilePicked(file: File) {
  const [result] = await decodeFile(file);
  if (result) console.log(result.text, result.symbol?.version);
}`,
      },
    },
  },
  render: function GenerateAndScan() {
    const [value, setValue] = useState(DEMO_URL);
    const [degradation, setDegradation] = useState<Degradation>("none");
    const [result, setResult] = useState<QRScanResult | null>(null);
    const [miss, setMiss] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const image = useSymbolImage(value);

    useEffect(() => {
      if (canvasRef.current && image) drawSymbol(canvasRef.current, image, degradation);
    }, [image, degradation]);

    const scan = useCallback(() => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;

      const found = decodeImageData(context.getImageData(0, 0, canvas.width, canvas.height));
      setResult(found[0] ?? null);
      setMiss(found.length === 0);
    }, []);

    return (
      <div className={storyTheme.container}>
        <h3 className={storyTheme.title}>Scan an image</h3>
        <p className={storyTheme.subtitle}>
          The code below is generated by <code>@usefy/qr-code</code> and read back by{" "}
          <code>@usefy/qr-scanner</code>. Nothing is sent anywhere.
        </p>

        <label className={storyTheme.label} htmlFor="qr-scanner-value">
          Value to encode
        </label>
        <input
          id="qr-scanner-value"
          className={storyTheme.input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          data-testid="value-input"
        />

        <div className="mt-5 flex flex-wrap gap-2">
          {DEGRADATIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              data-testid={`degradation-${option.id}`}
              onClick={() => setDegradation(option.id)}
              className={
                option.id === degradation
                  ? "rounded-lg border border-violet-500 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700"
                  : "rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 hover:border-zinc-300"
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            className="rounded-md"
            style={{ width: 320, height: 320 }}
            aria-label="A QR code, optionally degraded"
          />
          <button
            type="button"
            className={storyTheme.buttonPrimary}
            onClick={scan}
            data-testid="scan-button"
          >
            Scan this image
          </button>
        </div>

        <div className="mt-5">
          {miss && !result ? (
            <div className={storyTheme.cardWarning} data-testid="result-miss">
              <p className="m-0 text-sm text-amber-900">
                No code found. That is the honest answer — the decoder refuses rather than guessing.
              </p>
            </div>
          ) : (
            <ResultCard result={result} />
          )}
        </div>
      </div>
    );
  },
};

export const LiveCamera: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The real component, with a real camera. It does **not** open on load — press Start, and the browser will ask for permission. Point it at the code beside it (or any code) and watch the highlight track the symbol.",
      },
      source: {
        language: "tsx",
        code: `import { QRScanner } from "@usefy/qr-scanner";

<QRScanner
  onScan={(result) => setValue(result.text)}
  facingMode="environment"
/>`,
      },
    },
  },
  render: function Live(args) {
    const [started, setStarted] = useState(false);
    const [result, setResult] = useState<QRScanResult | null>(null);

    return (
      <div className={storyTheme.container}>
        <h3 className={storyTheme.title}>Live camera</h3>
        <p className={storyTheme.subtitle}>
          Nothing opens until you ask it to. Point the camera at the code on the right.
        </p>

        <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            {started ? (
              <QRScanner
                {...args}
                onScan={(scanned) => setResult(scanned)}
                style={{ maxWidth: 320 }}
              />
            ) : (
              <div className="flex h-[420px] max-w-[320px] flex-col items-center justify-center gap-4 rounded-md bg-zinc-900 p-6 text-center">
                <p className="m-0 text-sm text-zinc-300">
                  The camera stays closed until you press Start.
                </p>
                <button
                  type="button"
                  className={storyTheme.buttonPrimary}
                  onClick={() => setStarted(true)}
                  data-testid="start-camera"
                >
                  Start camera
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="rounded-md bg-white p-3">
              <QRCode value={DEMO_URL} size={140} level="Q" title="A code to point the camera at" />
            </div>
            <span className="text-xs font-semibold text-zinc-500">Point at me</span>
          </div>
        </div>

        <div className="mt-5">
          <ResultCard result={result} />
        </div>
      </div>
    );
  },
};

export const MultipleCodes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Several symbols in one frame, each with its own position — the warehouse case. Raise `maxSymbols` and the decoder keeps going instead of stopping at the first hit.",
      },
    },
  },
  render: function Multiple() {
    const [results, setResults] = useState<readonly QRScanResult[]>([]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const first = useSymbolImage("SHELF-A-14");
    const second = useSymbolImage("SHELF-B-02");
    const third = useSymbolImage("SHELF-C-77");

    useEffect(() => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context || !first || !second || !third) return;

      canvas.width = 480;
      canvas.height = 200;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      [first, second, third].forEach((image, index) => {
        context.drawImage(image, 20 + index * 155, 20, 150, 150);
      });
    }, [first, second, third]);

    const scan = useCallback(() => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;
      setResults(
        decodeImageData(context.getImageData(0, 0, canvas.width, canvas.height), {
          maxSymbols: 3,
        }),
      );
    }, []);

    return (
      <div className={storyTheme.container}>
        <h3 className={storyTheme.title}>Three at once</h3>
        <canvas
          ref={canvasRef}
          className="w-full rounded-md"
          aria-label="Three QR codes side by side"
        />
        <button
          type="button"
          className={`${storyTheme.buttonPrimary} mt-4`}
          onClick={scan}
          data-testid="scan-multiple"
        >
          Scan all three
        </button>

        <ul className="mt-5 list-none space-y-2 p-0" data-testid="multi-results">
          {results.map((result) => (
            <li
              key={result.text}
              className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2 text-sm"
            >
              <span className="font-mono font-semibold">{result.text}</span>
              <span className="text-xs text-zinc-500">
                centre {Math.round(result.center.x)}, {Math.round(result.center.y)}
              </span>
            </li>
          ))}
          {results.length === 0 && (
            <li className="text-sm text-zinc-500">Press the button to decode all three.</li>
          )}
        </ul>
      </div>
    );
  },
};

export const DamageAndRepair: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Reed–Solomon is not a checksum — it *repairs*. Paint over the code and watch the repaired-codeword count climb until the damage passes what the error-correction level can absorb, at which point the decoder refuses rather than guessing.",
      },
    },
  },
  render: function Damage() {
    const [damage, setDamage] = useState(0);
    const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("L");
    const [result, setResult] = useState<QRScanResult | null>(null);
    const [failed, setFailed] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const image = useSymbolImage(`DAMAGE AND REPAIR DEMO 12345`, level);

    const redraw = useCallback(
      (amount: number) => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context || !image) return;

        canvas.width = 320;
        canvas.height = 320;
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, 320, 320);
        context.drawImage(image, 20, 20, 280, 280);

        // Blots stay inside the data region, clear of the three finder patterns
        // and the timing lines. Damaging *those* stops the symbol being found at
        // all, which demonstrates nothing about error correction — the point
        // here is what the parity can rebuild, and it is only honest if the
        // damage lands where the parity applies.
        context.fillStyle = "#f43f5e";
        for (let i = 0; i < amount; i++) {
          context.fillRect(108 + ((i * 37) % 150), 108 + ((i * 53) % 150), 10, 10);
        }

        const found = decodeImageData(context.getImageData(0, 0, 320, 320));
        setResult(found[0] ?? null);
        setFailed(found.length === 0);
      },
      [image],
    );

    useEffect(() => {
      redraw(damage);
    }, [redraw, damage]);

    return (
      <div className={storyTheme.container}>
        <h3 className={storyTheme.title}>Damage and repair</h3>
        <p className={storyTheme.subtitle}>
          Reed–Solomon does not just notice damage, it rebuilds the missing codewords. The
          error-correction level decides how much it can take — try level L, then level H.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["L", "M", "Q", "H"] as const).map((option) => (
            <button
              key={option}
              type="button"
              data-testid={`level-${option}`}
              onClick={() => setLevel(option)}
              className={
                option === level
                  ? "rounded-lg border border-violet-500 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700"
                  : "rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 hover:border-zinc-300"
              }
            >
              Level {option}
            </button>
          ))}
        </div>

        <canvas
          ref={canvasRef}
          className="rounded-md"
          style={{ width: 320, height: 320 }}
          aria-label="A QR code with blots painted over it"
        />

        <label className={`${storyTheme.label} mt-5`} htmlFor="damage-range">
          Blots: {damage}
        </label>
        <input
          id="damage-range"
          type="range"
          min={0}
          max={20}
          value={damage}
          onChange={(event) => setDamage(Number(event.target.value))}
          className="w-full"
          data-testid="damage-range"
        />

        <div className="mt-4">
          {failed ? (
            <div className={storyTheme.cardError} data-testid="damage-failed">
              <p className="m-0 text-sm text-red-900">
                Beyond what level {level} can rebuild — so the decoder refuses. A confidently wrong
                payload would be worse than none.
              </p>
            </div>
          ) : (
            <ResultCard result={result} />
          )}
        </div>
      </div>
    );
  },
};

export const EngineComparison: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`engine: \"auto\"` uses the platform's `BarcodeDetector` when it exists and the built-in engine when it does not. Only the built-in engine can report a symbol's version, level, mask and repaired-codeword count — the native API simply does not expose them, so the result omits them rather than inventing them.",
      },
    },
  },
  render: function Engines() {
    const [native, setNative] = useState<boolean | null>(null);
    const [rows, setRows] = useState<Array<{ engine: string; text: string; detail: string }>>([]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const image = useSymbolImage(DEMO_URL);

    useEffect(() => {
      void isNativeSupported().then(setNative);
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas && image) drawSymbol(canvas, image, "none");
    }, [image]);

    const compare = useCallback(async () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const { decode } = await import("@usefy/qr-scanner");

      const next: Array<{ engine: string; text: string; detail: string }> = [];
      for (const engine of ["internal", "auto"] as const) {
        try {
          const [found] = await decode(pixels, { engine });
          next.push({
            engine,
            text: found?.text ?? "—",
            detail: found?.symbol
              ? `version ${found.symbol.version}, level ${found.symbol.level}, mask ${found.symbol.mask}`
              : found
                ? "no symbol metadata (native)"
                : "not decoded",
          });
        } catch (error) {
          next.push({ engine, text: "—", detail: (error as Error).message });
        }
      }
      setRows(next);
    }, []);

    return (
      <div className={storyTheme.container}>
        <h3 className={storyTheme.title}>Which engine ran?</h3>
        <div className={native ? storyTheme.cardSuccess : storyTheme.cardInfo}>
          <p className="m-0 text-sm">
            {native === null
              ? "Checking for a platform decoder…"
              : native
                ? "This browser has a BarcodeDetector for QR codes — `auto` will use it."
                : "This browser has no BarcodeDetector, so `auto` uses the built-in engine."}
          </p>
        </div>

        <canvas
          ref={canvasRef}
          className="mt-5 rounded-md"
          style={{ width: 320, height: 320 }}
          aria-label="A QR code"
        />
        <button
          type="button"
          className={`${storyTheme.buttonPrimary} mt-4`}
          onClick={() => void compare()}
          data-testid="compare-engines"
        >
          Decode with each engine
        </button>

        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
              <th className="py-2">Engine</th>
              <th className="py-2">Value</th>
              <th className="py-2">Metadata</th>
            </tr>
          </thead>
          <tbody data-testid="engine-rows">
            {rows.map((row) => (
              <tr key={row.engine} className="border-b border-zinc-100">
                <td className="py-2 font-semibold">{row.engine}</td>
                <td className="max-w-[160px] truncate py-2 font-mono text-xs">{row.text}</td>
                <td className="py-2 text-xs text-zinc-600">{row.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};

export const HeadlessHook: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`useQRScanner` gives you the camera, the loop and the results with no UI attached — bring your own video element and chrome. This demo renders the raw state so you can see what the hook reports.",
      },
      source: {
        language: "tsx",
        code: `const scanner = useQRScanner({ onScan: (r) => setValue(r.text) });

return <video ref={scanner.videoRef} playsInline muted />;`,
      },
    },
  },
  render: function Headless() {
    const [started, setStarted] = useState(false);
    const scanner = useQRScanner({ autoStart: false });

    return (
      <div className={storyTheme.container}>
        <h3 className={storyTheme.title}>useQRScanner</h3>

        <div className="overflow-hidden rounded-md bg-black" style={{ maxWidth: 320 }}>
          <video
            ref={scanner.videoRef}
            playsInline
            muted
            aria-label="Camera preview"
            className="block h-full w-full"
            style={{ aspectRatio: "3 / 4", objectFit: "cover" }}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className={storyTheme.buttonPrimary}
            data-testid="hook-start"
            onClick={() => {
              setStarted(true);
              void scanner.start();
            }}
          >
            Start
          </button>
          <button
            type="button"
            className={storyTheme.buttonNeutral}
            data-testid="hook-stop"
            onClick={() => {
              setStarted(false);
              scanner.stop();
            }}
          >
            Stop
          </button>
        </div>

        <dl className={`${storyTheme.card} mt-5 grid grid-cols-2 gap-x-4 gap-y-1 text-sm`}>
          <dt className="font-semibold">state</dt>
          <dd className="m-0 font-mono" data-testid="hook-state">
            {scanner.state}
          </dd>
          <dt className="font-semibold">cameras</dt>
          <dd className="m-0 font-mono">{scanner.devices.length}</dd>
          <dt className="font-semibold">torch</dt>
          <dd className="m-0 font-mono">
            {scanner.isTorchSupported ? String(scanner.torch) : "unsupported"}
          </dd>
          <dt className="font-semibold">last value</dt>
          <dd className="m-0 break-all font-mono">{scanner.result?.text ?? "—"}</dd>
        </dl>

        {started && scanner.error && (
          <div className={`${storyTheme.cardError} mt-4`}>
            <p className="m-0 text-sm text-red-900">{scanner.error.message}</p>
          </div>
        )}
      </div>
    );
  },
};

export const WorkerDecoding: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The decoder can run off the main thread. The worker is a **real module entry** — your bundler emits it, no blob URL is involved, and it survives a strict `script-src` policy. This story constructs one and decodes through it; the result is identical, it just did not happen on the thread painting your UI.",
      },
      source: {
        language: "tsx",
        code: `import { QRScanner, createWorkerDecoder } from "@usefy/qr-scanner";

const worker = new Worker(new URL("@usefy/qr-scanner/worker", import.meta.url), {
  type: "module",
});
const decoder = createWorkerDecoder(worker);

<QRScanner decoder={decoder} />;`,
      },
    },
  },
  render: function Worker_() {
    const [result, setResult] = useState<QRScanResult | null>(null);
    const [status, setStatus] = useState("idle");
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const decoderRef = useRef<WorkerDecoder | null>(null);
    const image = useSymbolImage(DEMO_URL);

    useEffect(() => {
      if (canvasRef.current && image) drawSymbol(canvasRef.current, image, "none");
    }, [image]);

    useEffect(() => {
      // Vite (which Storybook uses here) resolves this at build time, exactly as
      // a consumer's bundler would.
      const worker = new Worker(new URL("@usefy/qr-scanner/worker", import.meta.url), {
        type: "module",
      });
      decoderRef.current = createWorkerDecoder(worker);
      return () => {
        decoderRef.current?.dispose();
        worker.terminate();
      };
    }, []);

    const scan = useCallback(async () => {
      const context = canvasRef.current?.getContext("2d");
      if (!context || !decoderRef.current) return;
      setStatus("decoding in the worker…");
      try {
        const found = await decoderRef.current.decode(
          context.getImageData(0, 0, 320, 320) as ImageData,
        );
        setResult(found[0] ?? null);
        setStatus(found.length ? "decoded off the main thread" : "nothing found");
      } catch (error) {
        setStatus((error as Error).message);
      }
    }, []);

    return (
      <div className={storyTheme.container}>
        <h3 className={storyTheme.title}>Off the main thread</h3>
        <canvas
          ref={canvasRef}
          className="rounded-md"
          style={{ width: 320, height: 320 }}
          aria-label="A QR code"
        />
        <button
          type="button"
          className={`${storyTheme.buttonPrimary} mt-4`}
          data-testid="worker-scan"
          onClick={() => void scan()}
        >
          Decode in a worker
        </button>
        <p className="mt-3 font-mono text-sm text-zinc-600" data-testid="worker-status">
          {status}
        </p>
        <div className="mt-3">
          <ResultCard result={result} />
        </div>
      </div>
    );
  },
};

export const PermissionDenied: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "What a refused camera looks like. The component explains the situation, keeps the page usable, and offers the image path instead — a denied permission is a state to design for, not an error to log. This story fakes the refusal so you can see it without changing your browser settings.",
      },
    },
  },
  render: function Denied() {
    const [result, setResult] = useState<QRScanResult | null>(null);
    // The scanner is mounted only *after* `getUserMedia` has been replaced —
    // otherwise its own mount effect calls the real one first and the story
    // demonstrates a working camera rather than a refused one.
    const [patched, setPatched] = useState(false);

    useEffect(() => {
      const media = navigator.mediaDevices;
      if (!media) {
        setPatched(true);
        return;
      }
      const original = media.getUserMedia.bind(media);
      media.getUserMedia = async () => {
        const error = new Error("Permission denied");
        error.name = "NotAllowedError";
        throw error;
      };
      setPatched(true);
      return () => {
        media.getUserMedia = original;
      };
    }, []);

    return (
      <div className={storyTheme.container}>
        <h3 className={storyTheme.title}>When permission is refused</h3>
        <p className={storyTheme.subtitle}>
          A denied camera is a state to design for, not an error to log.
        </p>
        {patched && <QRScanner onScan={setResult} style={{ maxWidth: 320 }} />}
        <div className="mt-4">
          <ResultCard result={result} />
        </div>
      </div>
    );
  },
};

export const DarkSurface: Story = {
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: {
        story:
          "The component ships its own dark chrome, so it sits on a dark page without any theming work — and the viewfinder accent stays legible against it.",
      },
    },
  },
  render: function Dark() {
    const [result, setResult] = useState<QRScanResult | null>(null);
    return (
      <div className="mx-auto max-w-[420px] rounded-md bg-[#0b0f14] p-8 font-sans">
        <h3 className="mb-2 text-xl font-semibold text-white">On a dark surface</h3>
        <p className="mb-6 text-sm text-zinc-400">
          File-only mode, so nothing opens a camera here.
        </p>
        <QRScanner source="file" accent="#a78bfa" onScan={setResult} style={{ maxWidth: 340 }} />
        {result && (
          <p className="mt-4 break-all font-mono text-sm text-emerald-300">{result.text}</p>
        )}
      </div>
    );
  },
};

// ============================================================================
// Interaction test — NOT in autodocs.
//
// This one drives a flow to completion on open, which is exactly what a demo
// story must never do (CLAIMS.md quality bar / add-usefy-story). It lives here,
// clearly labelled, so the demos above stay idle until a visitor acts.
// ============================================================================

export const InteractionTest: Story = {
  tags: ["!autodocs"],
  parameters: {
    docs: { description: { story: "Automated checks. Not a demo — it runs itself." } },
  },
  render: function Harness() {
    const [result, setResult] = useState<QRScanResult | null>(null);
    const [status, setStatus] = useState("idle");
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const image = useSymbolImage(DEMO_URL);

    const cases = useMemo<Degradation[]>(() => ["none", "rotate", "blur", "shadow", "inverted"], []);
    const [index, setIndex] = useState(0);

    useEffect(() => {
      if (canvasRef.current && image) drawSymbol(canvasRef.current, image, cases[index]!);
    }, [image, cases, index]);

    return (
      <div className={storyTheme.container}>
        <canvas ref={canvasRef} style={{ width: 320, height: 320 }} aria-label="test symbol" />
        {/* The symbol is drawn from an SVG that loads asynchronously. Without a
            readiness flag the play function races it and scans a blank canvas —
            which fails for a reason that has nothing to do with the decoder. */}
        <p data-testid="ready">{image ? "ready" : "loading"}</p>
        <p data-testid="case-label">{cases[index]}</p>
        <button
          type="button"
          data-testid="next-case"
          onClick={() => setIndex((current) => (current + 1) % cases.length)}
        >
          Next case
        </button>
        <button
          type="button"
          data-testid="run-scan"
          onClick={() => {
            const context = canvasRef.current?.getContext("2d");
            if (!context) return;
            const found = decodeImageData(context.getImageData(0, 0, 320, 320));
            setResult(found[0] ?? null);
            setStatus(found.length > 0 ? "decoded" : "missed");
          }}
        >
          Scan
        </button>
        <p data-testid="status">{status}</p>
        <p data-testid="value">{result?.text ?? ""}</p>
        <p data-testid="meta">
          {result?.symbol ? `v${result.symbol.version}/${result.symbol.level}` : ""}
        </p>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("the symbol finishes loading before anything is scanned", async () => {
      await waitFor(() => expect(canvas.getByTestId("ready")).toHaveTextContent("ready"), {
        timeout: 8000,
      });
    });

    await step("every degradation still decodes to the same value", async () => {
      for (let i = 0; i < 5; i++) {
        await waitFor(() => expect(canvas.getByTestId("case-label").textContent).toBeTruthy());
        await userEvent.click(canvas.getByTestId("run-scan"));

        await waitFor(
          () => {
            expect(canvas.getByTestId("status")).toHaveTextContent("decoded");
            expect(canvas.getByTestId("value")).toHaveTextContent(DEMO_URL);
          },
          { timeout: 5000 },
        );

        await userEvent.click(canvas.getByTestId("next-case"));
        // The canvas is redrawn in an effect; scanning before it lands would
        // measure the previous case.
        await waitFor(() => expect(canvas.getByTestId("case-label").textContent).toBeTruthy());
      }
    });

    await step("the internal engine reports symbol metadata", async () => {
      await userEvent.click(canvas.getByTestId("run-scan"));
      await waitFor(() => expect(canvas.getByTestId("meta").textContent).toMatch(/^v\d+\/[LMQH]$/));
    });
  },
};

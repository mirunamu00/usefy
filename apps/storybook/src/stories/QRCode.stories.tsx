import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import {
  MAX_SAFE_MODULE_GAP,
  QRCode,
  encodeQR,
  logoSafety,
  toSVGProps,
  useQRCode,
  type ErrorCorrectionLevel,
  type QRCodeController,
  type QREyeShape,
  type QRModuleShape,
} from "@usefy/qr-code";
import { storyTheme } from "../styles/storyTheme";

// ============================================================================
// Shared demo assets
// ============================================================================

/** A self-contained logo so the stories make no network requests. */
const LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<rect width="64" height="64" rx="16" fill="#087f5b"/>' +
    '<text x="32" y="45" font-family="system-ui,sans-serif" font-size="34" font-weight="700" ' +
    'fill="#ffffff" text-anchor="middle">U</text></svg>',
)}`;

const DEMO_URL = "https://usefy.dev/packages/qr-code";

const LEVELS: ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];
const MODULE_SHAPES: QRModuleShape[] = ["square", "rounded", "dot", "classy"];
const EYE_SHAPES: QREyeShape[] = ["square", "rounded", "circle", "leaf"];

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof QRCode> = {
  title: "qr-code",
  component: QRCode,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `QR code generator built on a hand-written ISO/IEC 18004 encoder — Reed–Solomon error correction, optimal mode segmentation, penalty-scored mask selection — with SVG, canvas and PNG output from one geometry pipeline.

## Features
- **A real encoder, zero dependencies** — GF(256) Reed–Solomon, versions 1–40, levels L/M/Q/H, mixed numeric/alphanumeric/byte segmentation, ECI for UTF-8
- **Four outputs, one matrix** — \`toSVG()\`, \`toSVGProps()\`, canvas, and PNG (data URI + \`Blob\`) all derive from the same paths, so they cannot drift
- **Styling in-core** — module shapes, finder-eye shapes, per-eye colours, linear/radial gradients, quiet-zone control
- **Logo embedding that checks itself** — \`logoSafety()\` measures how much the logo occludes against what the error-correction level can recover, and warns in development
- **RSC-ready** — \`@usefy/qr-code/headless\` ships no \`"use client"\` and no React, so a server component can render a QR with zero client JavaScript
- **House-standard robustness** — SSR & StrictMode safe, encoding failures reported not thrown, React 18 + 19

## Basic Usage
\`\`\`tsx
import { QRCode } from "@usefy/qr-code";

<QRCode value="https://usefy.dev" size={200} level="Q" title="Open usefy.dev" />
\`\`\``,
      },
    },
  },
  argTypes: {
    value: {
      control: "text",
      description: "The data to encode",
      table: { type: { summary: "string | Uint8Array" } },
    },
    size: {
      control: { type: "range", min: 80, max: 400, step: 8 },
      description: "Rendered width and height in px",
      table: { type: { summary: "number" }, defaultValue: { summary: "160" } },
    },
    level: {
      control: "inline-radio",
      options: LEVELS,
      description: "Error-correction level — higher recovers more damage but needs a denser symbol",
      table: { type: { summary: '"L" | "M" | "Q" | "H"' }, defaultValue: { summary: '"M"' } },
    },
    margin: {
      control: { type: "range", min: 0, max: 8, step: 1 },
      description: "Quiet zone in modules. The spec minimum is 4",
      table: { type: { summary: "number" }, defaultValue: { summary: "4" } },
    },
    moduleShape: {
      control: "inline-radio",
      options: MODULE_SHAPES,
      description: "Shape of each data module",
      table: { type: { summary: MODULE_SHAPES.join(" | ") }, defaultValue: { summary: '"square"' } },
    },
    eyeShape: {
      control: "inline-radio",
      options: EYE_SHAPES,
      description: "Shape of the three finder patterns",
      table: { type: { summary: EYE_SHAPES.join(" | ") }, defaultValue: { summary: '"square"' } },
    },
    moduleGap: {
      control: { type: "range", min: 0, max: 0.3, step: 0.05 },
      description: "Inset between modules, as a fraction of one module",
      table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
    },
    render: {
      control: "inline-radio",
      options: ["svg", "canvas"],
      description: "Output surface",
      table: { type: { summary: '"svg" | "canvas"' }, defaultValue: { summary: '"svg"' } },
    },
    title: {
      control: "text",
      description: "Accessible name. Without one the code is aria-hidden",
      table: { type: { summary: "string" } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof QRCode>;

// ============================================================================
// Shared bits of demo chrome
// ============================================================================

function Panel({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-xl bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">{children}</div>
      <span className="text-xs font-semibold text-gray-600">{label}</span>
    </div>
  );
}

function Choices<T extends string>({
  options,
  value,
  onChange,
  testId,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  testId: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          data-testid={`${testId}-${option}`}
          onClick={() => onChange(option)}
          className={
            option === value
              ? "rounded-lg border-2 border-indigo-500 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700"
              : "rounded-lg border-2 border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:border-gray-300"
          }
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    value: DEMO_URL,
    size: 200,
    level: "M",
    title: "Open the @usefy/qr-code docs",
  },
  parameters: {
    docs: {
      description: {
        story:
          "The whole component: pass a value, get a scannable code. Use the controls to change the level, quiet zone, shapes and size — every change re-encodes and re-renders live.",
      },
      source: {
        language: "tsx",
        code: `import { QRCode } from "@usefy/qr-code";

function Share() {
  return (
    <QRCode
      value="https://usefy.dev/packages/qr-code"
      size={200}
      level="M"
      title="Open the @usefy/qr-code docs"
    />
  );
}`,
      },
    },
  },
  render: (args) => (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>QR Code</h2>
      <p className={storyTheme.subtitle}>Point a phone camera at it — it really scans.</p>
      <div className="flex justify-center">
        <QRCode {...args} />
      </div>
      <p className="mt-4 break-all text-xs text-gray-500">{String(args.value)}</p>
    </div>
  ),
};

function ErrorCorrectionDemo() {
  const [value, setValue] = useState(DEMO_URL);
  const payload = value || " ";

  // Encoding is attempted here only to label each panel with its version, so
  // it is guarded: a visitor pasting more than a QR can hold must get the
  // package's reported-not-thrown behaviour, not a broken story.
  let versions: number[] | null = null;
  let failure: Error | null = null;
  try {
    versions = LEVELS.map((level) => encodeQR(payload, { level }).version);
  } catch (error) {
    failure = error as Error;
  }

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Error correction</h2>
      <p className={storyTheme.subtitle}>
        Higher levels survive more damage — and need a bigger symbol to carry the same data.
      </p>

      <label className={storyTheme.label} htmlFor="ec-value">
        Value
      </label>
      <input
        id="ec-value"
        data-testid="ec-value"
        className={storyTheme.input}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />

      {failure ? (
        <div className={`${storyTheme.cardError} mt-6`} data-testid="ec-error">
          <p className="m-0 text-sm font-semibold">Too much data for a QR code</p>
          <p className="m-0 mt-1 text-sm">{failure.message}</p>
          <p className="m-0 mt-2 text-xs">
            The package reports this instead of throwing, so the page around it keeps working —
            shorten the text to bring the codes back.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {LEVELS.map((level, index) => (
            <Panel key={level} label={`${level} — version ${versions![index]}`}>
              <QRCode value={payload} level={level} size={120} />
            </Panel>
          ))}
        </div>
      )}

      <div className={`${storyTheme.infoBox} mt-6`}>
        <p className={storyTheme.infoText}>
          L recovers ~7% of the symbol, M ~15%, Q ~25%, H ~30%. Pick H when you plan to put a logo
          on top; pick L when the code must stay small.
        </p>
      </div>
    </div>
  );
}

export const ErrorCorrection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The same value at all four error-correction levels, with the symbol version each one needs. Edit the text to watch the versions grow together.",
      },
      source: {
        language: "tsx",
        code: `import { QRCode, useQRCode } from "@usefy/qr-code";

function Levels({ value }: { value: string }) {
  // useQRCode reports an over-capacity value instead of throwing, so a long
  // paste can never take the surrounding page down.
  const { matrix, error } = useQRCode({ value, level: "H" });
  if (error) return <p role="status">Too much data for a QR code.</p>;

  return (
    <>
      {(["L", "M", "Q", "H"] as const).map((level) => (
        <figure key={level}>
          <QRCode value={value} level={level} size={120} />
          <figcaption>{level} — version {matrix?.version}</figcaption>
        </figure>
      ))}
    </>
  );
}`,
      },
    },
  },
  render: () => <ErrorCorrectionDemo />,
};

function ShapesDemo() {
  const [moduleShape, setModuleShape] = useState<QRModuleShape>("rounded");
  const [eyeShape, setEyeShape] = useState<QREyeShape>("circle");
  const [moduleGap, setModuleGap] = useState(0);
  const safeGap = MAX_SAFE_MODULE_GAP[moduleShape];
  const gapIsRisky = moduleGap > safeGap;

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Shapes</h2>
      <p className={storyTheme.subtitle}>
        Corners join only where a module has no neighbour, so runs stay connected instead of pinching
        apart.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <span className={storyTheme.label}>Module shape</span>
          <Choices
            options={MODULE_SHAPES}
            value={moduleShape}
            onChange={setModuleShape}
            testId="module-shape"
          />
        </div>
        <div>
          <span className={storyTheme.label}>Eye shape</span>
          <Choices options={EYE_SHAPES} value={eyeShape} onChange={setEyeShape} testId="eye-shape" />
        </div>
        <div>
          <label className={storyTheme.label} htmlFor="module-gap">
            Module gap — {moduleGap.toFixed(2)}{" "}
            <span className={gapIsRisky ? "text-red-600" : "text-green-700"}>
              (measured safe up to {safeGap} for “{moduleShape}”)
            </span>
          </label>
          <input
            id="module-gap"
            data-testid="module-gap"
            type="range"
            min={0}
            max={0.3}
            step={0.05}
            value={moduleGap}
            onChange={(event) => setModuleGap(Number(event.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <QRCode
          value={DEMO_URL}
          size={220}
          level="Q"
          moduleShape={moduleShape}
          eyeShape={eyeShape}
          moduleGap={moduleGap}
          eyeColor={{ outer: "#087f5b" }}
          title="Styled QR code"
        />
      </div>

      <div className={`mt-6 ${gapIsRisky ? storyTheme.cardError : storyTheme.infoBox}`}>
        <p className={gapIsRisky ? "m-0 text-sm" : storyTheme.infoText} data-testid="gap-verdict">
          {gapIsRisky ? (
            <>
              <strong>Past the measured limit.</strong> Separated “{moduleShape}” modules stop
              decoding reliably above {safeGap} at some rendered sizes; development builds warn
              about exactly this. Square modules tolerate the most.
            </>
          ) : (
            <>
              Every shape combination at this gap decodes. Each ceiling above was measured by
              rendering the real component and reading it back with a decoder — not guessed.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export const Shapes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Pick a module shape, a finder-eye shape and a module gap, and watch the same symbol restyle. Nothing here changes what the code encodes — but pushing the gap past a shape's measured ceiling does stop it scanning, and the panel says so.",
      },
      source: {
        language: "tsx",
        code: `import { QRCode } from "@usefy/qr-code";

function Branded() {
  return (
    <QRCode
      value="https://usefy.dev/packages/qr-code"
      size={220}
      level="Q"
      moduleShape="rounded"
      eyeShape="circle"
      eyeColor={{ outer: "#087f5b" }}
      title="Styled QR code"
    />
  );
}`,
      },
    },
  },
  render: () => <ShapesDemo />,
};

const GRADIENTS = {
  Indigo: {
    type: "linear" as const,
    rotation: 45,
    stops: [
      { offset: 0, color: "#6366f1" },
      { offset: 1, color: "#ec4899" },
    ],
  },
  Teal: {
    type: "linear" as const,
    rotation: 90,
    stops: [
      { offset: 0, color: "#087f5b" },
      { offset: 1, color: "#0369a1" },
    ],
  },
  Sunset: {
    type: "radial" as const,
    stops: [
      { offset: 0, color: "#ea580c" },
      { offset: 1, color: "#7f1d1d" },
    ],
  },
};

// Every stop above clears 3:1 against white. The obvious picks — sky-500 and
// amber-500 — do not (2.8:1 and 2.2:1), which is exactly the trap the contrast
// warning exists to catch; the storefront should not be demonstrating it.

function GradientDemo() {
  const [name, setName] = useState<keyof typeof GRADIENTS>("Indigo");
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Gradients</h2>
      <p className={storyTheme.subtitle}>
        Linear and radial gradients render identically in SVG and canvas — one definition, two
        surfaces.
      </p>

      <Choices
        options={Object.keys(GRADIENTS) as Array<keyof typeof GRADIENTS>}
        value={name}
        onChange={setName}
        testId="gradient"
      />

      <div className="mt-6 flex flex-wrap justify-center gap-8">
        <Panel label="SVG">
          <QRCode value={DEMO_URL} size={180} level="Q" moduleShape="rounded" fg={GRADIENTS[name]} />
        </Panel>
        <Panel label="Canvas">
          <QRCode
            value={DEMO_URL}
            size={180}
            level="Q"
            render="canvas"
            moduleShape="rounded"
            fg={GRADIENTS[name]}
          />
        </Panel>
      </div>

      <div className={`${storyTheme.infoBox} mt-6`}>
        <p className={storyTheme.infoText}>
          Keep the darkest stop dark: the encoder warns in development when foreground and background
          contrast drops below the 3:1 a scanner needs.
        </p>
      </div>
    </div>
  );
}

export const Gradients: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The same gradient rendered as SVG and as canvas, side by side, so you can confirm they match. Switch presets to compare linear and radial.",
      },
      source: {
        language: "tsx",
        code: `import { QRCode } from "@usefy/qr-code";

function GradientCode() {
  return (
    <QRCode
      value="https://usefy.dev/packages/qr-code"
      size={180}
      level="Q"
      moduleShape="rounded"
      fg={{
        type: "linear",
        rotation: 45,
        stops: [
          { offset: 0, color: "#6366f1" },
          { offset: 1, color: "#ec4899" },
        ],
      }}
    />
  );
}`,
      },
    },
  },
  render: () => <GradientDemo />,
};

function LogoDemo() {
  const [level, setLevel] = useState<ErrorCorrectionLevel>("H");
  const [size, setSize] = useState(0.2);
  const [shape, setShape] = useState<"square" | "circle">("square");

  const matrix = encodeQR(DEMO_URL, { level });
  const safety = logoSafety(matrix, { logo: { src: LOGO, size, shape } });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Logo, with a safety meter</h2>
      <p className={storyTheme.subtitle}>
        A centre logo works because error correction can rebuild what it hides — until it can&apos;t.
        This shows you exactly where that line is.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <span className={storyTheme.label}>Error correction</span>
          <Choices options={LEVELS} value={level} onChange={setLevel} testId="logo-level" />
        </div>
        <div>
          <label className={storyTheme.label} htmlFor="logo-size">
            Logo size — {Math.round(size * 100)}% of the code
          </label>
          <input
            id="logo-size"
            data-testid="logo-size"
            type="range"
            min={0.05}
            max={0.35}
            step={0.01}
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <span className={storyTheme.label}>Logo shape</span>
          <Choices
            options={["square", "circle"] as const}
            value={shape}
            onChange={setShape}
            testId="logo-shape"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <QRCode
          value={DEMO_URL}
          size={230}
          level={level}
          moduleShape="rounded"
          eyeShape="rounded"
          logo={{ src: LOGO, size, shape }}
          title="QR code with a logo"
        />
      </div>

      <div
        className={`mt-6 ${safety.safe ? storyTheme.cardSuccess : storyTheme.cardError}`}
        data-testid="logo-safety"
      >
        <p className="m-0 text-sm font-semibold">
          {safety.safe ? "Within budget" : "Over budget — scanners may fail"}
        </p>
        <p className="m-0 mt-1 text-sm">
          The logo occludes <strong>{(safety.occludedRatio * 100).toFixed(1)}%</strong> of the
          symbol; level {level} recovers about{" "}
          <strong>{(safety.ecBudget * 100).toFixed(0)}%</strong>.
          {!safety.safe &&
            (safety.recommendedLevel
              ? ` Try level ${safety.recommendedLevel}.`
              : " No level can absorb a logo this large.")}
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className={`h-full rounded-full transition-[width] duration-200 ${
              safety.safe ? "bg-green-600" : "bg-red-600"
            }`}
            style={{ width: `${Math.min(100, (safety.occludedRatio / safety.ecBudget) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export const LogoAndSafety: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Drag the logo past what the error-correction level can recover and the meter turns red with the level that would fix it. The package reports — it never silently changes your settings.",
      },
      source: {
        language: "tsx",
        code: `import { QRCode, encodeQR, logoSafety } from "@usefy/qr-code";

function BrandedCode({ logo }: { logo: string }) {
  const matrix = encodeQR("https://usefy.dev", { level: "H" });
  const safety = logoSafety(matrix, { logo: { src: logo, size: 0.2 } });

  return (
    <>
      <QRCode value="https://usefy.dev" level="H" logo={{ src: logo, size: 0.2 }} size={230} />
      {!safety.safe && <p>Too large — try level {safety.recommendedLevel}</p>}
    </>
  );
}`,
      },
    },
  },
  render: () => <LogoDemo />,
};

function ExportDemo() {
  const controller = useRef<QRCodeController>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Export</h2>
      <p className={storyTheme.subtitle}>
        The PNG is rasterized from the same paths you see on screen — what you preview is what
        downloads.
      </p>

      <div className="flex flex-wrap items-start justify-center gap-8">
        <Panel label="On screen">
          <QRCode
            value={DEMO_URL}
            size={180}
            level="Q"
            moduleShape="rounded"
            eyeShape="rounded"
            fg="#0f172a"
            controllerRef={controller}
            title="Exportable QR code"
          />
        </Panel>
        <Panel label={preview ? "PNG preview" : "No preview yet"}>
          {preview ? (
            <img src={preview} alt="Rendered PNG of the QR code" width={180} height={180} />
          ) : (
            <div className="flex h-[180px] w-[180px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">
              Press “Render PNG” to rasterize
            </div>
          )}
        </Panel>
      </div>

      <div className={`${storyTheme.buttonGroup} mt-6 flex-wrap justify-center`}>
        <button
          type="button"
          data-testid="render-png"
          disabled={busy}
          className={busy ? `${storyTheme.buttonNeutral} opacity-60` : storyTheme.buttonPrimary}
          onClick={async () => {
            setBusy(true);
            try {
              const { dataURL } = await controller.current!.toPNG({ pixelSize: 512 });
              setPreview(dataURL);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Rendering…" : "Render PNG"}
        </button>
        <button
          type="button"
          data-testid="download-png"
          className={storyTheme.buttonNeutral}
          onClick={() => controller.current?.download("png", "usefy-qr.png")}
        >
          Download PNG
        </button>
        <button
          type="button"
          data-testid="download-svg"
          className={storyTheme.buttonNeutral}
          onClick={() => controller.current?.download("svg", "usefy-qr.svg")}
        >
          Download SVG
        </button>
      </div>
    </div>
  );
}

export const Export: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Rasterize the code to a PNG and compare it against the live SVG, or download either format. Nothing runs until you press a button.",
      },
      source: {
        language: "tsx",
        code: `import { useRef, useState } from "react";
import { QRCode, type QRCodeController } from "@usefy/qr-code";

function Downloadable() {
  const controller = useRef<QRCodeController>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <>
      <QRCode value="https://usefy.dev" level="Q" controllerRef={controller} />
      <button onClick={async () => setPreview((await controller.current!.toPNG()).dataURL)}>
        Render PNG
      </button>
      <button onClick={() => controller.current?.download("png", "usefy-qr.png")}>
        Download
      </button>
      {preview && <img src={preview} alt="" width={180} />}
    </>
  );
}`,
      },
    },
  },
  render: () => <ExportDemo />,
};

function WifiDemo() {
  const [ssid, setSsid] = useState("usefy-guest");
  const [password, setPassword] = useState("hello-world");
  const [hidden, setHidden] = useState(false);

  // WIFI:T:WPA;S:<ssid>;P:<password>;H:true;;  — backslash-escape the delimiters.
  const escape = (input: string) => input.replace(/([\\;,:"])/g, "\\$1");
  const payload = `WIFI:T:WPA;S:${escape(ssid)};P:${escape(password)};${hidden ? "H:true;" : ""};`;
  const { error } = useQRCode({ value: payload, level: "M" });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Wi-Fi join code</h2>
      <p className={storyTheme.subtitle}>
        A QR code is only ever a string. Phones join a network from this one without typing a
        password.
      </p>

      <label className={storyTheme.label} htmlFor="wifi-ssid">
        Network name
      </label>
      <input
        id="wifi-ssid"
        data-testid="wifi-ssid"
        className={storyTheme.input}
        value={ssid}
        onChange={(event) => setSsid(event.target.value)}
      />

      <label className={`${storyTheme.label} mt-4`} htmlFor="wifi-password">
        Password
      </label>
      <input
        id="wifi-password"
        data-testid="wifi-password"
        className={storyTheme.input}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <label className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          data-testid="wifi-hidden"
          checked={hidden}
          onChange={(event) => setHidden(event.target.checked)}
        />
        Hidden network
      </label>

      <div className="mt-6 flex justify-center">
        {error ? (
          <p className={storyTheme.messageError}>{error.message}</p>
        ) : (
          <QRCode value={payload} size={200} level="M" title={`Join ${ssid}`} />
        )}
      </div>

      <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-100 p-3 text-xs text-gray-700">
        {payload}
      </pre>
    </div>
  );
}

export const WifiRecipe: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Builds the standard `WIFI:` payload from the fields and encodes it live, including the backslash escaping the format requires.",
      },
      source: {
        language: "tsx",
        code: `import { QRCode } from "@usefy/qr-code";

function WifiJoin({ ssid, password }: { ssid: string; password: string }) {
  const escape = (input: string) => input.replace(/([\\\\;,:"])/g, "\\\\$1");
  const payload = \`WIFI:T:WPA;S:\${escape(ssid)};P:\${escape(password)};;\`;

  return <QRCode value={payload} size={200} level="M" title={\`Join \${ssid}\`} />;
}`,
      },
    },
  },
  render: () => <WifiDemo />,
};

export const DarkSurface: Story = {
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: {
        story:
          "On a dark surface, keep the code itself light-on-dark-free: scanners expect dark modules on a light field, so the panel stays light and only the frame goes dark.",
      },
      source: {
        language: "tsx",
        code: `import { QRCode } from "@usefy/qr-code";

function OnDark() {
  return (
    <div style={{ background: "#0f172a", padding: 32, borderRadius: 20 }}>
      {/* A light quiet zone is what keeps the code scannable on a dark page. */}
      <QRCode value="https://usefy.dev" size={200} level="Q" bg="#ffffff" margin={4} />
    </div>
  );
}`,
      },
    },
  },
  render: () => (
    <div className="rounded-2xl bg-slate-900 p-10 text-center font-sans">
      <h2 className="mb-2 text-2xl font-bold text-white">On a dark surface</h2>
      <p className="mb-6 text-sm text-slate-400">
        Scanners expect dark modules on a light field — so the quiet zone stays light even when the
        page is not.
      </p>
      <div className="flex flex-wrap justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <QRCode value={DEMO_URL} size={180} level="Q" bg="#ffffff" margin={4} />
          <span className="text-xs font-semibold text-green-400">Light quiet zone — scans</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-xl bg-white p-3">
            <QRCode
              value={DEMO_URL}
              size={156}
              level="Q"
              moduleShape="rounded"
              eyeShape="rounded"
              fg="#0f172a"
            />
          </div>
          <span className="text-xs font-semibold text-slate-300">Framed in a light card</span>
        </div>
      </div>
    </div>
  ),
};

function ServerRenderedDemo() {
  // Exactly what a React Server Component would do: no hooks, no client JS.
  const props = toSVGProps(encodeQR(DEMO_URL, { level: "Q" }), { margin: 2, fg: "#0f172a" });
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Server rendered</h2>
      <p className={storyTheme.subtitle}>
        <code>@usefy/qr-code/headless</code> carries no <code>&quot;use client&quot;</code> and no
        React, so a server component can build this markup directly.
      </p>
      <div className="flex justify-center">
        <svg viewBox={props.viewBox} width={200} height={200} role="img" aria-label="Server-rendered QR code">
          {props.background && (
            <rect width={props.side} height={props.side} fill={props.background} />
          )}
          {props.paths.map((path, index) => (
            <path key={index} d={path.d} fill={path.fill} />
          ))}
        </svg>
      </div>
      <div className={`${storyTheme.infoBox} mt-6`}>
        <p className={storyTheme.infoText}>
          No <code>dangerouslySetInnerHTML</code>, no hydration, no client bundle — the encoder plus
          the SVG path builder is about 6.7 KB gzipped, and none of it ships to the browser here.
        </p>
      </div>
    </div>
  );
}

export const ServerRendered: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`toSVGProps()` returns plain data, so a server component can render a QR code as real JSX with zero client JavaScript.",
      },
      source: {
        language: "tsx",
        code: `// app/ticket/page.tsx — a React Server Component. No "use client".
import { encodeQR, toSVGProps } from "@usefy/qr-code/headless";

export default function TicketPage() {
  const props = toSVGProps(encodeQR("https://usefy.dev", { level: "Q" }), { margin: 2 });

  return (
    <svg viewBox={props.viewBox} width={200} height={200} role="img" aria-label="Ticket">
      {props.background && <rect width={props.side} height={props.side} fill={props.background} />}
      {props.paths.map((path, index) => (
        <path key={index} d={path.d} fill={path.fill} />
      ))}
    </svg>
  );
}`,
      },
    },
  },
  render: () => <ServerRenderedDemo />,
};

// ============================================================================
// Interaction test — drives the UI by itself; kept out of the docs page.
// ============================================================================

export const InteractionTest: Story = {
  tags: ["!autodocs"],
  parameters: {
    docs: {
      description: {
        story:
          "Automated check — this story drives itself on open (switches shapes, oversizes the logo, rasterizes a PNG). Use the demo stories above to explore by hand.",
      },
      source: { language: "tsx", code: "// Interaction test — see the demo stories for usage." },
    },
  },
  render: () => (
    <div className="flex flex-col gap-10">
      <ShapesDemo />
      <LogoDemo />
      <ExportDemo />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Styling changes the rendering without changing the encoded symbol.
    const before = canvasElement.querySelectorAll("svg path").length;
    await userEvent.click(canvas.getByTestId("module-shape-dot"));
    await userEvent.click(canvas.getByTestId("eye-shape-leaf"));
    await waitFor(() =>
      expect(canvasElement.querySelectorAll("svg path").length).toBeGreaterThanOrEqual(before),
    );

    // Oversizing the logo trips the safety meter, and it names a way out.
    await userEvent.click(canvas.getByTestId("logo-level-L"));
    const slider = canvas.getByTestId("logo-size") as HTMLInputElement;
    await userEvent.clear(slider).catch(() => {});
    slider.focus();
    for (let i = 0; i < 40; i++) await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(canvas.getByTestId("logo-safety").textContent).toMatch(/Over budget/),
    );

    // Exporting produces real PNG bytes, not a blank canvas.
    await userEvent.click(canvas.getByTestId("render-png"));
    const image = await canvas.findByAltText("Rendered PNG of the QR code");
    await waitFor(() =>
      expect((image as HTMLImageElement).src.startsWith("data:image/png;base64,")).toBe(true),
    );
    expect((image as HTMLImageElement).src.length).toBeGreaterThan(1000);
  },
};

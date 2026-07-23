import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, within } from "@storybook/test";
import {
  SignaturePad,
  useSignaturePad,
  type SignatureData,
  type SignaturePadController,
} from "@usefy/signature-pad";
import { storyTheme } from "../styles/storyTheme";

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof SignaturePad> = {
  title: "signature-pad",
  component: SignaturePad,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Electronic signature input: draw with mouse, finger, or stylus and export the result as a trimmed PNG, true-vector SVG, or replayable JSON — powered by a hand-written ink engine (Bézier smoothing + velocity/pressure-based variable stroke width).

## Features
- **Real ink, zero deps** — min-distance filtering, cubic Bézier smoothing, EMA-filtered velocity → continuously variable stroke width, stylus pressure blending
- **One model, three layers** — \`<SignaturePad />\` component → \`useSignaturePad()\` hook → framework-free \`createSignatureEngine\` (\`@usefy/signature-pad/headless\`)
- **Exports that match the screen** — PNG (ink-bbox trim, background, scale) and standalone SVG, generated from the *same* geometry pipeline the canvas renders
- **Serialization built in** — versioned \`toJSON()\`/\`fromJSON()\`; strokes are self-contained, so a stored signature replays identically anywhere
- **Stroke-level undo/redo** — plus \`clear()\` as a single undoable action
- **House-standard robustness** — SSR & StrictMode safe, DPR-crisp, resize-resilient, \`touch-action\` handled, React 18 + 19

## Basic Usage
\`\`\`tsx
import { SignaturePad } from "@usefy/signature-pad";

<div style={{ height: 200 }}>
  <SignaturePad guideline onChange={({ isEmpty }) => setSigned(!isEmpty)} />
</div>
\`\`\``,
      },
    },
  },
  argTypes: {
    penColor: {
      control: "color",
      description: "Ink color (captured per stroke at stroke start)",
      table: { type: { summary: "string" }, defaultValue: { summary: "#1e293b" } },
    },
    minWidth: {
      control: { type: "range", min: 0, max: 5, step: 0.25 },
      description: "Minimum stroke half-width in px (fast strokes thin toward this)",
      table: { type: { summary: "number" }, defaultValue: { summary: "0.5" } },
    },
    maxWidth: {
      control: { type: "range", min: 0.5, max: 10, step: 0.25 },
      description: "Maximum stroke half-width in px (slow strokes fatten toward this)",
      table: { type: { summary: "number" }, defaultValue: { summary: "2.5" } },
    },
    velocityFilterWeight: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      description: "EMA weight for velocity smoothing (higher = reacts faster)",
      table: { type: { summary: "number" }, defaultValue: { summary: "0.7" } },
    },
    pressure: {
      control: "select",
      options: ["auto", "ignore"],
      description: "Blend stylus pressure into the width when a pen reports it",
      table: { type: { summary: "'auto' | 'ignore'" }, defaultValue: { summary: "'auto'" } },
    },
    readOnly: {
      control: "boolean",
      description: "Detach input; rendering, exports, and restore keep working",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    guideline: {
      description: 'Baseline "sign here" line drawn under the ink, never exported',
      table: { type: { summary: "boolean | { y?, inset?, color? }" } },
    },
    onChange: {
      description: "Fires on edges only (stroke end / undo / redo / clear / restore)",
      table: { type: { summary: "({ isEmpty, strokeCount }) => void" } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SignaturePad>;

const padFrame =
  "rounded-xl border-2 border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]";

// ============================================================================
// A stored signature (for ReadOnlyRestore) — generated deterministically so
// the demo always shows the same graceful scribble.
// ============================================================================

function storedSignature(): SignatureData {
  const stroke = (
    pts: Array<[number, number]>,
    startTime: number,
  ): SignatureData["strokes"][number] => ({
    points: pts.map(([x, y], i) => ({ x, y, time: startTime + i * 24, pressure: 0 })),
    color: "#1d4ed8",
    minWidth: 0.5,
    maxWidth: 2.5,
    velocityFilterWeight: 0.7,
    pressure: "auto",
    pointerType: "pen",
  });
  // A flowing "S"-like flourish plus an underline.
  const flourish: Array<[number, number]> = [];
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    flourish.push([
      30 + t * 300,
      80 + Math.sin(t * Math.PI * 2.2) * 34 * (1 - t * 0.35),
    ]);
  }
  const underline: Array<[number, number]> = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    underline.push([60 + t * 240, 128 + Math.sin(t * Math.PI) * 5]);
  }
  return { v: 1, width: 400, height: 160, strokes: [stroke(flourish, 0), stroke(underline, 900)] };
}

const STORED_SIGNATURE = storedSignature();

// ============================================================================
// BasicPad — hook + toolbar
// ============================================================================

const BASIC_CODE = `import { useSignaturePad } from "@usefy/signature-pad";

function SignatureField() {
  const pad = useSignaturePad();
  return (
    <div>
      <canvas ref={pad.canvasRef} style={{ width: "100%", height: 200 }} />
      <button onClick={pad.undo} disabled={!pad.canUndo}>Undo</button>
      <button onClick={pad.redo} disabled={!pad.canRedo}>Redo</button>
      <button onClick={pad.clear} disabled={pad.isEmpty}>Clear</button>
      <span>{pad.isEmpty ? "Sign above" : \`\${pad.strokeCount} stroke(s)\`}</span>
    </div>
  );
}`;

function BasicPadDemo() {
  const pad = useSignaturePad();
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Sign here</h2>
      <p className={storyTheme.subtitle}>
        Draw with your mouse, finger, or stylus. Slow strokes are thick, fast
        strokes are thin — watch the ink width breathe.
      </p>
      <div className={padFrame} style={{ height: 220 }}>
        <canvas ref={pad.canvasRef} data-testid="basic-canvas" style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          className={storyTheme.buttonNeutral}
          onClick={pad.undo}
          disabled={!pad.canUndo}
          data-testid="basic-undo"
          style={!pad.canUndo ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
        >
          ↩ Undo
        </button>
        <button
          className={storyTheme.buttonNeutral}
          onClick={pad.redo}
          disabled={!pad.canRedo}
          data-testid="basic-redo"
          style={!pad.canRedo ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
        >
          ↪ Redo
        </button>
        <button
          className={storyTheme.buttonDanger}
          onClick={pad.clear}
          disabled={pad.isEmpty}
          data-testid="basic-clear"
          style={pad.isEmpty ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
        >
          Clear
        </button>
        <span className={storyTheme.messageInfo} data-testid="basic-status" style={{ marginTop: 0, marginLeft: "auto" }}>
          {pad.isEmpty ? "Empty — sign above" : `Signed · ${pad.strokeCount} stroke(s)`}
        </span>
      </div>
    </div>
  );
}

export const BasicPad: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The hook on a canvas you own: stroke-level undo/redo, clear as a single undoable action, and edge-only state (zero React renders while ink is flowing).",
      },
      source: { language: "tsx", code: BASIC_CODE },
    },
  },
  render: () => <BasicPadDemo />,
};

// ============================================================================
// ExportPreview — PNG + SVG side by side
// ============================================================================

const EXPORT_CODE = `import { useSignaturePad } from "@usefy/signature-pad";

function ExportableSignature() {
  const pad = useSignaturePad();
  const [png, setPng] = useState<string>();
  const [svg, setSvg] = useState<string>();

  const exportBoth = async () => {
    const { dataURL } = await pad.toPNG({ background: "#ffffff" });
    setPng(dataURL);                 // trimmed to the ink, white background
    setSvg(pad.toSVG());             // true vector, transparent, same geometry
  };

  return (
    <>
      <canvas ref={pad.canvasRef} style={{ width: "100%", height: 200 }} />
      <button onClick={exportBoth} disabled={pad.isEmpty}>Export</button>
      {png && <img src={png} alt="signature as PNG" />}
      {svg && <a href={\`data:image/svg+xml;utf8,\${encodeURIComponent(svg)}\`} download="signature.svg">Download SVG</a>}
    </>
  );
}`;

function ExportPreviewDemo() {
  const pad = useSignaturePad();
  const [png, setPng] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  const exportBoth = async () => {
    const { dataURL } = await pad.toPNG({ background: "#ffffff" });
    setPng(dataURL);
    setSvg(pad.toSVG());
  };

  return (
    <div className={storyTheme.container} style={{ maxWidth: 720 }}>
      <h2 className={storyTheme.title}>Sign, then export</h2>
      <p className={storyTheme.subtitle}>
        PNG and SVG come from the same geometry pipeline the canvas renders —
        what you see is what you export. PNG is trimmed to the ink; SVG is a
        true vector.
      </p>
      <div className={padFrame} style={{ height: 200 }}>
        <canvas ref={pad.canvasRef} data-testid="export-canvas" style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
      <div className="mt-4 flex gap-2">
        <button
          className={storyTheme.buttonPrimary}
          onClick={exportBoth}
          disabled={pad.isEmpty}
          data-testid="export-run"
          style={pad.isEmpty ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
        >
          Export PNG + SVG
        </button>
        <button className={storyTheme.buttonNeutral} onClick={pad.clear} disabled={pad.isEmpty} style={pad.isEmpty ? { opacity: 0.4, cursor: "not-allowed" } : undefined}>
          Clear
        </button>
      </div>
      {(png || svg) && (
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className={storyTheme.card}>
            <div className={storyTheme.label}>PNG (trimmed, white bg)</div>
            <div className="rounded-lg border border-gray-200 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,white_0%_50%)] bg-[length:16px_16px] p-2">
              {png && <img src={png} alt="signature as PNG" data-testid="export-png" style={{ maxWidth: "100%" }} />}
            </div>
            {png && (
              <a className={`${storyTheme.statValue} underline`} href={png} download="signature.png">
                Download PNG
              </a>
            )}
          </div>
          <div className={storyTheme.card}>
            <div className={storyTheme.label}>SVG (vector, transparent)</div>
            <div
              className="rounded-lg border border-gray-200 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,white_0%_50%)] bg-[length:16px_16px] p-2 [&>svg]:max-w-full [&>svg]:h-auto"
              data-testid="export-svg"
              dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
            />
            {svg && (
              <a
                className={`${storyTheme.statValue} underline`}
                href={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
                download="signature.svg"
              >
                Download SVG
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const ExportPreview: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Sign, then render both exports side by side: PNG (ink-trimmed, chosen background) and standalone SVG — pixel and vector twins of the on-screen ink, with download links.",
      },
      source: { language: "tsx", code: EXPORT_CODE },
    },
  },
  render: () => <ExportPreviewDemo />,
};

// ============================================================================
// PenStyles — knob-driven ink options
// ============================================================================

const PEN_STYLES_CODE = `import { SignaturePad } from "@usefy/signature-pad";

<div style={{ height: 220 }}>
  <SignaturePad
    penColor="#7c3aed"
    minWidth={1}
    maxWidth={5}
    velocityFilterWeight={0.7}
  />
</div>
// Changing ink props NEVER wipes the pad: committed strokes keep the style
// they were drawn with, new strokes pick up the new options.`;

export const PenStyles: Story = {
  args: {
    penColor: "#7c3aed",
    minWidth: 1,
    maxWidth: 5,
    velocityFilterWeight: 0.7,
    pressure: "auto",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Tune the pen with the Controls panel — color, width range, velocity response. Sign first, then move the knobs: your signature SURVIVES every change (each stroke keeps the style it was captured with; new strokes use the new settings).",
      },
      source: { language: "tsx", code: PEN_STYLES_CODE },
    },
  },
  render: (args) => (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Pen styles</h2>
      <p className={storyTheme.subtitle}>
        Sign something, then play with the Controls panel below — existing ink
        keeps its captured style while new strokes pick up the new pen.
      </p>
      <div className={padFrame} style={{ height: 220 }}>
        <SignaturePad {...args} />
      </div>
    </div>
  ),
};

// ============================================================================
// GuidelineAndForm — consent-form card
// ============================================================================

const GUIDELINE_CODE = `import { SignaturePad, type SignaturePadController } from "@usefy/signature-pad";

function ConsentForm() {
  const pad = useRef<SignaturePadController>(null);
  const [signed, setSigned] = useState(false);

  return (
    <form>
      <label>Full name <input required /></label>
      <div style={{ height: 180 }}>
        <SignaturePad
          guideline                    // "sign here" baseline, drawn UNDER the
          controllerRef={pad}          // ink and excluded from every export
          onChange={({ isEmpty }) => setSigned(!isEmpty)}
        />
      </div>
      <button disabled={!signed} onClick={async () => {
        const { blob } = await pad.current!.toPNG({ background: "#fff" });
        await submitConsent(blob);
      }}>
        Agree &amp; sign
      </button>
    </form>
  );
}`;

function GuidelineFormDemo() {
  const pad = useRef<SignaturePadController>(null);
  const [signed, setSigned] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className={storyTheme.container}>
      <div className={storyTheme.cardInfo}>
        <h2 className={storyTheme.titleLarge} style={{ marginBottom: 8 }}>
          Delivery confirmation
        </h2>
        <p className={storyTheme.statTextSecondary} style={{ marginBottom: 16 }}>
          Package #4821 · Please sign on the line to confirm receipt.
        </p>
        <div className={padFrame} style={{ height: 180 }}>
          <SignaturePad
            guideline
            controllerRef={pad}
            onChange={({ isEmpty }) => {
              setSigned(!isEmpty);
              if (isEmpty) setPreview(null);
            }}
            aria-label="Delivery confirmation signature"
          />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            className={storyTheme.buttonPrimary}
            disabled={!signed}
            data-testid="guideline-confirm"
            style={!signed ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
            onClick={async () => {
              const { dataURL } = await pad.current!.toPNG({ background: "#ffffff" });
              setPreview(dataURL);
            }}
          >
            Confirm receipt
          </button>
          <button className={storyTheme.buttonNeutral} onClick={() => pad.current?.clear()}>
            Start over
          </button>
        </div>
        {preview && (
          <div className="mt-4">
            <div className={storyTheme.label}>
              Submitted signature (note: the guideline is NOT in the export)
            </div>
            <img
              src={preview}
              alt="submitted signature"
              data-testid="guideline-preview"
              className="rounded-lg border border-gray-200 bg-white"
              style={{ maxWidth: "100%" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const GuidelineAndForm: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A consent-form card with the "sign here" guideline: drawn on-canvas beneath the ink, visibly ABSENT from the exported PNG preview — exports contain ink only.',
      },
      source: { language: "tsx", code: GUIDELINE_CODE },
    },
  },
  render: () => <GuidelineFormDemo />,
};

// ============================================================================
// ReadOnlyRestore — stored signature, replayable anywhere
// ============================================================================

const RESTORE_CODE = `import { SignaturePad, type SignatureData } from "@usefy/signature-pad";

// A signature captured earlier with pad.toJSON() — strokes are
// self-contained, so it replays identically on any pad.
const stored: SignatureData = await fetchSignature(documentId);

// Review screen: render it read-only.
<div style={{ height: 180 }}>
  <SignaturePad readOnly defaultValue={stored} />
</div>

// Or load it into an editable pad to continue:
padController.current?.fromJSON(stored);`;

function ReadOnlyRestoreDemo() {
  const editable = useRef<SignaturePadController>(null);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={storyTheme.container} style={{ maxWidth: 720 }}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className={storyTheme.label}>Stored (read-only)</div>
          <div className={padFrame} style={{ height: 180 }}>
            <SignaturePad
              readOnly
              defaultValue={STORED_SIGNATURE}
              aria-label="Stored signature, read-only"
            />
          </div>
          <p className={storyTheme.statTextSecondary} style={{ marginTop: 8 }}>
            Try drawing here — input is off; rendering and exports still work.
          </p>
        </div>
        <div>
          <div className={storyTheme.label}>Editable pad</div>
          <div className={padFrame} style={{ height: 180 }}>
            <SignaturePad controllerRef={editable} aria-label="Editable signature pad" />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              className={storyTheme.buttonPrimary}
              data-testid="restore-load"
              onClick={() => {
                editable.current?.fromJSON(STORED_SIGNATURE);
                setLoaded(true);
              }}
            >
              Load stored → editable
            </button>
            <button
              className={storyTheme.buttonNeutral}
              onClick={() => {
                editable.current?.clear();
                setLoaded(false);
              }}
            >
              Clear
            </button>
          </div>
          {loaded && (
            <p className={storyTheme.messageSuccess}>
              Restored — keep signing on top, or undo stroke by stroke.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export const ReadOnlyRestore: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Serialization round-trip: a stored SignatureData rendered read-only (input detached), then loaded into an editable pad with fromJSON — strokes are self-contained and replay identically.",
      },
      source: { language: "tsx", code: RESTORE_CODE },
    },
  },
  render: () => <ReadOnlyRestoreDemo />,
};

// ============================================================================
// DarkSurface — light ink on a dark card
// ============================================================================

const DARK_CODE = `import { SignaturePad } from "@usefy/signature-pad";

<div style={{ height: 200, background: "#0f172a", borderRadius: 12 }}>
  <SignaturePad
    penColor="#e2e8f0"
    guideline={{ color: "#334155" }}
  />
</div>`;

export const DarkSurface: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The canvas is transparent by default, so the pad sits on any surface — here light ink and a muted guideline on a dark card.",
      },
      source: { language: "tsx", code: DARK_CODE },
    },
  },
  render: () => (
    <div className={storyTheme.container}>
      <div className="rounded-2xl bg-slate-900 p-6 shadow-[0_8px_24px_rgba(2,6,23,0.5)]">
        <h2 className="mb-1 text-xl font-semibold text-slate-100">Sign to authorize</h2>
        <p className="mb-4 text-sm text-slate-400">
          Light ink on a dark surface — the canvas itself is transparent.
        </p>
        <div className="rounded-xl border-2 border-slate-700" style={{ height: 200 }}>
          <SignaturePad penColor="#e2e8f0" guideline={{ color: "#334155" }} />
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// InteractionTest — auto-runs; drives the pad by itself (!autodocs)
// ============================================================================

function InteractionTestDemo() {
  const pad = useSignaturePad();
  const [svgLength, setSvgLength] = useState(0);
  return (
    <div className={storyTheme.container}>
      <p className={storyTheme.infoText}>
        ⚠ This story auto-runs a synthetic pointer sequence and drives the pad
        by itself — it is a test, not a demo. Use “BasicPad” for the real
        experience.
      </p>
      <div className={padFrame} style={{ height: 180 }}>
        <canvas
          ref={pad.canvasRef}
          data-testid="it-canvas"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button className={storyTheme.buttonNeutral} onClick={pad.undo} data-testid="it-undo">
          Undo
        </button>
        <button className={storyTheme.buttonNeutral} onClick={pad.redo} data-testid="it-redo">
          Redo
        </button>
        <button className={storyTheme.buttonNeutral} onClick={pad.clear} data-testid="it-clear">
          Clear
        </button>
        <button
          className={storyTheme.buttonNeutral}
          onClick={() => setSvgLength(pad.toSVG().length)}
          data-testid="it-export"
        >
          Export
        </button>
      </div>
      <div className={storyTheme.messageInfo}>
        <span data-testid="it-status">{pad.isEmpty ? "empty" : `signed:${pad.strokeCount}`}</span>
        {" · "}
        <span data-testid="it-svg-length">svg:{svgLength}</span>
      </div>
    </div>
  );
}

function drawSyntheticStroke(canvas: HTMLCanvasElement): void {
  const rect = canvas.getBoundingClientRect();
  const fire = (type: string, x: number, y: number) => {
    canvas.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 41,
        pointerType: "mouse",
        isPrimary: true,
        button: type === "pointerdown" ? 0 : -1,
        buttons: type === "pointerup" ? 0 : 1,
        clientX: rect.left + x,
        clientY: rect.top + y,
      }),
    );
  };
  fire("pointerdown", 30, 90);
  for (let i = 1; i <= 12; i++) {
    fire("pointermove", 30 + i * 20, 90 + Math.sin(i / 2) * 30);
  }
  fire("pointerup", 270, 90);
}

export const InteractionTest: Story = {
  tags: ["!autodocs"],
  parameters: {
    docs: {
      description: {
        story:
          "AUTO-RUNS: synthetic pointer drawing → state flips → undo/redo → non-empty export → clear. A functional test story, deliberately excluded from the docs page.",
      },
      source: {
        language: "tsx",
        code: `// This story is a self-running functional test — see BasicPad for usage.`,
      },
    },
  },
  render: () => <InteractionTestDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = await canvas.findByTestId("it-status");
    await expect(status).toHaveTextContent("empty");

    // Draw a synthetic stroke through the REAL pointer pipeline.
    const padCanvas = (await canvas.findByTestId("it-canvas")) as HTMLCanvasElement;
    drawSyntheticStroke(padCanvas);
    await waitFor(() => expect(status).toHaveTextContent("signed:1"));

    // Undo → empty; redo → signed again.
    (await canvas.findByTestId("it-undo")).click();
    await waitFor(() => expect(status).toHaveTextContent("empty"));
    (await canvas.findByTestId("it-redo")).click();
    await waitFor(() => expect(status).toHaveTextContent("signed:1"));

    // Export is non-empty (contains real path markup, far beyond the shell).
    (await canvas.findByTestId("it-export")).click();
    await waitFor(() => {
      const len = Number(
        canvasElement.querySelector('[data-testid="it-svg-length"]')!.textContent!.replace("svg:", ""),
      );
      expect(len).toBeGreaterThan(500);
    });

    // Clear leaves the pad reusable.
    (await canvas.findByTestId("it-clear")).click();
    await waitFor(() => expect(status).toHaveTextContent("empty"));
  },
};

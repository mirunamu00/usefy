import React, { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useLongPress } from "@usefy/use-long-press";
import { within, expect, waitFor, fireEvent } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

const HOLD_MS = 600;

/**
 * Press-and-hold demo — hold the button down and a progress bar fills over
 * {@link HOLD_MS}ms; reaching the end fires the long press and flips the badge to
 * "fired". Releasing or dragging away before the bar fills cancels it.
 */
function PressAndHoldDemo() {
  const [status, setStatus] = useState<"idle" | "pressing" | "fired">("idle");
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  const stop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const tick = () => {
    const elapsed = performance.now() - startRef.current;
    setProgress(Math.min(100, (elapsed / HOLD_MS) * 100));
    if (elapsed < HOLD_MS) rafRef.current = requestAnimationFrame(tick);
  };

  const bind = useLongPress<HTMLButtonElement>(() => setStatus("fired"), {
    threshold: HOLD_MS,
    onStart: () => {
      setStatus("pressing");
      setProgress(0);
      startRef.current = performance.now();
      stop();
      rafRef.current = requestAnimationFrame(tick);
    },
    onFinish: () => {
      stop();
      setProgress(100);
    },
    onCancel: () => {
      stop();
      setStatus("idle");
      setProgress(0);
    },
  });

  const fired = status === "fired";

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>useLongPress</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Press and <em>hold</em> the button for {HOLD_MS}ms — release or drag away
        early and nothing happens
      </p>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-600">Status</span>
        <span
          data-testid="status"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            fired
              ? "bg-emerald-500 text-white"
              : status === "pressing"
                ? "bg-violet-600 text-white"
                : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {fired ? "fired" : status === "pressing" ? "holding…" : "idle"}
        </span>
      </div>

      <button
        type="button"
        data-testid="target"
        className={`${storyTheme.buttonFull} select-none`}
        style={{ touchAction: "none" }}
        {...bind}
      >
        {fired ? "Fired!" : "Press and hold"}
      </button>

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          data-testid="progress"
          className="h-full rounded-full bg-violet-600"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Cancellation demo — a running log records the outcome of each interaction:
 * a completed long press ("fired"), an early release ("cancelled: released"),
 * or dragging past the 10px move threshold ("cancelled: moved").
 */
function CancellationDemo() {
  const [log, setLog] = useState<string[]>([]);
  const push = (entry: string) => setLog((l) => [entry, ...l].slice(0, 5));

  const bind = useLongPress<HTMLButtonElement>(() => push("fired"), {
    threshold: 500,
    moveThreshold: 10,
    onCancel: (_event, { reason }) => push(`cancelled: ${reason}`),
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>onCancel reasons</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        A quick tap logs <code>released</code>, dragging away logs{" "}
        <code>moved</code>, and a full hold logs <code>fired</code>
      </p>

      <button
        type="button"
        data-testid="target"
        className={`${storyTheme.buttonFull} select-none`}
        style={{ touchAction: "none" }}
        {...bind}
      >
        Hold, tap, or drag me
      </button>

      <div className={`${storyTheme.card} mt-4`}>
        <div className={storyTheme.statLabel}>Outcome log</div>
        <div data-testid="log" className="font-mono text-sm text-zinc-700">
          {log.length === 0 ? "—" : log.join("  ·  ")}
        </div>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof PressAndHoldDemo> = {
  title: "Hooks/useLongPress",
  component: PressAndHoldDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Recognise a **long-press** ("press and hold") gesture on any element — for both mouse and touch. \`useLongPress(callback, options)\` returns a \`bind\` object of DOM handler props you spread onto the target: \`<button {...bind}>\`. The \`callback\` fires once when the press is held for at least \`threshold\` ms without being released or dragged too far.

## Features
- **\`bind\` object** - spread the memoized handlers onto any element; they never churn
- **Time threshold** - \`threshold\` (default \`400\`ms) before the callback fires
- **Movement cancellation** - drifting past \`moveThreshold\` px (default \`10\`) cancels; pass \`false\` to disable
- **Mouse + touch** - one gesture for both; synthetic mouse events after a touch are ignored (no double-fire)
- **Lifecycle callbacks** - \`onStart\`, \`onFinish\`, and \`onCancel\` (with a \`{ reason }\` of \`"released"\` | \`"moved"\`)
- **Stable & safe** - callbacks kept in latest-refs, timer cleared on release/cancel/unmount, SSR- and StrictMode-safe

## Basic Usage
\`\`\`tsx
const bind = useLongPress(() => console.log("held!"), { threshold: 600 });

return <button {...bind}>Press and hold</button>;
\`\`\`

> **preventDefault caveat:** React's \`onTouchStart\`/\`onTouchMove\` are passive, so \`event.preventDefault()\` won't stop scrolling. Use CSS \`touch-action: none\` and \`user-select: none\` on the target instead.`,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PressAndHoldDemo>;

export const PressAndHold: Story = {
  render: () => <PressAndHoldDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Hold the button until the progress bar fills to fire the long press. A quick release before the threshold does nothing.",
      },
      source: {
        language: "tsx",
        code: `import { useLongPress } from "@usefy/use-long-press";

function HoldToConfirm() {
  const [confirmed, setConfirmed] = useState(false);

  const bind = useLongPress(() => setConfirmed(true), {
    threshold: 600,
    onCancel: () => setConfirmed(false),
  });

  return (
    <button {...bind} style={{ touchAction: "none", userSelect: "none" }}>
      {confirmed ? "Confirmed!" : "Press and hold"}
    </button>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const target = canvas.getByTestId("target");
    const status = canvas.getByTestId("status");

    expect(status).toHaveTextContent("idle");

    // Quick press-and-release does NOT fire.
    fireEvent.mouseDown(target, { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(target, { clientX: 0, clientY: 0 });
    expect(status).not.toHaveTextContent("fired");

    // Hold past the threshold → fires.
    fireEvent.mouseDown(target, { clientX: 0, clientY: 0 });
    await waitFor(() => expect(status).toHaveTextContent("fired"), {
      timeout: 2000,
    });
    fireEvent.mouseUp(target, { clientX: 0, clientY: 0 });
  },
};

export const CancelReasons: Story = {
  render: () => <CancellationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "`onCancel` reports why a press ended early — `released` (lifted too soon) or `moved` (dragged past `moveThreshold`) — while a full hold logs `fired`.",
      },
      source: {
        language: "tsx",
        code: `import { useLongPress } from "@usefy/use-long-press";

function LongPressWithReasons() {
  const [log, setLog] = useState<string[]>([]);

  const bind = useLongPress(() => setLog((l) => ["fired", ...l]), {
    threshold: 500,
    moveThreshold: 10,
    onCancel: (_event, { reason }) =>
      setLog((l) => ["cancelled: " + reason, ...l]),
  });

  return (
    <>
      <button {...bind} style={{ touchAction: "none" }}>
        Hold, tap, or drag me
      </button>
      <p>{log.join(" · ")}</p>
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const target = canvas.getByTestId("target");
    const log = canvas.getByTestId("log");

    // Quick tap → cancelled: released.
    fireEvent.mouseDown(target, { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(target, { clientX: 0, clientY: 0 });
    await waitFor(() => expect(log).toHaveTextContent("cancelled: released"));

    // Drag past the move threshold → cancelled: moved.
    fireEvent.mouseDown(target, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(target, { clientX: 80, clientY: 0 });
    await waitFor(() => expect(log).toHaveTextContent("cancelled: moved"));

    // Full hold → fired.
    fireEvent.mouseDown(target, { clientX: 0, clientY: 0 });
    await waitFor(() => expect(log).toHaveTextContent("fired"), {
      timeout: 2000,
    });
    fireEvent.mouseUp(target, { clientX: 0, clientY: 0 });
  },
};

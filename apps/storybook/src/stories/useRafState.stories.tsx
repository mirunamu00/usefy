import React, { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useRafState } from "@usefy/use-raf-state";
import { within, fireEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Pointer follower — a burst of `pointermove` events (dozens per second) all
 * call `setPos`, but `useRafState` coalesces them so the dot repositions at most
 * once per frame. The render counter proves the commits are frame-capped.
 */
function PointerFollowerDemo() {
  const [pos, setPos] = useRafState({ x: 120, y: 90 });
  const renders = useRef(0);
  renders.current += 1;

  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const onMove = (e: PointerEvent) => {
      const rect = area.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    area.addEventListener("pointermove", onMove);
    return () => area.removeEventListener("pointermove", onMove);
  }, [setPos]);

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>useRafState</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Move your pointer over the area — the dot follows, but state commits at
        most <strong>once per frame</strong>
      </p>

      <div
        ref={areaRef}
        data-testid="area"
        className="relative mb-5 h-64 overflow-hidden rounded-md border border-zinc-200 bg-violet-50 shadow-inner"
      >
        <div
          data-testid="dot"
          className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600"
          style={{ left: pos.x, top: pos.y }}
        />
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Position:{" "}
          <span className={storyTheme.statValue} data-testid="pos">
            {Math.round(pos.x)}, {Math.round(pos.y)}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          Renders (frame-capped):{" "}
          <span className={storyTheme.statValue} data-testid="renders">
            {renders.current}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Batching demo — a single click fires 100 synchronous `setCount` calls. With
 * plain `useState` that is 100 committed values; with `useRafState` only the
 * **last** one commits (last-write-wins), in a single re-render.
 */
function BatchingDemo() {
  const [count, setCount] = useRafState(0);
  const renders = useRef(0);
  renders.current += 1;

  const commitsRef = useRef(0);
  // Count how many times the committed value actually changed.
  useEffect(() => {
    commitsRef.current += 1;
  }, [count]);

  const burst = () => {
    for (let i = 1; i <= 100; i++) setCount(i);
  };

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>rAF batching</h2>
      <p className={storyTheme.subtitle}>
        One click = 100 <code>setCount</code> calls, coalesced to a single commit
      </p>

      <div className={`${storyTheme.statBox} mb-5`}>
        <p className={storyTheme.statLabel}>
          Committed value:{" "}
          <span className={storyTheme.statValue} data-testid="value">
            {count}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          Renders:{" "}
          <span className={storyTheme.statValue} data-testid="renders">
            {renders.current}
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={burst}
        data-testid="burst"
        className={storyTheme.buttonPrimary}
      >
        Fire 100 updates
      </button>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof PointerFollowerDemo> = {
  title: "Hooks/useRafState",
  component: PointerFollowerDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `A drop-in replacement for \`useState\` that **batches** every update to \`requestAnimationFrame\`, so a burst of rapid \`setState\` calls (scroll, resize, pointer move, animation loops) coalesces to **at most one commit per frame** — smoother UI and far fewer wasted re-renders.

The public API matches \`useState\` exactly: a direct value **or** a lazy initializer, and a setter that takes a next value **or** a functional updater.

## Features
- **Drop-in \`useState\` API** - same \`[state, setState]\` tuple, direct value or lazy \`() => T\` init
- **rAF batching** - rapid updates coalesce to one commit per frame (**last-write-wins**)
- **Stable setter** - \`useCallback([])\`, safe as a child prop or effect dependency
- **Cancel on unmount** - pending frame is cancelled, no setState after unmount
- **SSR-safe** - never touches \`requestAnimationFrame\` at import; falls back to a synchronous update when rAF is unavailable
- **StrictMode / concurrent-safe** - no leaked or double-applied frames

## Coalescing
Only the **latest** call in a frame commits. Functional updaters follow the same rule — of \`setState(n => n+1)\` called three times in one frame, only the last runs (commits \`1\`, not \`3\`). To accumulate within a frame, set an absolute value instead.

## Basic Usage
\`\`\`tsx
const [pos, setPos] = useRafState({ x: 0, y: 0 });

useEffect(() => {
  const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
  window.addEventListener("pointermove", onMove);
  return () => window.removeEventListener("pointermove", onMove);
}, [setPos]);
\`\`\`
`,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PointerFollowerDemo>;

export const PointerFollower: Story = {
  render: () => <PointerFollowerDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Track the pointer smoothly — every `pointermove` calls `setPos`, but commits are capped to one per animation frame.",
      },
      source: {
        language: "tsx",
        code: `import { useEffect } from "react";
import { useRafState } from "@usefy/use-raf-state";

function PointerFollower() {
  const [pos, setPos] = useRafState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) =>
      setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [setPos]);

  return (
    <div style={{ transform: \`translate(\${pos.x}px, \${pos.y}px)\` }}>
      following you
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const area = canvas.getByTestId("area");

    fireEvent.pointerMove(area, { clientX: 200, clientY: 160 });

    // The dot repositions after the next frame.
    await waitFor(() => {
      expect(canvas.getByTestId("pos")).not.toHaveTextContent("120, 90");
    });
  },
};

export const Batching: Story = {
  render: () => <BatchingDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Fire 100 synchronous updates in one click — `useRafState` coalesces them to the last value in a single re-render.",
      },
      source: {
        language: "tsx",
        code: `import { useRafState } from "@usefy/use-raf-state";

function Burst() {
  const [count, setCount] = useRafState(0);

  // 100 calls → one commit of the final value (last-write-wins)
  const burst = () => {
    for (let i = 1; i <= 100; i++) setCount(i);
  };

  return (
    <>
      <p>Committed value: {count}</p>
      <button onClick={burst}>Fire 100 updates</button>
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByTestId("value")).toHaveTextContent("0");

    fireEvent.click(canvas.getByTestId("burst"));

    // Only the final value commits, after the frame.
    await waitFor(() => {
      expect(canvas.getByTestId("value")).toHaveTextContent("100");
    });
  },
};

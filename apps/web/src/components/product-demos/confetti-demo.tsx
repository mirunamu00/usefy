"use client";

import { useRef } from "react";
import { Confetti, textShape, type ConfettiController } from "@usefy/confetti";
import { DemoShell, DemoButton } from "./demo-shell";

/** Live @usefy/confetti scoped to this panel (inline variant). */
export function ConfettiDemo() {
  const controller = useRef<ConfettiController>(null);

  return (
    <DemoShell hint='fireConfetti() also works as a one-liner over the whole viewport — try the hero.'>
      <div className="relative flex h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
        <Confetti variant="inline" controllerRef={controller} className="pointer-events-none absolute inset-0" />
        <p className="font-mono text-xs text-fg-subtle">variant=&quot;inline&quot; — bursts stay in this box</p>
        <div className="flex flex-wrap justify-center gap-2">
          <DemoButton
            primary
            onClick={() => void controller.current?.fire({ count: 120, spread: 75, origin: { y: 0.7 } })}
          >
            Burst
          </DemoButton>
          <DemoButton
            onClick={() =>
              void controller.current?.fire({
                count: 40,
                spread: 90,
                scalar: 1.6,
                shapes: [textShape("🎉"), textShape("🪝")],
                origin: { y: 0.7 },
              })
            }
          >
            Emoji shapes
          </DemoButton>
          <DemoButton
            onClick={() => {
              void controller.current?.fire({ count: 60, angle: 60, spread: 40, origin: { x: 0, y: 0.9 } });
              void controller.current?.fire({ count: 60, angle: 120, spread: 40, origin: { x: 1, y: 0.9 } });
            }}
          >
            Side cannons
          </DemoButton>
        </div>
      </div>
    </DemoShell>
  );
}

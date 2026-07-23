"use client";

import { useEffect, useRef } from "react";
import { Confetti, type ConfettiController } from "@usefy/confetti";

/**
 * Inline confetti layer for the confetti product card — a real @usefy/confetti
 * engine scoped to the card. Loaded lazily on first hover; re-fires whenever
 * `fireKey` increments.
 */
export function CardConfetti({ fireKey }: { fireKey: number }) {
  const controller = useRef<ConfettiController>(null);

  useEffect(() => {
    if (fireKey === 0) return;
    void controller.current?.fire({
      count: 26,
      spread: 75,
      startVelocity: 20,
      scalar: 0.75,
      lifetime: 1600,
      origin: { x: 0.5, y: 0.85 },
    });
  }, [fireKey]);

  return (
    <Confetti
      variant="inline"
      controllerRef={controller}
      className="pointer-events-none absolute inset-0"
    />
  );
}

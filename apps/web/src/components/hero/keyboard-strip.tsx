"use client";

import { useState } from "react";
import { VirtualKeyboard, numericLayout } from "@usefy/virtual-keyboard";

/**
 * The hero's virtual-keyboard demo: a real @usefy/virtual-keyboard PIN pad
 * bound to a masked value. Loaded lazily when its tab is opened.
 */
export function KeyboardStrip() {
  const [pin, setPin] = useState("");

  return (
    <div className="border-t px-4 py-3" style={{ borderColor: "var(--code-border)" }}>
      <div className="mb-2 flex items-center justify-between font-mono text-[13px]">
        <span className="text-white/35">pin</span>
        <span className="tracking-[0.35em] text-white" aria-hidden="true">
          {pin ? "•".repeat(Math.min(pin.length, 6)) : <span className="text-white/25">— — —</span>}
        </span>
        <span role="status" className="sr-only">
          {pin.length} digits entered
        </span>
      </div>
      <VirtualKeyboard
        layouts={numericLayout}
        value={pin}
        onChange={setPin}
        maxLength={6}
        theme="dark"
        ariaLabel="Demo PIN pad"
      />
    </div>
  );
}

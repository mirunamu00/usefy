"use client";

import { useRef } from "react";
import { VirtualKeyboard, qwertyLayout, numericLayout } from "@usefy/virtual-keyboard";
import { useSiteTheme } from "@/lib/use-site-theme";
import { DemoShell } from "./demo-shell";

/** Live @usefy/virtual-keyboard bound to a real input (ref-bound mode). */
export function VirtualKeyboardDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useSiteTheme();

  return (
    <DemoShell hint="inputRef binds the keyboard to the field above — caret position, selection, and maxLength all respected.">
      <label className="block">
        <span className="font-mono text-xs text-fg-subtle">Type with the keys below</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="kiosk-mode input"
          className="focusable mt-2 h-11 w-full rounded-xl border border-border bg-bg px-4 text-sm text-fg placeholder:text-fg-subtle"
        />
      </label>
      <div className="mt-4">
        <VirtualKeyboard
          inputRef={inputRef}
          layouts={[qwertyLayout, numericLayout]}
          theme={theme}
          ariaLabel="Demo on-screen keyboard"
        />
      </div>
    </DemoShell>
  );
}

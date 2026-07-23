"use client";

import { useRef } from "react";
import { SpotlightTour, type TourController, type TourStep } from "@usefy/spotlight-tour";
import { useSiteTheme } from "@/lib/use-site-theme";
import { DemoShell, DemoButton } from "./demo-shell";

/** Live @usefy/spotlight-tour over a mock mini-app inside the panel. */
export function SpotlightTourDemo() {
  const controller = useRef<TourController>(null);
  const theme = useSiteTheme();

  const searchRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLDivElement>(null);
  const inboxRef = useRef<HTMLDivElement>(null);

  const steps: TourStep[] = [
    {
      target: searchRef,
      title: "Search",
      content: "Steps can target a selector, a ref, or a function. This one is a ref.",
      placement: "bottom",
    },
    {
      target: composeRef,
      title: "Compose",
      content: "The spotlight tracks the element through scroll and resize.",
      placement: "bottom",
    },
    {
      target: inboxRef,
      title: "Inbox",
      content: "Arrow keys navigate, Esc skips, and progress persists via tourId if you want.",
      placement: "top",
    },
  ];

  return (
    <DemoShell hint="The overlay, tooltip, and keyboard handling are the shipped component — nothing here is mocked.">
      <div className="rounded-xl border border-border bg-bg p-4">
        <div className="flex items-center gap-2">
          <div
            ref={searchRef}
            className="flex h-9 flex-1 items-center rounded-lg border border-border px-3 font-mono text-xs text-fg-subtle"
          >
            Search…
          </div>
          <div
            ref={composeRef}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium"
            style={{ background: "var(--accent, var(--brand))", color: "var(--bg)" }}
          >
            Compose
          </div>
        </div>
        <div ref={inboxRef} className="mt-3 space-y-1.5">
          {["Design review at 3pm", "Your build passed 🎉", "Weekly digest"].map((s) => (
            <div key={s} className="rounded-lg border border-border px-3 py-2 text-[13px] text-fg-muted">
              {s}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <DemoButton primary onClick={() => controller.current?.start(0)}>
            Start the tour
          </DemoButton>
        </div>
      </div>

      <SpotlightTour steps={steps} controllerRef={controller} theme={theme} overlayClick="close" />
    </DemoShell>
  );
}

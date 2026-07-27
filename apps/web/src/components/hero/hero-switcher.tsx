"use client";

import dynamic from "next/dynamic";
import { useId, useState } from "react";
import { useInterval } from "@usefy/use-interval";
import { useReducedMotion } from "@usefy/use-reduced-motion";
import { LiveToggleDemo } from "@/components/live-toggle-demo";
import { startSiteTour } from "@/lib/tour-event";
import { cn } from "@/lib/cn";

const KeyboardStrip = dynamic(
  () => import("./keyboard-strip").then((m) => m.KeyboardStrip),
  {
    ssr: false,
    loading: () => (
      // Height-matched to the mounted PIN pad so the swap doesn't jump.
      <div
        className="flex h-[236px] items-center justify-center border-t font-mono text-xs text-white/35"
        style={{ borderColor: "var(--code-border)" }}
      >
        loading keyboard…
      </div>
    ),
  },
);

export interface HeroTab {
  id: "use-toggle" | "confetti" | "spotlight-tour" | "virtual-keyboard";
  label: string;
  file: string;
  /** Plain source (drives the typing animation + layout sizing). */
  code: string;
  /** Shiki-highlighted HTML (server-rendered), faded in once typing lands. */
  html: string;
  caption: string;
}

const TYPE_CHARS_PER_TICK = 3;
const TYPE_TICK_MS = 12;

/**
 * The hero's product switcher: four tools, each shown as an editor pane whose
 * code types itself in (use-interval), lights up with syntax colors when it
 * lands, and runs live below. Each pane demos a different @usefy product.
 */
export function HeroSwitcher({ tabs }: { tabs: HeroTab[] }) {
  const uid = useId();
  // initializeWithValue: false → the first client render matches the server
  // (false), then an effect flips to the real preference. Without it,
  // reduced-motion visitors hydrate with a fully-typed pane against the
  // server's empty one → React #418 hydration mismatch.
  const reducedMotion = useReducedMotion({ initializeWithValue: false });
  const [activeId, setActiveId] = useState<HeroTab["id"]>(tabs[0].id);
  const [typed, setTyped] = useState(0);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const done = reducedMotion || typed >= active.code.length;

  useInterval(
    () => setTyped((n) => Math.min(n + TYPE_CHARS_PER_TICK, active.code.length)),
    done ? null : TYPE_TICK_MS,
  );

  const selectTab = (id: HeroTab["id"]) => {
    if (id === activeId) return;
    setActiveId(id);
    setTyped(0);
  };

  return (
    <div
      className="w-full max-w-md overflow-hidden rounded-2xl border shadow-[var(--shadow-card)]"
      style={{ background: "var(--code-bg)", borderColor: "var(--code-border)" }}
    >
      {/* Editor chrome: traffic lights + product tabs. */}
      <div
        className="flex items-center gap-2 border-b px-4 py-2.5"
        style={{ borderColor: "var(--code-border)" }}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" aria-hidden="true" />
        <span className="ml-2 truncate font-mono text-xs text-white/40">{active.file}</span>
      </div>

      {/* The rule lives on the wrapper, not the scroller: the strip is pulled
          1px down over it so the active tab's underline overlaps the rule
          instead of stacking above it. Keeping that -1px on the scroller
          rather than on the tabs is what stops the tabs from overflowing
          their own scroll container and raising a stray vertical scrollbar. */}
      <div className="border-b" style={{ borderColor: "var(--code-border)" }}>
        <div
          role="tablist"
          aria-label="usefy products"
          className="rail-scroll -mb-px flex items-center gap-1 px-2"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`${uid}-tab-${t.id}`}
              role="tab"
              aria-selected={activeId === t.id}
              aria-controls={`${uid}-panel`}
              tabIndex={activeId === t.id ? 0 : -1}
              onClick={() => selectTab(t.id)}
              onKeyDown={(e) => {
                let next: HeroTab | undefined;
                const i = tabs.findIndex((x) => x.id === activeId);
                if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
                else if (e.key === "ArrowLeft") next = tabs[(i + tabs.length - 1) % tabs.length];
                else if (e.key === "Home") next = tabs[0];
                else if (e.key === "End") next = tabs[tabs.length - 1];
                if (!next) return;
                e.preventDefault();
                selectTab(next.id);
                document.getElementById(`${uid}-tab-${next.id}`)?.focus();
              }}
              className={cn(
                "focusable-inset shrink-0 border-b-2 px-2.5 py-2 font-mono text-[11px] transition-colors",
                activeId === t.id
                  ? "border-brand text-white"
                  : "border-transparent text-white/40 hover:text-white/70",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${activeId}`}>
        {/* Code pane: ALL sources render invisibly stacked in one grid cell,
            so the pane holds the tallest tab's height and switching tabs
            never snaps the layout. Typed + highlighted layers sit on top. */}
        <div translate="no" className="notranslate relative text-[13px]">
          <div aria-hidden="true" className="grid">
            {tabs.map((t) => (
              <pre
                key={t.id}
                className="invisible col-start-1 row-start-1 whitespace-pre-wrap px-[1.15rem] py-4 font-mono leading-[1.65]"
              >
                {t.code}
              </pre>
            ))}
          </div>

          <pre
            aria-hidden={done}
            className={cn(
              "absolute inset-0 overflow-hidden whitespace-pre-wrap px-[1.15rem] py-4 font-mono leading-[1.65] text-[#c9d1e0] transition-opacity duration-300",
              done ? "opacity-0" : "opacity-100",
            )}
          >
            {active.code.slice(0, reducedMotion ? active.code.length : typed)}
            {!done && <span className="type-caret" aria-hidden="true" />}
          </pre>

          <div
            className={cn(
              "code-scroll absolute inset-0 overflow-auto transition-opacity duration-300",
              done ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={!done}
            dangerouslySetInnerHTML={{ __html: active.html }}
          />
        </div>

        {/* Live strip: the code above, actually running. */}
        <DemoStrip id={active.id} />

        <p
          className="border-t px-4 py-2.5 text-center font-mono text-[11px] text-white/35"
          style={{ borderColor: "var(--code-border)" }}
        >
          {active.caption}
        </p>
      </div>
    </div>
  );
}

function DemoStrip({ id }: { id: HeroTab["id"] }) {
  // Uniform strip height across the three single-row demos, so switching
  // tabs never nudges the card (the keyboard tab is intentionally taller).
  const strip = (node: React.ReactNode) => <div className="grid min-h-[64px] items-stretch">{node}</div>;
  switch (id) {
    case "use-toggle":
      return strip(<LiveToggleDemo />);
    case "confetti":
      return strip(<ConfettiStrip />);
    case "spotlight-tour":
      return strip(<TourStrip />);
    case "virtual-keyboard":
      return <KeyboardStrip />;
  }
}

function ConfettiStrip() {
  // Overlapping bursts are the fun — the engine pools particles, so rapid
  // clicks are cheap. Only the module load is deduped (by the bundler).
  const fire = async () => {
    const { fireConfetti } = await import("@usefy/confetti");
    void fireConfetti({ count: 140, spread: 80, origin: { y: 0.6 } });
  };

  return (
    <div
      className="flex items-center justify-between gap-4 border-t px-4 py-3.5"
      style={{ borderColor: "var(--code-border)" }}
    >
      <span className="font-mono text-[13px] text-white/35">onClick</span>
      <button
        type="button"
        onClick={() => void fire()}
        className="focusable brand-gradient inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-white transition-[filter] hover:brightness-110"
      >
        Ship it 🎉
      </button>
    </div>
  );
}

function TourStrip() {
  return (
    <div
      className="flex items-center justify-between gap-4 border-t px-4 py-3.5"
      style={{ borderColor: "var(--code-border)" }}
    >
      <span className="font-mono text-[13px] text-white/35">controller.start()</span>
      <button
        type="button"
        onClick={startSiteTour}
        className="focusable inline-flex h-9 items-center rounded-lg border border-white/20 px-4 text-sm font-medium text-white transition-colors hover:border-white/40"
      >
        Tour this page
      </button>
    </div>
  );
}

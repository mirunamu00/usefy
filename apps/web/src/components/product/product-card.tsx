"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useHover } from "@usefy/use-hover";
import { useIntersectionObserver } from "@usefy/use-intersection-observer";
import { useMergedRefs } from "@usefy/use-merged-refs";
import { encodeQR, toSVGProps } from "@usefy/qr-code/headless";
import type { ProductMeta } from "@/data/products";
import { cn } from "@/lib/cn";

const CardConfetti = dynamic(
  () => import("./card-confetti").then((m) => m.CardConfetti),
  { ssr: false },
);

/** Hook names rolled by the flagship card's slot-machine demo. */
const ROLL_NAMES = [
  "useToggle",
  "useDebounce",
  "useLocalStorage",
  "useIntersectionObserver",
  "useHotkeys",
  "useAsync",
  "useDarkMode",
  "useFocusTrap",
  "useMediaQuery",
  "useOnClickOutside",
];

/**
 * Rows for the json-viewer card.
 *
 * Deliberately a *window* into the middle of a document — the indices start at
 * 4905, not at 0 — because "you are somewhere inside something enormous" is
 * what the package is for.
 */
const JSON_ROWS = [
  { key: "4905", value: "{ 6 keys }" },
  { key: "4906", value: "{ 6 keys }" },
  { key: "4907", value: "{ 6 keys }" },
  { key: "4908", value: "{ 6 keys }" },
  { key: "4909", value: "{ 6 keys }" },
  { key: "4910", value: "{ 6 keys }" },
];

/**
 * The QR card shows a genuine code, encoded once at module scope. Encoding is
 * a pure function, so this costs nothing per render and the card demonstrates
 * the product rather than a drawing of it.
 */
const QR_DEMO = toSVGProps(encodeQR("https://usefy.dev/packages/qr-code", { level: "M" }), {
  // The spec's full quiet zone and dark-on-light polarity, because a card that
  // claims to show a scannable code should not model what the package warns
  // about. The accent colours the scanning beam, not the modules.
  margin: 4,
  bg: null,
});

export interface ProductCardProps {
  name: string;
  href: string;
  role: string;
  tagline: string;
  accentVar: string;
  demo: ProductMeta["demo"];
  /** Flagship (hooks umbrella) two-column layout. */
  wide?: boolean;
  external?: boolean;
  cta?: string;
}

/**
 * A product tile whose hover state IS the product demo: confetti bursts,
 * the progress bar fills, the sparkline draws, the mini keyboard types.
 * On touch devices the demo plays when the card scrolls into view instead
 * (hover doesn't exist there). All motion is neutralized by the global
 * prefers-reduced-motion override.
 */
export function ProductCard({
  name,
  href,
  role,
  tagline,
  accentVar,
  demo,
  wide = false,
  cta = "View docs →",
}: ProductCardProps) {
  const { ref: hoverRef, isHovered } = useHover<HTMLAnchorElement>();
  const { ref: viewRef, inView } = useIntersectionObserver({ threshold: 0.55 });
  // A stable merged ref — an inline `(n) => { a(n); b(n); }` would re-run on
  // every render and loop the observer (React error #185).
  const cardRef = useMergedRefs<HTMLAnchorElement>(hoverRef, viewRef);
  const [isTouch, setIsTouch] = useState(false);
  const [fireKey, setFireKey] = useState(0);

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  const live = isTouch && inView;
  const playing = isHovered || live;

  // The confetti card actually fires its engine when the demo triggers.
  useEffect(() => {
    if (demo === "confetti-burst" && playing) setFireKey((k) => k + 1);
  }, [demo, playing]);

  return (
    <Link
      href={href}
      ref={cardRef}
      className={cn(
        "pcard focusable group relative flex flex-col rounded-2xl border border-border bg-surface/40 p-5",
        live && "demo-live",
      )}
      style={{ "--accent": `var(${accentVar})` } as React.CSSProperties}
    >
      <span className={cn("pcard-bar", demo === "progress-fill" && "pcard-bar--slow")} aria-hidden="true" />

      <div className={cn(wide && "sm:grid sm:grid-cols-[1.2fr_1fr] sm:items-center sm:gap-8")}>
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center justify-between gap-3">
            <code translate="no" className="notranslate break-words font-mono text-[15px] font-semibold text-fg">
              {name}
            </code>
            <span
              className="shrink-0 font-mono text-[10px] uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              {role}
            </span>
          </div>
          <p className={cn("mt-2 text-[13px] leading-relaxed text-fg-muted", wide ? "line-clamp-3" : "line-clamp-2")}>
            {tagline}
          </p>
          {wide ? (
            <span className="mt-4 hidden font-mono text-sm sm:block" style={{ color: "var(--accent)" }}>
              {cta}
            </span>
          ) : null}
        </div>

        <div className={cn("mt-4", wide && "sm:mt-0")}>
          <DemoStage demo={demo} />
        </div>

        {!wide ? (
          <span className="mt-4 font-mono text-sm" style={{ color: "var(--accent)" }}>
            {cta}
          </span>
        ) : null}
      </div>

      {demo === "spotlight-sweep" ? <span className="demo-sweep" aria-hidden="true" /> : null}
      {demo === "confetti-burst" && fireKey > 0 ? <CardConfetti fireKey={fireKey} /> : null}
    </Link>
  );
}

/** The per-product micro-demo area. Purely decorative — hidden from AT. */
function DemoStage({ demo }: { demo: ProductMeta["demo"] }) {
  switch (demo) {
    case "hooks-roll":
      return (
        <div className="demo-roll h-[4.5rem] font-mono text-[13px] leading-6 text-fg-subtle" aria-hidden="true">
          <ul>
            {[...ROLL_NAMES, ...ROLL_NAMES].map((n, i) => (
              <li key={`${n}-${i}`}>
                <span style={{ color: "var(--accent)" }}>use</span>
                {n.slice(3)}()
              </li>
            ))}
          </ul>
        </div>
      );

    case "confetti-burst":
      return (
        <div className="flex h-10 items-end font-mono text-xs text-fg-subtle" aria-hidden="true">
          <span>
            fireConfetti(<span style={{ color: "var(--accent)" }}>{"{ count: 26 }"}</span>)
          </span>
        </div>
      );

    case "spotlight-sweep":
      return (
        <div className="space-y-1.5" aria-hidden="true">
          <div className="h-2 w-3/4 rounded bg-border" />
          <div className="h-2 w-1/2 rounded bg-border" />
          <div className="flex items-center gap-1.5 pt-1 font-mono text-[10px] text-fg-subtle">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            step 2 of 5
          </div>
        </div>
      );

    case "signature-draw":
      return (
        <svg viewBox="0 0 120 40" className="demo-sig h-12 w-full" aria-hidden="true">
          {/* sign-here baseline + × marker — the ink draws itself above it */}
          <line x1="4" y1="33" x2="116" y2="33" stroke="var(--border)" strokeWidth="1" />
          <path
            d="M8 31 l4 -4 M8 27 l4 4"
            fill="none"
            stroke="var(--fg-subtle)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            pathLength={1}
            className="demo-sig-main"
            d="M18 31 C22 26 28 15 27 9 C26 5 20 7 21 13 C22 21 30 30 37 29 C42 28 44 19 47 14 C49 11 50 11 50 14 C50 19 48 26 51 28 C54 30 58 23 61 19 C63 16 64 16 64 19 C64 24 63 28 66 29 C70 30 74 24 77 20 C79 17 80 17 80 20 C80 24 79 28 82 29 C86 30 92 25 97 20"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            pathLength={1}
            className="demo-sig-tail"
            d="M36 36 C50 39 64 33 76 34 C86 35 96 37 106 34"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "memory-spark":
      return (
        <svg viewBox="0 0 120 36" preserveAspectRatio="none" className="demo-spark h-10 w-full" aria-hidden="true">
          <polyline
            pathLength={1}
            points="0,31 12,29 24,30 36,25 48,26 60,21 72,23 84,15 96,17 108,9 120,11"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <line x1="0" y1="35" x2="120" y2="35" stroke="var(--border)" strokeWidth="1" />
        </svg>
      );

    case "keyboard-type":
      return (
        <div className="flex gap-1.5" aria-hidden="true">
          {"usefy".split("").map((ch, i) => (
            <span
              key={i}
              className="demo-key inline-flex h-8 w-8 items-center justify-center rounded-md border border-border font-mono text-xs text-fg-subtle"
              style={{ "--i": i } as React.CSSProperties}
            >
              {ch}
            </span>
          ))}
        </div>
      );

    case "network-pulse":
      return (
        <div className="flex h-8 items-center gap-2 font-mono text-xs text-fg-muted" aria-hidden="true">
          <span className="demo-dot h-2.5 w-2.5 rounded-full" style={{ background: "#37b24d" }} />
          connection
          <span
            className="demo-toast ml-auto rounded-md px-2 py-1 text-[11px]"
            style={{
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              color: "var(--accent)",
            }}
          >
            Back online
          </span>
        </div>
      );

    case "progress-fill":
      return (
        <div className="space-y-1.5" aria-hidden="true">
          <div className="h-2 w-full rounded bg-border" />
          <div className="h-2 w-5/6 rounded bg-border" />
          <div className="h-2 w-2/3 rounded bg-border" />
          <p className="pt-1 font-mono text-[10px] text-fg-subtle">↑ the bar up top is the demo</p>
        </div>
      );

    case "diff-lines":
      return (
        <div className="demo-diff font-mono text-[11px] leading-5" aria-hidden="true">
          <div className="demo-diff-row text-fg-subtle">
            <span className="demo-diff-sign" />  const total = 0;
          </div>
          <div className="demo-diff-row demo-diff-del">
            <span className="demo-diff-sign">−</span>  items.map(x =&gt; x)
          </div>
          <div className="demo-diff-row demo-diff-add">
            <span className="demo-diff-sign">+</span>  items.map(x =&gt;{" "}
            <span className="demo-diff-word">x.value</span>)
          </div>
          <div className="demo-diff-row text-fg-subtle">
            <span className="demo-diff-sign" />  return total;
          </div>
        </div>
      );

    case "qr-scan":
      return (
        <div className="demo-qr h-[4.5rem]" aria-hidden="true">
          {/* A real code, encoded by the package itself at module scope. */}
          <span className="demo-qr-plate">
            <svg viewBox={QR_DEMO.viewBox} className="demo-qr-code" role="presentation">
              {QR_DEMO.paths.map((path, index) => (
                <path key={index} d={path.d} fill="#0f172a" />
              ))}
            </svg>
          </span>
          <span className="demo-qr-beam" />
        </div>
      );

    case "json-tree":
      return (
        <div
          className="demo-json h-[4.5rem] font-mono text-[11px] leading-5 text-fg-subtle"
          aria-hidden="true"
        >
          <ul>
            {[...JSON_ROWS, ...JSON_ROWS].map((row, index) => (
              <li key={`${row.key}-${index}`} className="whitespace-nowrap">
                <span className="demo-json-key">{row.key}</span>: {row.value}
              </li>
            ))}
          </ul>
          <span className="demo-json-count">375,006 rows</span>
        </div>
      );

    case "qr-viewfinder":
      return (
        <div className="demo-scan h-[4.5rem]" aria-hidden="true">
          {/* The camera's view: a real code, slightly askew, the way one
              actually arrives in a viewfinder. */}
          <span className="demo-scan-frame">
            <svg viewBox={QR_DEMO.viewBox} className="demo-scan-code" role="presentation">
              {QR_DEMO.paths.map((path, index) => (
                <path key={index} d={path.d} fill="#0f172a" />
              ))}
            </svg>
            <span className="demo-scan-lock" />
          </span>
          <span className="demo-scan-bracket demo-scan-tl" />
          <span className="demo-scan-bracket demo-scan-tr" />
          <span className="demo-scan-bracket demo-scan-bl" />
          <span className="demo-scan-bracket demo-scan-br" />
        </div>
      );

    case "none":
      return null;
  }
}

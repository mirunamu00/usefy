"use client";

import { useRef, useState } from "react";
import {
  QRCode,
  logoSafety,
  useQRCode,
  type ErrorCorrectionLevel,
  type QRCodeController,
  type QREyeShape,
  type QRModuleShape,
} from "@usefy/qr-code";
import { DemoButton, DemoShell } from "./demo-shell";
import { cn } from "@/lib/cn";

const LEVELS: ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];
const MODULE_SHAPES: QRModuleShape[] = ["square", "rounded", "dot", "classy"];
const EYE_SHAPES: QREyeShape[] = ["square", "rounded", "circle", "leaf"];

/** Inline so the demo makes no network request and PNG export never taints. */
const LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<rect width="64" height="64" rx="16" fill="#087f5b"/>' +
    '<text x="32" y="45" font-family="system-ui,sans-serif" font-size="34" font-weight="700" ' +
    'fill="#ffffff" text-anchor="middle">U</text></svg>',
)}`;

function Choices<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={option === value}
            className={cn(
              "focusable rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              option === value
                ? "border-transparent text-[var(--bg)]"
                : "border-border text-fg-muted hover:border-border-strong",
            )}
            style={option === value ? { background: "var(--accent, var(--brand))" } : undefined}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function QRCodeDemo() {
  const [value, setValue] = useState("https://usefy.dev/packages/qr-code");
  const [level, setLevel] = useState<ErrorCorrectionLevel>("H");
  const [moduleShape, setModuleShape] = useState<QRModuleShape>("rounded");
  const [eyeShape, setEyeShape] = useState<QREyeShape>("circle");
  const [withLogo, setWithLogo] = useState(true);
  const [logoSize, setLogoSize] = useState(0.2);
  const controller = useRef<QRCodeController>(null);

  const safePayload = value.trim() || "https://usefy.dev";
  const logo = withLogo ? { src: LOGO, size: logoSize } : undefined;
  // Encoding through the hook rather than calling `encodeQR` in render: an
  // over-long value must surface as a message, not take the page down with it.
  // The LRU makes this share its work with the <QRCode /> below.
  const { matrix, error } = useQRCode({ value: safePayload, level });
  const safety = matrix ? logoSafety(matrix, { logo }) : null;

  return (
    <DemoShell hint="Point your phone at it — this is a real code. Oversize the logo for its error-correction level and the package tells you before a scanner does.">
      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-fg-subtle">
              Encode
            </span>
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              spellCheck={false}
              className="focusable w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg"
              aria-label="Text to encode"
            />
          </label>

          <Choices label="Error correction" options={LEVELS} value={level} onChange={setLevel} />
          <Choices label="Modules" options={MODULE_SHAPES} value={moduleShape} onChange={setModuleShape} />
          <Choices label="Finder eyes" options={EYE_SHAPES} value={eyeShape} onChange={setEyeShape} />

          <div>
            <button
              type="button"
              onClick={() => setWithLogo((on) => !on)}
              aria-pressed={withLogo}
              className="focusable font-mono text-[11px] uppercase tracking-wider text-fg-subtle hover:text-fg"
            >
              Logo: {withLogo ? "on" : "off"}
            </button>
            {withLogo ? (
              <div className="mt-2">
                <input
                  type="range"
                  min={0.05}
                  max={0.35}
                  step={0.01}
                  value={logoSize}
                  onChange={(event) => setLogoSize(Number(event.target.value))}
                  className="w-full accent-[var(--accent,var(--brand))]"
                  aria-label="Logo size"
                />
                {safety ? (
                  <p
                    className={cn(
                      "mt-1 text-[11px]",
                      safety.safe ? "text-fg-subtle" : "font-semibold text-red-500",
                    )}
                  >
                    {safety.safe
                      ? `Covers ${(safety.occludedRatio * 100).toFixed(0)}% — level ${level} recovers ~${(safety.ecBudget * 100).toFixed(0)}%.`
                      : `Covers ${(safety.occludedRatio * 100).toFixed(0)}% — too much for level ${level}.${
                          safety.recommendedLevel ? ` Try ${safety.recommendedLevel}.` : ""
                        }`}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <DemoButton primary onClick={() => controller.current?.download("png", "usefy-qr.png")}>
              Download PNG
            </DemoButton>
            <DemoButton onClick={() => controller.current?.download("svg", "usefy-qr.svg")}>
              Download SVG
            </DemoButton>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          {error ? (
            // Exactly the behaviour the package promises: the failure is
            // reported, the surrounding UI keeps working.
            <div
              className="flex h-[212px] w-[212px] items-center justify-center rounded-xl border border-red-500/40 bg-red-500/5 p-4 text-center text-[11px] leading-relaxed text-red-500"
              role="status"
            >
              Too much data for one QR code at level {level}. Shorten the text, or drop to a lower
              error-correction level.
            </div>
          ) : (
            <div
              className={cn(
                "rounded-xl bg-white p-3 ring-2 transition-colors",
                safety?.safe === false ? "ring-red-500" : "ring-transparent",
              )}
            >
              <QRCode
                controllerRef={controller}
                value={safePayload}
                size={188}
                level={level}
                moduleShape={moduleShape}
                eyeShape={eyeShape}
                logo={logo}
                title={`QR code for ${safePayload}`}
              />
            </div>
          )}
          {/* The verdict belongs next to the artifact it is about — a visitor
              should never be looking at a code that quietly does not scan. */}
          {!error && safety ? (
            <p
              className={cn(
                "text-center text-[11px] font-semibold",
                safety.safe ? "text-fg-subtle" : "text-red-500",
              )}
              role={safety.safe ? undefined : "status"}
            >
              {safety.safe
                ? "Scannable"
                : `Won’t scan reliably — the logo needs level ${safety.recommendedLevel ?? "H"}`}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-4 border-t border-border pt-3 font-mono text-[11px] text-fg-subtle">
        {matrix
          ? `version ${matrix.version} · ${matrix.size}×${matrix.size} modules · mask ${matrix.mask}`
          : `${error?.name ?? "Error"} — reported, not thrown`}
      </p>
    </DemoShell>
  );
}

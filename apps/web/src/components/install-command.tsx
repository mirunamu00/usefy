"use client";

import { useState } from "react";
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";
import { cn } from "@/lib/cn";

const MANAGERS = [
  { id: "npm", cmd: (pkg: string) => `npm install ${pkg}` },
  { id: "pnpm", cmd: (pkg: string) => `pnpm add ${pkg}` },
  { id: "yarn", cmd: (pkg: string) => `yarn add ${pkg}` },
  { id: "bun", cmd: (pkg: string) => `bun add ${pkg}` },
] as const;

/** Package-manager tabbed install command with copy. Dogfoods the copy hook. */
export function InstallCommand({ pkg, className }: { pkg: string; className?: string }) {
  const [manager, setManager] = useState<(typeof MANAGERS)[number]["id"]>("npm");
  const [copiedText, copy] = useCopyToClipboard();
  const command = MANAGERS.find((m) => m.id === manager)!.cmd(pkg);
  const copied = copiedText === command;

  return (
    <div
      translate="no"
      className={cn("notranslate overflow-hidden rounded-xl border", className)}
      style={{ background: "var(--code-bg)", borderColor: "var(--code-border)" }}
    >
      <div
        className="flex items-center gap-1 border-b px-2"
        style={{ borderColor: "var(--code-border)" }}
        role="tablist"
        aria-label="Package manager"
      >
        {MANAGERS.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={manager === m.id}
            onClick={() => setManager(m.id)}
            className={cn(
              "focusable -mb-px border-b-2 px-3 py-2 font-mono text-xs transition-colors",
              manager === m.id
                ? "border-brand text-white"
                : "border-transparent text-white/40 hover:text-white/70",
            )}
          >
            {m.id}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <code className="select-all font-mono text-[13.5px] text-code-fg">
          <span className="text-white/35">$ </span>
          {command}
        </code>
        <button
          type="button"
          onClick={() => void copy(command)}
          aria-label={copied ? "Copied" : "Copy install command"}
          className="focusable inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="9" y="9" width="11" height="11" rx="2.4" stroke="currentColor" strokeWidth="1.8" />
              <path d="M5 15V5a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

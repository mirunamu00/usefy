import { highlight } from "@/lib/highlight";
import { cn } from "@/lib/cn";
import { CopyButton } from "./copy-button";

/**
 * A dark "editor pane" code block, highlighted at build time with shiki.
 * Optionally shows a filename tab bar and a copy button.
 */
export async function CodeBlock({
  code,
  lang = "tsx",
  filename,
  copy = true,
  className,
}: {
  code: string;
  lang?: string;
  filename?: string;
  copy?: boolean;
  className?: string;
}) {
  const html = await highlight(code, lang);

  return (
    <div
      translate="no"
      className={cn(
        "notranslate code-surface overflow-hidden rounded-xl border text-[13.5px]",
        className,
      )}
      style={{ background: "var(--code-bg)", borderColor: "var(--code-border)" }}
    >
      {filename ? (
        <div
          className="flex items-center justify-between border-b px-4 py-2"
          style={{ borderColor: "var(--code-border)" }}
        >
          <span className="font-mono text-xs text-white/45">{filename}</span>
          {copy ? <CopyButton value={code} className="-mr-1.5" /> : null}
        </div>
      ) : null}

      <div className="group relative">
        {copy && !filename ? (
          <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <CopyButton value={code} />
          </div>
        ) : null}
        <div className="code-scroll overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

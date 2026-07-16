import Link from "next/link";
import type { PackageLite } from "@/data/registry";
import { categoryMeta } from "@/data/registry";
import { cn } from "@/lib/cn";

export function PackageCard({ pkg, className }: { pkg: PackageLite; className?: string }) {
  const cat = categoryMeta(pkg.category);
  return (
    <Link
      href={`/packages/${pkg.slug}`}
      className={cn(
        "focusable group relative flex flex-col rounded-xl border border-border bg-surface/40 p-4 transition-all hover:border-brand/50 hover:bg-surface",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <code translate="no" className="notranslate font-mono text-[15px] font-medium text-fg group-hover:text-brand">
          {pkg.displayName}
        </code>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
          {pkg.kind}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-fg-muted">{pkg.tagline}</p>
      <div className="mt-3 flex items-center gap-2 pt-1">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-fg-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-brand/60" aria-hidden="true" />
          {cat.title}
        </span>
      </div>
    </Link>
  );
}

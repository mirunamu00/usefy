"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PackageLite, CategoryMeta } from "@/data/registry";
import { cn } from "@/lib/cn";
import { PackageCard } from "./package-card";

type Family = "all" | "hooks" | "standalone";

const FAMILY_TABS: Array<{ id: Family; label: string }> = [
  { id: "all", label: "All" },
  { id: "hooks", label: "Hooks" },
  { id: "standalone", label: "Components" },
];

export function PackageExplorer({
  items,
  categories,
}: {
  items: PackageLite[];
  categories: CategoryMeta[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  // Seed the category filter from ?cat= so landing-page category cards deep-link.
  const [category, setCategory] = useState<string | null>(() => {
    const cat = searchParams.get("cat");
    return cat && categories.some((c) => c.id === cat) ? cat : null;
  });

  // `family` is derived from the URL so header links AND tab clicks agree, even
  // on same-route navigations (e.g. /packages?family=hooks → ?family=standalone),
  // which don't remount the component.
  const familyParam = searchParams.get("family");
  const family: Family =
    familyParam === "hooks" || familyParam === "standalone" ? familyParam : "all";

  const setFamily = (next: Family) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("family");
    else params.set("family", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const activeCategories = useMemo(
    () => categories.filter((c) => items.some((i) => i.category === c.id)),
    [categories, items],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (family !== "all" && p.family !== family) return false;
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.displayName.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [items, query, family, category]);

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle"
            width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${items.length} packages — useToggle, debounce, clipboard…`}
            aria-label="Search packages"
            className="focusable h-12 w-full rounded-xl border border-border bg-surface/50 pl-11 pr-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5" role="tablist" aria-label="Package family">
            {FAMILY_TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={family === t.id}
                onClick={() => setFamily(t.id)}
                className={cn(
                  "focusable rounded-md px-3 py-1.5 text-sm transition-colors",
                  family === t.id ? "bg-brand text-brand-fg" : "text-fg-muted hover:text-fg",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />

          <button
            onClick={() => setCategory(null)}
            className={cn(
              "focusable rounded-full border px-3 py-1 text-xs transition-colors",
              category === null
                ? "border-brand/50 bg-brand-soft text-brand"
                : "border-border text-fg-muted hover:text-fg",
            )}
          >
            All categories
          </button>
          {activeCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory((cur) => (cur === c.id ? null : c.id))}
              className={cn(
                "focusable rounded-full border px-3 py-1 text-xs transition-colors",
                category === c.id
                  ? "border-brand/50 bg-brand-soft text-brand"
                  : "border-border text-fg-muted hover:text-fg",
              )}
            >
              {c.title}
            </button>
          ))}
        </div>

        <p className="font-mono text-xs text-fg-subtle" aria-live="polite">
          {results.length} {results.length === 1 ? "package" : "packages"}
        </p>
      </div>

      {results.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((pkg) => (
            <PackageCard key={pkg.slug} pkg={pkg} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="font-mono text-sm text-fg-muted">No packages match “{query}”.</p>
          <button
            onClick={() => { setQuery(""); setCategory(null); setFamily("all"); }}
            className="focusable mt-3 rounded-lg px-3 py-1.5 text-sm text-brand hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

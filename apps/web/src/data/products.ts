import type { PackageLite } from "./registry";

/**
 * Hand-tended product identity for the same-layer "tools" usefy ships — the
 * hooks umbrella plus every standalone component. The registry stays the
 * source of truth for names/taglines/versions; this layer only adds what a
 * build script can't derive: each product's accent hue, its one-line role,
 * and which landing-page micro-demo it plays.
 *
 * Adding a standalone package? Add one entry here (and an accent token pair
 * in globals.css) or it falls back to the brand accent with no micro-demo.
 */
export interface ProductMeta {
  /** Registry slug ("confetti") or "hooks" for the umbrella. */
  slug: string;
  /** Short role label, e.g. "Celebration engine". */
  role: string;
  /** CSS var carrying the product hue (light+dark pairs in globals.css). */
  accentVar: string;
  /** Which signature micro-demo the product card plays ("none" = no stage). */
  demo:
    | "hooks-roll"
    | "confetti-burst"
    | "spotlight-sweep"
    | "memory-spark"
    | "keyboard-type"
    | "network-pulse"
    | "progress-fill"
    | "none";
}

export const PRODUCTS: ProductMeta[] = [
  { slug: "hooks", role: "The hooks umbrella", accentVar: "--accent-hooks", demo: "hooks-roll" },
  { slug: "confetti", role: "Celebration engine", accentVar: "--accent-confetti", demo: "confetti-burst" },
  { slug: "spotlight-tour", role: "Product tours", accentVar: "--accent-spotlight-tour", demo: "spotlight-sweep" },
  { slug: "memory-monitor", role: "Memory devtool", accentVar: "--accent-memory-monitor", demo: "memory-spark" },
  { slug: "virtual-keyboard", role: "On-screen input", accentVar: "--accent-virtual-keyboard", demo: "keyboard-type" },
  { slug: "network-indicator", role: "Connectivity status", accentVar: "--accent-network-indicator", demo: "network-pulse" },
  { slug: "scroll-progress", role: "Reading progress", accentVar: "--accent-scroll-progress", demo: "progress-fill" },
];

const BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));

/** Slugs with a live demo on their product page — must match the DEMOS map in
 * components/product-demos/live-demo.tsx. */
const LIVE_DEMO_SLUGS = new Set([
  "confetti",
  "scroll-progress",
  "spotlight-tour",
  "virtual-keyboard",
  "memory-monitor",
  "network-indicator",
]);

export function hasLiveDemo(slug: string): boolean {
  return LIVE_DEMO_SLUGS.has(slug);
}

// New packages without an entry get the brand accent and no micro-demo —
// never another product's demo (its caption would be wrong here).
const FALLBACK: Omit<ProductMeta, "slug"> = {
  role: "Standalone component",
  accentVar: "--accent-hooks",
  demo: "none",
};

export function productMeta(slug: string): ProductMeta {
  return BY_SLUG.get(slug) ?? { slug, ...FALLBACK };
}

/** Standalone products in PRODUCTS order, joined with their registry entries. */
export function orderedStandalone(list: PackageLite[]): Array<{ pkg: PackageLite; meta: ProductMeta }> {
  const bySlug = new Map(list.map((p) => [p.slug, p]));
  const ordered = PRODUCTS.filter((m) => m.slug !== "hooks" && bySlug.has(m.slug)).map((meta) => ({
    pkg: bySlug.get(meta.slug)!,
    meta,
  }));
  // Any standalone the meta list doesn't know yet still shows up (fallback accent).
  for (const p of list) {
    if (p.family === "standalone" && !BY_SLUG.has(p.slug)) {
      ordered.push({ pkg: p, meta: productMeta(p.slug) });
    }
  }
  return ordered;
}

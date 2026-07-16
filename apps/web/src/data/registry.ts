import { generatedPackages } from "./registry.generated";
import type { CategoryId, CategoryMeta, PackageEntry } from "./types";

export type { PackageEntry, CategoryId, CategoryMeta } from "./types";

/** All published packages, sorted by display name. */
export const packages: PackageEntry[] = generatedPackages;

/** Ordered category taxonomy — drives the docs sidebar and grid grouping. */
export const CATEGORIES: CategoryMeta[] = [
  { id: "state", title: "State & data", blurb: "Boolean, counter, list, map, set, and other state primitives." },
  { id: "lifecycle", title: "Lifecycle & refs", blurb: "Mount, unmount, previous value, stable refs, and effect timing." },
  { id: "async", title: "Timing & async", blurb: "Debounce, throttle, interval, timeout, and async task lifecycles." },
  { id: "events", title: "Events & gestures", blurb: "Clicks, keys, hover, long-press, and focus management." },
  { id: "layout", title: "Layout & observers", blurb: "Intersection, resize, mutation observers, measure, and scroll." },
  { id: "sensors", title: "Browser & device", blurb: "Geolocation, network, media queries, clipboard, and color scheme." },
  { id: "storage", title: "Storage", blurb: "localStorage, sessionStorage, and cookies as React state." },
  { id: "component", title: "Components", blurb: "Standalone, drop-in feature components." },
  { id: "misc", title: "More", blurb: "Everything else." },
];

const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.id, c]));

/** Total count for headline copy ("72 packages"). */
export const packageCount = packages.length;
export const hookCount = packages.filter((p) => p.kind === "hook").length;
export const componentCount = packages.filter((p) => p.kind === "component").length;

/** Lightweight entry for grids/search — omits the heavy markdown fields so the
 * client bundle and serialized HTML stay small. */
export type PackageLite = Pick<
  PackageEntry,
  "slug" | "name" | "displayName" | "kind" | "family" | "tagline" | "category" | "keywords"
>;

export function liteList(): PackageLite[] {
  return packages.map(({ slug, name, displayName, kind, family, tagline, category, keywords }) => ({
    slug,
    name,
    displayName,
    kind,
    family,
    tagline,
    category,
    keywords,
  }));
}

export function getPackage(slug: string): PackageEntry | undefined {
  return packages.find((p) => p.slug === slug);
}

export function categoryMeta(id: CategoryId): CategoryMeta {
  return CATEGORY_MAP.get(id) ?? { id, title: id, blurb: "" };
}

/** Packages grouped by category, in taxonomy order, skipping empty groups. */
export function packagesByCategory(): Array<{ category: CategoryMeta; items: PackageEntry[] }> {
  return CATEGORIES.map((category) => ({
    category,
    items: packages.filter((p) => p.category === category.id),
  })).filter((g) => g.items.length > 0);
}

/**
 * The top-level, same-layer "families": the hooks umbrella and each standalone
 * package. This is the ecosystem model — mm/vk sit at the same layer as hooks.
 */
export function ecosystem() {
  return {
    hooks: packages.filter((p) => p.family === "hooks"),
    standalone: packages.filter((p) => p.family === "standalone"),
  };
}

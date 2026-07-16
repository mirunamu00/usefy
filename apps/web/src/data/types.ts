/** A published usefy package as surfaced on the landing site. */
export interface PackageEntry {
  /** Directory/URL slug: "use-toggle" | "memory-monitor". */
  slug: string;
  /** Full npm name: "@usefy/use-toggle". */
  name: string;
  /** Human identifier: "useToggle" | "MemoryMonitor". */
  displayName: string;
  kind: "hook" | "component";
  /** Layer bucket: "hooks" family vs a "standalone" package. */
  family: "hooks" | "standalone";
  /** Short one-liner from package.json — canonical tagline. */
  tagline: string;
  /** Punchier README subtitle (falls back to tagline). */
  subtitle: string;
  /** package.json keywords minus the generic "react"/"hooks". */
  keywords: string[];
  version: string;
  category: CategoryId;
  /** Curated Quick Start code snippet (from the README). */
  quickStart: string;
  /** API section markdown (from the README). */
  apiMarkdown: string;
  storybookUrl: string;
  npmUrl: string;
  githubUrl: string;
  readmeUrl: string;
}

export type CategoryId =
  | "state"
  | "lifecycle"
  | "storage"
  | "sensors"
  | "events"
  | "layout"
  | "async"
  | "component"
  | "misc";

export interface CategoryMeta {
  id: CategoryId;
  title: string;
  blurb: string;
}

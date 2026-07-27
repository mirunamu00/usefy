// @ts-check
/**
 * Registry extractor — the backbone of the usefy landing site.
 *
 * Walks every published package (hooks + standalone components), reads its
 * package.json meta, and curates a scannable doc entry by extracting ONLY the
 * Quick Start snippet + API section from each README (not the whole file — the
 * badges/testing/license chrome stays on npm). Output is a typed TS module the
 * Next.js app renders and derives sitemap/search from.
 *
 * Run: `pnpm --filter @usefy/web build:registry` (or `node scripts/build-registry.mjs`)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const PKG_ROOT = join(REPO_ROOT, "packages");
const OUT_FILE = join(__dirname, "../src/data/registry.generated.ts");

/**
 * Curated category taxonomy. Keyed by package slug. This is the ONE hand-tended
 * map — everything else is derived. A slug missing here falls back to "misc"
 * (and the build warns), so adding a package surfaces here loudly.
 * @type {Record<string, string>}
 */
const CATEGORY = {
  // State & data structures
  "use-toggle": "state", "use-counter": "state", "use-list": "state",
  "use-map": "state", "use-set": "state", "use-queue": "state",
  "use-stack": "state", "use-object-state": "state", "use-history-state": "state",
  "use-controllable-state": "state", "use-selection": "state", "use-step": "state",
  "use-pagination": "state", "use-disclosure": "state", "use-signal": "state",
  "use-raf-state": "state",
  // Lifecycle & refs
  "use-mount": "lifecycle", "use-unmount": "lifecycle", "use-init": "lifecycle",
  "use-update-effect": "lifecycle", "use-is-first-render": "lifecycle",
  "use-previous": "lifecycle", "use-latest": "lifecycle", "use-event-callback": "lifecycle",
  "use-is-client": "lifecycle", "use-isomorphic-layout-effect": "lifecycle",
  "use-merged-refs": "lifecycle",
  // Storage & persistence
  "use-local-storage": "storage", "use-session-storage": "storage", "use-cookie": "storage",
  // Browser & device
  "use-geolocation": "sensors", "use-network-state": "sensors", "use-permission": "sensors",
  "use-page-visibility": "sensors", "use-media-query": "sensors",
  "use-preferred-color-scheme": "sensors", "use-reduced-motion": "sensors",
  "use-dark-mode": "sensors", "use-window-size": "sensors", "use-memory-monitor": "sensors",
  "use-script": "sensors", "use-copy-to-clipboard": "sensors", "use-document-title": "sensors",
  "use-idle": "sensors",
  // Events & gestures
  "use-event-listener": "events", "use-click-any-where": "events",
  "use-on-click-outside": "events", "use-hover": "events", "use-key-press": "events",
  "use-hotkeys": "events", "use-long-press": "events", "use-focus-trap": "events",
  "use-focus-within": "events",
  // Layout & observers
  "use-intersection-observer": "layout", "use-resize-observer": "layout",
  "use-mutation-observer": "layout", "use-measure": "layout",
  "use-scroll-position": "layout", "use-scroll-lock": "layout", "use-infinite-scroll": "layout",
  // Timing & async
  "use-debounce": "async", "use-debounce-callback": "async", "use-throttle": "async",
  "use-throttle-callback": "async", "use-interval": "async", "use-timeout": "async",
  "use-timer": "async", "use-async": "async", "use-async-fn": "async", "use-polling": "async",
  // Standalone components
  "memory-monitor": "component", "virtual-keyboard": "component",
  "network-indicator": "component", "scroll-progress": "component",
  "spotlight-tour": "component", "confetti": "component",
  "signature-pad": "component", "diff-viewer": "component",
  "qr-code": "component",
};

/** The package directories to scan, relative to packages/. */
const PACKAGE_DIRS = [
  ...listDirs(join(PKG_ROOT, "hooks")).filter((d) => d.startsWith("use-")).map((d) => `hooks/${d}`),
  "memory-monitor",
  "virtual-keyboard",
  "network-indicator",
  "scroll-progress",
  "spotlight-tour",
  "confetti",
  "signature-pad",
  "diff-viewer",
  "qr-code",
];

/** @param {string} dir */
function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
}

/**
 * Slugs whose exported identifier isn't plain PascalCase — initialisms that
 * would otherwise render as "QrCode" instead of the name people import.
 * @type {Record<string, string>}
 */
const DISPLAY_NAME_OVERRIDES = { "qr-code": "QRCode" };

/**
 * hooks slug → hook identifier: "use-toggle" → "useToggle".
 * component slug → PascalCase: "memory-monitor" → "MemoryMonitor".
 * @param {string} slug @param {"hook"|"component"} kind
 */
function toDisplayName(slug, kind) {
  const override = DISPLAY_NAME_OVERRIDES[slug];
  if (override) return override;
  const parts = slug.split("-");
  if (kind === "hook") {
    return parts.map((p, i) => (i === 0 ? p : p[0].toUpperCase() + p.slice(1))).join("");
  }
  return parts.map((p) => p[0].toUpperCase() + p.slice(1)).join("");
}

/**
 * Pull the body of a `## Heading` section (until the next `## `), given a list
 * of acceptable heading titles (case-insensitive).
 * @param {string} md @param {string[]} titles
 */
function extractSection(md, titles) {
  const lines = md.split(/\r?\n/);
  const want = titles.map((t) => t.toLowerCase());
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+?)\s*$/);
    if (m && want.includes(m[1].toLowerCase())) { start = i + 1; break; }
  }
  if (start === -1) return "";
  const out = [];
  for (let i = start; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out.join("\n").trim();
}

/** First fenced ``` code block inside a chunk of markdown. @param {string} md */
function firstCodeBlock(md) {
  const m = md.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  return m ? m[1].trim() : "";
}

/** Decode the handful of HTML entities that show up in README subtitles —
 * without this, "hooks &amp; components" renders literally on the site.
 * @param {string} s */
function decodeEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** @param {string} readme */
function extractSubtitle(readme) {
  const m = readme.match(/<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>\s*<strong>([\s\S]*?)<\/strong>/i);
  if (!m) return "";
  return decodeEntities(m[1].replace(/\s+/g, " ").trim());
}

/** @param {string} readme */
function extractStorybookUrl(readme) {
  const m = readme.match(/https:\/\/mirunamu00\.github\.io\/usefy\/\?path=[^\s"')]+/);
  return m ? m[0] : "";
}

const entries = [];
const warnings = [];

for (const rel of PACKAGE_DIRS) {
  const dir = join(PKG_ROOT, rel);
  const pkgPath = join(dir, "package.json");
  if (!existsSync(pkgPath)) { warnings.push(`no package.json: ${rel}`); continue; }
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const slug = rel.replace(/^hooks\//, "");
  const kind = slug.startsWith("use-") ? "hook" : "component";
  const readme = existsSync(join(dir, "README.md")) ? readFileSync(join(dir, "README.md"), "utf8") : "";

  const category = CATEGORY[slug];
  if (!category) warnings.push(`no category for ${slug} — defaulting to "misc"`);

  const quickStartMd = extractSection(readme, ["Quick Start", "Quickstart"]);
  const apiMarkdown = extractSection(readme, ["API Reference", "API"]);

  entries.push({
    slug,
    name: pkg.name,
    displayName: toDisplayName(slug, kind),
    kind,
    family: kind === "hook" ? "hooks" : "standalone",
    tagline: pkg.description || extractSubtitle(readme) || "",
    subtitle: extractSubtitle(readme) || pkg.description || "",
    keywords: (pkg.keywords || []).filter((k) => k !== "react" && k !== "hooks"),
    version: pkg.version || "0.0.0",
    category: category || "misc",
    quickStart: firstCodeBlock(quickStartMd),
    apiMarkdown,
    storybookUrl: extractStorybookUrl(readme),
    npmUrl: `https://www.npmjs.com/package/${pkg.name}`,
    githubUrl: `https://github.com/mirunamu00/usefy/tree/master/packages/${rel}`,
    readmeUrl: `https://github.com/mirunamu00/usefy/blob/master/packages/${rel}/README.md`,
  });
}

entries.sort((a, b) => a.displayName.localeCompare(b.displayName));

const banner = `// AUTO-GENERATED by scripts/build-registry.mjs — DO NOT EDIT BY HAND.\n// Run \`pnpm --filter @usefy/web build:registry\` to regenerate.\n`;
const body = `import type { PackageEntry } from "./types";\n\nexport const generatedPackages: PackageEntry[] = ${JSON.stringify(entries, null, 2)};\n`;

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, banner + "\n" + body, "utf8");

console.log(`✓ wrote ${entries.length} packages → ${OUT_FILE.replace(REPO_ROOT, ".")}`);
const missingQS = entries.filter((e) => !e.quickStart).map((e) => e.slug);
const missingApi = entries.filter((e) => !e.apiMarkdown).map((e) => e.slug);
if (missingQS.length) console.warn(`⚠ missing Quick Start snippet: ${missingQS.join(", ")}`);
if (missingApi.length) console.warn(`⚠ missing API section: ${missingApi.join(", ")}`);
if (warnings.length) console.warn(`⚠ ${warnings.length} warning(s):\n  ${warnings.join("\n  ")}`);

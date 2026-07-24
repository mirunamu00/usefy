import { defineConfig } from "tsup";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import * as sass from "sass";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Plugin } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Build for `@usefy/diff-viewer`.
 *
 * ONE config, TWO entries (confetti / signature-pad precedent):
 *  - `.`          → src/index.ts    (React layer + headless re-export)
 *  - `./headless` → src/headless.ts (pure diff engine, zero React)
 *
 * Build-stability notes (hard-won on Windows, inherited from confetti):
 *  - Running the two entries as an ARRAY of parallel configs crashes node
 *    natively on warm rebuilds (STATUS_HEAP_CORRUPTION — two racing DTS
 *    workers) and can ship stale `.d.ts`. A single config builds both
 *    entries in one pass and is stable.
 *  - `clean` stays `false`; the package.json build script runs
 *    `rimraf dist && tsup` so dist is wiped exactly once, up front.
 *
 * Unlike confetti/signature-pad this package DOES ship CSS (SPEC resolved
 * decision #2: the viewer is real styled markup — table layout, gutters,
 * add/remove palette). The SCSS-modules pipeline below is the
 * spotlight-tour / virtual-keyboard precedent: `.module.scss` files are
 * compiled + class-name-scoped at build time, concatenated into
 * `dist/styles.css` (the `./styles.css` export), and injected at runtime
 * into the styled entry only — never into `./headless`.
 *
 * Phase 1 ships the pure core and therefore no SCSS yet; the pipeline is
 * wired now and emits a placeholder `dist/styles.css` so the export map
 * always resolves. Real styles land in Phase 2.
 */

/** Generate a short, stable hash for CSS class-name scoping. */
function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 5);
}

/**
 * Process CSS Modules — transform class names to scoped versions.
 * Preserves `:global(.x)` classes without hashing.
 */
function processCssModules(
  css: string,
  filePath: string,
): { css: string; classMap: Record<string, string> } {
  const classMap: Record<string, string> = {};
  const fileName = path.basename(filePath, ".module.scss");
  const fileHash = generateHash(filePath);

  // First, temporarily replace :global(.className) with placeholders
  const globalPlaceholders: Map<string, string> = new Map();
  let placeholderIndex = 0;

  let processedCss = css.replace(
    /:global\(\.([a-zA-Z_][a-zA-Z0-9_-]*)\)/g,
    (_match, className) => {
      const placeholder = `__GLOBAL_PLACEHOLDER_${placeholderIndex++}__`;
      globalPlaceholders.set(placeholder, `.${className}`);
      return placeholder;
    },
  );

  // Transform local class selectors
  processedCss = processedCss.replace(
    /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g,
    (match, className) => {
      // Skip animation keyframe names, pseudo-classes, and already processed
      if (className.startsWith("-") || className.includes("__")) return match;
      // Skip placeholders
      if (className.startsWith("GLOBAL_PLACEHOLDER")) return match;

      const scopedName = `${fileName}_${className}__${fileHash}`;
      classMap[className] = scopedName;
      return `.${scopedName}`;
    },
  );

  // Restore :global() classes (without the :global() wrapper)
  for (const [placeholder, original] of globalPlaceholders) {
    processedCss = processedCss.replace(new RegExp(placeholder, "g"), original);
  }

  return { css: processedCss, classMap };
}

/** All CSS collected during the current build, keyed by source file. */
const collectedCss: Map<string, string> = new Map();

/** esbuild plugin that turns `*.module.scss` imports into scoped class maps. */
function scssModulesPlugin(srcDir: string): Plugin {
  return {
    name: "scss-modules",
    setup(build) {
      build.onResolve({ filter: /\.module\.scss$/ }, (args) => {
        const resolvedPath = path.resolve(args.resolveDir, args.path);
        return { path: resolvedPath, namespace: "scss-module" };
      });

      build.onLoad({ filter: /.*/, namespace: "scss-module" }, async (args) => {
        try {
          const result = sass.compile(args.path, {
            loadPaths: [
              path.dirname(args.path),
              srcDir,
              path.join(srcDir, "styles"),
            ],
          });

          const { css, classMap } = processCssModules(result.css, args.path);
          collectedCss.set(args.path, css);

          return {
            contents: `export default ${JSON.stringify(classMap)};`,
            loader: "js",
          };
        } catch (error) {
          return {
            errors: [
              {
                text: `Error compiling SCSS: ${error}`,
                location: { file: args.path },
              },
            ],
          };
        }
      });
    },
  };
}

export default defineConfig({
  entry: { index: "src/index.ts", headless: "src/headless.ts" },
  format: ["cjs", "esm"],
  dts: true,
  clean: false,
  sourcemap: true,
  external: ["react", "react-dom"],
  banner: { js: '"use client";' },
  esbuildPlugins: [scssModulesPlugin(path.resolve(__dirname, "src"))],
  async onSuccess() {
    const distDir = path.resolve(__dirname, "dist");
    fs.mkdirSync(distDir, { recursive: true });

    if (collectedCss.size === 0) {
      // Phase 1 (pure diff core) ships no SCSS yet — still emit a
      // placeholder dist/styles.css so the "./styles.css" export entry
      // always resolves for consumers who import it eagerly.
      fs.writeFileSync(
        path.join(distDir, "styles.css"),
        "/* @usefy/diff-viewer — styles land with the styled component (Phase 2) */\n",
      );
      console.log(
        "No CSS collected from SCSS modules (placeholder styles.css written)",
      );
      return;
    }

    // Combine all CSS
    let allCss = "";
    for (const [filePath, css] of collectedCss) {
      const relativePath = path.relative(path.resolve(__dirname, "src"), filePath);
      allCss += `/* ${relativePath} */\n${css}\n\n`;
    }

    const postcssResult = await postcss([autoprefixer]).process(allCss, {
      from: undefined,
      to: path.join(distDir, "styles.css"),
    });

    fs.writeFileSync(path.join(distDir, "styles.css"), postcssResult.css);
    console.log("✓ CSS bundle generated: dist/styles.css");

    // Inject CSS into the styled JS bundles at runtime
    const cssContent = postcssResult.css
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$");

    const injectCode = `
;(function() {
  if (typeof document === 'undefined') return;
  var id = '__usefy_diff_viewer_styles__';
  if (document.getElementById(id)) return;
  var style = document.createElement('style');
  style.id = id;
  style.textContent = \`${cssContent}\`;
  document.head.appendChild(style);
})();
`;

    // Inject CSS only into the styled entry (index.*), NOT the headless entry.
    const targets = ["index.mjs", "index.js"];
    for (const file of targets) {
      const filePath = path.resolve(distDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        fs.writeFileSync(filePath, content + injectCode);
      }
    }

    console.log("✓ CSS injected into styled JS bundles");
    console.log(`✓ Processed ${collectedCss.size} SCSS module files`);

    // Clear for next build (watch mode)
    collectedCss.clear();
  },
});

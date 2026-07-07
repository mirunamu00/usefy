import { defineConfig, type Options } from "tsup";
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
 * Generate a unique hash for CSS class names
 */
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
 * Process CSS Modules - transform class names to scoped versions
 * Preserves :global() classes without hashing
 */
function processCssModules(
  css: string,
  filePath: string
): { css: string; classMap: Record<string, string> } {
  const classMap: Record<string, string> = {};
  const fileName = path.basename(filePath, ".module.scss");
  const fileHash = generateHash(filePath);

  // First, temporarily replace :global(.className) with placeholders
  const globalPlaceholders: Map<string, string> = new Map();
  let placeholderIndex = 0;

  let processedCss = css.replace(
    /:global\(\.([a-zA-Z_][a-zA-Z0-9_-]*)\)/g,
    (match, className) => {
      const placeholder = `__GLOBAL_PLACEHOLDER_${placeholderIndex++}__`;
      globalPlaceholders.set(placeholder, `.${className}`);
      return placeholder;
    }
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
    }
  );

  // Restore :global() classes (without the :global() wrapper)
  for (const [placeholder, original] of globalPlaceholders) {
    processedCss = processedCss.replace(new RegExp(placeholder, "g"), original);
  }

  return { css: processedCss, classMap };
}

// Store all collected CSS
const collectedCss: Map<string, string> = new Map();

/**
 * esbuild plugin to handle .module.scss files
 */
function scssModulesPlugin(srcDir: string): Plugin {
  return {
    name: "scss-modules",
    setup(build) {
      // Handle .module.scss imports
      build.onResolve({ filter: /\.module\.scss$/ }, (args) => {
        const resolvedPath = path.resolve(args.resolveDir, args.path);
        return {
          path: resolvedPath,
          namespace: "scss-module",
        };
      });

      // Load and process .module.scss files
      build.onLoad({ filter: /.*/, namespace: "scss-module" }, async (args) => {
        try {
          // Compile SCSS to CSS
          const result = sass.compile(args.path, {
            loadPaths: [path.dirname(args.path), srcDir, path.join(srcDir, "styles")],
          });

          // Process CSS Modules (scope class names)
          const { css, classMap } = processCssModules(result.css, args.path);

          // Store CSS for later bundling
          collectedCss.set(args.path, css);

          // Return JavaScript that exports the class map
          const contents = `export default ${JSON.stringify(classMap)};`;
          return {
            contents,
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
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom", "recharts"],
  esbuildPlugins: [scssModulesPlugin(path.resolve(__dirname, "src"))],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
  async onSuccess() {
    const distDir = path.resolve(__dirname, "dist");

    if (collectedCss.size === 0) {
      console.log("No CSS collected from SCSS modules");
      return;
    }

    // Combine all CSS
    let allCss = "";
    for (const [filePath, css] of collectedCss) {
      const relativePath = path.relative(path.resolve(__dirname, "src"), filePath);
      allCss += `/* ${relativePath} */\n${css}\n\n`;
    }

    // Process with PostCSS (autoprefixer)
    const postcssResult = await postcss([autoprefixer]).process(allCss, {
      from: undefined,
      to: path.join(distDir, "styles.css"),
    });

    // Write standalone CSS file
    fs.writeFileSync(path.join(distDir, "styles.css"), postcssResult.css);
    console.log("✓ CSS bundle generated: dist/styles.css");

    // Inject CSS into JS bundles
    const cssContent = postcssResult.css
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$");

    const injectCode = `
;(function() {
  if (typeof document === 'undefined') return;
  var id = '__usefy_memory_monitor_styles__';
  if (document.getElementById(id)) return;
  var style = document.createElement('style');
  style.id = id;
  style.textContent = \`${cssContent}\`;
  document.head.appendChild(style);
})();
`;

    // Append to ESM bundle
    const esmPath = path.resolve(distDir, "index.mjs");
    if (fs.existsSync(esmPath)) {
      const esmContent = fs.readFileSync(esmPath, "utf-8");
      fs.writeFileSync(esmPath, esmContent + injectCode);
    }

    // Append to CJS bundle
    const cjsPath = path.resolve(distDir, "index.js");
    if (fs.existsSync(cjsPath)) {
      const cjsContent = fs.readFileSync(cjsPath, "utf-8");
      fs.writeFileSync(cjsPath, cjsContent + injectCode);
    }

    console.log("✓ CSS injected into JS bundles");
    console.log(`✓ Processed ${collectedCss.size} SCSS module files`);

    // Clear for next build
    collectedCss.clear();
  },
});

import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark-default"],
      langs: ["tsx", "typescript", "bash", "json", "css"],
    });
  }
  return highlighterPromise;
}

const LANG_ALIASES: Record<string, string> = {
  ts: "typescript",
  js: "typescript",
  jsx: "tsx",
  sh: "bash",
  shell: "bash",
};

/**
 * Highlight a code string to HTML at build time (RSC). The wrapper `<pre>` gets
 * a transparent background so our `--code-bg` token controls the surface.
 */
export async function highlight(code: string, lang = "tsx"): Promise<string> {
  const resolved = LANG_ALIASES[lang] ?? lang;
  const highlighter = await getHighlighter();
  const supported = highlighter.getLoadedLanguages().includes(resolved as never);
  return highlighter.codeToHtml(code, {
    lang: supported ? resolved : "tsx",
    theme: "github-dark-default",
    transformers: [
      {
        pre(node) {
          const style = (node.properties.style as string) ?? "";
          node.properties.style = style.replace(/background-color:[^;]+;?/g, "");
        },
      },
    ],
  });
}

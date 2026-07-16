import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Keep prose translatable, but shield code identifiers from browser
// auto-translation (which mangles `useToggle`, string literals, etc.).
const components: Components = {
  // Drop react-markdown's `node` prop so it doesn't leak onto the DOM element.
  code: ({ node, children, ...props }) => (
    <code translate="no" className="notranslate" {...props}>
      {children}
    </code>
  ),
  pre: ({ node, children, ...props }) => (
    <pre translate="no" className="notranslate" {...props}>
      {children}
    </pre>
  ),
};

/**
 * Renders the curated API-section markdown lifted from each package README
 * (GFM tables + prose). Styling lives in the `.docs-prose` wrapper.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="docs-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

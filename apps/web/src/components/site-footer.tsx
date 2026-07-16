import Link from "next/link";
import { site } from "@/lib/site";
import { hookCount, componentCount } from "@/data/registry";
import { Container } from "./primitives";
import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <Container className="flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <BrandMark />
          <p className="mt-3 text-sm text-fg-muted">
            {hookCount} React hooks and {componentCount} standalone components. TypeScript-first,
            SSR-safe, independently versioned on npm.
          </p>
          <p className="mt-4 font-mono text-xs text-fg-subtle">MIT © {site.author}</p>
        </div>

        <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm" aria-label="Footer">
          <Link href="/packages" className="focusable rounded text-fg-muted hover:text-fg">
            All packages
          </Link>
          <a href={site.repo} className="focusable rounded text-fg-muted hover:text-fg" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href={site.storybook} className="focusable rounded text-fg-muted hover:text-fg" target="_blank" rel="noopener noreferrer">
            Storybook
          </a>
          <a href={site.npmOrg} className="focusable rounded text-fg-muted hover:text-fg" target="_blank" rel="noopener noreferrer">
            npm
          </a>
        </nav>
      </Container>
    </footer>
  );
}

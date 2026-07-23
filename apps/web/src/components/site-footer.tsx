import Link from "next/link";
import { site } from "@/lib/site";
import { hookCount, componentCount, ecosystem } from "@/data/registry";
import { orderedStandalone } from "@/data/products";
import { Container } from "./primitives";
import { BrandMark } from "./brand-mark";

function FooterLink({ href, external = false, children }: { href: string; external?: boolean; children: React.ReactNode }) {
  if (external) {
    return (
      <a
        href={href}
        className="focusable rounded text-fg-muted transition-colors hover:text-fg"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="focusable rounded text-fg-muted transition-colors hover:text-fg">
      {children}
    </Link>
  );
}

export function SiteFooter() {
  const standalone = orderedStandalone(ecosystem().standalone);

  return (
    <footer className="mt-24 border-t border-border">
      <Container className="grid gap-10 py-12 sm:grid-cols-[minmax(0,1.2fr)_1fr_1fr]">
        <div className="max-w-xs">
          <BrandMark />
          <p className="mt-3 text-sm text-fg-muted">
            An open-source org shipping {hookCount} React hooks and {componentCount} standalone
            components. TypeScript-first, SSR-safe, independently versioned on npm.
          </p>
          <p className="mt-4 font-mono text-xs text-fg-subtle">MIT © {site.author}</p>
        </div>

        <nav aria-label="Products" className="text-sm">
          <p className="font-mono text-xs uppercase tracking-wider text-fg-subtle">Products</p>
          <ul className="mt-3 space-y-2">
            <li>
              <FooterLink href="/packages?family=hooks">@usefy/hooks</FooterLink>
            </li>
            {standalone.map(({ pkg }) => (
              <li key={pkg.slug}>
                <FooterLink href={`/packages/${pkg.slug}`}>{pkg.name}</FooterLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Resources" className="text-sm">
          <p className="font-mono text-xs uppercase tracking-wider text-fg-subtle">Resources</p>
          <ul className="mt-3 space-y-2">
            <li><FooterLink href="/packages">All packages</FooterLink></li>
            <li><FooterLink href={site.storybook} external>Storybook</FooterLink></li>
            <li><FooterLink href={site.repo} external>GitHub</FooterLink></li>
            <li><FooterLink href={`${site.repo}/blob/master/ROADMAP.md`} external>Roadmap</FooterLink></li>
            <li><FooterLink href={site.npmOrg} external>npm org</FooterLink></li>
          </ul>
        </nav>
      </Container>
    </footer>
  );
}

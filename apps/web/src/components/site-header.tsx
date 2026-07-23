import Link from "next/link";
import { site } from "@/lib/site";
import { Container } from "./primitives";
import { BrandMark } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/packages", label: "All packages" },
  { href: "/packages?family=hooks", label: "Hooks" },
  { href: "/packages?family=standalone", label: "Components" },
];

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.3-.5-1.5.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="focusable rounded-lg" aria-label="usefy home">
          <BrandMark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="focusable rounded-lg px-3 py-2 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={site.storybook}
            target="_blank"
            rel="noopener noreferrer"
            className="focusable hidden rounded-lg px-3 py-2 text-sm text-fg-muted transition-colors hover:text-fg sm:block"
          >
            Storybook
          </a>
          <a
            href={site.repo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="focusable inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <GitHubIcon />
          </a>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}

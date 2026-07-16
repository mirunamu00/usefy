import Link from "next/link";
import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/primitives";
import { CodeBlock } from "@/components/code-block";
import { LiveToggleDemo } from "@/components/live-toggle-demo";
import { InstallCommand } from "@/components/install-command";
import { PackageCard } from "@/components/package-card";
import { site } from "@/lib/site";
import { getPackage, hookCount, componentCount, packageCount, ecosystem } from "@/data/registry";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const HERO_SNIPPET = `import { useToggle } from "@usefy/use-toggle";

function Panel() {
  const { value, toggle } = useToggle(true);

  return (
    <button onClick={toggle}>
      {value ? "On" : "Off"}
    </button>
  );
}`;

const FEATURED = [
  "use-toggle", "use-debounce", "use-local-storage",
  "use-copy-to-clipboard", "use-media-query", "use-hover",
  "use-interval", "use-on-click-outside", "use-dark-mode",
];

const GUARANTEES = ["TypeScript-first", "SSR-safe", "Tree-shakeable", "Zero-dependency core", "React 18 & 19"];

const REASONS = [
  { title: "Typed to the edges", body: "Every hook exports its return interface and helper types. Your editor knows the shape before you do." },
  { title: "SSR-safe by default", body: "Isomorphic effects, hydration guards, and no window access at import. Drops into Next.js and Remix without a wrapper." },
  { title: "Install what you use", body: "Each hook is its own package, versioned independently. Take one, or take the @usefy/hooks umbrella and tree-shake the rest." },
  { title: "Stable references", body: "Returned functions are memoized with useCallback, so they're safe as effect deps and child props." },
  { title: "Actually tested", body: "Each package ships a real Vitest suite targeting 90%+ coverage — not a demo and a prayer." },
  { title: "Built in the open", body: "MIT-licensed, changeset-released, and documented in Storybook. This very site runs on usefy hooks." },
];

export default function HomePage() {
  const eco = ecosystem();
  const featured = FEATURED.map((s) => getPackage(s)).filter((p) => p !== undefined);
  const standalone = eco.standalone;

  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
    publisher: { "@type": "Organization", name: site.name, url: site.repo },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
        <Container className="relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
          <div className="rise">
            <Eyebrow>
              {hookCount} hooks · {componentCount} components · one npm org
            </Eyebrow>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-fg sm:text-5xl lg:text-6xl">
              <span className="block text-balance">The React hooks you keep rewriting.</span>
              <span className="mt-1 block text-brand">Already written.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-fg-muted sm:text-lg">
              A collection of {packageCount} production-ready React hooks and standalone components.
              Typed, SSR-safe, and tree-shakeable — install one, or take the whole umbrella.
            </p>

            <div className="mt-8 max-w-md">
              <InstallCommand pkg="@usefy/hooks" />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/packages"
                className="focusable brand-gradient inline-flex h-11 items-center rounded-xl px-5 text-sm font-medium text-white transition-[filter] hover:brightness-110"
              >
                Browse all packages
              </Link>
              <a
                href={site.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="focusable inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium text-fg transition-colors hover:border-border-strong"
              >
                Star on GitHub
              </a>
            </div>
          </div>

          {/* Live hero card — real useToggle running below its own source. */}
          <div className="rise lg:justify-self-end" style={{ animationDelay: "0.08s" }}>
            <div
              className="w-full max-w-md overflow-hidden rounded-2xl border shadow-[var(--shadow-card)]"
              style={{ background: "var(--code-bg)", borderColor: "var(--code-border)" }}
            >
              <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "var(--code-border)" }}>
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="ml-2 font-mono text-xs text-white/40">Panel.tsx</span>
              </div>
              <CodeBlock code={HERO_SNIPPET} copy={false} className="rounded-none border-0" />
              <LiveToggleDemo />
            </div>
            <p className="mt-3 text-center font-mono text-xs text-fg-subtle">
              ↑ a real @usefy/use-toggle — click it
            </p>
          </div>
        </Container>
      </section>

      {/* ── Guarantee strip ───────────────────────────────────── */}
      <section className="border-b border-border bg-surface/40">
        <Container className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5">
          {GUARANTEES.map((g) => (
            <span key={g} className="inline-flex items-center gap-2 font-mono text-xs text-fg-muted">
              <span className="text-brand">✓</span> {g}
            </span>
          ))}
        </Container>
      </section>

      {/* ── Ecosystem (same-layer families) ───────────────────── */}
      <section className="py-20 sm:py-24">
        <Container>
          <Eyebrow>the ecosystem</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            One layer of independent packages.
          </h2>
          <p className="mt-4 max-w-2xl text-fg-muted">
            Every package sits at the same level and installs on its own. Hooks roll up into a single{" "}
            <code translate="no" className="notranslate font-mono text-fg">@usefy/hooks</code> umbrella; standalone components ship
            as themselves.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Link
              href="/packages?family=hooks"
              className="focusable group flex flex-col rounded-2xl border border-border bg-surface/40 p-6 transition-all hover:border-brand/50 hover:bg-surface"
            >
              <span className="font-mono text-xs uppercase tracking-wider text-fg-subtle">umbrella · family</span>
              <code translate="no" className="notranslate mt-3 font-mono text-xl font-semibold text-fg group-hover:text-brand">@usefy/hooks</code>
              <p className="mt-2 text-sm text-fg-muted">
                {hookCount} React hooks for state, effects, events, observers, sensors, and async — under
                one import, fully tree-shakeable.
              </p>
              <span className="mt-4 font-mono text-sm text-brand">Browse hooks →</span>
            </Link>

            {standalone.map((pkg) => (
              <Link
                key={pkg.slug}
                href={`/packages/${pkg.slug}`}
                className="focusable group flex flex-col rounded-2xl border border-border bg-surface/40 p-6 transition-all hover:border-brand/50 hover:bg-surface"
              >
                <span className="font-mono text-xs uppercase tracking-wider text-fg-subtle">standalone · component</span>
                <code translate="no" className="notranslate mt-3 font-mono text-xl font-semibold text-fg group-hover:text-brand">{pkg.name}</code>
                <p className="mt-2 line-clamp-3 text-sm text-fg-muted">{pkg.tagline}</p>
                <span className="mt-4 font-mono text-sm text-brand">View docs →</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Featured packages ─────────────────────────────────── */}
      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>reach-for-it hooks</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
                A few you&apos;ll use today.
              </h2>
            </div>
            <Link href="/packages" className="focusable font-mono text-sm text-brand hover:underline">
              Browse all {packageCount} →
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((pkg) => (
              <PackageCard key={pkg.slug} pkg={pkg} />
            ))}
          </div>
        </Container>
      </section>

      {/* ── Why usefy ─────────────────────────────────────────── */}
      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <Eyebrow>why usefy</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Boring on purpose. Reliable by design.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map((r) => (
              <div key={r.title} className="bg-bg p-6">
                <h3 className="font-display text-lg font-semibold text-fg">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{r.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CTA band ──────────────────────────────────────────── */}
      <section className="border-t border-border">
        <Container className="py-20 text-center sm:py-24">
          <h2 className="mx-auto max-w-xl font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Install one line. Delete a hundred.
          </h2>
          <div className="mx-auto mt-8 max-w-md">
            <InstallCommand pkg="@usefy/hooks" />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/packages"
              className="focusable brand-gradient inline-flex h-11 items-center rounded-xl px-5 text-sm font-medium text-white transition-[filter] hover:brightness-110"
            >
              Explore the packages
            </Link>
            <a
              href={site.storybook}
              target="_blank"
              rel="noopener noreferrer"
              className="focusable inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium text-fg transition-colors hover:border-border-strong"
            >
              Try in Storybook
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}

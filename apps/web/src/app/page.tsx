import Link from "next/link";
import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/primitives";
import { InstallCommand } from "@/components/install-command";
import { HeroBackdrop } from "@/components/hero/hero-backdrop";
import { HeroSwitcher, type HeroTab } from "@/components/hero/hero-switcher";
import { ProductCard } from "@/components/product/product-card";
import { PageProgress } from "@/components/page-progress";
import { SiteTour } from "@/components/site-tour";
import { TourButton } from "@/components/tour-button";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { WireDivider } from "@/components/motion/wire-divider";
import { highlight } from "@/lib/highlight";
import { site } from "@/lib/site";
import {
  hookCount,
  componentCount,
  packageCount,
  ecosystem,
  packagesByCategory,
} from "@/data/registry";
import { orderedStandalone, productMeta } from "@/data/products";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* ── Hero switcher panes — each tab is a different usefy product, and the
      strip below each pane runs it for real. ─────────────────────────── */

const TAB_SOURCES: Array<Omit<HeroTab, "html">> = [
  {
    id: "use-toggle",
    label: "use-toggle",
    file: "Panel.tsx",
    caption: "↑ a real @usefy/use-toggle — click it",
    code: `import { useToggle } from "@usefy/use-toggle";

function Panel() {
  const { value, toggle } = useToggle(true);

  return (
    <button onClick={toggle}>
      {value ? "On" : "Off"}
    </button>
  );
}`,
  },
  {
    id: "confetti",
    label: "confetti",
    file: "ShipButton.tsx",
    caption: "↑ fires the real engine over this page",
    code: `import { fireConfetti } from "@usefy/confetti";

function ShipButton() {
  return (
    <button onClick={() => fireConfetti({ count: 140 })}>
      Ship it 🎉
    </button>
  );
}`,
  },
  {
    id: "spotlight-tour",
    label: "spotlight-tour",
    file: "Onboarding.tsx",
    caption: "↑ the tour runs on this very page",
    code: `import { SpotlightTour } from "@usefy/spotlight-tour";

const steps = [
  {
    target: "#toolbox",
    title: "The toolbox",
    content: "Every tool installs on its own.",
  },
];

<SpotlightTour steps={steps} controllerRef={tour} />`,
  },
  {
    id: "virtual-keyboard",
    label: "virtual-keyboard",
    file: "PinPad.tsx",
    caption: "↑ a real PIN pad — type on it",
    code: `import {
  VirtualKeyboard,
  numericLayout,
} from "@usefy/virtual-keyboard";

function PinPad() {
  const [pin, setPin] = useState("");
  return (
    <VirtualKeyboard
      layouts={numericLayout}
      value={pin}
      onChange={setPin}
    />
  );
}`,
  },
];

const GUARANTEES = ["TypeScript-first", "SSR-safe", "Tree-shakeable", "Zero-dependency core", "React 18 & 19"];

const REASONS = [
  { title: "Typed to the edges", body: "Every package exports its return interface and helper types. Your editor knows the shape before you do." },
  { title: "SSR-safe by default", body: "Isomorphic effects, hydration guards, and no window access at import. Drops into Next.js and Remix without a wrapper." },
  { title: "Install what you use", body: "Each tool is its own package, versioned independently. Take one hook, one component, or the whole umbrella." },
  { title: "Stable references", body: "Returned functions are memoized with useCallback, so they're safe as effect deps and child props." },
  { title: "Actually tested", body: "Each package ships a real Vitest suite targeting 90%+ coverage — not a demo and a prayer." },
  { title: "Built in the open", body: "MIT-licensed, changeset-released, and documented in Storybook. This very site runs on usefy packages." },
];

const WONT_BUILD = [
  { area: "Server state", instead: "TanStack Query, SWR" },
  { area: "Forms", instead: "react-hook-form" },
  { area: "Virtualized lists", instead: "TanStack Virtual" },
  { area: "Animation systems", instead: "Motion" },
  { area: "Global state", instead: "Zustand, Jotai" },
  { area: "React 19 built-ins", instead: "React itself" },
];

export default async function HomePage() {
  const eco = ecosystem();
  const standalone = orderedStandalone(eco.standalone);
  const hooksMeta = productMeta("hooks");
  const hookCategories = packagesByCategory().filter(
    (g) => g.category.id !== "component" && g.items.some((p) => p.kind === "hook"),
  );

  const tabs: HeroTab[] = await Promise.all(
    TAB_SOURCES.map(async (t) => ({ ...t, html: await highlight(t.code) })),
  );

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
      <PageProgress />
      <SiteTour />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <HeroBackdrop />
        {/* items-start: the switcher's keyboard tab is taller than the rest —
            top-aligning keeps the left column still when the pane grows. */}
        <Container className="relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-10">
          <div className="rise">
            <Eyebrow>
              {hookCount} hooks · {componentCount} components · one npm org
            </Eyebrow>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-fg sm:text-5xl lg:text-6xl">
              <span className="block text-balance">The React tools you keep rebuilding.</span>
              <span className="mt-1 block text-brand">Already built.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-fg-muted sm:text-lg">
              usefy is an open-source org shipping {packageCount} production-grade packages — a
              full hooks library and a growing line of standalone components. Typed, SSR-safe,
              tree-shakeable.
            </p>

            <div id="install" className="mt-8 max-w-md">
              <InstallCommand pkg="@usefy/hooks" celebrate />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/packages"
                className="focusable brand-gradient inline-flex h-11 items-center rounded-xl px-5 text-sm font-medium text-white transition-[filter] hover:brightness-110"
              >
                Browse the toolbox
              </Link>
              <a
                href={site.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="focusable inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium text-fg transition-colors hover:border-border-strong"
              >
                Star on GitHub
              </a>
              <TourButton className="focusable inline-flex h-11 items-center gap-2 rounded-xl px-4 font-mono text-sm text-fg-muted transition-colors hover:text-fg">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Tour this page
              </TourButton>
            </div>
          </div>

          {/* Product switcher: four tools, one editor pane, all running live. */}
          <div id="hero-demo" className="rise lg:justify-self-end" style={{ animationDelay: "0.08s" }}>
            <HeroSwitcher tabs={tabs} />
          </div>
        </Container>
      </section>

      {/* ── Proof strip ───────────────────────────────────────── */}
      <section className="border-b border-border bg-surface/40">
        <Container className="flex flex-col items-center gap-5 py-8 sm:flex-row sm:justify-between">
          <dl className="flex items-center gap-8 sm:gap-10">
            {[
              { n: packageCount, label: "packages" },
              { n: hookCount, label: "hooks" },
              { n: componentCount, label: "components" },
            ].map((s) => (
              <div key={s.label} className="text-center sm:text-left">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-2xl font-bold tabular-nums text-fg sm:text-3xl">
                  <CountUp to={s.n} />
                </dd>
                <dd className="font-mono text-xs text-fg-subtle">{s.label}</dd>
              </div>
            ))}
          </dl>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {GUARANTEES.map((g) => (
              <li key={g} className="inline-flex items-center gap-2 font-mono text-xs text-fg-muted">
                <span className="text-brand" aria-hidden="true">✓</span> {g}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ── The toolbox ───────────────────────────────────────── */}
      <section id="toolbox" className="py-20 sm:py-24">
        <Container>
          <Reveal>
            <Eyebrow>the toolbox</Eyebrow>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              One org. Many tools.
            </h2>
            <p className="mt-4 max-w-2xl text-fg-muted">
              Not just hooks. Every package installs on its own and holds the same bar — hover a
              card and it demos itself.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4">
            {/* id: tour anchor — spotlighting the whole #toolbox section
                overflows the viewport and clips the tooltip. */}
            <Reveal id="toolbox-flagship">
              <ProductCard
                name="@usefy/hooks"
                href="/packages?family=hooks"
                role={hooksMeta.role}
                tagline={`${hookCount} React hooks for state, effects, events, observers, sensors, and async — one import, fully tree-shakeable, or each hook on its own.`}
                accentVar={hooksMeta.accentVar}
                demo={hooksMeta.demo}
                wide
                cta="Browse hooks →"
              />
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {standalone.map(({ pkg, meta }, i) => (
                <Reveal key={pkg.slug} delay={Math.min(i * 0.06, 0.3)}>
                  <ProductCard
                    name={pkg.name}
                    href={`/packages/${pkg.slug}`}
                    role={meta.role}
                    tagline={pkg.tagline}
                    accentVar={meta.accentVar}
                    demo={meta.demo}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <WireDivider className="-my-6" />

      {/* ── Hooks breadth: the category matrix ────────────────── */}
      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>the hooks library</Eyebrow>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
                  <CountUp to={hookCount} className="text-brand" /> hooks, organized.
                </h2>
              </div>
              <Link href="/packages?family=hooks" className="focusable font-mono text-sm text-brand hover:underline">
                Browse all hooks →
              </Link>
            </div>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {hookCategories.map((g, i) => (
              <Reveal key={g.category.id} delay={Math.min(i * 0.05, 0.35)}>
                <Link
                  href={`/packages?family=hooks&cat=${g.category.id}`}
                  className="focusable group flex h-full flex-col rounded-xl border border-border bg-surface/40 p-4 transition-all hover:border-brand/50 hover:bg-surface"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-[15px] font-semibold text-fg group-hover:text-brand">
                      {g.category.title}
                    </h3>
                    <span className="font-mono text-xs tabular-nums text-fg-subtle">{g.items.length}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-fg-muted">
                    {g.category.blurb}
                  </p>
                  <p translate="no" className="notranslate mt-3 truncate font-mono text-[11px] text-fg-subtle">
                    {g.items.slice(0, 3).map((p) => p.displayName).join(" · ")}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Engineering standards ─────────────────────────────── */}
      <section id="standards" className="border-t border-border py-20 sm:py-24">
        <Container>
          {/* id: tour anchor (see #toolbox-flagship note). */}
          <Reveal id="standards-intro">
            <Eyebrow>engineering standards</Eyebrow>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              Boring on purpose. Reliable by design.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {REASONS.map((r) => (
                <div key={r.title} className="bg-bg p-6">
                  <h3 className="font-display text-lg font-semibold text-fg">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{r.body}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Scope is a feature: what usefy deliberately leaves to others. */}
          <Reveal delay={0.12}>
            <div className="mt-6 rounded-2xl border border-border bg-surface/40 p-6">
              <h3 className="font-display text-lg font-semibold text-fg">What we won&apos;t build</h3>
              <p className="mt-1.5 max-w-2xl text-sm text-fg-muted">
                usefy ships primitives, not platforms. Where a dedicated library already does it
                better, we point you there instead of shipping a worse clone.
              </p>
              <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {WONT_BUILD.map((w) => (
                  <li key={w.area} className="flex items-baseline justify-between gap-3 font-mono text-[12.5px]">
                    <span className="text-fg-muted">{w.area}</span>
                    <span className="text-right text-fg-subtle">→ {w.instead}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── CTA band ──────────────────────────────────────────── */}
      <section className="border-t border-border">
        <Container className="py-20 text-center sm:py-24">
          <Reveal>
            <h2 className="mx-auto max-w-xl font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              Install one line. Delete a hundred.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-fg-muted">
              Copying the command is worth celebrating — try it.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mx-auto mt-8 max-w-md">
              <InstallCommand pkg="@usefy/hooks" celebrate />
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
              <a
                href={`${site.repo}/blob/master/ROADMAP.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="focusable inline-flex h-11 items-center rounded-xl px-4 font-mono text-sm text-fg-muted transition-colors hover:text-fg"
              >
                Roadmap →
              </a>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives";
import { CodeBlock } from "@/components/code-block";
import { InstallCommand } from "@/components/install-command";
import { Markdown } from "@/components/markdown";
import { PackageCard } from "@/components/package-card";
import { site } from "@/lib/site";
import { getPackage, packages, categoryMeta } from "@/data/registry";

export function generateStaticParams() {
  return packages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = getPackage(slug);
  if (!pkg) return {};
  const title = `${pkg.displayName} — ${pkg.name}`;
  return {
    title,
    description: pkg.subtitle || pkg.tagline,
    keywords: pkg.keywords,
    alternates: { canonical: `/packages/${pkg.slug}` },
    openGraph: {
      type: "article",
      title,
      description: pkg.subtitle || pkg.tagline,
      url: `${site.url}/packages/${pkg.slug}`,
    },
    twitter: { card: "summary_large_image", title, description: pkg.subtitle || pkg.tagline },
  };
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="focusable inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
    >
      {children}
    </a>
  );
}

export default async function PackagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = getPackage(slug);
  if (!pkg) notFound();

  const cat = categoryMeta(pkg.category);
  const related = packages
    .filter((p) => p.category === pkg.category && p.slug !== pkg.slug)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: pkg.name,
    description: pkg.subtitle || pkg.tagline,
    codeRepository: pkg.githubUrl,
    programmingLanguage: "TypeScript",
    runtimePlatform: "React",
    url: `${site.url}/packages/${pkg.slug}`,
    license: "https://opensource.org/licenses/MIT",
    keywords: pkg.keywords.join(", "),
    author: { "@type": "Person", name: site.author },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Packages", item: `${site.url}/packages` },
      { "@type": "ListItem", position: 2, name: pkg.displayName, item: `${site.url}/packages/${pkg.slug}` },
    ],
  };

  return (
    <Container className="py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-xs text-fg-subtle" aria-label="Breadcrumb">
        <Link href="/packages" className="focusable rounded hover:text-fg">packages</Link>
        <span aria-hidden="true">/</span>
        <span translate="no" className="notranslate text-fg-muted">{pkg.slug}</span>
      </nav>

      <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* Main column */}
        <article className="min-w-0">
          <header>
            <div className="flex flex-wrap items-center gap-3">
              <h1 translate="no" className="notranslate font-mono text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                {pkg.displayName}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-fg-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-brand/60" aria-hidden="true" />
                {cat.title}
              </span>
            </div>
            <p className="mt-3 text-lg text-fg-muted">{pkg.subtitle || pkg.tagline}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <ActionLink href={pkg.npmUrl}>npm</ActionLink>
              <ActionLink href={pkg.githubUrl}>Source</ActionLink>
              <ActionLink href={pkg.readmeUrl}>Full README</ActionLink>
              {pkg.storybookUrl ? <ActionLink href={pkg.storybookUrl}>Storybook demo ↗</ActionLink> : null}
            </div>
          </header>

          {/* Install */}
          <section className="mt-10">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-fg-subtle">
              Install
            </h2>
            <div className="mt-3">
              <InstallCommand pkg={pkg.name} />
            </div>
          </section>

          {/* Quick Start */}
          {pkg.quickStart ? (
            <section className="mt-10">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                Quick start
              </h2>
              <div className="mt-3">
                <CodeBlock code={pkg.quickStart} filename={`${pkg.displayName}.tsx`} />
              </div>
            </section>
          ) : null}

          {/* API */}
          {pkg.apiMarkdown ? (
            <section className="mt-12">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-fg-subtle">
                API reference
              </h2>
              <div className="mt-4">
                <Markdown>{pkg.apiMarkdown}</Markdown>
              </div>
            </section>
          ) : null}

          {/* Deep-dive callout */}
          <section className="mt-12 rounded-2xl border border-border bg-surface/40 p-6">
            <h2 className="font-display text-lg font-semibold text-fg">Go deeper</h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              This page is the quick reference. For every example, prop, and edge case, read the full
              README — or open Storybook to change props live.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionLink href={pkg.readmeUrl}>Full README →</ActionLink>
              {pkg.storybookUrl ? <ActionLink href={pkg.storybookUrl}>Open in Storybook →</ActionLink> : null}
            </div>
          </section>
        </article>

        {/* Aside: at-a-glance */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface/40 p-5">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-mono text-xs text-fg-subtle">package</dt>
                <dd translate="no" className="notranslate mt-0.5 break-all font-mono text-[13px] text-fg">{pkg.name}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-fg-subtle">version</dt>
                <dd className="mt-0.5 font-mono text-[13px] text-fg">{pkg.version}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-fg-subtle">type</dt>
                <dd className="mt-0.5 text-[13px] text-fg capitalize">{pkg.kind}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-fg-subtle">peer</dt>
                <dd className="mt-0.5 text-[13px] text-fg">React 18 · 19</dd>
              </div>
            </dl>
          </div>

          {pkg.keywords.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {pkg.keywords.slice(0, 8).map((k) => (
                <span key={k} className="rounded-md bg-surface px-2 py-0.5 font-mono text-[11px] text-fg-subtle">
                  {k}
                </span>
              ))}
            </div>
          ) : null}
        </aside>
      </div>

      {/* Related */}
      {related.length > 0 ? (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="font-display text-lg font-semibold text-fg">
            More in {cat.title.toLowerCase()}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PackageCard key={p.slug} pkg={p} />
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  );
}

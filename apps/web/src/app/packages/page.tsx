import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, Eyebrow } from "@/components/primitives";
import { PackageExplorer } from "@/components/package-explorer";
import { liteList, CATEGORIES, packageCount } from "@/data/registry";

export const metadata: Metadata = {
  title: "All packages",
  description: `Browse all ${packageCount} @usefy React hooks and components. Search by name, filter by category, and jump straight to install + usage.`,
  alternates: { canonical: "/packages" },
};

export default function PackagesPage() {
  return (
    <Container className="py-14 sm:py-20">
      <Eyebrow>browse all {packageCount}</Eyebrow>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-fg sm:text-5xl">
        Packages
      </h1>
      <p className="mt-4 max-w-2xl text-fg-muted">
        Every hook and component in the usefy ecosystem. Search by name or keyword, filter by
        category, and open any package for install and usage in one screen.
      </p>

      <div className="mt-10">
        <Suspense fallback={<div className="h-12 rounded-xl border border-border bg-surface/50" />}>
          <PackageExplorer items={liteList()} categories={CATEGORIES} />
        </Suspense>
      </div>
    </Container>
  );
}

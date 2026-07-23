import Link from "next/link";
import { Container } from "@/components/primitives";
import { CodeBlock } from "@/components/code-block";

const SNIPPET = `import { useNotFound } from "@usefy/use-not-found";

function ThisPage() {
  const { exists, suggestions } = useNotFound();

  // exists      → false
  // suggestions → ["/packages", "/"]

  return null;
}`;

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-6xl font-semibold text-brand">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-fg">Nothing exports from here.</h1>
      <p className="mt-2 max-w-sm text-fg-muted">
        That package or page doesn&apos;t exist. Browse the ecosystem instead.
      </p>

      <div className="mt-8 w-full max-w-md text-left">
        <CodeBlock code={SNIPPET} filename="use-not-found.tsx" copy={false} />
        <p className="mt-2 text-center font-mono text-xs text-fg-subtle">
          the one hook we&apos;ll never ship
        </p>
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/packages"
          className="focusable inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-medium text-brand-fg hover:bg-brand-strong"
        >
          Browse packages
        </Link>
        <Link
          href="/"
          className="focusable inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium text-fg hover:border-border-strong"
        >
          Home
        </Link>
      </div>
    </Container>
  );
}

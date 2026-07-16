/** Central site configuration — single source for URLs and copy used in SEO. */
export const site = {
  name: "usefy",
  /** Used in <title> templates and OG. */
  title: "usefy — production-ready React hooks & components",
  tagline: "Production-ready React hooks & components",
  description:
    "A collection of 70+ production-ready React hooks and standalone components. TypeScript-first, SSR-safe, tree-shakeable, and independently versioned on npm under @usefy.",
  /** Canonical origin. Set NEXT_PUBLIC_SITE_URL in the Vercel project. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://usefy.dev").replace(/\/$/, ""),
  /**
   * When true, the whole site is marked noindex + robots-disallow. Set
   * NEXT_PUBLIC_NOINDEX=1 on the temporary *.vercel.app deploy so it isn't
   * indexed before the real domain is live; unset it on the real domain.
   */
  noindex: process.env.NEXT_PUBLIC_NOINDEX === "1",
  npmOrg: "https://www.npmjs.com/org/usefy",
  repo: "https://github.com/mirunamu00/usefy",
  storybook: "https://mirunamu00.github.io/usefy/",
  author: "mirunamu",
  ogImage: "/opengraph-image",
} as const;

export type Site = typeof site;

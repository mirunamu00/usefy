/** Central site configuration — single source for URLs and copy used in SEO. */
export const site = {
  name: "usefy",
  /** Used in <title> templates and OG. */
  title: "usefy — production-grade React hooks & components",
  tagline: "The React tools you keep rebuilding. Already built.",
  description:
    "usefy is an open-source org shipping 70+ production-grade React hooks and standalone components — confetti, product tours, virtual keyboards, and more. TypeScript-first, SSR-safe, tree-shakeable, independently versioned on npm under @usefy.",
  /**
   * Canonical origin. Defaults to the public Vercel subdomain we ship on.
   * Override with NEXT_PUBLIC_SITE_URL in the Vercel project only if a real
   * custom domain is ever attached.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://usefy-web.vercel.app").replace(/\/$/, ""),
  /**
   * When true, the whole site is marked noindex + robots-disallow. Left unset
   * in production so the public usefy-web.vercel.app site is indexable; set
   * NEXT_PUBLIC_NOINDEX=1 only for throwaway preview deploys you don't want
   * crawled.
   */
  noindex: process.env.NEXT_PUBLIC_NOINDEX === "1",
  npmOrg: "https://www.npmjs.com/org/usefy",
  repo: "https://github.com/mirunamu00/usefy",
  storybook: "https://mirunamu00.github.io/usefy/",
  author: "mirunamu",
  ogImage: "/opengraph-image",
} as const;

export type Site = typeof site;

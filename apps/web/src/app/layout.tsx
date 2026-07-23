import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { site } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: "%s · usefy",
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author }],
  keywords: [
    "react hooks",
    "react components",
    "typescript",
    "usefy",
    "useToggle",
    "custom hooks",
    "ssr",
    "next.js",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: site.noindex
    ? { index: false, follow: false }
    : { index: true, follow: true },
  // Google Search Console ownership verification (URL-prefix property for
  // https://usefy-web.vercel.app). Renders <meta name="google-site-verification">.
  verification: { google: "jP_LRgp2ourifn-dveaqSx3v-cBhd7cwuHbUlM6bsA4" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e13" },
  ],
};

// Resolve the theme before first paint to avoid a flash. Mirrors
// @usefy/use-dark-mode (storageKey "usefy-dark-mode", data-theme attribute).
// Also stamps html[data-js] — scroll-reveal styles only apply when JS will
// run, so no-JS visitors (and crawlers) always see the full page. It must be
// an attribute React doesn't render (NOT a class): className is hydrated, and
// mutating it pre-hydration triggers a mismatch warning.
const themeScript = `(function(){try{document.documentElement.setAttribute('data-js','');var m=localStorage.getItem('usefy-dark-mode')||'system';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the pre-paint script stamps data-theme +
    // data-js on <html> before React hydrates (the next-themes pattern) —
    // without it React 19 warns about the attribute mismatch on this element.
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-fg"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

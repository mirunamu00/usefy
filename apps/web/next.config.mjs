/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Workspace hook packages ship built dist, but transpiling keeps HMR/source
  // maps clean when we dogfood them in the app.
  transpilePackages: [
    "@usefy/use-dark-mode",
    "@usefy/use-copy-to-clipboard",
    "@usefy/use-toggle",
    "@usefy/use-hover",
    "@usefy/use-intersection-observer",
    "@usefy/use-interval",
    "@usefy/use-merged-refs",
    "@usefy/use-reduced-motion",
    "@usefy/confetti",
    "@usefy/memory-monitor",
    "@usefy/network-indicator",
    "@usefy/scroll-progress",
    "@usefy/spotlight-tour",
    "@usefy/virtual-keyboard",
  ],
  experimental: {
    optimizePackageImports: ["react-markdown"],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Workspace hook packages ship built dist, but transpiling keeps HMR/source
  // maps clean when we dogfood them in the app.
  transpilePackages: ["@usefy/use-dark-mode", "@usefy/use-copy-to-clipboard", "@usefy/use-toggle"],
  experimental: {
    optimizePackageImports: ["react-markdown"],
  },
};

export default nextConfig;

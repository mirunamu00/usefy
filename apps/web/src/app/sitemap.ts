import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { packages } from "@/data/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/packages`, changeFrequency: "weekly", priority: 0.9 },
  ];

  for (const pkg of packages) {
    routes.push({
      url: `${site.url}/packages/${pkg.slug}`,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return routes;
}

import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { INDEXABLE_ROUTES, SITEMAP_LAST_MODIFIED } from "@/lib/sitemap-config";

const BASE = "https://998webdesigns.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(SITEMAP_LAST_MODIFIED);

  const staticRoutes = INDEXABLE_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: path ? `${BASE}${path}` : BASE,
    lastModified,
    changeFrequency,
    priority,
  }));

  const blogPosts = getAllPosts().map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogPosts];
}

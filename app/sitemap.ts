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

  const blogPosts = getAllPosts().map((post) => {
    const raw = post.updatedAt ?? post.publishedAt;
    const parsed = new Date(raw);
    const postModified = Number.isNaN(parsed.getTime()) ? lastModified : parsed;
    return {
      url: `${BASE}/blog/${post.slug}`,
      lastModified: postModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    };
  });

  return [...staticRoutes, ...blogPosts];
}

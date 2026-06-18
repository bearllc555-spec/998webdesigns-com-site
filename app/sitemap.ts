import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { SITE_ORIGIN } from "@/lib/site-origin";
import { INDEXABLE_ROUTES, SITEMAP_LAST_MODIFIED } from "@/lib/sitemap-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date(SITEMAP_LAST_MODIFIED);

  const staticRoutes = INDEXABLE_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: path ? `${SITE_ORIGIN}${path}` : SITE_ORIGIN,
    lastModified,
    changeFrequency,
    priority,
  }));

  const blogPosts = (await getAllPosts()).map((post) => {
    const raw = post.updatedAt ?? post.publishedAt;
    const parsed = new Date(raw);
    const postModified = Number.isNaN(parsed.getTime()) ? lastModified : parsed;
    return {
      url: `${SITE_ORIGIN}/blog/${post.slug}`,
      lastModified: postModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    };
  });

  return [...staticRoutes, ...blogPosts];
}

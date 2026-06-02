import type { MetadataRoute } from "next";
import { INDEXABLE_ROUTES, SITEMAP_LAST_MODIFIED } from "@/lib/sitemap-config";

const BASE = "https://998webdesigns.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(SITEMAP_LAST_MODIFIED);

  return INDEXABLE_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: path ? `${BASE}${path}` : BASE,
    lastModified,
    changeFrequency,
    priority,
  }));
}

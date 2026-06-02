import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW } from "@/lib/sitemap-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ROBOTS_DISALLOW,
    },
    sitemap: "https://998webdesigns.com/sitemap.xml",
  };
}

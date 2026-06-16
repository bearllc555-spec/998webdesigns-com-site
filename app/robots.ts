import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-origin";
import { ROBOTS_DISALLOW } from "@/lib/sitemap-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ROBOTS_DISALLOW,
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}

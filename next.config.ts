import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Static export: produces a fully static `out/` directory that Cloudflare Pages serves verbatim.
  // No Node server at runtime; all dynamic features (form submit, etc.) happen in the browser.
  // Only enable for production builds - dev server doesn't support static export.
  ...(isProd && { output: "export" }),

  // Static export can't use Next.js Image Optimization API (no Node runtime).
  // Switching to unoptimized passes images through as-is from /public.
  images: { unoptimized: true },

  // Trailing slash on URLs avoids /thanks -> /thanks/ 404s when CF Pages serves directories.
  // Only enable for production - causes redirect loops in dev with v0 preview.
  ...(isProd && { trailingSlash: true }),
};

export default nextConfig;

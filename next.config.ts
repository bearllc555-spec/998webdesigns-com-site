import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: produces a fully static `out/` directory that Cloudflare Pages serves verbatim.
  // No Node server at runtime; all dynamic features (form submit, etc.) happen in the browser.
  output: "export",

  // Static export can't use Next.js Image Optimization API (no Node runtime).
  // Switching to unoptimized passes images through as-is from /public.
  images: { unoptimized: true },

  // Trailing slash on URLs avoids /thanks -> /thanks/ 404s when CF Pages serves directories.
  trailingSlash: true,
};

export default nextConfig;

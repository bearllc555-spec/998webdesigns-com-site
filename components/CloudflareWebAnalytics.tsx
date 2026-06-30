"use client";

import Script from "next/script";

/** Loads Cloudflare Web Analytics when NEXT_PUBLIC_CF_BEACON_TOKEN is set. */
export function CloudflareWebAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN?.trim();
  if (!token) return null;

  return (
    <Script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
      strategy="afterInteractive"
    />
  );
}

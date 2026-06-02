import type { NextRequest } from "next/server";

const PRODUCTION_ORIGINS = new Set([
  "https://998webdesigns.com",
  "https://www.998webdesigns.com",
]);

const LOCAL_ORIGIN_RE = /^http:\/\/localhost(:\d+)?$/;

function isVercelPreviewOrigin(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === "https:" && hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

/** Stripe success/cancel URLs — never trust arbitrary Origin headers. */
export function checkoutOrigin(req: NextRequest): string {
  const raw = req.headers.get("origin");
  if (!raw) return "https://998webdesigns.com";

  const origin = raw.replace(/\/$/, "");

  if (PRODUCTION_ORIGINS.has(origin)) return origin;

  if (process.env.VERCEL_ENV === "preview" && isVercelPreviewOrigin(origin)) {
    return origin;
  }

  if (process.env.NODE_ENV === "development" && LOCAL_ORIGIN_RE.test(origin)) {
    return origin;
  }

  return "https://998webdesigns.com";
}

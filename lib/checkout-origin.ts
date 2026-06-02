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

export type CheckoutOriginEnv = {
  VERCEL_ENV?: string;
  NODE_ENV?: string;
};

/** Pure resolver for tests and `checkoutOrigin`. */
export function resolveCheckoutOrigin(
  originHeader: string | null,
  env: CheckoutOriginEnv = process.env as CheckoutOriginEnv
): string {
  if (!originHeader) return "https://998webdesigns.com";

  const origin = originHeader.replace(/\/$/, "");

  if (PRODUCTION_ORIGINS.has(origin)) return origin;

  if (env.VERCEL_ENV === "preview" && isVercelPreviewOrigin(origin)) {
    return origin;
  }

  if (env.NODE_ENV === "development" && LOCAL_ORIGIN_RE.test(origin)) {
    return origin;
  }

  return "https://998webdesigns.com";
}

/** Stripe success/cancel URLs — never trust arbitrary Origin headers. */
export function checkoutOrigin(req: NextRequest): string {
  return resolveCheckoutOrigin(req.headers.get("origin"));
}

import type { NextRequest } from "next/server";
import { SITE_ORIGIN } from "@/lib/site-origin";

const PRODUCTION_ORIGINS = new Set([
  SITE_ORIGIN,
  "https://www.998webdesigns.com",
]);

const LOCAL_ORIGIN_RE = /^http:\/\/localhost(:\d+)?$/;

function isHostedPreviewOrigin(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin);
    return (
      protocol === "https:" &&
      (hostname.endsWith(".vercel.app") ||
        hostname.endsWith(".pages.dev") ||
        hostname.endsWith(".workers.dev"))
    );
  } catch {
    return false;
  }
}

function isPreviewDeployEnv(env: CheckoutOriginEnv): boolean {
  const custom = env.APP_ENV?.trim().toLowerCase();
  if (custom === "preview") return true;
  if (env.HOST_PLATFORM === "cloudflare-workers" && env.APP_ENV !== "production") {
    return true;
  }
  if (env.CF_PAGES === "1" && env.CF_PAGES_BRANCH?.trim() !== "main") return true;
  if (env.VERCEL_ENV === "preview") return true;
  return false;
}

export type CheckoutOriginEnv = {
  VERCEL_ENV?: string;
  CF_PAGES?: string;
  CF_PAGES_BRANCH?: string;
  HOST_PLATFORM?: string;
  APP_ENV?: string;
  NODE_ENV?: string;
};

/** Pure resolver for tests and `checkoutOrigin`. */
export function resolveCheckoutOrigin(
  originHeader: string | null,
  env: CheckoutOriginEnv = process.env as CheckoutOriginEnv
): string {
  if (!originHeader) return SITE_ORIGIN;

  const origin = originHeader.replace(/\/$/, "");

  if (PRODUCTION_ORIGINS.has(origin)) {
    if (origin === "https://www.998webdesigns.com") return SITE_ORIGIN;
    return origin;
  }

  if (isPreviewDeployEnv(env) && isHostedPreviewOrigin(origin)) {
    return origin;
  }

  if (env.NODE_ENV === "development" && LOCAL_ORIGIN_RE.test(origin)) {
    return origin;
  }

  return SITE_ORIGIN;
}

/** Stripe success/cancel URLs - never trust arbitrary Origin headers. */
export function checkoutOrigin(req: NextRequest): string {
  return resolveCheckoutOrigin(req.headers.get("origin"));
}

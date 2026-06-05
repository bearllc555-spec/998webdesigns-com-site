import type { NextRequest } from "next/server";
import { resolveCheckoutOrigin } from "@/lib/checkout-origin";

/** Canonical site origin for hosting portal links (same allowlist as Checkout). */
export function hostingPortalOrigin(req: NextRequest): string {
  return resolveCheckoutOrigin(req.headers.get("origin"));
}

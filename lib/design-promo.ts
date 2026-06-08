import {
  DESIGN_LIST_CENTS,
  DESIGN_PROMO_CODES,
  TEN_YEAR_HOSTING_LIST_CENTS,
  type DesignPromoEntry,
} from "@/lib/design-promo-codes";
import type { HostingChoice } from "@/lib/validate-lead";

export { DESIGN_PROMO_CODES, type DesignPromoEntry };

export type PromoContext = {
  hostingChoice?: HostingChoice;
  /** Skip expiry check (e.g. day-31 hosting bill for a code valid at signup). */
  ignoreExpiry?: boolean;
};

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

function isPromoExpired(entry: DesignPromoEntry, ignoreExpiry?: boolean): boolean {
  if (ignoreExpiry || !entry.expiresOn) return false;
  const end = new Date(`${entry.expiresOn}T23:59:59-04:00`);
  return Date.now() > end.getTime();
}

function promoMatchesContext(
  entry: DesignPromoEntry,
  context?: PromoContext
): boolean {
  if (entry.requiresTenYearHosting && context?.hostingChoice !== "ten_year") {
    return false;
  }
  return true;
}

export function findDesignPromoEntry(
  code: string | undefined | null
): DesignPromoEntry | null {
  if (!code?.trim()) return null;
  const normalized = normalizePromoCode(code);
  return DESIGN_PROMO_CODES.find((entry) => normalizePromoCode(entry.code) === normalized) ?? null;
}

export function resolveDesignPromo(
  code: string | undefined | null,
  context?: PromoContext
): DesignPromoEntry | null {
  const entry = findDesignPromoEntry(code);
  if (!entry) return null;
  if (isPromoExpired(entry, context?.ignoreExpiry)) return null;
  if (!promoMatchesContext(entry, context)) return null;
  return entry;
}

export function promoValidationError(
  code: string | undefined | null,
  hostingChoice?: HostingChoice
): string | null {
  const entry = findDesignPromoEntry(code);
  if (!entry) return null;
  if (isPromoExpired(entry)) {
    return `Promo code ${entry.code} expired June 30, 2026.`;
  }
  if (entry.requiresTenYearHosting && hostingChoice !== "ten_year") {
    return `${entry.code} requires 10-year hosting — select it on the form or use a different code.`;
  }
  return null;
}

export function isValidDesignPromoCode(
  code: string | undefined | null,
  context?: PromoContext
): boolean {
  return resolveDesignPromo(code, context) !== null;
}

/** Design fee in cents after promo. */
export function designFeeCents(
  promoCode?: string,
  hostingChoice?: HostingChoice,
  options?: { ignoreExpiry?: boolean }
): number {
  const promo = resolveDesignPromo(promoCode, {
    hostingChoice,
    ignoreExpiry: options?.ignoreExpiry,
  });
  if (!promo) return DESIGN_LIST_CENTS;
  if (promo.fixedDesignOffCents != null) {
    return Math.max(0, DESIGN_LIST_CENTS - promo.fixedDesignOffCents);
  }
  if (promo.percentOff != null) {
    return Math.round(DESIGN_LIST_CENTS * (1 - promo.percentOff / 100));
  }
  return DESIGN_LIST_CENTS;
}

/** 10-year hosting fee in cents after bundle promo (list $2,996). */
export function tenYearHostingFeeCents(
  promoCode?: string,
  options?: { ignoreExpiry?: boolean }
): number {
  const promo = resolveDesignPromo(promoCode, {
    hostingChoice: "ten_year",
    ignoreExpiry: options?.ignoreExpiry,
  });
  if (!promo?.fixedTenYearHostingOffCents) return TEN_YEAR_HOSTING_LIST_CENTS;
  return Math.max(0, TEN_YEAR_HOSTING_LIST_CENTS - promo.fixedTenYearHostingOffCents);
}

/** Design + 10-year hosting when a bundle promo applies; otherwise null. */
export function bundleTotalCents(
  promoCode?: string,
  hostingChoice?: HostingChoice
): number | null {
  const promo = resolveDesignPromo(promoCode, { hostingChoice });
  if (!promo?.requiresTenYearHosting || hostingChoice !== "ten_year") return null;
  return designFeeCents(promoCode, hostingChoice) + tenYearHostingFeeCents(promoCode);
}

export function designPromoSummary(
  code: string | undefined | null,
  hostingChoice?: HostingChoice
): string | null {
  const promo = resolveDesignPromo(code, { hostingChoice });
  if (!promo) return null;
  if (promo.percentOff != null) {
    return `${promo.percentOff}% off design fee only`;
  }
  if (promo.code === "LAUNCHPADJUNE26") {
    return "$2,000 off design fee — $3,998 design total (expires June 30)";
  }
  if (promo.code === "GROWTHSYSTEMJUNE26") {
    return "$2,996 off bundle — $3,998 design + $2,000 10-year hosting = $5,998 total (expires June 30)";
  }
  if (promo.fixedDesignOffCents != null) {
    return `$${(promo.fixedDesignOffCents / 100).toLocaleString()} off design fee`;
  }
  return null;
}

export function listedPromoCodes(): string[] {
  return DESIGN_PROMO_CODES.map((entry) => normalizePromoCode(entry.code));
}

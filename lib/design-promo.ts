import { DESIGN_PROMO_CODES, type DesignPromoEntry } from "@/lib/design-promo-codes";
import { FULL_PRODUCT } from "@/lib/products";

export { DESIGN_PROMO_CODES, type DesignPromoEntry };

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export function resolveDesignPromo(code: string | undefined | null): DesignPromoEntry | null {
  if (!code?.trim()) return null;
  const normalized = normalizePromoCode(code);
  return (
    DESIGN_PROMO_CODES.find((entry) => normalizePromoCode(entry.code) === normalized) ?? null
  );
}

export function isValidDesignPromoCode(code: string | undefined | null): boolean {
  return resolveDesignPromo(code) !== null;
}

/** Design fee in cents; promo applies only to this line item. */
export function designFeeCents(promoCode?: string): number {
  const base = FULL_PRODUCT.priceInCents;
  const promo = resolveDesignPromo(promoCode);
  if (!promo) return base;
  return Math.round(base * (1 - promo.percentOff / 100));
}

export function designPromoSummary(code: string | undefined | null): string | null {
  const promo = resolveDesignPromo(code);
  if (!promo) return null;
  return `${promo.percentOff}% off design fee only`;
}

export function listedPromoCodes(): string[] {
  return DESIGN_PROMO_CODES.map((entry) => normalizePromoCode(entry.code));
}

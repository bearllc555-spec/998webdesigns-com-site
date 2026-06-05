import { FULL_PRODUCT } from "@/lib/products";

/** Public promo code — 20% off design fee only (not hosting or card fee base). */
export const DESIGN_PROMO_CODE = "LAUNCH20";
export const DESIGN_PROMO_PERCENT_OFF = 20;

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export function expectedPromoCode(): string {
  const fromEnv = process.env.DESIGN_PROMO_CODE?.trim();
  return normalizePromoCode(fromEnv || DESIGN_PROMO_CODE);
}

export function isValidDesignPromoCode(code: string | undefined | null): boolean {
  if (!code?.trim()) return false;
  return normalizePromoCode(code) === expectedPromoCode();
}

/** Design fee in cents; promo applies only to this line item. */
export function designFeeCents(promoCode?: string): number {
  const base = FULL_PRODUCT.priceInCents;
  if (!isValidDesignPromoCode(promoCode)) return base;
  return Math.round(base * (1 - DESIGN_PROMO_PERCENT_OFF / 100));
}

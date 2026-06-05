/**
 * Design-fee promo codes — each applies only to the Website Design line item.
 * Add entries here; hosting and card-fee rules are unchanged.
 */
export type DesignPromoEntry = {
  code: string;
  /** Percent off list design fee ($5,998). */
  percentOff: number;
};

export const DESIGN_PROMO_CODES: DesignPromoEntry[] = [
  { code: "LINKEDIN20", percentOff: 20 },
];

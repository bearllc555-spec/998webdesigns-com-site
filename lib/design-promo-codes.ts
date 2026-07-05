/**
 * Promo codes - design fee and (when noted) 10-year hosting.
 * Percent codes apply to design only. Fixed codes use cents off list prices.
 */
export type DesignPromoEntry = {
  code: string;
  /** Percent off list design fee ($7,998). */
  percentOff?: number;
  /** Cents off list design fee ($7,998). */
  fixedDesignOffCents?: number;
  /** Only valid when lead selects 10-year hosting. */
  requiresTenYearHosting?: boolean;
  /** Cents off list 10-year hosting ($2,996) - bundle codes only. */
  fixedTenYearHostingOffCents?: number;
  /** Last valid calendar day (America/New_York), YYYY-MM-DD inclusive. */
  expiresOn?: string;
};

export const DESIGN_LIST_CENTS = 799_800;
export const TEN_YEAR_HOSTING_LIST_CENTS = 299_600;

export const DESIGN_PROMO_CODES: DesignPromoEntry[] = [
  { code: "LINKEDIN20", percentOff: 20 },
  { code: "VOICE20", percentOff: 20 },
  {
    code: "LAUNCHPADJUNE26",
    fixedDesignOffCents: 200_000,
    expiresOn: "2026-06-30",
  },
  {
    code: "GROWTHSYSTEMJUNE26",
    requiresTenYearHosting: true,
    fixedDesignOffCents: 200_000,
    fixedTenYearHostingOffCents: 99_600,
    expiresOn: "2026-06-30",
  },
];

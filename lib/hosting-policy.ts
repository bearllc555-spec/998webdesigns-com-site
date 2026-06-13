/** Free hosting period; paid hosting starts after this many days from payment cleared. */
export const HOSTING_TRIAL_DAYS = 90;

/** Calendar day hosting billing begins (day after the free period). */
export const HOSTING_BILLING_START_DAY = HOSTING_TRIAL_DAYS + 1;

/** Month-to-month hosting after trial (Stripe subscription Checkout `unit_amount`). */
export const HOSTING_MONTHLY_PRICE_DOLLARS = 98;
export const HOSTING_MONTHLY_PRICE_CENTS = HOSTING_MONTHLY_PRICE_DOLLARS * 100;
export const HOSTING_MONTHLY_PRICE_MO_LABEL = `$${HOSTING_MONTHLY_PRICE_DOLLARS}/mo`;
export const HOSTING_MONTHLY_PRICE_MONTH_LABEL = `$${HOSTING_MONTHLY_PRICE_DOLLARS}/month`;

export function hostingBillingStartsAt(paymentClearedAt: Date): Date {
  const start = new Date(paymentClearedAt);
  start.setUTCDate(start.getUTCDate() + HOSTING_TRIAL_DAYS);
  return start;
}

export const HOSTING_FREE_MONTH_SUMMARY =
  `Your first ${HOSTING_TRIAL_DAYS} days of hosting are free. Hosting billing starts ${HOSTING_TRIAL_DAYS} days after your design payment clears.`;

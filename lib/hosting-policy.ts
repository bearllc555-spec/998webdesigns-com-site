/** First month of hosting is free; paid hosting starts after this many days from payment cleared. */
export const HOSTING_TRIAL_DAYS = 30;

export function hostingBillingStartsAt(paymentClearedAt: Date): Date {
  const start = new Date(paymentClearedAt);
  start.setUTCDate(start.getUTCDate() + HOSTING_TRIAL_DAYS);
  return start;
}

export const HOSTING_FREE_MONTH_SUMMARY =
  "Your first 30 days of hosting are free. Hosting billing starts 30 days after your design payment clears.";

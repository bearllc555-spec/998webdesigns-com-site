/** wd_leads rows at or after cleared design deposit (or paid in full). */
const WD_LEAD_CLIENT_STATUSES = new Set([
  "deposit_paid",
  "milestone2_paid",
  "paid_in_full",
  "lifetime_hosting_active",
]);

export function isWdLeadClientStatus(status: string | null | undefined): boolean {
  return Boolean(status && WD_LEAD_CLIENT_STATUSES.has(status));
}

export function wdLeadCrmFeedSource(status: string | null | undefined): "lead" | "client" {
  return isWdLeadClientStatus(status) ? "client" : "lead";
}

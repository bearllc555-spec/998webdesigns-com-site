/** Admin auth for /crm and /api/crm/* — CRM_ADMIN_SECRET required in production. */
export function crmAdminSecret(): string | null {
  const dedicated = process.env.CRM_ADMIN_SECRET?.trim();
  if (dedicated) return dedicated;
  if (process.env.VERCEL_ENV === "production") return null;
  return process.env.BALANCE_CAPTURE_SECRET?.trim() ?? null;
}

export function crmAdminSecretSource(): "dedicated" | "balance_fallback" | "missing" {
  if (process.env.CRM_ADMIN_SECRET?.trim()) return "dedicated";
  if (process.env.VERCEL_ENV === "production") return "missing";
  if (process.env.BALANCE_CAPTURE_SECRET?.trim()) return "balance_fallback";
  return "missing";
}

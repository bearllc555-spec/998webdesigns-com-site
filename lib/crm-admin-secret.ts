/** Admin auth for /crm and /api/crm/* — set CRM_ADMIN_SECRET or reuse BALANCE_CAPTURE_SECRET. */
export function crmAdminSecret(): string | null {
  const dedicated = process.env.CRM_ADMIN_SECRET?.trim();
  if (dedicated) return dedicated;
  return process.env.BALANCE_CAPTURE_SECRET?.trim() ?? null;
}

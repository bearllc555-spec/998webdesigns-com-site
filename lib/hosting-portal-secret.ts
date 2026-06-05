/** HMAC secret for hosting portal magic links (reuses ops bearer). */
export function hostingPortalSecret(): string | null {
  return process.env.BALANCE_CAPTURE_SECRET?.trim() ?? null;
}

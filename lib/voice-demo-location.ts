/** CRM possible-location label from voice demo lead columns (legacy weather ZIP data). */
export function formatPossibleLocationLabel(
  city: string | null,
  state: string | null,
  zip: string | null
): string | null {
  const c = city?.trim();
  const s = state?.trim();
  const z = zip?.trim();
  if (!c || !s || !z) return null;
  return `${c}, ${s} ${z}`;
}

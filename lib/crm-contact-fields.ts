/** Progressive contact fields shown on CRM inbox cards (lead → booking → appointment). */
export type CrmContactFields = {
  cellPhone?: string | null;
  street?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

export function displayCrmContactValue(value: string | null | undefined): string {
  const t = value?.trim();
  return t ? t : "—";
}

export function assemblePlumbingServiceAddress(parts: CrmContactFields): string | null {
  const street = parts.street?.trim();
  const line2 = parts.line2?.trim();
  const city = parts.city?.trim();
  const state = parts.state?.trim();
  const zip = parts.zip?.trim();
  const line1 = [street, line2].filter(Boolean).join(", ");
  const locality = [city, state].filter(Boolean).join(", ");
  const tail = [locality, zip].filter(Boolean).join(" ");
  const chunks = [line1, tail].filter(Boolean);
  return chunks.length > 0 ? chunks.join(", ") : null;
}

export function crmContactFromPlumbingJob(
  phone: string | null | undefined,
  job: {
    service_street?: string | null;
    service_line2?: string | null;
    service_city?: string | null;
    service_state?: string | null;
    service_zip?: string | null;
    service_address?: string | null;
  } | null
): CrmContactFields {
  const street =
    job?.service_street?.trim() ||
    (job?.service_address?.trim() && !job?.service_city?.trim()
      ? job.service_address.trim()
      : null) ||
    null;
  return {
    cellPhone: phone?.trim() || null,
    street,
    line2: job?.service_line2?.trim() || null,
    city: job?.service_city?.trim() || null,
    state: job?.service_state?.trim() || null,
    zip: job?.service_zip?.trim() || null,
  };
}

export function crmContactFromVoiceDemoLead(row: {
  phone?: string | null;
  location_city?: string | null;
  location_state?: string | null;
  location_zip?: string | null;
}): CrmContactFields {
  return {
    cellPhone: row.phone?.trim() || null,
    city: row.location_city?.trim() || null,
    state: row.location_state?.trim() || null,
    zip: row.location_zip?.trim() || null,
  };
}

export function crmContactFromPayload(payload: Record<string, unknown> | null): CrmContactFields {
  if (!payload) return {};
  const str = (key: string) => {
    const v = payload[key];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  return {
    cellPhone: str("phone") ?? str("cellPhone"),
    street: str("street") ?? str("addressStreet"),
    line2: str("line2") ?? str("addressLine2"),
    city: str("city") ?? str("addressCity"),
    state: str("state") ?? str("addressState"),
    zip: str("zip") ?? str("addressZip"),
  };
}

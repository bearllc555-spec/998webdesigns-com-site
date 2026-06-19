const INSTANTLY_API_BASE = "https://api.instantly.ai/api/v2";

export type InstantlyLeadInput = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  linkedinUrl?: string | null;
  customVariables?: Record<string, string>;
};

export type InstantlyEnrollResult =
  | { ok: true; leadId: string | null; skipped: boolean; reason?: string }
  | { ok: false; error: string; status?: number };

function instantlyApiKey(): string | null {
  return process.env.INSTANTLY_API_KEY?.trim() || null;
}

export function instantlyCampaignId(): string | null {
  return process.env.INSTANTLY_CAMPAIGN_ID?.trim() || null;
}

export function instantlyConfigured(): boolean {
  return Boolean(instantlyApiKey() && instantlyCampaignId());
}

/** Add or update a lead in an Instantly campaign (API v2). */
export async function enrollLeadInInstantlyCampaign(
  input: InstantlyLeadInput
): Promise<InstantlyEnrollResult> {
  const apiKey = instantlyApiKey();
  const campaignId = instantlyCampaignId();

  if (!apiKey || !campaignId) {
    return {
      ok: false,
      error: "INSTANTLY_API_KEY or INSTANTLY_CAMPAIGN_ID not configured",
    };
  }

  const body: Record<string, unknown> = {
    campaign_id: campaignId,
    email: input.email.trim().toLowerCase(),
  };

  if (input.firstName) body.first_name = input.firstName;
  if (input.lastName) body.last_name = input.lastName;
  if (input.companyName) body.company_name = input.companyName;

  const custom: Record<string, string> = { ...(input.customVariables ?? {}) };
  if (input.linkedinUrl) custom.linkedin_url = input.linkedinUrl;
  if (Object.keys(custom).length) body.custom_variables = custom;

  try {
    const res = await fetch(`${INSTANTLY_API_BASE}/leads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let json: Record<string, unknown> | null = null;
    try {
      json = text ? (JSON.parse(text) as Record<string, unknown>) : null;
    } catch {
      json = null;
    }

    if (res.status === 409 || res.status === 422) {
      return {
        ok: true,
        leadId: typeof json?.id === "string" ? json.id : null,
        skipped: true,
        reason: typeof json?.message === "string" ? json.message : "already in campaign",
      };
    }

    if (!res.ok) {
      const msg =
        (typeof json?.message === "string" && json.message) ||
        (typeof json?.error === "string" && json.error) ||
        text.slice(0, 300) ||
        res.statusText;
      return { ok: false, error: msg, status: res.status };
    }

    const leadId =
      typeof json?.id === "string"
        ? json.id
        : typeof json?.lead_id === "string"
          ? json.lead_id
          : null;

    return { ok: true, leadId, skipped: false };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Map Instantly webhook event_type to linkedin_prospects status. */
export function instantlyEventToProspectStatus(eventType: string): string | null {
  switch (eventType) {
    case "reply_received":
    case "lead_interested":
      return "instantly_replied";
    case "lead_meeting_booked":
    case "lead_meeting_completed":
      return "meeting_booked";
    case "email_bounced":
      return "bounced";
    case "lead_unsubscribed":
      return "opted_out";
    case "lead_not_interested":
      return "not_interested";
    case "lead_closed":
      return "closed";
    default:
      return null;
  }
}

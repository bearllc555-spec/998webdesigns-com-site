import { notifyCrmActivity } from "@/lib/crm-notify";
import {
  enrollLeadInInstantlyCampaign,
  instantlyCampaignId,
  instantlyConfigured,
  instantlyEventToProspectStatus,
} from "@/lib/instantly";
import { supabaseAdmin } from "@/lib/supabase";

export type LinkedinProspectStatus =
  | "email_captured"
  | "instantly_enrolled"
  | "instantly_replied"
  | "meeting_booked"
  | "bounced"
  | "opted_out"
  | "not_interested"
  | "closed";

export type LinkedinProspectSyncInput = {
  openoutreachLeadId: number;
  openoutreachDealId?: number | null;
  publicIdentifier: string;
  linkedinUrl: string;
  email: string;
  emailSource?: string;
  emailCapturedAt?: string | null;
  emailCaptureSnippet?: string | null;
  fullName?: string | null;
  companyName?: string | null;
  linkedinState?: string | null;
  campaignName?: string | null;
  chatSummary?: Record<string, unknown> | null;
  profileSummary?: Record<string, unknown> | null;
};

export type LinkedinProspectRow = {
  id: string;
  created_at: string;
  updated_at: string;
  openoutreach_lead_id: number;
  openoutreach_deal_id: number | null;
  public_identifier: string;
  linkedin_url: string;
  full_name: string | null;
  company_name: string | null;
  email: string;
  email_source: string;
  email_captured_at: string | null;
  email_capture_snippet: string | null;
  linkedin_state: string | null;
  campaign_name: string | null;
  status: string;
  instantly_lead_id: string | null;
  instantly_campaign_id: string | null;
  instantly_enrolled_at: string | null;
  instantly_last_event_at: string | null;
  instantly_last_event_type: string | null;
  crm_notes: string | null;
  chat_summary: Record<string, unknown> | null;
  profile_summary: Record<string, unknown> | null;
  read_at: string | null;
  inbox_flag: string | null;
};

function splitName(fullName: string | null | undefined): {
  firstName: string | null;
  lastName: string | null;
} {
  if (!fullName?.trim()) return { firstName: null, lastName: null };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export async function upsertLinkedinProspect(
  input: LinkedinProspectSyncInput
): Promise<
  | { ok: true; row: LinkedinProspectRow; created: boolean; enrolled: boolean }
  | { ok: false; reason: string }
> {
  const supa = supabaseAdmin();
  if (!supa) {
    return { ok: false, reason: "Supabase not configured" };
  }

  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, reason: "Invalid email" };
  }

  const now = new Date().toISOString();
  const { data: existing } = await supa
    .from("linkedin_prospects")
    .select("*")
    .eq("openoutreach_lead_id", input.openoutreachLeadId)
    .maybeSingle();

  const payload = {
    openoutreach_lead_id: input.openoutreachLeadId,
    openoutreach_deal_id: input.openoutreachDealId ?? null,
    public_identifier: input.publicIdentifier,
    linkedin_url: input.linkedinUrl,
    full_name: input.fullName ?? null,
    company_name: input.companyName ?? null,
    email,
    email_source: input.emailSource ?? "chat_message",
    email_captured_at: input.emailCapturedAt ?? now,
    email_capture_snippet: input.emailCaptureSnippet ?? null,
    linkedin_state: input.linkedinState ?? null,
    campaign_name: input.campaignName ?? null,
    chat_summary: input.chatSummary ?? null,
    profile_summary: input.profileSummary ?? null,
    updated_at: now,
  };

  let row: LinkedinProspectRow;
  let created = false;

  if (existing) {
    const { data, error } = await supa
      .from("linkedin_prospects")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) {
      return { ok: false, reason: error?.message ?? "Update failed" };
    }
    row = data as LinkedinProspectRow;
  } else {
    const { data, error } = await supa
      .from("linkedin_prospects")
      .insert({ ...payload, status: "email_captured" })
      .select("*")
      .single();
    if (error || !data) {
      return { ok: false, reason: error?.message ?? "Insert failed" };
    }
    row = data as LinkedinProspectRow;
    created = true;

    void notifyCrmActivity({
      kind: "linkedin_email_captured",
      fullName: row.full_name ?? undefined,
      email: row.email,
      businessName: row.company_name ?? undefined,
      status: row.status,
      message: row.email_capture_snippet ?? undefined,
    });
  }

  const enrolled = await maybeEnrollInInstantly(row);
  if (enrolled.ok && enrolled.row) {
    row = enrolled.row;
  }

  return { ok: true, row, created, enrolled: enrolled.enrolled };
}

async function maybeEnrollInInstantly(
  row: LinkedinProspectRow
): Promise<{ ok: boolean; row?: LinkedinProspectRow; enrolled: boolean }> {
  if (!instantlyConfigured()) {
    return { ok: true, enrolled: false };
  }

  if (
    row.status !== "email_captured" ||
    row.instantly_enrolled_at ||
    row.instantly_lead_id
  ) {
    return { ok: true, enrolled: false };
  }

  const { firstName, lastName } = splitName(row.full_name);
  const result = await enrollLeadInInstantlyCampaign({
    email: row.email,
    firstName,
    lastName,
    companyName: row.company_name,
    linkedinUrl: row.linkedin_url,
    customVariables: {
      public_identifier: row.public_identifier,
      openoutreach_lead_id: String(row.openoutreach_lead_id),
    },
  });

  const supa = supabaseAdmin();
  if (!supa) return { ok: false, enrolled: false };

  const now = new Date().toISOString();

  if (!result.ok) {
    console.warn("[linkedin-prospect] Instantly enroll failed:", result.error);
    await supa
      .from("linkedin_prospects")
      .update({
        crm_notes: `Instantly enroll failed: ${result.error}`,
        updated_at: now,
      })
      .eq("id", row.id);
    return { ok: true, enrolled: false };
  }

  const { data, error } = await supa
    .from("linkedin_prospects")
    .update({
      status: "instantly_enrolled",
      instantly_lead_id: result.leadId,
      instantly_campaign_id: instantlyCampaignId(),
      instantly_enrolled_at: now,
      updated_at: now,
      crm_notes: result.skipped ? `Instantly: ${result.reason ?? "existing lead"}` : null,
    })
    .eq("id", row.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, enrolled: false };
  }

  void notifyCrmActivity({
    kind: "linkedin_instantly_enrolled",
    fullName: row.full_name ?? undefined,
    email: row.email,
    businessName: row.company_name ?? undefined,
    status: "instantly_enrolled",
  });

  return { ok: true, row: data as LinkedinProspectRow, enrolled: !result.skipped };
}

export async function applyInstantlyWebhookEvent(input: {
  eventType: string;
  email?: string | null;
  leadId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<{ ok: boolean; updated: boolean; detail?: string }> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, updated: false, detail: "Supabase not configured" };

  const email =
    input.email?.trim().toLowerCase() ||
    (typeof input.payload?.email === "string"
      ? input.payload.email.trim().toLowerCase()
      : null) ||
    (typeof input.payload?.lead_email === "string"
      ? input.payload.lead_email.trim().toLowerCase()
      : null);

  let query = supa.from("linkedin_prospects").select("*").limit(1);

  if (input.leadId) {
    query = query.eq("instantly_lead_id", input.leadId);
  } else if (email) {
    query = query.eq("email", email);
  } else {
    return { ok: false, updated: false, detail: "No email or lead id in webhook" };
  }

  const { data: row, error: fetchErr } = await query.maybeSingle();
  if (fetchErr || !row) {
    return { ok: true, updated: false, detail: "No matching linkedin_prospect" };
  }

  const nextStatus = instantlyEventToProspectStatus(input.eventType);
  const now = new Date().toISOString();

  const update: Record<string, unknown> = {
    instantly_last_event_at: now,
    instantly_last_event_type: input.eventType,
    updated_at: now,
  };
  if (nextStatus) update.status = nextStatus;

  const replyText =
    typeof input.payload?.reply_text === "string"
      ? input.payload.reply_text
      : typeof input.payload?.body === "string"
        ? input.payload.body
        : null;
  if (replyText) {
    update.crm_notes = replyText.slice(0, 2000);
  }

  const { error } = await supa.from("linkedin_prospects").update(update).eq("id", row.id);
  if (error) {
    return { ok: false, updated: false, detail: error.message };
  }

  if (nextStatus === "instantly_replied" || nextStatus === "meeting_booked") {
    void notifyCrmActivity({
      kind:
        nextStatus === "meeting_booked"
          ? "linkedin_meeting_booked"
          : "linkedin_instantly_replied",
      fullName: row.full_name ?? undefined,
      email: row.email,
      businessName: row.company_name ?? undefined,
      status: nextStatus,
      message: replyText ?? undefined,
    });
  }

  return { ok: true, updated: true };
}

export async function deleteLinkedinProspect(id: string): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;
  const { error } = await supa.from("linkedin_prospects").delete().eq("id", id);
  if (error) {
    console.warn("[linkedin-prospect] delete failed:", error.message);
    return false;
  }
  return true;
}

export async function enrollPendingLinkedinProspects(limit = 25): Promise<{
  processed: number;
  enrolled: number;
  errors: string[];
}> {
  const supa = supabaseAdmin();
  if (!supa || !instantlyConfigured()) {
    return { processed: 0, enrolled: 0, errors: [] };
  }

  const { data, error } = await supa
    .from("linkedin_prospects")
    .select("*")
    .eq("status", "email_captured")
    .is("instantly_enrolled_at", null)
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error || !data?.length) {
    return { processed: 0, enrolled: 0, errors: error ? [error.message] : [] };
  }

  let enrolled = 0;
  const errors: string[] = [];

  for (const row of data as LinkedinProspectRow[]) {
    const result = await maybeEnrollInInstantly(row);
    if (result.enrolled) enrolled += 1;
    if (!result.ok) errors.push(`lead ${row.openoutreach_lead_id}: enroll failed`);
  }

  return { processed: data.length, enrolled, errors };
}

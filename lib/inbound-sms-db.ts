import { supabaseAdmin } from "@/lib/supabase";
import { discoveryProspectIdsForWdLead } from "@/lib/inbound-sms-links";

export type InboundSmsRow = {
  id: string;
  created_at: string;
  from_phone: string;
  body: string;
  twilio_message_sid: string;
  discovery_prospect_id: string | null;
  wd_lead_id: string | null;
  read_at: string | null;
  inbox_flag: string | null;
};

export type InsertInboundSmsInput = {
  from_phone: string;
  body: string;
  twilio_message_sid: string;
  discovery_prospect_id: string | null;
  wd_lead_id: string | null;
};

export async function insertInboundSms(
  input: InsertInboundSmsInput
): Promise<{ ok: true; id: string } | { ok: false; reason: string; detail?: string }> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, reason: "supabase_missing" };

  const { data, error } = await supa
    .from("inbound_sms")
    .insert({
      ...input,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, reason: "duplicate", detail: error.message };
    }
    return { ok: false, reason: "insert_failed", detail: error.message };
  }

  return { ok: true, id: data.id as string };
}

function mergeSmsRows(rows: InboundSmsRow[]): InboundSmsRow[] {
  const byId = new Map<string, InboundSmsRow>();
  for (const row of rows) {
    byId.set(row.id, row);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export async function listInboundSmsForProspect(
  prospectId: string,
  limit = 40
): Promise<InboundSmsRow[]> {
  const supa = supabaseAdmin();
  if (!supa) return [];

  const { data, error } = await supa
    .from("inbound_sms")
    .select("*")
    .eq("discovery_prospect_id", prospectId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as InboundSmsRow[];
}

export async function listInboundSmsForWdLeadProfile(
  leadId: string,
  options?: { discoveryProspectId?: string | null },
  limit = 60
): Promise<InboundSmsRow[]> {
  const supa = supabaseAdmin();
  if (!supa) return [];

  const prospectIds = new Set(await discoveryProspectIdsForWdLead(leadId));
  if (options?.discoveryProspectId) {
    prospectIds.add(options.discoveryProspectId);
  }

  const [byLead, byProspects] = await Promise.all([
    supa
      .from("inbound_sms")
      .select("*")
      .eq("wd_lead_id", leadId)
      .order("created_at", { ascending: true })
      .limit(limit),
    prospectIds.size
      ? supa
          .from("inbound_sms")
          .select("*")
          .in("discovery_prospect_id", [...prospectIds])
          .order("created_at", { ascending: true })
          .limit(limit)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (byLead.error) return [];
  const rows = [...((byLead.data ?? []) as InboundSmsRow[])];
  if (!byProspects.error && byProspects.data) {
    rows.push(...(byProspects.data as InboundSmsRow[]));
  }
  return mergeSmsRows(rows).slice(-limit);
}

export async function deleteInboundSms(id: string): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;
  const { error } = await supa.from("inbound_sms").delete().eq("id", id);
  return !error;
}

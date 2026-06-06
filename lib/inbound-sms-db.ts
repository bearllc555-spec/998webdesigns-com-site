import { supabaseAdmin } from "@/lib/supabase";

export type InboundSmsRow = {
  id: string;
  created_at: string;
  from_phone: string;
  body: string;
  twilio_message_sid: string;
  discovery_prospect_id: string | null;
  read_at: string | null;
  inbox_flag: string | null;
};

export type InsertInboundSmsInput = {
  from_phone: string;
  body: string;
  twilio_message_sid: string;
  discovery_prospect_id: string | null;
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

export async function deleteInboundSms(id: string): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;
  const { error } = await supa.from("inbound_sms").delete().eq("id", id);
  return !error;
}

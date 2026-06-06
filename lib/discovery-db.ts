import { supabaseAdmin } from "@/lib/supabase";
import type {
  DiscoveryCloseDraft,
  DiscoveryIntake,
  DiscoveryProspectRow,
  DiscoveryStatus,
} from "@/lib/discovery-types";

export type InsertDiscoveryProspectInput = {
  full_name: string;
  email: string;
  phone: string;
  goal: string | null;
  sms_consent_at: string;
  ip: string | null;
};

export async function insertDiscoveryProspect(
  input: InsertDiscoveryProspectInput
): Promise<{ ok: true; id: string } | { ok: false; reason: string; detail?: string }> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, reason: "supabase_missing" };

  const now = new Date().toISOString();
  const { data, error } = await supa
    .from("discovery_prospects")
    .insert({
      ...input,
      status: "started",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, reason: "insert_failed", detail: error.message };
  }

  return { ok: true, id: data.id as string };
}

export async function getDiscoveryProspect(
  id: string
): Promise<DiscoveryProspectRow | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const { data, error } = await supa
    .from("discovery_prospects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as DiscoveryProspectRow;
}

export async function findDiscoveryProspectByPhone(
  phoneE164: string
): Promise<DiscoveryProspectRow | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const { data, error } = await supa
    .from("discovery_prospects")
    .select("*")
    .eq("phone", phoneE164)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as DiscoveryProspectRow;
}

export async function markDiscoveryProspectUnread(id: string): Promise<boolean> {
  return updateDiscoveryProspect(id, { read_at: null });
}

export async function updateDiscoveryProspect(
  id: string,
  patch: Record<string, unknown>
): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;

  const { error } = await supa
    .from("discovery_prospects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);

  return !error;
}

export async function markDiscoveryPhoneVerified(id: string): Promise<boolean> {
  const now = new Date().toISOString();
  return updateDiscoveryProspect(id, {
    phone_verified_at: now,
    status: "phone_verified",
  });
}

export async function markDiscoveryEmailVerified(id: string): Promise<boolean> {
  const row = await getDiscoveryProspect(id);
  if (!row) return false;
  const status: DiscoveryStatus =
    row.status === "started" || row.status === "phone_verified"
      ? "email_verified"
      : row.status;
  return updateDiscoveryProspect(id, {
    email_verified_at: new Date().toISOString(),
    status,
  });
}

export async function saveDiscoveryIntake(
  id: string,
  intake: DiscoveryIntake
): Promise<boolean> {
  return updateDiscoveryProspect(id, {
    intake,
    intake_submitted_at: new Date().toISOString(),
    status: "intake_complete",
  });
}

export async function saveDiscoveryCloseDraft(
  id: string,
  closeDraft: DiscoveryCloseDraft
): Promise<boolean> {
  return updateDiscoveryProspect(id, {
    close_draft: closeDraft,
    close_sent_at: new Date().toISOString(),
    status: "close_sent",
  });
}

export async function linkDiscoveryWdLead(id: string, wdLeadId: string): Promise<boolean> {
  return updateDiscoveryProspect(id, { wd_lead_id: wdLeadId, status: "paid" });
}

export async function updateDiscoveryProspectCrmNotes(
  id: string,
  crmNotes: string | null
): Promise<boolean> {
  return updateDiscoveryProspect(id, { crm_notes: crmNotes });
}

export async function deleteDiscoveryProspect(id: string): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;
  const { error } = await supa.from("discovery_prospects").delete().eq("id", id);
  return !error;
}

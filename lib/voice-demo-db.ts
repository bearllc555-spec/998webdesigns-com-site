import { supabaseAdmin } from "@/lib/supabase";
import { hashVerificationCode, verificationExpiresAt } from "@/lib/voice-demo-otp";

export type VoiceDemoChannel = "email" | "sms";

export type VoiceDemoLeadRow = {
  id: string;
  created_at: string;
  updated_at: string;
  primary_channel: VoiceDemoChannel;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  verification_code_hash: string | null;
  verification_expires_at: string | null;
  verification_attempts: number;
  promo_sent_at: string | null;
  promo_code: string | null;
  secondary_declined_at: string | null;
  session_summary: string | null;
  ip: string | null;
  read_at: string | null;
  inbox_flag: string | null;
};

export type InsertVoiceDemoLeadInput = {
  primary_channel: VoiceDemoChannel;
  email: string | null;
  phone: string | null;
  ip: string | null;
  verification_code: string;
};

export async function insertVoiceDemoLead(
  input: InsertVoiceDemoLeadInput
): Promise<{ ok: true; id: string } | { ok: false; reason: string; detail?: string }> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, reason: "supabase_missing" };

  const now = new Date().toISOString();
  const { data, error } = await supa
    .from("voice_demo_leads")
    .insert({
      primary_channel: input.primary_channel,
      email: input.email,
      phone: input.phone,
      ip: input.ip,
      verification_code_hash: hashVerificationCode(input.verification_code),
      verification_expires_at: verificationExpiresAt(),
      verification_attempts: 0,
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

export async function getVoiceDemoLead(id: string): Promise<VoiceDemoLeadRow | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const { data, error } = await supa
    .from("voice_demo_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as VoiceDemoLeadRow;
}

export async function incrementVoiceDemoVerifyAttempts(id: string): Promise<number | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const row = await getVoiceDemoLead(id);
  if (!row) return null;

  const next = (row.verification_attempts ?? 0) + 1;
  const { error } = await supa
    .from("voice_demo_leads")
    .update({ verification_attempts: next, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return null;
  return next;
}

export async function markVoiceDemoVerified(
  id: string,
  channel: VoiceDemoChannel
): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    updated_at: now,
    verification_code_hash: null,
    verification_expires_at: null,
  };

  if (channel === "email") {
    patch.email_verified_at = now;
  } else {
    patch.phone_verified_at = now;
  }

  const { error } = await supa.from("voice_demo_leads").update(patch).eq("id", id);
  return !error;
}

export async function updateVoiceDemoLead(
  id: string,
  patch: Partial<
    Pick<
      VoiceDemoLeadRow,
      | "full_name"
      | "email"
      | "phone"
      | "email_verified_at"
      | "phone_verified_at"
      | "promo_sent_at"
      | "promo_code"
      | "secondary_declined_at"
      | "session_summary"
    >
  >
): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;

  const { error } = await supa
    .from("voice_demo_leads")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);

  return !error;
}

export async function deleteVoiceDemoLead(id: string): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;
  const { error } = await supa.from("voice_demo_leads").delete().eq("id", id);
  return !error;
}

export async function promoAlreadySentForContact(
  email: string | null,
  phone: string | null
): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;

  if (email) {
    const { data } = await supa
      .from("voice_demo_leads")
      .select("id")
      .eq("email", email.toLowerCase())
      .not("promo_sent_at", "is", null)
      .limit(1)
      .maybeSingle();
    if (data) return true;
  }

  if (phone) {
    const { data } = await supa
      .from("voice_demo_leads")
      .select("id")
      .eq("phone", phone)
      .not("promo_sent_at", "is", null)
      .limit(1)
      .maybeSingle();
    if (data) return true;
  }

  return false;
}

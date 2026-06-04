import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";

export type WdLeadInsert = {
  payload: Record<string, unknown>;
  email: string;
  business_name: string;
  full_name: string;
  submitted_at: string;
  ip: string | null;
};

export type WdLeadPatch = {
  status?: string;
  stripe_customer_id?: string | null;
  /** Checkout session id (deposit or pay-in-full). */
  stripe_deposit_invoice_id?: string | null;
  /** Balance-hold PaymentIntent id (deposit path only). */
  stripe_balance_invoice_id?: string | null;
  /** Month-to-month hosting subscription id (when applicable). */
  stripe_subscription_id?: string | null;
};

export type WdLeadInsertResult =
  | { ok: true; id?: string }
  | { ok: false; reason: "not_configured" | "table_missing" | "insert_failed"; detail: string };

export async function insertWdLead(row: WdLeadInsert): Promise<WdLeadInsertResult> {
  const supa = supabaseAdmin();
  if (!supa) {
    return {
      ok: false,
      reason: "not_configured",
      detail: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  try {
    return await insertWithClient(supa, row);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[leads] Supabase client error:", detail);
    return { ok: false, reason: "insert_failed", detail };
  }
}

export async function updateWdLead(
  leadId: string,
  patch: WdLeadPatch
): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;

  const { error } = await supa.from("wd_leads").update(patch).eq("id", leadId);
  if (error) {
    console.warn("[leads] wd_leads update failed:", error.message);
    return false;
  }
  return true;
}

/** Latest row for this email (most recent submit). */
export async function updateLatestWdLeadByEmail(
  email: string,
  patch: WdLeadPatch
): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;

  const { data, error: selectError } = await supa
    .from("wd_leads")
    .select("id")
    .eq("email", email)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError || !data?.id) {
    if (selectError) console.warn("[leads] wd_leads lookup failed:", selectError.message);
    return false;
  }

  return updateWdLead(data.id, patch);
}

export async function countWdLeadsByEmail(email: string): Promise<number> {
  const supa = supabaseAdmin();
  if (!supa) return 0;

  const { count, error } = await supa
    .from("wd_leads")
    .select("id", { count: "exact", head: true })
    .eq("email", email);

  if (error) {
    console.warn("[leads] wd_leads count by email failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function findWdLeadForCapture(params: {
  email?: string;
  depositSessionId?: string;
  leadId?: string;
}): Promise<{
  id: string;
  email: string;
  status: string;
  stripe_balance_invoice_id: string | null;
} | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  if (params.leadId) {
    const { data, error } = await supa
      .from("wd_leads")
      .select("id, email, status, stripe_balance_invoice_id")
      .eq("id", params.leadId)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  }

  if (params.depositSessionId) {
    const { data, error } = await supa
      .from("wd_leads")
      .select("id, email, status, stripe_balance_invoice_id")
      .eq("stripe_deposit_invoice_id", params.depositSessionId)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  }

  if (params.email) {
    const { data, error } = await supa
      .from("wd_leads")
      .select("id, email, status, stripe_balance_invoice_id")
      .eq("email", params.email)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  }

  return null;
}

async function insertWithClient(
  supa: SupabaseClient,
  row: WdLeadInsert
): Promise<WdLeadInsertResult> {
  const { data, error } = await supa
    .from("wd_leads")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    if (isMissingWdLeadsTable(error)) {
      console.error(
        "[leads] wd_leads table missing — run supabase/schema.sql in the Supabase SQL editor (project jxthwtflrzudepxysgje)"
      );
      return {
        ok: false,
        reason: "table_missing",
        detail: error.message,
      };
    }
    console.warn("[leads] wd_leads insert failed:", error.message, error.code);
    return { ok: false, reason: "insert_failed", detail: error.message };
  }

  return { ok: true, id: data?.id };
}

function isMissingWdLeadsTable(error: { code?: string; message?: string }): boolean {
  const code = error.code ?? "";
  const msg = error.message ?? "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    /wd_leads/i.test(msg) ||
    /schema cache/i.test(msg)
  );
}

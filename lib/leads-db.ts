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
